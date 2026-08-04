import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { collectSourceFiles, digestSourceFiles } from './source-digest.mjs';

/**
 * Build provenance for the published library.
 *
 * `pnpm run build:lib` deletes and rewrites `dist/hell` on every run, but
 * nothing else does: a `pnpm run watch` session leaves an incrementally patched
 * `dist` behind, an interrupted build leaves a partial one, and switching
 * branches leaves one that belongs to different sources. Gates that consume a
 * prepared `dist` (`test:api-report`, and anything else that reads the built
 * declarations) cannot tell those apart from a fresh build by looking at the
 * files, so they silently measure the wrong artifact and report drift that no
 * source change caused.
 *
 * The stamp closes that gap: the build records which configuration produced
 * `dist/hell` and a digest of the sources that decided the emitted
 * declarations, and consumers refuse to run against anything else.
 */

/**
 * Written beside `dist/hell` rather than inside it: the package folder is
 * packed verbatim by `test:package-pack`, and build bookkeeping is not part of
 * the published package.
 */
const LIBRARY_BUILD_STAMP_PATH = 'dist/hell.build.json';

/**
 * There is exactly one library package, and both the stamp path above and the
 * output digest below assume it. `finalizeDistPackage` takes a `distRoot`, which
 * reads as though a second package could be stamped; it cannot, so it calls this
 * first and refuses any other root before touching that package.
 */
export function assertIsTheLibraryDistRoot(root, distRoot) {
  const expected = join(root, LIBRARY_DIST_ROOT);
  if (resolve(distRoot) !== expected) {
    throw new Error(
      `The build stamp only describes ${LIBRARY_DIST_ROOT}, but ${distRoot} was finalized. ` +
        'Teach library-build-stamp.mjs about the new package before stamping it.',
    );
  }
}

/**
 * Bump when the digest inputs change so old stamps are rejected, not trusted.
 * Exported so `library-build-stamp.spec.mjs` builds synthetic stamps at the
 * current format instead of hard-coding a number that drifts.
 */
export const STAMP_VERSION = 2;

const LIBRARY_DIST_ROOT = 'dist/hell';

export const LIBRARY_BUILD_CONFIGURATIONS = ['production', 'development'];

/**
 * Sources that decide the emitted `.d.ts` files. Over-inclusion only costs a
 * rebuild; under-inclusion would let a stale `dist` pass as current.
 *
 * `.html` templates reach declaration emit through `NgContentSelectors`, and
 * `hell-entrypoint.json` decides which entrypoints exist at all, so both count
 * even though neither is TypeScript. Spec files, stylesheets, assets and
 * installed packages cannot reach it.
 */
function declarationInputPaths(root) {
  return [
    join(root, 'pnpm-lock.yaml'),
    join(root, 'tsconfig.base.json'),
    join(root, 'packages/angular/tsconfig.lib.json'),
    join(root, 'packages/angular/tsconfig.lib.prod.json'),
    join(root, 'packages/angular/angular.json'),
    join(root, 'packages/angular/package.json'),
    // The build recipe itself. `build-library.mjs` selects the compiler
    // configuration and `finalize-dist-package.mjs` decides the guarded
    // package.json the report reads, so changing either changes the artifact
    // exactly as a source change does — and leaving the orchestrator out meant
    // altering the compiler flags produced a stamp, a source digest and an
    // output digest that all still matched the previous recipe.
    join(root, 'tools/build/build-library.mjs'),
    join(root, 'tools/build/finalize-dist-package.mjs'),
    ...collectSourceFiles(
      join(root, 'packages/angular'),
      (name) =>
        name === 'ng-package.json' ||
        name === 'hell-entrypoint.json' ||
        name.endsWith('.html') ||
        (name.endsWith('.ts') && !name.endsWith('.spec.ts')),
    ),
  ];
}

/**
 * The built artifact itself. Matching sources prove the build was *started*
 * from this tree; they say nothing about what happened to `dist/hell`
 * afterwards. A `pnpm run watch` session overwriting it, a hand-edited
 * declaration, a build killed halfway, or two builds interleaving into one
 * directory all leave the source digest intact and the output different.
 */
function outputPaths(root) {
  const dist = join(root, LIBRARY_DIST_ROOT);
  return [
    join(dist, 'package.json'),
    ...collectSourceFiles(join(dist, 'types'), (name) => name.endsWith('.d.ts')),
  ];
}

/** Content digest of every declaration input, independent of build order or timestamps. */
function computeDeclarationInputsDigest(root) {
  return digestSourceFiles(root, declarationInputPaths(root));
}

function computeOutputDigest(root) {
  return digestSourceFiles(root, outputPaths(root));
}

/**
 * Records the sources as they were *before* the compiler read them.
 *
 * The stamp is written after the build, so hashing only then would record
 * whatever the tree looks like at that moment — including an edit made while
 * ng-packagr was running. That produces a stamp saying "these sources produced
 * these declarations" for a pair that never met, and the gate recomputes the
 * same hashes and agrees. Comparing a digest taken before the build with one
 * taken after turns that into a refusal.
 */
export function captureLibrarySourceDigest({ root }) {
  return computeDeclarationInputsDigest(root);
}

export function writeLibraryBuildStamp({ root, configuration, sourceDigestBeforeBuild }) {
  if (!LIBRARY_BUILD_CONFIGURATIONS.includes(configuration)) {
    throw new Error(
      `Unknown library build configuration '${configuration}'. Expected one of: ${LIBRARY_BUILD_CONFIGURATIONS.join(', ')}.`,
    );
  }

  const afterBuild = computeDeclarationInputsDigest(root);
  if (sourceDigestBeforeBuild !== undefined && sourceDigestBeforeBuild !== afterBuild) {
    throw new Error(
      'Library sources changed while the build was running, so the output does not correspond ' +
        'to any single state of the tree. Nothing was stamped; re-run `pnpm run build:lib` with ' +
        'the tree settled.',
    );
  }

  const stampPath = join(root, LIBRARY_BUILD_STAMP_PATH);
  mkdirSync(dirname(stampPath), { recursive: true });
  const stamp = {
    version: STAMP_VERSION,
    configuration,
    // Informational only: never part of the digest, so two builds of the same
    // sources stay comparable.
    builtAt: new Date().toISOString(),
    declarationInputsDigest: afterBuild,
    outputDigest: computeOutputDigest(root),
  };
  writeFileSync(stampPath, `${JSON.stringify(stamp, null, 2)}\n`);
  return stampPath;
}

function readLibraryBuildStamp(root) {
  const stampPath = join(root, LIBRARY_BUILD_STAMP_PATH);
  if (!existsSync(stampPath)) return null;
  try {
    return JSON.parse(readFileSync(stampPath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Reasons the built library cannot stand in for the working tree, phrased so a
 * reader fixes the build instead of chasing a phantom API change. An empty
 * array means `dist/hell` was produced by the production build from exactly
 * these sources.
 *
 * Only the production build is described. `packages/angular`'s
 * `build:development` script stamps a development `dist/hell`, and the gates
 * that read the prepared declarations measure the published configuration — so
 * a development build is reported as the configuration mismatch it is, not
 * accepted by asking for it.
 */
export function describeStaleLibraryBuild({ root }) {
  return classifyLibraryBuildStamp({
    stamp: readLibraryBuildStamp(root),
    expectedConfiguration: 'production',
    currentDigest: computeDeclarationInputsDigest(root),
    currentOutputDigest: computeOutputDigest(root),
  });
}

/**
 * The staleness decision itself, over values rather than the filesystem, so
 * `library-build-stamp.spec.mjs` reaches every branch with synthetic stamps
 * instead of arranging a real interrupted build.
 */
export function classifyLibraryBuildStamp({
  stamp,
  expectedConfiguration,
  currentDigest,
  currentOutputDigest,
}) {
  const rebuild = 'Run `pnpm run build:lib`.';

  if (!stamp) {
    return [
      `no build stamp at ${LIBRARY_BUILD_STAMP_PATH}, so dist/hell did not come from a completed library build (\`pnpm run watch\` and interrupted builds never write one). ${rebuild}`,
    ];
  }
  if (stamp.version !== STAMP_VERSION) {
    return [`build stamp ${LIBRARY_BUILD_STAMP_PATH} predates the current stamp format. ${rebuild}`];
  }
  if (stamp.configuration !== expectedConfiguration) {
    return [
      `dist/hell was built with the '${stamp.configuration}' configuration, but this check describes the '${expectedConfiguration}' build. ${rebuild}`,
    ];
  }
  if (stamp.declarationInputsDigest !== currentDigest) {
    return [
      `dist/hell was built from different library sources than the working tree, so its declarations describe other code. ${rebuild}`,
    ];
  }
  if (stamp.outputDigest !== currentOutputDigest) {
    return [
      `dist/hell has changed since the build that stamped it — a \`pnpm run watch\` session, an interrupted build, a hand edit, or two builds writing the same directory all do this. Its sources match, but its declarations are no longer the ones that were stamped. ${rebuild}`,
    ];
  }
  return [];
}
