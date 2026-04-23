import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  HostListener,
  booleanAttribute,
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
 *       <button hellSecondaryToggle>...</button>
 *     </header>
 *     <aside hellAppSidenav>...</aside>
 *     <main hellAppContent>...</main>
 *     <aside hellAppSecondary>...</aside>
 *   </div>
 */
@Component({
  selector: '[hellAppShell]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hell-shell]': '!unstyled()',
    '[attr.data-sidenav-collapsed]': 'isSidenavCollapsed() ? "true" : null',
    '[attr.data-secondary-hidden]': 'isSecondaryHidden() ? "true" : null',
  },
  template: '<ng-content></ng-content>',
  exportAs: 'hellAppShell',
})
export class HellAppShell {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly sidenavCollapsed = input(false, { transform: booleanAttribute });
  readonly secondaryHidden = input(false, { transform: booleanAttribute });

  /** Internal toggles — written by the toggle directives. Combined with
   *  the controlled inputs via OR so either path works. */
  protected readonly _sidenavCollapsed = signal(false);
  protected readonly _secondaryHidden = signal(false);

  readonly isSidenavCollapsed = () => this.sidenavCollapsed() || this._sidenavCollapsed();
  readonly isSecondaryHidden = () => this.secondaryHidden() || this._secondaryHidden();

  toggleSidenav() { this._sidenavCollapsed.update(v => !v); }
  toggleSecondary() { this._secondaryHidden.update(v => !v); }
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
}

@Directive({
  selector: '[hellAppContent]',
  host: {
    '[class.hell-content]': '!unstyled()',
    /** Dialogs scoped here render only over the content area. */
    '[attr.data-dialog-root]': '"true"',
  },
})
export class HellAppContent {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellAppSecondary]',
  host: {
    '[class.hell-secondary]': '!unstyled()',
    '[attr.data-hidden]': 'isHidden() ? "true" : null',
    '[attr.aria-hidden]': 'isHidden() ? "true" : null',
  },
})
export class HellAppSecondary {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly hidden = input<boolean | null, boolean | string | null | undefined>(null, {
    transform: (v) => (v == null ? null : booleanAttribute(v)),
  });
  private readonly shell = inject(HellAppShell, { optional: true });
  protected readonly isHidden = () =>
    this.hidden() ?? this.shell?.isSecondaryHidden() ?? false;
}

/** Click anywhere → toggles `sidenavCollapsed` on the parent shell. */
@Directive({
  selector: '[hellSidenavToggle]',
  host: {
    type: 'button',
    '[attr.aria-pressed]': 'collapsed()',
    '[attr.aria-label]': 'collapsed() ? "Expand sidebar" : "Collapse sidebar"',
  },
})
export class HellSidenavToggle {
  private readonly shell = inject(HellAppShell);
  protected readonly collapsed = () => this.shell.isSidenavCollapsed();
  @HostListener('click') protected toggle() { this.shell.toggleSidenav(); }
}

/** Click anywhere → toggles `secondaryHidden` on the parent shell. */
@Directive({
  selector: '[hellSecondaryToggle]',
  host: {
    type: 'button',
    '[attr.aria-pressed]': '!hidden()',
    '[attr.aria-label]': 'hidden() ? "Show secondary panel" : "Hide secondary panel"',
  },
})
export class HellSecondaryToggle {
  private readonly shell = inject(HellAppShell);
  protected readonly hidden = () => this.shell.isSecondaryHidden();
  @HostListener('click') protected toggle() { this.shell.toggleSecondary(); }
}

export const HELL_APP_SHELL_DIRECTIVES = [
  HellAppShell,
  HellAppTopbar,
  HellAppSidenav,
  HellAppContent,
  HellAppSecondary,
  HellSidenavToggle,
  HellSecondaryToggle,
] as const;