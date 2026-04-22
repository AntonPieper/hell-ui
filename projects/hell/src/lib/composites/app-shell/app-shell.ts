import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  booleanAttribute,
  computed,
  input,
  signal,
} from '@angular/core';

/**
 * Application shell — top bar + collapsible sidenav + main content + optional
 * secondary sidebar. Designed for ICT/business apps. Composed via slot
 * directives so consumers control content while we own the grid layout.
 *
 * Usage:
 *   <div hellAppShell>
 *     <header hellAppTopbar>...</header>
 *     <aside hellAppSidenav [collapsed]="collapsed()">...</aside>
 *     <main hellAppContent>...</main>
 *     <aside hellAppSecondary [hidden]="!showInfo()">...</aside>
 *   </div>
 */
@Component({
  selector: '[hellAppShell]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hell-shell]': '!unstyled()',
    '[attr.data-sidenav-collapsed]': 'sidenavCollapsed() ? "true" : null',
    '[attr.data-secondary-hidden]': 'secondaryHidden() ? "true" : null',
  },
  template: '<ng-content></ng-content>',
  exportAs: 'hellAppShell',
})
export class HellAppShell {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly sidenavCollapsed = input(false, { transform: booleanAttribute });
  readonly secondaryHidden = input(false, { transform: booleanAttribute });
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
    '[attr.data-collapsed]': 'collapsed() ? "true" : null',
  },
})
export class HellAppSidenav {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly collapsed = input(false, { transform: booleanAttribute });
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
    '[attr.data-hidden]': 'hidden() ? "true" : null',
  },
})
export class HellAppSecondary {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly hidden = input(false, { transform: booleanAttribute });
}

export const HELL_APP_SHELL_DIRECTIVES = [
  HellAppShell,
  HellAppTopbar,
  HellAppSidenav,
  HellAppContent,
  HellAppSecondary,
] as const;
