import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  entrypointPublicApiFiles,
  libraryRoot,
  renderDefaultStyleBundleFile,
  renderNgPackageFile,
  renderPackageJsonFile,
  renderPublicApiFile,
  secondaryPackageEntrypoints,
} from './entrypoint-manifest.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const stale = [];
let changed = 0;

for (const entrypoint of entrypointPublicApiFiles()) {
  writeOrCheck(entrypoint.publicApiPath, renderPublicApiFile(entrypoint));
}

for (const entrypoint of secondaryPackageEntrypoints()) {
  writeOrCheck(entrypoint.packagePath, renderNgPackageFile(entrypoint));
}

writeOrCheck(`${libraryRoot}/styles.css`, renderDefaultStyleBundleFile());

const angularPackageJsonPath = `${libraryRoot}/package.json`;
writeOrCheck(
  angularPackageJsonPath,
  renderPackageJsonFile(JSON.parse(readFileSync(join(root, angularPackageJsonPath), 'utf8'))),
);

if (stale.length) {
  console.error(`Entrypoint generated files are stale:\n${stale.map((path) => `- ${path}`).join('\n')}`);
  process.exitCode = 1;
} else if (checkOnly) {
  console.log('Entrypoint generated files are current.');
} else {
  console.log(`Entrypoint generated files updated (${changed} changed).`);
}

function writeOrCheck(relativePath, expected) {
  const path = join(root, relativePath);
  const actual = existsSync(path) ? readFileSync(path, 'utf8') : null;
  if (actual === expected) return;

  if (checkOnly) {
    stale.push(relativePath);
    return;
  }

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, expected);
  changed += 1;
}
