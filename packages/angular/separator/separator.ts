import { Directive, input } from '@angular/core';
import { NgpSeparator } from 'ng-primitives/separator';
import type { HellOrientation, HellSize } from '@hell-ui/angular/core';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';

/** Public parts of the HellSeparator module, styleable through its Part Style Map. */
export type HellSeparatorPart = 'root';
/** Part Style Map accepted by the HellSeparator `ui` input. */
export type HellSeparatorUi = HellUi<HellSeparatorPart>;

const HELL_SEPARATOR_RECIPE = {
  root: 'block shrink-0 border-0 bg-hell-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch data-[spacing=none]:m-0 data-[orientation=horizontal]:data-[spacing=xs]:my-hell-1 data-[orientation=horizontal]:data-[spacing=sm]:my-hell-2 data-[orientation=horizontal]:data-[spacing=md]:my-hell-4 data-[orientation=horizontal]:data-[spacing=lg]:my-hell-6 data-[orientation=horizontal]:data-[spacing=xl]:my-hell-8 data-[orientation=vertical]:data-[spacing=xs]:mx-hell-1 data-[orientation=vertical]:data-[spacing=sm]:mx-hell-2 data-[orientation=vertical]:data-[spacing=md]:mx-hell-4 data-[orientation=vertical]:data-[spacing=lg]:mx-hell-6 data-[orientation=vertical]:data-[spacing=xl]:mx-hell-8',
} satisfies HellRecipe<HellSeparatorPart>;

@Directive({
  selector: '[hellSeparator]',
  hostDirectives: [{ directive: NgpSeparator, inputs: ['ngpSeparatorOrientation:orientation'] }],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-orientation]': 'orientation()',
    '[attr.data-spacing]': 'spacing()',
    '[attr.role]': '"separator"',
  },
})
export class HellSeparator {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellSeparatorPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellSeparatorPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SEPARATOR_RECIPE,
  });

  readonly orientation = input<HellOrientation>('horizontal');
  /**
   * Symmetric margin around the separator on its main axis.
   * - horizontal → vertical margin (block)
   * - vertical   → horizontal margin (inline)
   * Defaults to `md`. Use `none` for flush dividers (e.g. inside cards).
   */
  readonly spacing = input<HellSize | 'none'>('md');
}
