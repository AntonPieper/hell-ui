import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sourcePackageCondition = '@heinrich/source';

const distRootArg = process.argv[2];
if (!distRootArg) {
  console.error('Usage: node tools/finalize-dist-package.mjs <dist-package-root>');
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
