import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  auditPackedPackage,
  findForbiddenPackedFileFailures,
} from './package-pack-audit.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distHell = join(root, 'dist/hell');

if (!existsSync(join(distHell, 'package.json'))) {
  fail(`Built package missing: ${distHell}. Run npm run build:lib first.`);
}

runForbiddenFileAuditSelfTest();

const packedHell = packBuiltPackage(distHell);
try {
  auditPackedPackage({ distRoot: distHell, tarball: packedHell.tarball });
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  rmSync(packedHell.root, { force: true, recursive: true });
}

function runForbiddenFileAuditSelfTest() {
  const fixtures = [
    ['source map', ['fesm2022/hell-ui-angular.mjs.map']],
    ['secret-bearing file', ['.env.production']],
    ['test artifact or test source', ['src/button.spec.ts']],
    ['generated docs package alias', ['projects/hell-docs/node_modules/@hell-ui/angular/package.json']],
    ['unexpected worker asset', ['assets/pdf.worker.min.mjs']],
  ];

  for (const [label, files] of fixtures) {
    const failures = findForbiddenPackedFileFailures(['package.json', ...files]);
    if (!failures.some((failure) => failure.includes(label))) {
      fail(`Forbidden-file self-test did not catch ${label}: ${files.join(', ')}`);
    }
  }
}

function packBuiltPackage(distRoot) {
  const packRoot = mkdtempSync(join(tmpdir(), 'hell-package-pack-audit-'));
  const result = spawnSync('npm', ['pack', '--pack-destination', packRoot, '--json'], {
    cwd: distRoot,
    shell: process.platform === 'win32',
    encoding: 'utf8',
  });

  if (result.error) fail(`Unable to run npm pack: ${result.error.message}`);
  if (result.status !== 0) fail(`npm pack failed:\n${result.stderr || result.stdout}`);

  let packResult;
  try {
    packResult = JSON.parse(result.stdout);
  } catch (error) {
    fail(`npm pack returned invalid JSON:\n${result.stdout}\n${error instanceof Error ? error.message : String(error)}`);
  }

  const filename = packResult?.[0]?.filename;
  if (!filename) fail('npm pack did not report a tarball filename');

  return { root: packRoot, tarball: join(packRoot, filename) };
}

function fail(message) {
  console.error(`[package-pack-audit] ${message}`);
  process.exit(1);
}
