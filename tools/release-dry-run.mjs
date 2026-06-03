#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { createWriteStream, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { packageManagerInvocation } from './package-manager.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rawArgs = process.argv.slice(2);
const mode = parseMode(rawArgs);
const selectedConsumerScenarios = parseList(
  process.env.HELL_RELEASE_DRY_RUN_CONSUMER_SCENARIOS,
  ['root-core', 'button-unstyled', 'primitives-css', 'code-editor', 'pdf-viewer'],
);
const startedAt = new Date();
const logPath = releaseEvidenceLogPath(mode, startedAt);
const evidenceJsonPath = logPath.replace(/\.log$/, '.json');
const gitCommit = gitOutput(['rev-parse', 'HEAD']) ?? 'unknown';
const gitTrackedChanges = gitTrackedChangesState();
const log = createWriteStream(logPath, { flags: 'wx' });

const tasks = mode === 'full'
  ? fullTasks(selectedConsumerScenarios)
  : fastTasks();
const results = [];

writeHeader();

let exitCode = 0;
let fatalError;
try {
  for (const task of tasks) {
    const result = await runTask(task);
    results.push(result);
    if (result.status !== 0) {
      exitCode = result.status ?? 1;
      break;
    }
  }
} catch (error) {
  fatalError = error;
  exitCode = 1;
  writeLog(`\nFatal error: ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
} finally {
  writeSummary();
  writeEvidenceJson();
  await closeLog();
}

if (fatalError) {
  console.error(fatalError instanceof Error ? fatalError.message : String(fatalError));
}

if (exitCode === 0) {
  console.log(`\n[release-dry-run] ${mode} passed. Evidence: ${relative(process.cwd(), logPath)}; ${relative(process.cwd(), evidenceJsonPath)}`);
} else {
  console.error(`\n[release-dry-run] ${mode} failed. Evidence: ${relative(process.cwd(), logPath)}; ${relative(process.cwd(), evidenceJsonPath)}`);
}

process.exit(exitCode);

function parseMode(args) {
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const unknownArgs = args.filter((arg) => !['--fast', '--full'].includes(arg));
  if (unknownArgs.length > 0) {
    console.error(`Unknown release dry-run option(s): ${unknownArgs.join(', ')}`);
    printUsage();
    process.exit(1);
  }

  const wantsFast = args.includes('--fast');
  const wantsFull = args.includes('--full');
  if (wantsFast && wantsFull) {
    console.error('Use either --fast or --full, not both.');
    printUsage();
    process.exit(1);
  }

  return wantsFast ? 'fast' : 'full';
}

function printUsage() {
  console.log(`Usage: npm run release:dry-run -- [--fast|--full]

Modes:
  --fast  Local preflight: changelog entry, lint, architecture, CI contract, npm preflight, build, pack audit, API report.
  --full  Release candidate gate: changelog entry, lint, architecture, CI contract, unit, build, pack audit, selected package-consumer scenarios, API report, docs build.

Environment:
  HELL_RELEASE_DRY_RUN_LOG_DIR             Override evidence log directory.
  HELL_RELEASE_DRY_RUN_CONSUMER_SCENARIOS Override comma-separated --full package-consumer scenarios.
`);
}

function parseList(value, fallback) {
  const list = (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return list.length > 0 ? list : fallback;
}

function releaseEvidenceLogPath(selectedMode, date) {
  const rawLogDir = process.env.HELL_RELEASE_DRY_RUN_LOG_DIR;
  const logDir = rawLogDir
    ? (isAbsolute(rawLogDir) ? rawLogDir : resolve(root, rawLogDir))
    : join(root, 'test-results/release-evidence');
  mkdirSync(logDir, { recursive: true });

  const stamp = date.toISOString().replace(/[:.]/g, '-');
  return join(logDir, `release-dry-run-${stamp}-${selectedMode}.log`);
}

function fastTasks() {
  return [
    packageTask('changelog entry', ['run', 'test:changelog']),
    packageTask('lint', ['run', 'lint']),
    packageTask('architecture', ['run', 'test:architecture']),
    packageTask('ci contract', ['run', 'test:ci-contract']),
    packageTask('package-consumer npm preflight', ['run', 'test:package-consumer', '--', '--preflight']),
    packageTask('build lib', ['run', 'build:lib']),
    packageTask('pack audit', ['run', 'test:package-pack']),
    packageTask('api report', ['run', 'test:api-report']),
  ];
}

function fullTasks(scenarios) {
  return [
    packageTask('changelog entry', ['run', 'test:changelog']),
    packageTask('lint', ['run', 'lint']),
    packageTask('architecture', ['run', 'test:architecture']),
    packageTask('ci contract', ['run', 'test:ci-contract']),
    packageTask('unit', ['run', 'test:unit']),
    packageTask('build lib', ['run', 'build:lib']),
    packageTask('pack audit', ['run', 'test:package-pack']),
    packageTask(
      'selected package-consumer scenarios',
      ['run', 'test:package-consumer', '--', '--minimal-deps', '--scenarios', scenarios.join(',')],
      { env: { HELL_PACKAGE_CONSUMER_TIMEOUT_MS: process.env.HELL_PACKAGE_CONSUMER_TIMEOUT_MS ?? '600000' } },
    ),
    packageTask('api report', ['run', 'test:api-report']),
    packageTask('docs build', ['run', 'build:docs']),
  ];
}

function packageTask(name, args, options = {}) {
  return { name, args, env: options.env ?? {} };
}

function writeHeader() {
  writeLog(`# Hell UI release dry-run evidence\n`);
  writeLog(`Mode: ${mode}\n`);
  writeLog(`Started: ${startedAt.toISOString()}\n`);
  writeLog(`Root: ${root}\n`);
  writeLog(`Git commit: ${gitCommit}\n`);
  writeLog(`Git tracked changes: ${gitTrackedChanges}\n`);
  writeLog(`Node: ${process.version}\n`);
  writeLog(`Platform: ${process.platform} ${process.arch}\n`);
  writeLog(`Selected package-consumer scenarios: ${selectedConsumerScenarios.join(', ')}\n`);
  writeLog(`Evidence log: ${logPath}\n\n`);
  writeLog(`## Planned tasks\n`);
  for (const task of tasks) {
    const invocation = packageManagerInvocation(task.args);
    writeLog(`- ${task.name}: ${formatCommand(invocation.command, invocation.args)}\n`);
  }
  writeLog('\n');
}

async function runTask(task) {
  const invocation = packageManagerInvocation(task.args);
  const taskStartedAt = new Date();
  const startedNs = process.hrtime.bigint();
  const commandLine = formatCommand(invocation.command, invocation.args);

  console.log(`\n[release-dry-run] ${task.name}`);
  writeLog(`## ${task.name}\n`);
  writeLog(`Started: ${taskStartedAt.toISOString()}\n`);
  writeLog(`Command: ${commandLine}\n`);
  const envEntries = Object.entries(task.env);
  if (envEntries.length > 0) {
    writeLog(`Environment overrides: ${envEntries.map(([key, value]) => `${key}=${value}`).join(' ')}\n`);
  }
  writeLog('\n```text\n');

  const result = await spawnAndTee(invocation, task.env);
  const finishedAt = new Date();
  const durationMs = Number(process.hrtime.bigint() - startedNs) / 1_000_000;
  const status = result.status ?? (result.signal ? 1 : 0);

  writeLog('\n```\n');
  writeLog(`Finished: ${finishedAt.toISOString()}\n`);
  writeLog(`Duration: ${(durationMs / 1000).toFixed(1)}s\n`);
  writeLog(`Exit: ${status}${result.signal ? ` (signal ${result.signal})` : ''}\n\n`);

  if (status !== 0) {
    console.error(`[release-dry-run] ${task.name} failed with exit ${status}.`);
  }

  return { name: task.name, status, signal: result.signal, durationMs };
}

function spawnAndTee(invocation, env) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(invocation.command, invocation.args, {
      cwd: root,
      env: { ...process.env, ...env },
      shell: invocation.shell,
    });

    child.stdout.on('data', (chunk) => {
      process.stdout.write(chunk);
      log.write(chunk);
    });
    child.stderr.on('data', (chunk) => {
      process.stderr.write(chunk);
      log.write(chunk);
    });
    child.on('error', reject);
    child.on('close', (status, signal) => resolvePromise({ status, signal }));
  });
}

function writeSummary() {
  const finishedAt = new Date();
  writeLog(`## Summary\n`);
  writeLog(`Finished: ${finishedAt.toISOString()}\n`);
  writeLog(`Exit: ${exitCode}\n`);
  for (const result of results) {
    writeLog(`- ${result.status === 0 ? 'PASS' : 'FAIL'} ${result.name} (${(result.durationMs / 1000).toFixed(1)}s)\n`);
  }
  const skipped = tasks.slice(results.length);
  for (const task of skipped) {
    writeLog(`- SKIP ${task.name}\n`);
  }
}

function writeEvidenceJson() {
  const resultByName = new Map(results.map((result) => [result.name, result]));
  const evidence = {
    version: 1,
    mode,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    root,
    logPath,
    git: {
      commit: gitCommit,
      trackedChanges: gitTrackedChanges,
    },
    selectedConsumerScenarios,
    exitCode,
    tasks: tasks.map((task) => {
      const invocation = packageManagerInvocation(task.args);
      const result = resultByName.get(task.name);
      return {
        name: task.name,
        command: formatCommand(invocation.command, invocation.args),
        status: result?.status ?? null,
        signal: result?.signal ?? null,
        durationMs: result?.durationMs ?? null,
        skipped: !result,
      };
    }),
  };

  writeFileSync(evidenceJsonPath, `${JSON.stringify(evidence, null, 2)}\n`, { flag: 'wx' });
}

function writeLog(value) {
  log.write(value);
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

function gitTrackedChangesState() {
  const result = spawnSync('git', ['status', '--short', '--untracked-files=no'], {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) return 'unknown';
  return result.stdout.trim() ? 'dirty' : 'clean';
}

function closeLog() {
  return new Promise((resolvePromise) => log.end(resolvePromise));
}

function formatCommand(command, args) {
  return [command, ...args].map(shellToken).join(' ');
}

function shellToken(value) {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(value)) return value;
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}
