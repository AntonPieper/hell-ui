import { hellCreateLabels, type HellLabels } from 'hell-ui/core';
import type { HellUiInput } from 'hell-ui/core';
import { hellPartStyler, type HellRecipe } from 'hell-ui/internal/core';
import { FocusTrap, FocusTrapFactory, InteractivityChecker } from '@angular/cdk/a11y';
// eslint-disable-next-line no-restricted-imports -- Private HostBindings keep renderer coordination out of public directive declarations.
import { HostBinding } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  OnDestroy,
  Renderer2,
  booleanAttribute,
  effect,
  inject,
  input,
  output,
  signal,
  type WritableSignal,
} from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { InjectionToken } from '@angular/core';

/** Built-in accessibility labels owned by the app shell entry point. */
export interface HellAppShellLabels {
  /** Accessible label for the sidenav toggle when the sidenav is collapsed. */
  readonly expandSidebar: string;
  /** Accessible label for the sidenav toggle when the sidenav is expanded. */
  readonly collapseSidebar: string;
  /** Accessible label for the secondary toggle when the secondary panel is hidden. */
  readonly showSecondaryPanel: string;
  /** Accessible label for the secondary toggle when the secondary panel is visible. */
  readonly hideSecondaryPanel: string;
}

/** Injection token resolving to the effective app shell labels. */
export const HELL_APP_SHELL_LABELS: InjectionToken<HellLabels<HellAppShellLabels>> = hellCreateLabels<HellAppShellLabels>('HELL_APP_SHELL_LABELS', {
  expandSidebar: 'Expand sidebar',
  collapseSidebar: 'Collapse sidebar',
  showSecondaryPanel: 'Show secondary panel',
  hideSecondaryPanel: 'Hide secondary panel',
});

/** Minimum viewport width in pixels at which the shell uses the desktop layout. */
export const HELL_APP_SHELL_DESKTOP_MIN_WIDTH_PX = 768;
/** Maximum viewport width in pixels at which the shell uses the mobile overlay layout. */
export const HELL_APP_SHELL_MOBILE_MAX_WIDTH_PX = HELL_APP_SHELL_DESKTOP_MIN_WIDTH_PX - 1;
/** Media query that matches the mobile overlay layout breakpoint. */
export const HELL_APP_SHELL_MOBILE_MEDIA = `(max-width: ${HELL_APP_SHELL_MOBILE_MAX_WIDTH_PX}px)`;
let nextAppShellId = 0;

type HellAppShellMobilePanel = 'sidenav' | 'secondary';

interface HellAppShellPendingAction {
  readonly panel: HellAppShellMobilePanel;
  readonly element: HTMLElement;
}

const HELL_APP_SHELL_ACTION_SELECTOR = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

interface HellAppShellCoordination {
  readonly shellId: number;
  readonly sidenav: WritableSignal<HTMLElement | null>;
  readonly secondary: WritableSignal<HTMLElement | null>;
  readonly toggles: Set<HTMLElement>;
  readonly isMobileLayout: WritableSignal<boolean>;
  readonly mobileSidenavOpen: WritableSignal<boolean>;
  readonly mobileSecondaryOpen: WritableSignal<boolean>;
  readonly uncontrolledSidenavCollapsed: WritableSignal<boolean>;
  readonly uncontrolledSecondaryHidden: WritableSignal<boolean>;
  pendingRestoreAction: HellAppShellPendingAction | null;
  pendingCloseAction: HellAppShellPendingAction | null;
  currentActionTarget: HTMLElement | null;
  handledActionTarget: HTMLElement | null;
  currentActionSequence: number;
  sidenavCollapsedInput: () => boolean | null;
  secondaryHiddenInput: () => boolean | null;
}

const appShellCoordination = new WeakMap<HellAppShell, HellAppShellCoordination>();

function getAppShellCoordination(shell: HellAppShell): HellAppShellCoordination {
  let coordination = appShellCoordination.get(shell);
  if (!coordination) {
    coordination = {
      shellId: ++nextAppShellId,
      sidenav: signal<HTMLElement | null>(null),
      secondary: signal<HTMLElement | null>(null),
      toggles: new Set<HTMLElement>(),
      isMobileLayout: signal(false),
      mobileSidenavOpen: signal(false),
      mobileSecondaryOpen: signal(false),
      uncontrolledSidenavCollapsed: signal(false),
      uncontrolledSecondaryHidden: signal(false),
      pendingRestoreAction: null,
      pendingCloseAction: null,
      currentActionTarget: null,
      handledActionTarget: null,
      currentActionSequence: 0,
      sidenavCollapsedInput: () => null,
      secondaryHiddenInput: () => null,
    };
    appShellCoordination.set(shell, coordination);
  }
  return coordination;
}

function isAppShellSidenavCollapsed(shell: HellAppShell): boolean {
  const coordination = getAppShellCoordination(shell);
  const controlled = coordination.sidenavCollapsedInput();
  if (controlled !== null) return controlled;
  return coordination.isMobileLayout()
    ? !coordination.mobileSidenavOpen()
    : coordination.uncontrolledSidenavCollapsed();
}

function isAppShellSecondaryHidden(shell: HellAppShell): boolean {
  const coordination = getAppShellCoordination(shell);
  const controlled = coordination.secondaryHiddenInput();
  if (controlled !== null) return controlled;
  return coordination.isMobileLayout()
    ? !coordination.mobileSecondaryOpen()
    : coordination.uncontrolledSecondaryHidden();
}

function appShellMobileOpenPanel(shell: HellAppShell): HellAppShellMobilePanel | null {
  const coordination = getAppShellCoordination(shell);
  if (!coordination.isMobileLayout()) return null;
  if (!isAppShellSidenavCollapsed(shell)) return 'sidenav';
  if (!isAppShellSecondaryHidden(shell)) return 'secondary';
  return null;
}

function registerAppShellPanel(
  shell: HellAppShell,
  panel: HellAppShellMobilePanel,
  element: HTMLElement,
  destroyRef: DestroyRef,
): void {
  const coordination = getAppShellCoordination(shell);
  if (!element.id) {
    element.id = `hell-app-shell-${coordination.shellId}-${panel}`;
  }
  coordination[panel].set(element);
  destroyRef.onDestroy(() => {
    if (coordination[panel]() === element) coordination[panel].set(null);
  });
}

function registerAppShellToggle(
  shell: HellAppShell,
  element: HTMLElement,
  destroyRef: DestroyRef,
): void {
  const toggles = getAppShellCoordination(shell).toggles;
  toggles.add(element);
  destroyRef.onDestroy(() => toggles.delete(element));
}

const HELL_APP_SHELL_RECIPE = {
  root: 'bg-hell-surface text-hell-foreground',
} satisfies HellRecipe<'root'>;

const HELL_APP_TOPBAR_RECIPE = {
  root: 'gap-hell-3 border-hell-border bg-hell-surface-elevated pe-hell-4',
} satisfies HellRecipe<'root'>;

const HELL_APP_SIDENAV_RECIPE = {
  root: 'gap-0.5 border-hell-border bg-hell-surface-elevated p-hell-3',
} satisfies HellRecipe<'root'>;

const HELL_APP_CONTENT_RECIPE = {
  root: 'bg-hell-surface-subtle p-hell-6',
} satisfies HellRecipe<'root'>;

const HELL_SIDENAV_TOGGLE_RECIPE = {
  root: 'text-hell-foreground-muted hover:text-hell-foreground',
} satisfies HellRecipe<'root'>;

const HELL_SECONDARY_TOGGLE_RECIPE = {
  root: '',
} satisfies HellRecipe<'root'>;

const HELL_APP_SECONDARY_RECIPE = {
  root: 'border-hell-border bg-hell-surface-elevated',
} satisfies HellRecipe<'root'>;

const HELL_APP_SECONDARY_BODY_RECIPE = {
  root: 'opacity-100',
} satisfies HellRecipe<'root'>;

/**
 * Application shell — top bar + collapsible sidenav + main content + optional
 * secondary sidebar. Designed for ICT/business apps. Composed via slot
 * directives so consumers control content while we own the grid layout.
 *
 * Two ways to control state:
 *   1. Bind `[sidenavCollapsed]` / `[secondaryHidden]` and handle the paired
 *      `...Change` outputs from your parent component (controlled mode).
 *   2. Leave those inputs unset and use the built-in button toggle directives
 *      (`hellSidenavToggle`, `hellSecondaryToggle`) to mutate shell-owned state.
 *
 * Usage:
 *   <div hellAppShell>
 *     <header hellAppTopbar>
 *       <button hellSidenavToggle>...</button>
 *     </header>
 *     <aside hellAppSidenav>...</aside>
 *     <main hellAppContent>...</main>
 *     <aside hellAppSecondary>
 *       <button hellSecondaryToggle></button>
 *       <div hellAppSecondaryBody>...</div>
 *     </aside>
 *   </div>
 */
@Component({
  selector: '[hellAppShell]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
  template: '<ng-content></ng-content>',
  exportAs: 'hellAppShell',
})
export class HellAppShell implements OnDestroy {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_APP_SHELL_RECIPE,
  });

  /** Controlled sidenav collapsed state; when set, the shell defers to this input instead of its internal toggle. Defaults to `null` (uncontrolled). */
  readonly sidenavCollapsed = input<boolean | null, boolean | string | null | undefined>(null, {
    transform: nullableBooleanAttribute,
  });
  /** Emits the requested sidenav collapsed state whenever a toggle occurs. */
  readonly sidenavCollapsedChange = output<boolean>();
  /** Controlled secondary panel hidden state; when set, the shell defers to this input instead of its internal toggle. Defaults to `null` (uncontrolled). */
  readonly secondaryHidden = input<boolean | null, boolean | string | null | undefined>(null, {
    transform: nullableBooleanAttribute,
  });
  /** Emits the requested secondary panel hidden state whenever a toggle occurs. */
  readonly secondaryHiddenChange = output<boolean>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = this.hostElement.ownerDocument;
  private readonly renderer = inject(Renderer2);
  private readonly focusTrapFactory = inject(FocusTrapFactory);
  private readonly interactivityChecker = inject(InteractivityChecker);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private _activeMobilePanel: HellAppShellMobilePanel | null = null;
  private _activeMobilePanelElement: HTMLElement | null = null;
  private _mobilePanelFocusTrap: FocusTrap | null = null;
  private _removeMobilePanelTransitionListener: (() => void) | null = null;
  private _fallbackTabindexValue: string | null = null;
  private _fallbackTabindexElement: HTMLElement | null = null;
  private _mobilePanelRestoreTarget: HTMLElement | null = null;
  private _mobileFocusRestoreGeneration = 0;
  private _completedActionSequence = 0;

  constructor() {
    const coordination = getAppShellCoordination(this);
    const removePointerDismissal = this.renderer.listen(
      this.hostElement,
      'pointerdown',
      this.dismissMobilePanels,
    );
    const removeClickDismissal = this.renderer.listen(
      this.hostElement,
      'click',
      this.completeMobilePanelDismissal,
    );
    const removeEscapeDismissal = this.renderer.listen(
      this.hostElement,
      'keydown',
      this.dismissMobilePanelsOnEscape,
    );
    coordination.sidenavCollapsedInput = () => this.sidenavCollapsed();
    coordination.secondaryHiddenInput = () => this.secondaryHidden();
    this.document.addEventListener('pointerdown', this.captureDocumentIntent, true);
    this.document.addEventListener('keydown', this.captureDocumentIntent, true);
    this.document.addEventListener('click', this.captureDocumentAction, true);
    this.destroyRef.onDestroy(() => {
      removePointerDismissal();
      removeClickDismissal();
      removeEscapeDismissal();
      this.document.removeEventListener('pointerdown', this.captureDocumentIntent, true);
      this.document.removeEventListener('keydown', this.captureDocumentIntent, true);
      this.document.removeEventListener('click', this.captureDocumentAction, true);
      coordination.pendingRestoreAction = null;
      coordination.pendingCloseAction = null;
      coordination.currentActionTarget = null;
      coordination.handledActionTarget = null;
      coordination.currentActionSequence += 1;
    });
    this.breakpointObserver
      .observe(HELL_APP_SHELL_MOBILE_MEDIA)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        const mobile = state.matches;
        coordination.isMobileLayout.set(mobile);
        if (!mobile) {
          coordination.mobileSidenavOpen.set(false);
          coordination.mobileSecondaryOpen.set(false);
          coordination.pendingRestoreAction = null;
          coordination.pendingCloseAction = null;
          coordination.currentActionTarget = null;
          coordination.handledActionTarget = null;
          coordination.currentActionSequence += 1;
        }
      });

    effect(() => {
      const nextPanel = appShellMobileOpenPanel(this);
      const currentCoordination = getAppShellCoordination(this);
      if (
        currentCoordination.pendingRestoreAction &&
        currentCoordination.pendingRestoreAction.panel !== nextPanel
      ) {
        currentCoordination.pendingRestoreAction = null;
      }
      const nextPanelElement = nextPanel ? currentCoordination[nextPanel]() : null;
      if (nextPanel && !nextPanelElement) {
        if (this._activeMobilePanel !== null) this.teardownMobileFocusTrap();
        if (nextPanel === 'sidenav') this.setSidenavCollapsed(true);
        else this.setSecondaryHidden(true);
        return;
      }
      if (
        nextPanel === this._activeMobilePanel &&
        nextPanelElement === this._activeMobilePanelElement
      ) {
        return;
      }

      if (nextPanel === null) {
        this.teardownMobileFocusTrap();
        return;
      }

      const replacesActivePanelElement = nextPanel === this._activeMobilePanel;
      if (this._activeMobilePanel !== null) {
        this.teardownMobileFocusTrap(false, replacesActivePanelElement);
      }

      this.enableMobileFocusTrap(nextPanel, replacesActivePanelElement);
    });
  }

  @HostBinding('attr.data-sidenav-collapsed')
  private get sidenavCollapsedAttribute(): 'true' | null {
    return isAppShellSidenavCollapsed(this) ? 'true' : null;
  }

  @HostBinding('attr.data-secondary-hidden')
  private get secondaryHiddenAttribute(): 'true' | null {
    return isAppShellSecondaryHidden(this) ? 'true' : null;
  }

  @HostBinding('attr.data-mobile-layout')
  private get mobileLayoutAttribute(): 'true' | null {
    return getAppShellCoordination(this).isMobileLayout() ? 'true' : null;
  }

  @HostBinding('attr.data-mobile-sidenav-open')
  private get mobileSidenavOpenAttribute(): 'true' | null {
    const coordination = getAppShellCoordination(this);
    return coordination.isMobileLayout() &&
      coordination.sidenav() &&
      !isAppShellSidenavCollapsed(this)
      ? 'true'
      : null;
  }

  @HostBinding('attr.data-mobile-secondary-open')
  private get mobileSecondaryOpenAttribute(): 'true' | null {
    const coordination = getAppShellCoordination(this);
    return coordination.isMobileLayout() &&
      coordination.secondary() &&
      !isAppShellSecondaryHidden(this)
      ? 'true'
      : null;
  }

  /** Tears down any active mobile focus trap when the shell is destroyed. */
  ngOnDestroy(): void {
    const coordination = getAppShellCoordination(this);
    coordination.pendingRestoreAction = null;
    coordination.pendingCloseAction = null;
    coordination.currentActionTarget = null;
    coordination.handledActionTarget = null;
    coordination.currentActionSequence += 1;
    this.teardownMobileFocusTrap(false);
  }

  /** Toggles the sidenav collapsed state, opening the mobile overlay when applicable. */
  toggleSidenav() {
    this.markCurrentActionHandled();
    const coordination = getAppShellCoordination(this);
    const next = !isAppShellSidenavCollapsed(this);
    if (coordination.isMobileLayout() && !next) {
      this.stagePendingRestoreAction('sidenav');
      this.openMobilePanel('sidenav');
      return;
    }
    if (coordination.isMobileLayout() && next) {
      this.stagePendingCloseAction('sidenav');
    }
    this.setSidenavCollapsed(next);
  }

  /** Toggles the secondary panel hidden state, opening the mobile overlay when applicable. */
  toggleSecondary() {
    this.markCurrentActionHandled();
    const coordination = getAppShellCoordination(this);
    const next = !isAppShellSecondaryHidden(this);
    if (coordination.isMobileLayout() && !next) {
      this.stagePendingRestoreAction('secondary');
      this.openMobilePanel('secondary');
      return;
    }
    if (coordination.isMobileLayout() && next) {
      this.stagePendingCloseAction('secondary');
    }
    this.setSecondaryHidden(next);
  }

  /** Closes any open mobile overlay panels; no-op outside the mobile layout. */
  closeMobilePanels() {
    this.closeMobilePanelsFromCurrentAction(true);
  }

  private closeMobilePanelsFromCurrentAction(stageCurrentAction: boolean): void {
    this.markCurrentActionHandled();
    const coordination = getAppShellCoordination(this);
    coordination.pendingRestoreAction = null;
    if (!coordination.isMobileLayout()) return;
    const openPanel = appShellMobileOpenPanel(this);
    if (stageCurrentAction && openPanel) this.stagePendingCloseAction(openPanel);
    if (!isAppShellSidenavCollapsed(this)) this.setSidenavCollapsed(true);
    if (!isAppShellSecondaryHidden(this)) this.setSecondaryHidden(true);
  }

  private setSidenavCollapsed(next: boolean): void {
    const coordination = getAppShellCoordination(this);
    if (next && coordination.pendingRestoreAction?.panel === 'sidenav') {
      coordination.pendingRestoreAction = null;
    }
    if (this.sidenavCollapsed() === null) {
      if (coordination.isMobileLayout()) coordination.mobileSidenavOpen.set(!next);
      else coordination.uncontrolledSidenavCollapsed.set(next);
    }
    this.sidenavCollapsedChange.emit(next);
  }

  private setSecondaryHidden(next: boolean): void {
    const coordination = getAppShellCoordination(this);
    if (next && coordination.pendingRestoreAction?.panel === 'secondary') {
      coordination.pendingRestoreAction = null;
    }
    if (this.secondaryHidden() === null) {
      if (coordination.isMobileLayout()) coordination.mobileSecondaryOpen.set(!next);
      else coordination.uncontrolledSecondaryHidden.set(next);
    }
    this.secondaryHiddenChange.emit(next);
  }

  private openMobilePanel(panel: HellAppShellMobilePanel): void {
    const coordination = getAppShellCoordination(this);
    const nextSidenavCollapsed = panel !== 'sidenav';
    const nextSecondaryHidden = panel !== 'secondary';
    const previousSidenavCollapsed = isAppShellSidenavCollapsed(this);
    const previousSecondaryHidden = isAppShellSecondaryHidden(this);

    if (this.sidenavCollapsed() === null) {
      coordination.mobileSidenavOpen.set(!nextSidenavCollapsed);
    }
    if (this.secondaryHidden() === null) {
      coordination.mobileSecondaryOpen.set(!nextSecondaryHidden);
    }

    if (previousSidenavCollapsed !== nextSidenavCollapsed) {
      this.sidenavCollapsedChange.emit(nextSidenavCollapsed);
    }
    if (previousSecondaryHidden !== nextSecondaryHidden) {
      this.secondaryHiddenChange.emit(nextSecondaryHidden);
    }
  }

  private readonly captureDocumentIntent = (event: Event): void => {
    this.captureDocumentActionTarget(event, true);
  };

  private readonly captureDocumentAction = (event: Event): void => {
    // `click` covers keyboard, assistive-technology, and programmatic activation.
    // It must also cancel an older retry when no preceding pointer/key event exists.
    const path = event.composedPath();
    const actionTarget = this.actionTargetFromPath(path);
    const actionSequence = this.captureDocumentActionTarget(event, true);
    if (
      !actionTarget ||
      !path.includes(this.hostElement) ||
      this.pathContainsPanelOrToggle(path)
    ) {
      return;
    }

    // A target handler may stop bubbling. Complete after every consumer handler
    // unless the host listener already handled this same captured action.
    queueMicrotask(() => {
      const coordination = getAppShellCoordination(this);
      if (
        coordination.currentActionSequence !== actionSequence ||
        this._completedActionSequence === actionSequence
      ) {
        return;
      }
      this.completeMobilePanelAction(actionTarget);
    });
  };

  private captureDocumentActionTarget(event: Event, cancelRestore: boolean): number {
    const coordination = getAppShellCoordination(this);
    const actionTarget = this.actionTargetFromEvent(event);
    const actionSequence = ++coordination.currentActionSequence;
    coordination.currentActionTarget = actionTarget;
    coordination.handledActionTarget = null;
    coordination.pendingRestoreAction = null;
    coordination.pendingCloseAction = null;

    if (
      cancelRestore &&
      this._activeMobilePanel === null &&
      this._mobilePanelRestoreTarget !== null
    ) {
      this.cancelMobileFocusRestore();
    }

    this.scheduleOwnerTask(() => {
      if (coordination.currentActionSequence !== actionSequence) return;
      coordination.currentActionTarget = null;
      coordination.handledActionTarget = null;
    });
    return actionSequence;
  }

  private actionTargetFromEvent(event: Event): HTMLElement | null {
    return this.actionTargetFromPath(event.composedPath());
  }

  private actionTargetFromPath(path: EventTarget[]): HTMLElement | null {
    for (const target of path) {
      const element = this.ownerDocumentElement(target);
      if (element?.matches(HELL_APP_SHELL_ACTION_SELECTOR)) return element;
    }
    return null;
  }

  private stagePendingRestoreAction(panel: HellAppShellMobilePanel): void {
    const coordination = getAppShellCoordination(this);
    const activeElement = this.ownerDocumentElement(this.document.activeElement);
    const target = coordination.currentActionTarget?.isConnected
      ? coordination.currentActionTarget
      : activeElement;
    if (!target) {
      coordination.pendingRestoreAction = null;
      return;
    }

    const pendingAction: HellAppShellPendingAction = { panel, element: target };
    coordination.pendingRestoreAction = pendingAction;
    this.scheduleOwnerTask(() => {
      if (coordination.pendingRestoreAction === pendingAction) {
        coordination.pendingRestoreAction = null;
      }
    });
  }

  private stagePendingCloseAction(panel: HellAppShellMobilePanel): void {
    const coordination = getAppShellCoordination(this);
    const target = coordination.currentActionTarget;
    const panelElement = this.getMobilePanelElement(panel);
    if (!target?.isConnected || panelElement?.contains(target)) {
      coordination.pendingCloseAction = null;
      return;
    }

    const pendingAction: HellAppShellPendingAction = { panel, element: target };
    coordination.pendingCloseAction = pendingAction;
    this.scheduleOwnerTask(() => {
      if (coordination.pendingCloseAction === pendingAction) {
        coordination.pendingCloseAction = null;
        const panelElement = this.getMobilePanelElement(panel);
        if (
          panelElement &&
          this._activeMobilePanel === panel &&
          this._activeMobilePanelElement === panelElement
        ) {
          this.ensureMobilePanelFocus(panel, panelElement);
        }
      }
    });
  }

  private markCurrentActionHandled(): void {
    const coordination = getAppShellCoordination(this);
    coordination.handledActionTarget = coordination.currentActionTarget;
  }

  private ownerDocumentElement(target: EventTarget | null): HTMLElement | null {
    const HTMLElementCtor = this.document.defaultView?.HTMLElement;
    return HTMLElementCtor && target instanceof HTMLElementCtor
      ? target
      : null;
  }

  /** Closes open mobile panels when a pointer press lands outside a panel or toggle. */
  private readonly dismissMobilePanels = (event: PointerEvent): void => {
    const coordination = getAppShellCoordination(this);
    if (
      !coordination.isMobileLayout() ||
      (isAppShellSidenavCollapsed(this) && isAppShellSecondaryHidden(this))
    ) {
      return;
    }

    const path = event.composedPath();
    const insidePanelOrToggle = this.pathContainsPanelOrToggle(path);

    if (insidePanelOrToggle || this.actionTargetFromEvent(event)) return;
    this.closeMobilePanelsFromCurrentAction(false);
  };

  /** Completes deferred outside dismissal after consumer click handlers run. */
  private readonly completeMobilePanelDismissal = (event: MouseEvent): void => {
    const coordination = getAppShellCoordination(this);
    this._completedActionSequence = coordination.currentActionSequence;
    const actionTarget = this.actionTargetFromEvent(event);
    if (!actionTarget || this.pathContainsPanelOrToggle(event.composedPath())) return;

    this.completeMobilePanelAction(actionTarget);
  };

  private completeMobilePanelAction(actionTarget: HTMLElement): void {
    const coordination = getAppShellCoordination(this);
    const handledByShell = coordination.handledActionTarget === actionTarget;
    const openPanel = appShellMobileOpenPanel(this);
    if (handledByShell) {
      if (openPanel === null) this.redirectMobileFocusRestore(actionTarget);
      return;
    }

    if (openPanel === null) return;
    const controlled =
      openPanel === 'sidenav'
        ? this.sidenavCollapsed() !== null
        : this.secondaryHidden() !== null;
    this.stagePendingCloseAction(openPanel);
    this.closeMobilePanelsFromCurrentAction(false);
    if (!controlled && appShellMobileOpenPanel(this) === null) {
      this.redirectMobileFocusRestore(actionTarget);
    }
  }

  /** Closes open mobile panels when the Escape key is pressed. */
  private readonly dismissMobilePanelsOnEscape = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    if (!getAppShellCoordination(this).isMobileLayout()) {
      return;
    }

    this.closeMobilePanelsFromCurrentAction(false);
  };

  private pathContainsPanelOrToggle(path: EventTarget[]): boolean {
    const coordination = getAppShellCoordination(this);
    return path.some(
      (target) =>
        target === coordination.sidenav() ||
        target === coordination.secondary() ||
        coordination.toggles.has(target as HTMLElement),
    );
  }

  private cancelMobileFocusRestore(): void {
    this._mobileFocusRestoreGeneration += 1;
    this._mobilePanelRestoreTarget = null;
  }

  private redirectMobileFocusRestore(target: HTMLElement): void {
    if (
      this._activeMobilePanel === null &&
      this._mobilePanelRestoreTarget === null
    ) {
      return;
    }

    this._mobileFocusRestoreGeneration += 1;
    this._mobilePanelRestoreTarget = target;
    if (this._activeMobilePanel === null) {
      this.restoreMobileFocusTarget(target);
      this.scheduleMobileFocusRestore();
    }
  }

  private enableMobileFocusTrap(
    panel: HellAppShellMobilePanel,
    preserveRestoreTarget = false,
  ): void {
    const panelElement = this.getMobilePanelElement(panel);
    if (!panelElement) {
      this._activeMobilePanel = null;
      return;
    }

    this._mobileFocusRestoreGeneration += 1;
    if (!preserveRestoreTarget) {
      const coordination = getAppShellCoordination(this);
      const pendingAction = coordination.pendingRestoreAction;
      coordination.pendingRestoreAction = null;
      const pendingRestoreTarget =
        pendingAction?.panel === panel && pendingAction.element.isConnected
          ? pendingAction.element
          : null;
      this._mobilePanelRestoreTarget =
        pendingRestoreTarget ?? this.ownerDocumentElement(this.document.activeElement);
    }

    this._activeMobilePanel = panel;
    this._activeMobilePanelElement = panelElement;
    this._mobilePanelFocusTrap = this.focusTrapFactory.create(panelElement);
    this._removeMobilePanelTransitionListener = this.renderer.listen(
      panelElement,
      'transitionend',
      () => this.ensureMobilePanelFocus(panel, panelElement),
    );
    this.scheduleMobilePanelFocusCheck(panel, panelElement);
    void this._mobilePanelFocusTrap
      .focusInitialElementWhenReady({ preventScroll: true })
      .then(() => this.scheduleMobilePanelFocusCheck(panel, panelElement))
      .catch(() => this.scheduleMobilePanelFocusCheck(panel, panelElement));
  }

  private scheduleMobilePanelFocusCheck(
    panel: HellAppShellMobilePanel,
    panelElement: HTMLElement,
  ): void {
    const focusPanel = () => this.ensureMobilePanelFocus(panel, panelElement);
    queueMicrotask(focusPanel);
    this.scheduleMobilePanelTask(focusPanel);
  }

  private ensureMobilePanelFocus(panel: HellAppShellMobilePanel, panelElement: HTMLElement): void {
    if (this._activeMobilePanel !== panel || !panelElement.isConnected) {
      return;
    }

    const activeElement = this.document.activeElement;
    const panelHasFocus =
      activeElement instanceof HTMLElement && panelElement.contains(activeElement);
    if (
      panelHasFocus &&
      activeElement !== panelElement &&
      activeElement !== this._mobilePanelRestoreTarget
    ) {
      return;
    }

    if (!this.focusFirstInteractiveInPanel(panelElement)) {
      this.focusPanelFallback(panelElement);
    }
  }

  private focusFirstInteractiveInPanel(panelElement: HTMLElement): boolean {
    const candidates = panelElement.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [contenteditable], [tabindex]',
    );

    for (const candidate of candidates) {
      if (
        !candidate.isConnected ||
        candidate === this._mobilePanelRestoreTarget ||
        candidate.hasAttribute('disabled') ||
        candidate.closest('[inert], [aria-hidden="true"]') ||
        candidate.getClientRects().length === 0 ||
        candidate.tabIndex < 0 ||
        !this.interactivityChecker.isFocusable(candidate, { ignoreVisibility: true })
      ) {
        continue;
      }

      candidate.focus({ preventScroll: true });
      if (this.document.activeElement === candidate) {
        return true;
      }
    }

    return false;
  }

  private focusPanelFallback(panelElement: HTMLElement): void {
    if (!this._fallbackTabindexElement) {
      this._fallbackTabindexValue = panelElement.getAttribute('tabindex');
      if (!panelElement.hasAttribute('tabindex')) {
        panelElement.setAttribute('tabindex', '-1');
      }
      this._fallbackTabindexElement = panelElement;
    }

    panelElement.focus({ preventScroll: true });
  }

  private restoreMobileFocusTarget(target = this._mobilePanelRestoreTarget): void {
    if (!target || this._mobilePanelRestoreTarget !== target) return;
    if (!target.isConnected || target.ownerDocument !== this.document) {
      this._mobilePanelRestoreTarget = null;
      return;
    }
    if (!this.isMobileFocusRestoreCandidate(target)) return;

    target.focus({ preventScroll: true });
  }

  private isMobileFocusRestoreCandidate(target: HTMLElement): boolean {
    if (
      target.matches(':disabled') ||
      target.getAttribute('aria-disabled')?.trim().toLowerCase() === 'true' ||
      target.tabIndex < 0 ||
      !this.interactivityChecker.isFocusable(target, { ignoreVisibility: true })
    ) {
      return false;
    }

    for (let ancestor: HTMLElement | null = target; ancestor; ancestor = ancestor.parentElement) {
      if (
        ancestor.hidden ||
        ancestor.hasAttribute('inert') ||
        ancestor.getAttribute('aria-hidden')?.trim().toLowerCase() === 'true'
      ) {
        return false;
      }
    }

    return true;
  }

  private teardownMobileFocusTrap(
    restoreFocus = true,
    preserveRestoreTarget = false,
  ): void {
    const closingPanel = this._activeMobilePanel;
    if (restoreFocus && closingPanel) {
      const coordination = getAppShellCoordination(this);
      const pendingAction = coordination.pendingCloseAction;
      coordination.pendingCloseAction = null;
      if (
        pendingAction?.panel === closingPanel &&
        pendingAction.element.isConnected
      ) {
        this._mobilePanelRestoreTarget = pendingAction.element;
      }
    }
    this._removeMobilePanelTransitionListener?.();
    this._removeMobilePanelTransitionListener = null;
    this._mobilePanelFocusTrap?.destroy();
    this._mobilePanelFocusTrap = null;
    this._activeMobilePanel = null;
    this._activeMobilePanelElement = null;

    this.restoreMobilePanelTabindex();
    if (restoreFocus) {
      this.restoreMobileFocusTarget(this._mobilePanelRestoreTarget);
      this.scheduleMobileFocusRestore();
    } else {
      this._mobileFocusRestoreGeneration += 1;
      if (!preserveRestoreTarget) this._mobilePanelRestoreTarget = null;
    }
  }

  private scheduleMobileFocusRestore(): void {
    const target = this._mobilePanelRestoreTarget;
    if (!target) return;
    const generation = ++this._mobileFocusRestoreGeneration;
    const restore = () => {
      if (generation !== this._mobileFocusRestoreGeneration) return;
      this.restoreMobileFocusTarget(target);
    };
    const restoreAndClear = () => {
      if (generation !== this._mobileFocusRestoreGeneration) return;
      this.restoreMobileFocusTarget(target);
      if (
        generation === this._mobileFocusRestoreGeneration &&
        this._mobilePanelRestoreTarget === target
      ) {
        this._mobilePanelRestoreTarget = null;
      }
    };

    this.scheduleOwnerTask(restore);
    this.scheduleOwnerTask(restore, 50);
    this.scheduleOwnerTask(restoreAndClear, 150);
    const view = this.document.defaultView;
    if (view?.requestAnimationFrame) {
      view.requestAnimationFrame(restore);
    }
  }

  private scheduleMobilePanelTask(task: () => void): void {
    const view = this.document.defaultView;
    this.scheduleOwnerTask(task);
    this.scheduleOwnerTask(task, 50);
    this.scheduleOwnerTask(task, 150);
    if (view?.requestAnimationFrame) {
      view.requestAnimationFrame(task);
    }
  }

  private scheduleOwnerTask(task: () => void, delay = 0): void {
    const view = this.document.defaultView;
    if (view) {
      view.setTimeout(task, delay);
      return;
    }
    setTimeout(task, delay);
  }

  private restoreMobilePanelTabindex(): void {
    if (!this._fallbackTabindexElement) {
      return;
    }

    const restoreValue = this._fallbackTabindexValue;
    if (restoreValue === null) {
      this._fallbackTabindexElement.removeAttribute('tabindex');
    } else {
      this._fallbackTabindexElement.setAttribute('tabindex', restoreValue);
    }

    this._fallbackTabindexElement = null;
    this._fallbackTabindexValue = null;
  }

  private getMobilePanelElement(panel: HellAppShellMobilePanel): HTMLElement | null {
    const element = getAppShellCoordination(this)[panel]();
    return element?.isConnected ? element : null;
  }
}

/** Top bar slot of the app shell, hosting global actions and the sidenav toggle. */
@Directive({
  selector: '[hellAppTopbar]',
  host: { '[class]': "part('root')", 'data-slot': 'root' },
})
export class HellAppTopbar {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_APP_TOPBAR_RECIPE,
  });
}

/** Sidenav slot of the app shell; collapses inline on desktop and becomes an overlay on mobile. */
@Directive({
  selector: '[hellAppSidenav]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellAppSidenav {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_APP_SIDENAV_RECIPE,
  });

  private readonly shell = inject(HellAppShell);

  @HostBinding('attr.data-collapsed')
  private get collapsedAttribute(): 'true' | null {
    return isAppShellSidenavCollapsed(this.shell) ? 'true' : null;
  }

  @HostBinding('attr.data-mobile-hidden')
  private get mobileHiddenAttribute(): 'true' | null {
    return this.isMobileHidden() ? 'true' : null;
  }

  @HostBinding('attr.aria-hidden')
  private get ariaHiddenAttribute(): 'true' | null {
    return this.isMobileHidden() ? 'true' : null;
  }

  @HostBinding('attr.inert')
  private get inertAttribute(): '' | null {
    return this.isMobileHidden() ? '' : null;
  }

  private isMobileHidden(): boolean {
    return (
      getAppShellCoordination(this.shell).isMobileLayout() &&
      isAppShellSidenavCollapsed(this.shell)
    );
  }

  constructor() {
    registerAppShellPanel(
      this.shell,
      'sidenav',
      inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
      inject(DestroyRef),
    );
  }
}

/** Main scrolling content slot of the app shell and scoped-dialog root. */
@Directive({
  selector: '[hellAppContent]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    /** Dialogs scoped here render only over the content area. */
    '[attr.data-hell-dialog-scope-root]': '"true"',
  },
})
export class HellAppContent {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_APP_CONTENT_RECIPE,
  });
}

/** Click anywhere → toggles `sidenavCollapsed` on the parent shell. */
@Directive({
  selector: 'button[hellSidenavToggle]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    type: 'button',
    '(click)': 'toggle()',
  },
})
export class HellSidenavToggle {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SIDENAV_TOGGLE_RECIPE,
  });
  /** Resolved accessibility labels for the toggle. */
  private readonly labels = inject(HELL_APP_SHELL_LABELS);
  private readonly shell = inject(HellAppShell);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  @HostBinding('attr.aria-expanded')
  private get ariaExpandedAttribute(): boolean {
    return !isAppShellSidenavCollapsed(this.shell);
  }

  @HostBinding('attr.aria-controls')
  private get ariaControlsAttribute(): string | null {
    return getAppShellCoordination(this.shell).sidenav()?.id ?? null;
  }

  @HostBinding('attr.aria-label')
  private get ariaLabelAttribute(): string {
    return isAppShellSidenavCollapsed(this.shell)
      ? this.labels.expandSidebar
      : this.labels.collapseSidebar;
  }

  constructor() {
    registerAppShellToggle(
      this.shell,
      this.element,
      inject(DestroyRef),
    );
  }

  /** Toggles the parent shell's sidenav. */
  protected toggle() {
    this.shell.toggleSidenav();
  }
}

/** Click anywhere → toggles `secondaryHidden` on the parent shell. */
@Directive({
  selector: 'button[hellSecondaryToggle]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    type: 'button',
    '(click)': 'toggle()',
  },
})
export class HellSecondaryToggle {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SECONDARY_TOGGLE_RECIPE,
  });
  /** Resolved accessibility labels for the toggle. */
  private readonly labels = inject(HELL_APP_SHELL_LABELS);
  private readonly shell = inject(HellAppShell);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  @HostBinding('attr.aria-expanded')
  private get ariaExpandedAttribute(): boolean {
    return !isAppShellSecondaryHidden(this.shell);
  }

  @HostBinding('attr.aria-controls')
  private get ariaControlsAttribute(): string | null {
    return getAppShellCoordination(this.shell).secondary()?.id ?? null;
  }

  @HostBinding('attr.aria-label')
  private get ariaLabelAttribute(): string {
    return isAppShellSecondaryHidden(this.shell)
      ? this.labels.showSecondaryPanel
      : this.labels.hideSecondaryPanel;
  }

  constructor() {
    registerAppShellToggle(
      this.shell,
      this.element,
      inject(DestroyRef),
    );
  }

  /** Toggles the parent shell's secondary panel. */
  protected toggle() {
    this.shell.toggleSecondary();
  }
}

/** Secondary sidebar slot of the app shell; hides inline on desktop and becomes an overlay on mobile. */
@Directive({
  selector: '[hellAppSecondary]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellAppSecondary {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_APP_SECONDARY_RECIPE,
  });

  private readonly shell = inject(HellAppShell);

  @HostBinding('attr.data-hidden')
  private get hiddenAttribute(): 'true' | null {
    return isAppShellSecondaryHidden(this.shell) ? 'true' : null;
  }

  @HostBinding('attr.data-mobile-hidden')
  private get mobileHiddenAttribute(): 'true' | null {
    return getAppShellCoordination(this.shell).isMobileLayout() &&
      isAppShellSecondaryHidden(this.shell)
      ? 'true'
      : null;
  }

  constructor() {
    registerAppShellPanel(
      this.shell,
      'secondary',
      inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
      inject(DestroyRef),
    );
  }
}

/** Body slot of the secondary panel, made inert while the panel is hidden. */
@Directive({
  selector: '[hellAppSecondaryBody]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellAppSecondaryBody {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_APP_SECONDARY_BODY_RECIPE,
  });
  private readonly shell = inject(HellAppShell);

  @HostBinding('attr.aria-hidden')
  private get ariaHiddenAttribute(): 'true' | null {
    return isAppShellSecondaryHidden(this.shell) ? 'true' : null;
  }

  @HostBinding('attr.inert')
  private get inertAttribute(): '' | null {
    return isAppShellSecondaryHidden(this.shell) ? '' : null;
  }
}

function nullableBooleanAttribute(value: boolean | string | null | undefined): boolean | null {
  return value == null ? null : booleanAttribute(value);
}

/** All app shell directives, for importing the module's building blocks together. */
export const HELL_APP_SHELL_IMPORTS = [
  HellAppShell,
  HellAppTopbar,
  HellAppSidenav,
  HellAppContent,
  HellAppSecondary,
  HellAppSecondaryBody,
  HellSidenavToggle,
  HellSecondaryToggle,
] as const;
