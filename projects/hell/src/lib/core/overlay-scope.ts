import { DestroyRef, InjectionToken } from '@angular/core';

/** Shared ownership contract for floating content rendered outside its logical
 *  host. Components such as omnibar use it to treat registered overlays as
 *  inside interactions even when a primitive portals content to `body`. */
export interface HellOverlayScope {
  registerOverlayElement(element: HTMLElement): void;
  unregisterOverlayElement(element: HTMLElement): void;
  containsOverlayTarget(target: EventTarget | Node | null): boolean;
}

/**
 * DI token for a logical floating-overlay scope. Provide it on composites that
 * own portaled children so nested overlays count as inside for outside dismiss.
 */
export const HELL_OVERLAY_SCOPE = new InjectionToken<HellOverlayScope>('HELL_OVERLAY_SCOPE');

/**
 * Default Floating Scope registry. Treats an optional root element plus all
 * registered overlay elements as one logical interaction region.
 */
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

/**
 * Register an overlay element until `destroyRef` fires. Safe no-op when no
 * scope is available, so primitives can call it unconditionally.
 */
export function hellRegisterOverlayElement(
  scope: HellOverlayScope | null | undefined,
  element: HTMLElement,
  destroyRef: DestroyRef,
): void {
  if (!scope) return;
  scope.registerOverlayElement(element);
  destroyRef.onDestroy(() => scope.unregisterOverlayElement(element));
}

/**
 * Dismissal cause emitted by floating controllers. Pointer and click stay
 * separate so callers can choose early pointerdown or late captured-click close.
 */
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
  /** Primary logical owner of the floating interaction. Checked first. */
  readonly root?: () => Node | null | undefined;
  /** Extra inside targets, such as trigger buttons or inline anchors. */
  readonly inside?: () => readonly (Node | null | undefined)[];
  /** Portaled descendants registered by nested Hell overlay primitives. */
  readonly scope?: HellOverlayScope | null | undefined;
  /** Document that owns the listeners; defaults to global `document`. */
  readonly ownerDocument?: () => Document | null | undefined;
  /** Listener gate. Inactive interactions ignore all document events. */
  readonly active?: () => boolean;
  /** Override dismissal policy for all reasons before `onDismiss` runs. */
  readonly shouldDismiss?: (event: HellFloatingDismissEvent) => boolean;
  /** Enable dismissal on pointerdown outside the inside set. */
  readonly closeOnOutsidePointer?: () => boolean;
  /** Enable dismissal on captured click outside the inside set. */
  readonly closeOnOutsideClick?: () => boolean;
  /** Enable dismissal when focus leaves the inside set. */
  readonly closeOnOutsideFocus?: () => boolean;
  /** Enable Escape dismissal when focus/event target is inside. */
  readonly closeOnEscape?: () => boolean;
  readonly onDismiss: (event: HellFloatingDismissEvent) => void;
}

export interface HellFloatingInteractionOptions extends Omit<
  HellFloatingDismissOptions,
  'root' | 'inside' | 'scope' | 'ownerDocument'
> {
  /** Rendered floating surface. Used as default root and listener document. */
  readonly surface: () => HTMLElement | null | undefined;
  readonly root?: () => Node | null | undefined;
  readonly inside?: () => readonly (Node | null | undefined)[];
  readonly scope?: HellOverlayScope | null | undefined;
  readonly ownerDocument?: () => Document | null | undefined;
  /** Return false when caller registers the surface through another owner. */
  readonly registerSurface?: () => boolean;
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

/**
 * Owns the common Floating Interaction lifecycle: register the rendered
 * surface with a Floating Scope, connect document dismissal listeners, and
 * expose the pointer/focus hooks that template code wires to DOM events.
 */
export class HellFloatingInteractionController {
  private readonly dismissController: HellFloatingDismissController;

  constructor(private readonly options: HellFloatingInteractionOptions) {
    this.dismissController = new HellFloatingDismissController({
      root: () => this.options.root?.() ?? this.options.surface(),
      inside: this.options.inside,
      scope: this.options.scope,
      ownerDocument: () =>
        this.options.ownerDocument?.() ?? this.options.surface()?.ownerDocument ?? null,
      active: this.options.active,
      shouldDismiss: this.options.shouldDismiss,
      closeOnOutsidePointer: this.options.closeOnOutsidePointer,
      closeOnOutsideClick: this.options.closeOnOutsideClick,
      closeOnOutsideFocus: this.options.closeOnOutsideFocus,
      closeOnEscape: this.options.closeOnEscape,
      onDismiss: this.options.onDismiss,
    });
  }

  connect(destroyRef: DestroyRef): void {
    const surface = this.options.surface();
    const shouldRegister = this.options.registerSurface?.() ?? true;
    if (surface && shouldRegister) {
      hellRegisterOverlayElement(this.options.scope, surface, destroyRef);
    }
    this.dismissController.connect(destroyRef);
  }

  destroy(): void {
    this.dismissController.destroy();
  }

  markPointerDownInside(): void {
    this.dismissController.markPointerDownInside();
  }

  handleFocusExit(event: FocusEvent): void {
    this.dismissController.handleFocusExit(event);
  }

  isInside(target: EventTarget | Node | null): boolean {
    return this.dismissController.isInside(target);
  }
}
