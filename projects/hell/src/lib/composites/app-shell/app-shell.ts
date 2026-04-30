import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * Application shell — top bar + collapsible sidenav + main content + optional
 * secondary sidebar. Designed for ICT/business apps. Composed via slot
 * directives so consumers control content while we own the grid layout.
 *
 * Two ways to control state:
 *   1. Pass `[sidenavCollapsed]` / `[secondaryHidden]` from your parent
 *      component (controlled mode).
 *   2. Use the built-in toggle directives (`hellSidenavToggle`,
 *      `hellSecondaryToggle`) which mutate internal signals on the shell —
 *      no parent state required.
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
  },
  template: '<ng-content></ng-content>',
  exportAs: 'hellAppShell',
})
export class HellAppShell {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly sidenavCollapsed = input(false, { transform: booleanAttribute });
  readonly secondaryHidden = input(false, { transform: booleanAttribute });

  /** Internal desktop toggles — written by the toggle directives. Combined
   *  with the controlled inputs via OR so either path works. */
  protected readonly _sidenavCollapsed = signal(false);
  protected readonly _secondaryHidden = signal(false);

  /** Mobile uses overlay panels instead of layout-shifting rails. */
  private readonly _isMobileLayout = signal(false);
  private readonly _mobileSidenavOpen = signal(false);
  private readonly _mobileSecondaryOpen = signal(false);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const media = globalThis.matchMedia?.('(max-width: 767px)');
    if (!media) return;

    const updateMobileLayout = () => {
      const mobile = media.matches;
      this._isMobileLayout.set(mobile);
      if (!mobile) {
        this._mobileSidenavOpen.set(false);
        this._mobileSecondaryOpen.set(false);
      }
    };

    updateMobileLayout();
    media.addEventListener('change', updateMobileLayout);
    this.destroyRef.onDestroy(() => media.removeEventListener('change', updateMobileLayout));
  }

  readonly isMobileLayout = () => this._isMobileLayout();

  readonly isSidenavCollapsed = () =>
    this.isMobileLayout()
      ? this.sidenavCollapsed() || !this._mobileSidenavOpen()
      : this.sidenavCollapsed() || this._sidenavCollapsed();

  readonly isSecondaryHidden = () =>
    this.isMobileLayout()
      ? this.secondaryHidden() || !this._mobileSecondaryOpen()
      : this.secondaryHidden() || this._secondaryHidden();

  toggleSidenav() {
    if (this.isMobileLayout()) {
      this._mobileSidenavOpen.update((v) => !v);
      if (this._mobileSidenavOpen()) this._mobileSecondaryOpen.set(false);
      return;
    }
    this._sidenavCollapsed.update((v) => !v);
  }

  toggleSecondary() {
    if (this.isMobileLayout()) {
      this._mobileSecondaryOpen.update((v) => !v);
      if (this._mobileSecondaryOpen()) this._mobileSidenavOpen.set(false);
      return;
    }
    this._secondaryHidden.update((v) => !v);
  }

  closeMobilePanels() {
    if (!this.isMobileLayout()) return;
    this._mobileSidenavOpen.set(false);
    this._mobileSecondaryOpen.set(false);
  }

  protected dismissMobilePanels(event: PointerEvent) {
    if (!this.isMobileLayout() || (this.isSidenavCollapsed() && this.isSecondaryHidden())) {
      return;
    }

    const path = event.composedPath();
    const insidePanelOrToggle = this.pathContains(
      path,
      (element) =>
        element.classList.contains('hell-sidenav') ||
        element.classList.contains('hell-secondary') ||
        element.hasAttribute('hellappsidenav') ||
        element.hasAttribute('hellAppSidenav') ||
        element.hasAttribute('hellappsecondary') ||
        element.hasAttribute('hellAppSecondary') ||
        element.hasAttribute('hellsidenavtoggle') ||
        element.hasAttribute('hellSidenavToggle') ||
        element.hasAttribute('hellsecondarytoggle') ||
        element.hasAttribute('hellSecondaryToggle'),
    );

    if (!insidePanelOrToggle) this.closeMobilePanels();
  }

  private pathContains(path: EventTarget[], predicate: (element: Element) => boolean): boolean {
    return path.some((target) => target instanceof Element && predicate(target));
  }
}

@Directive({
  selector: '[hellAppTopbar]',
  host: { '[class.hell-topbar]': '!unstyled()' },
})
export class HellAppTopbar {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellAppSidenav]',
  host: {
    '[class.hell-sidenav]': '!unstyled()',
    '[attr.data-collapsed]': 'isCollapsed() ? "true" : null',
    '[attr.data-mobile-hidden]': 'isMobileHidden() ? "true" : null',
    '[attr.aria-hidden]': 'isMobileHidden() ? "true" : null',
    '[attr.inert]': 'isMobileHidden() ? "" : null',
  },
})
export class HellAppSidenav {
  readonly unstyled = input(false, { transform: booleanAttribute });
  /** Optional override; if omitted, follows the parent shell. */
  readonly collapsed = input<boolean | null, boolean | string | null | undefined>(null, {
    transform: (v) => (v == null ? null : booleanAttribute(v)),
  });
  private readonly shell = inject(HellAppShell, { optional: true });
  protected readonly isCollapsed = () =>
    this.collapsed() ?? this.shell?.isSidenavCollapsed() ?? false;
  protected readonly isMobileHidden = () => !!this.shell?.isMobileLayout() && this.isCollapsed();
}

@Directive({
  selector: '[hellAppContent]',
  host: {
    '[class.hell-content]': '!unstyled()',
    '[style.--hell-app-content-max-width]': 'maxWidthValue()',
    /** Dialogs scoped here render only over the content area. */
    '[attr.data-dialog-root]': '"true"',
  },
})
export class HellAppContent {
  readonly unstyled = input(false, { transform: booleanAttribute });
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
  selector: '[hellSidenavToggle]',
  host: {
    type: 'button',
    '(click)': 'toggle()',
    '[attr.aria-pressed]': 'collapsed()',
    '[attr.aria-label]': 'collapsed() ? "Expand sidebar" : "Collapse sidebar"',
    '[attr.data-hell-sidenav-toggle]': 'appearance() === "plain" ? null : appearance()',
  },
})
export class HellSidenavToggle {
  readonly appearance = input<'plain' | 'shell'>('plain');
  private readonly shell = inject(HellAppShell);
  protected readonly collapsed = () => this.shell.isSidenavCollapsed();
  protected toggle() {
    this.shell.toggleSidenav();
  }
}

/** Click anywhere → toggles `secondaryHidden` on the parent shell. */
@Directive({
  selector: '[hellSecondaryToggle]',
  host: {
    type: 'button',
    '(click)': 'toggle()',
    '[attr.aria-pressed]': '!hidden()',
    '[attr.aria-label]': 'hidden() ? "Show secondary panel" : "Hide secondary panel"',
    '[attr.data-hell-secondary-toggle]': 'appearance() === "plain" ? null : appearance()',
  },
})
export class HellSecondaryToggle {
  readonly appearance = input<'plain' | 'header' | 'rail'>('plain');
  private readonly shell = inject(HellAppShell);
  protected readonly hidden = () => this.shell.isSecondaryHidden();
  protected toggle() {
    this.shell.toggleSecondary();
  }
}

@Directive({
  selector: '[hellAppSecondary]',
  host: {
    '[class.hell-secondary]': '!unstyled()',
    '[attr.data-hidden]': 'isHidden() ? "true" : null',
    '[attr.data-mobile-hidden]': 'isMobileHidden() ? "true" : null',
  },
})
export class HellAppSecondary {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly hidden = input<boolean | null, boolean | string | null | undefined>(null, {
    transform: (v) => (v == null ? null : booleanAttribute(v)),
  });
  private readonly shell = inject(HellAppShell, { optional: true });
  readonly isHidden = () => this.hidden() ?? this.shell?.isSecondaryHidden() ?? false;
  protected readonly isMobileHidden = () => !!this.shell?.isMobileLayout() && this.isHidden();
}

@Directive({
  selector: '[hellAppSecondaryBody]',
  host: {
    '[class.hell-secondary-body]': '!unstyled()',
    '[attr.aria-hidden]': 'secondary.isHidden() ? "true" : null',
    '[attr.inert]': 'secondary.isHidden() ? "" : null',
  },
})
export class HellAppSecondaryBody {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly secondary = inject(HellAppSecondary);
}

export const HELL_APP_SHELL_DIRECTIVES = [
  HellAppShell,
  HellAppTopbar,
  HellAppSidenav,
  HellAppContent,
  HellAppSecondary,
  HellAppSecondaryBody,
  HellSidenavToggle,
  HellSecondaryToggle,
] as const;
