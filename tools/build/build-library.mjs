import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { finalizeDistPackage } from './finalize-dist-package.mjs';
import {
  LIBRARY_BUILD_CONFIGURATIONS,
  captureLibrarySourceDigest,
} from './library-build-stamp.mjs';

/**
 * Builds the library and stamps it, with the source digest taken *before*
 * ng-packagr reads anything.
 *
 * Doing this in one process is the point. The stamp is written after the build,
 * so a digest taken only then records whatever the tree looks like at that
 * moment — including an edit made while the compiler was running, or another
 * build writing the same directory. The result is a stamp asserting that these
 * sources produced these declarations for a pair that never met, which the gate
 * then recomputes and accepts. Capturing first and comparing after turns that
 * into a refusal.
 */
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const configuration = LIBRARY_BUILD_CONFIGURATIONS.includes(process.argv[2])
  ? process.argv[2]
  : 'production';

const sourceDigest = captureLibrarySourceDigest({ root });

// Both configurations are passed explicitly. Production was previously implied
// by `angular.json`'s `defaultConfiguration`, which meant the stamp recorded
// "production" on the strength of a default it never read — and a change to
// that default would have silently restamped every build under a name that no
// longer matched its compiler options. The stamp asserts what was built, so the
// build must state it.
const build = spawnSync(
  'pnpm',
  ['exec', 'ng', 'build', 'hell', '--configuration', configuration],
  { cwd: join(root, 'packages/angular'), stdio: 'inherit', shell: process.platform === 'win32' },
);
if (build.status !== 0) process.exit(build.status ?? 1);

finalizeDistPackage({
  root,
  distRoot: join(root, 'dist/hell'),
  configuration,
  sourceDigestBeforeBuild: sourceDigest,
});
