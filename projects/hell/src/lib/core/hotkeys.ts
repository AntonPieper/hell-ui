import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';

export type HellGlobalKeydownHandler = (event: KeyboardEvent) => void;

/**
 * Central owner for document-level keyboard listeners. Components still decide
 * their own shortcut policy, but listener lifecycle and SSR guards stay in one
 * small service instead of every Composite touching `document` directly.
 */
@Injectable({ providedIn: 'root' })
export class HellGlobalKeydownService {
  private readonly document = inject(DOCUMENT, { optional: true });

  register(handler: HellGlobalKeydownHandler, destroyRef: DestroyRef): void {
    const doc = this.document;
    if (!doc?.addEventListener) return;

    doc.addEventListener('keydown', handler);
    destroyRef.onDestroy(() => doc.removeEventListener('keydown', handler));
  }
}
