import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Derived CI coverage checks. Everything here is computed from the real
// Playwright config, the real consumer-scenario catalog, and the real CI
// workflow — there are no hand-maintained mirrors to keep in sync.
//
// The failure mode this guards against is "silently never runs": a spec file
// or grep-sharded test that no CI shard selects, a shard group missing from
// the workflow matrix, or a consumer scenario missing from the CI matrix.

const errors = [];
const ciWorkflowPath = '.github/workflows/ci.yml';
const ciWorkflow = readFileSync(ciWorkflowPath, 'utf8');

checkPlaywrightShardCoverage();
checkPackageConsumerMatrixCoverage();

if (errors.length > 0) {
  console.error('CI coverage check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('CI coverage check passed.');

/**
 * Every test that exists (per the plain chromium project) must be selected by
 * exactly one chromium CI shard, and every CI shard group must be listed in
 * the workflow's e2e matrix.
 */
function checkPlaywrightShardCoverage() {
  // Pin HELL_E2E_PROJECTS in both directions so an ambient value cannot
  // change which project set each listing sees.
  const baseline = listPlaywrightTests(['--project=chromium'], { HELL_E2E_PROJECTS: '' });
  const sharded = listPlaywrightTests([], { HELL_E2E_PROJECTS: 'ci' });
  if (!baseline || !sharded) return;

  const shardCounts = new Map();
  const shardGroups = new Set();
  for (const test of sharded) {
    const match = test.project.match(/^chromium-(.+)$/);
    if (!match) continue;
    shardGroups.add(match[1]);
    shardCounts.set(test.key, (shardCounts.get(test.key) ?? 0) + 1);
  }

  for (const test of baseline) {
    if (test.project !== 'chromium') continue;
    const count = shardCounts.get(test.key) ?? 0;
    if (count === 0) {
      errors.push(`Test never runs in any CI shard: ${test.key}`);
    } else if (count > 1) {
      errors.push(`Test runs in ${count} CI shards (expected 1): ${test.key}`);
    }
  }

  const matrixGroups = readWorkflowListBlock('group:');
  for (const group of shardGroups) {
    if (!matrixGroups.includes(group)) {
      errors.push(`${ciWorkflowPath} e2e matrix is missing Playwright group ${group}.`);
    }
  }
  for (const group of matrixGroups) {
    if (!shardGroups.has(group)) {
      errors.push(`${ciWorkflowPath} e2e matrix lists unknown Playwright group ${group}.`);
    }
  }
}

/**
 * Every consumer scenario in the catalog must be exercised by exactly one CI
 * matrix entry, and the matrix must not name unknown scenarios.
 */
function checkPackageConsumerMatrixCoverage() {
  const result = spawnSync(
    process.execPath,
    ['tools/check-package-consumer.mjs', '--catalog-json'],
    { encoding: 'utf8' },
  );
  if (result.status !== 0 || result.error) {
    errors.push(
      `Unable to read package-consumer catalog: ${
        result.error?.message ?? result.stderr ?? `exit ${result.status}`
      }`,
    );
    return;
  }

  let scenarioNames;
  try {
    scenarioNames = JSON.parse(result.stdout).scenarios.map((scenario) => scenario.name);
  } catch (error) {
    errors.push(`Unable to parse package-consumer catalog JSON: ${error.message}`);
    return;
  }

  const matrixCounts = new Map();
  for (const match of ciWorkflow.matchAll(/^\s+scenarios:\s*([a-z0-9-]+(?:,[a-z0-9-]+)*)\s*$/gm)) {
    for (const name of match[1].split(',')) {
      matrixCounts.set(name.trim(), (matrixCounts.get(name.trim()) ?? 0) + 1);
    }
  }

  for (const name of scenarioNames) {
    const count = matrixCounts.get(name) ?? 0;
    if (count === 0) {
      errors.push(`${ciWorkflowPath} package-consumer matrix is missing scenario ${name}.`);
    } else if (count > 1) {
      errors.push(
        `${ciWorkflowPath} package-consumer matrix lists scenario ${name} ${count} times (expected 1).`,
      );
    }
  }

  const known = new Set(scenarioNames);
  for (const name of matrixCounts.keys()) {
    if (!known.has(name)) {
      errors.push(`${ciWorkflowPath} package-consumer matrix references unknown scenario ${name}.`);
    }
  }
}

function listPlaywrightTests(extraArgs, env) {
  const result = spawnSync(
    'pnpm',
    ['exec', 'playwright', 'test', '--list', '--reporter=json', ...extraArgs],
    {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      shell: process.platform === 'win32',
      env: { ...process.env, ...env },
    },
  );

  if (result.error || result.status !== 0) {
    errors.push(
      `playwright test --list failed (${JSON.stringify(env)}): ${
        result.error?.message ?? result.stderr ?? `exit ${result.status}`
      }`,
    );
    return null;
  }

  let report;
  try {
    report = JSON.parse(result.stdout.slice(result.stdout.indexOf('{')));
  } catch (error) {
    errors.push(`Unable to parse playwright --list JSON output: ${error.message}`);
    return null;
  }

  const tests = [];
  const walk = (suite, titles) => {
    const nextTitles = suite.file === suite.title ? titles : [...titles, suite.title];
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        tests.push({
          project: test.projectName ?? test.projectId ?? '',
          key: `${suite.file} › ${[...nextTitles, spec.title].join(' › ')}`,
        });
      }
    }
    for (const child of suite.suites ?? []) {
      walk(child, nextTitles);
    }
  };
  for (const suite of report.suites ?? []) {
    walk(suite, []);
  }
  return tests;
}

function readWorkflowListBlock(key) {
  const lines = ciWorkflow.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === key);
  if (start === -1) {
    errors.push(`${ciWorkflowPath} must define a ${key} matrix block.`);
    return [];
  }

  const items = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const match = lines[index].match(/^\s*-\s+(\S+)\s*$/);
    if (!match) break;
    items.push(match[1]);
  }
  return items;
}
