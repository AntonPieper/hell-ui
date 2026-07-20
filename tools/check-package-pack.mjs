import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import { auditPackedPackage } from './package-pack-audit.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const packageDistRoots = [join(root, 'dist/hell')];
// With --pack-destination <dir>, the audited tarball is packed into that
// directory and kept, so callers (for example CI) can publish the exact
// tarball this audit approved. Without it, packing stays in a temp dir.
const packDestination = parsePackDestination(process.argv.slice(2));

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
    if (!packedPackage.keep) rmSync(packedPackage.root, { force: true, recursive: true });
  }

  if (packedPackage.keep) {
    console.log(`[package-pack-audit] audited tarball kept at ${packedPackage.tarball}`);
  }
}

function parsePackDestination(args) {
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--pack-destination') {
      const next = args[i + 1];
      if (!next || next.startsWith('--')) fail('--pack-destination requires a directory path');
      return next;
    }
    if (arg.startsWith('--pack-destination=')) {
      const value = arg.slice('--pack-destination='.length);
      if (!value) fail('--pack-destination requires a directory path');
      return value;
    }
  }
  return null;
}

function preparePackRoot() {
  if (!packDestination) {
    return { path: mkdtempSync(join(tmpdir(), 'hell-package-pack-audit-')), keep: false };
  }

  const destination = isAbsolute(packDestination) ? packDestination : join(root, packDestination);
  mkdirSync(destination, { recursive: true });
  for (const entry of readdirSync(destination)) {
    if (!entry.endsWith('.tgz')) continue;
    console.log(`[package-pack-audit] removing stale tarball ${join(destination, entry)}`);
    rmSync(join(destination, entry), { force: true });
  }
  return { path: destination, keep: true };
}

function packBuiltPackage(distRoot) {
  const packRoot = preparePackRoot();
  const result = spawnSync('pnpm', ['pack', '--pack-destination', packRoot.path, '--json'], {
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

  return {
    root: packRoot.path,
    keep: packRoot.keep,
    tarball: isAbsolute(filename) ? filename : join(packRoot.path, filename),
  };
}

function fail(message) {
  console.error(`[package-pack-audit] ${message}`);
  process.exit(1);
}
