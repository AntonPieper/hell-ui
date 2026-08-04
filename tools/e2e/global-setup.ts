import { cpus, loadavg } from 'node:os';
import { join } from 'node:path';
import type { FullConfig } from '@playwright/test';

// @ts-expect-error -- repo tooling is authored as plain ESM without declarations.
import { OVERSUBSCRIBED_LOAD_PER_CORE } from './host-load.mjs';

// @ts-expect-error -- repo tooling is authored as plain ESM without declarations.
import {
  DOCS_BUILD_STAMP_FILE,
  computeDocsSourcesDigest,
  describeForeignDocsBuild,
} from '../docs-build-stamp.mjs';

/**
 * Two preconditions the suite cannot check for itself, both of which have
 * already produced findings that did not exist:
 *
 * - Measuring a docs build from somewhere else. `reuseExistingServer` outside
 *   CI hands the whole suite to whatever is already listening on the port,
 *   including another worktree's dev server.
 * - Measuring a saturated host. Playwright's actionability gate is frame-driven,
 *   so a starved machine produces bare timeouts that read exactly like flaky
 *   specs.
 *
 * Both fail fast here rather than being diagnosed one lane at a time.
 */

// Playwright transpiles config files to CommonJS, so `__dirname` is the
// portable choice here — `playwright.config.ts` resolves the same way.
const root = join(__dirname, '../..');

const ALLOW_LOADED_HOST = 'HELL_E2E_ALLOW_LOADED_HOST';
const ALLOW_UNVERIFIED_BUILD = 'HELL_E2E_ALLOW_UNVERIFIED_BUILD';

const LOAD_SAMPLE_INTERVAL_MS = 2_000;

/**
 * Long enough for a one-minute average to shed a finished docs build, since
 * that is the load this most often has to wait out. A busy host leaves earlier,
 * on the plateau below.
 */
const LOAD_SETTLE_BUDGET_MS = 90_000;

/** Consecutive samples without real improvement before calling it a plateau. */
const LOAD_PLATEAU_SAMPLES = 5;

/** Below this, a change between samples is noise rather than a falling curve. */
const LOAD_MEANINGFUL_DECLINE = 0.05;

/** A stale process that accepts a connection and never answers must not hang the run. */
const PREFLIGHT_FETCH_TIMEOUT_MS = 10_000;

export default async function globalSetup(config: FullConfig): Promise<void> {
  await assertHostHasHeadroom();
  await assertServedDocsBuildMatchesWorkspace(config);
}

/**
 * Waits for the load average to stop falling, rather than reading it once.
 *
 * Playwright starts the `webServer` before `globalSetup`, and that command
 * builds the docs — so on a cold run this samples moments after a 90-second
 * Angular build has saturated the machine. A single reading there describes our
 * own build, not the host, and `pnpm run e2e` refused itself on an otherwise
 * idle laptop at 3.51 per core.
 *
 * A short window is not enough either: `loadavg()[0]` is a trailing one-minute
 * average, so a finished build keeps it elevated for about a minute. Ten
 * seconds of sampling could not shed it.
 *
 * So the shape of the curve is the signal. A machine recovering from work that
 * has already finished falls steadily; a machine with real competing load
 * plateaus. This waits while the reading keeps improving, gives up when it
 * stops, and returns immediately once there is headroom — so an idle host pays
 * nothing and a busy one is not misread as a decaying tail.
 */
async function settledLoadPerCore(): Promise<number> {
  const coreCount = Math.max(cpus().length, 1);
  let lowest = loadavg()[0] / coreCount;
  const deadline = Date.now() + LOAD_SETTLE_BUDGET_MS;
  let plateaus = 0;

  while (lowest > OVERSUBSCRIBED_LOAD_PER_CORE && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, LOAD_SAMPLE_INTERVAL_MS));
    const reading = loadavg()[0] / coreCount;
    // Meaningful improvement resets the count; noise around a plateau does not.
    if (reading < lowest - LOAD_MEANINGFUL_DECLINE) plateaus = 0;
    else plateaus += 1;
    lowest = Math.min(lowest, reading);
    if (plateaus >= LOAD_PLATEAU_SAMPLES) break;
  }
  return lowest;
}

async function assertHostHasHeadroom(): Promise<void> {
  // Decided before measuring, because measuring costs up to ten seconds of
  // sampling and CI does not act on the result. Sampling first burned that on
  // every shard to produce a warning it then ignored.
  //
  // CI does not gate on load, on purpose. This check exists for a *shared*
  // machine — several agents and their browsers competing for one developer
  // laptop, where a high reading means somebody else's work will distort ours.
  // A GitHub runner is dedicated to one job, so there is no competing tenant to
  // detect, and a runner that is genuinely degraded is not something this can
  // tell apart from a busy one.
  //
  // Note what the reading at this moment is *not*: `globalSetup` runs before
  // any worker exists, and `loadavg()[0]` is a trailing one-minute average, so
  // it describes the install, the checkout and the docs build that preceded it
  // — not the eight workers about to start. An earlier version of this comment
  // blamed those workers, which cannot have contributed to it.
  //
  // The consequence is accepted knowingly: CI cannot detect a degraded runner
  // this way. The reporter records load per failure, which is where a shard
  // that looks wrong can actually be read.
  if (process.env.CI) {
    console.log('[e2e-preflight] CI runner: not gating on host load');
    return;
  }

  const coreCount = Math.max(cpus().length, 1);
  const loadPerCore = await settledLoadPerCore();
  const summary = `${(loadPerCore * coreCount).toFixed(2)} across ${coreCount} cores (${loadPerCore.toFixed(2)} per core)`;

  if (loadPerCore <= OVERSUBSCRIBED_LOAD_PER_CORE) {
    console.log(`[e2e-preflight] host has headroom: ${summary}`);
    return;
  }

  if (process.env[ALLOW_LOADED_HOST]) {
    console.warn(
      `[e2e-preflight] host is saturated (${summary}) but ${ALLOW_LOADED_HOST} is set; ` +
        'starting anyway. The reporter records the load during each failure.',
    );
    return;
  }

  throw new Error(
    `Refusing to start: the host is saturated — ${summary}, over ${OVERSUBSCRIBED_LOAD_PER_CORE} per core.\n` +
      "Playwright's actionability checks wait on animation frames, so results from a host with " +
      'no headroom are hard to read either way. Wait for the machine to settle, or set ' +
      `${ALLOW_LOADED_HOST}=1 to start anyway.`,
  );
}

async function assertServedDocsBuildMatchesWorkspace(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use?.baseURL;
  if (!baseURL) return;

  const stamp = await fetchDocsBuildStamp(baseURL);

  // An external base URL is a deliberately foreign target — a deployed preview,
  // or the docs artifact CI serves from its own container — so which sources
  // built it is not this checkout's business. That it is a real docs build is:
  // a stale process still holding the port answers just well enough to be
  // adopted, and every test then runs against nothing. Identify, do not assume.
  if (process.env.HELL_E2E_BASE_URL) {
    if (stamp?.sourcesDigest) {
      console.log(
        `[e2e-preflight] measuring external ${baseURL}: built ${stamp.builtAt} from ` +
          `${stamp.commit ?? 'an unknown commit'}${stamp.dirty ? ' (dirty)' : ''}`,
      );
      return;
    }
    if (process.env[ALLOW_UNVERIFIED_BUILD]) {
      console.warn(
        `[e2e-preflight] ${baseURL} serves no build stamp but ${ALLOW_UNVERIFIED_BUILD} is set; ` +
          'this run cannot say which build it measured.',
      );
      return;
    }
    throw new Error(
      [
        `Refusing to start: ${baseURL} serves no build stamp, so nothing identifies what is`,
        'answering there. A stale server still holding the port looks exactly like this, and',
        'every test would run against it. Confirm the docs build is being served, or set',
        `${ALLOW_UNVERIFIED_BUILD}=1 to measure it unverified.`,
      ].join(' '),
    );
  }

  const failures = describeForeignDocsBuild({
    root,
    stamp,
    currentDigest: computeDocsSourcesDigest(root),
    serverAnswersPages: await serverAnswersPages(baseURL),
  });
  if (!failures.length) {
    console.log(`[e2e-preflight] serving this checkout's current docs build`);
    return;
  }

  throw new Error(
    ['Refusing to start: the docs server is not serving this checkout.', ...failures].join('\n- '),
  );
}

async function fetchDocsBuildStamp(
  baseURL: string,
): Promise<{ builtAt?: string; commit?: string; dirty?: boolean; sourcesDigest?: string } | null> {
  try {
    const response = await fetch(new URL(`/${DOCS_BUILD_STAMP_FILE}`, baseURL), {
      signal: AbortSignal.timeout(PREFLIGHT_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    // A single-page-app fallback answers unknown paths with index.html, so an
    // absent stamp arrives as HTML rather than as a 404.
    return (await response.json()) as { builtAt?: string; sourcesDigest?: string };
  } catch {
    return null;
  }
}

/**
 * Whether the origin serves the docs app at all. Separates a stale process
 * holding the port and erroring on everything from a real but outdated build,
 * which need different fixes.
 */
async function serverAnswersPages(baseURL: string): Promise<boolean> {
  try {
    return (await fetch(baseURL, { signal: AbortSignal.timeout(PREFLIGHT_FETCH_TIMEOUT_MS) })).ok;
  } catch {
    return false;
  }
}
