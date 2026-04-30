import { Directive, booleanAttribute, input } from '@angular/core';
import { HellTagVariant } from '../../core/types';
import { HellStyleable } from '../../core/styleable';

@Directive({
  selector: '[hellTag]',
  host: {
    '[class.hell-tag]': '!unstyled()',
    '[attr.data-variant]': 'variant()',
  },
})
export class HellTag extends HellStyleable {
  readonly variant = input<HellTagVariant>('default');
}

@Directive({
  selector: '[hellBadge]',
  host: { '[class.hell-badge]': '!unstyled()' },
})
export class HellBadge extends HellStyleable {}

@Directive({
  selector: 'kbd[hellKbd], [hellKbd]',
  host: { '[class.hell-kbd]': '!unstyled()' },
})
export class HellKbd extends HellStyleable {}
