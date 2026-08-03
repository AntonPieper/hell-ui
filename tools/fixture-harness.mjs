// The runner every fixture suite under tools/ shares.
//
// The suites themselves stay what they are — a corpus plus the assertions only
// that corpus needs — but the scaffolding around them is the same four things
// every time, and when each suite hand-rolled its own the four drifted apart.
// The one that mattered was strictness: every matcher checked that the needles
// a fixture named were reported, and none checked the other direction, so a
// fixture kept passing after the seam under it started failing for a second,
// unrelated reason it never mentioned.
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
// - `extra(entry)` — a reported problem outside the expectations. Optional;
//   defaults to a bare line naming it.
//
// Renderers return one line or an array of lines. There is deliberately no way
// to opt out of the extras check: every suite here came out clean under it
// once its fixtures named what the seam actually reports, so a suite that
// needs an escape hatch should have to argue for one.
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
      failures.push(...toArray((dialect.extra ?? describeExtra)(entry)));
    }
  }
  return failures;
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
// the copy; and `needle` must appear in what it reports. `subject` names the
// mutated thing in the no-op guard, and `tmpPrefix` the temporary directory.
export function runMutatedTreeFixture({
  root,
  copy,
  tmpPrefix,
  path,
  mutate,
  collectErrors,
  needle,
  subject = 'file',
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
      return [`the mutation did not change the ${subject}; the fixture no longer tests anything.`];
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

function describeExtra(entry) {
  return `reported a problem no expectation names: ${entry}`;
}

function toArray(value) {
  return Array.isArray(value) ? value : [value];
}
