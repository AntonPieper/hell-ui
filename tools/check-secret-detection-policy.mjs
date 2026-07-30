#!/usr/bin/env node
// Secret-detection gate policy tests (GitLab migration).
//
// Runs the fixture-driven report evaluator seam: allowlist matching,
// per-finding suppression, fail-closed rejection of unrecognized report and
// allowlist shapes, and the guarantee that a verdict never carries a raw
// source extract. This is the same policy code the merge-request gate
// executes through tools/gate-secret-detection.mjs.

import { runSecretDetectionPolicyFixtures } from './secret-detection-policy-fixtures.mjs';

const { failures, total } = runSecretDetectionPolicyFixtures();

if (failures.length > 0) {
  console.error('Secret-detection policy check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Secret-detection policy ok: ${total} fixtures passed.`);
