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

/** Floating Scope is the new domain name; overlay names remain as aliases while
 * primitives migrate. */
export type HellFloatingScope = HellOverlayScope;
export const HELL_FLOATING_SCOPE: InjectionToken<HellFloatingScope> = HELL_OVERLAY_SCOPE;

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

export const HellFloatingScopeRegistry = HellOverlayScopeRegistry;

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

export const hellRegisterFloatingElement = hellRegisterOverlayElement;

export interface HellFloatingInsetVars {
  readonly top: string;
  readonly right: string;
  readonly bottom: string;
  readonly left: string;
}

export interface HellFloatingScopedInsetsOptions {
  readonly document: Document;
  readonly rootSelector: string;
  readonly variables: HellFloatingInsetVars;
  readonly styleTarget?: () => HTMLElement | null | undefined;
}

/**
 * Shared geometry runtime for scoped Floating Interactions. It finds a root
 * near the trigger, writes viewport-relative inset variables, and owns the
 * ResizeObserver/scroll/resize cleanup.
 */
export class HellFloatingScopedInsetsRuntime {
  private activeScopeRoot: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private readonly syncScope = () => this.updateScope();

  constructor(private readonly options: HellFloatingScopedInsetsOptions) {}

  primeFromTrigger(trigger: HTMLElement): HTMLElement | null {
    const root = hellFindFloatingScopeRoot(trigger, this.options.rootSelector);
    if (!root) {
      this.clear();
      return null;
    }

    if (this.activeScopeRoot === root) {
      this.updateScope();
      return root;
    }

    this.clearListeners();
    this.activeScopeRoot = root;
    this.updateScope();
    this.observeScopeRoot(root);
    this.listenForViewportChanges();
    return root;
  }

  updateScope(): void {
    if (!this.activeScopeRoot) return;

    const rect = this.activeScopeRoot.getBoundingClientRect();
    const win = this.options.document.defaultView;
    if (!win) return;

    const styles = this.styleTarget().style;
    styles.setProperty(this.options.variables.top, `${Math.max(0, rect.top)}px`);
    styles.setProperty(
      this.options.variables.right,
      `${Math.max(0, win.innerWidth - rect.right)}px`,
    );
    styles.setProperty(
      this.options.variables.bottom,
      `${Math.max(0, win.innerHeight - rect.bottom)}px`,
    );
    styles.setProperty(this.options.variables.left, `${Math.max(0, rect.left)}px`);
  }

  clear(): void {
    this.clearListeners();
    this.activeScopeRoot = null;

    const styles = this.styleTarget().style;
    for (const variable of Object.values(this.options.variables)) styles.removeProperty(variable);
  }

  private observeScopeRoot(root: HTMLElement): void {
    if (typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(this.syncScope);
    this.resizeObserver.observe(root);
  }

  private listenForViewportChanges(): void {
    const win = this.options.document.defaultView;
    win?.addEventListener('scroll', this.syncScope, { passive: true, capture: true });
    win?.addEventListener('resize', this.syncScope);
  }

  private clearListeners(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    const win = this.options.document.defaultView;
    win?.removeEventListener('scroll', this.syncScope, true);
    win?.removeEventListener('resize', this.syncScope);
  }

  private styleTarget(): HTMLElement {
    return this.options.styleTarget?.() ?? this.options.document.documentElement;
  }
}

export function hellFindFloatingScopeRoot(
  trigger: HTMLElement,
  selector: string,
): HTMLElement | null {
  return trigger.closest<HTMLElement>(selector);
}

export interface HellDismissContext {
  readonly event: Event;
  readonly target: Node | null;
  readonly path: readonly EventTarget[];
  /**
   * True when the provided target, or the current event target when omitted,
   * belongs to this Floating Interaction's logical inside set.
   */
  isTargetInside(target?: EventTarget | Node | null): boolean;
}

export interface HellDismissDecision {
  readonly preventDefault?: boolean;
  readonly stopPropagation?: boolean;
  readonly restoreFocus?: false | HTMLElement | (() => HTMLElement | null | undefined);
}

export type HellDismissRule = (
  context: HellDismissContext,
) => HellDismissDecision | null | undefined;

export interface HellFloatingDismissEvent extends HellDismissContext {
  readonly decision: HellDismissDecision;
}

export function hellDismissOn(...rules: readonly HellDismissRule[]): HellDismissRule {
  return (context) => {
    for (const rule of rules) {
      const decision = rule(context);
      if (decision) return decision;
    }
    return null;
  };
}

export function hellWithDismissEffect(
  rule: HellDismissRule,
  effect: HellDismissDecision,
): HellDismissRule {
  return (context) => {
    const decision = rule(context);
    return decision ? { ...decision, ...effect } : null;
  };
}

export function hellGuardDismiss(
  rule: HellDismissRule,
  guard: (context: HellDismissContext, decision: HellDismissDecision) => boolean,
): HellDismissRule {
  return (context) => {
    const decision = rule(context);
    return decision && guard(context, decision) ? decision : null;
  };
}

export const hellOutsidePointer: HellDismissRule = (context) =>
  context.event.type === 'pointerdown' && !context.isTargetInside() ? {} : null;

export const hellOutsideClick: HellDismissRule = (context) =>
  context.event.type === 'click' && !context.isTargetInside() ? {} : null;

export const hellOutsideFocus: HellDismissRule = (context) =>
  (context.event.type === 'focusin' ||
    context.event.type === 'focusout' ||
    context.event.type === 'blur') &&
  !context.isTargetInside()
    ? {}
    : null;

export const hellEscapeKey: HellDismissRule = (context) =>
  context.event instanceof KeyboardEvent &&
  context.event.key === 'Escape' &&
  context.isTargetInside()
    ? {}
    : null;

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
  /** Pure matcher composition deciding whether a document event dismisses. */
  readonly dismiss?: HellDismissRule;
  readonly onDismiss?: (event: HellFloatingDismissEvent) => void;
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
 * Callers provide a composed dismiss rule; this module centralizes the
 * inside/outside and listener lifecycle rules.
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
      if (this.isInsideEvent(event)) {
        this.markPointerDownInside();
        return;
      }
      this.dismiss(event);
    };

    const onClick = (event: MouseEvent) => {
      if (!this.isActive()) return;
      if (this.isInsideEvent(event)) return;
      this.dismiss(event);
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!this.isActive()) return;
      if (this.pointerDownInside) return;
      if (this.isInsideEvent(event)) return;
      this.dismiss(event);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!this.isActive()) return;
      this.dismiss(event);
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
      const activeElement = this.document()?.activeElement ?? null;
      if (this.isInside(activeElement)) return;
      this.dismiss(event, activeElement);
    });
  }

  isInside(target: EventTarget | Node | null): boolean {
    return this.isInsideTarget(target);
  }

  private dismiss(event: Event, targetOverride?: EventTarget | Node | null): void {
    if (!this.isActive() || !this.options.dismiss || !this.options.onDismiss) return;

    const context = this.createDismissContext(event, targetOverride);
    const decision = this.options.dismiss(context);
    if (!decision) return;

    if (decision.preventDefault) event.preventDefault();
    if (decision.stopPropagation) event.stopPropagation();

    this.options.onDismiss({ ...context, decision });
    this.restoreFocus(decision);
  }

  private restoreFocus(decision: HellDismissDecision): void {
    if (!decision.restoreFocus) return;
    const target =
      typeof decision.restoreFocus === 'function' ? decision.restoreFocus() : decision.restoreFocus;
    target?.focus();
  }

  private createDismissContext(
    event: Event,
    targetOverride?: EventTarget | Node | null,
  ): HellDismissContext {
    const path = hellEventPath(event);
    const target = hellOverlayTargetNode(targetOverride ?? event.target);
    return {
      event,
      target,
      path,
      isTargetInside: (nextTarget?: EventTarget | Node | null) =>
        nextTarget === undefined
          ? this.isInsideEventPath(path, target)
          : this.isInsideTarget(nextTarget),
    };
  }

  private isInsideEvent(event: Event): boolean {
    return this.isInsideEventPath(hellEventPath(event), hellOverlayTargetNode(event.target));
  }

  private isInsideEventPath(path: readonly EventTarget[], target: Node | null): boolean {
    for (const entry of path) {
      if (this.isInsideTarget(entry)) return true;
    }
    return this.isInsideTarget(target);
  }

  private isInsideTarget(target: EventTarget | Node | null): boolean {
    const node = hellOverlayTargetNode(target);
    if (!node) return false;

    const root = this.options.root?.();
    if (root?.contains(node)) return true;

    for (const element of this.options.inside?.() ?? []) {
      if (element?.contains(node)) return true;
    }

    return this.options.scope?.containsOverlayTarget(node) ?? false;
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
      dismiss: this.options.dismiss,
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

function hellEventPath(event: Event): readonly EventTarget[] {
  if (typeof event.composedPath === 'function') return event.composedPath();
  return event.target ? [event.target] : [];
}
