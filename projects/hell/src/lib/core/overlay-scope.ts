import { DestroyRef, InjectionToken } from '@angular/core';

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

export function hellRegisterOverlayElement(
  scope: HellOverlayScope | null | undefined,
  element: HTMLElement,
  destroyRef: DestroyRef,
): void {
  if (!scope) return;
  scope.registerOverlayElement(element);
  destroyRef.onDestroy(() => scope.unregisterOverlayElement(element));
}

export type HellFloatingDismissReason =
  | 'outside-pointer'
  | 'outside-click'
  | 'outside-focus'
  | 'escape';

export interface HellFloatingDismissEvent {
  readonly reason: HellFloatingDismissReason;
  readonly event: Event;
}

export interface HellFloatingDismissOptions {
  readonly root?: () => Node | null | undefined;
  readonly inside?: () => readonly (Node | null | undefined)[];
  readonly scope?: HellOverlayScope | null | undefined;
  readonly ownerDocument?: () => Document | null | undefined;
  readonly active?: () => boolean;
  readonly shouldDismiss?: (event: HellFloatingDismissEvent) => boolean;
  readonly closeOnOutsidePointer?: () => boolean;
  readonly closeOnOutsideClick?: () => boolean;
  readonly closeOnOutsideFocus?: () => boolean;
  readonly closeOnEscape?: () => boolean;
  readonly onDismiss: (event: HellFloatingDismissEvent) => void;
}

/**
 * Owns document-level Floating Dismissal listeners for one Floating Interaction.
 * Callers keep control through the closeOn* predicates and the onDismiss handler;
 * this module only centralizes the inside/outside and listener lifecycle rules.
 */
export class HellFloatingDismissController {
  private cleanup: (() => void) | null = null;
  private pointerDownInside = false;
  private pointerDownInsideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly options: HellFloatingDismissOptions) {}

  connect(destroyRef: DestroyRef): void {
    if (this.cleanup) return;
    const doc = this.document();
    if (!doc) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!this.isActive()) return;
      if (this.isInside(event.target)) {
        this.markPointerDownInside();
        return;
      }
      this.dismiss({ reason: 'outside-pointer', event });
    };

    const onClick = (event: MouseEvent) => {
      if (!this.isActive()) return;
      if (this.isInside(event.target)) return;
      this.dismiss({ reason: 'outside-click', event });
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!this.isActive()) return;
      if (this.pointerDownInside) return;
      if (this.isInside(event.target)) return;
      this.dismiss({ reason: 'outside-focus', event });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !this.isActive()) return;
      if (!this.isInside(event.target)) return;
      this.dismiss({ reason: 'escape', event });
    };

    doc.addEventListener('pointerdown', onPointerDown);
    doc.addEventListener('click', onClick, true);
    doc.addEventListener('focusin', onFocusIn);
    doc.addEventListener('keydown', onKeyDown, true);

    this.cleanup = () => {
      doc.removeEventListener('pointerdown', onPointerDown);
      doc.removeEventListener('click', onClick, true);
      doc.removeEventListener('focusin', onFocusIn);
      doc.removeEventListener('keydown', onKeyDown, true);
      this.clearPointerTimer();
    };
    destroyRef.onDestroy(() => this.destroy());
  }

  destroy(): void {
    this.cleanup?.();
    this.cleanup = null;
  }

  markPointerDownInside(): void {
    this.pointerDownInside = true;
    this.clearPointerTimer();
    this.pointerDownInsideTimer = setTimeout(() => {
      this.pointerDownInside = false;
      this.pointerDownInsideTimer = null;
    }, 0);
  }

  hasRecentPointerDownInside(): boolean {
    return this.pointerDownInside;
  }

  handleFocusExit(event: FocusEvent): void {
    if (this.isInside(event.relatedTarget)) return;

    queueMicrotask(() => {
      if (this.pointerDownInside) return;
      if (this.isInside(this.document()?.activeElement ?? null)) return;
      this.dismiss({ reason: 'outside-focus', event });
    });
  }

  isInside(target: EventTarget | Node | null): boolean {
    const node = hellOverlayTargetNode(target);
    if (!node) return false;

    const root = this.options.root?.();
    if (root?.contains(node)) return true;

    for (const element of this.options.inside?.() ?? []) {
      if (element?.contains(node)) return true;
    }

    return this.options.scope?.containsOverlayTarget(node) ?? false;
  }

  private dismiss(event: HellFloatingDismissEvent): void {
    if (!this.shouldDismiss(event)) return;
    this.options.onDismiss(event);
  }

  private shouldDismiss(event: HellFloatingDismissEvent): boolean {
    if (!this.isActive()) return false;
    if (this.options.shouldDismiss) return this.options.shouldDismiss(event);

    switch (event.reason) {
      case 'outside-pointer':
        return this.options.closeOnOutsidePointer?.() ?? false;
      case 'outside-click':
        return this.options.closeOnOutsideClick?.() ?? false;
      case 'outside-focus':
        return this.options.closeOnOutsideFocus?.() ?? false;
      case 'escape':
        return this.options.closeOnEscape?.() ?? false;
    }
  }

  private isActive(): boolean {
    return this.options.active?.() ?? true;
  }

  private document(): Document | null {
    const provided = this.options.ownerDocument?.();
    if (provided) return provided;
    return typeof document === 'undefined' ? null : document;
  }

  private clearPointerTimer(): void {
    if (this.pointerDownInsideTimer === null) return;
    clearTimeout(this.pointerDownInsideTimer);
    this.pointerDownInsideTimer = null;
  }
}
