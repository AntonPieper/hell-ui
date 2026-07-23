#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const changelogPath = 'CHANGELOG.md';
const packageManifestPath = 'packages/angular/package.json';
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

if (errors.length > 0) {
  console.error('Changelog check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Changelog ok: hell-ui ${currentVersion} has a changelog entry.`);

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
