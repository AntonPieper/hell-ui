import { Directive } from '@angular/core';
import { NgpProgress, NgpProgressIndicator } from 'ng-primitives/progress';
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';

export type HellProgressPart = 'root';
export type HellProgressUi = HellUi<HellProgressPart>;

export type HellProgressBarPart = 'root';
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
export class HellProgress extends HellPartStyleable<HellProgressPart> {
  protected readonly recipe = HELL_PROGRESS_RECIPE;
  protected readonly defaultUiPart = 'root';
}

@Directive({
  selector: '[hellProgressBar]',
  hostDirectives: [NgpProgressIndicator],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellProgressBar extends HellPartStyleable<HellProgressBarPart> {
  protected readonly recipe = HELL_PROGRESS_BAR_RECIPE;
  protected readonly defaultUiPart = 'root';
}
