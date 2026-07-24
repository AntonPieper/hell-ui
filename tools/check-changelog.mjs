#!/usr/bin/env node
// Repository release-note contract.
//
// Two contracts run side by side while the changelog migration is pending:
// the legacy hand-maintained Release Changelog must keep a section for the
// current package version, and the Change Fragment path (ADR 0003) must stay
// healthy — the committed pending fragments must satisfy the objective
// validator, `pnpm change` must remain the only contributor-facing Changie
// command, and the real Changie configuration plus validator are proven in
// isolated repository fixtures.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runChangeFragmentFixtures } from './change-fragment-fixtures.mjs';
import { collectUnreleasedFragmentErrors, listUnreleasedFragments } from './change-fragments.mjs';

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

const changelog = readRequiredFile(changelogPath);
if (changelog && currentVersion) {
  const section = extractVersionSection(changelog, currentVersion);
  if (!section) {
    errors.push(
      `${changelogPath} must include a \`## [${currentVersion}] - YYYY-MM-DD\` section for the current package version.`,
    );
  } else if (!/^[-*] /m.test(section)) {
    errors.push(`${changelogPath} section ${currentVersion} must include at least one bullet.`);
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

const fixtureRun = runChangeFragmentFixtures({ root });
errors.push(...fixtureRun.failures);

if (errors.length > 0) {
  console.error('Changelog check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Changelog ok: hell-ui ${currentVersion} has a changelog entry, ` +
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

function extractVersionSection(content, version) {
  const lines = content.split(/\r?\n/);
  const headingPattern = new RegExp(
    `^## \\[${escapeRegExp(version)}\\]\\s+-\\s+\\d{4}-\\d{2}-\\d{2}\\s*$`,
  );
  const startIndex = lines.findIndex((line) => headingPattern.test(line));
  if (startIndex === -1) return null;

  const endIndex = lines.findIndex((line, index) => index > startIndex && /^##\s+/.test(line));
  return lines.slice(startIndex, endIndex === -1 ? lines.length : endIndex).join('\n');
}

function isSemVer(value) {
  return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(
    value,
  );
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
