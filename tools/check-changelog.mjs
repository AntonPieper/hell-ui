#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  apiReportEntrypoints,
  apiReportExceptionEntrypoints,
  changelogPath,
  changelogRequiredPolicyTerms,
  packageManifestPath,
  releaseCandidateConsumerScenarioNames,
  releaseEvidencePolicyDocPath,
  semverPolicyPath,
} from './release-evidence-policy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
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
      if (!hasEvidenceCitation(section)) {
        errors.push(
          `${changelogPath} section ${currentVersion} must cite an issue, pull request, or local evidence path.`,
        );
      }
    }
  }
}

const semverPolicy = readRequiredFile(semverPolicyPath);
if (semverPolicy) {
  for (const term of changelogRequiredPolicyTerms) {
    if (!semverPolicy.toLowerCase().includes(term.toLowerCase())) {
      errors.push(`${semverPolicyPath} must define or reference ${JSON.stringify(term)}.`);
    }
  }
}

const releaseEvidencePolicy = readRequiredFile(releaseEvidencePolicyDocPath);
if (releaseEvidencePolicy) {
  validateReleaseEvidencePolicyDoc(releaseEvidencePolicy);
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

function hasEvidenceCitation(section) {
  const localPath =
    '(?:CHANGELOG\\.md|README\\.md|docs\\/[^\\s`)]+|tools\\/[^\\s`)]+|projects\\/[^\\s`)]+|e2e\\/[^\\s`)]+)';
  const patterns = [
    /(?:^|\s)#\d+\b/,
    /https:\/\/github\.com\/[^\s)]+\/(?:issues|pull)\/\d+\b/,
    new RegExp(`\`${localPath}\``),
    new RegExp(`\\]\\(${localPath}\\)`),
  ];
  return patterns.some((pattern) => pattern.test(section));
}

function validateReleaseEvidencePolicyDoc(content) {
  const requiredTerms = [
    'release-candidate package-consumer scenarios',
    'PDF viewer split-package exception',
    'Internal hotkeys API report exception',
    'production-readiness checklist',
    'tools/release-evidence-policy.mjs',
  ];
  for (const term of requiredTerms) {
    if (!content.toLowerCase().includes(term.toLowerCase())) {
      errors.push(`${releaseEvidencePolicyDocPath} must include ${JSON.stringify(term)}.`);
    }
  }

  for (const scenario of releaseCandidateConsumerScenarioNames) {
    if (!content.includes(`\`${scenario}\``)) {
      errors.push(`${releaseEvidencePolicyDocPath} must document scenario ${scenario}.`);
    }
  }

  for (const entrypoint of apiReportEntrypoints) {
    if (!content.includes(`\`${entrypoint.specifier}\``)) {
      errors.push(`${releaseEvidencePolicyDocPath} must document API report ${entrypoint.specifier}.`);
    }
    if (!content.includes(`\`${entrypoint.reportFileName}\``)) {
      errors.push(
        `${releaseEvidencePolicyDocPath} must document API report file ${entrypoint.reportFileName}.`,
      );
    }
  }

  for (const entrypoint of apiReportExceptionEntrypoints) {
    if (!content.includes(entrypoint.rationale)) {
      errors.push(`${releaseEvidencePolicyDocPath} must document exception rationale for ${entrypoint.specifier}.`);
    }
  }
}
