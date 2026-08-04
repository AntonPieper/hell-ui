#!/usr/bin/env node
// `pnpm verify:main-policy` — live parity between
// `.gitlab/policy/protect-main.json` and the project it protects.
//
// The checked-in file is the source of truth for the enforcement-relevant
// settings: the merge-request contract's merge settings, the protected `main`
// rule, the standing `v*` protected-tag rule, the fork-pipeline and
// variable-override settings, and both merge-request state labels. This
// command reads all four surfaces and reports every difference, including
// access-level grants to a single user, group, or deploy key — the exception
// grants that defeat the rule they sit on.
//
// It is evidence for maintainers, not a repository test: it needs credentials
// and a reachable project. The no-network half — the seam's fixtures and the
// coherence of the checked-in document — is `pnpm test:main-policy`.
//
// This command only reads. Drift is reported, never repaired:
// `pnpm restore:main-policy` is a separate command a maintainer runs
// deliberately (docs/release/protected-main-policy.md).

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeTransport, readPolicySurfaces, resolveProjectPath } from './gitlab-api.mjs';
import { policyRelativePath, readMainPolicy, verifyMainPolicy } from './main-policy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

if (process.argv.length > 2) {
  console.error('Usage: pnpm verify:main-policy');
  console.error('Run `pnpm test:main-policy` for the no-network document and fixture checks.');
  process.exit(2);
}

const failures = [];
const evidence = [];

const policy = readPolicy();
if (policy) await checkLiveProject(policy);

if (failures.length > 0) {
  // Evidence gathered before the failure still prints, so one drifted surface
  // never hides what the others proved.
  for (const line of evidence) console.log(line);
  console.error('Protected-main policy check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(
    `Restore the recorded policy with \`pnpm restore:main-policy\`, or change ${policyRelativePath} ` +
      'in a reviewed merge request when the policy itself should move.',
  );
  process.exit(1);
}

for (const line of evidence) console.log(line);
console.log(
  `Protected-main policy ok: the live project matches ${policyRelativePath} in ${policy.posture} ` +
    'posture across project settings, protected branches, protected tags, and both state labels.',
);

function readPolicy() {
  const path = join(root, policyRelativePath);
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (error) {
    failures.push(`Cannot read ${policyRelativePath}: ${error.message}`);
    return null;
  }
  const { policy, errors } = readMainPolicy(text);
  failures.push(...errors);
  return policy;
}

async function checkLiveProject(policy) {
  let projectPath;
  try {
    projectPath = resolveProjectPath();
  } catch (error) {
    failures.push(error.message);
    return;
  }

  let live;
  try {
    live = await readPolicySurfaces(projectPath);
  } catch (error) {
    failures.push(
      `Cannot read the live policy surfaces via ${describeTransport()}: ${error.message}`,
    );
    return;
  }

  const result = verifyMainPolicy({ policy, live });
  failures.push(...result.failures);
  evidence.push(...result.evidence);
}
