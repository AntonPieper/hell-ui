#!/usr/bin/env node
// Repository release-note contract (ADR 0003).
//
// The Release Changelog is generated: CHANGELOG.md must reproduce the
// committed Released Version Notes byte-for-byte, the 0.2.0 internal-beta
// baseline and a record for the current package version must exist, the
// committed pending Change Fragments must satisfy the objective validator,
// `pnpm change` and `pnpm release:prepare` must remain the only public
// Changie-backed commands, and the real Changie configuration, validator,
// merge behavior, and Release Preparation transaction are proven in isolated
// repository fixtures.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runChangeFragmentFixtures } from './change-fragment-fixtures.mjs';
import {
  collectChangelogContractErrors,
  listReleasedVersionFiles,
  resolveChangieBinary,
} from './release-changelog.mjs';
import { runReleasePreparationFixtures } from './release-preparation-fixtures.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

const contract = collectChangelogContractErrors({
  root,
  changieBinary: resolveChangieBinary(root),
  describePath: (path) => relative(root, path),
});
errors.push(...contract.errors);
errors.push(...collectCommandSurfaceErrors());

const fragmentFixtures = runChangeFragmentFixtures({ root });
errors.push(...fragmentFixtures.failures);
const preparationFixtures = runReleasePreparationFixtures({ root });
errors.push(...preparationFixtures.failures);

if (errors.length > 0) {
  console.error('Changelog check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const releasedCount = listReleasedVersionFiles(join(root, '.changes')).length;
const pendingFragmentCount = contract.pendingFragmentCount;
console.log(
  `Changelog ok: CHANGELOG.md reproduces ${releasedCount} released version ` +
    `record${releasedCount === 1 ? '' : 's'} byte-for-byte, ` +
    `${pendingFragmentCount} pending change fragment${pendingFragmentCount === 1 ? '' : 's'} ` +
    `passed objective validation, and ${fragmentFixtures.total} change-fragment plus ` +
    `${preparationFixtures.total} release-preparation fixtures passed.`,
);

function collectCommandSurfaceErrors() {
  const surfaceErrors = [];
  const packageJsonPath = join(root, 'package.json');
  if (!existsSync(packageJsonPath)) {
    surfaceErrors.push('Missing package.json.');
    return surfaceErrors;
  }

  let scripts;
  try {
    scripts = JSON.parse(readFileSync(packageJsonPath, 'utf8')).scripts ?? {};
  } catch (error) {
    surfaceErrors.push(`package.json must be valid JSON: ${error.message}`);
    return surfaceErrors;
  }

  if (scripts.change !== 'changie new') {
    surfaceErrors.push(
      'package.json must keep `change: "changie new"` as the only contributor-facing fragment creation command.',
    );
  }
  if (scripts['release:prepare'] !== 'node tools/release-prepare.mjs') {
    surfaceErrors.push(
      'package.json must keep `release:prepare: "node tools/release-prepare.mjs"` as the one Release Preparation command.',
    );
  }
  for (const [name, command] of Object.entries(scripts)) {
    if (name === 'change' || typeof command !== 'string') continue;
    if (/\bchangie\b/.test(command)) {
      surfaceErrors.push(
        `package.json script "${name}" must not expose Changie primitives; batch, merge, and publish stay private to release tooling.`,
      );
    }
  }

  return surfaceErrors;
}
