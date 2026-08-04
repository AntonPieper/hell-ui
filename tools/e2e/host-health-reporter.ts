import { cpus, loadavg, platform } from 'node:os';
import type { FullConfig, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

// @ts-expect-error -- repo tooling is authored as plain ESM without declarations.
import { DOCS_BUILD_STAMP_FILE } from '../docs/docs-build-stamp.mjs';

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
 * - Never say what a failure means. `host-health-reporter.spec.ts` owns the list
 *   of adjudicating language and fails if any of it reappears in the rendered
 *   output, so a future conclusion cannot arrive by a path nobody thought to
 *   test. Checking the output rather than the code means a reinstated
 *   conclusion is caught however it is spelled.
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
  'load is os.loadavg()[0], a trailing one-minute average, divided by os.cpus().length — ' +
  'so it lags the window it is reported for, ignores container CPU limits, and is not the ' +
  "machine's parallelism; loadavg is unavailable on Windows";

export interface Sample {
  readonly at: number;
  readonly loadPerCpu: number;
}

export interface FailureRecord {
  readonly title: string;
  readonly status: string;
  readonly startedAt: number;
  readonly endedAt: number;
}

/** A failed attempt that Playwright's `retries` budget still allowed to be retried. */
interface RetryableAttempt {
  readonly record: FailureRecord;
  readonly retry: number;
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
export function describeServedBuild(baseline: string | null, served: string): ProbeOutcome {
  if (baseline === null) return 'answered, but this run never recorded which build it started against';
  return served === baseline
    ? 'answered with the build this run started against'
    : 'answered with a different build than this run started against';
}

interface ServerObservation {
  readonly at: number;
  readonly outcome: ProbeOutcome;
}

export interface RunFacts {
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
export function countsAsFailure(status: TestResult['status']): boolean {
  return status !== 'passed' && status !== 'skipped' && status !== 'interrupted';
}

/**
 * Splits attempts a retry actually followed from attempts the run merely ended
 * on.
 *
 * Having a retry budget left is not the same as having been retried. A run cut
 * short by `--max-failures` or SIGINT stops after an attempt and never runs the
 * retry it had budgeted, and labelling that "covered up" would claim a retry
 * that never happened — the report's one rule is that it states only what was
 * observed. An attempt nothing followed is the outcome that test ended on, so
 * it belongs with the failures rather than in a list of things a retry hid.
 *
 * `lastAttempt` is the highest attempt index seen for each title, counting
 * passes: a retry that went green is still a retry that ran.
 */
export function partitionRetryableAttempts(
  attempts: readonly RetryableAttempt[],
  lastAttempt: ReadonlyMap<string, number>,
): { covered: FailureRecord[]; unretried: FailureRecord[] } {
  const covered: FailureRecord[] = [];
  const unretried: FailureRecord[] = [];
  for (const attempt of attempts) {
    const last = lastAttempt.get(attempt.record.title) ?? attempt.retry;
    (last > attempt.retry ? covered : unretried).push(attempt.record);
  }
  return { covered, unretried };
}

/** Extracted so the window it records is testable without driving Playwright. */
export function toFailureRecord(
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

/** The whole report. Pure, so its spec drives it with real sample arrays. */
export function formatRunReport(facts: RunFacts): string[] {
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
 * Node documents that `os.cpus()` may return an empty array when CPU info is
 * unavailable. Substituting 1 would invent a machine and divide load by it, so
 * an unknown count stays `null` and every figure derived from it says
 * "not sampled".
 */
function cpuCount(): number | null {
  const count = cpus().length;
  return count > 0 ? count : null;
}

/**
 * A reporter must not be able to decide a run. `readServedBuild` handles every
 * error it can raise today and returns an outcome instead, so nothing in the
 * probe chain rejects — but the chain is awaited in `onEnd`, so the day someone
 * adds a call that can reject, an unmeasured probe would stop being a missing
 * line in the report and start being a failed run. A dropped probe is reported
 * as "not probed"; that is the worst it may cost.
 */
function ignoreProbeFailure(): void {}

class HostHealthReporter implements Reporter {
  private readonly samples: Sample[] = [];
  private readonly failures: FailureRecord[] = [];
  private readonly observations: ServerObservation[] = [];
  private readonly retriedToGreen: string[] = [];
  private readonly retryableAttempts: RetryableAttempt[] = [];
  /** Highest attempt index seen per title, so a retry can be shown to have run. */
  private readonly lastAttempt = new Map<string, number>();
  private readonly startedAt = Date.now();
  private timer: NodeJS.Timeout | undefined;
  private baseURL: string | undefined;
  private startBuild: string | null = null;
  private lastProbeAt = 0;
  private probes: Promise<void> = Promise.resolve();

  constructor() {
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
    this.probes = this.probes
      .then(async () => {
        this.startBuild = (await this.readServedBuild()).digest;
      })
      .catch(ignoreProbeFailure);
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
    this.probes = this.probes
      .then(async () => {
        // Stamped when the probe is issued, not when it answers. A probe that
        // starts immediately and aborts five seconds later was an observation
        // about the moment it started; timestamping it on return reported it as
        // five seconds further from the failure than it was.
        const startedAt = Date.now();
        const { outcome } = await this.readServedBuild();
        this.observations.push({ at: startedAt, outcome });
      })
      .catch(ignoreProbeFailure);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const title = test.titlePath().filter(Boolean).join(' › ');
    // Every attempt counts, passes included: what makes an earlier attempt
    // "covered up" is that a later one ran, whatever that later one did.
    this.lastAttempt.set(title, Math.max(this.lastAttempt.get(title) ?? -1, result.retry));

    if (!countsAsFailure(result.status)) {
      if (result.retry > 0 && result.status === 'passed') this.retriedToGreen.push(title);
      return;
    }

    // Record every failed attempt, including ones a retry later covered up.
    // Returning early on those discarded their duration and window — the very
    // measurements that make a retried failure interpretable, and the thing
    // `retries` is hiding.
    const record = toFailureRecord(title, result.status, result.startTime, result.duration);
    // Only the budget is known here; whether a retry actually followed is not
    // decided until the run ends. `onEnd` sorts that out.
    if (result.retry < test.retries) this.retryableAttempts.push({ record, retry: result.retry });
    else this.failures.push(record);
    this.queueServerProbe(Date.now());
  }

  async onEnd(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    // Every observation must come from during the run: Playwright stops the
    // `webServer` in its teardown phase, which runs before onEnd, so a probe
    // here would always find nothing listening.
    await this.probes.catch(ignoreProbeFailure);

    const { covered, unretried } = partitionRetryableAttempts(
      this.retryableAttempts,
      this.lastAttempt,
    );
    // An attempt nothing followed is where that test ended, so it joins the
    // failures. Chronological order keeps a reclassified attempt next to the
    // rest of the run rather than appended after later failures.
    const failures = [...this.failures, ...unretried].sort((a, b) => a.startedAt - b.startedAt);

    const report = formatRunReport({
      platform: platform(),
      cpuCount: cpuCount(),
      loadAvailable: LOAD_AVERAGE_AVAILABLE,
      durationMs: Date.now() - this.startedAt,
      samples: this.samples,
      failures,
      observations: this.observations,
      retriedToGreen: this.retriedToGreen,
      retriedFailures: covered,
      baseURL: this.baseURL,
    });
    console.log(`\n${report.join('\n')}`);
  }
}

export default HostHealthReporter;
