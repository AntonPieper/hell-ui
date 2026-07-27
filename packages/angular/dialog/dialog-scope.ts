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
 * `aria-hidden` values of the owner document's body children captured by the
 * trigger immediately before the dialog manager opened the dialog. A scoped
 * dialog replays it so the manager's page-wide assistive-technology pass does
 * not hide the shell that scoped modality deliberately keeps interactive.
 */
export const HELL_DIALOG_ARIA_HIDDEN_BASELINE = new InjectionToken<
  ReadonlyMap<Element, string | null>
>('HELL_DIALOG_ARIA_HIDDEN_BASELINE');

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
  /** Scoped dialogs currently blocking a region in this document. */
  scoped: number;
  /** Open dialogs in this document that block the whole page instead. */
  pageModal: number;
  marked: boolean;
  focusTrapEscape: string | null;
}

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
 *   values captured before the dialog opened, so the surrounding shell is not
 *   an `aria-hidden` ancestor of the controls it still hands focus to;
 * - the owner document is marked so the delegated focus trap stops pulling
 *   focus out of that shell — but only while every open dialog is scoped, see
 *   `hellRetainDialogPageModality`.
 *
 * All four are reference counted per scope root and per document, so
 * simultaneous scoped dialogs engage once and the last release restores the
 * exact values that were there before.
 */
export class HellDialogScopedModality {
  private engaged = false;

  constructor(
    private readonly root: HTMLElement,
    private readonly doc: Document,
    private readonly ariaHiddenBaseline: ReadonlyMap<Element, string | null>,
  ) {}

  engage(): void {
    if (this.engaged) return;
    this.engaged = true;
    // The manager attaches the portal — which renders this overlay and can flush
    // its effects — before running the page-wide assistive-technology pass, and
    // the whole open is one synchronous task. Replaying once now and once at the
    // end of that task covers both orders; the replay only touches values the
    // pass added, so running it twice changes nothing.
    hellRestoreDialogAriaHidden(this.ariaHiddenBaseline);
    queueMicrotask(() => {
      if (this.engaged) hellRestoreDialogAriaHidden(this.ariaHiddenBaseline);
    });
    engageScopeModality(this.root);
    engageDocumentModality(this.doc);
  }

  release(): void {
    if (!this.engaged) return;
    this.engaged = false;
    releaseScopeModality(this.root);
    releaseDocumentModality(this.doc);
  }
}

/**
 * Snapshot the `aria-hidden` values a dialog open is about to overwrite. The
 * trigger takes it before handing the template to the dialog manager, because
 * afterwards the manager's own previous-value map is the only other record and
 * it is private.
 */
export function hellCaptureDialogAriaHidden(doc: Document): ReadonlyMap<Element, string | null> {
  const baseline = new Map<Element, string | null>();
  for (const child of Array.from(doc.body.children)) {
    baseline.set(child, child.getAttribute('aria-hidden'));
  }
  return baseline;
}

/**
 * Undo only the `aria-hidden="true"` values the modality pass added. Anything a
 * consumer or an already-open page-modal dialog hid before the snapshot keeps
 * its value.
 */
function hellRestoreDialogAriaHidden(baseline: ReadonlyMap<Element, string | null>): void {
  for (const [element, previous] of baseline) {
    if (!element.isConnected || previous === 'true') continue;
    if (element.getAttribute('aria-hidden') !== 'true') continue;
    if (previous === null) element.removeAttribute('aria-hidden');
    else element.setAttribute('aria-hidden', previous);
  }
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
    state = { scoped: 0, pageModal: 0, marked: false, focusTrapEscape: null };
    documentModalityStates.set(doc, state);
  }
  return state;
}

function engageDocumentModality(doc: Document): void {
  const state = documentModalityState(doc);
  state.scoped += 1;
  syncDocumentFocusTrapEscape(doc, state);
}

function releaseDocumentModality(doc: Document): void {
  const state = documentModalityStates.get(doc);
  if (!state || state.scoped === 0) return;

  state.scoped -= 1;
  syncDocumentFocusTrapEscape(doc, state);
}

/**
 * Count an open dialog that blocks the whole page — one without `scoped`, or a
 * `scoped` one that found no scope root.
 *
 * The focus-trap escape marker is document-wide, so it releases every trap in
 * the document, not only the scoped dialog's. That is the right trade only
 * while every open dialog is scoped: a page-modal dialog does mean to block
 * the surrounding shell, so while one is open the marker comes off and the
 * delegated trap does its job again. Reference counted, so a page-modal dialog
 * opened from inside a scoped one restores the marker when it closes.
 */
export function hellRetainDialogPageModality(doc: Document): void {
  const state = documentModalityState(doc);
  state.pageModal += 1;
  syncDocumentFocusTrapEscape(doc, state);
}

/** Release one page-blocking dialog counted by `hellRetainDialogPageModality`. */
export function hellReleaseDialogPageModality(doc: Document): void {
  const state = documentModalityStates.get(doc);
  if (!state || state.pageModal === 0) return;

  state.pageModal -= 1;
  syncDocumentFocusTrapEscape(doc, state);
}

function syncDocumentFocusTrapEscape(
  doc: Document,
  state: HellDialogDocumentModalityState,
): void {
  const wanted = state.scoped > 0 && state.pageModal === 0;
  if (wanted === state.marked) return;

  if (wanted) {
    state.focusTrapEscape = doc.body.getAttribute(HELL_NGP_FOCUS_TRAP_ESCAPE_ATTRIBUTE);
    doc.body.setAttribute(HELL_NGP_FOCUS_TRAP_ESCAPE_ATTRIBUTE, '');
  } else if (state.focusTrapEscape === null) {
    doc.body.removeAttribute(HELL_NGP_FOCUS_TRAP_ESCAPE_ATTRIBUTE);
  } else {
    doc.body.setAttribute(HELL_NGP_FOCUS_TRAP_ESCAPE_ATTRIBUTE, state.focusTrapEscape);
  }
  state.marked = wanted;
}

export function hellFindDialogScopeRoot(trigger: HTMLElement): HTMLElement | null {
  return hellFindFloatingScopeRoot(trigger, HELL_DIALOG_SCOPE_ROOT_SELECTOR);
}
