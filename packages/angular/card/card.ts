import { Directive, input } from '@angular/core';
import { hellPartStyler, type HellRecipe, type HellUiInput } from '@hell-ui/angular/core';

/** Default part recipe for `hellCard`; pinned by the card recipe snapshot. */
export const HELL_CARD_RECIPE: HellRecipe<'root'> = {
  root: 'flex min-w-0 max-w-full flex-col overflow-clip rounded-hell-lg border border-solid border-hell-border bg-hell-surface-elevated shadow-hell-xs data-[elevation=0]:shadow-none data-[elevation=2]:shadow-hell-md data-[elevation=3]:shadow-hell-lg',
};

/** Default part recipe for `hellCardHeader`; pinned by the card recipe snapshot. */
export const HELL_CARD_HEADER_RECIPE: HellRecipe<'root'> = {
  root: 'flex items-center justify-between gap-hell-4 border-b border-hell-border px-hell-6 py-hell-5 text-sm font-semibold text-hell-foreground',
};

/** Default part recipe for `hellCardBody`; pinned by the card recipe snapshot. */
export const HELL_CARD_BODY_RECIPE: HellRecipe<'root'> = {
  root: 'min-h-0 min-w-0 flex-auto p-hell-6',
};

/** Default part recipe for `hellCardFooter`; pinned by the card recipe snapshot. */
export const HELL_CARD_FOOTER_RECIPE: HellRecipe<'root'> = {
  root: 'flex justify-end gap-hell-3 border-t border-hell-border px-hell-6 py-hell-4',
};

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
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
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
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
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
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
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
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_CARD_FOOTER_RECIPE,
  });
}

/** All directives that make up the card entry point, for bulk `imports`. */
export const HELL_CARD_IMPORTS = [
  HellCard,
  HellCardHeader,
  HellCardBody,
  HellCardFooter,
] as const;
