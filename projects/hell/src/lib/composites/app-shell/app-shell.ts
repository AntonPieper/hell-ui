import { HELL_LABELS } from '../../core/labels';
import { isElementLike } from '../../core/dom';
import { HellStyleable } from '../../core/styleable';
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

export const HELL_APP_SHELL_DESKTOP_MIN_WIDTH_PX = 768;
export const HELL_APP_SHELL_MOBILE_MAX_WIDTH_PX = HELL_APP_SHELL_DESKTOP_MIN_WIDTH_PX - 1;
export const HELL_APP_SHELL_MOBILE_MEDIA = `(max-width: ${HELL_APP_SHELL_MOBILE_MAX_WIDTH_PX}px)`;
let nextAppShellId = 0;

type HellAppShellMobilePanel = 'sidenav' | 'secondary';

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
    '[class.hell-shell]': '!unstyled()',
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
export class HellAppShell extends HellStyleable implements OnDestroy {
  readonly sidenavCollapsed = input<boolean | null, boolean | string | null | undefined>(null, {
    transform: nullableBooleanAttribute,
  });
  readonly sidenavCollapsedChange = output<boolean>();
  readonly secondaryHidden = input<boolean | null, boolean | string | null | undefined>(null, {
    transform: nullableBooleanAttribute,
  });
  readonly secondaryHiddenChange = output<boolean>();

  /** Internal toggles — written only while the matching input is uncontrolled. */
  protected readonly _sidenavCollapsed = signal(false);
  protected readonly _secondaryHidden = signal(false);

  readonly shellId = ++nextAppShellId;
  sidenavPanelId = `hell-app-shell-${this.shellId}-sidenav`;
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
    super();
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

  readonly isMobileLayout = () => this._isMobileLayout();

  readonly mobileOpenPanel = () => {
    if (!this._isMobileLayout()) return null;
    if (!this.isSidenavCollapsed()) return 'sidenav';
    if (!this.isSecondaryHidden()) return 'secondary';
    return null;
  };

  ngOnDestroy(): void {
    this.teardownMobileFocusTrap();
  }

  readonly isSidenavCollapsed = () => {
    const controlled = this.sidenavCollapsed();
    if (controlled !== null) return controlled;
    return this.isMobileLayout() ? !this._mobileSidenavOpen() : this._sidenavCollapsed();
  };

  readonly isSecondaryHidden = () => {
    const controlled = this.secondaryHidden();
    if (controlled !== null) return controlled;
    return this.isMobileLayout() ? !this._mobileSecondaryOpen() : this._secondaryHidden();
  };

  toggleSidenav() {
    const next = !this.isSidenavCollapsed();
    this.setSidenavCollapsed(next);
    if (this.isMobileLayout() && !next && !this.isSecondaryHidden()) {
      this.setSecondaryHidden(true);
    }
  }

  toggleSecondary() {
    const next = !this.isSecondaryHidden();
    this.setSecondaryHidden(next);
    if (this.isMobileLayout() && !next && !this.isSidenavCollapsed()) {
      this.setSidenavCollapsed(true);
    }
  }

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
    if (panelHasFocus) {
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
        candidate.isConnected &&
        candidate !== this._mobilePanelRestoreTarget &&
        !candidate.hasAttribute('disabled') &&
        this.interactivityChecker.isFocusable(candidate, { ignoreVisibility: true }) &&
        (this.interactivityChecker.isTabbable(candidate) ||
          (candidate.getClientRects().length > 0 && candidate.tabIndex >= 0))
      ) {
        candidate.focus({ preventScroll: true });
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

@Directive({
  selector: '[hellAppTopbar]',
  host: { '[class.hell-topbar]': '!unstyled()' },
})
export class HellAppTopbar extends HellStyleable {}

@Directive({
  selector: '[hellAppSidenav]',
  host: {
    '[class.hell-sidenav]': '!unstyled()',
    '[attr.id]': 'panelId()',
    '[attr.data-hell-app-shell-panel]': '"sidenav"',
    '[attr.data-collapsed]': 'isCollapsed() ? "true" : null',
    '[attr.data-mobile-hidden]': 'isMobileHidden() ? "true" : null',
    '[attr.aria-hidden]': 'isMobileHidden() ? "true" : null',
    '[attr.inert]': 'isMobileHidden() ? "" : null',
  },
})
export class HellAppSidenav extends HellStyleable {
  /** Optional override; if omitted, follows the parent shell. */
  readonly collapsed = input<boolean | null, boolean | string | null | undefined>(null, {
    transform: (v) => (v == null ? null : booleanAttribute(v)),
  });
  readonly id = input<string | null>(null, { alias: 'id' });

  protected readonly shell = inject(HellAppShell, { optional: true });
  protected readonly panelId = computed(() => this.id() ?? this.shell?.sidenavPanelId ?? null);
  readonly isCollapsed = () => this.collapsed() ?? this.shell?.isSidenavCollapsed() ?? false;
  protected readonly isMobileHidden = () => !!this.shell?.isMobileLayout() && this.isCollapsed();

  constructor() {
    super();
    effect(() => {
      const id = this.panelId();
      if (id && this.shell) this.shell.sidenavPanelId = id;
    });
  }
}

@Directive({
  selector: '[hellNavItem]',
  host: {
    '[class.hell-nav-item]': '!unstyled()',
    '[attr.data-slot]': '"nav-item"',
    '[attr.data-active]': 'active() ? "true" : null',
  },
})
export class HellNavItem extends HellStyleable {
  readonly active = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellNavItemIcon]',
  host: {
    '[class.hell-nav-icon]': '!unstyled()',
    '[attr.data-slot]': '"nav-icon"',
  },
})
export class HellNavItemIcon extends HellStyleable {}

@Directive({
  selector: '[hellNavItemLabel]',
  host: {
    '[class.hell-nav-label]': '!unstyled()',
    '[attr.data-slot]': '"nav-label"',
  },
})
export class HellNavItemLabel extends HellStyleable {}

@Directive({
  selector: '[hellNavItemTrailing]',
  host: {
    '[class.hell-nav-trailing]': '!unstyled()',
    '[attr.data-slot]': '"nav-trailing"',
  },
})
export class HellNavItemTrailing extends HellStyleable {}

@Directive({
  selector: '[hellNavSection]',
  host: {
    '[class.hell-nav-section]': '!unstyled()',
    '[attr.data-slot]': '"nav-section"',
    '[attr.data-collapsed]': 'isCollapsed() ? "true" : null',
  },
})
export class HellNavSection extends HellStyleable {
  readonly collapsed = input<boolean | null, boolean | string | null | undefined>(null, {
    transform: (v) => (v == null ? null : booleanAttribute(v)),
  });
  readonly collapsedChange = output<boolean>();

  private readonly _collapsed = signal(false);

  readonly isCollapsed = () => this.collapsed() ?? this._collapsed();

  toggle() {
    const next = !this.isCollapsed();
    this._collapsed.set(next);
    this.collapsedChange.emit(next);
  }
}

@Directive({
  selector: 'button[hellNavSectionToggle]',
  host: {
    type: 'button',
    '[class.hell-nav-section-toggle]': '!unstyled()',
    '[attr.data-slot]': '"nav-section-toggle"',
    '[attr.aria-expanded]': '!section.isCollapsed()',
    '(click)': 'toggle()',
  },
})
export class HellNavSectionToggle extends HellStyleable {
  protected readonly section = inject(HellNavSection);

  protected toggle() {
    this.section.toggle();
  }
}

@Directive({
  selector: '[hellNavSectionItems]',
  host: {
    '[class.hell-nav-section-items]': '!unstyled()',
    '[attr.data-slot]': '"nav-section-items"',
    '[attr.aria-hidden]': 'isHidden() ? "true" : null',
    '[attr.inert]': 'isHidden() ? "" : null',
  },
})
export class HellNavSectionItems extends HellStyleable {
  protected readonly section = inject(HellNavSection);
  private readonly sidenav = inject(HellAppSidenav, { optional: true });

  protected readonly isHidden = () =>
    this.section.isCollapsed() && !(this.sidenav?.isCollapsed() ?? false);
}

@Directive({
  selector: '[hellAppContent]',
  host: {
    '[class.hell-content]': '!unstyled()',
    '[style.--hell-app-content-max-width]': 'maxWidthValue()',
    /** Dialogs scoped here render only over the content area. */
    '[attr.data-hell-dialog-scope-root]': '"true"',
    '[attr.data-dialog-root]': '"true"',
  },
})
export class HellAppContent extends HellStyleable {
  readonly maxWidth = input<string | number | null>(null);

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
    type: 'button',
    '(click)': 'toggle()',
    '[attr.aria-expanded]': '!collapsed()',
    '[attr.aria-controls]': 'shell.sidenavPanelId',
    '[attr.aria-label]':
      'collapsed() ? labels.appShell.expandSidebar : labels.appShell.collapseSidebar',
    '[attr.data-hell-app-shell-toggle]': '"sidenav"',
    '[attr.data-hell-sidenav-toggle]': 'appearance() === "plain" ? null : appearance()',
  },
})
export class HellSidenavToggle {
  readonly appearance = input<'plain' | 'shell'>('plain');
  protected readonly labels = inject(HELL_LABELS);
  protected readonly shell = inject(HellAppShell);
  protected readonly collapsed = () => this.shell.isSidenavCollapsed();
  protected toggle() {
    this.shell.toggleSidenav();
  }
}

/** Click anywhere → toggles `secondaryHidden` on the parent shell. */
@Directive({
  selector: 'button[hellSecondaryToggle]',
  host: {
    type: 'button',
    '(click)': 'toggle()',
    '[attr.aria-expanded]': '!hidden()',
    '[attr.aria-controls]': 'shell.secondaryPanelId',
    '[attr.aria-label]':
      'hidden() ? labels.appShell.showSecondaryPanel : labels.appShell.hideSecondaryPanel',
    '[attr.data-hell-app-shell-toggle]': '"secondary"',
    '[attr.data-hell-secondary-toggle]': 'appearance() === "plain" ? null : appearance()',
  },
})
export class HellSecondaryToggle {
  readonly appearance = input<'plain' | 'header' | 'rail'>('plain');
  protected readonly labels = inject(HELL_LABELS);
  protected readonly shell = inject(HellAppShell);
  protected readonly hidden = () => this.shell.isSecondaryHidden();
  protected toggle() {
    this.shell.toggleSecondary();
  }
}

@Directive({
  selector: '[hellAppSecondary]',
  host: {
    '[class.hell-secondary]': '!unstyled()',
    '[attr.id]': 'panelId()',
    '[attr.data-hell-app-shell-panel]': '"secondary"',
    '[attr.data-hidden]': 'isHidden() ? "true" : null',
    '[attr.data-mobile-hidden]': 'isMobileHidden() ? "true" : null',
  },
})
export class HellAppSecondary extends HellStyleable {
  readonly hidden = input<boolean | null, boolean | string | null | undefined>(null, {
    transform: (v) => (v == null ? null : booleanAttribute(v)),
  });
  readonly id = input<string | null>(null, { alias: 'id' });

  protected readonly shell = inject(HellAppShell, { optional: true });
  protected readonly panelId = computed(() => this.id() ?? this.shell?.secondaryPanelId ?? null);
  readonly isHidden = () => this.hidden() ?? this.shell?.isSecondaryHidden() ?? false;
  protected readonly isMobileHidden = () => !!this.shell?.isMobileLayout() && this.isHidden();

  constructor() {
    super();
    effect(() => {
      const id = this.panelId();
      if (id && this.shell) this.shell.secondaryPanelId = id;
    });
  }
}

@Directive({
  selector: '[hellAppSecondaryBody]',
  host: {
    '[class.hell-secondary-body]': '!unstyled()',
    '[attr.aria-hidden]': 'secondary.isHidden() ? "true" : null',
    '[attr.inert]': 'secondary.isHidden() ? "" : null',
  },
})
export class HellAppSecondaryBody extends HellStyleable {
  readonly secondary = inject(HellAppSecondary);
}

function nullableBooleanAttribute(value: boolean | string | null | undefined): boolean | null {
  return value == null ? null : booleanAttribute(value);
}

export const HELL_APP_SHELL_DIRECTIVES = [
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
