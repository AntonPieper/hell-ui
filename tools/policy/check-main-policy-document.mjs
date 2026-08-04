#!/usr/bin/env node
// `pnpm test:main-policy` — the no-network half of the protected-`main`
// policy: the fixture-driven seam, plus the coherence of the checked-in
// `.gitlab/policy/protect-main.json`.
//
// This is a repository test and runs in the static-contract job: it needs no
// credentials and reaches no server. Live parity is the other half, and lives
// in `pnpm verify:main-policy`.
//
// The document check is what makes a posture flip safe to review. The policy
// records a posture word and a `main` push level that have to agree, so an
// edit to one without the other fails here — in the merge request, before
// anyone applies anything to a live project.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { policyRelativePath, readMainPolicy } from './main-policy.mjs';
import { runMainPolicyFixtures } from './main-policy-fixtures.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const fixtures = runMainPolicyFixtures();
const { policy, errors } = readMainPolicy(readFileSync(join(root, policyRelativePath), 'utf8'));
const failures = [...fixtures.failures, ...errors];

if (failures.length > 0) {
  console.error('Protected-main policy document check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Main policy ok: ${policyRelativePath} is a coherent ${policy.posture} posture, and ` +
    `${fixtures.total} policy fixtures passed.`,
);
