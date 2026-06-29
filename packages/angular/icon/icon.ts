import { Component, ChangeDetectionStrategy, booleanAttribute, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';

export type HellIconPart = 'root';
export type HellIconUi = HellUi<HellIconPart>;

const HELL_ICON_RECIPE = {
  root: 'inline-flex text-[var(--_hell-icon-color,currentColor)] leading-none',
} satisfies HellRecipe<HellIconPart>;

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
    '[class]': "part('root')",
    'data-slot': 'root',
    '[style.--ng-icon__size]': 'size()',
    '[style.--_hell-icon-color]': 'color()',
    '[attr.aria-hidden]': 'decorative() ? "true" : null',
    '[attr.role]': 'decorative() ? null : "img"',
    '[attr.aria-label]': 'decorative() ? null : ariaLabel()',
  },
  template: `<ng-icon [name]="name()" aria-hidden="true" />`,
})
export class HellIcon extends HellPartStyleable<HellIconPart> {
  protected readonly recipe = HELL_ICON_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly name = input.required<string>();
  readonly size = input<string>('1em');
  readonly color = input<string | null>(null);
  readonly decorative = input(true, { transform: booleanAttribute });
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
}
