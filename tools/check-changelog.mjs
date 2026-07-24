#!/usr/bin/env node
// Repository release-note contract (ADR 0003).
//
// The Release Changelog is generated: CHANGELOG.md must reproduce the
// committed Released Version Notes byte-for-byte, the 0.2.0 internal-beta
// baseline and a record for the current package version must exist, the
// committed pending Change Fragments must satisfy the objective validator,
// `pnpm change` must remain the only contributor-facing Changie command, and
// the real Changie configuration, validator, and merge behavior are proven in
// isolated repository fixtures.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runChangeFragmentFixtures } from './change-fragment-fixtures.mjs';
import { collectUnreleasedFragmentErrors, listUnreleasedFragments } from './change-fragments.mjs';
import {
  collectReleasedVersionNotesErrors,
  describeFirstDifference,
  isSemVer,
  listReleasedVersionFiles,
  regenerateReleaseChangelog,
  resolveChangieBinary,
} from './release-changelog.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const changelogPath = 'CHANGELOG.md';
const packageManifestPath = 'packages/angular/package.json';
const changieConfigPath = '.changie.yaml';
const unreleasedDir = join(root, '.changes', 'unreleased');
const errors = [];

const currentVersion = readPackageVersion(packageManifestPath);

if (!currentVersion) {
  errors.push(`${packageManifestPath} must include a version.`);
} else if (!isSemVer(currentVersion)) {
  errors.push(`${packageManifestPath} version must be valid SemVer; found ${currentVersion}.`);
}

errors.push(...collectReleasedVersionNotesErrors(root, (path) => relative(root, path)));

if (currentVersion && isSemVer(currentVersion)) {
  const versionRecord = join(root, '.changes', `${currentVersion}.md`);
  if (!existsSync(versionRecord)) {
    errors.push(
      `Missing ${relative(root, versionRecord)}; the current package version needs a ` +
        'Released Version Notes record (created by Release Preparation, never by hand-editing the changelog).',
    );
  }
}

const changelog = readRequiredFile(changelogPath);
if (changelog) {
  if (!changelog.startsWith('# Changelog\n\n## [')) {
    errors.push(
      `${changelogPath} must start with \`# Changelog\` and proceed directly to the newest release ` +
        'with no introduction.',
    );
  }
  if (changelog.includes('[Unreleased]')) {
    errors.push(
      `${changelogPath} must not carry an unreleased section; pending Consumer Changes stay in ` +
        '.changes/unreleased/ Change Fragments until Release Preparation.',
    );
  }
}

let pendingFragmentCount = 0;
if (!existsSync(join(root, changieConfigPath))) {
  errors.push(`Missing ${changieConfigPath}; Change Fragment authoring requires the Changie configuration.`);
} else {
  errors.push(...collectUnreleasedFragmentErrors(unreleasedDir, (path) => relative(root, path)));
  if (existsSync(unreleasedDir)) pendingFragmentCount = listUnreleasedFragments(unreleasedDir).length;
}

errors.push(...collectCommandSurfaceErrors());

const changieBinary = resolveChangieBinary(root);
if (!existsSync(changieBinary)) {
  errors.push(`Missing Changie binary at ${changieBinary}; run pnpm install first.`);
} else if (changelog) {
  const regenerated = regenerateReleaseChangelog({ root, changieBinary });
  errors.push(...regenerated.failures);
  if (regenerated.content !== null && regenerated.content !== changelog) {
    errors.push(
      `${changelogPath} does not reproduce the aggregate regenerated from the committed ` +
        `.changes/ Released Version Notes (${describeFirstDifference(regenerated.content, changelog)}). ` +
        'Edit the version records and regenerate; the aggregate is never edited by hand.',
    );
  }
}

const fixtureRun = runChangeFragmentFixtures({ root });
errors.push(...fixtureRun.failures);

if (errors.length > 0) {
  console.error('Changelog check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const releasedCount = listReleasedVersionFiles(join(root, '.changes')).length;
console.log(
  `Changelog ok: CHANGELOG.md reproduces ${releasedCount} released version ` +
    `record${releasedCount === 1 ? '' : 's'} byte-for-byte, ` +
    `${pendingFragmentCount} pending change fragment${pendingFragmentCount === 1 ? '' : 's'} ` +
    `passed objective validation, and ${fixtureRun.total} change-fragment fixtures passed.`,
);

function collectCommandSurfaceErrors() {
  const surfaceErrors = [];
  const content = readRequiredFile('package.json');
  if (!content) return surfaceErrors;

  let scripts;
  try {
    scripts = JSON.parse(content).scripts ?? {};
  } catch (error) {
    surfaceErrors.push(`package.json must be valid JSON: ${error.message}`);
    return surfaceErrors;
  }

  if (scripts.change !== 'changie new') {
    surfaceErrors.push(
      'package.json must keep `change: "changie new"` as the only contributor-facing fragment creation command.',
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

function readPackageVersion(path) {
  const content = readRequiredFile(path);
  if (!content) return null;

  try {
    const packageJson = JSON.parse(content);
    return typeof packageJson.version === 'string' ? packageJson.version : null;
  } catch (error) {
    errors.push(`${path} must be valid JSON: ${error.message}`);
    return null;
  }
}

function readRequiredFile(path) {
  const absolutePath = join(root, path);
  if (!existsSync(absolutePath)) {
    errors.push(`Missing ${path}.`);
    return null;
  }

  return readFileSync(absolutePath, 'utf8');
}
