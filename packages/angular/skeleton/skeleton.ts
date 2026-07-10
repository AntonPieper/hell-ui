import { Directive, input } from '@angular/core';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';

/** Public parts of the HellSkeleton module, styleable through its Part Style Map. */
export type HellSkeletonPart = 'root';
/** Part Style Map accepted by the HellSkeleton `ui` input. */
export type HellSkeletonUi = HellUi<HellSkeletonPart>;

const HELL_SKELETON_RECIPE = {
  root: 'block animate-[hell-shimmer_1.6s_linear_infinite] rounded-sm bg-hell-surface-muted bg-[linear-gradient(90deg,transparent_0%,color-mix(in_oklab,var(--color-hell-surface)_70%,transparent)_50%,transparent_100%)] bg-[length:200%_100%] bg-no-repeat motion-reduce:animate-none motion-reduce:bg-none data-[shape=circle]:rounded-full data-[shape=rect]:rounded-hell-md',
} satisfies HellRecipe<HellSkeletonPart>;

/** Loading shape placeholder. Pure visual — no semantics. */
@Directive({
  selector: '[hellSkeleton]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-shape]': 'shape()',
    '[style.--_hell-skeleton-width]': 'width()',
    '[style.--_hell-skeleton-height]': 'height()',
    'aria-hidden': 'true',
  },
})
export class HellSkeleton {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellSkeletonPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellSkeletonPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SKELETON_RECIPE,
  });

  /** CSS width of the placeholder. Defaults to `100%`. */
  readonly width = input<string>('100%');
  /** CSS height of the placeholder. Defaults to `14px`. */
  readonly height = input<string>('14px');
  /** Built-in shapes. `text` (default), `circle`, `rect`. */
  readonly shape = input<'text' | 'circle' | 'rect'>('text');
}
