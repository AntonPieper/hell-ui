import { Directive, booleanAttribute, input } from '@angular/core';

@Directive({
  selector: '[hellCard]',
  host: {
    '[class.hell-card]': '!unstyled()',
    '[attr.data-elevation]': 'elevation()',
  },
})
export class HellCard {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly elevation = input<0 | 1 | 2 | 3>(1);
}

@Directive({
  selector: '[hellCardHeader]',
  host: { '[class.hell-card-header]': '!unstyled()' },
})
export class HellCardHeader {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellCardBody]',
  host: { '[class.hell-card-body]': '!unstyled()' },
})
export class HellCardBody {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellCardFooter]',
  host: { '[class.hell-card-footer]': '!unstyled()' },
})
export class HellCardFooter {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

export const HELL_CARD_DIRECTIVES = [
  HellCard,
  HellCardHeader,
  HellCardBody,
  HellCardFooter,
] as const;
