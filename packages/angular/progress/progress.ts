import { Directive, input } from '@angular/core';
import { NgpProgress, NgpProgressIndicator } from 'ng-primitives/progress';
import { hellPartStyler, type HellRecipe, type HellUiInput } from '@hell-ui/angular/core';

const HELL_PROGRESS_RECIPE = {
  root: 'relative block h-[calc(var(--spacing)*1.5)] w-full overflow-hidden rounded-full bg-hell-surface-muted',
} satisfies HellRecipe<'root'>;

const HELL_PROGRESS_BAR_RECIPE = {
  root: 'block h-full rounded-[inherit] bg-hell-primary transition-[width] duration-[var(--hell-duration-base)] ease-[var(--ease-hell-out)]',
} satisfies HellRecipe<'root'>;

/** Track for a determinate progress indicator. */
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
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_PROGRESS_RECIPE,
  });
}

/** Filled indicator inside a `hellProgress` track, sized to the current value. */
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
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_PROGRESS_BAR_RECIPE,
  });
}
