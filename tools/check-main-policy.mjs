#!/usr/bin/env node
// `pnpm verify:main-policy [--local]` — parity between
// `.gitlab/policy/protect-main.json` and the project it protects.
//
// The checked-in file is the source of truth for the enforcement-relevant
// settings: the merge-request contract's merge settings, the protected `main`
// rule, the standing `v*` protected-tag rule, the fork-pipeline and
// variable-override settings, and both merge-request state labels. This
// command proves two things:
//
// 1. Locally, that the file is a coherent posture — every recorded setting
//    present and known, the `main` push level agreeing with the posture word,
//    one access level per rule, both state labels described.
// 2. Against the API (skipped with `--local`), that all four surfaces match
//    the file exactly, including access-level exception grants, which are
//    this platform's version of a bypass actor.
//
// It only reads. Drift is reported, never repaired: `pnpm restore:main-policy`
// is a separate command a maintainer runs deliberately
// (docs/release/protected-main-policy.md).

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiGet, apiList, describeTransport, resolveProjectPath } from './gitlab-api.mjs';
import { policyRelativePath, readMainPolicy, verifyMainPolicy } from './main-policy.mjs';
import { runMainPolicyFixtures } from './main-policy-fixtures.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const localOnly = args.includes('--local');
const unknownArgs = args.filter((argument) => argument !== '--local');
if (unknownArgs.length > 0) {
  console.error('Usage: pnpm verify:main-policy [--local]');
  console.error('--local skips the API evidence and only proves that the checked-in policy');
  console.error('document is a coherent posture.');
  process.exit(2);
}

const failures = [];
const evidence = [];

const fixtures = runMainPolicyFixtures();
failures.push(...fixtures.failures);

const policy = readPolicy();
if (policy && !localOnly) await checkLiveProject(policy);

if (failures.length > 0) {
  // Evidence gathered before the failure still prints, so one drifted surface
  // never hides what the other three proved.
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
  localOnly
    ? `Protected-main policy ok (local): ${policyRelativePath} is a coherent ${policy.posture} ` +
        `posture, and ${fixtures.total} policy fixtures passed.`
    : `Protected-main policy ok: the live project matches ${policyRelativePath} in ${policy.posture} ` +
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
    failures.push(`${error.message} (run with --local to skip the API evidence.)`);
    return;
  }

  let live;
  try {
    live = {
      project: await apiGet(projectPath),
      protectedBranches: await apiList(`${projectPath}/protected_branches`),
      protectedTags: await apiList(`${projectPath}/protected_tags`),
      labels: await apiList(`${projectPath}/labels`),
    };
  } catch (error) {
    failures.push(
      `Cannot read the live policy surfaces via ${describeTransport()} ` +
        `(run with --local to skip the API evidence): ${error.message}`,
    );
    return;
  }

  const result = verifyMainPolicy({ policy, live });
  failures.push(...result.failures);
  evidence.push(...result.evidence);
}
