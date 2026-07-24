// Style bundle size benchmark.
//
// Measures the compiled/minified CSS that a packed-tarball consumer fixture
// build actually emitted — after the supported Tailwind/PostCSS and
// minification path — and compares it against the accepted release budget
// recorded in a checked-in budget file. The measurement is deliberately
// unfiltered: every emitted CSS byte counts, no outlier removal, no
// exclusions. Optional/heavy stylesheet exclusion is proven by the fixture's
// own forbidden CSS sentinels, not by this measurement.
//
// The consumer fixture runner (tools/check-consumer-fixtures.mjs) invokes
// this module for fixtures whose fixture.json declares `styleBundleBudget`.

import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

// Fixed gzip settings keep the reported gzip byte count deterministic for a
// given compiled output; it never depends on environment defaults.
const gzipOptions = { level: 9 };

// Measures compiled CSS files as { name, bytes } entries. Returns per-file
// and total raw/gzip byte counts with files sorted by name so reports are
// stable regardless of directory traversal order.
export function measureCompiledCss(cssFiles) {
  const files = cssFiles
    .map(({ name, bytes }) => ({
      name,
      rawBytes: bytes.byteLength,
      gzipBytes: gzipSync(bytes, gzipOptions).byteLength,
    }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  return {
    files,
    rawBytes: files.reduce((total, file) => total + file.rawBytes, 0),
    gzipBytes: files.reduce((total, file) => total + file.gzipBytes, 0),
  };
}

// Loads and validates a checked-in style bundle budget file. The file records
// the accepted baseline (package revision, measurement command, measured
// bytes) and the explicit release budget derived from that baseline.
export function loadStyleBundleBudget(budgetPath) {
  const budget = JSON.parse(readFileSync(budgetPath, 'utf8'));

  const baseline = budget.baseline ?? {};
  for (const key of ['fixture', 'packageVersion', 'revision', 'command', 'measuredAt']) {
    if (typeof baseline[key] !== 'string' || !baseline[key].trim()) {
      throw new Error(`Style bundle budget ${budgetPath} baseline.${key} must be a non-empty string`);
    }
  }
  for (const key of ['rawBytes', 'gzipBytes']) {
    assertPositiveInteger(budgetPath, `baseline.${key}`, baseline[key]);
  }

  const limits = budget.budget ?? {};
  for (const key of ['maxRawBytes', 'maxGzipBytes']) {
    assertPositiveInteger(budgetPath, `budget.${key}`, limits[key]);
  }
  if (typeof limits.derivation !== 'string' || !limits.derivation.trim()) {
    throw new Error(`Style bundle budget ${budgetPath} budget.derivation must explain how the budget follows from the baseline`);
  }

  if (limits.maxRawBytes < baseline.rawBytes || limits.maxGzipBytes < baseline.gzipBytes) {
    throw new Error(
      `Style bundle budget ${budgetPath} allows less than its own recorded baseline; re-measure the baseline and derive the budget from it`,
    );
  }

  return budget;
}

// Pure budget comparison. Returns one failure line per exceeded limit; an
// empty array means the measurement is within budget.
export function evaluateStyleBundleBudget({ measurement, budget }) {
  const failures = [];
  if (measurement.rawBytes > budget.maxRawBytes) {
    failures.push(
      `raw CSS is ${formatBytes(measurement.rawBytes)}, exceeding the allowed ${formatBytes(budget.maxRawBytes)}`,
    );
  }
  if (measurement.gzipBytes > budget.maxGzipBytes) {
    failures.push(
      `gzip CSS is ${formatBytes(measurement.gzipBytes)}, exceeding the allowed ${formatBytes(budget.maxGzipBytes)}`,
    );
  }
  return failures;
}

export function formatBytes(bytes) {
  return `${bytes.toLocaleString('en-US')} bytes`;
}

function assertPositiveInteger(budgetPath, key, value) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Style bundle budget ${budgetPath} ${key} must be a positive integer byte count`);
  }
}
