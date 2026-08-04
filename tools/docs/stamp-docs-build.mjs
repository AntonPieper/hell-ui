import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { writeDocsBuildStamp } from './docs-build-stamp.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const distRootArg = process.argv[2];
if (!distRootArg) {
  console.error('Usage: node tools/docs/stamp-docs-build.mjs <docs-dist-root>');
  process.exit(1);
}

const distRoot = resolve(process.cwd(), distRootArg);
if (!existsSync(distRoot)) {
  console.error(`Docs build output missing: ${distRoot}. Run \`pnpm run build:docs\` first.`);
  process.exit(1);
}

console.log(`[docs-build] stamped ${writeDocsBuildStamp({ root, distRoot })}`);
