import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertIsTheLibraryDistRoot, writeLibraryBuildStamp } from './library-build-stamp.mjs';

const sourcePackageCondition = '@heinrich/source';

/**
 * Strips the source-resolution conditions from the built package manifest and
 * stamps the result.
 *
 * Called in-process by `tools/build-library.mjs` rather than as a separate
 * command, because the stamp needs a source digest captured *before* the
 * compiler ran, and only the process that ordered the build has one.
 */
export function finalizeDistPackage({ root, distRoot, configuration, sourceDigestBeforeBuild }) {
  // Checked before anything is written. The stamp writer rejects a dist root it
  // cannot describe, but it ran after the manifest had already been rewritten —
  // so passing the wrong root mutated that package and only then threw.
  assertIsTheLibraryDistRoot(root, distRoot);

  const packageJsonPath = join(distRoot, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

  packageJson.exports = finalizeExports(packageJson.exports);

  const remainingSourcePaths = sourceExportPaths(packageJson.exports);
  if (remainingSourcePaths.length > 0) {
    throw new Error(
      `Dist package exports must not point at source files: ${remainingSourcePaths.join(', ')}`,
    );
  }

  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

  // Last step of the build, so the stamp exists only for a build that ran to
  // completion. Gates that consume the prepared `dist` verify it before reading
  // a single declaration.
  writeLibraryBuildStamp({
    root,
    configuration,
    distRoot: resolve(distRoot),
    sourceDigestBeforeBuild,
  });
}

// `node tools/finalize-dist-package.mjs dist/hell` was a supported command
// before this became a module, and it now has no top-level work to do. Left
// alone it would exit zero having finalised and stamped nothing — a silent
// no-op for anyone outside this repo still calling it. Refuse instead, and say
// where the work moved: a correct run needs a source digest taken before the
// compiler started, which only the process that ordered the build can have.
if (process.argv[1] && basename(process.argv[1]) === basename(fileURLToPath(import.meta.url))) {
  console.error(
    'finalize-dist-package.mjs is no longer a command. Run `pnpm run build:lib`, which builds ' +
      'and finalizes in one process so the build stamp can record the sources as they were ' +
      'before the compiler read them.',
  );
  process.exit(1);
}

function finalizeExports(exportsMap) {
  if (!exportsMap || typeof exportsMap !== 'object' || Array.isArray(exportsMap)) {
    return exportsMap;
  }

  return Object.fromEntries(
    Object.entries(exportsMap).map(([exportPath, exportValue]) => [
      exportPath,
      finalizeExportValue(exportValue),
    ]),
  );
}

function finalizeExportValue(exportValue) {
  if (!exportValue || typeof exportValue !== 'object' || Array.isArray(exportValue)) {
    return exportValue;
  }

  const finalized = {};
  for (const [condition, value] of Object.entries(exportValue)) {
    if (condition === sourcePackageCondition) continue;
    finalized[condition] = value;
  }
  return finalized;
}

function sourceExportPaths(exportsMap) {
  const paths = [];
  visit(exportsMap);
  return paths;

  function visit(value) {
    if (typeof value === 'string') {
      if (value.startsWith('./src/')) paths.push(value);
      return;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    for (const nestedValue of Object.values(value)) visit(nestedValue);
  }
}
