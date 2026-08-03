#!/usr/bin/env node
// Pipeline-shape contract tests (GitLab migration).
//
// Runs the static pipeline-shape contract against the repository's real
// GitLab CI definitions (root .gitlab-ci.yml plus its includes), then replays
// the adversarial fixtures proving the contract still rejects a removed
// required job, a missing docker tag, a topology mismatch, a tier-rule
// mismatch, and an out-of-subset expression. The GitLab pipeline has no
// aggregate gate job the way GitHub's e2e-gate is one — the merge gate is
// the pipeline itself — so the pipeline's shape has to be proven, not
// assumed.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPipelineShapeContractFixtures } from './pipeline-shape-contract-fixtures.mjs';
import { collectPipelineShapeContractErrors } from './pipeline-shape-contracts.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const errors = collectPipelineShapeContractErrors({ root });
const fixtures = runPipelineShapeContractFixtures({ root });
const failures = [...errors, ...fixtures.failures];

if (failures.length > 0) {
  console.error('Pipeline-shape contract check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Pipeline shape ok: the contract holds on the real CI definitions and ` +
    `${fixtures.total} adversarial fixtures were rejected.`,
);
