// Generated Release Changelog contract (ADR 0003).
//
// The root CHANGELOG.md is the canonical generated aggregate of the immutable
// Released Version Notes under .changes/, newest first, starting at the 0.2.0
// internal-beta baseline. This module owns the objective released-record
// contract — heading shape, kind-section order, and the baseline's presence —
// and regenerates the aggregate with the real Changie binary in an isolated
// workspace so byte-level drift between the records and CHANGELOG.md is
// always detectable.

import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const changelogBaselineVersion = '0.2.0';

const changieTimeoutMs = 30_000;

const kindHeadings = [
  '### Breaking changes',
  '### Added',
  '### Changed',
  '### Fixed',
  '### Security',
];

export function resolveChangieBinary(root) {
  const extension = process.platform === 'win32' ? '.exe' : '';
  return join(
    root,
    'node_modules',
    'changie',
    'npm',
    'dist',
    `${process.platform}-${process.arch}${extension}`,
  );
}

export function listReleasedVersionFiles(changesDir) {
  if (!existsSync(changesDir)) return [];
  return readdirSync(changesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.md$/.test(entry.name) && entry.name !== 'header.tpl.md')
    .map((entry) => entry.name)
    .sort();
}

export function collectReleasedVersionNotesErrors(root, describePath = (path) => path) {
  const changesDir = join(root, '.changes');
  const errors = [];
  if (!existsSync(changesDir)) {
    return [`Missing ${describePath(changesDir)} directory.`];
  }

  const files = listReleasedVersionFiles(changesDir);
  if (!files.includes(`${changelogBaselineVersion}.md`)) {
    errors.push(
      `Missing ${describePath(join(changesDir, `${changelogBaselineVersion}.md`))}; ` +
        `the Release Changelog starts at the ${changelogBaselineVersion} internal-beta baseline record.`,
    );
  }

  for (const name of files) {
    const label = describePath(join(changesDir, name));
    const version = name.replace(/\.md$/, '');
    if (!isSemVer(version)) {
      errors.push(`${label} must be named <semver>.md for one released version.`);
      continue;
    }
    errors.push(...validateReleasedRecord(readFileSync(join(changesDir, name), 'utf8'), version, label));
  }

  return errors;
}

function validateReleasedRecord(content, version, label) {
  const errors = [];
  const lines = content.split(/\r?\n/);
  const headingPattern = new RegExp(`^## \\[${escapeRegExp(version)}\\] - \\d{4}-\\d{2}-\\d{2}$`);
  if (!headingPattern.test(lines[0] ?? '')) {
    errors.push(`${label} must start with \`## [${version}] - YYYY-MM-DD\`.`);
  }
  if (lines.slice(1).some((line) => /^##\s/.test(line) && !/^###\s/.test(line))) {
    errors.push(`${label} must contain exactly one \`## [${version}]\` release heading.`);
  }
  if (!lines.slice(1).some((line) => line.trim() !== '')) {
    errors.push(`${label} must record consumer-facing release notes below its heading.`);
  }
  if (content.includes('[Unreleased]')) {
    errors.push(`${label} must not carry an unreleased section; pending work stays in Change Fragments.`);
  }

  const sections = lines.filter((line) => /^###\s/.test(line));
  let previousIndex = -1;
  for (const section of sections) {
    const index = kindHeadings.indexOf(section);
    if (index === -1) {
      errors.push(
        `${label} has unknown section \`${section}\`; allowed sections are ${kindHeadings.join(', ')}.`,
      );
      continue;
    }
    if (index === previousIndex) {
      errors.push(`${label} repeats the \`${section}\` section.`);
    } else if (index < previousIndex) {
      errors.push(
        `${label} orders \`${section}\` incorrectly; sections render as ${kindHeadings.join(', ')}.`,
      );
    }
    previousIndex = index;
  }

  return errors;
}

// Copies the committed Changie configuration and records into a fresh
// isolated workspace, runs the real `changie merge` there, and returns the
// regenerated aggregate. `mutateWorkspace` lets fixtures edit the copied
// records before merging; the repository itself is never touched.
export function regenerateReleaseChangelog({ root, changieBinary, mutateWorkspace }) {
  const workspace = mkdtempSync(join(tmpdir(), 'hell-release-changelog-'));
  try {
    copyFileSync(join(root, '.changie.yaml'), join(workspace, '.changie.yaml'));
    const changesDir = join(workspace, '.changes');
    mkdirSync(join(changesDir, 'unreleased'), { recursive: true });
    copyFileSync(join(root, '.changes', 'header.tpl.md'), join(changesDir, 'header.tpl.md'));
    for (const name of listReleasedVersionFiles(join(root, '.changes'))) {
      copyFileSync(join(root, '.changes', name), join(changesDir, name));
    }
    mutateWorkspace?.(workspace);

    const result = spawnSync(changieBinary, ['merge'], {
      cwd: workspace,
      encoding: 'utf8',
      killSignal: 'SIGKILL',
      timeout: changieTimeoutMs,
    });
    if (result.error) {
      return { failures: [`changie merge failed to run: ${result.error.message}`], content: null };
    }
    if (result.signal) {
      return { failures: [`changie merge was killed by ${result.signal}.`], content: null };
    }
    if (result.status !== 0) {
      return {
        failures: [`changie merge exited with ${result.status}: ${result.stderr || result.stdout}`],
        content: null,
      };
    }

    const changelogPath = join(workspace, 'CHANGELOG.md');
    if (!existsSync(changelogPath)) {
      return { failures: ['changie merge produced no CHANGELOG.md.'], content: null };
    }
    return { failures: [], content: readFileSync(changelogPath, 'utf8') };
  } finally {
    rmSync(workspace, { force: true, recursive: true });
  }
}

export function describeFirstDifference(expected, actual) {
  const expectedLines = expected.split('\n');
  const actualLines = actual.split('\n');
  const length = Math.max(expectedLines.length, actualLines.length);
  for (let index = 0; index < length; index += 1) {
    if (expectedLines[index] !== actualLines[index]) {
      return (
        `first difference at line ${index + 1}: ` +
        `expected ${formatLine(expectedLines[index])}, found ${formatLine(actualLines[index])}`
      );
    }
  }
  return 'files differ only in trailing bytes';
}

function formatLine(line) {
  return line === undefined ? '(end of file)' : JSON.stringify(line);
}

export function isSemVer(value) {
  return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(
    value,
  );
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
