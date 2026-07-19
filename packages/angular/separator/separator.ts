import { Directive, input } from '@angular/core';
import { NgpSeparator } from 'ng-primitives/separator';
import type { HellOrientation, HellSize } from '@hell-ui/angular/core';
import { hellPartStyler, type HellRecipe, type HellUiInput } from '@hell-ui/angular/core';

/** Default part recipe for `hellSeparator`; pinned by the separator recipe snapshot. */
export const HELL_SEPARATOR_RECIPE: HellRecipe<'root'> = {
  root: 'block shrink-0 border-0 bg-hell-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch data-[spacing=none]:m-0 data-[orientation=horizontal]:data-[spacing=xs]:my-hell-1 data-[orientation=horizontal]:data-[spacing=sm]:my-hell-2 data-[orientation=horizontal]:data-[spacing=md]:my-hell-4 data-[orientation=horizontal]:data-[spacing=lg]:my-hell-6 data-[orientation=horizontal]:data-[spacing=xl]:my-hell-8 data-[orientation=vertical]:data-[spacing=xs]:mx-hell-1 data-[orientation=vertical]:data-[spacing=sm]:mx-hell-2 data-[orientation=vertical]:data-[spacing=md]:mx-hell-4 data-[orientation=vertical]:data-[spacing=lg]:mx-hell-6 data-[orientation=vertical]:data-[spacing=xl]:mx-hell-8',
};

/** Visual or semantic divider between sections of content. */
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
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SEPARATOR_RECIPE,
  });

  /** Axis the separator lies on. Defaults to `horizontal`. */
  readonly orientation = input<HellOrientation>('horizontal');
  /**
   * Symmetric margin around the separator on its main axis.
   * - horizontal → vertical margin (block)
   * - vertical   → horizontal margin (inline)
   * Defaults to `md`. Use `none` for flush dividers (e.g. inside cards).
   */
  readonly spacing = input<HellSize | 'none'>('md');
}
