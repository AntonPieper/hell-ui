import { Component, ChangeDetectionStrategy, booleanAttribute, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';

/** Public parts of the HellIcon module, styleable through its Part Style Map. */
export type HellIconPart = 'root';
/** Part Style Map accepted by the HellIcon `ui` input. */
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
export class HellIcon {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellIconPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellIconPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_ICON_RECIPE,
  });

  /** Name of the registered icon to render, as passed to `provideIcons`. */
  readonly name = input.required<string>();
  /** CSS length for the glyph size. Defaults to `1em` so the icon scales with the surrounding text. */
  readonly size = input<string>('1em');
  /** CSS color for the glyph. Defaults to `null`, which inherits `currentColor`. */
  readonly color = input<string | null>(null);
  /** Hides the icon from assistive tech when `true`. Defaults to `true`. */
  readonly decorative = input(true, { transform: booleanAttribute });
  /** Accessible label used when `decorative` is `false`. Defaults to `null`. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
}
