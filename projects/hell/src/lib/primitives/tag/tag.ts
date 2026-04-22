import { Directive, booleanAttribute, input } from '@angular/core';
import { HellTagVariant } from '../../core/types';

@Directive({
  selector: '[hellTag]',
  host: {
    '[class.hell-tag]': '!unstyled()',
    '[attr.data-variant]': 'variant()',
  },
})
export class HellTag {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly variant = input<HellTagVariant>('default');
}

@Directive({
  selector: '[hellBadge]',
  host: { '[class.hell-badge]': '!unstyled()' },
})
export class HellBadge {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: 'kbd[hellKbd], [hellKbd]',
  host: { '[class.hell-kbd]': '!unstyled()' },
})
export class HellKbd {
  readonly unstyled = input(false, { transform: booleanAttribute });
}
