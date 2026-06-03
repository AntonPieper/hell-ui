import { existsSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = process.cwd();
const packageAliases = [
  {
    distPath: resolve(root, 'dist/hell'),
    aliasPaths: [
      resolve(root, 'node_modules/@hell-ui/angular'),
      resolve(root, 'projects/hell-docs/node_modules/@hell-ui/angular'),
    ],
  },
  {
    distPath: resolve(root, 'dist/hell-pdf-viewer'),
    aliasPaths: [
      resolve(root, 'node_modules/@hell-ui/pdf-viewer'),
      resolve(root, 'projects/hell-docs/node_modules/@hell-ui/pdf-viewer'),
    ],
  },
];

for (const { distPath, aliasPaths } of packageAliases) {
  if (!existsSync(distPath)) {
    console.error(`[docs-package-alias] Missing built package at ${distPath}. Run build:lib first.`);
    process.exit(1);
  }

  for (const aliasPath of aliasPaths) {
    mkdirSync(dirname(aliasPath), { recursive: true });
    rmSync(aliasPath, { force: true, recursive: true });
    symlinkSync(distPath, aliasPath, 'dir');
  }
}
