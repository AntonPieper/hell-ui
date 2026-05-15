import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const testResultsDir = join(root, 'test-results');
const coverageDir = join(root, 'coverage');
const junitPath = join(testResultsDir, 'vitest-junit.xml');
const coverageSummaryPath = join(coverageDir, 'coverage-summary.json');
const timeoutMs = positiveNumber(process.env.HELL_UNIT_TEST_TIMEOUT_MS, 180_000);
const hangGraceMs = positiveNumber(process.env.HELL_UNIT_TEST_HANG_GRACE_MS, 2_500);
const pollMs = positiveNumber(process.env.HELL_UNIT_TEST_POLL_MS, 250);
const startedAt = Date.now();
const coverageThresholds = {
  statements: 75,
  branches: 70,
  functions: 70,
  lines: 75,
};

rmSync(junitPath, { force: true });
rmSync(coverageDir, { force: true, recursive: true });
mkdirSync(testResultsDir, { recursive: true });

const ng = resolveNgBinary();
const args = [
  'test',
  'hell',
  '--watch=false',
  '--progress=false',
  '--runner-config',
  'vitest.ci.config.ts',
  ...process.argv.slice(2),
];

const child = spawn(ng, args, {
  cwd: root,
  env: { ...process.env, CI: 'true' },
  shell: process.platform === 'win32',
  stdio: ['inherit', 'pipe', 'pipe'],
});

let lastOutputAt = Date.now();
let intentionalTerminate = false;
let timedOut = false;

child.stdout.on('data', (chunk) => forwardOutput(chunk, process.stdout));
child.stderr.on('data', (chunk) => forwardOutput(chunk, process.stderr));

const monitor = setInterval(() => {
  const report = readJUnitReport();
  const coverage = readCoverageSummary();

  if (Date.now() - startedAt > timeoutMs) {
    timedOut = true;
    terminate('SIGTERM');
    return;
  }

  if (!report) return;

  const failed = report.failures > 0 || report.errors > 0;
  const completeEnough = failed || coverageMeetsThresholds(coverage);
  if (completeEnough && Date.now() - lastOutputAt >= hangGraceMs) {
    intentionalTerminate = true;
    terminate('SIGTERM');
  }
}, pollMs);

const result = await waitForClose(child);
clearInterval(monitor);

if (timedOut) {
  console.error(`[unit] timed out after ${timeoutMs}ms`);
  process.exit(1);
}

const report = readJUnitReport();
const coverage = readCoverageSummary();
if (!report) {
  console.error('[unit] Angular/Vitest did not produce a complete JUnit report.');
  process.exit(result.code ?? 1);
}

if (report.tests <= 0) {
  console.error('[unit] JUnit report contains no tests.');
  process.exit(1);
}

if (report.failures > 0 || report.errors > 0) {
  console.error(
    `[unit] JUnit reported ${report.failures} failures and ${report.errors} errors.`,
  );
  process.exit(1);
}

if (!coverageMeetsThresholds(coverage)) {
  console.error('[unit] coverage summary is missing or below configured thresholds.');
  process.exit(1);
}

if (!intentionalTerminate && result.signal) {
  console.error(`[unit] Angular/Vitest exited via ${result.signal}.`);
  process.exit(1);
}

if (!intentionalTerminate && result.code !== 0) {
  process.exit(result.code ?? 1);
}

process.exit(0);

function forwardOutput(chunk, stream) {
  lastOutputAt = Date.now();
  stream.write(chunk);
}

function terminate(signal) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill(signal);
  setTimeout(() => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
  }, 5_000).unref();
}

function waitForClose(processRef) {
  return new Promise((resolve) => {
    processRef.on('close', (code, signal) => resolve({ code, signal }));
  });
}

function readJUnitReport() {
  if (!existsSync(junitPath)) return null;

  try {
    const stats = statSync(junitPath);
    if (stats.mtimeMs < startedAt || stats.size === 0) return null;

    const xml = readFileSync(junitPath, 'utf8');
    if (!/<\/testsuites>|<\/testsuite>/.test(xml)) return null;

    const tag = xml.match(/<testsuites\b[^>]*>|<testsuite\b[^>]*>/)?.[0];
    if (!tag) return null;

    return {
      tests: readXmlNumber(tag, 'tests'),
      failures: readXmlNumber(tag, 'failures'),
      errors: readXmlNumber(tag, 'errors'),
      skipped: readXmlNumber(tag, 'skipped'),
    };
  } catch {
    return null;
  }
}

function readCoverageSummary() {
  if (!existsSync(coverageSummaryPath)) return null;

  try {
    const stats = statSync(coverageSummaryPath);
    if (stats.mtimeMs < startedAt || stats.size === 0) return null;
    return JSON.parse(readFileSync(coverageSummaryPath, 'utf8'));
  } catch {
    return null;
  }
}

function coverageMeetsThresholds(summary) {
  const total = summary?.total;
  if (!total) return false;

  return (
    percentage(total.statements) >= coverageThresholds.statements &&
    percentage(total.branches) >= coverageThresholds.branches &&
    percentage(total.functions) >= coverageThresholds.functions &&
    percentage(total.lines) >= coverageThresholds.lines
  );
}

function percentage(metric) {
  const value = Number(metric?.pct);
  return Number.isFinite(value) ? value : -1;
}

function readXmlNumber(tag, name) {
  const raw = tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function resolveNgBinary() {
  const binary = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'ng.cmd' : 'ng');
  return existsSync(binary) ? binary : 'ng';
}

function positiveNumber(raw, fallback) {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
