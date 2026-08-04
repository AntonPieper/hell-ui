#!/usr/bin/env node
// `pnpm restore:main-policy [--apply]` — write `.gitlab/policy/protect-main.json`
// back onto the project it protects.
//
// Restoration is deliberately a command a maintainer runs, never something
// verification does on its way past. Drift on a protection surface is a fact
// worth reading before it is erased: it may be someone else's deliberate
// change, and repairing it silently would destroy the only evidence that it
// happened.
//
// Without `--apply` this prints the plan and writes nothing. The plan is
// derived from the same comparison `pnpm verify:main-policy` reports, so it
// can only touch surfaces the verifier checks.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiSend, describeTransport, readPolicySurfaces, resolveProjectPath } from './gitlab-api.mjs';
import { mainPolicyRestorePlan, policyRelativePath, readMainPolicy, verifyMainPolicy } from './main-policy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const unknownArgs = args.filter((argument) => argument !== '--apply');
if (unknownArgs.length > 0) {
  console.error('Usage: pnpm restore:main-policy [--apply]');
  console.error('Without --apply the plan is printed and nothing is written.');
  process.exit(2);
}

const { policy, errors } = readMainPolicy(readFileSync(join(root, policyRelativePath), 'utf8'));
if (!policy) {
  console.error(`${policyRelativePath} is not a coherent policy; refusing to write it to a project:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const projectPath = resolveProjectPath();
const { requests, manual } = mainPolicyRestorePlan({
  policy,
  live: await readPolicySurfaces(projectPath),
  projectPath,
});

if (requests.length === 0 && manual.length === 0) {
  console.log(
    `No drift: the project already matches ${policyRelativePath} in ${policy.posture} posture. ` +
      'Nothing to restore.',
  );
  process.exit(0);
}

if (requests.length > 0) {
  console.log(
    `Restoration plan for ${policyRelativePath} (${policy.posture} posture), via ${describeTransport()}:`,
  );
  for (const [index, request] of requests.entries()) {
    console.log(`${index + 1}. ${request.summary}`);
    console.log(
      `   ${request.method} ${request.path}${request.body ? ` ${JSON.stringify(request.body)}` : ''}`,
    );
  }
  if (requests.some((request) => request.method === 'DELETE')) {
    console.log(
      '\nProtected branch and tag rules have no partial update on this edition, so a drifted rule ' +
        'is deleted and recreated. The ref is unprotected between those two requests; do this from ' +
        'a session nobody is pushing into.',
    );
  }
}

// Drift this command will not decide on its own. Removing a protection rule
// the policy is silent about is a judgement about someone else's intent, so it
// is reported and left alone — including when everything else is repaired.
if (manual.length > 0) {
  console.log(`\nLeft alone — decide these yourself:`);
  for (const entry of manual) console.log(`- ${entry}`);
  console.log(
    'Record the rule in the policy if it belongs there, or remove it from the project by hand.',
  );
}

if (!apply) {
  if (requests.length > 0) console.log('\nNothing written. Re-run with --apply to restore.');
  process.exit(0);
}

console.log('');
const applied = [];
try {
  for (const request of requests) {
    await apiSend(request.method, request.path, request.body);
    applied.push(request);
    console.log(`Applied: ${request.method} ${request.path}`);
  }
} catch (error) {
  // A rule is replaced by a delete followed by a create. If the create is what
  // failed, the ref is unprotected right now — that has to be the first thing
  // the maintainer reads, not a stack trace they have to interpret.
  const failed = requests[applied.length];
  console.error(`\nFailed: ${failed.method} ${failed.path}`);
  console.error(error.message);

  const orphaned = applied.at(-1);
  if (orphaned?.method === 'DELETE' && failed.method === 'POST') {
    console.error(
      `\nThe "${orphaned.path.split('/').pop()}" rule was deleted and could not be recreated. ` +
        'That ref is unprotected now. Re-run `pnpm restore:main-policy --apply` once the API is ' +
        'reachable, and check the result before anyone pushes.',
    );
  }
  console.error(
    `\n${applied.length} of ${requests.length} requests were applied; the rest were not. ` +
      'Re-running is safe: the plan is recomputed from what the project actually looks like.',
  );
  process.exit(1);
}

const { failures } = verifyMainPolicy({ policy, live: await readPolicySurfaces(projectPath) });
const unrepaired = failures.filter((failure) => !manual.includes(failure));
if (unrepaired.length > 0) {
  console.error('\nThe project still differs from the policy after restoration:');
  for (const failure of unrepaired) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(
  `\nRestored: the project matches ${policyRelativePath} in ${policy.posture} posture` +
    `${manual.length > 0 ? ', apart from the rules left alone above' : ''}.`,
);
