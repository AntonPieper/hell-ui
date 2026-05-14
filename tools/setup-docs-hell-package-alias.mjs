import { existsSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const distPath = resolve(root, 'dist/hell');
const aliasPath = resolve(root, 'projects/hell-docs/node_modules/@hell-ui/angular');

if (!existsSync(distPath)) {
  console.error(`[docs-package-alias] Missing built package at ${distPath}. Run build:lib first.`);
  process.exit(1);
}

mkdirSync(dirname(aliasPath), { recursive: true });
rmSync(aliasPath, { force: true, recursive: true });
symlinkSync(distPath, aliasPath, 'dir');
