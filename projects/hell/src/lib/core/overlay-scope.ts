import { InjectionToken } from '@angular/core';

/** Shared ownership contract for floating content rendered outside its logical
 *  host. Components such as omnibar use it to treat registered overlays as
 *  inside interactions even when a primitive portals content to `body`. */
export interface HellOverlayScope {
  registerOverlayElement(element: HTMLElement): void;
  unregisterOverlayElement(element: HTMLElement): void;
  containsOverlayTarget(target: EventTarget | Node | null): boolean;
}

export const HELL_OVERLAY_SCOPE = new InjectionToken<HellOverlayScope>('HELL_OVERLAY_SCOPE');

export class HellOverlayScopeRegistry implements HellOverlayScope {
  private readonly elements = new Set<HTMLElement>();

  constructor(private readonly root?: () => HTMLElement | null | undefined) {}

  registerOverlayElement(element: HTMLElement): void {
    this.elements.add(element);
  }

  unregisterOverlayElement(element: HTMLElement): void {
    this.elements.delete(element);
  }

  containsOverlayTarget(target: EventTarget | Node | null): boolean {
    const node = hellOverlayTargetNode(target);
    if (!node) return false;

    const root = this.root?.();
    if (root?.contains(node)) return true;

    for (const element of this.elements) {
      if (element.contains(node)) return true;
    }

    return false;
  }
}

export function hellOverlayTargetNode(target: EventTarget | Node | null): Node | null {
  if (!target || typeof Node === 'undefined' || !(target instanceof Node)) return null;
  return target;
}
