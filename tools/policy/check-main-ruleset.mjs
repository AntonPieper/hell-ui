#!/usr/bin/env node
// `pnpm verify:main-ruleset [--local]` — the protected-`main` pull-request
// contract (ADR 0003, #371).
//
// The checked-in ruleset `.github/rulesets/protect-main.json` is the source
// of truth for the protected `main` branch rules, including the required
// status checks for the three-state pull-request contract. This command
// proves two things:
//
// 1. Locally, every required check context is a static job name in a
//    committed workflow that triggers on pull_request or
//    pull_request_target, so the ruleset can only pin contexts that
//    actually run on pull requests.
// 2. Against the GitHub API (skipped with `--local`), the live ruleset
//    matches the checked-in rules exactly — including bypass actors and the
//    full ref conditions — and the `no-consumer-change` and
//    `release-preparation` labels exist with nonblank descriptions.
//
// The remote half needs an authenticated `gh` CLI. It is activation
// evidence for maintainers, not part of the repository test suite: it fails
// until the contract workflows are on `main` and the live ruleset has been
// updated from the checked-in file (docs/release/pull-request-contract.md).

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const rulesetPath = join(root, '.github', 'rulesets', 'protect-main.json');
const workflowsDirectory = join(root, '.github', 'workflows');

// The two pull-request state labels from CONTEXT.md ("No Consumer Change",
// "Release Preparation"); #370 owns their creation and descriptions.
const requiredLabels = ['no-consumer-change', 'release-preparation'];

const args = process.argv.slice(2);
const localOnly = args.includes('--local');
const unknownArgs = args.filter((argument) => argument !== '--local');
if (unknownArgs.length > 0) {
  console.error('Usage: pnpm verify:main-ruleset [--local]');
  console.error('--local skips the GitHub API evidence and only proves that every');
  console.error('required check context matches a committed workflow job name.');
  process.exit(2);
}

const failures = [];
const evidence = [];

const contract = readContract();
if (contract) {
  checkLocalWorkflowContexts(contract);
  if (!localOnly) checkLiveRepository(contract);
}

if (failures.length > 0) {
  // Evidence gathered before the failure still prints, so one failing
  // surface never hides the API evidence another surface produced.
  for (const line of evidence) console.log(line);
  console.error('Main ruleset check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

for (const line of evidence) console.log(line);
console.log(
  localOnly
    ? 'Main ruleset ok (local): every required check context matches a committed workflow job name.'
    : 'Main ruleset ok: the live ruleset matches .github/rulesets/protect-main.json and both pull-request state labels exist.',
);

function readContract() {
  let contract;
  try {
    contract = JSON.parse(readFileSync(rulesetPath, 'utf8'));
  } catch (error) {
    failures.push(`${relative(root, rulesetPath)} must be valid JSON: ${error.message}`);
    return null;
  }

  const statusRule = (contract.rules ?? []).find((rule) => rule.type === 'required_status_checks');
  const contexts = statusRule?.parameters?.required_status_checks ?? [];
  if (contexts.length === 0) {
    failures.push(
      `${relative(root, rulesetPath)} must declare at least one required status check.`,
    );
    return null;
  }
  const seen = new Set();
  for (const { context } of contexts) {
    if (seen.has(context)) {
      failures.push(
        `${relative(root, rulesetPath)} lists the required check context "${context}" more than once.`,
      );
    }
    seen.add(context);
  }
  if (statusRule.parameters.strict_required_status_checks_policy !== true) {
    failures.push(
      `${relative(root, rulesetPath)} must keep the strict up-to-date-branch policy ` +
        '(strict_required_status_checks_policy: true).',
    );
  }
  return contract;
}

function checkLocalWorkflowContexts(contract) {
  const jobNames = collectStaticWorkflowJobNames();
  const contexts = requiredContexts(contract);
  for (const { context } of contexts) {
    const providers = jobNames.get(context);
    if (!providers) {
      failures.push(
        `Required check context "${context}" does not match any static job name in a ` +
          'workflow triggered by pull_request or pull_request_target. The ruleset may only ' +
          'pin contexts that actually run on pull requests; align the context with the ' +
          'merged workflow job name.',
      );
      continue;
    }
    evidence.push(`Required check "${context}" is provided by ${providers.join(', ')}.`);
  }
}

function collectStaticWorkflowJobNames() {
  const names = new Map();
  let entries;
  try {
    entries = readdirSync(workflowsDirectory).filter((entry) => /\.ya?ml$/.test(entry));
  } catch (error) {
    failures.push(`Cannot read .github/workflows/: ${error.message}`);
    return names;
  }

  for (const entry of entries) {
    const workflowPath = join(workflowsDirectory, entry);
    let workflow;
    try {
      workflow = parse(readFileSync(workflowPath, 'utf8'));
    } catch (error) {
      failures.push(`${relative(root, workflowPath)} must be valid YAML: ${error.message}`);
      continue;
    }

    // Only pull-request-triggered workflows can provide a mergeable check
    // context: a required check that never runs on pull requests would block
    // every merge.
    if (!runsOnPullRequests(workflow)) continue;

    for (const [jobKey, job] of Object.entries(workflow?.jobs ?? {})) {
      // A missing `name` makes the job key the check context; a name with a
      // GitHub expression is dynamic and can never be pinned by a ruleset.
      const jobName = typeof job?.name === 'string' ? job.name : jobKey;
      if (jobName.includes('${{')) continue;
      const providers = names.get(jobName) ?? [];
      providers.push(`${relative(root, workflowPath)} (job "${jobKey}")`);
      names.set(jobName, providers);
    }
  }
  return names;
}

function runsOnPullRequests(workflow) {
  // YAML 1.1 parses a bare `on:` key as boolean true; the yaml package
  // defaults to 1.2 where it stays the string "on". Accept both.
  const triggers = workflow?.on ?? workflow?.[true];
  const names = ['pull_request', 'pull_request_target'];
  if (typeof triggers === 'string') return names.includes(triggers);
  if (Array.isArray(triggers)) return triggers.some((trigger) => names.includes(trigger));
  if (triggers !== null && typeof triggers === 'object') {
    return names.some((name) => name in triggers);
  }
  return false;
}

function checkLiveRepository(contract) {
  let nameWithOwner;
  try {
    nameWithOwner = gh(['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']);
  } catch (error) {
    failures.push(
      `GitHub API evidence needs an authenticated \`gh\` CLI (run with --local to skip): ${error.message}`,
    );
    return;
  }

  checkLiveRuleset(contract, nameWithOwner);
  checkLiveLabels(nameWithOwner);
}

function checkLiveRuleset(contract, nameWithOwner) {
  const failuresBefore = failures.length;
  let rulesets;
  try {
    rulesets = JSON.parse(gh(['api', `repos/${nameWithOwner}/rulesets`]));
  } catch (error) {
    failures.push(`Cannot list rulesets for ${nameWithOwner}: ${error.message}`);
    return;
  }

  const matches = rulesets.filter((candidate) => candidate.name === contract.name);
  if (matches.length === 0) {
    failures.push(
      `Repository ${nameWithOwner} has no ruleset named "${contract.name}"; ` +
        `create or update it from ${relative(root, rulesetPath)}.`,
    );
    return;
  }
  if (matches.length > 1) {
    failures.push(
      `Repository ${nameWithOwner} has ${matches.length} rulesets named "${contract.name}" ` +
        `(ids ${matches.map((candidate) => candidate.id).join(', ')}); ` +
        'remove the duplicates so the contract targets one ruleset unambiguously.',
    );
    return;
  }
  const summary = matches[0];

  let live;
  try {
    live = JSON.parse(gh(['api', `repos/${nameWithOwner}/rulesets/${summary.id}`]));
  } catch (error) {
    failures.push(`Cannot read ruleset ${summary.id} for ${nameWithOwner}: ${error.message}`);
    return;
  }

  if (live.enforcement !== contract.enforcement) {
    failures.push(
      `Ruleset "${contract.name}" enforcement is "${live.enforcement}", expected "${contract.enforcement}".`,
    );
  }
  if (live.target !== contract.target) {
    failures.push(
      `Ruleset "${contract.name}" target is "${live.target}", expected "${contract.target}".`,
    );
  }
  const expectedConditions = canonicalJson(contract.conditions ?? null);
  const liveConditions = canonicalJson(live.conditions ?? null);
  if (liveConditions !== expectedConditions) {
    failures.push(
      `Ruleset "${contract.name}" conditions drifted from the checked-in contract: ` +
        `live ${liveConditions} != expected ${expectedConditions}.`,
    );
  }
  const expectedBypass = canonicalJson(contract.bypass_actors ?? []);
  const liveBypass = canonicalJson(live.bypass_actors ?? []);
  if (liveBypass !== expectedBypass) {
    failures.push(
      `Ruleset "${contract.name}" bypass actors drifted from the checked-in contract ` +
        `(a bypass actor defeats the required checks): live ${liveBypass} != expected ${expectedBypass}.`,
    );
  }

  const contractRuleTypes = (contract.rules ?? []).map((rule) => rule.type);
  const liveRuleTypes = (live.rules ?? []).map((rule) => rule.type);
  compareStringSets('rule types', contractRuleTypes, liveRuleTypes);

  const contractStatus = ruleByType(contract, 'required_status_checks');
  const liveStatus = ruleByType(live, 'required_status_checks');
  if (contractStatus && liveStatus) {
    for (const flag of ['strict_required_status_checks_policy', 'do_not_enforce_on_create']) {
      if (liveStatus.parameters?.[flag] !== contractStatus.parameters?.[flag]) {
        failures.push(
          `Ruleset "${contract.name}" ${flag} is ${JSON.stringify(liveStatus.parameters?.[flag])}, ` +
            `expected ${JSON.stringify(contractStatus.parameters?.[flag])}.`,
        );
      }
    }
    compareStringSets(
      'required check contexts',
      contractStatus.parameters.required_status_checks.map(describeContext),
      (liveStatus.parameters?.required_status_checks ?? []).map(describeContext),
    );
  }

  const contractPullRequest = ruleByType(contract, 'pull_request');
  const livePullRequest = ruleByType(live, 'pull_request');
  if (contractPullRequest && livePullRequest) {
    const expected = canonicalJson(contractPullRequest.parameters);
    const actual = canonicalJson(livePullRequest.parameters);
    if (expected !== actual) {
      failures.push(
        `Ruleset "${contract.name}" pull_request rule drifted from the checked-in contract: ` +
          `live ${actual} != expected ${expected}.`,
      );
    }
  }

  if (failures.length === failuresBefore) {
    evidence.push(
      `Live ruleset "${contract.name}" (${nameWithOwner} id ${summary.id}) is ${live.enforcement} ` +
        `and requires ${requiredContexts(contract).length} status checks with a strict ` +
        'up-to-date-branch policy.',
    );
  }
}

function checkLiveLabels(nameWithOwner) {
  let labels;
  try {
    labels = JSON.parse(gh(['api', `repos/${nameWithOwner}/labels`, '--paginate']));
  } catch (error) {
    failures.push(`Cannot list labels for ${nameWithOwner}: ${error.message}`);
    return;
  }

  for (const name of requiredLabels) {
    const label = labels.find((candidate) => candidate.name === name);
    if (!label) {
      failures.push(`Repository ${nameWithOwner} is missing the "${name}" label.`);
      continue;
    }
    if (typeof label.description !== 'string' || label.description.trim() === '') {
      failures.push(
        `Label "${name}" must carry a nonblank description matching the domain model.`,
      );
      continue;
    }
    evidence.push(`Label "${name}" exists: ${label.description}`);
  }
}

function requiredContexts(contract) {
  return ruleByType(contract, 'required_status_checks')?.parameters?.required_status_checks ?? [];
}

function ruleByType(ruleset, type) {
  return (ruleset.rules ?? []).find((rule) => rule.type === type) ?? null;
}

function describeContext(check) {
  return `${check.context} (app ${check.integration_id ?? 'any'})`;
}

function compareStringSets(what, expected, actual) {
  for (const [label, values] of [
    ['checked-in contract', expected],
    ['live ruleset', actual],
  ]) {
    for (const value of new Set(values.filter((v, i) => values.indexOf(v) !== i))) {
      failures.push(`The ${label} lists duplicate ${what}: ${value}.`);
    }
  }
  const missing = expected.filter((value) => !actual.includes(value));
  const unexpected = actual.filter((value) => !expected.includes(value));
  for (const value of missing) failures.push(`Live ruleset is missing ${what}: ${value}.`);
  for (const value of unexpected) failures.push(`Live ruleset has unexpected ${what}: ${value}.`);
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}

function gh(ghArgs) {
  return execFileSync('gh', ghArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
