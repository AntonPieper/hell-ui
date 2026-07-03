import { Directive, input } from '@angular/core';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';

/** Public parts of the HellCard module, styleable through its Part Style Map. */
export type HellCardPart = 'root';
/** Part Style Map accepted by the HellCard `ui` input. */
export type HellCardUi = HellUi<HellCardPart>;

/** Public parts of the HellCardHeader module, styleable through its Part Style Map. */
export type HellCardHeaderPart = 'root';
/** Part Style Map accepted by the HellCardHeader `ui` input. */
export type HellCardHeaderUi = HellUi<HellCardHeaderPart>;

/** Public parts of the HellCardBody module, styleable through its Part Style Map. */
export type HellCardBodyPart = 'root';
/** Part Style Map accepted by the HellCardBody `ui` input. */
export type HellCardBodyUi = HellUi<HellCardBodyPart>;

/** Public parts of the HellCardFooter module, styleable through its Part Style Map. */
export type HellCardFooterPart = 'root';
/** Part Style Map accepted by the HellCardFooter `ui` input. */
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

/** Container for a card's header, body and footer, with elevation-driven shadow and border. */
@Directive({
  selector: '[hellCard]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-elevation]': 'elevation()',
  },
})
export class HellCard {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellCardPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellCardPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_CARD_RECIPE,
  });

  /** Shadow depth of the card, from `0` (flat) to `3` (highest). Defaults to `1`. */
  readonly elevation = input<0 | 1 | 2 | 3>(1);
}

/** Header region of a card, typically holding a title and actions. */
@Directive({
  selector: '[hellCardHeader]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellCardHeader {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellCardHeaderPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellCardHeaderPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_CARD_HEADER_RECIPE,
  });
}

/** Main content region of a card. */
@Directive({
  selector: '[hellCardBody]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellCardBody {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellCardBodyPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellCardBodyPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_CARD_BODY_RECIPE,
  });
}

/** Footer region of a card, typically holding actions. */
@Directive({
  selector: '[hellCardFooter]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellCardFooter {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellCardFooterPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellCardFooterPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_CARD_FOOTER_RECIPE,
  });
}

/** All directives that make up the card entry point, for bulk `imports`. */
export const HELL_CARD_DIRECTIVES = [
  HellCard,
  HellCardHeader,
  HellCardBody,
  HellCardFooter,
] as const;
