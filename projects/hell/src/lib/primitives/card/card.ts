import { Directive, booleanAttribute, input } from '@angular/core';
import { HellStyleable } from '../../core/styleable';

@Directive({
  selector: '[hellCard]',
  host: {
    '[class.hell-card]': '!unstyled()',
    '[attr.data-elevation]': 'elevation()',
  },
})
export class HellCard extends HellStyleable {
  readonly elevation = input<0 | 1 | 2 | 3>(1);
}

@Directive({
  selector: '[hellCardHeader]',
  host: { '[class.hell-card-header]': '!unstyled()' },
})
export class HellCardHeader extends HellStyleable {}

@Directive({
  selector: '[hellCardBody]',
  host: { '[class.hell-card-body]': '!unstyled()' },
})
export class HellCardBody extends HellStyleable {}

@Directive({
  selector: '[hellCardFooter]',
  host: { '[class.hell-card-footer]': '!unstyled()' },
})
export class HellCardFooter extends HellStyleable {}

export const HELL_CARD_DIRECTIVES = [
  HellCard,
  HellCardHeader,
  HellCardBody,
  HellCardFooter,
] as const;
