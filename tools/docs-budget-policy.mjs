import { existsSync, readFileSync } from 'node:fs';

export const DOCS_BUDGET_POLICY_PATH = 'docs/release/docs-budget-policy.md';

const REQUIRED_THRESHOLD_FIELDS = ['type', 'maximumWarning', 'maximumError', 'owner', 'rationale'];
const REQUIRED_ACCEPTED_WARNING_FIELDS = ['type', 'acceptedMaximum', 'owner', 'rationale', 'evidence', 'followUp'];

export function readDocsBudgetPolicy(path = DOCS_BUDGET_POLICY_PATH) {
  if (!existsSync(path)) {
    return { path, policy: null, errors: [`Missing docs budget policy at ${path}`] };
  }

  const content = readFileSync(path, 'utf8');
  const match = content.match(/```json docs-budget-policy\s*\r?\n([\s\S]*?)\r?\n```/);
  if (!match) {
    return {
      path,
      policy: null,
      errors: [`${path} must include a fenced \`json docs-budget-policy\` block`],
    };
  }

  try {
    return { path, policy: JSON.parse(match[1]), errors: [] };
  } catch (error) {
    return {
      path,
      policy: null,
      errors: [`${path} contains invalid docs budget policy JSON: ${error.message}`],
    };
  }
}

export function validateDocsBudgetPolicy(policy, budgets) {
  const errors = [];
  if (!policy || typeof policy !== 'object') {
    return ['Docs budget policy is missing or malformed.'];
  }

  if (policy.version !== 1) {
    errors.push('Docs budget policy version must be 1.');
  }

  if (!Array.isArray(policy.thresholds)) {
    errors.push('Docs budget policy must define a thresholds array.');
    return errors;
  }

  if (!Array.isArray(policy.acceptedWarnings)) {
    errors.push('Docs budget policy must define an acceptedWarnings array.');
  }

  const budgetTypes = new Set(budgets.map((budget) => budget.type));
  for (const budget of budgets) {
    const threshold = policy.thresholds.find((entry) => entry.type === budget.type);
    if (!threshold) {
      errors.push(`Docs budget policy must document the ${budget.type} budget threshold.`);
      continue;
    }

    for (const field of REQUIRED_THRESHOLD_FIELDS) {
      requireNonEmpty(threshold, field, `Docs budget policy threshold ${budget.type}`, errors);
    }

    compareBudgetField(threshold, budget, 'maximumWarning', errors);
    compareBudgetField(threshold, budget, 'maximumError', errors);
  }

  for (const threshold of policy.thresholds) {
    if (!budgetTypes.has(threshold.type)) {
      errors.push(`Docs budget policy documents unknown budget threshold ${threshold.type}.`);
    }
  }

  for (const warning of policy.acceptedWarnings ?? []) {
    if (!budgetTypes.has(warning.type)) {
      errors.push(`Docs budget policy accepts an unknown budget warning ${warning.type}.`);
    }

    for (const field of REQUIRED_ACCEPTED_WARNING_FIELDS) {
      requireNonEmpty(warning, field, `Docs budget accepted warning ${warning.type ?? '<missing type>'}`, errors);
    }

    const threshold = policy.thresholds.find((entry) => entry.type === warning.type);
    const acceptedMaximumBytes = parseBudgetSize(warning.acceptedMaximum);
    if (!Number.isFinite(acceptedMaximumBytes)) {
      errors.push(`Docs budget accepted warning ${warning.type} acceptedMaximum is not a supported size.`);
      continue;
    }

    const maximumWarningBytes = parseBudgetSize(threshold?.maximumWarning);
    const maximumErrorBytes = parseBudgetSize(threshold?.maximumError);
    if (Number.isFinite(maximumWarningBytes) && acceptedMaximumBytes <= maximumWarningBytes) {
      errors.push(`Docs budget accepted warning ${warning.type} acceptedMaximum must be above maximumWarning.`);
    }
    if (Number.isFinite(maximumErrorBytes) && acceptedMaximumBytes > maximumErrorBytes) {
      errors.push(`Docs budget accepted warning ${warning.type} acceptedMaximum must not exceed maximumError.`);
    }
  }

  return errors;
}

export function classifyDocsBudget({ type, currentBytes, budget, policy }) {
  const maximumWarningBytes = parseBudgetSize(budget?.maximumWarning);
  const maximumErrorBytes = parseBudgetSize(budget?.maximumError);
  const acceptedWarning = findAcceptedWarning(policy, type);
  const acceptedMaximumBytes = parseBudgetSize(acceptedWarning?.acceptedMaximum);

  if (!Number.isFinite(currentBytes)) {
    return { type, state: 'unknown', severity: 'unknown', currentBytes, maximumWarningBytes, maximumErrorBytes };
  }

  if (Number.isFinite(maximumErrorBytes) && currentBytes > maximumErrorBytes) {
    return {
      type,
      state: 'regression',
      severity: 'error',
      currentBytes,
      maximumWarningBytes,
      maximumErrorBytes,
      overBytes: currentBytes - maximumErrorBytes,
      acceptedMaximumBytes,
      acceptedWarning: null,
    };
  }

  if (Number.isFinite(maximumWarningBytes) && currentBytes > maximumWarningBytes) {
    if (acceptedWarning && Number.isFinite(acceptedMaximumBytes) && currentBytes <= acceptedMaximumBytes) {
      return {
        type,
        state: 'accepted',
        severity: 'warning',
        reason: 'acceptedWarning',
        currentBytes,
        maximumWarningBytes,
        maximumErrorBytes,
        acceptedMaximumBytes,
        overBytes: currentBytes - maximumWarningBytes,
        acceptedWarning,
      };
    }

    return {
      type,
      state: 'regression',
      severity: 'warning',
      reason: acceptedWarning ? 'acceptedMaximumExceeded' : 'undocumentedWarning',
      currentBytes,
      maximumWarningBytes,
      maximumErrorBytes,
      acceptedMaximumBytes,
      overBytes: acceptedWarning && Number.isFinite(acceptedMaximumBytes)
        ? currentBytes - acceptedMaximumBytes
        : currentBytes - maximumWarningBytes,
      warningOverBytes: currentBytes - maximumWarningBytes,
      acceptedWarning,
    };
  }

  return {
    type,
    state: 'within',
    severity: 'ok',
    currentBytes,
    maximumWarningBytes,
    maximumErrorBytes,
    overBytes: 0,
    acceptedWarning: null,
  };
}

export function blockingDocsBudgetMessages(statuses) {
  return statuses
    .filter((status) => status.state === 'regression')
    .map((status) => {
      if (status.severity === 'error') {
        return `${status.type} exceeds the error budget by ${formatBytes(status.overBytes)}.`;
      }
      if (status.reason === 'acceptedMaximumExceeded') {
        return `${status.type} exceeds its accepted warning ceiling by ${formatBytes(status.overBytes)}.`;
      }
      return `${status.type} has an undocumented warning overage of ${formatBytes(status.overBytes)}.`;
    });
}

export function parseBudgetSize(value) {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb)$/i);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === 'b') return amount;
  if (unit === 'kb') return amount * 1000;
  return amount * 1000 * 1000;
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return 'n/a';
  if (bytes < 1000) return `${Math.round(bytes)} B`;
  return `${(bytes / 1000).toFixed(2)} kB`;
}

function compareBudgetField(threshold, budget, field, errors) {
  const policyBytes = parseBudgetSize(threshold[field]);
  const angularBytes = parseBudgetSize(budget[field]);

  if (!Number.isFinite(policyBytes)) {
    errors.push(`Docs budget policy threshold ${threshold.type}.${field} is not a supported size.`);
    return;
  }

  if (!Number.isFinite(angularBytes)) {
    errors.push(`Angular budget ${budget.type}.${field} is not a supported size.`);
    return;
  }

  if (Math.abs(policyBytes - angularBytes) > 0.1) {
    errors.push(
      `Docs budget policy threshold ${threshold.type}.${field} (${threshold[field]}) must match angular.json (${budget[field]}).`,
    );
  }
}

function requireNonEmpty(entry, field, label, errors) {
  if (typeof entry[field] !== 'string' || entry[field].trim().length === 0) {
    errors.push(`${label} must include ${field}.`);
  }
}

function findAcceptedWarning(policy, type) {
  return (policy?.acceptedWarnings ?? []).find((warning) => warning.type === type) ?? null;
}
