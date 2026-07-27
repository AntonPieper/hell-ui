import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

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

/** Bump when the digest inputs change so old stamps are rejected, not trusted. */
const STAMP_VERSION = 1;

export const LIBRARY_BUILD_CONFIGURATIONS = ['production', 'development'];

/**
 * Sources that decide the emitted `.d.ts` files. Over-inclusion only costs a
 * rebuild; under-inclusion would let a stale `dist` pass as current, so files
 * are excluded only when they cannot reach declaration emit at all
 * (`*.spec.ts`, stylesheets, assets, installed packages).
 */
function declarationInputPaths(root) {
  return [
    join(root, 'pnpm-lock.yaml'),
    join(root, 'tsconfig.base.json'),
    join(root, 'packages/angular/tsconfig.lib.json'),
    join(root, 'packages/angular/tsconfig.lib.prod.json'),
    join(root, 'packages/angular/angular.json'),
    join(root, 'packages/angular/package.json'),
    ...collectSourceFiles(
      join(root, 'packages/angular'),
      (name) =>
        name === 'ng-package.json' || (name.endsWith('.ts') && !name.endsWith('.spec.ts')),
    ),
  ];
}

/** Content digest of every declaration input, independent of build order or timestamps. */
function computeDeclarationInputsDigest(root) {
  return digestSourceFiles(root, declarationInputPaths(root));
}

export function writeLibraryBuildStamp({ root, configuration }) {
  if (!LIBRARY_BUILD_CONFIGURATIONS.includes(configuration)) {
    throw new Error(
      `Unknown library build configuration '${configuration}'. Expected one of: ${LIBRARY_BUILD_CONFIGURATIONS.join(', ')}.`,
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
    declarationInputsDigest: computeDeclarationInputsDigest(root),
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
  });
}

function classifyLibraryBuildStamp({ stamp, expectedConfiguration, currentDigest }) {
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
  return [];
}

/** Self-check with synthetic stamps; runs before the real gate. */
export function checkLibraryBuildStampFixture() {
  const current = { expectedConfiguration: 'production', currentDigest: 'digest-a' };
  const fresh = {
    version: STAMP_VERSION,
    configuration: 'production',
    declarationInputsDigest: 'digest-a',
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
