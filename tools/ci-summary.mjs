import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const junitPath = join(root, 'test-results/vitest-junit.xml');
const coverageSummaryPath = join(root, 'coverage/coverage-summary.json');
const markdownPath = join(root, 'test-results/summary.md');
const readErrors = [];

function readJunitSummary() {
  try {
    if (!existsSync(junitPath)) {
      return null;
    }

    const stats = statSync(junitPath);
    if (stats.size === 0) {
      return null;
    }

    const xml = readFileSync(junitPath, 'utf8');
    const summaryTag = xml.match(/<testsuites\b[^>]*>/)?.[0] ?? xml.match(/<testsuite\b[^>]*>/)?.[0];

    if (!summaryTag) {
      return null;
    }

    const attr = (name) => {
      const value = summaryTag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
      return value === undefined ? null : Number(value);
    };
    const sumSuiteAttr = (name) =>
      [...xml.matchAll(/<testsuite\b[^>]*>/g)].reduce((total, [tag]) => {
        const value = tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
        return total + (value === undefined ? 0 : Number(value));
      }, 0);

    return {
      tests: attr('tests'),
      failures: attr('failures'),
      errors: attr('errors'),
      skipped: attr('skipped') ?? sumSuiteAttr('skipped'),
      time: attr('time'),
    };
  } catch (error) {
    readErrors.push(`Could not read JUnit report at ${junitPath}: ${errorMessage(error)}`);
    return null;
  }
}

function readCoverageSummary() {
  try {
    if (!existsSync(coverageSummaryPath)) {
      return null;
    }

    const stats = statSync(coverageSummaryPath);
    if (stats.size === 0) {
      return null;
    }

    const summary = JSON.parse(readFileSync(coverageSummaryPath, 'utf8'));
    return summary.total;
  } catch (error) {
    readErrors.push(`Could not parse coverage summary at ${coverageSummaryPath}: ${errorMessage(error)}`);
    return null;
  }
}

function formatNumber(value) {
  return Number.isFinite(value) ? String(value) : 'n/a';
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)}%` : 'n/a';
}

const junit = readJunitSummary();
const coverage = readCoverageSummary();
const linesPct = coverage?.lines?.pct;
const errors = validateSummary(junit, coverage);

const rows = [
  ['Tests', formatNumber(junit?.tests)],
  ['Failures', formatNumber(junit?.failures)],
  ['Errors', formatNumber(junit?.errors)],
  ['Skipped', formatNumber(junit?.skipped)],
  ['Duration', Number.isFinite(junit?.time) ? `${junit.time.toFixed(2)}s` : 'n/a'],
  ['Line coverage', formatPercent(linesPct)],
  ['Branch coverage', formatPercent(coverage?.branches?.pct)],
  ['Function coverage', formatPercent(coverage?.functions?.pct)],
  ['Statement coverage', formatPercent(coverage?.statements?.pct)],
];

const markdown = [
  '## CI Test Summary',
  '',
  '| Metric | Value |',
  '| --- | ---: |',
  ...rows.map(([label, value]) => `| ${label} | ${value} |`),
  '',
].join('\n');

mkdirSync(join(root, 'test-results'), { recursive: true });
rmSync(markdownPath, { force: true });
writeFileSync(markdownPath, markdown);
errors.push(...validateMarkdownSummary(markdown));

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
}

if (Number.isFinite(linesPct)) {
  console.log(`CI coverage lines: ${linesPct.toFixed(2)}%`);
}

if (errors.length) {
  console.error('CI summary failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

function validateSummary(junit, coverage) {
  const errors = [...readErrors];
  if (!junit) {
    errors.push(`Missing or malformed JUnit report at ${junitPath}`);
  } else {
    for (const field of ['tests', 'failures', 'errors', 'skipped', 'time']) {
      if (!Number.isFinite(junit[field])) errors.push(`JUnit summary field ${field} is missing`);
    }
  }

  if (!coverage) {
    errors.push(`Missing or malformed coverage summary at ${coverageSummaryPath}`);
  } else {
    for (const field of ['lines', 'branches', 'functions', 'statements']) {
      if (!Number.isFinite(coverage[field]?.pct)) {
        errors.push(`Coverage summary field ${field}.pct is missing`);
      }
    }
  }

  return errors;
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function validateMarkdownSummary(markdown) {
  const errors = [];
  if (!existsSync(markdownPath)) {
    errors.push(`Markdown summary was not written at ${markdownPath}`);
    return errors;
  }

  if (statSync(markdownPath).size === 0) {
    errors.push(`Markdown summary is empty at ${markdownPath}`);
  }

  const written = readFileSync(markdownPath, 'utf8');
  if (written !== markdown) {
    errors.push(`Markdown summary content changed while writing ${markdownPath}`);
  }

  for (const label of ['Tests', 'Failures', 'Errors', 'Skipped', 'Line coverage']) {
    if (!written.includes(`| ${label} |`)) {
      errors.push(`Markdown summary is missing ${label}`);
    }
  }

  return errors;
}
