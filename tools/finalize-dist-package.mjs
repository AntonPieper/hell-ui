import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { LIBRARY_BUILD_CONFIGURATIONS, writeLibraryBuildStamp } from './library-build-stamp.mjs';

const sourcePackageCondition = '@heinrich/source';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const distRootArg = process.argv[2];
const configuration = parseConfiguration(process.argv.slice(3));
if (!distRootArg || !configuration) {
  console.error(
    `Usage: node tools/finalize-dist-package.mjs <dist-package-root> --configuration <${LIBRARY_BUILD_CONFIGURATIONS.join('|')}>`,
  );
  process.exit(1);
}

const packageJsonPath = resolve(process.cwd(), distRootArg, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

packageJson.exports = finalizeExports(packageJson.exports);

const remainingSourcePaths = sourceExportPaths(packageJson.exports);
if (remainingSourcePaths.length > 0) {
  console.error(
    `Dist package exports must not point at source files: ${remainingSourcePaths.join(', ')}`,
  );
  process.exit(1);
}

writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

// Last step of the build, so the stamp exists only for a build that ran to
// completion. Gates that consume the prepared `dist` verify it before reading
// a single declaration.
writeLibraryBuildStamp({ root, configuration });

function parseConfiguration(args) {
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== '--configuration') continue;
    const value = args[index + 1];
    return LIBRARY_BUILD_CONFIGURATIONS.includes(value) ? value : null;
  }
  return null;
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
