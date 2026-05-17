import { DestroyRef, Directive, ElementRef, InjectionToken, inject } from '@angular/core';
import { isElementLike, isNodeLike } from './dom';

/** Shared ownership contract for Floating Interaction content rendered outside
 *  its logical host. Composites such as omnibar use it to treat registered
 *  floating surfaces as inside interactions even when a primitive portals
 *  content to `body`. */
export interface HellFloatingScope {
  registerFloatingElement(element: HTMLElement): void;
  unregisterFloatingElement(element: HTMLElement): void;
  containsFloatingTarget(target: EventTarget | Node | null): boolean;
}

/**
 * DI token for a logical Floating Scope. Provide it on composites that own
 * portaled children so nested floating surfaces count as inside for dismissal.
 */
export const HELL_FLOATING_SCOPE = new InjectionToken<HellFloatingScope>('HELL_FLOATING_SCOPE');

/**
 * Default Floating Scope registry. Treats an optional root element plus all
 * registered floating elements as one logical interaction region.
 */
export class HellFloatingScopeRegistry implements HellFloatingScope {
  private readonly elements = new Set<HTMLElement>();

  constructor(private readonly root?: () => HTMLElement | null | undefined) {}

  registerFloatingElement(element: HTMLElement): void {
    this.elements.add(element);
  }

  unregisterFloatingElement(element: HTMLElement): void {
    this.elements.delete(element);
  }

  containsFloatingTarget(target: EventTarget | Node | null): boolean {
    const node = hellFloatingTargetNode(target);
    if (!node) return false;

    const root = this.root?.();
    if (root?.contains(node)) return true;

    for (const element of this.elements) {
      if (element.contains(node)) return true;
    }

    return false;
  }
}

export function hellFloatingTargetNode(target: EventTarget | Node | null): Node | null {
  return isNodeLike(target) ? target : null;
}

/**
 * Register a floating element until `destroyRef` fires. Safe no-op when no
 * scope is available, so primitives can call it unconditionally.
 */
export function hellRegisterFloatingElement(
  scope: HellFloatingScope | null | undefined,
  element: HTMLElement,
  destroyRef: DestroyRef,
): void {
  if (!scope) return;
  scope.registerFloatingElement(element);
  destroyRef.onDestroy(() => scope.unregisterFloatingElement(element));
}

/** Register the current directive/component host with the nearest Floating Scope. */
export function hellRegisterFloatingHost(): void {
  hellRegisterFloatingElement(
    inject(HELL_FLOATING_SCOPE, { optional: true }),
    inject(ElementRef<HTMLElement>).nativeElement,
    inject(DestroyRef),
  );
}

/**
 * Internal registration directive for floating surfaces.
 *
 * Consumers should import `HellFloatingElement` from the public `floating-element` seam.
 */
@Directive({ selector: '[hellFloatingElement]' })
export class HellFloatingElement {
  constructor() {
    hellRegisterFloatingHost();
  }
}

export interface HellFloatingInsetVars {
  readonly top: string;
  readonly right: string;
  readonly bottom: string;
  readonly left: string;
}

/** Inputs for syncing scoped overlay CSS variables from a root element. */
export interface HellFloatingScopedInsetsOptions {
  readonly document: Document;
  readonly rootSelector: string;
  readonly variables: HellFloatingInsetVars;
  readonly styleTarget?: () => HTMLElement | null | undefined;
  readonly styleTargets?: () => readonly (HTMLElement | null | undefined)[];
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
    return this.primeRoot(hellFindFloatingScopeRoot(trigger, this.options.rootSelector));
  }

  primeRoot(root: HTMLElement | null): HTMLElement | null {
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

    for (const target of this.styleTargets()) {
      const styles = target.style;
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
  }

  clear(): void {
    this.clearListeners();
    this.activeScopeRoot = null;

    for (const target of this.styleTargets()) {
      const styles = target.style;
      for (const variable of Object.values(this.options.variables)) styles.removeProperty(variable);
    }
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

  private styleTargets(): readonly HTMLElement[] {
    const targets = this.options.styleTargets?.() ?? [this.options.styleTarget?.()];
    const concrete = targets.filter(
      (target): target is HTMLElement =>
        isElementLike(target) && typeof (target as HTMLElement).style?.setProperty === 'function',
    );
    return concrete.length ? concrete : [this.options.document.documentElement];
  }
}

function hellSameNodes(
  a: readonly (Node | null | undefined)[],
  b: readonly (Node | null | undefined)[],
): boolean {
  return a.length === b.length && a.every((node, index) => node === b[index]);
}

function isSafeRestoreFocusTarget(
  target: HTMLElement | null | undefined,
  checker?: HellFloatingFocusTargetChecker | null,
): target is HTMLElement {
  if (!target) return false;
  if (!target.isConnected) return false;

  if (target.matches(':disabled')) return false;
  if ((target as HTMLInputElement).disabled) return false;
  if (target.getAttribute('aria-disabled') === 'true') return false;
  if (target.hasAttribute('hidden')) return false;

  if (checker) {
    return checker.isFocusable(target);
  }

  const style = target.ownerDocument.defaultView?.getComputedStyle(target);
  if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;

  return isPotentialFocusTarget(target);
}

function isPotentialFocusTarget(target: HTMLElement): boolean {
  return target.matches(
    'a[href], button, input, select, textarea, iframe, object, embed, area[href], [tabindex], [contenteditable]'
  );
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
  /** Prevent the original document event before reporting dismissal. */
  readonly preventDefault?: boolean;
  /** Stop the original document event before reporting dismissal. */
  readonly stopPropagation?: boolean;
  /** Focus target after dismissal. `false` explicitly disables restoration. */
  readonly restoreFocus?: false | HTMLElement | (() => HTMLElement | null | undefined);
}

/**
 * Pure dismissal matcher. Return a decision to dismiss; return null/undefined
 * to let the next composed rule inspect the same event.
 */
export type HellDismissRule = (
  context: HellDismissContext,
) => HellDismissDecision | null | undefined;

export interface HellFloatingDismissEvent extends HellDismissContext {
  readonly decision: HellDismissDecision;
}

/** Try rules in order and use the first non-null dismissal decision. */
export function hellDismissOn(...rules: readonly HellDismissRule[]): HellDismissRule {
  return (context) => {
    for (const rule of rules) {
      const decision = rule(context);
      if (decision) return decision;
    }
    return null;
  };
}

/** Add fixed side effects, such as focus restoration, to a matching rule. */
export function hellWithDismissEffect(
  rule: HellDismissRule,
  effect: HellDismissDecision,
): HellDismissRule {
  return (context) => {
    const decision = rule(context);
    return decision ? { ...decision, ...effect } : null;
  };
}

/** Allow a matching rule only when the guard approves the proposed decision. */
export function hellGuardDismiss(
  rule: HellDismissRule,
  guard: (context: HellDismissContext, decision: HellDismissDecision) => boolean,
): HellDismissRule {
  return (context) => {
    const decision = rule(context);
    return decision && guard(context, decision) ? decision : null;
  };
}

/** Dismiss on pointerdown that starts outside the logical interaction. */
export const hellOutsidePointer: HellDismissRule = (context) =>
  context.event.type === 'pointerdown' && !context.isTargetInside() ? {} : null;

/** Dismiss on click that lands outside the logical interaction. */
export const hellOutsideClick: HellDismissRule = (context) =>
  context.event.type === 'click' && !context.isTargetInside() ? {} : null;

/** Dismiss when focus moves outside, including delegated blur checks. */
export const hellOutsideFocus: HellDismissRule = (context) =>
  (context.event.type === 'focusin' ||
    context.event.type === 'focusout' ||
    context.event.type === 'blur') &&
  !context.isTargetInside()
    ? {}
    : null;

/** Dismiss on Escape only while focus/event target is inside the interaction. */
export const hellEscapeKey: HellDismissRule = (context) =>
  isEscapeKeyEvent(context.event) && context.isTargetInside() ? {} : null;

function isEscapeKeyEvent(event: Event): event is KeyboardEvent {
  return (
    (event.type === 'keydown' || event.type === 'keyup') &&
    typeof (event as KeyboardEvent).key === 'string' &&
    (event as KeyboardEvent).key === 'Escape'
  );
}

export interface HellFloatingFocusTargetChecker {
  isFocusable(element: HTMLElement): boolean;
}

export interface HellFloatingDismissOptions {
  /** Primary logical owner of the floating interaction. Checked first. */
  readonly root?: () => Node | null | undefined;
  /** Extra inside targets, such as trigger buttons or inline anchors. */
  readonly inside?: () => readonly (Node | null | undefined)[];
  /** Portaled descendants registered by nested Hell floating primitives. */
  readonly scope?: HellFloatingScope | null | undefined;
  /** Document that owns the listeners; defaults to global `document`. */
  readonly ownerDocument?: () => Document | null | undefined;
  /** Listener gate. Inactive interactions ignore all document events. */
  readonly active?: () => boolean;
  /** Monotonic identity for open/close cycles; invalidates deferred focus exits. */
  readonly activeKey?: () => unknown;
  /** Optional focusability adapter, e.g. Angular CDK A11y's InteractivityChecker. */
  readonly focusTargetChecker?: HellFloatingFocusTargetChecker | null | undefined;
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
  readonly scope?: HellFloatingScope | null | undefined;
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
    if (!this.isActive()) return;
    if (this.isInside(event.relatedTarget)) return;

    const focusExitTarget = hellFloatingTargetNode(event.target);
    const focusExitRoot = this.options.root?.() ?? null;
    const focusExitInside = this.options.inside?.() ?? [];
    const focusExitActiveKey = this.options.activeKey?.() ?? null;

    // Ignore stale blur/focus exit callbacks when the interaction is inactive or
    // has been torn down/reopened around a different logical inside set.
    queueMicrotask(() => {
      if (!this.isActive()) return;
      if ((this.options.activeKey?.() ?? null) !== focusExitActiveKey) return;
      if ((this.options.root?.() ?? null) !== focusExitRoot) return;
      if (!hellSameNodes(this.options.inside?.() ?? [], focusExitInside)) return;
      if (focusExitTarget && !this.isInside(focusExitTarget)) return;
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
    if (!isSafeRestoreFocusTarget(target, this.options.focusTargetChecker)) return;

    try {
      target.focus();
    } catch {
      // ignore focus failures for detached/invalid nodes during dismissal races
    }
  }

  private createDismissContext(
    event: Event,
    targetOverride?: EventTarget | Node | null,
  ): HellDismissContext {
    const path = hellEventPath(event);
    const target = hellFloatingTargetNode(targetOverride ?? event.target);
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
    return this.isInsideEventPath(hellEventPath(event), hellFloatingTargetNode(event.target));
  }

  private isInsideEventPath(path: readonly EventTarget[], target: Node | null): boolean {
    for (const entry of path) {
      if (this.isInsideTarget(entry)) return true;
    }
    return this.isInsideTarget(target);
  }

  private isInsideTarget(target: EventTarget | Node | null): boolean {
    const node = hellFloatingTargetNode(target);
    if (!node) return false;

    const root = this.options.root?.();
    if (root?.contains(node)) return true;

    for (const element of this.options.inside?.() ?? []) {
      if (element?.contains(node)) return true;
    }

    return this.options.scope?.containsFloatingTarget(node) ?? false;
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
      activeKey: this.options.activeKey,
      focusTargetChecker: this.options.focusTargetChecker,
      dismiss: this.options.dismiss,
      onDismiss: this.options.onDismiss,
    });
  }

  connect(destroyRef: DestroyRef): void {
    const surface = this.options.surface();
    const shouldRegister = this.options.registerSurface?.() ?? true;
    if (surface && shouldRegister) {
      hellRegisterFloatingElement(this.options.scope, surface, destroyRef);
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
