import { hellCreateLabels } from '@hell-ui/angular/core';
import { isElementLike } from '@hell-ui/angular/internal/core';
import { hellPartStyler, type HellRecipe, type HellUiInput } from '@hell-ui/angular/core';
import { DOCUMENT } from '@angular/common';
import { FocusTrap, FocusTrapFactory, InteractivityChecker } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  OnDestroy,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
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
export const HELL_APP_SHELL_LABELS: InjectionToken<HellAppShellLabels> = hellCreateLabels<HellAppShellLabels>('HELL_APP_SHELL_LABELS', {
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

const HELL_APP_SHELL_RECIPE = {
  root: 'bg-hell-surface text-hell-foreground',
} satisfies HellRecipe<'root'>;

const HELL_APP_TOPBAR_RECIPE = {
  root: 'gap-hell-3 border-hell-border bg-hell-surface-elevated pe-hell-4',
} satisfies HellRecipe<'root'>;

const HELL_APP_SIDENAV_RECIPE = {
  root: 'gap-0.5 border-hell-border bg-hell-surface-elevated p-hell-3',
} satisfies HellRecipe<'root'>;

const HELL_NAV_ITEM_RECIPE = {
  root: 'gap-hell-3 rounded-md px-3 py-2 text-hell-foreground-muted hover:bg-hell-surface-subtle hover:text-hell-foreground data-[active=true]:bg-hell-primary-soft data-[active=true]:text-hell-primary aria-[current=page]:bg-hell-primary-soft aria-[current=page]:font-semibold aria-[current=page]:text-hell-primary',
} satisfies HellRecipe<'root'>;

const HELL_NAV_ITEM_ICON_RECIPE = {
  root: 'w-4 text-hell-foreground-subtle',
} satisfies HellRecipe<'root'>;

const HELL_NAV_ITEM_LABEL_RECIPE = {
  root: 'text-ellipsis',
} satisfies HellRecipe<'root'>;

const HELL_NAV_ITEM_TRAILING_RECIPE = {
  root: 'text-hell-foreground-subtle',
} satisfies HellRecipe<'root'>;

const HELL_NAV_SECTION_RECIPE = {
  root: 'flex flex-col',
} satisfies HellRecipe<'root'>;

const HELL_NAV_SECTION_TOGGLE_RECIPE = {
  root: 'gap-hell-2 rounded-hell-sm px-3 py-1.5 text-hell-foreground-subtle hover:bg-hell-surface-subtle hover:text-hell-foreground focus-visible:outline-hell-focus-ring',
} satisfies HellRecipe<'root'>;

const HELL_NAV_SECTION_ITEMS_RECIPE = {
  root: 'gap-0.5',
} satisfies HellRecipe<'root'>;

const HELL_APP_CONTENT_RECIPE = {
  root: 'bg-hell-surface-subtle p-hell-6',
} satisfies HellRecipe<'root'>;

const HELL_SIDENAV_TOGGLE_SHELL_RECIPE = {
  root: 'text-hell-foreground-muted hover:text-hell-foreground',
} satisfies HellRecipe<'root'>;

const HELL_SECONDARY_TOGGLE_HEADER_RECIPE = {
  root: 'gap-hell-2 border-hell-border px-hell-4 py-hell-3 text-hell-foreground-subtle hover:bg-hell-surface-subtle hover:text-hell-foreground focus-visible:outline-hell-focus-ring',
} satisfies HellRecipe<'root'>;

const HELL_SECONDARY_TOGGLE_RAIL_RECIPE = {
  root: 'text-hell-foreground-subtle hover:bg-hell-surface-subtle hover:text-hell-primary',
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
 *       <button hellSecondaryToggle appearance="rail"></button>
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
    '[attr.data-sidenav-collapsed]': 'isSidenavCollapsed() ? "true" : null',
    '[attr.data-secondary-hidden]': 'isSecondaryHidden() ? "true" : null',
    '[attr.data-mobile-layout]': 'isMobileLayout() ? "true" : null',
    '[attr.data-mobile-sidenav-open]': 'isMobileLayout() && !isSidenavCollapsed() ? "true" : null',
    '[attr.data-mobile-secondary-open]': 'isMobileLayout() && !isSecondaryHidden() ? "true" : null',
    '(pointerdown)': 'dismissMobilePanels($event)',
    '(keydown.escape)': 'dismissMobilePanelsOnEscape()',
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

  /** Internal sidenav toggle — written only while `sidenavCollapsed` is uncontrolled. */
  protected readonly _sidenavCollapsed = signal(false);
  /** Internal secondary toggle — written only while `secondaryHidden` is uncontrolled. */
  protected readonly _secondaryHidden = signal(false);

  /** Unique per-instance shell identifier used to derive panel ids. */
  readonly shellId = ++nextAppShellId;
  /** DOM id of the sidenav panel, referenced by toggles via `aria-controls`. */
  sidenavPanelId = `hell-app-shell-${this.shellId}-sidenav`;
  /** DOM id of the secondary panel, referenced by toggles via `aria-controls`. */
  secondaryPanelId = `hell-app-shell-${this.shellId}-secondary`;

  /** Mobile uses overlay panels instead of layout-shifting rails. */
  private readonly _isMobileLayout = signal(false);
  private readonly _mobileSidenavOpen = signal(false);
  private readonly _mobileSecondaryOpen = signal(false);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly focusTrapFactory = inject(FocusTrapFactory);
  private readonly interactivityChecker = inject(InteractivityChecker);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private _activeMobilePanel: HellAppShellMobilePanel | null = null;
  private _mobilePanelFocusTrap: FocusTrap | null = null;
  private _fallbackTabindexValue: string | null = null;
  private _fallbackTabindexElement: HTMLElement | null = null;
  private _mobilePanelRestoreTarget: HTMLElement | null = null;

  constructor() {
    this.breakpointObserver
      .observe(HELL_APP_SHELL_MOBILE_MEDIA)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        const mobile = state.matches;
        this._isMobileLayout.set(mobile);
        if (!mobile) {
          this._mobileSidenavOpen.set(false);
          this._mobileSecondaryOpen.set(false);
        }
      });

    effect(() => {
      const nextPanel = this.mobileOpenPanel();
      if (nextPanel === this._activeMobilePanel) {
        return;
      }

      if (nextPanel === null) {
        this.teardownMobileFocusTrap();
        return;
      }

      if (this._activeMobilePanel !== null) {
        this.teardownMobileFocusTrap(false);
      }

      this.enableMobileFocusTrap(nextPanel);
    });
  }

  /** Whether the shell is currently rendering the mobile overlay layout. */
  readonly isMobileLayout = () => this._isMobileLayout();

  /** The panel currently open as a mobile overlay, or `null` when none is open. */
  readonly mobileOpenPanel = () => {
    if (!this._isMobileLayout()) return null;
    if (!this.isSidenavCollapsed()) return 'sidenav';
    if (!this.isSecondaryHidden()) return 'secondary';
    return null;
  };

  /** Tears down any active mobile focus trap when the shell is destroyed. */
  ngOnDestroy(): void {
    this.teardownMobileFocusTrap();
  }

  /** Resolved sidenav collapsed state, honoring the controlled input, mobile overlay, or internal toggle. */
  readonly isSidenavCollapsed = () => {
    const controlled = this.sidenavCollapsed();
    if (controlled !== null) return controlled;
    return this.isMobileLayout() ? !this._mobileSidenavOpen() : this._sidenavCollapsed();
  };

  /** Resolved secondary panel hidden state, honoring the controlled input, mobile overlay, or internal toggle. */
  readonly isSecondaryHidden = () => {
    const controlled = this.secondaryHidden();
    if (controlled !== null) return controlled;
    return this.isMobileLayout() ? !this._mobileSecondaryOpen() : this._secondaryHidden();
  };

  /** Toggles the sidenav collapsed state, opening the mobile overlay when applicable. */
  toggleSidenav() {
    const next = !this.isSidenavCollapsed();
    if (this.isMobileLayout() && !next) {
      this.openMobilePanel('sidenav');
      return;
    }
    this.setSidenavCollapsed(next);
  }

  /** Toggles the secondary panel hidden state, opening the mobile overlay when applicable. */
  toggleSecondary() {
    const next = !this.isSecondaryHidden();
    if (this.isMobileLayout() && !next) {
      this.openMobilePanel('secondary');
      return;
    }
    this.setSecondaryHidden(next);
  }

  /** Closes any open mobile overlay panels; no-op outside the mobile layout. */
  closeMobilePanels() {
    if (!this.isMobileLayout()) return;
    if (!this.isSidenavCollapsed()) this.setSidenavCollapsed(true);
    if (!this.isSecondaryHidden()) this.setSecondaryHidden(true);
  }

  private setSidenavCollapsed(next: boolean): void {
    if (this.sidenavCollapsed() === null) {
      if (this.isMobileLayout()) this._mobileSidenavOpen.set(!next);
      else this._sidenavCollapsed.set(next);
    }
    this.sidenavCollapsedChange.emit(next);
  }

  private setSecondaryHidden(next: boolean): void {
    if (this.secondaryHidden() === null) {
      if (this.isMobileLayout()) this._mobileSecondaryOpen.set(!next);
      else this._secondaryHidden.set(next);
    }
    this.secondaryHiddenChange.emit(next);
  }

  private openMobilePanel(panel: HellAppShellMobilePanel): void {
    const nextSidenavCollapsed = panel !== 'sidenav';
    const nextSecondaryHidden = panel !== 'secondary';
    const previousSidenavCollapsed = this.isSidenavCollapsed();
    const previousSecondaryHidden = this.isSecondaryHidden();

    if (this.sidenavCollapsed() === null) {
      this._mobileSidenavOpen.set(!nextSidenavCollapsed);
    }
    if (this.secondaryHidden() === null) {
      this._mobileSecondaryOpen.set(!nextSecondaryHidden);
    }

    if (previousSidenavCollapsed !== nextSidenavCollapsed) {
      this.sidenavCollapsedChange.emit(nextSidenavCollapsed);
    }
    if (previousSecondaryHidden !== nextSecondaryHidden) {
      this.secondaryHiddenChange.emit(nextSecondaryHidden);
    }
  }

  /** Closes open mobile panels when a pointer press lands outside a panel or toggle. */
  protected dismissMobilePanels(event: PointerEvent) {
    if (!this.isMobileLayout() || (this.isSidenavCollapsed() && this.isSecondaryHidden())) {
      return;
    }

    const path = event.composedPath();
    const insidePanelOrToggle = this.pathContains(
      path,
      (element) =>
        element.getAttribute('data-hell-app-shell-panel') === 'sidenav' ||
        element.getAttribute('data-hell-app-shell-panel') === 'secondary' ||
        element.getAttribute('data-hell-app-shell-toggle') === 'sidenav' ||
        element.getAttribute('data-hell-app-shell-toggle') === 'secondary',
    );

    if (!insidePanelOrToggle) this.closeMobilePanels();
  }

  /** Closes open mobile panels when the Escape key is pressed. */
  protected dismissMobilePanelsOnEscape() {
    if (!this.isMobileLayout()) {
      return;
    }

    this.closeMobilePanels();
  }

  private enableMobileFocusTrap(panel: HellAppShellMobilePanel): void {
    const panelElement = this.getMobilePanelElement(panel);
    if (!panelElement) {
      this._activeMobilePanel = null;
      return;
    }

    const focusedElement = this.document.activeElement;
    this._mobilePanelRestoreTarget = focusedElement instanceof HTMLElement ? focusedElement : null;

    this._activeMobilePanel = panel;
    this._mobilePanelFocusTrap = this.focusTrapFactory.create(panelElement);
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

  private restoreMobileFocusTarget(): void {
    const target = this._mobilePanelRestoreTarget;
    if (!target || !target.isConnected) {
      this._mobilePanelRestoreTarget = null;
      return;
    }

    target.focus({ preventScroll: true });
    if (this.document.activeElement === target) {
      this._mobilePanelRestoreTarget = null;
    }
  }

  private teardownMobileFocusTrap(restoreFocus = true): void {
    this._mobilePanelFocusTrap?.destroy();
    this._mobilePanelFocusTrap = null;
    this._activeMobilePanel = null;

    this.restoreMobilePanelTabindex();
    if (restoreFocus) {
      this.restoreMobileFocusTarget();
      if (this._mobilePanelRestoreTarget) {
        this.scheduleMobileFocusRestore();
      }
    } else {
      this._mobilePanelRestoreTarget = null;
    }
  }

  private scheduleMobileFocusRestore(): void {
    this.scheduleMobilePanelTask(() => this.restoreMobileFocusTarget());
  }

  private scheduleMobilePanelTask(task: () => void): void {
    const view = this.document.defaultView;
    setTimeout(task, 0);
    setTimeout(task, 50);
    setTimeout(task, 150);
    if (view?.requestAnimationFrame) {
      view.requestAnimationFrame(task);
    }
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
    const root = this.elementRef.nativeElement;
    const selector = `:scope > [data-hell-app-shell-panel="${panel}"]`;
    return root.querySelector<HTMLElement>(selector);
  }

  private pathContains(path: EventTarget[], predicate: (element: Element) => boolean): boolean {
    return path.some((target) => isElementLike(target) && predicate(target));
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
    '[attr.id]': 'panelId()',
    '[attr.data-hell-app-shell-panel]': '"sidenav"',
    '[attr.data-collapsed]': 'isCollapsed() ? "true" : null',
    '[attr.data-mobile-hidden]': 'isMobileHidden() ? "true" : null',
    '[attr.aria-hidden]': 'isMobileHidden() ? "true" : null',
    '[attr.inert]': 'isMobileHidden() ? "" : null',
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

  /** Optional override; if omitted, follows the parent shell. */
  readonly collapsed = input<boolean | null, boolean | string | null | undefined>(null, {
    transform: (v) => (v == null ? null : booleanAttribute(v)),
  });
  /** Optional DOM id override for the sidenav panel; defaults to the shell-derived id. */
  readonly id = input<string | null>(null, { alias: 'id' });

  /** Parent app shell, if the sidenav is rendered inside one. */
  protected readonly shell = inject(HellAppShell, { optional: true });
  /** Effective DOM id for the sidenav panel. */
  protected readonly panelId = computed(() => this.id() ?? this.shell?.sidenavPanelId ?? null);
  /** Resolved collapsed state, from the local override or the parent shell. */
  readonly isCollapsed = () => this.collapsed() ?? this.shell?.isSidenavCollapsed() ?? false;
  /** Whether the sidenav is hidden as a collapsed mobile overlay. */
  protected readonly isMobileHidden = () => !!this.shell?.isMobileLayout() && this.isCollapsed();

  constructor() {
    effect(() => {
      const id = this.panelId();
      if (id && this.shell) this.shell.sidenavPanelId = id;
    });
  }
}

/** A single navigation entry within the sidenav, with active and hover styling. */
@Directive({
  selector: '[hellNavItem]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-active]': 'active() ? "true" : null',
  },
})
export class HellNavItem {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_NAV_ITEM_RECIPE,
  });

  /** Whether the nav item is marked as the active route. Defaults to `false`. */
  readonly active = input(false, { transform: booleanAttribute });
}

/** Leading icon slot of a nav item. */
@Directive({
  selector: '[hellNavItemIcon]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellNavItemIcon {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_NAV_ITEM_ICON_RECIPE,
  });
}

/** Text label slot of a nav item. */
@Directive({
  selector: '[hellNavItemLabel]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellNavItemLabel {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_NAV_ITEM_LABEL_RECIPE,
  });
}

/** Trailing content slot of a nav item, such as a badge or count. */
@Directive({
  selector: '[hellNavItemTrailing]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellNavItemTrailing {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_NAV_ITEM_TRAILING_RECIPE,
  });
}

/** A collapsible group of nav items within the sidenav. */
@Directive({
  selector: '[hellNavSection]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-collapsed]': 'isCollapsed() ? "true" : null',
  },
})
export class HellNavSection {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_NAV_SECTION_RECIPE,
  });

  /** Controlled collapsed state; when set, overrides the internal toggle. Defaults to `null` (uncontrolled). */
  readonly collapsed = input<boolean | null, boolean | string | null | undefined>(null, {
    transform: (v) => (v == null ? null : booleanAttribute(v)),
  });
  /** Emits the requested collapsed state whenever the section is toggled. */
  readonly collapsedChange = output<boolean>();

  private readonly _collapsed = signal(false);

  /** Resolved collapsed state, from the controlled input or the internal toggle. */
  readonly isCollapsed = () => this.collapsed() ?? this._collapsed();

  /** Toggles the section's collapsed state and emits the change. */
  toggle() {
    const next = !this.isCollapsed();
    this._collapsed.set(next);
    this.collapsedChange.emit(next);
  }
}

/** Button that toggles the collapsed state of its parent nav section. */
@Directive({
  selector: 'button[hellNavSectionToggle]',
  host: {
    type: 'button',
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.aria-expanded]': '!section.isCollapsed()',
    '(click)': 'toggle()',
  },
})
export class HellNavSectionToggle {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_NAV_SECTION_TOGGLE_RECIPE,
  });
  /** Parent nav section this toggle controls. */
  protected readonly section = inject(HellNavSection);

  /** Toggles the parent section's collapsed state. */
  protected toggle() {
    this.section.toggle();
  }
}

/** Container for a nav section's items, hidden when the section is collapsed. */
@Directive({
  selector: '[hellNavSectionItems]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.aria-hidden]': 'isHidden() ? "true" : null',
    '[attr.inert]': 'isHidden() ? "" : null',
  },
})
export class HellNavSectionItems {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_NAV_SECTION_ITEMS_RECIPE,
  });
  /** Parent nav section whose collapsed state gates these items. */
  protected readonly section = inject(HellNavSection);
  private readonly sidenav = inject(HellAppSidenav, { optional: true });

  /** Whether the items are hidden because the section is collapsed while the sidenav is expanded. */
  protected readonly isHidden = () =>
    this.section.isCollapsed() && !(this.sidenav?.isCollapsed() ?? false);
}

/** Main content slot of the app shell, with an optional constrained max width. */
@Directive({
  selector: '[hellAppContent]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[style.--hell-app-content-max-width]': 'maxWidthValue()',
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

  /** Optional max content width; bare numbers are treated as pixels. Defaults to `null` (unconstrained). */
  readonly maxWidth = input<string | number | null>(null);

  /** Normalized `max-width` CSS value bound to the content area, or `null` when unconstrained. */
  protected readonly maxWidthValue = computed(() => {
    const value = this.maxWidth();
    if (value == null || value === '') return null;
    if (typeof value === 'number') return `${value}px`;

    const trimmed = value.trim();
    return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
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
    '[attr.aria-expanded]': '!collapsed()',
    '[attr.aria-controls]': 'shell.sidenavPanelId',
    '[attr.aria-label]':
      'collapsed() ? labels.expandSidebar : labels.collapseSidebar',
    '[attr.data-hell-app-shell-toggle]': '"sidenav"',
    '[attr.data-hell-sidenav-toggle]': 'appearance() === "plain" ? null : appearance()',
  },
})
export class HellSidenavToggle {
  /** Visual variant of the toggle. Defaults to `plain`. */
  readonly appearance = input<'plain' | 'shell'>('plain');
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => this.appearance() === 'shell' ? HELL_SIDENAV_TOGGLE_SHELL_RECIPE : { root: '' },
  });
  /** Resolved accessibility labels for the toggle. */
  protected readonly labels = inject(HELL_APP_SHELL_LABELS);
  /** Parent app shell whose sidenav this toggle controls. */
  protected readonly shell = inject(HellAppShell);
  /** Whether the parent shell's sidenav is currently collapsed. */
  protected readonly collapsed = () => this.shell.isSidenavCollapsed();
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
    '[attr.aria-expanded]': '!hidden()',
    '[attr.aria-controls]': 'shell.secondaryPanelId',
    '[attr.aria-label]':
      'hidden() ? labels.showSecondaryPanel : labels.hideSecondaryPanel',
    '[attr.data-hell-app-shell-toggle]': '"secondary"',
    '[attr.data-hell-secondary-toggle]': 'appearance() === "plain" ? null : appearance()',
  },
})
export class HellSecondaryToggle {
  /** Visual variant of the toggle. Defaults to `plain`. */
  readonly appearance = input<'plain' | 'header' | 'rail'>('plain');
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => {
    if (this.appearance() === 'header') return HELL_SECONDARY_TOGGLE_HEADER_RECIPE;
        if (this.appearance() === 'rail') return HELL_SECONDARY_TOGGLE_RAIL_RECIPE;
        return { root: '' };
  },
  });
  /** Resolved accessibility labels for the toggle. */
  protected readonly labels = inject(HELL_APP_SHELL_LABELS);
  /** Parent app shell whose secondary panel this toggle controls. */
  protected readonly shell = inject(HellAppShell);
  /** Whether the parent shell's secondary panel is currently hidden. */
  protected readonly hidden = () => this.shell.isSecondaryHidden();
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
    '[attr.id]': 'panelId()',
    '[attr.data-hell-app-shell-panel]': '"secondary"',
    '[attr.data-hidden]': 'isHidden() ? "true" : null',
    '[attr.data-mobile-hidden]': 'isMobileHidden() ? "true" : null',
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

  /** Optional override; if omitted, follows the parent shell. */
  readonly hidden = input<boolean | null, boolean | string | null | undefined>(null, {
    transform: (v) => (v == null ? null : booleanAttribute(v)),
  });
  /** Optional DOM id override for the secondary panel; defaults to the shell-derived id. */
  readonly id = input<string | null>(null, { alias: 'id' });

  /** Parent app shell, if the secondary panel is rendered inside one. */
  protected readonly shell = inject(HellAppShell, { optional: true });
  /** Effective DOM id for the secondary panel. */
  protected readonly panelId = computed(() => this.id() ?? this.shell?.secondaryPanelId ?? null);
  /** Resolved hidden state, from the local override or the parent shell. */
  readonly isHidden = () => this.hidden() ?? this.shell?.isSecondaryHidden() ?? false;
  /** Whether the panel is hidden as a mobile overlay. */
  protected readonly isMobileHidden = () => !!this.shell?.isMobileLayout() && this.isHidden();

  constructor() {
    effect(() => {
      const id = this.panelId();
      if (id && this.shell) this.shell.secondaryPanelId = id;
    });
  }
}

/** Body slot of the secondary panel, made inert while the panel is hidden. */
@Directive({
  selector: '[hellAppSecondaryBody]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.aria-hidden]': 'secondary.isHidden() ? "true" : null',
    '[attr.inert]': 'secondary.isHidden() ? "" : null',
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
  /** Parent secondary panel whose hidden state gates this body. */
  readonly secondary = inject(HellAppSecondary);
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
  HellNavItem,
  HellNavItemIcon,
  HellNavItemLabel,
  HellNavItemTrailing,
  HellNavSection,
  HellNavSectionToggle,
  HellNavSectionItems,
  HellSidenavToggle,
  HellSecondaryToggle,
] as const;
