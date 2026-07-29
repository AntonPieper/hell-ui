import { InjectionToken } from '@angular/core';
import {
  HellFloatingScopedInsetsRuntime,
  hellFindFloatingScopeRoot,
  type HellFloatingInsetVars,
} from 'hell-ui/internal/core';

export const HELL_DIALOG_SCOPE_ROOT_ATTRIBUTE = 'data-hell-dialog-scope-root';
const HELL_DIALOG_SCOPE_ROOT_SELECTOR = `[${HELL_DIALOG_SCOPE_ROOT_ATTRIBUTE}="true"]`;
const HELL_DIALOG_SCOPE_VARS: HellFloatingInsetVars = {
  top: '--hell-dialog-scope-top',
  right: '--hell-dialog-scope-right',
  bottom: '--hell-dialog-scope-bottom',
  left: '--hell-dialog-scope-left',
} as const;

export const HELL_DIALOG_SCOPE_ROOT = new InjectionToken<HTMLElement | null>(
  'HELL_DIALOG_SCOPE_ROOT',
);

/**
 * ng-primitives' focus trap treats any target inside `[data-focus-trap]` as a
 * region that owns its own focus and stops pulling focus back into the trapped
 * panel. Scoped modality marks the owner document body with it so shell chrome
 * outside the blocked scope can really hold focus; the blocked scope itself is
 * `inert` and cannot take focus at all, so nothing escapes into it.
 *
 * The attribute name belongs to ng-primitives, which makes this a version-bound
 * seam. `tools/check-architecture.mjs` keeps the marker in this file and keeps
 * the constant below matching the installed package.
 */
const HELL_NGP_FOCUS_TRAP_ESCAPE_ATTRIBUTE = 'data-focus-trap';

/** ng-primitives release whose focus-trap escape marker this seam is written against. */
export const HELL_DIALOG_SCOPED_MODALITY_VERSION = 'ng-primitives@0.123.0';

/**
 * Adapter that copies one Dialog Scope root's insets onto the portaled overlay.
 * Each overlay owns its own runtime, so simultaneous scoped dialogs keep
 * independent CSS custom properties and never write shared document vars.
 */
export class HellDialogScopedOverlayAdapter {
  private readonly runtime: HellFloatingScopedInsetsRuntime;

  constructor(
    private readonly root: HTMLElement,
    private readonly overlay: HTMLElement,
    private readonly doc: Document,
  ) {
    this.runtime = new HellFloatingScopedInsetsRuntime({
      document: doc,
      rootSelector: HELL_DIALOG_SCOPE_ROOT_SELECTOR,
      variables: HELL_DIALOG_SCOPE_VARS,
      styleTargets: () => [this.root, this.overlay],
    });
  }

  connect(): void {
    this.runtime.primeRoot(this.root);
  }

  destroy(): void {
    this.runtime.clear();
  }
}

interface HellDialogScopeModalityState {
  engaged: number;
  inert: string | null;
  overflow: string;
  paddingInlineEnd: string;
}

interface HellDialogDocumentModalityState {
  /** Dialog overlays currently rendered in this document, scoped or not. */
  overlays: number;
  /** Scoped dialogs currently blocking a region in this document. */
  scoped: number;
  /** Open dialogs in this document that block the whole page instead. */
  pageModal: number;
  /**
   * `aria-hidden` on the body children as it was before any dialog in this
   * document touched it. Captured once, by the first overlay, and dropped when
   * the last one goes — so it always answers "what did the machinery change?"
   * rather than "what did this particular open change?".
   */
  ariaHiddenBaseline: ReadonlyMap<Element, string | null> | null;
  /**
   * Elements whose machinery-set `aria-hidden` scoped modality cleared. Kept so
   * the page can be hidden again the moment a page-blocking dialog joins the
   * open set, and handed back to the baseline when the last dialog goes.
   */
  cleared: Set<Element>;
  marked: boolean;
  focusTrapEscape: string | null;
}

/**
 * What the open set says about the page outside the dialogs.
 *
 * - `blocked`: at least one open dialog blocks the whole page, so the page must
 *   be hidden from assistive technology — including when scoped modality
 *   already cleared that hiding for a dialog still open underneath.
 * - `scoped`: every open dialog blocks only its own region, so the page must be
 *   back in the accessibility tree.
 * - `idle`: nothing is open, so the page must read exactly as it did before the
 *   first dialog.
 */
type HellDialogAriaHiddenPhase = 'blocked' | 'scoped' | 'idle';

const scopeModalityStates = new WeakMap<HTMLElement, HellDialogScopeModalityState>();
const documentModalityStates = new WeakMap<Document, HellDialogDocumentModalityState>();

/**
 * Scoped modality runtime: while a scoped dialog is open the Dialog Scope root
 * is the only blocked region.
 *
 * - the scope root becomes `inert`, which is the one attribute that removes it
 *   from the tab order, from pointer input, and from the accessibility tree at
 *   once — `aria-hidden` alone would leave focusable blocked content behind;
 * - the scope root stops scrolling, because the pinned overlay tracks its box
 *   and the shell keeps its own scroll containers;
 * - the dialog manager's page-wide `aria-hidden` pass is replayed back to the
 *   document's pre-dialog values, so the surrounding shell is not an
 *   `aria-hidden` ancestor of the controls it still hands focus to;
 * - the owner document is marked so the delegated focus trap stops pulling
 *   focus out of that shell.
 *
 * The last two are document-wide decisions, so they hold only while every open
 * dialog is scoped — see `hellSetDialogOverlayRole` — and they are
 * re-derived from the open set on every transition, in both directions. Which
 * order dialogs happen to open and close in therefore cannot leave either
 * stale: a page-blocking dialog joining hides the page again, and one leaving a
 * scoped dialog behind frees it again.
 *
 * All of it is reference counted per scope root and per document, so
 * simultaneous scoped dialogs engage once and the last release restores the
 * exact values that were there before.
 */
export class HellDialogScopedModality {
  private engaged = false;

  constructor(private readonly root: HTMLElement) {}

  engage(): void {
    if (this.engaged) return;
    this.engaged = true;
    engageScopeModality(this.root);
  }

  release(): void {
    if (!this.engaged) return;
    this.engaged = false;
    releaseScopeModality(this.root);
  }
}

/**
 * What one open overlay contributes to the document: it either blocks only its
 * own region or blocks the whole page.
 */
export type HellDialogOverlayRole = 'scoped' | 'blocking';

/**
 * Move one overlay between roles — including in and out of the open set — as a
 * single transition.
 *
 * The role of a live overlay can change: `scoped` is a public input, so
 * `[scoped]="mode()"` can flip while the dialog is open. Adjusting one counter
 * at a time would take the document through a phase it is never actually in;
 * dropping to an empty open set mid-flip would restore and forget the hiding
 * scoped modality had cleared, and the immediately following page-blocking role
 * would then have nothing left to put back.
 */
export function hellSetDialogOverlayRole(
  doc: Document,
  previous: HellDialogOverlayRole | null,
  next: HellDialogOverlayRole | null,
): void {
  if (previous === next) return;
  const state = documentModalityState(doc);

  if (previous === 'scoped' && state.scoped > 0) state.scoped -= 1;
  if (previous === 'blocking' && state.pageModal > 0) state.pageModal -= 1;
  if (next === 'scoped') state.scoped += 1;
  if (next === 'blocking') state.pageModal += 1;

  syncDocumentModality(doc, state);
}

/**
 * Put the page outside the dialogs into the state the open set calls for.
 *
 * The dialog manager hides the page only for the first dialog of a stack and
 * restores it only when the last one closes, which is correct on its own — two
 * page-blocking dialogs in a row keep the page hidden throughout. Scoped
 * modality is what breaks that, by clearing the hiding for a scoped dialog, so
 * it is scoped modality's job to put it back rather than ng-primitives'.
 *
 * Only elements the machinery hid are ever touched: `previous === 'true'` skips
 * a value the page owned before any dialog, and only cleared elements are
 * re-hidden. The manager's own previous-value map is never written, so its
 * restore on the last close still lands on the original value.
 *
 * Known limit, measured as parity rather than assumed: a body child appended
 * *after* the manager's pass is in neither the baseline nor the cleared set, so
 * it stays exposed while a page-blocking dialog is open. ng-primitives leaves
 * it exposed too, because it does not rerun its pass for a second dialog.
 * Tracked in #427.
 */
function applyDialogAriaHidden(
  state: HellDialogDocumentModalityState,
  phase: HellDialogAriaHiddenPhase,
): void {
  if (phase === 'scoped') {
    for (const [element, previous] of state.ariaHiddenBaseline ?? []) {
      if (!element.isConnected || previous === 'true') continue;
      if (element.getAttribute('aria-hidden') !== 'true') continue;
      state.cleared.add(element);
      if (previous === null) element.removeAttribute('aria-hidden');
      else element.setAttribute('aria-hidden', previous);
    }
    return;
  }

  if (phase === 'blocked') {
    for (const element of state.cleared) {
      if (element.isConnected) element.setAttribute('aria-hidden', 'true');
    }
    return;
  }

  // `idle`. Restoring the values is the manager's job and it does it correctly:
  // every element here came from the baseline and was seen hidden by the
  // manager's own first pass, so its previous-value map already covers all of
  // them and writes the same baseline value on the last close. Only the
  // tracking is dropped, so a later page-blocking dialog re-hides what the next
  // scoped dialog clears rather than what a previous one did.
  state.cleared.clear();
}

function engageScopeModality(root: HTMLElement): void {
  let state = scopeModalityStates.get(root);
  if (!state) {
    state = { engaged: 0, inert: null, overflow: '', paddingInlineEnd: '' };
    scopeModalityStates.set(root, state);
  }

  if (state.engaged === 0) {
    state.inert = root.getAttribute('inert');
    state.overflow = root.style.overflow;
    state.paddingInlineEnd = root.style.paddingInlineEnd;
    root.setAttribute('inert', '');
    lockScopeScroll(root);
  }
  state.engaged += 1;
}

function releaseScopeModality(root: HTMLElement): void {
  const state = scopeModalityStates.get(root);
  if (!state || state.engaged === 0) return;

  state.engaged -= 1;
  if (state.engaged > 0) return;

  if (state.inert === null) root.removeAttribute('inert');
  else root.setAttribute('inert', state.inert);
  root.style.overflow = state.overflow;
  root.style.paddingInlineEnd = state.paddingInlineEnd;
}

/**
 * Hide the scope root's own scrollbar without reflowing the blocked content:
 * whatever width the scrollbar gave back becomes trailing padding.
 */
function lockScopeScroll(root: HTMLElement): void {
  const view = root.ownerDocument.defaultView;
  const beforeWidth = root.clientWidth;
  root.style.overflow = 'hidden';
  const gutter = root.clientWidth - beforeWidth;
  if (gutter <= 0 || !view) return;

  const padding = Number.parseFloat(view.getComputedStyle(root).paddingInlineEnd) || 0;
  root.style.paddingInlineEnd = `${padding + gutter}px`;
}

function documentModalityState(doc: Document): HellDialogDocumentModalityState {
  let state = documentModalityStates.get(doc);
  if (!state) {
    state = {
      overlays: 0,
      scoped: 0,
      pageModal: 0,
      ariaHiddenBaseline: null,
      cleared: new Set<Element>(),
      marked: false,
      focusTrapEscape: null,
    };
    documentModalityStates.set(doc, state);
  }
  return state;
}

/**
 * Count one rendered dialog overlay, and — for the first one in the document —
 * record what `aria-hidden` looked like before any dialog touched it.
 *
 * Overlay construction is the only hook that is reliably earlier than the
 * manager's assistive-technology pass: the manager attaches the portal, which
 * creates this directive, and only then hides the body children. Capturing per
 * open instead would record whatever an already-open page-modal dialog had
 * already hidden, and a scoped dialog left behind when that one closes would
 * then have nothing to put back.
 */
export function hellRetainDialogOverlay(doc: Document): void {
  const state = documentModalityState(doc);
  if (state.overlays === 0) {
    const baseline = new Map<Element, string | null>();
    for (const child of Array.from(doc.body.children)) {
      baseline.set(child, child.getAttribute('aria-hidden'));
    }
    state.ariaHiddenBaseline = baseline;
  }
  state.overlays += 1;
}

/** Release one overlay counted by `hellRetainDialogOverlay`. */
export function hellReleaseDialogOverlay(doc: Document): void {
  const state = documentModalityStates.get(doc);
  if (!state || state.overlays === 0) return;

  state.overlays -= 1;
  // The counter transitions already ran the `idle` phase by the time the last
  // overlay is destroyed — every overlay is counted as either scoped or
  // page-blocking, so the last release drives the phase to `idle` itself.
  if (state.overlays === 0) state.ariaHiddenBaseline = null;
}

/** Which state the page outside the dialogs owes to the current open set. */
function ariaHiddenPhase(state: HellDialogDocumentModalityState): HellDialogAriaHiddenPhase {
  if (state.pageModal > 0) return 'blocked';
  if (state.scoped > 0) return 'scoped';
  return 'idle';
}

/**
 * Re-derive both document-wide decisions from the current counts, in both
 * directions. Every transition runs this, so no open/close order can leave
 * either stale:
 *
 * - a page-blocking dialog closing under a surviving scoped one has to free the
 *   page, because the manager restores its own map only when its last dialog
 *   closes and it is still holding one;
 * - a page-blocking dialog opening over a scoped one has to hide the page
 *   again, because the manager only hides for the first dialog of a stack and
 *   scoped modality is what cleared that hiding in the first place.
 */
function syncDocumentModality(doc: Document, state: HellDialogDocumentModalityState): void {
  const phase = ariaHiddenPhase(state);
  const scopedOnly = phase === 'scoped';

  if (scopedOnly !== state.marked) {
    if (scopedOnly) {
      state.focusTrapEscape = doc.body.getAttribute(HELL_NGP_FOCUS_TRAP_ESCAPE_ATTRIBUTE);
      doc.body.setAttribute(HELL_NGP_FOCUS_TRAP_ESCAPE_ATTRIBUTE, '');
    } else if (state.focusTrapEscape === null) {
      doc.body.removeAttribute(HELL_NGP_FOCUS_TRAP_ESCAPE_ATTRIBUTE);
    } else {
      doc.body.setAttribute(HELL_NGP_FOCUS_TRAP_ESCAPE_ATTRIBUTE, state.focusTrapEscape);
    }
    state.marked = scopedOnly;
  }

  applyDialogAriaHidden(state, phase);

  // Opening runs this from the portal attach, which is still before the
  // manager's pass; closing runs it after. Settling again at the end of the
  // current task covers both, re-derived rather than repeated so a phase that
  // changed in between wins.
  queueMicrotask(() => applyDialogAriaHidden(state, ariaHiddenPhase(state)));
}

export function hellFindDialogScopeRoot(trigger: HTMLElement): HTMLElement | null {
  return hellFindFloatingScopeRoot(trigger, HELL_DIALOG_SCOPE_ROOT_SELECTOR);
}
