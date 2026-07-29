// The protected-`main` policy seam: what `.gitlab/policy/protect-main.json`
// means, and how it compares to the four REST surfaces that carry it
// (project settings, protected branches, protected tags, labels).
//
// Everything here is pure. `readMainPolicy` decides whether a policy document
// is a coherent posture at all; `verifyMainPolicy` reports how the live
// project differs from it; `mainPolicyRestorePlan` turns the same comparison
// into the requests that write the policy back. Restoration deriving from the
// comparison is the point: a surface the verifier does not check can never be
// restored behind its back, and a drift it does report always has a named
// repair.
//
// Reading the API, and any writing at all, belongs to the two commands that
// wrap this file — tools/check-main-policy.mjs and tools/restore-main-policy.mjs.

import { noConsumerChangeLabel, releasePreparationLabel } from './pr-state-policy.mjs';

export const policyRelativePath = '.gitlab/policy/protect-main.json';

// The enforcement-relevant project settings. This list is closed in both
// directions: a document that drops a key is rejected rather than quietly
// stopping to check it, and one that adds a key is rejected rather than
// comparing a setting nobody agreed to enforce.
export const recordedProjectSettings = [
  'merge_method',
  'squash_option',
  'squash_commit_template',
  'only_allow_merge_if_pipeline_succeeds',
  'allow_merge_on_skipped_pipeline',
  'only_allow_merge_if_all_discussions_are_resolved',
  'ci_allow_fork_pipelines_to_run_in_parent_project',
  'ci_pipeline_variables_minimum_override_role',
];

// What each recorded setting is allowed to hold. `'boolean'` means exactly
// that; a list means an enum the platform accepts. `squash_commit_template` is
// free text and carries its own check.
const settingValues = new Map([
  ['merge_method', ['ff', 'rebase_merge', 'merge']],
  ['squash_option', ['always', 'never', 'default_on', 'default_off']],
  ['squash_commit_template', 'template'],
  ['only_allow_merge_if_pipeline_succeeds', 'boolean'],
  ['allow_merge_on_skipped_pipeline', 'boolean'],
  ['only_allow_merge_if_all_discussions_are_resolved', 'boolean'],
  ['ci_allow_fork_pipelines_to_run_in_parent_project', 'boolean'],
  ['ci_pipeline_variables_minimum_override_role', ['no_one_allowed', 'owner', 'maintainer', 'developer']],
]);

// The two state labels the merge-request contract decides state from, taken
// from the policy module that owns their names rather than spelled again here.
const recordedLabels = [noConsumerChangeLabel, releasePreparationLabel];

const protectedBranchName = 'main';
const protectedTagPattern = 'v*';

// The levels a policy may record. Deliberately only the three that protected
// branches and tags both accept: 60 is Administrator on a self-managed
// instance rather than Owner, and the protected-tags endpoint rejects it, so a
// policy that recorded it could be verified but never restored. Live values
// outside this set are still described, by `levelName`.
const accessLevels = new Map([
  ['no-one', 0],
  ['developer', 30],
  ['maintainer', 40],
]);

// The push level `main` carries in each posture. The transition window needs
// Maintainer push for the manual dual-push to GitHub; the end state is the
// merge-request-only posture. Recording the posture as a word, and checking
// it against the level, means the cutover flip cannot land half-done: an
// edited level with a stale posture word fails locally, before anything is
// applied to a live project.
const posturePushLevels = new Map([
  ['window', 'maintainer'],
  ['end-state', 'no-one'],
]);

/**
 * Parse a policy document and prove it is a coherent posture.
 *
 * @param {string} text
 * @returns {{policy: object|null, errors: string[]}}
 */
export function readMainPolicy(text) {
  let document;
  try {
    document = JSON.parse(text);
  } catch (error) {
    return { policy: null, errors: [`${policyRelativePath} must be valid JSON: ${error.message}`] };
  }
  if (document === null || typeof document !== 'object' || Array.isArray(document)) {
    return { policy: null, errors: [`${policyRelativePath} must be a JSON object.`] };
  }

  const errors = [];
  checkRootFields(document, errors);
  checkPosture(document, errors);
  checkProjectSettings(document, errors);
  const branches = checkRules(document, 'protected_branches', ['push_access_levels', 'merge_access_levels'], errors);
  const tags = checkRules(document, 'protected_tags', ['create_access_levels'], errors);
  checkBranchInvariants(branches, document.posture, errors);
  checkTagInvariants(tags, errors);
  checkLabels(document, errors);

  return { policy: errors.length > 0 ? null : document, errors };
}

/**
 * Compare a policy against the four live REST surfaces.
 *
 * @param {{policy: object, live: {project: object, protectedBranches: object[], protectedTags: object[], labels: object[]}}} input
 * @returns {{failures: string[], evidence: string[]}}
 */
export function verifyMainPolicy({ policy, live }) {
  const drifts = diffMainPolicy({ policy, live });
  const failures = drifts.map(describeDrift);
  return { failures, evidence: describeEvidence(policy, drifts) };
}

/**
 * Turn the same comparison into the requests that write the policy back, and
 * the drift that restoration refuses to decide on its own.
 *
 * Nothing here performs a request; the restoration command does, and only when
 * a maintainer asks it to.
 *
 * @param {{policy: object, live: object, projectPath: string}} input
 * @returns {{requests: {method: string, path: string, body: object, summary: string}[], manual: string[]}}
 */
export function mainPolicyRestorePlan({ policy, live, projectPath }) {
  const drifts = diffMainPolicy({ policy, live });
  const requests = [];
  // Drift this command reports but will not act on: a protection rule nobody
  // recorded (removing it is a judgement about someone else's intent), and a
  // name carrying more than one rule (which of them to keep is not a
  // mechanical answer). Restoration writes what the policy says; it never
  // removes a protection the policy is silent about.
  const manual = drifts
    .filter((drift) => drift.kind === 'unexpected' || drift.kind === 'ambiguous')
    .map(describeDrift);

  const settings = drifts.filter((drift) => drift.surface === 'project');
  if (settings.length > 0) {
    requests.push({
      method: 'PUT',
      path: projectPath,
      body: Object.fromEntries(settings.map((drift) => [drift.key, drift.expected])),
      summary: `Reset ${settings.map((drift) => drift.key).join(', ')}.`,
    });
  }

  for (const drift of drifts.filter((drift) => drift.surface === 'protected_branches')) {
    requests.push(...ruleRequests(drift, `${projectPath}/protected_branches`, branchBody));
  }
  for (const drift of drifts.filter((drift) => drift.surface === 'protected_tags')) {
    requests.push(...ruleRequests(drift, `${projectPath}/protected_tags`, tagBody));
  }

  for (const drift of drifts.filter((drift) => drift.surface === 'labels')) {
    const body = {
      color: drift.expected.color,
      description: drift.expected.description,
      // A state label that exists but is archived is hidden from the picker,
      // so it cannot carry the assertion the contract reads it for.
      archived: false,
    };
    requests.push(
      drift.kind === 'missing'
        ? {
            method: 'POST',
            path: `${projectPath}/labels`,
            body: { name: drift.name, ...body },
            summary: `Create the "${drift.name}" label.`,
          }
        : {
            method: 'PUT',
            path: `${projectPath}/labels/${encodeURIComponent(drift.name)}`,
            body,
            summary: `Reset the "${drift.name}" label.`,
          },
    );
  }

  return { requests, manual };
}

function ruleRequests(drift, collectionPath, toBody) {
  if (drift.kind === 'unexpected' || drift.kind === 'ambiguous') return [];

  const create = {
    method: 'POST',
    path: collectionPath,
    body: toBody(drift.expected),
    summary: `Create the "${drift.name}" rule from the policy.`,
  };
  if (drift.kind === 'missing') return [create];

  // A protected branch takes a partial update for its flags, so drift confined
  // to those is repaired in place and the ref is never unprotected. Access
  // levels are not updatable on this edition (the parameters exist but are
  // ignored), and protected tags have no update endpoint at all, so those
  // still mean replacement.
  const rulePath = `${collectionPath}/${encodeURIComponent(drift.name)}`;
  if (drift.patchableFields.length > 0 && drift.patchableFields.length === drift.driftedFields.length) {
    return [
      {
        method: 'PATCH',
        path: rulePath,
        body: Object.fromEntries(
          drift.patchableFields.map((field) => [field, drift.expected[field]]),
        ),
        summary: `Reset ${drift.patchableFields.join(', ')} on the "${drift.name}" rule in place.`,
      },
    ];
  }

  return [
    {
      method: 'DELETE',
      path: rulePath,
      body: null,
      summary: `Remove the drifted "${drift.name}" rule.`,
    },
    create,
  ];
}

function branchBody(rule) {
  return {
    name: rule.name,
    push_access_level: accessLevels.get(rule.push_access_levels[0]),
    merge_access_level: accessLevels.get(rule.merge_access_levels[0]),
    allow_force_push: rule.allow_force_push,
  };
}

function tagBody(rule) {
  return {
    name: rule.name,
    create_access_level: accessLevels.get(rule.create_access_levels[0]),
  };
}

function diffMainPolicy({ policy, live }) {
  return [
    ...diffProjectSettings(policy, live.project ?? {}),
    ...diffRules(policy.protected_branches, live.protectedBranches ?? [], {
      surface: 'protected_branches',
      noun: 'protected-branch',
      levelFields: ['push_access_levels', 'merge_access_levels'],
      flagFields: ['allow_force_push'],
      patchableFields: ['allow_force_push'],
    }),
    ...diffRules(policy.protected_tags, live.protectedTags ?? [], {
      surface: 'protected_tags',
      noun: 'protected-tag',
      levelFields: ['create_access_levels'],
      flagFields: [],
      patchableFields: [],
    }),
    ...diffLabels(policy.labels, live.labels ?? []),
  ];
}

function diffProjectSettings(policy, project) {
  const drifts = [];
  for (const key of recordedProjectSettings) {
    const expected = policy.project[key];
    const actual = project[key];
    if (actual !== expected) {
      drifts.push({ surface: 'project', key, expected, actual });
    }
  }
  return drifts;
}

function diffRules(recorded, liveRules, { surface, noun, levelFields, flagFields, patchableFields }) {
  const drifts = [];
  for (const rule of recorded) {
    const matches = liveRules.filter((candidate) => candidate.name === rule.name);
    if (matches.length === 0) {
      drifts.push({ surface, noun, name: rule.name, kind: 'missing', reasons: [], expected: rule });
      continue;
    }
    // Comparing only the first match would let a second, weaker rule under the
    // same name pass unseen. Which of them to keep is not this command's
    // decision, so it reports and leaves them alone.
    if (matches.length > 1) {
      drifts.push({
        surface,
        noun,
        name: rule.name,
        kind: 'ambiguous',
        reasons: [`the project carries ${matches.length} rules named "${rule.name}"`],
        expected: rule,
      });
      continue;
    }
    const liveRule = matches[0];
    const reasons = [];
    const driftedFields = [];
    for (const field of levelFields) {
      const actual = describeLiveLevels(liveRule[field]);
      const expected = [...rule[field]].sort();
      if (actual.join(',') !== expected.join(',')) {
        reasons.push(`${field} are [${actual.join(', ')}], expected [${expected.join(', ')}]`);
        driftedFields.push(field);
      }
    }
    for (const field of flagFields) {
      if (liveRule[field] !== rule[field]) {
        reasons.push(`${field} is ${JSON.stringify(liveRule[field])}, expected ${JSON.stringify(rule[field])}`);
        driftedFields.push(field);
      }
    }
    // An access-level surface this policy does not compare is one it cannot
    // vouch for — `unprotect_access_levels`, say, which this edition does not
    // expose but a licence change would. Reporting it red is how a new bypass
    // surface announces itself instead of arriving silently.
    for (const field of Object.keys(liveRule)) {
      if (field.endsWith('_access_levels') && !levelFields.includes(field)) {
        reasons.push(
          `the rule carries ${field}, which this policy does not record and therefore cannot vouch for`,
        );
        driftedFields.push(field);
      }
    }
    if (reasons.length > 0) {
      drifts.push({
        surface,
        noun,
        name: rule.name,
        kind: 'drifted',
        reasons,
        driftedFields,
        patchableFields: patchableFields.filter((field) => driftedFields.includes(field)),
        expected: rule,
      });
    }
  }

  for (const liveRule of liveRules) {
    if (recorded.some((rule) => rule.name === liveRule.name)) continue;
    drifts.push({ surface, noun, name: liveRule.name, kind: 'unexpected', reasons: [], expected: null });
  }
  return drifts;
}

// A live access-level entry is a level, or a grant to one user, group, or
// deploy key. The exception grants are the CE analogue of a bypass actor:
// they defeat the rule they sit on, so they are described rather than
// collapsed into their level, and always read as drift.
function describeLiveLevels(entries) {
  return (entries ?? [])
    .map((entry) => {
      if (entry.user_id != null) return `user:${entry.user_id}`;
      if (entry.group_id != null) return `group:${entry.group_id}`;
      if (entry.deploy_key_id != null) return `deploy-key:${entry.deploy_key_id}`;
      return levelName(entry.access_level);
    })
    .sort();
}

function levelName(accessLevel) {
  for (const [name, value] of accessLevels) {
    if (value === accessLevel) return name;
  }
  return `access-level:${accessLevel}`;
}

function diffLabels(recorded, liveLabels) {
  const drifts = [];
  for (const label of recorded) {
    const liveLabel = liveLabels.find((candidate) => candidate.name === label.name);
    if (!liveLabel) {
      drifts.push({ surface: 'labels', name: label.name, kind: 'missing', reasons: [], expected: label });
      continue;
    }
    const reasons = [];
    // The labels endpoint also returns labels inherited from the parent group.
    // Without this, deleting the project label would still read as green as
    // long as a group label answered to the same name — and the label update
    // this command would issue does not edit a group label anyway.
    if (liveLabel.is_project_label === false) {
      reasons.push('it is a group label, not a label on this project');
    }
    // An archived label is hidden from the picker, so it exists historically
    // but can no longer carry the assertion the contract reads it for.
    if (liveLabel.archived === true) {
      reasons.push('it is archived, so it cannot be applied to a merge request');
    }
    // GitLab stores the colour as written, so parity is case-insensitive:
    // `#C5DEF5` and `#c5def5` are the same label, not drift worth a red.
    if ((liveLabel.color ?? '').toLowerCase() !== label.color.toLowerCase()) {
      reasons.push(`color is ${JSON.stringify(liveLabel.color)}, expected ${JSON.stringify(label.color)}`);
    }
    if ((liveLabel.description ?? '') !== label.description) {
      reasons.push(
        `description is ${JSON.stringify(liveLabel.description)}, expected ${JSON.stringify(label.description)}`,
      );
    }
    if (reasons.length > 0) {
      drifts.push({ surface: 'labels', name: label.name, kind: 'drifted', reasons, expected: label });
    }
  }
  // Labels are recorded as a floor, not a census: the tracker carries triage
  // and wayfinding labels this policy has no opinion about.
  return drifts;
}

function describeDrift(drift) {
  if (drift.surface === 'project') {
    return (
      `Project setting ${drift.key} is ${JSON.stringify(drift.actual)}, ` +
      `expected ${JSON.stringify(drift.expected)}.`
    );
  }
  if (drift.surface === 'labels') {
    return drift.kind === 'missing'
      ? `Label "${drift.name}" is missing from the project.`
      : `Label "${drift.name}" drifted: ${drift.reasons.join('; ')}.`;
  }
  if (drift.kind === 'missing') {
    return (
      `${drift.surface === 'protected_branches' ? 'Branch' : 'Tag pattern'} "${drift.name}" has ` +
      `no ${drift.noun} rule; the policy records one.`
    );
  }
  if (drift.kind === 'unexpected') {
    return (
      `${capitalize(drift.noun)} rule "${drift.name}" is not recorded in ${policyRelativePath}; ` +
      'every rule on this project is part of the policy.'
    );
  }
  if (drift.kind === 'ambiguous') {
    return (
      `${capitalize(drift.noun)} rule "${drift.name}" is ambiguous: ${drift.reasons.join('; ')}. ` +
      'The policy records one; remove the duplicates so parity has a single answer.'
    );
  }
  return `${capitalize(drift.noun)} rule "${drift.name}" drifted: ${drift.reasons.join('; ')}.`;
}

function describeEvidence(policy, drifts) {
  const clean = (surface) => !drifts.some((drift) => drift.surface === surface);
  const evidence = [];
  if (clean('project')) {
    // Every recorded setting is named with the value that was actually
    // compared. Evidence that summarises from memory is how a check comes to
    // assert a posture nobody is enforcing any more.
    for (const key of recordedProjectSettings) {
      evidence.push(`Project setting ${key} is ${JSON.stringify(policy.project[key])}.`);
    }
  }
  if (clean('protected_branches')) {
    for (const rule of policy.protected_branches) {
      evidence.push(
        `Protected branch "${rule.name}" (${policy.posture} posture): push ` +
          `${rule.push_access_levels.join(', ')}, merge ${rule.merge_access_levels.join(', ')}, ` +
          `force push ${rule.allow_force_push ? 'allowed' : 'refused'}.`,
      );
    }
  }
  if (clean('protected_tags')) {
    for (const rule of policy.protected_tags) {
      evidence.push(
        `Protected tag "${rule.name}": create ${rule.create_access_levels.join(', ')} — the rule ` +
          'the publish job refuses to run without.',
      );
    }
  }
  if (clean('labels')) {
    for (const label of policy.labels) {
      evidence.push(`Label "${label.name}" exists: ${label.description}`);
    }
  }
  return evidence;
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Closed at the root too, like the settings, rules, and labels below it. A
// field the comparison never reads is a claim the file cannot back — and one
// named like enforcement (`required_approvals`) reads to the next person as
// though something is enforcing it.
function checkRootFields(document, errors) {
  const known = ['posture', 'project', 'protected_branches', 'protected_tags', 'labels'];
  for (const key of Object.keys(document)) {
    if (!known.includes(key)) {
      errors.push(
        `${policyRelativePath} records the unknown top-level field ${key}, which nothing compares ` +
          `or restores; remove it, or teach tools/main-policy.mjs to enforce it.`,
      );
    }
  }
}

function checkPosture(document, errors) {
  if (!posturePushLevels.has(document.posture)) {
    errors.push(
      `${policyRelativePath} posture must be one of ${[...posturePushLevels.keys()].join(', ')}; ` +
        `got ${JSON.stringify(document.posture)}.`,
    );
  }
}

function checkProjectSettings(document, errors) {
  const project = document.project;
  if (project === null || typeof project !== 'object' || Array.isArray(project)) {
    errors.push(`${policyRelativePath} must carry a "project" object of recorded settings.`);
    return;
  }
  for (const key of recordedProjectSettings) {
    if (!(key in project)) {
      errors.push(
        `${policyRelativePath} must record the project setting ${key}; dropping it would ` +
          'silently stop enforcing it.',
      );
    }
  }
  for (const key of Object.keys(project)) {
    if (!recordedProjectSettings.includes(key)) {
      errors.push(
        `${policyRelativePath} records the unknown project setting ${key}; add it to ` +
          'recordedProjectSettings in tools/main-policy.mjs, or drop it.',
      );
      continue;
    }
    // A value the platform would reject is worth catching in review rather
    // than at the moment restoration tries to write it.
    const allowed = settingValues.get(key);
    const value = project[key];
    if (allowed === 'boolean' && typeof value !== 'boolean') {
      errors.push(`${policyRelativePath} records ${key} as ${JSON.stringify(value)}; expected true or false.`);
    } else if (allowed === 'template' && (typeof value !== 'string' || value.trim() === '')) {
      errors.push(`${policyRelativePath} records ${key} as ${JSON.stringify(value)}; expected a nonblank template.`);
    } else if (Array.isArray(allowed) && !allowed.includes(value)) {
      errors.push(
        `${policyRelativePath} records ${key} as ${JSON.stringify(value)}; allowed values are ` +
          `${allowed.map((entry) => JSON.stringify(entry)).join(', ')}.`,
      );
    }
  }
}

function checkRules(document, field, levelFields, errors) {
  const rules = document[field];
  if (!Array.isArray(rules)) {
    errors.push(`${policyRelativePath} must carry a "${field}" array.`);
    return [];
  }
  const seen = new Set();
  for (const rule of rules) {
    if (rule === null || typeof rule !== 'object' || typeof rule.name !== 'string' || rule.name === '') {
      errors.push(`Every ${field} entry needs a nonblank "name".`);
      continue;
    }
    if (seen.has(rule.name)) {
      errors.push(`${policyRelativePath} lists the ${field} rule "${rule.name}" more than once.`);
    }
    seen.add(rule.name);
    for (const levelField of levelFields) {
      checkAccessLevels(rule, field, levelField, errors);
    }
    // Closed, like the project settings: a field the comparison does not read
    // must not be able to sit in the file looking enforced.
    const known = ['name', ...levelFields, ...(field === 'protected_branches' ? ['allow_force_push'] : [])];
    for (const key of Object.keys(rule)) {
      if (!known.includes(key)) {
        errors.push(
          `${field} rule "${rule.name}" records ${key}, which nothing compares or restores; ` +
            `remove it, or teach tools/main-policy.mjs to enforce it.`,
        );
      }
    }
  }
  return rules;
}

function checkAccessLevels(rule, field, levelField, errors) {
  const levels = rule[levelField];
  // Exactly one level per field: CE creates a protected rule from single
  // `*_access_level` parameters, so a policy listing two could be verified
  // but never restored. It is also the shape the policy wants — a second
  // entry on a live rule is an exception grant, which is drift.
  if (!Array.isArray(levels) || levels.length !== 1) {
    errors.push(
      `${field} rule "${rule.name}" must record exactly one ${levelField} entry; ` +
        `got ${JSON.stringify(levels)}.`,
    );
    return;
  }
  if (!accessLevels.has(levels[0])) {
    errors.push(
      `${field} rule "${rule.name}" ${levelField} names the unknown access level ` +
        `${JSON.stringify(levels[0])}; known levels are ${[...accessLevels.keys()].join(', ')}.`,
    );
  }
}

function checkBranchInvariants(rules, posture, errors) {
  const main = rules.find((rule) => rule.name === protectedBranchName);
  if (!main) {
    errors.push(`${policyRelativePath} must record a protected-branch rule for "${protectedBranchName}".`);
    return;
  }
  for (const rule of rules) {
    if (rule.allow_force_push !== false) {
      errors.push(
        `Protected branch "${rule.name}" must record allow_force_push: false; history on a ` +
          'protected branch is append-only.',
      );
    }
  }
  if (main.merge_access_levels?.[0] !== 'maintainer') {
    errors.push(
      `Protected branch "${protectedBranchName}" must record merge_access_levels: ["maintainer"] — ` +
        'the human tamper gate that replaces server-enforced check protection.',
    );
  }
  const expectedPush = posturePushLevels.get(posture);
  if (expectedPush !== undefined && main.push_access_levels?.[0] !== expectedPush) {
    errors.push(
      `posture ${JSON.stringify(posture)} requires "${protectedBranchName}" push_access_levels: ` +
        `["${expectedPush}"]; got ${JSON.stringify(main.push_access_levels)}. The posture word and ` +
        'the push level flip in the same commit.',
    );
  }
}

function checkTagInvariants(rules, errors) {
  if (!rules.some((rule) => rule.name === protectedTagPattern)) {
    errors.push(
      `${policyRelativePath} must record a protected-tag rule for "${protectedTagPattern}" — the ` +
        'standing rule that stands in for tag immutability.',
    );
  }
}

function checkLabels(document, errors) {
  const labels = document.labels;
  if (!Array.isArray(labels)) {
    errors.push(`${policyRelativePath} must carry a "labels" array.`);
    return;
  }
  const seen = new Set();
  for (const label of labels) {
    if (label === null || typeof label !== 'object' || typeof label.name !== 'string' || label.name === '') {
      errors.push('Every labels entry needs a nonblank "name".');
      continue;
    }
    if (seen.has(label.name)) {
      errors.push(`${policyRelativePath} lists the label "${label.name}" more than once.`);
    }
    seen.add(label.name);
    if (typeof label.description !== 'string' || label.description.trim() === '') {
      errors.push(`Label "${label.name}" must record a nonblank description.`);
    }
    if (typeof label.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(label.color)) {
      errors.push(`Label "${label.name}" must record a six-digit hex color; got ${JSON.stringify(label.color)}.`);
    }
    for (const key of Object.keys(label)) {
      if (!['name', 'color', 'description'].includes(key)) {
        errors.push(
          `Label "${label.name}" records ${key}, which nothing compares or restores; remove it, ` +
            'or teach tools/main-policy.mjs to enforce it.',
        );
      }
    }
  }
  for (const name of recordedLabels) {
    if (!seen.has(name)) {
      errors.push(
        `${policyRelativePath} must record the "${name}" merge-request state label.`,
      );
    }
  }
}
