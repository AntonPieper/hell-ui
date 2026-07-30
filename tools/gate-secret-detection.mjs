#!/usr/bin/env node
// Secret-detection gate entry point (GitLab migration).
//
// Consumed by the `secret-detection-gate` job (.gitlab/ci/secret-detection.yml),
// which needs the analyzer job's report artifact. It replays the report
// against the in-repo allowlist through the fixture-tested evaluator
// (tools/secret-detection-policy.mjs) and turns findings into a job verdict.
// Dependency-free on purpose, like the evaluator: the job runs it with no
// install step. A missing or unreadable report is a hard error, never a pass
// — the gate only means something while the analyzer feeds it.

import { readFileSync } from 'node:fs';
import { evaluateSecretDetectionReport } from './secret-detection-policy.mjs';

const reportPath = 'gl-secret-detection-report.json';
const allowlistPath = '.gitlab/secret-detection-allowlist.json';

const report = readJson(
  reportPath,
  'the secret_detection job uploads it as an artifact; the gate cannot pass without a scan',
);
const allowlist = readJson(allowlistPath, 'the in-repo allowlist is versioned next to the CI config');

const { active, suppressed, errors } = evaluateSecretDetectionReport({ report, allowlist });

if (errors.length > 0) {
  console.error('Secret-detection gate cannot decide:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(2);
}

for (const finding of suppressed) {
  console.log(`Suppressed by allowlist: ${formatFinding(finding)} — ${finding.reason}`);
}

if (active.length > 0) {
  console.error(`Secret detection found ${active.length} finding(s) the allowlist does not cover:`);
  for (const finding of active) console.error(`- ${formatFinding(finding)}`);
  console.error(
    'A real secret must be rotated and removed, not allowlisted. For a documented false ' +
      `positive, add {rule, path, reason} to ${allowlistPath}.`,
  );
  process.exit(1);
}

console.log(
  `Secret detection clean: 0 findings to report` +
    (suppressed.length > 0 ? ` (${suppressed.length} suppressed by the allowlist).` : '.'),
);

// rule + location only; the secret itself must never reach this log.
function formatFinding(finding) {
  const line = finding.line === null ? '' : `:${finding.line}`;
  return `${finding.severity}: ${finding.name} (${finding.rule}) at ${finding.path}${line}`;
}

function readJson(path, why) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (error) {
    console.error(`Cannot read ${path} (${why}): ${error.message}`);
    process.exit(2);
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Cannot parse ${path} as JSON: ${error.message}`);
    process.exit(2);
  }
}
