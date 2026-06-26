import { Directive, input } from '@angular/core';
import { HellTagVariant } from '@hell-ui/angular/core';
import { HellStyleable } from '@hell-ui/angular/core';

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
