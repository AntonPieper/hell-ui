import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import { auditPackedPackage } from './package-pack-audit.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const packageDistRoots = [join(root, 'dist/hell')];

for (const distRoot of packageDistRoots) {
  if (!existsSync(join(distRoot, 'package.json'))) {
    fail(`Built package missing: ${distRoot}. Run pnpm run build:lib first.`);
  }
}

for (const distRoot of packageDistRoots) {
  const packedPackage = packBuiltPackage(distRoot);
  try {
    auditPackedPackage({ tarball: packedPackage.tarball });
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  } finally {
    rmSync(packedPackage.root, { force: true, recursive: true });
  }
}

function packBuiltPackage(distRoot) {
  const packRoot = mkdtempSync(join(tmpdir(), 'hell-package-pack-audit-'));
  const result = spawnSync('pnpm', ['pack', '--pack-destination', packRoot, '--json'], {
    cwd: distRoot,
    shell: process.platform === 'win32',
    encoding: 'utf8',
  });

  if (result.error) fail(`Unable to run pnpm pack: ${result.error.message}`);
  if (result.status !== 0) fail(`pnpm pack failed:\n${result.stderr || result.stdout}`);

  let packResult;
  try {
    packResult = JSON.parse(result.stdout);
  } catch (error) {
    fail(`pnpm pack returned invalid JSON:\n${result.stdout}\n${error instanceof Error ? error.message : String(error)}`);
  }

  const filename = Array.isArray(packResult) ? packResult[0]?.filename : packResult?.filename;
  if (!filename) fail('pnpm pack did not report a tarball filename');

  return { root: packRoot, tarball: isAbsolute(filename) ? filename : join(packRoot, filename) };
}

function fail(message) {
  console.error(`[package-pack-audit] ${message}`);
  process.exit(1);
}
