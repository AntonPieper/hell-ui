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

import { readFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiSend, describeTransport, readPolicySurfaces, resolveProjectPath } from './gitlab-api.mjs';
import { mainPolicyRestorePlan, policyRelativePath, readMainPolicy, verifyMainPolicy } from './main-policy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Splits this command's argv. `--apply` is the only argument it takes, but
// `pnpm restore:main-policy -- --apply` is a spelling a maintainer arrives at
// anyway — it is what the sibling `pnpm restore:release -- <tag>` needs, and it
// is the habit pnpm's own documentation teaches for forwarding flags. pnpm
// forwards that `--` into argv rather than consuming it, so the separator has
// to be dropped here or it survives as an argument this command does not know
// and the usage check refuses a correct invocation.
//
// Dropping the separator is not the same as ignoring extra arguments: anything
// else still survives, so a typo is still reported rather than silently read as
// a plan-only run. The same split, for the same reason, is `parseRestoreArgs`
// in tools/release/gitlab-release-drift.mjs.
export function parseRestoreArgs(args) {
  const meaningful = args.filter((argument) => argument !== '--');
  return {
    apply: meaningful.includes('--apply'),
    unknownArgs: meaningful.filter((argument) => argument !== '--apply'),
  };
}

async function main(argv) {
  const { apply, unknownArgs } = parseRestoreArgs(argv);
  if (unknownArgs.length > 0) {
    console.error('Usage: pnpm restore:main-policy [--apply]');
    console.error('Without --apply the plan is printed and nothing is written.');
    return 2;
  }

  const { policy, errors } = readMainPolicy(readFileSync(join(root, policyRelativePath), 'utf8'));
  if (!policy) {
    console.error(
      `${policyRelativePath} is not a coherent policy; refusing to write it to a project:`,
    );
    for (const error of errors) console.error(`- ${error}`);
    return 1;
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
    return 0;
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
    return 0;
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
    return 1;
  }

  const { failures } = verifyMainPolicy({ policy, live: await readPolicySurfaces(projectPath) });
  const unrepaired = failures.filter((failure) => !manual.includes(failure));
  if (unrepaired.length > 0) {
    console.error('\nThe project still differs from the policy after restoration:');
    for (const failure of unrepaired) console.error(`- ${failure}`);
    return 1;
  }
  console.log(
    `\nRestored: the project matches ${policyRelativePath} in ${policy.posture} posture` +
      `${manual.length > 0 ? ', apart from the rules left alone above' : ''}.`,
  );
  return 0;
}

// Resolved through symlinks on both sides: `import.meta.url` is always the real
// path, while `process.argv[1]` is whatever spelling invoked the script, so an
// absolute invocation through a symlinked path would compare two different
// strings and silently skip `main()` instead of failing.
if (
  process.argv[1] &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))
) {
  process.exit(await main(process.argv.slice(2)));
}
