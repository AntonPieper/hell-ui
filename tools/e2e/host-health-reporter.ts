import assert from 'node:assert/strict';
import { cpus, loadavg, platform } from 'node:os';
import type { FullConfig, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

// @ts-expect-error -- repo tooling is authored as plain ESM without declarations.
import { DOCS_BUILD_STAMP_FILE } from '../docs-build-stamp.mjs';

/**
 * Reports what the machine and the docs server were doing while the tests ran,
 * and stops there.
 *
 * An earlier version drew conclusions: "these timeouts are not attributable to
 * these tests", "the host was not oversubscribed". Six review rounds found the
 * measurements sound and the conclusions wrong — in both directions. It excused
 * four real assertion failures on an idle host because one worker had died; it
 * convicted on the exact shape it was built to name, by counting the harness's
 * own timeout notice as evidence about what a matcher saw; and the branch meant
 * to catch a stale server could never execute, because it required every
 * failure to be faster than the matcher timeout that produced it.
 *
 * A diagnostic that misexplains a failure is worse than one that explains
 * nothing, because it sends people somewhere else with authority. So this
 * prints numbers and leaves the reading to the reader.
 *
 * Two rules hold the rest together:
 *
 * - Never print a figure that was not measured; absent data says "not sampled".
 * - Never say what a failure means. `checkReportStaysDescriptiveFixture` fails
 *   the run if adjudicating language reappears in the output, so a future
 *   conclusion cannot arrive by a path nobody thought to test.
 */

const SAMPLE_INTERVAL_MS = 1_000;

/** Probing on every failure would add load; once per window dates it well enough. */
const SERVER_PROBE_INTERVAL_MS = 5_000;
const SERVER_PROBE_TIMEOUT_MS = 5_000;

/**
 * `os.loadavg()` returns zeros on Windows rather than failing, so a per-CPU
 * figure there would be fiction rather than a measurement.
 */
const LOAD_AVERAGE_AVAILABLE = platform() !== 'win32';

/**
 * Printed in the output, not only here. `os.cpus().length` counts logical CPUs
 * visible to the process: Node's own documentation warns it is not the
 * machine's parallelism, and a container with a CPU quota still sees every host
 * CPU — so load per logical CPU understates pressure exactly where a runner is
 * most constrained.
 */
const CPU_CAVEAT =
  'load is per logical CPU from os.cpus().length, which ignores container CPU ' +
  "limits and is not the machine's parallelism; loadavg is unavailable on Windows";

interface Sample {
  readonly at: number;
  readonly loadPerCpu: number;
}

interface FailureRecord {
  readonly title: string;
  readonly status: string;
  readonly startedAt: number;
  readonly endedAt: number;
}

type ProbeOutcome =
  | 'answered with the build this run started against'
  | 'answered with a different build than this run started against'
  | 'answered, but this run never recorded which build it started against'
  | 'answered, but served no build stamp'
  | 'did not answer'
  | 'probe timed out before answering';

/**
 * Names what a probe saw, relative to the build the run started against.
 *
 * The baseline can be missing: the opening probe returns no digest when it is
 * refused, times out on the five-second abort, gets a non-2xx, gets a body that
 * is not JSON, or gets a stamp without `sourcesDigest`. Reporting a match in
 * that case claimed the served build was the expected one on the strength of a
 * comparison that never happened — a false acquittal of exactly the kind this
 * file was rewritten to remove, and the timeout is likeliest on the saturated
 * host it exists to describe.
 *
 * Without a baseline there is nothing to compare, so it says that instead.
 */
function describeServedBuild(baseline: string | null, served: string): ProbeOutcome {
  if (baseline === null) return 'answered, but this run never recorded which build it started against';
  return served === baseline
    ? 'answered with the build this run started against'
    : 'answered with a different build than this run started against';
}

interface ServerObservation {
  readonly at: number;
  readonly outcome: ProbeOutcome;
}

interface RunFacts {
  readonly platform: string;
  readonly cpuCount: number | null;
  readonly loadAvailable: boolean;
  readonly durationMs: number;
  readonly samples: readonly Sample[];
  readonly failures: readonly FailureRecord[];
  readonly observations: readonly ServerObservation[];
  readonly retriedToGreen: readonly string[];
  readonly retriedFailures: readonly FailureRecord[];
  readonly baseURL: string | undefined;
}

/**
 * Whether an outcome is a failure worth describing.
 *
 * `interrupted` is not. Playwright sets it — with no errors at all — for tests
 * abandoned when a run is cut short by `--max-failures` or SIGINT, so listing
 * them would describe tests that never ran.
 */
function countsAsFailure(status: TestResult['status']): boolean {
  return status !== 'passed' && status !== 'skipped' && status !== 'interrupted';
}

/** Extracted so the window it records is testable without driving Playwright. */
function toFailureRecord(
  title: string,
  status: string,
  startTime: Date,
  durationMs: number,
): FailureRecord {
  const startedAt = startTime.getTime();
  return { title, status, startedAt, endedAt: startedAt + durationMs };
}

/** `null`, never `NaN`, for an empty set: absent data must not format as a number. */
function median(values: readonly number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * `Number.isFinite` rather than a null check alone: `Math.max()` of an empty
 * list is `-Infinity` and a division by a zero CPU count is `NaN`, and both
 * would print as a figure nobody measured.
 */
function formatLoad(value: number | null): string {
  return value === null || !Number.isFinite(value) ? 'not sampled' : value.toFixed(2);
}

function formatClock(at: number): string {
  return new Date(at).toISOString().slice(11, 23);
}

function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

function samplesDuring(
  samples: readonly Sample[],
  window: { readonly startedAt: number; readonly endedAt: number },
): Sample[] {
  return samples.filter((sample) => sample.at >= window.startedAt && sample.at <= window.endedAt);
}

/**
 * What the nearest probe saw, and how far it was from this failure.
 *
 * Deliberately not "this failure was caused by the server". Probes are queued
 * only once a failed result has ended, so a server that died mid-test is first
 * observed *after* every failure it caused — any attribution built on these
 * timestamps points the wrong way. The offset is reported so a reader can weigh
 * it themselves.
 */
function describeProbeFor(
  failure: FailureRecord,
  observations: readonly ServerObservation[],
): string {
  if (!observations.length) return 'server: not probed during this run';
  const nearest = observations.reduce((best, candidate) =>
    Math.abs(candidate.at - failure.endedAt) < Math.abs(best.at - failure.endedAt) ? candidate : best,
  );
  const offset = nearest.at - failure.endedAt;
  const when =
    offset >= 0
      ? `${formatSeconds(offset)} after this failure ended`
      : `${formatSeconds(-offset)} before this failure ended`;
  return `server: nearest probe ${when} (${formatClock(nearest.at)}) ${nearest.outcome}`;
}

/** The whole report. Pure, so a fixture drives it with real sample arrays. */
function formatRunReport(facts: RunFacts): string[] {
  const loads = facts.samples.map((sample) => sample.loadPerCpu);
  const lines = [
    `[host-health] ${facts.platform}, ${facts.cpuCount ?? 'an unknown number of'} logical CPUs, ` +
      `run ${formatSeconds(facts.durationMs)}`,
  ];

  lines.push(
    facts.loadAvailable
      ? `[host-health] load per logical CPU over the run: median ${formatLoad(median(loads))}, ` +
          `peak ${formatLoad(loads.length ? Math.max(...loads) : null)} ` +
          `(${facts.samples.length} sample(s))`
      : `[host-health] load per logical CPU over the run: not sampled on ${facts.platform}`,
  );
  lines.push(`[host-health] note: ${CPU_CAVEAT}`);

  if (facts.retriedToGreen.length) {
    lines.push(
      `[host-health] ${facts.retriedToGreen.length} test(s) failed once and passed on a retry:`,
      ...facts.retriedToGreen.map((title) => `[host-health]   - ${title}`),
    );
  }

  // The attempts a retry covered up, measured the same way as any other
  // failure. These are what `retries` hides, so they are the ones worth
  // measuring before it is removed.
  if (facts.retriedFailures.length) {
    lines.push(`[host-health] ${facts.retriedFailures.length} covered-up attempt(s):`);
    for (const attempt of facts.retriedFailures) {
      lines.push(...describeFailure(attempt, facts));
    }
  }

  if (facts.observations.length) {
    lines.push(`[host-health] server probes (${facts.baseURL ?? 'no base URL'}):`);
    for (const observation of facts.observations) {
      lines.push(`[host-health]   ${formatClock(observation.at)} ${observation.outcome}`);
    }
  }

  if (!facts.failures.length) return lines;

  lines.push(`[host-health] ${facts.failures.length} failure(s), measurements only:`);
  for (const failure of facts.failures) lines.push(...describeFailure(failure, facts));

  return lines;
}

/** One failure's measurements, shared by final failures and covered-up attempts. */
function describeFailure(failure: FailureRecord, facts: RunFacts): string[] {
  const during = samplesDuring(facts.samples, failure).map((sample) => sample.loadPerCpu);
  return [
    `[host-health] - ${failure.title}`,
    `[host-health]     ${failure.status} after ` +
      `${formatSeconds(failure.endedAt - failure.startedAt)} ` +
      `(${formatClock(failure.startedAt)} to ${formatClock(failure.endedAt)})`,
    `[host-health]     load per logical CPU during that window: ` +
      (facts.loadAvailable
        ? `median ${formatLoad(median(during))} (${during.length} sample(s))`
        : 'not sampled on this platform'),
    `[host-health]     ${describeProbeFor(failure, facts.observations)}`,
  ];
}

/**
 * Language this report must never use again.
 *
 * Every blocking finding across six rounds lived in a sentence like these, and
 * none of them in the numbers underneath. Checking the rendered output rather
 * than the code means a reinstated conclusion fails here however it is spelled.
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

function checkReportStaysDescriptiveFixture(): void {
  const at = 1_700_000_000_000;
  const sample = (offset: number, loadPerCpu: number): Sample => ({ at: at + offset, loadPerCpu });
  const failure = (title: string, offset: number, length: number): FailureRecord => ({
    title,
    status: 'timedOut',
    startedAt: at + offset,
    endedAt: at + offset + length,
  });

  const busy = [sample(0, 4.2), sample(1_000, 4.6), sample(2_000, 5.1), sample(3_000, 3.9)];

  const scenarios: RunFacts[] = [
    {
      platform: 'darwin',
      cpuCount: 10,
      loadAvailable: true,
      durationMs: 4_000,
      samples: busy,
      failures: [failure('a › times out', 500, 2_000)],
      observations: [
        { at: at + 3_000, outcome: 'answered with the build this run started against' },
      ],
      retriedToGreen: ['b › passed on a retry'],
      retriedFailures: [],
      baseURL: 'http://127.0.0.1:4200',
    },
    // No samples at all: every load figure must say so rather than print NaN.
    {
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
    },
    // A platform without load averages.
    {
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
    },
    {
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
    },
    // Several probes, so "nearest" has to mean nearest rather than first.
    {
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
    },
  ];

  for (const facts of scenarios) {
    const report = formatRunReport(facts).join('\n');
    for (const phrase of ADJUDICATING) {
      assert.doesNotMatch(
        report,
        phrase,
        `the report drew a conclusion (${phrase}); it may only state measurements`,
      );
    }
    assert.doesNotMatch(report, /NaN|undefined|Infinity/, 'no unmeasured value may be formatted');
  }

  // Real sample arrays, not an injected accessor: this drives the production
  // path from samples through the window filter to the median.
  const busyReport = formatRunReport(scenarios[0]).join('\n');
  // The failure spans at+500 to at+2500, so only the samples at 1000 and 2000
  // fall inside it: median of 4.6 and 5.1. The run summary below covers all
  // four, which is what makes the window filter observable.
  assert.match(
    busyReport,
    /during that window: median 4\.85 \(2 sample\(s\)\)/,
    'the per-failure figure must be the median of the samples inside that window',
  );
  assert.match(
    busyReport,
    /median 4\.40, peak 5\.10 \(4 sample\(s\)\)/,
    'and the run summary must aggregate every sample',
  );

  const noSamples = formatRunReport(scenarios[1]).join('\n');
  assert.match(
    noSamples,
    /during that window: median not sampled \(0 sample\(s\)\)/,
    'a window with no samples must say so',
  );
  assert.match(noSamples, /server: not probed during this run/, 'and so must a missing probe');

  const windows = formatRunReport(scenarios[2]).join('\n');
  assert.match(windows, /not sampled on win32/, 'a platform without load averages must say so');

  // The probe is reported with its distance from the failure, never as its
  // cause: probes are queued after a failure ends, so a fault is first seen
  // after the failures it produced.
  assert.match(
    busyReport,
    /nearest probe 0\.5s after this failure ended/,
    'the probe offset must be stated so a reader can weigh it',
  );
  assert.match(
    windows,
    /nearest probe 0\.8s before this failure ended/,
    'including when the probe preceded the failure',
  );

  // With more than one probe, the one reported must be the closest to the
  // failure, not whichever happened first.
  const manyProbes = formatRunReport(scenarios[4]).join('\n');
  assert.match(
    manyProbes,
    /nearest probe 0\.2s after this failure ended .* did not answer/,
    'the probe nearest the failure must be the one reported',
  );

  // The caveat travels with the number. A per-logical-CPU figure read without
  // it is misleading on a CPU-capped container, and a comment in this file
  // does not reach whoever is reading the log.
  for (const facts of scenarios) {
    assert.match(
      formatRunReport(facts).join('\n'),
      /os\.cpus\(\)\.length/,
      'every report must carry the caveat about what the figure counts',
    );
  }

  assert.deepEqual(
    (['passed', 'skipped', 'interrupted', 'failed', 'timedOut'] as TestResult['status'][]).filter(
      countsAsFailure,
    ),
    ['failed', 'timedOut'],
    'only outcomes that ran and went wrong may be listed',
  );

  // A run that never learned its baseline must not report a match against it.
  assert.equal(
    describeServedBuild(null, 'anything'),
    'answered, but this run never recorded which build it started against',
    'with no baseline there is nothing to compare, and nothing to acquit',
  );
  assert.equal(
    describeServedBuild('digest-a', 'digest-a'),
    'answered with the build this run started against',
    'a match is only a match against a baseline that exists',
  );
  assert.equal(
    describeServedBuild('digest-a', 'digest-b'),
    'answered with a different build than this run started against',
    'and a swap must stay reachable',
  );

  // A failure record must carry the duration the run measured, not a zero that
  // would make every window empty and every load figure "not sampled".
  const record = toFailureRecord('t › x', 'failed', new Date(at), 2_500);
  assert.equal(record.endedAt - record.startedAt, 2_500, 'the recorded window is the real duration');
  assert.match(
    formatRunReport({ ...scenarios[0], failures: [record] }).join('\n'),
    /failed after 2\.5s/,
    'and it reaches the report',
  );
}

/**
 * Node documents that `os.cpus()` may return an empty array when CPU info is
 * unavailable. Substituting 1 would invent a machine and divide load by it, so
 * an unknown count stays `null` and every figure derived from it says
 * "not sampled".
 */
function cpuCount(): number | null {
  const count = cpus().length;
  return count > 0 ? count : null;
}

class HostHealthReporter implements Reporter {
  private readonly samples: Sample[] = [];
  private readonly failures: FailureRecord[] = [];
  private readonly observations: ServerObservation[] = [];
  private readonly retriedToGreen: string[] = [];
  private readonly retriedFailures: FailureRecord[] = [];
  private readonly startedAt = Date.now();
  private timer: NodeJS.Timeout | undefined;
  private baseURL: string | undefined;
  private startBuild: string | null = null;
  private lastProbeAt = 0;
  private probes: Promise<void> = Promise.resolve();

  constructor() {
    checkReportStaysDescriptiveFixture();
    if (!LOAD_AVERAGE_AVAILABLE) return;
    // Sampling starts at config load, so the window covers the docs build and
    // browser launches as well as the tests themselves.
    this.timer = setInterval(() => {
      const cpus = cpuCount();
      if (cpus === null) return;
      this.samples.push({ at: Date.now(), loadPerCpu: loadavg()[0] / cpus });
    }, SAMPLE_INTERVAL_MS);
    this.timer.unref();
  }

  onBegin(config: FullConfig): void {
    this.baseURL = config.projects[0]?.use?.baseURL;
    this.probes = this.probes.then(async () => {
      this.startBuild = (await this.readServedBuild()).digest;
    });
  }

  /**
   * Reads the served build stamp. The abort covers body streaming as well as
   * connect, so a response whose headers arrive in time but whose body does not
   * is reported as a probe that timed out, never as a dead server.
   */
  private async readServedBuild(): Promise<{ outcome: ProbeOutcome; digest: string | null }> {
    if (!this.baseURL) return { outcome: 'answered, but served no build stamp', digest: null };
    let response: Response;
    try {
      response = await fetch(new URL(`/${DOCS_BUILD_STAMP_FILE}`, this.baseURL), {
        signal: AbortSignal.timeout(SERVER_PROBE_TIMEOUT_MS),
      });
    } catch (error) {
      const timedOut = error instanceof Error && error.name === 'TimeoutError';
      return {
        outcome: timedOut ? 'probe timed out before answering' : 'did not answer',
        digest: null,
      };
    }
    if (!response.ok) return { outcome: 'answered, but served no build stamp', digest: null };
    try {
      const stamp = (await response.json()) as { sourcesDigest?: string };
      const digest = stamp.sourcesDigest ?? null;
      if (digest === null) return { outcome: 'answered, but served no build stamp', digest };
      return { outcome: describeServedBuild(this.startBuild, digest), digest };
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        return { outcome: 'probe timed out before answering', digest: null };
      }
      // A single-page-app fallback answers unknown paths with the app shell.
      if (error instanceof SyntaxError) {
        return { outcome: 'answered, but served no build stamp', digest: null };
      }
      return { outcome: 'did not answer', digest: null };
    }
  }

  private queueServerProbe(at: number): void {
    if (at - this.lastProbeAt < SERVER_PROBE_INTERVAL_MS) return;
    this.lastProbeAt = at;
    this.probes = this.probes.then(async () => {
      // Stamped when the probe is issued, not when it answers. A probe that
      // starts immediately and aborts five seconds later was an observation
      // about the moment it started; timestamping it on return reported it as
      // five seconds further from the failure than it was.
      const startedAt = Date.now();
      const { outcome } = await this.readServedBuild();
      this.observations.push({ at: startedAt, outcome });
    });
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const title = test.titlePath().filter(Boolean).join(' › ');
    if (!countsAsFailure(result.status)) {
      if (result.retry > 0 && result.status === 'passed') this.retriedToGreen.push(title);
      return;
    }

    // Record every failed attempt, including ones a retry later covered up.
    // Returning early on those discarded their duration and window — the very
    // measurements that make a retried failure interpretable, and the thing
    // `retries` is hiding.
    const record = toFailureRecord(title, result.status, result.startTime, result.duration);
    if (result.retry < test.retries) this.retriedFailures.push(record);
    else this.failures.push(record);
    this.queueServerProbe(Date.now());
  }

  async onEnd(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    // Every observation must come from during the run: Playwright stops the
    // `webServer` in its teardown phase, which runs before onEnd, so a probe
    // here would always find nothing listening.
    await this.probes;

    const report = formatRunReport({
      platform: platform(),
      cpuCount: cpuCount(),
      loadAvailable: LOAD_AVERAGE_AVAILABLE,
      durationMs: Date.now() - this.startedAt,
      samples: this.samples,
      failures: this.failures,
      observations: this.observations,
      retriedToGreen: this.retriedToGreen,
      retriedFailures: this.retriedFailures,
      baseURL: this.baseURL,
    });
    console.log(`\n${report.join('\n')}`);
  }
}

export default HostHealthReporter;
