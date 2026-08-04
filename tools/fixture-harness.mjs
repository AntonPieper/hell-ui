// The scaffolding the fixture suites under tools/ share.
//
// Not every suite needs every piece — the loop is universal, the matcher
// serves the six suites that assert over reported problem strings (three of
// them on its default dialect), the merge serves the two that run more than
// one corpus, and the mutated-tree runner serves the two that prove a static
// contract still rejects a violation. What matters is that each piece has one
// implementation:
// when the suites hand-rolled their own, they drifted, and the drift that
// mattered was strictness. Every matcher checked that the needles a fixture
// named were reported, and none checked the other direction, so a fixture kept
// passing after the seam under it started failing for a second, unrelated
// reason it never mentioned.
//
// Node stdlib only: the seams these fixtures cover run in CI jobs that install
// nothing, and a suite must never be the reason a dependency appears.

import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

// Runs each named fixture and prefixes every failure it reports, so a red
// suite names the fixture that went red.
//
// `runOne(fixture, fail)` either returns this fixture's failure messages or
// reports them through `fail` as it goes; suites that build real workspaces
// use `fail` so a broken setup keeps the assertions made before it broke.
// Either way a throw is reported as the thrown message, because a fixture that
// cannot finish is a failing fixture, never a passing one.
export function runNamedFixtures(fixtures, runOne, prefix) {
  const failures = [];
  for (const fixture of fixtures) {
    const reported = [];
    const fail = (message) => reported.push(message);
    try {
      reported.push(...(runOne(fixture, fail) ?? []));
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error));
    }
    for (const failure of reported) {
      failures.push(`${prefix} "${fixture.name}": ${failure}`);
    }
  }
  return { failures, total: fixtures.length };
}

// Compares the problems a seam reported against the substring, or list of
// substrings, a fixture expects, under one strictness rule for every suite:
//
// - a fixture expecting a pass fails on any reported problem;
// - a fixture expecting problems fails on an expectation nobody reported AND
//   on a reported problem no expectation names.
//
// The second half is the rule that used to be missing: without it a fixture
// that names one failure keeps passing while the seam under it grows a
// second, unrelated one.
//
// `dialect` renders the suite's own prose, so a suite keeps its messages:
//
// - `pass(reported)` — the fixture expected a pass. Required.
// - `missing(needle, reported)` — an expectation nobody reported. Required.
// - `none(expected)` — the fixture expected problems and got none at all.
//   Optional: supply it to summarise that case in one line, or leave it out
//   to get one `missing` line per expectation instead.
// - `extra(entry)` — a reported problem outside the expectations. Required.
//
// Renderers return one line or an array of lines. There is deliberately no way
// to opt out of the extras check: every suite here came out clean under it
// once its fixtures named what the seam actually reports, so a suite that
// needs an escape hatch should have to argue for one.
//
// Most suites want `errorDialect` below rather than a hand-written dialect.
export function collectExpectationFailures(reported, expected, dialect) {
  const needles = toArray(expected);
  if (needles.length === 0) {
    return reported.length === 0 ? [] : toArray(dialect.pass(reported));
  }
  if (reported.length === 0 && dialect.none !== undefined) {
    return toArray(dialect.none(needles));
  }

  const failures = [];
  for (const needle of needles) {
    if (!reported.some((entry) => entry.includes(needle))) {
      failures.push(...toArray(dialect.missing(needle, reported)));
    }
  }
  for (const entry of reported) {
    if (!needles.some((needle) => entry.includes(needle))) {
      failures.push(...toArray(dialect.extra(entry)));
    }
  }
  return failures;
}

// The dialect for a suite that asserts over a list of reported error strings.
// Three of them do, and the only prose that varied between their hand-written
// dialects was how each names a clean result and what it calls the rejection it
// expected: `clean` fills "expected <clean>; got: …", `rejection` fills
// "expected <rejection> mentioning …; got a pass.". `got` exists because one
// suite reports "got errors:" where the others report "got:".
export function errorDialect({ clean, rejection, got = 'got: ' }) {
  return {
    pass: (errors) => `expected ${clean}; ${got}${errors.join(' | ')}`,
    none: (expected) => `expected ${rejection} mentioning ${expected.join(', ')}; got a pass.`,
    missing: (needle, errors) =>
      `expected an error mentioning "${needle}"; got: ${errors.join(' | ')}`,
    extra: (error) => `reported an unexpected error: ${error}`,
  };
}

// Combines the results of the corpora a suite runs separately, for the two
// suites that run more than one.
export function mergeFixtureResults(...results) {
  return {
    failures: results.flatMap((result) => result.failures),
    total: results.reduce((count, result) => count + result.total, 0),
  };
}

// Structural equality for the JSON-shaped records fixtures compare — parsed
// payloads, decoded file lists, request sequences. Serialization order is
// stable for these because both sides are built the same way, which is what
// makes the comparison a faithful deep equal rather than a coincidence.
export function jsonEquals(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

// Copies part of the repository into a temporary directory, applies one
// adversarial mutation to a file inside the copy, and asserts that a static
// contract rejects it. This is how a contract that only ever sees the
// compliant repository is kept honest: it has to still catch the violation it
// exists to catch.
//
// `copy` lists repository-relative files and directories to reproduce;
// `path` names the file inside them to mutate; `mutate` receives its real text
// and must return a changed document; `collectErrors` runs the contract over
// the copy; `needle` must appear in what it reports; and `tmpPrefix` names the
// temporary directory.
export function runMutatedTreeFixture({
  root,
  copy,
  tmpPrefix,
  path,
  mutate,
  collectErrors,
  needle,
}) {
  const dir = mkdtempSync(join(tmpdir(), tmpPrefix));
  try {
    for (const relativePath of copy) {
      const destination = join(dir, relativePath);
      mkdirSync(dirname(destination), { recursive: true });
      cpSync(join(root, relativePath), destination, { recursive: true });
    }

    const original = readFileSync(join(root, path), 'utf8');
    const mutated = mutate(original);
    if (mutated === original) {
      return ['the mutation did not change the file; the fixture no longer tests anything.'];
    }
    writeFileSync(join(dir, path), mutated);

    const errors = collectErrors({ root: dir });
    if (!errors.some((error) => error.includes(needle))) {
      return [
        `expected a contract error mentioning "${needle}"; got: ` +
          `${errors.join(' | ') || '(no errors)'}`,
      ];
    }
    return [];
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
}

function toArray(value) {
  return Array.isArray(value) ? value : [value];
}
