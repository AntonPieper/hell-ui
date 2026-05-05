import { HellStyleable } from '../../core/styleable';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

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
  },
  template: '<ng-content></ng-content>',
  exportAs: 'hellAppShell',
})
export class HellAppShell extends HellStyleable {
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

  /** Mobile uses overlay panels instead of layout-shifting rails. */
  private readonly _isMobileLayout = signal(false);
  private readonly _mobileSidenavOpen = signal(false);
  private readonly _mobileSecondaryOpen = signal(false);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    super();
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
        element.getAttribute('data-hell-app-shell-toggle') === 'secondary' ||
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
    return path.some((target) => isElementTarget(target) && predicate(target));
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
  private readonly shell = inject(HellAppShell, { optional: true });
  readonly isCollapsed = () => this.collapsed() ?? this.shell?.isSidenavCollapsed() ?? false;
  protected readonly isMobileHidden = () => !!this.shell?.isMobileLayout() && this.isCollapsed();
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
    '[attr.aria-pressed]': 'collapsed()',
    '[attr.aria-label]': 'collapsed() ? "Expand sidebar" : "Collapse sidebar"',
    '[attr.data-hell-app-shell-toggle]': '"sidenav"',
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
  selector: 'button[hellSecondaryToggle]',
  host: {
    type: 'button',
    '(click)': 'toggle()',
    '[attr.aria-pressed]': '!hidden()',
    '[attr.aria-label]': 'hidden() ? "Show secondary panel" : "Hide secondary panel"',
    '[attr.data-hell-app-shell-toggle]': '"secondary"',
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
    '[attr.data-hell-app-shell-panel]': '"secondary"',
    '[attr.data-hidden]': 'isHidden() ? "true" : null',
    '[attr.data-mobile-hidden]': 'isMobileHidden() ? "true" : null',
  },
})
export class HellAppSecondary extends HellStyleable {
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
export class HellAppSecondaryBody extends HellStyleable {
  readonly secondary = inject(HellAppSecondary);
}

function nullableBooleanAttribute(value: boolean | string | null | undefined): boolean | null {
  return value == null ? null : booleanAttribute(value);
}

function isElementTarget(target: EventTarget): target is Element {
  return (
    typeof target === 'object' &&
    target !== null &&
    (target as Node).nodeType === 1 &&
    typeof (target as Element).hasAttribute === 'function'
  );
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
