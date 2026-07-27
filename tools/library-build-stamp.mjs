import assert from 'node:assert/strict';
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
 * output digest below assume it. `finalize-dist-package.mjs` accepts a
 * `<dist-package-root>` argument, which reads as though a second package could
 * be stamped; it cannot, and this rejects that call rather than silently
 * stamping the wrong tree.
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

/** Bump when the digest inputs change so old stamps are rejected, not trusted. */
const STAMP_VERSION = 2;

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
    join(root, 'tools/build-library.mjs'),
    join(root, 'tools/finalize-dist-package.mjs'),
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

export function writeLibraryBuildStamp({ root, configuration, distRoot, sourceDigestBeforeBuild }) {
  if (distRoot !== undefined) assertIsTheLibraryDistRoot(root, distRoot);
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
 * array means `dist/hell` was produced by the requested configuration from
 * exactly these sources.
 */
export function describeStaleLibraryBuild({ root, expectedConfiguration = 'production' }) {
  return classifyLibraryBuildStamp({
    stamp: readLibraryBuildStamp(root),
    expectedConfiguration,
    currentDigest: computeDeclarationInputsDigest(root),
    currentOutputDigest: computeOutputDigest(root),
  });
}

function classifyLibraryBuildStamp({
  stamp,
  expectedConfiguration,
  currentDigest,
  currentOutputDigest,
}) {
  const rebuild =
    expectedConfiguration === 'production'
      ? 'Run `pnpm run build:lib`.'
      : `Run \`pnpm --filter hell-ui run build:${expectedConfiguration}\`.`;

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

/** Self-check with synthetic stamps; runs before the real gate. */
export function checkLibraryBuildStampFixture() {
  const current = {
    expectedConfiguration: 'production',
    currentDigest: 'digest-a',
    currentOutputDigest: 'output-a',
  };
  const fresh = {
    version: STAMP_VERSION,
    configuration: 'production',
    declarationInputsDigest: 'digest-a',
    outputDigest: 'output-a',
  };

  assert.deepEqual(
    classifyLibraryBuildStamp({ ...current, stamp: fresh }),
    [],
    'a stamp matching the configuration and the working tree must pass',
  );

  const cases = [
    [null, /no build stamp/, 'an unstamped dist must fail'],
    [{ ...fresh, version: STAMP_VERSION + 1 }, /stamp format/, 'an unknown stamp format must fail'],
    [{ ...fresh, configuration: 'development' }, /'development'/, 'another configuration must fail'],
    [
      { ...fresh, declarationInputsDigest: 'digest-b' },
      /different library sources/,
      'other sources must fail',
    ],
    // Matching sources with different output is the watch-overwrite case: the
    // build started from this tree, then something else rewrote dist.
    [
      { ...fresh, outputDigest: 'output-b' },
      /has changed since the build that stamped it/,
      'a rewritten dist must fail even when its sources match',
    ],
  ];
  for (const [stamp, expected, message] of cases) {
    const failures = classifyLibraryBuildStamp({ ...current, stamp });
    assert.equal(failures.length, 1, message);
    assert.match(failures[0], expected, message);
    assert.match(failures[0], /pnpm run build:lib/, 'every failure must name the fix');
  }

  // The digest must describe content, not the moment of the build, or two
  // builds of one tree would disagree.
  assert.deepEqual(
    classifyLibraryBuildStamp({ ...current, stamp: { ...fresh, builtAt: 'much later' } }),
    [],
    'the build timestamp must not affect staleness',
  );
}
