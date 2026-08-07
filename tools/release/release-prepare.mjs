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

import { realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareRelease } from './release-preparation.mjs';
import { packageManifestPath, resolveChangieBinary } from './release-changelog.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Splits this command's argv into the one version it may be given and anything
// it cannot make sense of. `pnpm release:prepare -- 1.2.3` is the spelling a
// maintainer arrives at for a command that takes a positional — it is what the
// sibling `pnpm restore:release -- <tag>` needs, and it is the habit pnpm's own
// documentation teaches. pnpm forwards that `--` into argv rather than
// consuming it, so the separator has to be dropped here or it counts as a
// second argument and the usage check refuses a correct invocation. Even the
// bare `pnpm release:prepare --` refused, because a lone `--` starts with a
// dash.
//
// Dropping the separator is not the same as ignoring extra arguments. This
// command takes no flags, so anything starting with a dash is a typo rather
// than an option and must still refuse — a mistyped version must never be read
// as the automatic selection, which would prepare a release the maintainer did
// not ask for. A second positional refuses for the same reason: one version, or
// none. The same split, for the same reason, is `parseRestoreArgs` in
// tools/release/gitlab-release-drift.mjs.
export function parsePrepareArgs(args) {
  const meaningful = args.filter((argument) => argument !== '--');
  const [first = null, ...extra] = meaningful;
  const unknownArgs = first !== null && first.startsWith('-') ? [first, ...extra] : extra;
  return { explicitVersion: unknownArgs.length > 0 ? null : first, unknownArgs };
}

function main(argv) {
  const { explicitVersion, unknownArgs } = parsePrepareArgs(argv);
  if (unknownArgs.length > 0) {
    console.error('Usage: pnpm release:prepare [version]');
    console.error('Automatic selection uses the pending Change Fragments; pass one explicit SemVer');
    console.error('version for prereleases and deliberate release-management decisions.');
    return 2;
  }

  const result = prepareRelease({
    root,
    changieBinary: resolveChangieBinary(root),
    explicitVersion,
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
    return 1;
  }

  console.log(`Release preparation ok: candidate ${result.version}.`);
  console.log(`- .changes/${result.version}.md records the consumed pending fragments.`);
  console.log(`- ${packageManifestPath} now carries version ${result.version}.`);
  console.log(
    '- CHANGELOG.md was regenerated from the committed records and reproduces byte-for-byte.',
  );
  console.log(
    'Next steps (explicit, never automated): review the candidate, run `pnpm release:dry-run`,',
  );
  console.log('commit the candidate on a release-preparation pull request, and after merge tag the');
  console.log(
    `release commit with v${result.version} to trigger publication (docs/release/release-preparation.md).`,
  );
  return 0;
}

// Resolved through symlinks on both sides: `import.meta.url` is always the real
// path, while `process.argv[1]` is whatever spelling invoked the script, so an
// absolute invocation through a symlinked path would compare two different
// strings and silently skip `main()` instead of failing.
if (
  process.argv[1] &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))
) {
  process.exit(main(process.argv.slice(2)));
}
