// Static workflow trust contracts for the three-state pull-request checks
// (ADR 0003).
//
// These assertions parse the checked-in GitHub workflow definitions and prove
// the privileged/unprivileged split without running CI: the privileged
// pull_request_target workflow consumes GitHub metadata only (base-branch
// checkout, no head ref, no dependency installation, no untrusted data in any
// command or expression), the read-only content workflow stays on the
// unprivileged pull_request trigger, both keep read-only permissions, and the
// stable check-context job names survive for staged ruleset activation.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const workflowsDir = '.github/workflows';
const trustedWorkflowFile = 'pr-state.yml';
const contentWorkflowFile = 'pr-content.yml';

// Stable check-context job names; staged ruleset activation pins these.
const trustedCheckContext = 'PR state (metadata)';
const contentCheckContext = 'Release notes (content)';

// The privileged trigger must re-evaluate the state when labels change.
const trustedEventTypes = ['opened', 'synchronize', 'reopened', 'labeled', 'unlabeled'];

// Every GitHub expression the privileged workflow may evaluate. All of these
// are runner-trusted values; nothing here is contributor-authored content.
const trustedExpressionAllowlist = [
  'github.token',
  'github.repository',
  'github.event.pull_request.number',
];

// Actions the privileged workflow may use. actions/checkout without a `ref`
// checks out the trusted base branch on pull_request_target.
const trustedActionAllowlist = [/^actions\/checkout@/, /^actions\/setup-node@/];

export function collectWorkflowTrustContractErrors({ root }) {
  const errors = [];
  const dir = join(root, workflowsDir);
  if (!existsSync(dir)) return [`Missing ${workflowsDir} directory.`];

  const workflowFiles = readdirSync(dir)
    .filter((name) => /\.ya?ml$/.test(name))
    .sort();

  const workflows = new Map();
  for (const name of workflowFiles) {
    try {
      workflows.set(name, parse(readFileSync(join(dir, name), 'utf8')));
    } catch (error) {
      errors.push(`${workflowsDir}/${name} must be valid YAML: ${error.message}`);
    }
  }

  // The privileged pull_request_target trigger exists exactly once, in the
  // trusted metadata workflow; no other workflow may quietly gain it.
  for (const [name, workflow] of workflows) {
    const triggers = Object.keys(workflow?.on ?? {});
    if (triggers.includes('pull_request_target') && name !== trustedWorkflowFile) {
      errors.push(
        `${workflowsDir}/${name} uses pull_request_target; the privileged metadata trigger is ` +
          `reserved for ${workflowsDir}/${trustedWorkflowFile}.`,
      );
    }
  }

  errors.push(...collectTrustedWorkflowErrors(workflows.get(trustedWorkflowFile)));
  errors.push(...collectContentWorkflowErrors(workflows.get(contentWorkflowFile)));
  return errors;
}

function collectTrustedWorkflowErrors(workflow) {
  const label = `${workflowsDir}/${trustedWorkflowFile}`;
  if (!workflow) return [`Missing ${label}: the trusted PR-state metadata workflow.`];
  const errors = [];

  const trigger = workflow.on?.pull_request_target;
  if (!trigger) {
    errors.push(`${label} must trigger on pull_request_target so the base branch owns the check.`);
  } else {
    const types = Array.isArray(trigger.types) ? trigger.types : [];
    for (const type of trustedEventTypes) {
      if (!types.includes(type)) {
        errors.push(
          `${label} must include the "${type}" pull_request_target type so state and label changes ` +
            're-evaluate the check.',
        );
      }
    }
  }
  const extraTriggers = Object.keys(workflow.on ?? {}).filter((name) => name !== 'pull_request_target');
  if (extraTriggers.length > 0) {
    errors.push(`${label} must have no triggers beyond pull_request_target; found ${extraTriggers.join(', ')}.`);
  }

  errors.push(...collectReadOnlyPermissionErrors(workflow, label));

  const jobs = workflow.jobs ?? {};
  const jobNames = Object.values(jobs).map((job) => job?.name);
  if (!jobNames.includes(trustedCheckContext)) {
    errors.push(
      `${label} must keep the stable check-context job name "${trustedCheckContext}" for staged ` +
        'ruleset activation.',
    );
  }

  for (const [jobId, job] of Object.entries(jobs)) {
    for (const [index, step] of (job?.steps ?? []).entries()) {
      const stepLabel = `${label} job "${jobId}" step ${index + 1}`;

      if (step.uses !== undefined) {
        if (!trustedActionAllowlist.some((pattern) => pattern.test(step.uses))) {
          errors.push(
            `${stepLabel} uses ${step.uses}; the privileged workflow only runs checkout and ` +
              'setup-node actions.',
          );
        }
        if (/^actions\/checkout@/.test(step.uses ?? '') && step.with?.ref !== undefined) {
          errors.push(
            `${stepLabel} checks out an explicit ref (${step.with.ref}); the privileged workflow ` +
              'must keep the default trusted base checkout and never fetch pull-request content.',
          );
        }
      }

      if (typeof step.run === 'string') {
        if (step.run.includes('${{')) {
          errors.push(
            `${stepLabel} interpolates a workflow expression into a run block; untrusted content ` +
              'must never influence a privileged command — pass values through env instead.',
          );
        }
        if (/\b(pnpm|npm|npx|yarn)\b/.test(step.run)) {
          errors.push(
            `${stepLabel} invokes a package manager; the privileged workflow consumes metadata only ` +
              'and never installs or executes dependencies.',
          );
        }
      }
    }
  }

  for (const expression of collectExpressions(workflow)) {
    if (!trustedExpressionAllowlist.includes(expression)) {
      errors.push(
        `${label} evaluates the expression "\${{ ${expression} }}" outside the trusted allowlist ` +
          `(${trustedExpressionAllowlist.join(', ')}); untrusted content must never influence a ` +
          'privileged expression.',
      );
    }
  }

  const rawText = JSON.stringify(workflow);
  for (const forbidden of ['github.event.pull_request.head', 'github.head_ref', 'github.event.pull_request.body', 'github.event.pull_request.title']) {
    if (rawText.includes(forbidden)) {
      errors.push(`${label} references ${forbidden}; the privileged workflow must not consume it.`);
    }
  }

  return errors;
}

function collectContentWorkflowErrors(workflow) {
  const label = `${workflowsDir}/${contentWorkflowFile}`;
  if (!workflow) return [`Missing ${label}: the read-only PR content workflow.`];
  const errors = [];

  const triggers = Object.keys(workflow.on ?? {});
  if (!triggers.includes('pull_request')) {
    errors.push(`${label} must validate proposed content on the unprivileged pull_request trigger.`);
  }

  errors.push(...collectReadOnlyPermissionErrors(workflow, label));

  const jobNames = Object.values(workflow.jobs ?? {}).map((job) => job?.name);
  if (!jobNames.includes(contentCheckContext)) {
    errors.push(
      `${label} must keep the stable check-context job name "${contentCheckContext}" for staged ` +
        'ruleset activation.',
    );
  }

  return errors;
}

function collectReadOnlyPermissionErrors(workflow, label) {
  const errors = [];
  const permissions = workflow.permissions;
  if (JSON.stringify(permissions) !== JSON.stringify({ contents: 'read' })) {
    errors.push(`${label} must declare exactly \`permissions: contents: read\`.`);
  }
  for (const [jobId, job] of Object.entries(workflow.jobs ?? {})) {
    if (job && Object.hasOwn(job, 'permissions')) {
      errors.push(`${label} job "${jobId}" must not widen the workflow's read-only permissions.`);
    }
  }
  return errors;
}

// Collects `${{ ... }}` expressions from every string value in the parsed
// workflow. Parsing first keeps YAML comments out of the audit while every
// evaluated expression stays in.
function collectExpressions(node, found = []) {
  if (typeof node === 'string') {
    for (const match of node.matchAll(/\$\{\{([^}]*)\}\}/g)) {
      found.push(match[1].trim());
    }
  } else if (Array.isArray(node)) {
    for (const item of node) collectExpressions(item, found);
  } else if (typeof node === 'object' && node !== null) {
    for (const value of Object.values(node)) collectExpressions(value, found);
  }
  return found;
}
