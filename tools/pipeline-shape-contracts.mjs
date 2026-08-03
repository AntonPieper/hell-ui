// Static pipeline-shape contract (GitLab migration).
//
// Parses the root .gitlab-ci.yml plus its local includes and proves the
// pipeline's shape without running it: the merge-request job roster is
// complete, every job carries the docker runner tag, the workflow rules match
// the five-source topology, exactly one E2E tier job instantiates per test
// pipeline and selects exactly its tier, and every `needs` edge points at a
// job that exists in the same pipeline. This pipeline deliberately has no
// aggregate gate job — the merge gate is the pipeline itself — so this
// contract carries the silent-shrink protection that the e2e-gate job
// provides on the GitHub side.
//
// Everything the contract interprets is held to a minimal subset: rule
// `if:` expressions, rule keys, include kinds, `extends` shapes, and `needs`
// entries outside that subset fail the contract rather than being
// half-interpreted. Growing the pipeline means growing the subset in the
// same change, deliberately.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const rootFile = '.gitlab-ci.yml';

// GitLab's own !reference tag, parsed into a sentinel so an interpreted key
// that receives one fails loudly instead of being read as a literal list.
const REFERENCE = Symbol('gitlab-reference');
const referenceTag = {
  tag: '!reference',
  collection: 'seq',
  resolve: (seq) => ({ [REFERENCE]: seq }),
};
const isReference = (node) =>
  typeof node === 'object' && node !== null && Object.hasOwn(node, REFERENCE);

// The one non-local include the pipeline uses. The template ships the
// analyzer job; every key the contract checks is restated by the in-tree
// override, so the template's own text never needs fetching.
const allowedTemplateIncludes = ['Jobs/Secret-Detection.gitlab-ci.yml'];

// Top-level keys that are pipeline configuration, not jobs. `default` is
// deliberately absent: nothing uses it, and a new global default deserves a
// contract decision, not silent acceptance.
const reservedTopLevelKeys = ['workflow', 'stages', 'variables', 'include'];

// The five-source topology (root .gitlab-ci.yml). Compared structurally:
// each rule's expression by parsed shape, the terminal rule literally.
const canonicalWorkflowRules = [
  '$CI_PIPELINE_SOURCE == "merge_request_event"',
  '$CI_PIPELINE_SOURCE == "push" && $CI_COMMIT_BRANCH == "main"',
  '$CI_PIPELINE_SOURCE == "push" && $CI_COMMIT_TAG =~ /^v\\d/',
  '$CI_PIPELINE_SOURCE == "schedule"',
  '$CI_PIPELINE_SOURCE == "web"',
  '$CI_PIPELINE_SOURCE == "api"',
];

const tierJobs = { 'e2e:pr': 'pr', 'e2e:main': 'main', 'e2e:full': 'full' };

// Required merge-request roster: the jobs that must instantiate
// unconditionally in every MR pipeline. e2e-image is checked separately —
// it must exist and stay conditional (a derivation rebuild, not a gate).
const requiredMrJobs = [
  'pr-state',
  'release-notes',
  'secret_detection',
  'secret-detection-gate',
  'static',
  'unit',
  'build',
  'package-consumer',
  'e2e:pr',
];
const forbiddenMrJobs = ['e2e:main', 'e2e:full'];

// Push-to-main roster: pre-cutover main is dual-pushed by hand and never
// passes an MR pipeline here, so it keeps the scan and the full test set;
// the MR-only contract jobs must not leak in.
const requiredMainJobs = [
  'secret_detection',
  'secret-detection-gate',
  'static',
  'unit',
  'build',
  'package-consumer',
  'e2e:main',
];
const forbiddenMainJobs = ['pr-state', 'release-notes', 'e2e:pr', 'e2e:full'];

export function collectPipelineShapeContractErrors({ root }) {
  const errors = [];
  const model = loadPipeline(root, errors);
  if (!model) return errors;

  checkWorkflowTopology(model, errors);
  checkExpressionSubset(model, errors);
  checkStages(model, errors);
  checkDockerTags(model, errors);
  const evaluation = evaluateAllJobs(model, errors);
  checkRosters(model, evaluation, errors);
  checkTierDiscipline(model, evaluation, errors);
  checkNeedsConsistency(model, evaluation, errors);
  // A subset violation surfaces once per evaluation that touches it;
  // reporting it once is enough to go red.
  return [...new Set(errors)];
}

// --- Loading -----------------------------------------------------------

function loadPipeline(root, errors) {
  const documents = [];
  const visited = new Set();
  const templates = new Set();
  loadFile(root, rootFile, documents, visited, templates, errors);
  if (documents.length === 0) return null;

  // The template include is part of the shape: it ships the analyzer the
  // in-tree secret_detection override configures, so losing it breaks the
  // scan while every in-tree key still looks right.
  for (const template of allowedTemplateIncludes) {
    if (!templates.has(template)) {
      errors.push(`The pipeline must include template "${template}"; the include is missing.`);
    }
  }

  // GitLab merges same-named top-level keys across includes; a duplicate is
  // exactly the silent-merge ambiguity this contract refuses to interpret.
  const topLevel = new Map();
  const variables = new Map();
  for (const { file, parsed } of documents) {
    for (const [key, value] of Object.entries(parsed ?? {})) {
      if (key === 'include') continue;
      if (key === 'variables') {
        for (const [name, spec] of Object.entries(value ?? {})) {
          if (variables.has(name)) {
            errors.push(`Pipeline variable "${name}" is defined more than once across CI files.`);
          }
          variables.set(name, spec);
        }
        continue;
      }
      if (key === 'workflow' && file !== rootFile) {
        errors.push(`${file} defines "workflow"; the topology lives in ${rootFile} only.`);
        continue;
      }
      if (topLevel.has(key)) {
        errors.push(
          `"${key}" is defined in both ${topLevel.get(key).file} and ${file}; ` +
            'same-named keys merge silently, which the contract does not interpret.',
        );
        continue;
      }
      topLevel.set(key, { file, value });
    }
  }

  const jobs = new Map();
  const hidden = new Map();
  for (const [key, { file, value }] of topLevel) {
    if (key === 'workflow' || key === 'stages') continue;
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      errors.push(`${file} top-level key "${key}" is not a job definition; unknown configuration.`);
      continue;
    }
    if (key.startsWith('.')) hidden.set(key, value);
    else jobs.set(key, { file, job: value });
  }

  // Default values for the variables rule expressions may read. Contexts
  // override the dispatch hooks the way a schedule or the run form would.
  const defaults = {};
  for (const [name, spec] of variables) {
    if (typeof spec === 'string') defaults[name] = spec;
    else if (typeof spec === 'object' && spec !== null && typeof spec.value === 'string') {
      defaults[name] = spec.value;
    } else {
      errors.push(`Pipeline variable "${name}" has a shape the contract does not interpret.`);
    }
  }

  return {
    workflow: topLevel.get('workflow')?.value,
    stages: topLevel.get('stages')?.value,
    defaults,
    jobs,
    hidden,
  };
}

function loadFile(root, file, documents, visited, templates, errors) {
  if (visited.has(file)) {
    errors.push(`${file} is included more than once.`);
    return;
  }
  visited.add(file);

  const path = join(root, file);
  if (!existsSync(path)) {
    errors.push(`Missing ${file}: the pipeline definition is incomplete.`);
    return;
  }

  let parsed;
  try {
    parsed = parse(readFileSync(path, 'utf8'), { customTags: [referenceTag] });
  } catch (error) {
    errors.push(`${file} must be valid YAML: ${error.message}`);
    return;
  }
  documents.push({ file, parsed });

  const includes = parsed?.include ?? [];
  if (!Array.isArray(includes)) {
    errors.push(`${file} has an include shape the contract does not interpret.`);
    return;
  }
  for (const entry of includes) {
    if (typeof entry === 'object' && entry !== null && typeof entry.local === 'string' && Object.keys(entry).length === 1) {
      loadFile(root, entry.local.replace(/^\//, ''), documents, visited, templates, errors);
    } else if (typeof entry === 'object' && entry !== null && typeof entry.template === 'string' && Object.keys(entry).length === 1) {
      if (!allowedTemplateIncludes.includes(entry.template)) {
        errors.push(`${file} includes template "${entry.template}", which is not allowlisted.`);
      }
      templates.add(entry.template);
    } else {
      errors.push(`${file} has an include entry outside the minimal subset (local/template): ${JSON.stringify(entry)}`);
    }
  }
}

// --- Rule expressions: the minimal subset ------------------------------
//
// expr  := and ( '||' and )*
// and   := prim ( '&&' prim )*
// prim  := '(' expr ')' | '$VAR' '==' "string" | '$VAR' '=~' /regex/
//
// Exactly what the checked-in pipeline uses. `!=`, bare-variable existence
// tests, single quotes, and regex flags are outside the subset on purpose:
// each would need its own decided GitLab semantics before the contract can
// evaluate it.

function tokenizeExpression(text) {
  const tokens = [];
  let rest = text;
  const patterns = [
    ['var', /^\$[A-Za-z_][A-Za-z0-9_]*/],
    ['op', /^(==|=~|&&|\|\|)/],
    ['paren', /^[()]/],
    ['string', /^"[^"\\]*"/],
    ['regex', /^\/(?:[^/\\]|\\.)*\//],
  ];
  while ((rest = rest.replace(/^\s+/, '')) !== '') {
    const match = patterns.map(([kind, re]) => [kind, re.exec(rest)]).find(([, m]) => m);
    if (!match) throw new Error(`unrecognized token at "${rest}"`);
    const [kind, m] = match;
    tokens.push({ kind, text: m[0] });
    rest = rest.slice(m[0].length);
  }
  return tokens;
}

function parseExpression(text) {
  const tokens = tokenizeExpression(text);
  let position = 0;
  const peek = () => tokens[position];
  const take = () => tokens[position++];

  function parseOr() {
    let node = parseAnd();
    while (peek()?.text === '||') {
      take();
      node = { kind: 'or', left: node, right: parseAnd() };
    }
    return node;
  }
  function parseAnd() {
    let node = parsePrim();
    while (peek()?.text === '&&') {
      take();
      node = { kind: 'and', left: node, right: parsePrim() };
    }
    return node;
  }
  function parsePrim() {
    if (peek()?.text === '(') {
      take();
      const node = parseOr();
      if (take()?.text !== ')') throw new Error('unbalanced parenthesis');
      return node;
    }
    const variable = take();
    if (variable?.kind !== 'var') throw new Error(`expected a $VARIABLE, got "${variable?.text}"`);
    const operator = take();
    if (operator?.text === '==') {
      const value = take();
      if (value?.kind !== 'string') throw new Error('== compares against a double-quoted string');
      return { kind: 'eq', name: variable.text.slice(1), value: value.text.slice(1, -1) };
    }
    if (operator?.text === '=~') {
      const value = take();
      if (value?.kind !== 'regex') throw new Error('=~ matches against a /regex/ literal');
      return { kind: 'match', name: variable.text.slice(1), pattern: value.text.slice(1, -1) };
    }
    throw new Error(`expected == or =~, got "${operator?.text}"`);
  }

  const node = parseOr();
  if (position !== tokens.length) throw new Error(`trailing tokens at "${peek().text}"`);
  return node;
}

function evaluateExpression(node, vars) {
  switch (node.kind) {
    case 'or':
      return evaluateExpression(node.left, vars) || evaluateExpression(node.right, vars);
    case 'and':
      return evaluateExpression(node.left, vars) && evaluateExpression(node.right, vars);
    case 'eq':
      return vars[node.name] === node.value;
    case 'match':
      return vars[node.name] !== undefined && new RegExp(node.pattern).test(vars[node.name]);
    default:
      throw new Error(`unknown expression node "${node.kind}"`);
  }
}

// The only variables the evaluator knows the runtime semantics of: the
// three CI-provided pipeline facts plus the two dispatch hooks the root
// file declares. A rule reading anything else — a job-level variable, an
// instance setting — has scoping the contract has not decided.
const allowedRuleVariables = [
  'CI_PIPELINE_SOURCE',
  'CI_COMMIT_BRANCH',
  'CI_COMMIT_TAG',
  'E2E_TIER',
  'PIPELINE_KIND',
];

function collectVariableNames(node, names = []) {
  if (node.kind === 'or' || node.kind === 'and') {
    collectVariableNames(node.left, names);
    collectVariableNames(node.right, names);
  } else {
    names.push(node.name);
  }
  return names;
}

// Wraps parse failures in the contract's fail-closed error shape.
function parseRuleExpression(owner, text, errors) {
  if (typeof text !== 'string') {
    errors.push(`${owner} has an if: value that is not a string; outside the minimal subset.`);
    return null;
  }
  let node;
  try {
    node = parseExpression(text);
  } catch (error) {
    errors.push(
      `${owner} evaluates "${text}", which is outside the minimal subset the contract ` +
        `interprets (${error.message}).`,
    );
    return null;
  }
  const unknown = collectVariableNames(node).filter((name) => !allowedRuleVariables.includes(name));
  if (unknown.length > 0) {
    errors.push(
      `${owner} reads $${unknown[0]}, which is outside the minimal subset the contract ` +
        `interprets (known variables: ${allowedRuleVariables.join(', ')}).`,
    );
    return null;
  }
  return node;
}

// --- Rules: shape validation and static evaluation ----------------------

const allowedRuleKeys = ['if', 'when', 'changes'];
// Exactly the when: values the checked-in pipeline uses. `manual` and
// `always` are outside the subset on purpose: each changes when (or
// whether) a job gates, so admitting one is a contract decision, not a
// default.
const allowedWhenValues = ['never', 'on_success'];

function validateRules(owner, rules, errors) {
  if (rules === undefined) return true;
  if (isReference(rules) || !Array.isArray(rules)) {
    errors.push(`${owner} has a rules: shape the contract does not interpret.`);
    return false;
  }
  let valid = true;
  for (const [index, rule] of rules.entries()) {
    const label = `${owner} rule ${index + 1}`;
    if (typeof rule !== 'object' || rule === null || isReference(rule)) {
      errors.push(`${label} is not a mapping; outside the minimal subset.`);
      valid = false;
      continue;
    }
    for (const key of Object.keys(rule)) {
      if (!allowedRuleKeys.includes(key)) {
        errors.push(`${label} uses the "${key}" key, which is outside the minimal subset.`);
        valid = false;
      }
    }
    if ('when' in rule && !allowedWhenValues.includes(rule.when)) {
      errors.push(`${label} uses when: ${JSON.stringify(rule.when)}, outside the minimal subset.`);
      valid = false;
    }
    if ('changes' in rule && !(Array.isArray(rule.changes) && rule.changes.every((c) => typeof c === 'string'))) {
      errors.push(`${label} has a changes: shape the contract does not interpret.`);
      valid = false;
    }
  }
  return valid;
}

// Statically evaluates a job's rules in one pipeline context.
//
//   'always'      every path instantiates the job
//   'never'       no path instantiates the job
//   'conditional' instantiation depends on the diff (a changes: clause)
//
// Rules evaluate in order, first match wins, no match means no job. A rule
// whose if-part matches but that carries changes: forks the walk: one path
// applies the rule, the other continues past it.
function evaluateRules(owner, rules, vars, errors) {
  if (rules === undefined) return 'always';
  const outcomes = new Set();
  for (const rule of rules) {
    let matches = true;
    if ('if' in rule) {
      const node = parseRuleExpression(owner, rule.if, errors);
      if (node === null) return null;
      matches = evaluateExpression(node, vars);
    }
    if (!matches) continue;
    const included = (rule.when ?? 'on_success') !== 'never';
    outcomes.add(included);
    if (!('changes' in rule)) return resolveOutcomes(outcomes);
  }
  outcomes.add(false); // fell off the rule list: job not added
  return resolveOutcomes(outcomes);
}

function resolveOutcomes(outcomes) {
  if (outcomes.size > 1) return 'conditional';
  return outcomes.has(true) ? 'always' : 'never';
}

// --- The pipeline contexts the topology admits --------------------------

function buildContexts(defaults) {
  const tiers = Object.values(tierJobs);
  const contexts = [
    { name: 'merge-request pipelines', vars: { CI_PIPELINE_SOURCE: 'merge_request_event' }, tier: 'e2e:pr' },
    { name: 'push-to-main pipelines', vars: { CI_PIPELINE_SOURCE: 'push', CI_COMMIT_BRANCH: 'main' }, tier: 'e2e:main' },
    { name: 'v* tag pipelines', vars: { CI_PIPELINE_SOURCE: 'push', CI_COMMIT_TAG: 'v9.9.9' }, tier: 'e2e:full' },
    { name: 'scheduled policy-sweep pipelines', vars: { CI_PIPELINE_SOURCE: 'schedule', PIPELINE_KIND: 'policy-sweep' }, tier: null },
  ];
  for (const tier of tiers) {
    contexts.push({
      name: `scheduled default pipelines with E2E_TIER=${tier}`,
      vars: { CI_PIPELINE_SOURCE: 'schedule', E2E_TIER: tier },
      tier: `e2e:${tier}`,
    });
    for (const source of ['web', 'api']) {
      contexts.push({
        name: `${source}-dispatched pipelines with E2E_TIER=${tier}`,
        vars: { CI_PIPELINE_SOURCE: source, E2E_TIER: tier },
        tier: `e2e:${tier}`,
      });
    }
  }
  return contexts.map((context) => ({ ...context, vars: { ...defaults, ...context.vars } }));
}

// --- Job resolution ------------------------------------------------------

// Resolves a job key through its extends chain: the job's own value wins,
// then each ancestor's, nearest first. Only single-parent extends are in
// the subset; multi-parent merge order is a GitLab subtlety nothing uses.
function resolveJobKey(model, name, definition, key, errors, seen = new Set()) {
  if (Object.hasOwn(definition, key)) return definition[key];
  const parent = resolveParent(model, name, definition, errors, seen);
  if (!parent) return undefined;
  return resolveJobKey(model, parent.name, parent.definition, key, errors, seen);
}

function resolveParent(model, name, definition, errors, seen) {
  if (!Object.hasOwn(definition, 'extends')) return null;
  const extendsValue = definition.extends;
  if (typeof extendsValue !== 'string') {
    errors.push(`Job "${name}" has a multi-parent or non-string extends; outside the minimal subset.`);
    return null;
  }
  if (seen.has(extendsValue)) {
    errors.push(`Job "${name}" has a circular extends chain.`);
    return null;
  }
  seen.add(extendsValue);
  const parent = model.hidden.get(extendsValue) ?? model.jobs.get(extendsValue)?.job;
  if (!parent) {
    errors.push(`Job "${name}" extends "${extendsValue}", which is not defined.`);
    return null;
  }
  return { name: extendsValue, definition: parent };
}

// Variables merge along the extends chain with the nearest definition
// winning per key — resolveJobKey would return the whole nearest map.
function resolveJobVariables(model, name, definition, errors, seen = new Set()) {
  const parent = resolveParent(model, name, definition, errors, seen);
  const inherited = parent
    ? resolveJobVariables(model, parent.name, parent.definition, errors, seen)
    : {};
  const own = Object.hasOwn(definition, 'variables') ? definition.variables : {};
  if (typeof own !== 'object' || own === null || isReference(own)) {
    errors.push(`Job "${name}" has a variables: shape the contract does not interpret.`);
    return inherited;
  }
  return { ...inherited, ...own };
}

// Walks every job once: validates rule shapes, then evaluates each job's
// effective rules in every canonical context.
function evaluateAllJobs(model, errors) {
  const contexts = buildContexts(model.defaults);
  const outcomes = new Map();
  for (const [name, { job }] of model.jobs) {
    const rules = resolveJobKey(model, name, job, 'rules', errors);
    if (!validateRules(`Job "${name}"`, rules, errors)) continue;
    const perContext = new Map();
    for (const context of contexts) {
      const outcome = evaluateRules(`Job "${name}"`, rules, context.vars, errors);
      if (outcome === null) break;
      perContext.set(context.name, outcome);
    }
    if (perContext.size === contexts.length) outcomes.set(name, perContext);
  }
  return { contexts, outcomes };
}

// --- Checks --------------------------------------------------------------

function checkWorkflowTopology(model, errors) {
  const preamble = 'workflow rules must match the five-source topology';
  const rules = model.workflow?.rules;
  if (!Array.isArray(rules)) {
    errors.push(`${preamble}: ${rootFile} must define workflow.rules as a list.`);
    return;
  }
  if (!validateRules('workflow', rules, errors)) return;
  if (rules.length !== canonicalWorkflowRules.length + 1) {
    errors.push(
      `${preamble}: expected ${canonicalWorkflowRules.length} source rules plus a terminal ` +
        `"when: never", found ${rules.length} rules.`,
    );
    return;
  }
  for (const [index, canonical] of canonicalWorkflowRules.entries()) {
    const rule = rules[index];
    if (Object.keys(rule).length !== 1 || typeof rule.if !== 'string') {
      errors.push(`${preamble}: rule ${index + 1} must be a bare if: rule.`);
      continue;
    }
    const actual = parseRuleExpression(`workflow rule ${index + 1}`, rule.if, errors);
    if (actual === null) continue;
    if (JSON.stringify(actual) !== JSON.stringify(parseExpression(canonical))) {
      errors.push(`${preamble}: rule ${index + 1} must be \`if: ${canonical}\`, found \`if: ${rule.if}\`.`);
    }
  }
  const terminal = rules[rules.length - 1];
  if (JSON.stringify(terminal) !== JSON.stringify({ when: 'never' })) {
    errors.push(`${preamble}: the final rule must be exactly \`when: never\`.`);
  }

  // The behavioral half of the same guarantee: a plain branch push creates
  // no pipeline, and every canonical context creates exactly one.
  const outcome = evaluateRules(
    'workflow',
    rules,
    { ...model.defaults, CI_PIPELINE_SOURCE: 'push', CI_COMMIT_BRANCH: 'feature' },
    errors,
  );
  if (outcome !== 'never') {
    errors.push(`${preamble}: a plain branch push must create no pipeline (found: ${outcome}).`);
  }
  for (const context of buildContexts(model.defaults)) {
    if (evaluateRules('workflow', rules, context.vars, errors) !== 'always') {
      errors.push(`${preamble}: ${context.name} must be admitted by the workflow rules.`);
    }
  }
}

function checkExpressionSubset(model, errors) {
  // Job rules are parsed during evaluation; this pass exists so a job whose
  // roster expectations never get evaluated (an extra job, a hidden
  // template) still has every expression held to the subset.
  for (const [name, { job }] of model.jobs) {
    const rules = resolveJobKey(model, name, job, 'rules', errors);
    if (!validateRules(`Job "${name}"`, rules, errors) || rules === undefined) continue;
    for (const rule of rules) {
      if ('if' in rule) parseRuleExpression(`Job "${name}"`, rule.if, errors);
    }
  }
}

function checkStages(model, errors) {
  if (JSON.stringify(model.stages) !== JSON.stringify(['test'])) {
    errors.push('stages must be exactly [test]; the pipeline is deliberately single-stage.');
  }
  for (const [name, { job }] of model.jobs) {
    const stage = resolveJobKey(model, name, job, 'stage', errors);
    if (stage !== undefined && stage !== 'test') {
      errors.push(`Job "${name}" declares stage "${stage}"; only the test stage exists.`);
    }
  }
}

function checkDockerTags(model, errors) {
  for (const [name, { job }] of model.jobs) {
    const tags = resolveJobKey(model, name, job, 'tags', errors);
    if (JSON.stringify(tags) !== JSON.stringify(['docker'])) {
      errors.push(
        `Job "${name}" must run on the shared docker runner: effective tags must be exactly ` +
          `["docker"], found ${isReference(tags) ? 'a !reference' : JSON.stringify(tags)}.`,
      );
    }
  }
}

function checkRosters(model, { outcomes }, errors) {
  const rosters = [
    {
      context: 'merge-request pipelines',
      required: requiredMrJobs,
      forbidden: forbiddenMrJobs,
    },
    {
      context: 'push-to-main pipelines',
      required: requiredMainJobs,
      forbidden: forbiddenMainJobs,
    },
  ];
  for (const { context, required, forbidden } of rosters) {
    for (const name of required) {
      const outcome = outcomes.get(name)?.get(context);
      if (outcome === undefined) {
        errors.push(`required job "${name}" is missing from the pipeline definition.`);
        continue;
      }
      if (outcome !== 'always') {
        errors.push(
          `required job "${name}" must instantiate unconditionally in ${context} (found: ${outcome}).`,
        );
      }
      // Instantiating is not enough: a required job that cannot fail the
      // pipeline is the same silent shrink as a missing one.
      const entry = model.jobs.get(name);
      const allowFailure = resolveJobKey(model, name, entry.job, 'allow_failure', errors);
      if (allowFailure !== undefined && allowFailure !== false) {
        errors.push(
          `required job "${name}" must stay gating: allow_failure must be false or absent, ` +
            `found ${JSON.stringify(allowFailure)}.`,
        );
      }
    }
    for (const name of forbidden) {
      const outcome = outcomes.get(name)?.get(context);
      if (outcome !== undefined && outcome !== 'never') {
        errors.push(`Job "${name}" must not instantiate in ${context} (found: ${outcome}).`);
      }
    }
    // The image rebuild stays conditional: unconditional would rebuild and
    // re-push on every pipeline, absent would break the needs edges.
    const imageOutcome = outcomes.get('e2e-image')?.get(context);
    if (imageOutcome !== 'conditional') {
      errors.push(
        `Job "e2e-image" must instantiate conditionally (on derivation changes) in ${context} ` +
          `(found: ${imageOutcome ?? 'missing'}).`,
      );
    }
  }
}

function checkTierDiscipline(model, { contexts, outcomes }, errors) {
  // The tier set is closed: exactly the three known jobs extend .e2e-tier.
  // Ancestry only — resolver diagnostics for these jobs were already
  // reported when their rules and tags resolved, so they are discarded
  // here; the seen set spans the whole walk so a circular chain ends it.
  const extendingTier = [];
  for (const [name, { job }] of model.jobs) {
    const seen = new Set();
    for (let current = { name, definition: job }; current; ) {
      current = resolveParent(model, current.name, current.definition, [], seen);
      if (current?.name === '.e2e-tier') {
        extendingTier.push(name);
        break;
      }
    }
  }
  const expected = Object.keys(tierJobs);
  if (JSON.stringify([...extendingTier].sort()) !== JSON.stringify([...expected].sort())) {
    errors.push(
      `The E2E tier jobs must be exactly ${expected.join(', ')}; found extending .e2e-tier: ` +
        `${extendingTier.join(', ') || '(none)'}.`,
    );
  }

  for (const [name, tier] of Object.entries(tierJobs)) {
    const entry = model.jobs.get(name);
    if (!entry) continue; // the roster check already reports the absence
    const variables = resolveJobVariables(model, name, entry.job, errors);
    if (variables.HELL_E2E_TIER !== tier) {
      errors.push(
        `Job "${name}" must select exactly its tier: HELL_E2E_TIER must be "${tier}", found ` +
          `${JSON.stringify(variables.HELL_E2E_TIER)}.`,
      );
    }
    if (resolveJobKey(model, name, entry.job, 'parallel', errors) !== undefined) {
      errors.push(
        `Job "${name}" must stay unsharded: every tier job is one job on the one browser host.`,
      );
    }
    if (resolveJobKey(model, name, entry.job, 'resource_group', errors) !== 'browser-host') {
      errors.push(`Job "${name}" must carry resource_group: browser-host.`);
    }
  }

  // Exactly one tier job per test pipeline; none in the policy sweep.
  for (const context of contexts) {
    const instantiated = Object.keys(tierJobs).filter(
      (name) => outcomes.get(name)?.get(context.name) === 'always',
    );
    const unstable = Object.keys(tierJobs).filter(
      (name) => outcomes.get(name)?.get(context.name) === 'conditional',
    );
    if (unstable.length > 0) {
      errors.push(`Tier jobs must never be conditional: ${unstable.join(', ')} in ${context.name}.`);
    }
    const expectedTier = context.tier === null ? [] : [context.tier];
    if (JSON.stringify(instantiated) !== JSON.stringify(expectedTier)) {
      errors.push(
        `exactly one E2E tier job must instantiate in ${context.name}` +
          `${context.tier === null ? ' — none for the policy sweep' : ` (${context.tier})`}; ` +
          `found: ${instantiated.join(', ') || '(none)'}.`,
      );
    }
  }
}

function checkNeedsConsistency(model, { contexts, outcomes }, errors) {
  for (const [name, { job }] of model.jobs) {
    const needs = resolveJobKey(model, name, job, 'needs', errors);
    if (needs === undefined) continue;
    if (!Array.isArray(needs)) {
      errors.push(`Job "${name}" has a needs: shape the contract does not interpret.`);
      continue;
    }
    for (const entry of needs) {
      let target;
      let optional = false;
      if (typeof entry === 'string') {
        target = entry;
      } else if (
        typeof entry === 'object' &&
        entry !== null &&
        !isReference(entry) &&
        typeof entry.job === 'string' &&
        Object.keys(entry).every((key) => ['job', 'optional', 'artifacts'].includes(key))
      ) {
        target = entry.job;
        optional = entry.optional === true;
      } else {
        errors.push(`Job "${name}" has a needs entry outside the minimal subset: ${JSON.stringify(entry)}.`);
        continue;
      }
      if (!outcomes.has(target)) {
        errors.push(`Job "${name}" needs "${target}", which is not a job in this pipeline.`);
        continue;
      }
      if (optional) continue;
      // A needs edge into a job absent from the pipeline is a
      // pipeline-creation error; prove the target is always there.
      for (const context of contexts) {
        const jobOutcome = outcomes.get(name)?.get(context.name);
        const targetOutcome = outcomes.get(target)?.get(context.name);
        if (jobOutcome !== 'never' && targetOutcome !== 'always') {
          errors.push(
            `Job "${name}" needs "${target}" but in ${context.name} the target is ` +
              `${targetOutcome ?? 'unevaluated'} while the job is ${jobOutcome}.`,
          );
        }
      }
    }
  }
}
