import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const junitPath = 'test-results/vitest-junit.xml';
const coverageSummaryPath = 'coverage/coverage-summary.json';
const markdownPath = 'test-results/summary.md';

function readJunitSummary() {
  if (!existsSync(junitPath)) {
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
}

function readCoverageSummary() {
  if (!existsSync(coverageSummaryPath)) {
    return null;
  }

  const summary = JSON.parse(readFileSync(coverageSummaryPath, 'utf8'));
  return summary.total;
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

mkdirSync('test-results', { recursive: true });
writeFileSync(markdownPath, markdown);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
}

if (Number.isFinite(linesPct)) {
  console.log(`CI coverage lines: ${linesPct.toFixed(2)}%`);
}
