// Shared readers for the pnpm workspace and lockfile version maps.
//
// pnpm-workspace.yaml holds the catalog ranges and overrides the repository
// develops against; the `catalogs:` snapshot in pnpm-lock.yaml records the
// exact version each catalog range resolved to — the tested version the
// consumer-fixture contract pins to.
//
// Every value is returned raw and uninterpreted. This module deliberately
// knows nothing about pnpm's internal version encodings (for example the
// peer-dependency suffix in `22.0.5(chokidar@5.0.0)`): decoding one would
// couple this repository to a storage format pnpm owns and may change.
// Callers that need an exact version validate at the point of use and fail
// loudly on anything else.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function readWorkspaceCatalog() {
  return workspaceStringMap('catalog');
}

export function readWorkspaceOverrides() {
  return workspaceStringMap('overrides');
}

// The snapshot groups entries by named catalog; they flatten into one map. A
// package two catalogs resolve to different versions has no single tested
// version, so that fails instead of silently letting one catalog win.
export function readLockCatalogVersions() {
  const lockPath = join(root, 'pnpm-lock.yaml');
  const catalogs = parse(readFileSync(lockPath, 'utf8'))?.catalogs ?? {};

  const map = {};
  for (const [catalogName, entries] of Object.entries(catalogs)) {
    for (const [name, entry] of Object.entries(entries ?? {})) {
      const version = requireString(lockPath, `catalogs ${catalogName} ${name} version`, entry?.version);
      if (name in map && map[name] !== version) {
        throw new Error(
          `pnpm-lock.yaml catalogs record conflicting versions for ${name}: ${map[name]} and ${version}`,
        );
      }
      map[name] = version;
    }
  }
  return map;
}

function workspaceStringMap(sectionName) {
  const workspacePath = join(root, 'pnpm-workspace.yaml');
  const section = parse(readFileSync(workspacePath, 'utf8'))?.[sectionName] ?? {};

  const map = {};
  for (const [name, value] of Object.entries(section)) {
    map[name] = requireString(workspacePath, `${sectionName} ${name}`, value);
  }
  return map;
}

// An unquoted YAML scalar like `1.2` parses as a number and would corrupt on
// round-trip (`22.10` becomes `22.1`), so non-strings fail instead of being
// coerced.
function requireString(file, label, value) {
  if (typeof value === 'string') return value;
  throw new Error(`${file}: ${label} must be a YAML string, found ${JSON.stringify(value)}`);
}
