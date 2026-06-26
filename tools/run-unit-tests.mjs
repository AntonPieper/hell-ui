import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const testResultsDir = join(root, 'test-results');
const coverageDir = join(root, 'coverage');
const junitPath = join(testResultsDir, 'vitest-junit.xml');
const markdownSummaryPath = join(testResultsDir, 'summary.md');
const coverageSummaryPath = join(coverageDir, 'coverage-summary.json');
const coberturaPath = join(coverageDir, 'cobertura-coverage.xml');
const timeoutMs = positiveNumber(process.env.HELL_UNIT_TEST_TIMEOUT_MS, 180_000);
const startedAt = Date.now();
const rawArgs = process.argv.slice(2);
const writeCiSummary = rawArgs.includes('--ci-summary');
const testArgs = rawArgs.filter((arg) => arg !== '--ci-summary');
const coverageRequired = !testArgs.some((arg) => arg === '--coverage=false');
const coverageThresholds = {
  statements: 75,
  branches: 70,
  functions: 70,
  lines: 75,
};

rmSync(junitPath, { force: true });
rmSync(markdownSummaryPath, { force: true });
rmSync(coverageDir, { force: true, recursive: true });
mkdirSync(testResultsDir, { recursive: true });

const args = [
  '--filter',
  '@hell-ui/angular',
  'exec',
  'ng',
  'test',
  'hell',
  '--watch=false',
  '--progress=false',
  '--runner-config',
  '../../vitest.ci.config.ts',
  ...testArgs,
];

const child = spawn('pnpm', args, {
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
const coverageStatus = inspectCoverageArtifacts();

if (result.error) {
  console.error(`[unit] Angular/Vitest failed to start: ${result.error.message}`);
  printJUnitDiagnostic(reportStatus);
  if (coverageRequired) printCoverageDiagnostic(coverageStatus);
  printOpenHandleHint();
  finish(1);
}

if (timedOut) {
  console.error(`[unit] timed out after ${timeoutMs}ms`);
  printJUnitDiagnostic(reportStatus);
  if (coverageRequired) printCoverageDiagnostic(coverageStatus);
  printOpenHandleHint();
  finish(1);
}

if (!reportStatus.ok) {
  printJUnitDiagnostic(reportStatus);
  printOpenHandleHint();
  finish(1);
}

if (coverageRequired && !coverageStatus.ok) {
  printCoverageDiagnostic(coverageStatus);
  finish(1);
}

const report = reportStatus.report;
const coverage = coverageStatus.summary;

if (report.tests <= 0) {
  console.error('[unit] JUnit report contains no tests.');
  finish(1);
}

if (report.failures > 0 || report.errors > 0) {
  console.error(
    `[unit] JUnit reported ${report.failures} failures and ${report.errors} errors.`,
  );
  finish(1);
}

if (coverageRequired && !coverageMeetsThresholds(coverage)) {
  console.error('[unit] coverage summary is missing or below configured thresholds.');
  finish(1);
}

if (result.signal) {
  console.error(`[unit] Angular/Vitest exited via ${result.signal}.`);
  finish(1);
}

if (result.code !== 0) {
  finish(result.code ?? 1);
}

finish(0);

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
    processRef.on('error', (error) => resolve({ code: null, signal: null, error }));
    processRef.on('close', (code, signal) => resolve({ code, signal, error: null }));
  });
}

function finish(unitExitCode) {
  const summaryExitCode = writeCiSummary ? runCiSummary() : 0;
  process.exit(unitExitCode === 0 ? summaryExitCode : unitExitCode);
}

function runCiSummary() {
  const summary = spawnSync('node', ['tools/ci-summary.mjs'], {
    cwd: root,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  if (summary.error) {
    console.error(`[unit] CI summary failed to start: ${summary.error.message}`);
    return 1;
  }

  if (summary.signal) {
    console.error(`[unit] CI summary exited via ${summary.signal}.`);
    return 1;
  }

  return summary.status ?? 1;
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

function inspectCoverageArtifacts() {
  const errors = [];
  const summary = readCoverageSummary(errors);
  inspectCoberturaReport(errors);

  return {
    ok: errors.length === 0,
    errors,
    summary,
  };
}

function readCoverageSummary(errors) {
  if (!existsSync(coverageSummaryPath)) {
    errors.push(`coverage summary was not written at ${coverageSummaryPath}`);
    return null;
  }

  try {
    const stats = statSync(coverageSummaryPath);
    if (stats.mtimeMs < startedAt) {
      errors.push(`coverage summary is stale from a previous run at ${coverageSummaryPath}`);
      return null;
    }
    if (stats.size === 0) {
      errors.push(`coverage summary is empty at ${coverageSummaryPath}`);
      return null;
    }

    const summary = JSON.parse(readFileSync(coverageSummaryPath, 'utf8'));
    if (!summary?.total) {
      errors.push(`coverage summary has no total coverage block at ${coverageSummaryPath}`);
      return null;
    }
    return summary;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`could not read coverage summary at ${coverageSummaryPath}: ${message}`);
    return null;
  }
}

function inspectCoberturaReport(errors) {
  if (!existsSync(coberturaPath)) {
    errors.push(`Cobertura report was not written at ${coberturaPath}`);
    return;
  }

  try {
    const stats = statSync(coberturaPath);
    if (stats.mtimeMs < startedAt) {
      errors.push(`Cobertura report is stale from a previous run at ${coberturaPath}`);
      return;
    }
    if (stats.size === 0) {
      errors.push(`Cobertura report is empty at ${coberturaPath}`);
      return;
    }

    const xml = readFileSync(coberturaPath, 'utf8');
    if (!/<coverage\b/.test(xml) || !xml.includes('</coverage>')) {
      errors.push(`Cobertura report is malformed at ${coberturaPath}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`could not read Cobertura report at ${coberturaPath}: ${message}`);
  }
}

function printCoverageDiagnostic(status) {
  if (status.ok) {
    console.error(
      `[unit] coverage reports are complete at ${coverageSummaryPath} and ${coberturaPath}.`,
    );
    return;
  }

  console.error('[unit] coverage reports are missing or incomplete:');
  for (const error of status.errors) {
    console.error(`- ${error}`);
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

function positiveNumber(raw, fallback) {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
