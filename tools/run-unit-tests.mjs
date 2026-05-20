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
const startedAt = Date.now();
const coverageRequired = !process.argv.slice(2).some((arg) => arg === '--coverage=false');
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

let timedOut = false;

child.stdout.on('data', (chunk) => forwardOutput(chunk, process.stdout));
child.stderr.on('data', (chunk) => forwardOutput(chunk, process.stderr));

const timeout = setTimeout(() => {
  timedOut = true;
  terminate('SIGTERM');
}, timeoutMs);

const result = await waitForClose(child);
clearTimeout(timeout);

const reportStatus = inspectJUnitReport();

if (timedOut) {
  console.error(`[unit] timed out after ${timeoutMs}ms`);
  printJUnitDiagnostic(reportStatus);
  printOpenHandleHint();
  process.exit(1);
}

const coverage = readCoverageSummary();
if (!reportStatus.ok) {
  printJUnitDiagnostic(reportStatus);
  printOpenHandleHint();
  process.exit(1);
}

const report = reportStatus.report;

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

if (coverageRequired && !coverageMeetsThresholds(coverage)) {
  console.error('[unit] coverage summary is missing or below configured thresholds.');
  process.exit(1);
}

if (result.signal) {
  console.error(`[unit] Angular/Vitest exited via ${result.signal}.`);
  process.exit(1);
}

if (result.code !== 0) {
  process.exit(result.code ?? 1);
}

process.exit(0);

function forwardOutput(chunk, stream) {
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

function inspectJUnitReport() {
  if (!existsSync(junitPath)) {
    return { ok: false, reason: 'file was not written' };
  }

  try {
    const stats = statSync(junitPath);
    if (stats.mtimeMs < startedAt) {
      return { ok: false, reason: 'file is stale from a previous run' };
    }
    if (stats.size === 0) {
      return { ok: false, reason: 'file is empty' };
    }

    const xml = readFileSync(junitPath, 'utf8');
    const tag = xml.match(/<testsuites\b[^>]*>|<testsuite\b[^>]*>/)?.[0];
    if (!tag) {
      return { ok: false, reason: 'XML has no testsuite summary tag' };
    }

    const rootName = tag.startsWith('<testsuites') ? 'testsuites' : 'testsuite';
    if (!xml.includes(`</${rootName}>`)) {
      return { ok: false, reason: `XML has no closing ${rootName} tag` };
    }

    return {
      ok: true,
      report: {
        tests: readXmlNumber(tag, 'tests'),
        failures: readXmlNumber(tag, 'failures'),
        errors: readXmlNumber(tag, 'errors'),
        skipped: readXmlNumber(tag, 'skipped'),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `could not read file: ${message}` };
  }
}

function printJUnitDiagnostic(status) {
  if (status.ok) {
    console.error(
      `[unit] JUnit report is complete at ${junitPath}: ${status.report.tests} tests, ${status.report.failures} failures, ${status.report.errors} errors.`,
    );
    return;
  }

  console.error(`[unit] JUnit report is missing or incomplete at ${junitPath}: ${status.reason}.`);
}

function printOpenHandleHint() {
  console.error('[unit] Open-handle diagnostics are enabled by the Vitest hanging-process reporter.');
  console.error(
    '[unit] If no handle list appears above, rerun with a larger HELL_UNIT_TEST_TIMEOUT_MS so Vitest can finish teardown diagnostics before this wrapper kills it.',
  );
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
