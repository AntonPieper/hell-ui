/**
 * The load above which the preflight refuses to start a browser run.
 *
 * Used only by the preflight. The health reporter measures load and prints it;
 * it does not compare it to anything, so there is no second consumer and no
 * second verdict to keep consistent with this one.
 *
 * This is a *starting* condition and is only sound as one. Runs that began
 * between 1.1 and 1.5 queued per core all finished green — 33/33 across three
 * engines, and 298/298 twice on the full chromium tier. An earlier value of 1.5
 * was reasoned rather than measured, sat below the ambient level of a working
 * machine, and refused three consecutive runs that then passed completely. A
 * gate that blocks good runs gets switched off, and a switched-off gate
 * protects nothing.
 *
 * It is deliberately not a threshold for load *during* a run. Those ranges
 * overlap: healthy full-tier runs peaked at 2.05 and 3.15 while passing every
 * test, and this machine's genuinely starved runs began around 3.3. A parallel
 * suite is supposed to fill the machine, so mid-run load cannot separate "busy
 * doing the work" from "unable to do the work", and no threshold on it would be
 * honest. That is why the reporter reports the number instead of judging it.
 */
export const OVERSUBSCRIBED_LOAD_PER_CORE = 2.5;
