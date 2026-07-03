import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';

/** Handler invoked for document-level keydown events registered through {@link HellGlobalKeydownService}. */
export type HellGlobalKeydownHandler = (event: KeyboardEvent) => void;
/** Handler invoked for document-level pointerdown events registered through {@link HellGlobalPointerdownService}. */
export type HellGlobalPointerdownHandler = (event: PointerEvent) => void;

/** Match a keydown against a hotkey string. Supported tokens:
 *  `mod` (Cmd on macOS, Ctrl elsewhere), `ctrl`, `meta`, `alt`, `shift`,
 *  plus a single literal key ("k", "/", "Enter", …). Tokens are joined with
 *  `+` and case-insensitive.
 */
export function matchHotkey(event: KeyboardEvent, combo: string): boolean {
  const parts = combo
    .toLowerCase()
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);

  let needCtrl = false;
  let needMeta = false;
  let needAlt = false;
  let needShift = false;
  let key = '';

  for (const part of parts) {
    if (part === 'mod') {
      if (isMac) needMeta = true;
      else needCtrl = true;
    } else if (part === 'ctrl') {
      needCtrl = true;
    } else if (part === 'meta' || part === 'cmd' || part === 'super') {
      needMeta = true;
    } else if (part === 'alt' || part === 'option') {
      needAlt = true;
    } else if (part === 'shift') {
      needShift = true;
    } else {
      key = part;
    }
  }

  if (event.ctrlKey !== needCtrl) return false;
  if (event.metaKey !== needMeta) return false;
  if (event.altKey !== needAlt) return false;
  if (needShift && !event.shiftKey) return false;
  if (!key) return false;

  const singleCharacter = key.length === 1;
  if (singleCharacter) {
    if (!needShift && event.shiftKey && (/[a-zA-Z]/.test(key) || UNSHIFTED_KEYS.has(key))) {
      return false;
    }
    return event.key.toLowerCase() === key.toLowerCase();
  }

  if (!needShift && event.shiftKey) return false;
  return event.key.toLowerCase() === key;
}

/**
 * Decide whether a global keydown should be handled while another editable
 * element is focused. Omnibar-like command palettes use this to avoid
 * stealing bare printable keys from inputs when no modifier was requested.
 */
export function hellShouldHandleGlobalHotkey(
  event: KeyboardEvent,
  combo: string,
  target?: EventTarget | null,
): boolean {
  const active = event.view?.document.activeElement ?? null;
  const eventTarget = event.target;

  if ((active && active === target) || (eventTarget && eventTarget === target)) return true;
  if (!isEditableTarget(active) && !isEditableTarget(eventTarget)) return true;
  return comboRequiresModifier(combo);
}

const UNSHIFTED_KEYS = new Set(['`', '-', '=', '[', ']', '\\', ';', "'", ',', '.', '/']);

const isMac = (() => {
  if (typeof navigator === 'undefined') return false;
  const platform =
    (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform ??
    '';
  return /mac|iphone|ipad|ipod/i.test(platform);
})();

function comboRequiresModifier(combo: string): boolean {
  const tokens = combo.toLowerCase().split('+').map((part) => part.trim()).filter(Boolean);
  return tokens.some((part) => part === 'mod' || part === 'ctrl' || part === 'meta' || part === 'alt');
}

function isEditableTarget(target: EventTarget | null | undefined): boolean {
  const element = target as Element | null | undefined;
  if (!element || (element as Node).nodeType !== 1) return false;

  const tagName = element.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return true;
  if ((element as HTMLElement).isContentEditable) return true;

  return !!element.closest?.('[contenteditable=""], [contenteditable="true"]');
}

/** Central owner for document-level keyboard listeners. Components still decide
 * their own opt-in shortcut policy, but default-prevented events, listener
 * lifecycle, and SSR guards stay in one small service instead of every
 * Composite touching `document` directly.
 */
@Injectable({ providedIn: 'root' })
export class HellGlobalKeydownService {
  private readonly document = inject(DOCUMENT, { optional: true });

  /** Registers a document-level keydown handler, auto-removed on `destroyRef` teardown. Returns a manual unregister function. */
  register(handler: HellGlobalKeydownHandler, destroyRef: DestroyRef): () => void {
    const doc = this.document;
    if (!doc?.addEventListener) return () => undefined;

    const listener = (event: KeyboardEvent) => {
      if (!event.defaultPrevented) handler(event);
    };
    let active = true;
    const cleanup = () => {
      if (!active) return;
      active = false;
      doc.removeEventListener('keydown', listener);
    };

    doc.addEventListener('keydown', listener);
    destroyRef.onDestroy(cleanup);
    return cleanup;
  }
}

/** Shared owner for document-level pointer activation listeners. */
@Injectable({ providedIn: 'root' })
export class HellGlobalPointerdownService {
  private readonly document = inject(DOCUMENT, { optional: true });

  /** Registers a document-level pointerdown handler, auto-removed on `destroyRef` teardown. Returns a manual unregister function. */
  register(handler: HellGlobalPointerdownHandler, destroyRef: DestroyRef): () => void {
    const doc = this.document;
    if (!doc?.addEventListener) return () => undefined;

    const cleanup = () => doc.removeEventListener('pointerdown', handler);
    doc.addEventListener('pointerdown', handler);
    destroyRef.onDestroy(cleanup);
    return cleanup;
  }
}
