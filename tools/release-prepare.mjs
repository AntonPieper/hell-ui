#!/usr/bin/env node
// `pnpm release:prepare [version]` — the maintainer-facing Release
// Preparation command (ADR 0003).
//
// Without an argument it selects the next version automatically from the
// pending Change Fragments (Breaking/Added → minor, otherwise patch, pre-1.0
// only). An explicit version records a deliberate prerelease or
// release-management decision. The transaction only generates local
// artifacts; committing, tagging, pushing, and publishing stay explicit
// maintainer actions.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareRelease } from './release-preparation.mjs';
import { packageManifestPath, resolveChangieBinary } from './release-changelog.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

if (args.length > 1 || args[0]?.startsWith('-')) {
  console.error('Usage: pnpm release:prepare [version]');
  console.error('Automatic selection uses the pending Change Fragments; pass one explicit SemVer');
  console.error('version for prereleases and deliberate release-management decisions.');
  process.exit(2);
}

const result = prepareRelease({
  root,
  changieBinary: resolveChangieBinary(root),
  explicitVersion: args[0] ?? null,
});

if (result.failures.length > 0) {
  console.error('Release preparation failed:');
  for (const failure of result.failures) console.error(`- ${failure}`);
  if (result.mutated) {
    console.error(
      'The partially generated candidate was left in place for inspection; nothing was rolled back. ' +
        'Review `git status`, then discard it explicitly with `git restore` / `git clean` before retrying.',
    );
  }
  process.exit(1);
}

console.log(`Release preparation ok: candidate ${result.version}.`);
console.log(`- .changes/${result.version}.md records the consumed pending fragments.`);
console.log(`- ${packageManifestPath} now carries version ${result.version}.`);
console.log('- CHANGELOG.md was regenerated from the committed records and reproduces byte-for-byte.');
console.log('Next steps (explicit, never automated): review the candidate, run `pnpm release:dry-run`,');
console.log('commit the candidate on a release-preparation pull request, and after merge tag the');
console.log(`release commit with v${result.version} to trigger publication (docs/release/release-preparation.md).`);
