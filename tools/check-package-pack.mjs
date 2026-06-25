import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  auditPackedPackage,
  findForbiddenPackedFileFailures,
  findPackageBoundaryFailures,
} from './package-pack-audit.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const packageDistRoots = [join(root, 'dist/hell'), join(root, 'dist/hell-pdf-viewer')];

for (const distRoot of packageDistRoots) {
  if (!existsSync(join(distRoot, 'package.json'))) {
    fail(`Built package missing: ${distRoot}. Run pnpm run build:lib first.`);
  }
}

runForbiddenFileAuditSelfTest();

for (const distRoot of packageDistRoots) {
  const packedPackage = packBuiltPackage(distRoot);
  try {
    auditPackedPackage({ distRoot, tarball: packedPackage.tarball });
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  } finally {
    rmSync(packedPackage.root, { force: true, recursive: true });
  }
}

function runForbiddenFileAuditSelfTest() {
  const fixtures = [
    ['source map', ['fesm2022/hell-ui-angular.mjs.map']],
    ['secret-bearing file', ['.env.production']],
    ['test artifact or test source', ['src/button.spec.ts']],
    ['workspace node_modules leak', ['apps/docs/node_modules/@hell-ui/angular/package.json']],
    ['unexpected worker asset', ['assets/pdf.worker.min.mjs']],
  ];

  for (const [label, files] of fixtures) {
    const failures = findForbiddenPackedFileFailures(['package.json', ...files]);
    if (!failures.some((failure) => failure.includes(label))) {
      fail(`Forbidden-file self-test did not catch ${label}: ${files.join(', ')}`);
    }
  }

  const pdfLeakFailures = findPackageBoundaryFailures(
    { name: '@hell-ui/angular', exports: {}, peerDependencies: {}, peerDependenciesMeta: {} },
    ['package.json', 'styles/features/pdf-viewer.css'],
  );
  if (!pdfLeakFailures.some((failure) => failure.includes('split PDF viewer files'))) {
    fail('Forbidden-file self-test did not catch split PDF viewer files: styles/features/pdf-viewer.css');
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
