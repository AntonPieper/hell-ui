import { Directive, input } from '@angular/core';
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';

export type HellCardPart = 'root';
export type HellCardUi = HellUi<HellCardPart>;

export type HellCardHeaderPart = 'root';
export type HellCardHeaderUi = HellUi<HellCardHeaderPart>;

export type HellCardBodyPart = 'root';
export type HellCardBodyUi = HellUi<HellCardBodyPart>;

export type HellCardFooterPart = 'root';
export type HellCardFooterUi = HellUi<HellCardFooterPart>;

const HELL_CARD_RECIPE = {
  root: 'flex min-w-0 max-w-full flex-col overflow-clip rounded-hell-lg border border-solid border-hell-border bg-hell-surface-elevated shadow-hell-xs data-[elevation=0]:shadow-none data-[elevation=2]:shadow-hell-md data-[elevation=3]:shadow-hell-lg',
} satisfies HellRecipe<HellCardPart>;

const HELL_CARD_HEADER_RECIPE = {
  root: 'flex items-center justify-between gap-hell-4 border-b border-hell-border px-hell-6 py-hell-5 text-sm font-semibold text-hell-foreground',
} satisfies HellRecipe<HellCardHeaderPart>;

const HELL_CARD_BODY_RECIPE = {
  root: 'min-h-0 min-w-0 flex-auto p-hell-6',
} satisfies HellRecipe<HellCardBodyPart>;

const HELL_CARD_FOOTER_RECIPE = {
  root: 'flex justify-end gap-hell-3 border-t border-hell-border px-hell-6 py-hell-4',
} satisfies HellRecipe<HellCardFooterPart>;

@Directive({
  selector: '[hellCard]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-elevation]': 'elevation()',
  },
})
export class HellCard extends HellPartStyleable<HellCardPart> {
  protected readonly recipe = HELL_CARD_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly elevation = input<0 | 1 | 2 | 3>(1);
}

@Directive({
  selector: '[hellCardHeader]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellCardHeader extends HellPartStyleable<HellCardHeaderPart> {
  protected readonly recipe = HELL_CARD_HEADER_RECIPE;
  protected readonly defaultUiPart = 'root';
}

@Directive({
  selector: '[hellCardBody]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellCardBody extends HellPartStyleable<HellCardBodyPart> {
  protected readonly recipe = HELL_CARD_BODY_RECIPE;
  protected readonly defaultUiPart = 'root';
}

@Directive({
  selector: '[hellCardFooter]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellCardFooter extends HellPartStyleable<HellCardFooterPart> {
  protected readonly recipe = HELL_CARD_FOOTER_RECIPE;
  protected readonly defaultUiPart = 'root';
}

export const HELL_CARD_DIRECTIVES = [
  HellCard,
  HellCardHeader,
  HellCardBody,
  HellCardFooter,
] as const;
