// Static release-workflow contract (ADR 0003).
//
// Parses .github/workflows/npm-publish.yml and release-gate.yml and proves
// the publish-last graph without live publication: GitHub Packages precedes
// every other Required Registry, the Required Registry barrier precedes
// draft creation, GitHub Release publication follows successful draft
// verification, and manual workflow dispatch stays evidence-only — it can
// run the gate and the projection plan but never publish a registry package,
// create a draft, or publish a GitHub Release.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const releaseWorkflowPath = '.github/workflows/npm-publish.yml';
const releaseGatePath = '.github/workflows/release-gate.yml';

const pushTagGuard = "github.event_name == 'push' && startsWith(github.ref, 'refs/tags/v')";

export function collectReleaseWorkflowErrors({ root }) {
  const errors = [];
  const workflow = readWorkflow(root, releaseWorkflowPath, errors);
  const gate = readWorkflow(root, releaseGatePath, errors);
  if (!workflow || !gate) return errors;

  checkTriggersAndPermissions(workflow, gate, errors);
  checkRegistryOrdering(workflow, errors);
  checkProjectionBarrier(workflow, errors);
  checkPublishLast(workflow, errors);
  checkEvidenceOnlyDispatch(workflow, gate, errors);
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
