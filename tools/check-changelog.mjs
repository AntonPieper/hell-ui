#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const packageManifestPath = 'projects/hell/package.json';
const changelogPath = 'CHANGELOG.md';
const semverPolicyPath = 'docs/release/semver-policy.md';
const requiredPolicyTerms = ['alpha', 'internal beta', 'public beta', 'stable', 'SemVer', 'CHANGELOG.md'];
const errors = [];

const currentVersion = readPackageVersion(packageManifestPath);
const previousVersion = readPackageVersionAtHead(packageManifestPath);

if (!currentVersion) {
  errors.push(`${packageManifestPath} must include a version.`);
} else if (!isSemVer(currentVersion)) {
  errors.push(`${packageManifestPath} version must be valid SemVer; found ${currentVersion}.`);
}

const changelog = readRequiredFile(changelogPath);
if (changelog) {
  if (!changelog.includes('Keep a Changelog')) {
    errors.push(`${changelogPath} must state the chosen Keep a Changelog format.`);
  }
  if (!changelog.includes(semverPolicyPath)) {
    errors.push(`${changelogPath} must link to ${semverPolicyPath}.`);
  }

  if (currentVersion) {
    const section = extractVersionSection(changelog, currentVersion);
    if (!section) {
      const changedSuffix = previousVersion && previousVersion !== currentVersion
        ? ` Version changed from ${previousVersion} to ${currentVersion};`
        : '';
      errors.push(`${changelogPath} must include a \`## [${currentVersion}] - YYYY-MM-DD\` section for the current package version.${changedSuffix}`);
    } else {
      if (!/^[-*] /m.test(section)) {
        errors.push(`${changelogPath} section ${currentVersion} must include at least one bullet.`);
      }
      if (!/\bHELL-\d{3}\b/.test(section)) {
        errors.push(`${changelogPath} section ${currentVersion} must cite at least one HELL slice ID.`);
      }
    }
  }
}

const semverPolicy = readRequiredFile(semverPolicyPath);
if (semverPolicy) {
  for (const term of requiredPolicyTerms) {
    if (!semverPolicy.toLowerCase().includes(term.toLowerCase())) {
      errors.push(`${semverPolicyPath} must define or reference ${JSON.stringify(term)}.`);
    }
  }
}

if (errors.length > 0) {
  console.error('Changelog contract failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const changed = previousVersion && previousVersion !== currentVersion
  ? ` Version changed since HEAD: ${previousVersion} -> ${currentVersion}.`
  : '';
console.log(`Changelog ok: @hell-ui/angular ${currentVersion} has a changelog entry and stage policy.${changed}`);

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

function readPackageVersionAtHead(path) {
  const content = gitOutput(['show', `HEAD:${path}`]);
  if (!content) return null;

  try {
    const packageJson = JSON.parse(content);
    return typeof packageJson.version === 'string' ? packageJson.version : null;
  } catch {
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
  const startIndex = lines.findIndex((line) => versionHeadingPattern(version).test(line));
  if (startIndex === -1) return null;

  const endIndex = lines.findIndex((line, index) => index > startIndex && /^##\s+/.test(line));
  return lines.slice(startIndex, endIndex === -1 ? lines.length : endIndex).join('\n');
}

function versionHeadingPattern(version) {
  return new RegExp(`^## \\[${escapeRegExp(version)}\\]\\s+-\\s+\\d{4}-\\d{2}-\\d{2}\\s*$`);
}

function isSemVer(value) {
  return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(value);
}

function gitOutput(args) {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) return null;
  return result.stdout.trim() || null;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

