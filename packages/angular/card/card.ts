import { Directive, input } from '@angular/core';
import type { HellUiInput } from 'hell-ui/core';
import { hellPartStyler } from 'hell-ui/internal/core';

import {
  HELL_CARD_BODY_RECIPE,
  HELL_CARD_FOOTER_RECIPE,
  HELL_CARD_HEADER_RECIPE,
  HELL_CARD_RECIPE,
} from './card.recipes';

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
