import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { writeLibraryBuildStamp } from './library-build-stamp.mjs';

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
