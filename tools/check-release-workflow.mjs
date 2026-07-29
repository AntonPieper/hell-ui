// Static release-workflow contract (ADR 0003).
//
// Parses .github/workflows/npm-publish.yml, release-gate.yml, and
// release-drift.yml and proves the publish-last graph without live
// publication: GitHub Packages precedes every other Required Registry, the
// Required Registry barrier precedes draft creation, GitHub Release
// publication follows successful draft verification, and manual workflow
// dispatch stays evidence-only — it can run the gate and the projection plan
// but never publish a registry package, create a draft, or publish a GitHub
// Release.
//
// It also proves the two post-publication trust properties: nothing publishes
// while the repository's native immutable-release policy is unproven, and the
// drift workflow that watches a published projection is detection-only — it
// holds read-only permissions, uses no action outside a small allowlist, runs
// no mutating command, passes no write-capable flag to `gh api`, and consumes
// no secrets. Because the publish workflow carries no `release` trigger, a
// drift rerun or an unrelated release edit can never publish a registry
// package or create another release.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const releaseWorkflowPath = '.github/workflows/npm-publish.yml';
const releaseGatePath = '.github/workflows/release-gate.yml';
const driftWorkflowPath = '.github/workflows/release-drift.yml';

const pushTagGuard = "github.event_name == 'push' && startsWith(github.ref, 'refs/tags/v')";
const immutabilityJobId = 'release-immutability';

export function collectReleaseWorkflowErrors({ root }) {
  const errors = [];
  const workflow = readWorkflow(root, releaseWorkflowPath, errors);
  const gate = readWorkflow(root, releaseGatePath, errors);
  const drift = readWorkflow(root, driftWorkflowPath, errors);
  if (!workflow || !gate || !drift) return errors;

  checkTriggersAndPermissions(workflow, gate, errors);
  checkRegistryOrdering(workflow, errors);
  checkProjectionBarrier(workflow, errors);
  checkPublishLast(workflow, errors);
  checkEvidenceOnlyDispatch(workflow, gate, errors);
  checkImmutabilityGate(workflow, errors);
  checkDriftDetectionOnly(drift, root, errors);
  return errors;
}

function readWorkflow(root, path, errors) {
  const absolute = join(root, path);
  if (!existsSync(absolute)) {
    errors.push(`Missing ${path}.`);
    return null;
  }
  try {
    const parsed = parse(readFileSync(absolute, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || typeof parsed.jobs !== 'object') {
      errors.push(`${path} must define workflow jobs.`);
      return null;
    }
    return parsed;
  } catch (error) {
    errors.push(`${path} must be valid YAML: ${error.message}`);
    return null;
  }
}

function job(workflow, id, errors) {
  const found = workflow.jobs?.[id];
  if (!found) errors.push(`${releaseWorkflowPath} must define the \`${id}\` job.`);
  return found ?? null;
}

function needsOf(jobDefinition) {
  const needs = jobDefinition?.needs;
  if (typeof needs === 'string') return [needs];
  return Array.isArray(needs) ? needs : [];
}

function condition(jobDefinition) {
  return typeof jobDefinition?.if === 'string' ? jobDefinition.if : '';
}

function runSteps(jobDefinition) {
  const steps = Array.isArray(jobDefinition?.steps) ? jobDefinition.steps : [];
  return steps.map((step) => (typeof step?.run === 'string' ? step.run : ''));
}

function checkTriggersAndPermissions(workflow, gate, errors) {
  if (!workflow.on?.push?.tags?.includes('v*.*.*')) {
    errors.push(`${releaseWorkflowPath} must trigger on v*.*.* tag pushes.`);
  }
  if (!('workflow_dispatch' in (workflow.on ?? {}))) {
    errors.push(`${releaseWorkflowPath} must keep evidence-only workflow_dispatch runs.`);
  }
  if ('release' in (workflow.on ?? {})) {
    errors.push(
      `${releaseWorkflowPath} must not trigger on release events; a release edit or a rerun of ` +
        'the drift check can never cause registry publication or create another release.',
    );
  }
  if (workflow.permissions?.contents !== 'read') {
    errors.push(`${releaseWorkflowPath} must keep top-level \`permissions.contents: read\`.`);
  }
  if (gate.permissions?.contents !== 'read') {
    errors.push(`${releaseGatePath} must keep \`permissions.contents: read\`; the gate never publishes.`);
  }
  const gateJob = workflow.jobs?.['release-gate'];
  if (gateJob?.uses !== './.github/workflows/release-gate.yml') {
    errors.push(`${releaseWorkflowPath} must run the shared release gate via ${releaseGatePath}.`);
  }
}

// Release gate → GitHub Packages → every other configured Required Registry.
function checkRegistryOrdering(workflow, errors) {
  const githubPackages = job(workflow, 'publish-github-packages', errors);
  if (githubPackages) {
    if (!needsOf(githubPackages).includes('release-gate')) {
      errors.push('publish-github-packages must need release-gate; only a gated tarball publishes.');
    }
    if (!condition(githubPackages).includes(pushTagGuard)) {
      errors.push(`publish-github-packages must be guarded by \`${pushTagGuard}\`.`);
    }
  }

  const npm = job(workflow, 'publish-npm', errors);
  if (npm) {
    const needs = needsOf(npm);
    if (!needs.includes('release-gate') || !needs.includes('publish-github-packages')) {
      errors.push(
        'publish-npm must need release-gate and publish-github-packages; ' +
          'GitHub Packages publishes before every other Required Registry.',
      );
    }
    if (!condition(npm).includes(pushTagGuard)) {
      errors.push(`publish-npm must be guarded by \`${pushTagGuard}\`.`);
    }
    if (!condition(npm).includes("vars.HELL_ENABLE_NPMJS_PUBLISH == 'true'")) {
      errors.push('publish-npm must stay behind the HELL_ENABLE_NPMJS_PUBLISH switch.');
    }
  }
}

// The Required Registry barrier precedes draft creation, and the draft job
// evaluates the fixture-tested policy over the actual registry results.
function checkProjectionBarrier(workflow, errors) {
  const draft = job(workflow, 'draft-github-release', errors);
  if (!draft) return;

  const needs = needsOf(draft);
  if (!needs.includes('publish-github-packages') || !needs.includes('publish-npm')) {
    errors.push('draft-github-release must need every Required Registry job before drafting.');
  }
  const draftIf = condition(draft);
  if (!draftIf.includes('!cancelled()') || !draftIf.includes(pushTagGuard)) {
    errors.push(
      'draft-github-release must run under `!cancelled()` with the push-tag guard so the ' +
        'barrier blocks loudly instead of being skipped silently.',
    );
  }
  if (draft.permissions?.contents !== 'write') {
    errors.push('draft-github-release must request `contents: write` to create the draft.');
  }

  const runs = runSteps(draft);
  const barrierIndex = runs.findIndex((run) => run.includes('release-projection.mjs barrier'));
  const createIndex = runs.findIndex((run) => run.includes('gh api') && run.includes('/releases'));
  if (barrierIndex === -1) {
    errors.push('draft-github-release must evaluate `release-projection.mjs barrier` over the registry results.');
  } else if (createIndex !== -1 && barrierIndex > createIndex) {
    errors.push('draft-github-release must evaluate the Required Registry barrier before touching GitHub releases.');
  } else {
    // The barrier must read the actual registry job results, never hardcoded
    // outcomes, and every registry it evaluates must also gate this job's
    // `needs` — a future registry added to one side but not the other fails
    // here instead of silently weakening the barrier.
    const barrierStep = draft.steps?.[barrierIndex] ?? null;
    const registriesEnv =
      typeof barrierStep?.env?.HELL_REQUIRED_REGISTRIES === 'string'
        ? barrierStep.env.HELL_REQUIRED_REGISTRIES
        : '';
    for (const registryJob of ['publish-github-packages', 'publish-npm']) {
      if (!registriesEnv.includes(`needs.${registryJob}.result`)) {
        errors.push(
          `The Required Registry barrier must evaluate the actual \`needs.${registryJob}.result\`; ` +
            'hardcoded registry outcomes cannot pass.',
        );
      }
    }
    for (const [, registryJob] of registriesEnv.matchAll(/needs\.([A-Za-z0-9_-]+)\.result/g)) {
      if (!needs.includes(registryJob)) {
        errors.push(
          `The Required Registry barrier reads \`needs.${registryJob}.result\`, but ` +
            `draft-github-release does not list \`${registryJob}\` in its needs; every barrier ` +
            'registry must also gate the draft job.',
        );
      }
    }
  }
  if (!runs.some((run) => run.includes('release-projection.mjs plan'))) {
    errors.push('draft-github-release must plan the projection from the tagged artifacts.');
  }
  if (!runs.some((run) => run.includes('release-projection.mjs verify') && run.includes('--phase projection'))) {
    errors.push('draft-github-release must verify the draft projection before publication.');
  }
}

// Publication is last and follows only a successful draft verification.
function checkPublishLast(workflow, errors) {
  const publish = job(workflow, 'publish-github-release', errors);
  if (!publish) return;

  if (!needsOf(publish).includes('draft-github-release')) {
    errors.push('publish-github-release must need draft-github-release.');
  }
  const publishIf = condition(publish);
  if (!publishIf.includes(pushTagGuard)) {
    errors.push(`publish-github-release must be guarded by \`${pushTagGuard}\`.`);
  }
  if (/always\(\)|!cancelled\(\)|failure\(\)/.test(publishIf)) {
    errors.push(
      'publish-github-release must not override the default success gate; publication follows ' +
        'only a fully verified draft.',
    );
  }
  const runs = runSteps(publish);
  const verifyIndex = runs.findIndex(
    (run) => run.includes('release-projection.mjs verify') && run.includes('--phase projection'),
  );
  const publishIndex = runs.findIndex((run) => run.includes('--method PATCH') && run.includes('/releases/'));
  if (verifyIndex === -1 || publishIndex === -1 || verifyIndex > publishIndex) {
    errors.push('publish-github-release must re-verify the draft projection before publishing it.');
  }
  if (!runs.some((run) => run.includes('release-projection.mjs verify') && run.includes('--phase published'))) {
    errors.push('publish-github-release must verify the published projection last.');
  }
}

// Manual dispatch produces evidence only: the gate and the projection plan
// run, while every job that publishes a package or touches GitHub releases
// stays behind the push-tag guard.
function checkEvidenceOnlyDispatch(workflow, gate, errors) {
  for (const [id, definition] of Object.entries(workflow.jobs ?? {})) {
    if (id === 'release-gate' || id === 'release-projection-plan') continue;
    if (!condition(definition).includes("github.event_name == 'push'")) {
      errors.push(`Job \`${id}\` must be guarded by \`github.event_name == 'push'\`; dispatch is evidence-only.`);
    }
  }

  const plan = job(workflow, 'release-projection-plan', errors);
  if (plan) {
    if (condition(plan) !== "github.event_name == 'workflow_dispatch'") {
      errors.push('release-projection-plan must run only on workflow_dispatch.');
    }
    if (!needsOf(plan).includes('release-gate')) {
      errors.push('release-projection-plan must need release-gate; evidence covers the complete gate.');
    }
    if (plan.permissions?.contents !== 'read') {
      errors.push('release-projection-plan must stay read-only; evidence never publishes.');
    }
    if (!runSteps(plan).some((run) => run.includes('release-projection.mjs plan --evidence'))) {
      errors.push('release-projection-plan must run `release-projection.mjs plan --evidence`.');
    }
  }

  const gateRuns = Object.values(gate.jobs ?? {}).flatMap((definition) => runSteps(definition));
  if (gateRuns.some((run) => /\bpnpm publish\b|\bgh release\b|--method POST/.test(run))) {
    errors.push(`${releaseGatePath} must never publish packages or releases; it only produces evidence.`);
  }
}

// Nothing publishes while the repository's native immutable-release policy
// is unproven. The gate itself evaluates the captured policy through the
// fixture-tested seam rather than a second shell implementation, and every
// job that publishes a package or writes a GitHub release must depend on it —
// directly or transitively, so the requirement survives a rewrite of the
// job graph.
function checkImmutabilityGate(workflow, errors) {
  const gate = job(workflow, immutabilityJobId, errors);
  if (gate) {
    if (gate.permissions?.contents !== 'read') {
      errors.push(`${immutabilityJobId} must stay read-only; the gate reads policy evidence and publishes nothing.`);
    }
    const gateRuns = runSteps(gate).join('\n');
    const evidencePath = /release-projection\.mjs policy\s+"?([^"\s]+)"?/.exec(gateRuns)?.[1] ?? null;
    if (evidencePath === null) {
      errors.push(
        `${immutabilityJobId} must evaluate the captured immutable-releases policy through ` +
          '`release-projection.mjs policy`, so the gate and draft verification share one decision.',
      );
    } else if (
      // The capture must read the immutable-releases endpoint and write the
      // very file the seam then judges. The endpoint has to match in the
      // *request*, before any redirect: the evidence filename embeds the same
      // words, so matching the whole line would accept a capture of some
      // other endpoint that merely redirects into immutable-releases.json.
      !gateRuns.split('\n').some((line) => {
        const request = line.split('>')[0];
        return (
          /\bgh api\b/.test(request) &&
          /\/immutable-releases(["'\s]|$)/.test(request) &&
          line.includes(evidencePath)
        );
      })
    ) {
      errors.push(
        `${immutabilityJobId} must capture the repository \`immutable-releases\` endpoint with ` +
          `\`gh api\` into ${evidencePath}, the same evidence file it then judges.`,
      );
    }
  }

  for (const [id, definition] of Object.entries(workflow.jobs ?? {})) {
    if (id === immutabilityJobId) continue;
    // A registry publish, a `gh release` command, or a write-capable `gh api`
    // call. Read-only capture steps are not publication, so a future job that
    // only reads releases is not forced behind the gate.
    const runs = runSteps(definition).join('\n');
    const publishes =
      /\b(pnpm|npm|yarn)\s+publish\b/.test(runs) ||
      /\bgh\s+release\b/.test(runs) ||
      (/\bgh api\b/.test(runs) && ghApiWriteFlag.test(runs));
    if (publishes && !transitiveNeeds(workflow, id).has(immutabilityJobId)) {
      errors.push(
        `Job \`${id}\` publishes a package or writes a GitHub release without depending on the ` +
          `\`${immutabilityJobId}\` gate; publication refuses to proceed while the repository's ` +
          'immutable-release policy is unproven.',
      );
    }
  }
}

// The drift workflow watches a published projection and may only ever look —
// but "may only look" is worthless if it stops looking. `checkDriftDetects`
// pins that it still runs the comparison; everything below pins that the
// comparison is all it can do.
function checkDriftDetectionOnly(drift, root, errors) {
  const label = driftWorkflowPath;
  checkDriftDetects(drift, errors);

  const triggers = drift.on ?? {};
  if (Object.keys(triggers).join(',') !== 'release') {
    errors.push(`${label} must trigger on the release event only; found ${describe(Object.keys(triggers))}.`);
  }
  if (!Array.isArray(triggers.release?.types) || triggers.release.types.join(',') !== 'edited') {
    errors.push(
      `${label} must run for the edited release activity type only; found ${describe(triggers.release?.types)}.`,
    );
  }
  if (!isReadOnlyPermissions(drift.permissions)) {
    errors.push(
      `${label} must hold exactly \`contents: read\` so drift detection can never edit release ` +
        `metadata, notes, tags, or assets; found ${describe(drift.permissions)}.`,
    );
  }
  if (readFileSync(join(root, driftWorkflowPath), 'utf8').includes('secrets.')) {
    errors.push(`${label} must not consume repository secrets; the drift check reads with the workflow token.`);
  }

  const jobs = Object.entries(drift.jobs ?? {});
  if (jobs.length === 0) errors.push(`${label} must define the drift job.`);
  for (const [id, definition] of jobs) {
    if (definition.permissions !== undefined && !isReadOnlyPermissions(definition.permissions)) {
      errors.push(
        `${label} job \`${id}\` must not widen permissions beyond \`contents: read\`; ` +
          `found ${describe(definition.permissions)}.`,
      );
    }
    for (const step of Array.isArray(definition.steps) ? definition.steps : []) {
      if (typeof step.uses === 'string' && !driftAllowedUses.some((pattern) => pattern.test(step.uses))) {
        errors.push(
          `${label} job \`${id}\` uses \`${step.uses}\`, which is outside the read-only drift ` +
            'allowlist (checkout and Node setup only; the drift check is dependency-free).',
        );
      }
      if (typeof step.run !== 'string') continue;
      for (const [pattern, what] of mutationRunPatterns) {
        if (pattern.test(step.run)) {
          errors.push(`${label} job \`${id}\` runs ${what}; the drift workflow is detection-only.`);
        }
      }
      for (const line of step.run.split('\n')) {
        if (line.includes('gh api') && ghApiWriteFlag.test(line)) {
          errors.push(
            `${label} job \`${id}\` passes a write-capable flag to \`gh api\` (${line.trim()}); ` +
              'the drift workflow may only read.',
          );
        }
      }
    }
  }
}

// Drift detection has to actually detect. A workflow that silently stops
// comparing reports success for every release edit forever, which is worse
// than having no check at all, so each input the comparison depends on is
// pinned positively:
//
// - the entry script still runs;
// - the captured release JSON reaches it;
// - the tag commit is captured (the entry refuses to default it, so a
//   dropped capture step fails the run rather than passing trivially);
// - the checkout stays at the commit the release event delivers. A `ref:`
//   pointing anywhere else — `main` above all — would read
//   `.changes/<version>.md` from a mutable branch instead of the locked tag,
//   which is the whole trust model inverted.
function checkDriftDetects(drift, errors) {
  const label = driftWorkflowPath;
  const steps = Object.values(drift.jobs ?? {}).flatMap((definition) =>
    Array.isArray(definition?.steps) ? definition.steps : [],
  );
  // Shell comments are stripped before these positive assertions run: a
  // commented-out invocation satisfies a plain substring match while the
  // workflow does nothing, which is the exact failure they exist to catch.
  // The mutation scans below match raw text instead — a commented-out
  // mutating command failing the contract is the conservative direction.
  const runs = steps
    .flatMap((step) => (typeof step?.run === 'string' ? step.run.split('\n') : []))
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n');

  if (!runs.includes('check-release-drift.mjs')) {
    errors.push(
      `${label} must run \`node tools/check-release-drift.mjs\`; without it every release edit ` +
        'reports success and the projection is no longer watched.',
    );
  }
  if (!steps.some((step) => typeof step?.env?.HELL_RELEASE_JSON === 'string')) {
    errors.push(`${label} must pass the captured release JSON to the drift check as HELL_RELEASE_JSON.`);
  }
  if (!runs.includes('HELL_TAG_COMMIT')) {
    errors.push(
      `${label} must capture HELL_TAG_COMMIT; the drift check refuses to run without it rather ` +
        'than comparing the tag against itself.',
    );
  }
  for (const step of steps) {
    if (typeof step?.uses !== 'string' || !/^actions\/checkout@/.test(step.uses)) continue;
    const ref = step.with?.ref;
    if (ref !== undefined && ref !== '${{ github.ref }}') {
      errors.push(
        `${label} must check out the commit the release event delivers, not ${describe(ref)}; ` +
          'the Released Version Notes must be read from the locked release tag rather than a ' +
          'mutable branch.',
      );
    }
  }
}

// Actions the read-only drift workflow may use. Everything else — release,
// tag, upload, or publish actions included — is a contract violation.
const driftAllowedUses = [/^actions\/checkout@/, /^actions\/setup-node@/];

const mutationRunPatterns = [
  [/\bgh\s+release\b/, 'a gh release command (view, edit, create, delete, or upload)'],
  [/\b(pnpm|npm|yarn)\s+publish\b/, 'a registry publish command'],
  [/\bgit\s+push\b/, 'git push'],
  [/\bgit\s+tag\b/, 'git tag'],
  // The comparison must read the tree the checkout action delivered. A git
  // command could swap `.changes/<version>.md` for a mutable branch's copy
  // without ever touching the checkout step's `ref:`, which is the same
  // trust inversion by another route. The drift workflow needs no git.
  [/\bgit\s+(checkout|restore|switch|reset|fetch|pull|merge)\b/, 'a git command that can swap the checked-out tree'],
  [/\bchangie\b/, 'a Changie primitive'],
];

// `gh api` defaults to GET; any of these flags can turn a call into a write.
const ghApiWriteFlag =
  /(^|\s)(--method(=|\s|$)|-X\b|--field(=|\s|$)|--raw-field(=|\s|$)|--input(=|\s|$)|-f\b|-F\b)/;

function transitiveNeeds(workflow, id, seen = new Set()) {
  for (const need of needsOf(workflow.jobs?.[id])) {
    if (seen.has(need)) continue;
    seen.add(need);
    transitiveNeeds(workflow, need, seen);
  }
  return seen;
}

function isReadOnlyPermissions(permissions) {
  return (
    typeof permissions === 'object' &&
    permissions !== null &&
    Object.keys(permissions).join(',') === 'contents' &&
    permissions.contents === 'read'
  );
}

function describe(value) {
  return value === undefined ? '(none)' : JSON.stringify(value);
}
