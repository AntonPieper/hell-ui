import {
  DestroyRef,
  Directive,
  ElementRef,
  InjectionToken,
  inject,
  type AfterViewInit,
} from '@angular/core';
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

export interface HellFloatingContainmentOptions {
  /** Primary logical owner of the interaction. */
  readonly root?: () => Node | null | undefined;
  /** Extra inline nodes that should count as inside. */
  readonly inside?: () => readonly (Node | null | undefined)[];
  /** Registered portaled floating surfaces. */
  readonly scope?: HellFloatingScope | null | undefined;
  /** Gate for whether registered floating surfaces currently count as inside. */
  readonly floatingActive?: () => boolean;
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

export function hellContainsFloatingTarget(
  options: HellFloatingContainmentOptions,
  target: EventTarget | Node | null,
): boolean {
  const node = hellFloatingTargetNode(target);
  if (!node) return false;

  const root = options.root?.();
  if (root?.contains(node)) return true;

  for (const element of options.inside?.() ?? []) {
    if (element?.contains(node)) return true;
  }

  if (options.floatingActive?.() ?? true) {
    return options.scope?.containsFloatingTarget(node) ?? false;
  }

  return false;
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
export class HellFloatingElement implements AfterViewInit {
  private readonly scope = inject(HELL_FLOATING_SCOPE, { optional: true });
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  /** Register the host element with the owning Floating Scope once rendered. */
  ngAfterViewInit(): void {
    hellRegisterFloatingElement(this.scope, this.element, this.destroyRef);
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
    // eslint-disable-next-line no-restricted-globals -- SSR feature-detect; ResizeObserver has no injectable seam
    if (typeof ResizeObserver === 'undefined') return;
    // eslint-disable-next-line no-restricted-globals -- guarded by the feature check above
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

export function hellFindFloatingScopeRoot(
  trigger: HTMLElement,
  selector: string,
): HTMLElement | null {
  return trigger.closest<HTMLElement>(selector);
}
