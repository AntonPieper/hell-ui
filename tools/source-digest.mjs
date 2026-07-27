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
    // Dot-directories hold build and test caches, not sources. `.angular/cache`
    // in particular carries a Vitest results file that every `test:unit` run
    // rewrites, which made "build docs, run unit tests, run e2e" refuse with
    // "rebuild the docs" on an unchanged tree.
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const path = join(folder, entry.name);
    if (entry.isDirectory()) collectSourceFiles(path, matches, collected);
    else if (matches(entry.name)) collected.push(path);
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

function toPosixPath(path) {
  return path.split(sep).join('/');
}
