import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';

export type HellGlobalKeydownHandler = (event: KeyboardEvent) => void;
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
    if (!needShift && /[a-zA-Z]/.test(key) && event.shiftKey) return false;
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
  const active = event.view?.document.activeElement;
  if (!active || active === target) return true;
  if (!isEditableTarget(active)) return true;
  return comboRequiresModifier(combo);
}

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
  return tokens.some(
    (part) => part === 'mod' || part === 'ctrl' || part === 'meta' || part === 'alt' || part === 'shift',
  );
}

function isEditableTarget(target: EventTarget): boolean {
  const element = target as HTMLElement;
  if (!(element instanceof HTMLElement)) return false;
  return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable;
}

/** Central owner for document-level keyboard listeners. Components still decide
 * their own shortcut policy, but listener lifecycle and SSR guards stay in one
 * small service instead of every Composite touching `document` directly.
 */
@Injectable({ providedIn: 'root' })
export class HellGlobalKeydownService {
  private readonly document = inject(DOCUMENT, { optional: true });

  register(handler: HellGlobalKeydownHandler, destroyRef: DestroyRef): () => void {
    const doc = this.document;
    if (!doc?.addEventListener) return () => undefined;

    const cleanup = () => doc.removeEventListener('keydown', handler);
    doc.addEventListener('keydown', handler);
    destroyRef.onDestroy(cleanup);
    return cleanup;
  }
}

/** Shared owner for document-level pointer activation listeners. */
@Injectable({ providedIn: 'root' })
export class HellGlobalPointerdownService {
  private readonly document = inject(DOCUMENT, { optional: true });

  register(handler: HellGlobalPointerdownHandler, destroyRef: DestroyRef): () => void {
    const doc = this.document;
    if (!doc?.addEventListener) return () => undefined;

    const cleanup = () => doc.removeEventListener('pointerdown', handler);
    doc.addEventListener('pointerdown', handler);
    destroyRef.onDestroy(cleanup);
    return cleanup;
  }
}
