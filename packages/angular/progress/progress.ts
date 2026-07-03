import { Directive, input } from '@angular/core';
import { NgpProgress, NgpProgressIndicator } from 'ng-primitives/progress';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';

/** Public parts of the HellProgress module, styleable through its Part Style Map. */
export type HellProgressPart = 'root';
/** Part Style Map accepted by the HellProgress `ui` input. */
export type HellProgressUi = HellUi<HellProgressPart>;

/** Public parts of the HellProgressBar module, styleable through its Part Style Map. */
export type HellProgressBarPart = 'root';
/** Part Style Map accepted by the HellProgressBar `ui` input. */
export type HellProgressBarUi = HellUi<HellProgressBarPart>;

const HELL_PROGRESS_RECIPE = {
  root: 'relative block h-[calc(var(--spacing)*1.5)] w-full overflow-hidden rounded-full bg-hell-surface-muted',
} satisfies HellRecipe<HellProgressPart>;

const HELL_PROGRESS_BAR_RECIPE = {
  root: 'block h-full rounded-[inherit] bg-hell-primary transition-[width] duration-[var(--hell-duration-base)] ease-[var(--ease-hell-out)]',
} satisfies HellRecipe<HellProgressBarPart>;

@Directive({
  selector: '[hellProgress]',
  hostDirectives: [
    {
      directive: NgpProgress,
      inputs: ['ngpProgressValue:value', 'ngpProgressMax:max'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellProgress {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellProgressPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellProgressPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_PROGRESS_RECIPE,
  });
}

@Directive({
  selector: '[hellProgressBar]',
  hostDirectives: [NgpProgressIndicator],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellProgressBar {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellProgressBarPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellProgressBarPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_PROGRESS_BAR_RECIPE,
  });
}
