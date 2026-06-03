#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const checklistPath = join(root, 'docs/release/production-readiness-checklist.md');
const requiredCategories = [
  'package-consumer',
  'api',
  'accessibility',
  'docs-budgets',
  'pack-audit',
  'release-dry-run',
];
const requiredReleaseScenarios = ['root-core', 'button-unstyled', 'primitives-css', 'code-editor'];
const requiredPlaywrightProjects = ['chromium', 'firefox', 'webkit'];
const requiredApiReportPaths = [
  'etc/api-reports/hell-ui-angular.api.md',
  'etc/api-reports/hell-ui-angular-core.api.md',
  'etc/api-reports/hell-ui-angular-primitives.api.md',
  'etc/api-reports/hell-ui-angular-testing.api.md',
];
const requiredFullReleaseTasks = [
  'lint',
  'architecture',
  'ci contract',
  'unit',
  'build lib',
  'pack audit',
  'selected package-consumer scenarios',
  'api report',
  'docs build',
];
const releaseTasksByCategory = {
  'package-consumer': ['selected package-consumer scenarios'],
  api: ['api report'],
  'docs-budgets': ['docs build'],
  'pack-audit': ['pack audit'],
  'release-dry-run': requiredFullReleaseTasks,
};
const checklistContracts = {
  'package-consumer': {
    sliceIds: ['HELL-012', 'HELL-020', 'HELL-021', 'HELL-022', 'HELL-023', 'HELL-024'],
    commands: ['pnpm test:package-consumer -- --minimal-deps', 'pnpm release:dry-run -- --full'],
    checkTypes: ['releaseDryRunEvidence'],
  },
  api: {
    sliceIds: ['HELL-025', 'HELL-026', 'HELL-051'],
    commands: ['pnpm build:lib', 'pnpm test:api-report', 'pnpm release:dry-run -- --full'],
    checkTypes: ['fileExists', 'releaseDryRunEvidence'],
  },
  accessibility: {
    sliceIds: ['HELL-038', 'HELL-039', 'HELL-040', 'HELL-041', 'HELL-042', 'HELL-043', 'HELL-061'],
    commands: ['pnpm e2e', 'pnpm release:dry-run -- --full'],
    checkTypes: ['playwrightJsonReport', 'fileNotContains'],
  },
  'docs-budgets': {
    sliceIds: ['HELL-019', 'HELL-030', 'HELL-031', 'HELL-032', 'HELL-050'],
    commands: ['pnpm build:docs', 'pnpm diagnose:docs-bundle', 'pnpm release:dry-run -- --full'],
    checkTypes: ['fileContains', 'releaseDryRunEvidence'],
  },
  'pack-audit': {
    sliceIds: ['HELL-023', 'HELL-024', 'HELL-053'],
    commands: ['pnpm build:lib', 'pnpm test:package-pack', 'pnpm release:dry-run -- --full'],
    checkTypes: ['releaseDryRunEvidence'],
  },
  'release-dry-run': {
    sliceIds: ['HELL-027', 'HELL-028', 'HELL-049', 'HELL-051', 'HELL-052'],
    commands: ['pnpm release:dry-run -- --full'],
    checkTypes: ['releaseDryRunEvidence'],
  },
};

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  printUsage();
  process.exit(0);
}

const unknownArgs = args.filter((arg) => !['--help', '-h'].includes(arg));
if (unknownArgs.length) {
  console.error(`Unknown production-readiness option(s): ${unknownArgs.join(', ')}`);
  printUsage();
  process.exit(1);
}

const failures = [];
const checklist = readChecklistGate();
validateChecklistGate(checklist);
const gitState = currentTrackedGitChangesState();
if (gitState !== 'clean') {
  failures.push(`Current tracked git tree must be clean before a production-ready claim; found ${gitState}.`);
}
const blockers = Array.isArray(checklist.blockers) ? checklist.blockers : [];

for (const category of requiredCategories) {
  const blocker = blockers.find((entry) => entry.category === category);
  if (!blocker) continue;

  for (const check of blocker.evidenceChecks) {
    failures.push(...runEvidenceCheck(blocker, check));
  }
}

if (failures.length) {
  console.error('Production readiness gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('\nRun fresh evidence before claiming production readiness:');
  console.error('- pnpm release:dry-run -- --full');
  console.error('- pnpm e2e');
  console.error('- pnpm production-ready:check');
  process.exit(1);
}

console.log(`Production readiness gate passed: ${requiredCategories.length} categories verified.`);

function printUsage() {
  console.log(`Usage: pnpm production-ready:check

Verifies the machine-readable gate in docs/release/production-readiness-checklist.md.
Evidence is local and intentionally untracked. Run a full release dry-run and browser
accessibility pass first, then run this gate before any production-ready claim.

The gate reads release dry-run JSON evidence from test-results/release-evidence.
`);
}

function readChecklistGate() {
  if (!existsSync(checklistPath)) {
    fail(`Missing checklist: ${relativeToRoot(checklistPath)}`);
    return { version: null, blockers: [] };
  }

  const content = readFileSync(checklistPath, 'utf8');
  const match = content.match(/```json production-readiness-gate\s*\r?\n([\s\S]*?)\r?\n```/);
  if (!match) {
    fail('Checklist must include a fenced `json production-readiness-gate` block.');
    return { version: null, blockers: [] };
  }

  try {
    return JSON.parse(match[1]);
  } catch (error) {
    fail(`Checklist production-readiness-gate JSON is invalid: ${error.message}`);
    return { version: null, blockers: [] };
  }
}

function validateChecklistGate(checklist) {
  if (checklist.version !== 1) {
    failures.push('production-readiness-gate version must be 1.');
  }

  if (checklist.status !== 'internal-beta-until-gate-passes') {
    failures.push('production-readiness-gate status must be internal-beta-until-gate-passes.');
  }

  if (!Array.isArray(checklist.blockers)) {
    failures.push('production-readiness-gate blockers must be an array.');
    return;
  }

  const seenCategories = new Set();
  for (const blocker of checklist.blockers) {
    if (!blocker || typeof blocker !== 'object') {
      failures.push('Each production-readiness blocker must be an object.');
      continue;
    }

    if (typeof blocker.category !== 'string' || !blocker.category.trim()) {
      failures.push('Each production-readiness blocker must include category.');
      continue;
    }

    if (seenCategories.has(blocker.category)) {
      failures.push(`Duplicate production-readiness blocker category: ${blocker.category}`);
    }
    seenCategories.add(blocker.category);

    if (!Array.isArray(blocker.sliceIds) || blocker.sliceIds.length === 0) {
      failures.push(`${blocker.category} must map to at least one slice ID.`);
    } else {
      for (const sliceId of blocker.sliceIds) {
        if (!/^HELL-\d{3}$/.test(sliceId)) {
          failures.push(`${blocker.category} has invalid slice ID: ${sliceId}`);
        }
      }
    }

    if (!Array.isArray(blocker.commandEvidence) || blocker.commandEvidence.length === 0) {
      failures.push(`${blocker.category} must list command evidence.`);
    } else {
      for (const command of blocker.commandEvidence) {
        if (typeof command !== 'string' || !command.trim()) {
          failures.push(`${blocker.category} has an empty command evidence entry.`);
        }
      }
    }

    if (!Array.isArray(blocker.evidenceChecks) || blocker.evidenceChecks.length === 0) {
      failures.push(`${blocker.category} must list evidence checks.`);
    }
  }

  for (const category of requiredCategories) {
    if (!seenCategories.has(category)) {
      failures.push(`Missing required blocker category: ${category}`);
      continue;
    }

    const blocker = checklist.blockers.find((entry) => entry.category === category);
    const contract = checklistContracts[category];
    for (const sliceId of contract.sliceIds) {
      if (!blocker.sliceIds.includes(sliceId)) {
        failures.push(`${category} must map to slice ID ${sliceId}.`);
      }
    }
    for (const command of contract.commands) {
      if (!blocker.commandEvidence.includes(command)) {
        failures.push(`${category} must list command evidence ${command}.`);
      }
    }
    const checkTypes = new Set(blocker.evidenceChecks.map((check) => check?.type));
    for (const checkType of contract.checkTypes) {
      if (!checkTypes.has(checkType)) {
        failures.push(`${category} must include a ${checkType} evidence check.`);
      }
    }
    validateRequiredCheckDetails(category, blocker.evidenceChecks);
  }
}

function validateRequiredCheckDetails(category, checks) {
  if (category === 'api') {
    for (const path of requiredApiReportPaths) {
      if (!checks.some((check) => check?.type === 'fileExists' && check.path === path)) {
        failures.push(`api must require committed API report ${path}.`);
      }
    }
  }

  if (category === 'accessibility') {
    const playwrightCheck = checks.find((check) => check?.type === 'playwrightJsonReport');
    if (playwrightCheck?.path !== 'test-results/playwright-report.json') {
      failures.push('accessibility Playwright evidence must use test-results/playwright-report.json.');
    }
    if (playwrightCheck?.modifiedAfterCurrentGitCommit !== true) {
      failures.push('accessibility Playwright evidence must require modifiedAfterCurrentGitCommit: true.');
    }
    if (playwrightCheck?.allE2eSpecs !== true) {
      failures.push('accessibility Playwright evidence must require allE2eSpecs: true.');
    }

    const matrixCheck = checks.find((check) => check?.type === 'fileNotContains');
    if (matrixCheck?.path !== 'projects/hell-docs/src/app/pages/accessibility/accessibility.page.ts') {
      failures.push('accessibility matrix check must target projects/hell-docs/src/app/pages/accessibility/accessibility.page.ts.');
    }
    for (const forbidden of ['Critical gap', 'criticalGap: true']) {
      if (!matrixCheck?.forbids?.includes(forbidden)) {
        failures.push(`accessibility matrix check must forbid ${JSON.stringify(forbidden)}.`);
      }
    }
  }

  if (category === 'docs-budgets') {
    const diagnosisCheck = checks.find((check) => check?.type === 'fileContains');
    if (diagnosisCheck?.path !== 'docs/release/docs-bundle-budget-diagnosis.md') {
      failures.push('docs-budgets must check docs/release/docs-bundle-budget-diagnosis.md.');
    }
    if (diagnosisCheck?.modifiedAfterCurrentGitCommit !== true) {
      failures.push('docs-budgets diagnosis evidence must require modifiedAfterCurrentGitCommit: true.');
    }
  }
}

function runEvidenceCheck(blocker, check) {
  const errors = [];
  const label = `${blocker.category}: ${check.label ?? check.type ?? 'evidence check'}`;

  if (!check || typeof check !== 'object') {
    return [`${blocker.category}: evidence check must be an object.`];
  }

  if (check.type === 'releaseDryRunEvidence') {
    const files = latestMatchingFiles('test-results/release-evidence', 'release-dry-run-*-full.json');
    if (!files.length) {
      return [`${label} missing; no file matches test-results/release-evidence/release-dry-run-*-full.json`];
    }
    return releaseDryRunEvidenceErrors(label, files[0].path, blocker.category, files[0]);
  }

  if (check.type === 'playwrightJsonReport') {
    const path = resolveFromRoot(check.path);
    if (!existsSync(path)) return [`${label} missing file: ${relativeToRoot(path)}`];
    return playwrightJsonReportErrors(label, path, check);
  }

  if (check.type === 'fileContains' || check.type === 'fileNotContains' || check.type === 'fileExists') {
    const path = resolveFromRoot(check.path);
    if (!existsSync(path)) {
      return [`${label} missing file: ${relativeToRoot(path)}`];
    }

    const fileMeta = { path, modifiedAt: statSync(path).mtimeMs };
    if (check.type === 'fileExists') return freshnessErrors(label, fileMeta, check);

    const content = readFileSync(path, 'utf8');
    errors.push(...contentErrors(label, path, content, check, fileMeta));
    return errors;
  }

  return [`${label} uses unknown evidence check type: ${check.type}`];
}

function latestMatchingFiles(directory, pattern) {
  const dir = resolveFromRoot(directory);
  if (!existsSync(dir)) return [];

  const matcher = wildcardRegex(pattern);
  return readdirSync(dir)
    .filter((name) => matcher.test(name))
    .map((name) => {
      const path = join(dir, name);
      return { path, modifiedAt: statSync(path).mtimeMs };
    })
    .sort((a, b) => b.modifiedAt - a.modifiedAt);
}

function releaseDryRunEvidenceErrors(label, path, category, fileMeta) {
  const errors = freshnessErrors(label, fileMeta, { modifiedAfterCurrentGitCommit: true });
  let evidence;
  try {
    evidence = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    return [...errors, `${label} in ${relativeToRoot(path)} is not valid JSON: ${error.message}`];
  }

  if (evidence.version !== 1) errors.push(`${label} in ${relativeToRoot(path)} must use evidence version 1.`);
  if (evidence.mode !== 'full') errors.push(`${label} in ${relativeToRoot(path)} must be a full dry-run.`);
  if (evidence.exitCode !== 0) errors.push(`${label} in ${relativeToRoot(path)} must have exitCode 0.`);

  const commit = currentGitCommit();
  if (!commit) errors.push(`${label} could not read current git commit.`);
  else if (evidence.git?.commit !== commit) {
    errors.push(`${label} in ${relativeToRoot(path)} must match current git commit ${commit}.`);
  }

  if (evidence.git?.trackedChanges !== 'clean') {
    errors.push(`${label} in ${relativeToRoot(path)} must be generated from a clean tracked git tree.`);
  }

  for (const scenario of requiredReleaseScenarios) {
    if (!evidence.selectedConsumerScenarios?.includes(scenario)) {
      errors.push(`${label} in ${relativeToRoot(path)} must include package-consumer scenario ${scenario}.`);
    }
  }

  const taskByName = new Map((evidence.tasks ?? []).map((task) => [task.name, task]));
  for (const taskName of releaseTasksByCategory[category] ?? []) {
    const task = taskByName.get(taskName);
    if (!task) {
      errors.push(`${label} in ${relativeToRoot(path)} must include release task ${taskName}.`);
      continue;
    }
    if (task.skipped) errors.push(`${label} in ${relativeToRoot(path)} must not skip release task ${taskName}.`);
    if (task.status !== 0) errors.push(`${label} in ${relativeToRoot(path)} release task ${taskName} must pass.`);
  }

  return errors;
}

function contentErrors(label, path, content, check, fileMeta) {
  const errors = [];

  for (const expected of check.contains ?? []) {
    if (!content.includes(expected)) {
      errors.push(`${label} in ${relativeToRoot(path)} must include ${JSON.stringify(expected)}.`);
    }
  }

  for (const forbidden of check.forbids ?? []) {
    if (content.includes(forbidden)) {
      errors.push(`${label} in ${relativeToRoot(path)} must not include ${JSON.stringify(forbidden)}.`);
    }
  }

  if (check.currentGitCommit) {
    const commit = currentGitCommit();
    if (!commit) errors.push(`${label} could not read current git commit.`);
    else if (!content.includes(`Git commit: ${commit}`)) {
      errors.push(`${label} in ${relativeToRoot(path)} must match current git commit ${commit}.`);
    }
  }

  if (check.cleanGit && !content.includes('Git tracked changes: clean')) {
    errors.push(`${label} in ${relativeToRoot(path)} must be generated from a clean tracked git tree.`);
  }

  errors.push(...freshnessErrors(label, fileMeta, check));
  return errors;
}

function playwrightJsonReportErrors(label, path, check) {
  const fileMeta = { path, modifiedAt: statSync(path).mtimeMs };
  const errors = freshnessErrors(label, fileMeta, check);
  let report;
  try {
    report = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    return [...errors, `${label} in ${relativeToRoot(path)} is not valid JSON: ${error.message}`];
  }

  const unexpected = Number(report.stats?.unexpected ?? Number.NaN);
  if (!Number.isFinite(unexpected)) {
    errors.push(`${label} in ${relativeToRoot(path)} must include stats.unexpected.`);
  } else if (unexpected !== 0) {
    errors.push(`${label} in ${relativeToRoot(path)} reports ${unexpected} unexpected test result(s).`);
  }

  const reportErrors = Array.isArray(report.errors) ? report.errors.length : 0;
  if (reportErrors > 0) {
    errors.push(`${label} in ${relativeToRoot(path)} reports ${reportErrors} top-level error(s).`);
  }

  const specProjects = new Map();
  collectPlaywrightSpecProjects(report.suites ?? [], specProjects);
  const expectedSpecFiles = check.allE2eSpecs ? allE2eSpecFiles() : (check.expectedSpecFiles ?? []);
  for (const specFile of expectedSpecFiles) {
    const projectsForSpec = playwrightProjectsForSpec(specProjects, specFile);
    if (projectsForSpec.size === 0) {
      errors.push(`${label} in ${relativeToRoot(path)} must include ${specFile}.`);
      continue;
    }
    for (const project of requiredPlaywrightProjects) {
      if (!projectsForSpec.has(project)) {
        errors.push(`${label} in ${relativeToRoot(path)} must include ${specFile} for Playwright project ${project}.`);
      }
    }
  }

  return errors;
}

function collectPlaywrightSpecProjects(suites, specProjects, inheritedFile = null) {
  for (const suite of suites) {
    const suiteFile = typeof suite.file === 'string' ? suite.file : inheritedFile;
    if (suiteFile) {
      const projects = specProjects.get(suiteFile) ?? new Set();
      for (const spec of suite.specs ?? []) {
        for (const test of spec.tests ?? []) {
          if (typeof test.projectName === 'string') projects.add(test.projectName);
        }
      }
      specProjects.set(suiteFile, projects);
    }
    collectPlaywrightSpecProjects(suite.suites ?? [], specProjects, suiteFile);
  }
}

function playwrightProjectsForSpec(specProjects, specFile) {
  const projects = new Set();
  const bareSpecFile = specFile.split('/').pop();
  for (const [file, seenProjects] of specProjects) {
    if (
      file === specFile ||
      file.endsWith(`/${specFile}`) ||
      file === bareSpecFile ||
      file.endsWith(`/${bareSpecFile}`)
    ) {
      for (const project of seenProjects) projects.add(project);
    }
  }
  return projects;
}

function allE2eSpecFiles() {
  const e2eDir = join(root, 'e2e');
  if (!existsSync(e2eDir)) return [];
  return readdirSync(e2eDir)
    .filter((name) => name.endsWith('.spec.ts'))
    .sort()
    .map((name) => `e2e/${name}`);
}

function freshnessErrors(label, fileMeta, check) {
  if (!check.modifiedAfterCurrentGitCommit || !fileMeta) return [];

  const commitTimeMs = currentGitCommitTimeMs();
  if (!Number.isFinite(commitTimeMs)) return [`${label} could not read current git commit time.`];
  if (fileMeta.modifiedAt < commitTimeMs) {
    return [
      `${label} in ${relativeToRoot(fileMeta.path)} is older than the current git commit; rerun the evidence command.`,
    ];
  }
  return [];
}

function currentGitCommit() {
  return gitOutput(['rev-parse', 'HEAD']);
}

function currentGitCommitTimeMs() {
  const raw = gitOutput(['log', '-1', '--format=%ct']);
  const seconds = Number(raw);
  return Number.isFinite(seconds) ? seconds * 1000 : Number.NaN;
}

function currentTrackedGitChangesState() {
  const result = spawnSync('git', ['status', '--short', '--untracked-files=no'], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) return 'unknown';
  return result.stdout.trim() ? 'dirty' : 'clean';
}

function gitOutput(args) {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) return null;
  return result.stdout.trim() || null;
}

function resolveFromRoot(path) {
  return normalizePath(path);
}

function normalizePath(path) {
  return isAbsolute(path) ? path : resolve(root, path);
}

function wildcardRegex(pattern) {
  const escaped = String(pattern)
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function fail(message) {
  failures.push(message);
}

function relativeToRoot(path) {
  const rel = relative(root, path);
  return rel && !rel.startsWith('..') ? rel : path;
}
