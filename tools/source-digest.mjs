import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Content fingerprints for "was this artifact built from these sources?".
 *
 * Build outputs carry no evidence of what produced them, so any gate that reads
 * a prepared `dist` can silently measure a build from another branch, an
 * interrupted build, or a build served from a different checkout entirely. A
 * digest recorded at build time and recomputed at read time turns that from a
 * wrong answer into a clear error.
 */

/**
 * Every file under `folder` that `matches`, skipping installed packages.
 *
 * Used for build outputs as well as sources — the library stamp enumerates
 * `dist/hell/types` through this — so the filter is the caller's whole
 * contract; nothing here assumes the tree is source.
 */
export function collectSourceFiles(folder, matches, collected = []) {
  if (!existsSync(folder)) return collected;
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) {
      // Dot-*directories* hold build and test caches. `.angular/cache` carries
      // a Vitest results file that every `test:unit` run rewrites, which made
      // "build docs, run unit tests, run e2e" refuse an unchanged tree.
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      if (entry.name.startsWith('.')) continue;
      collectSourceFiles(path, matches, collected);
      continue;
    }
    // Dot-*files* are configuration, and configuration builds the artifact.
    // Skipping them cost `.postcssrc.json`, the only place
    // `@tailwindcss/postcss` is registered: emptying it drops the docs
    // stylesheet from 237kB to 132kB — the site renders unstyled — while the
    // digest stayed byte-identical. Whatever this excludes, it must be a
    // decision about that file, not a side effect of its name.
    if (matches(entry.name)) collected.push(path);
  }
  return collected;
}

/**
 * Order-independent digest of the given files, keyed by repo-relative path so
 * the same tree digests the same from any checkout location.
 */
export function digestSourceFiles(root, filePaths) {
  const digest = createHash('sha256');
  for (const path of [...filePaths].sort()) {
    if (!existsSync(path)) continue;
    const fileDigest = createHash('sha256').update(readFileSync(path)).digest('hex');
    digest.update(`${toPosixPath(relative(root, path))}\0${fileDigest}\n`);
  }
  return digest.digest('hex');
}

export function toPosixPath(path) {
  return path.split(sep).join('/');
}
