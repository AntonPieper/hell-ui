import type { TestResult } from '@playwright/test/reporter';
import { describe, expect, it } from 'vitest';

import {
  countsAsFailure,
  describeServedBuild,
  formatRunReport,
  partitionRetryableAttempts,
  toFailureRecord,
  type FailureRecord,
  type RunFacts,
  type Sample,
} from './host-health-reporter';

/**
 * The report is driven with real sample arrays rather than injected accessors,
 * so these exercise the production path from samples through the window filter
 * to the median — the place every one of the reporter's historical defects lived.
 */

const at = 1_700_000_000_000;

const sample = (offset: number, loadPerCpu: number): Sample => ({ at: at + offset, loadPerCpu });

const failure = (title: string, offset: number, length: number): FailureRecord => ({
  title,
  status: 'timedOut',
  startedAt: at + offset,
  endedAt: at + offset + length,
});

const busy = [sample(0, 4.2), sample(1_000, 4.6), sample(2_000, 5.1), sample(3_000, 3.9)];

const busyHost: RunFacts = {
  platform: 'darwin',
  cpuCount: 10,
  loadAvailable: true,
  durationMs: 4_000,
  samples: busy,
  failures: [failure('a › times out', 500, 2_000)],
  observations: [{ at: at + 3_000, outcome: 'answered with the build this run started against' }],
  retriedToGreen: ['b › passed on a retry'],
  retriedFailures: [],
  baseURL: 'http://127.0.0.1:4200',
};

/** No samples at all: every load figure must say so rather than print NaN. */
const noSamples: RunFacts = {
  platform: 'darwin',
  cpuCount: 10,
  loadAvailable: true,
  durationMs: 200,
  samples: [],
  failures: [failure('c › fails instantly', 0, 40)],
  observations: [],
  retriedToGreen: [],
  retriedFailures: [],
  baseURL: 'http://127.0.0.1:4200',
};

/** A platform without load averages. */
const noLoadAverages: RunFacts = {
  platform: 'win32',
  cpuCount: 8,
  loadAvailable: false,
  durationMs: 5_000,
  samples: [],
  failures: [failure('d › fails', 1_000, 800)],
  observations: [{ at: at + 1_000, outcome: 'did not answer' }],
  retriedToGreen: [],
  retriedFailures: [],
  baseURL: 'http://127.0.0.1:4200',
};

const cleanRun: RunFacts = {
  platform: 'linux',
  cpuCount: 4,
  loadAvailable: true,
  durationMs: 9_000,
  samples: busy,
  failures: [],
  observations: [],
  retriedToGreen: [],
  retriedFailures: [],
  baseURL: undefined,
};

/** Several probes, so "nearest" has to mean nearest rather than first. */
const manyProbes: RunFacts = {
  platform: 'linux',
  cpuCount: 4,
  loadAvailable: true,
  durationMs: 20_000,
  samples: busy,
  failures: [failure('e › fails late', 10_000, 1_000)],
  observations: [
    { at: at + 1_000, outcome: 'answered with the build this run started against' },
    { at: at + 11_200, outcome: 'did not answer' },
  ],
  retriedToGreen: [],
  retriedFailures: [],
  baseURL: 'http://127.0.0.1:4200',
};

const scenarios: readonly [string, RunFacts][] = [
  ['a busy host with a timeout', busyHost],
  ['a run with no samples', noSamples],
  ['a platform without load averages', noLoadAverages],
  ['a clean run', cleanRun],
  ['a run with several probes', manyProbes],
];

/**
 * Language this report must never use again.
 *
 * Every blocking finding across six review rounds lived in a sentence like
 * these, and none of them in the numbers underneath. Asserting against the
 * rendered output rather than the code means a reinstated conclusion fails here
 * however it is spelled.
 */
const ADJUDICATING = [
  /verdict/i,
  /attributable/i,
  /oversubscribed/i,
  /starv/i,
  /harness failing/i,
  /unproven/i,
  /\bre-run\b/i,
  /regression/i,
  /\bexplain/i,
];

describe('formatRunReport', () => {
  describe.each(scenarios)('%s', (_case, facts) => {
    it('draws no conclusion about what a failure means', () => {
      const report = formatRunReport(facts).join('\n');

      for (const phrase of ADJUDICATING) expect(report).not.toMatch(phrase);
    });

    it('formats no value that was never measured', () => {
      expect(formatRunReport(facts).join('\n')).not.toMatch(/NaN|undefined|Infinity/);
    });

    it('carries the caveat about what the load figure counts', () => {
      // The caveat travels with the number. A per-logical-CPU figure read
      // without it is misleading on a CPU-capped container, and a comment in
      // the reporter does not reach whoever is reading the log.
      expect(formatRunReport(facts).join('\n')).toMatch(/os\.cpus\(\)\.length/);
    });
  });

  it('reports the median of the samples inside a failure window', () => {
    // The failure spans at+500 to at+2500, so only the samples at 1000 and 2000
    // fall inside it: median of 4.6 and 5.1. The run summary covers all four,
    // which is what makes the window filter observable.
    const report = formatRunReport(busyHost).join('\n');

    expect(report).toMatch(/during that window: median 4\.85 \(2 sample\(s\)\)/);
    expect(report).toMatch(/median 4\.40, peak 5\.10 \(4 sample\(s\)\)/);
  });

  it('says so for a window with no samples, and for a missing probe', () => {
    const report = formatRunReport(noSamples).join('\n');

    expect(report).toMatch(/during that window: median not sampled \(0 sample\(s\)\)/);
    expect(report).toMatch(/server: not probed during this run/);
  });

  it('says so on a platform without load averages', () => {
    expect(formatRunReport(noLoadAverages).join('\n')).toMatch(/not sampled on win32/);
  });

  it('states the probe offset so a reader can weigh it', () => {
    // The probe is reported with its distance from the failure, never as its
    // cause: probes are queued after a failure ends, so a fault is first seen
    // after the failures it produced.
    expect(formatRunReport(busyHost).join('\n')).toMatch(
      /nearest probe 0\.5s after this failure ended/,
    );
    expect(formatRunReport(noLoadAverages).join('\n')).toMatch(
      /nearest probe 0\.8s before this failure ended/,
    );
  });

  it('reports the probe nearest the failure, not whichever happened first', () => {
    expect(formatRunReport(manyProbes).join('\n')).toMatch(
      /nearest probe 0\.2s after this failure ended .* did not answer/,
    );
  });
});

describe('countsAsFailure', () => {
  it('lists only outcomes that ran and went wrong', () => {
    const statuses: TestResult['status'][] = [
      'passed',
      'skipped',
      'interrupted',
      'failed',
      'timedOut',
    ];

    expect(statuses.filter(countsAsFailure)).toEqual(['failed', 'timedOut']);
  });
});

describe('describeServedBuild', () => {
  it('claims no match when the run never learned its baseline', () => {
    // With no baseline there is nothing to compare, and nothing to acquit.
    expect(describeServedBuild(null, 'anything')).toBe(
      'answered, but this run never recorded which build it started against',
    );
  });

  it('reports a match only against a baseline that exists', () => {
    expect(describeServedBuild('digest-a', 'digest-a')).toBe(
      'answered with the build this run started against',
    );
  });

  it('keeps a swapped build reachable', () => {
    expect(describeServedBuild('digest-a', 'digest-b')).toBe(
      'answered with a different build than this run started against',
    );
  });
});

describe('partitionRetryableAttempts', () => {
  // "Covered up by a retry" may only be said of an attempt a retry followed. A
  // run cut short by --max-failures or SIGINT leaves a budgeted retry unrun, and
  // that attempt is where the test ended, so it must reach the failures instead
  // of a list claiming something hid it.
  const firstAttempt = { record: failure('f › failed first', 0, 100), retry: 0 };
  const abandoned = { record: failure('g › never retried', 200, 100), retry: 0 };

  it('counts only an attempt a later attempt followed as covered up', () => {
    const partitioned = partitionRetryableAttempts(
      [firstAttempt, abandoned],
      new Map([
        ['f › failed first', 1],
        ['g › never retried', 0],
      ]),
    );

    expect(partitioned.covered).toEqual([firstAttempt.record]);
    expect(partitioned.unretried).toEqual([abandoned.record]);
  });

  it('cannot have retried a title that recorded no attempt at all', () => {
    expect(partitionRetryableAttempts([abandoned], new Map()).unretried).toEqual([
      abandoned.record,
    ]);
  });
});

describe('toFailureRecord', () => {
  it('carries the measured duration all the way into the report', () => {
    // Not a zero, which would make every window empty and every load figure
    // "not sampled".
    const record = toFailureRecord('t › x', 'failed', new Date(at), 2_500);

    expect(record.endedAt - record.startedAt).toBe(2_500);
    expect(formatRunReport({ ...busyHost, failures: [record] }).join('\n')).toMatch(
      /failed after 2\.5s/,
    );
  });
});
