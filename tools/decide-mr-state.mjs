#!/usr/bin/env node
// Merge-request state decision entry point (ADR 0003).
//
// Consumed by the `pr-state` job of a GitLab merge-request pipeline
// (.gitlab/ci/mr-contract.yml). It reads the pipeline's label variable and
// the merge-base diff, converts both through the fixture-tested GitLab input
// adapter (tools/mr-state-input.mjs), and reports the policy verdict from
// tools/pr-state-policy.mjs. Dependency-free on purpose, like the policy: the
// job runs it with no install step.

import { execFileSync } from 'node:child_process';
import { parseMergeRequestLabels, parseNameStatusDiff } from './mr-state-input.mjs';
import { evaluatePullRequestState } from './pr-state-policy.mjs';

// The known label-edit degradation: editing labels never starts a new
// merge-request pipeline, so a verdict can outlive the labels it read.
const labelEditHint =
  'If the labels changed after this pipeline started, re-run the pipeline: label edits do not ' +
  'trigger a new one, and this job reads the labels captured at pipeline creation.';

const baseSha = process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA;
if (!baseSha) {
  console.error(
    'CI_MERGE_REQUEST_DIFF_BASE_SHA is not set; this decision only exists inside a ' +
      'merge-request pipeline.',
  );
  process.exit(2);
}

// In a merged-results pipeline HEAD is a transient merge commit, so a plain
// diff would absorb target-branch commits landed since the merge base and
// blame the merge request for them. That mode sets the source-branch tip
// explicitly; a detached pipeline leaves the variable empty and checks the
// tip out as HEAD.
const headSha = process.env.CI_MERGE_REQUEST_SOURCE_BRANCH_SHA || 'HEAD';

ensureCommitAvailable(baseSha);

const labels = parseMergeRequestLabels(process.env.CI_MERGE_REQUEST_LABELS);
const { files, errors: adapterErrors } = parseNameStatusDiff(
  git('diff', '--name-status', '--find-renames', '-z', baseSha, headSha),
);

const { state, errors } = adapterErrors.length
  ? { state: null, errors: adapterErrors }
  : evaluatePullRequestState({ labels, files });

console.log(`Labels: ${labels.join(', ') || '(none)'}`);
console.log(
  `Changed files: ${files.length} in the merge-base diff (${baseSha.slice(0, 12)}..${headSha.slice(0, 12)})`,
);
console.log(`Claimed state: ${state ?? '(none)'}`);

if (errors.length > 0) {
  console.error('Merge-request state check failed:');
  for (const error of errors) console.error(`- ${error}`);
  // Only a policy verdict can be stale relative to a label edit; an adapter
  // rejection has nothing to do with labels.
  if (adapterErrors.length === 0) console.error(labelEditHint);
  process.exit(1);
}

console.log(`Merge-request state ok: exactly one state (${state}).`);

// The runner's default shallow clone may not reach the merge base; fetching
// the single commit is enough, because a two-endpoint diff never walks the
// history in between.
function ensureCommitAvailable(sha) {
  if (hasCommit(sha)) return;
  try {
    git('fetch', '--quiet', '--depth=1', 'origin', sha);
  } catch (error) {
    console.error(`Failed to fetch the merge base ${sha}: ${error.message}`);
    process.exit(2);
  }
  if (!hasCommit(sha)) {
    console.error(`The merge base ${sha} is still missing after fetching it from origin.`);
    process.exit(2);
  }
}

function hasCommit(sha) {
  try {
    git('cat-file', '-e', `${sha}^{commit}`);
    return true;
  } catch {
    return false;
  }
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}
