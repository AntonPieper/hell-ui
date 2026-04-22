import {
  Component,
  ChangeDetectionStrategy,
  booleanAttribute,
  input,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';

/**
 * Thin styled wrapper around `<ng-icon>` from `@ng-icons/core`.
 *
 * Consumer apps must register icons via `provideIcons({ faChevronDown, ... })`
 * either at bootstrap or per-component.
 *
 * Use `size` (a CSS length) to control glyph size — defaults to 1em so the
 * icon scales with parent text. `decorative` (default true) hides the icon
 * from assistive tech; set `decorative=false` and pass an `aria-label` when
 * the icon is the only conveyor of meaning.
 */
@Component({
  selector: 'hell-icon',
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display:inline-flex; line-height:0;',
    '[style.--ng-icon__size]': 'size()',
    '[style.color]': 'color()',
  },
  template: `<ng-icon [name]="name()" [attr.aria-hidden]="decorative() ? 'true' : null" />`,
})
export class HellIcon {
  readonly name = input.required<string>();
  readonly size = input<string>('1em');
  readonly color = input<string | null>(null);
  readonly decorative = input(true, { transform: booleanAttribute });
}
