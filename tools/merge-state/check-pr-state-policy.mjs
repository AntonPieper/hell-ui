#!/usr/bin/env node
// Three-state pull-request contract tests (ADR 0003).
//
// Runs the fixture-driven PR-state policy seam (every valid and invalid state
// combination, Release Preparation candidate shapes, rename and pagination
// metadata, fail-closed handling) plus the static workflow trust contracts
// proving that the privileged metadata workflow consumes GitHub metadata only
// and that untrusted content cannot influence a privileged command or
// expression. This is the same policy code the trusted workflow executes
// through tools/merge-state/decide-pr-state.mjs.

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMrStateInputFixtures } from './mr-state-input-fixtures.mjs';
import { runPrStatePolicyFixtures } from './pr-state-policy-fixtures.mjs';
import { runWorkflowTrustContractFixtures } from '../policy/workflow-trust-contract-fixtures.mjs';
import { collectWorkflowTrustContractErrors } from '../policy/workflow-trust-contracts.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const fixtures = runPrStatePolicyFixtures();
const adapterFixtures = runMrStateInputFixtures();
const trustErrors = collectWorkflowTrustContractErrors({ root });
const trustFixtures = runWorkflowTrustContractFixtures({ root });
const failures = [
  ...fixtures.failures,
  ...adapterFixtures.failures,
  ...trustErrors,
  ...trustFixtures.failures,
];

if (failures.length > 0) {
  console.error('PR-state contract check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `PR states ok: ${fixtures.total} policy fixtures passed (${adapterFixtures.replayed} replayed ` +
    `through the GitLab input adapter, plus ${adapterFixtures.total} adapter fixtures), the ` +
    `workflow trust contracts hold, and ${trustFixtures.total} adversarial workflow fixtures ` +
    'were rejected.',
);
