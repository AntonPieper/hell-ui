import { Directive, booleanAttribute, input } from '@angular/core';

@Directive({
  selector: '[hellSkeleton]',
  host: {
    '[class.hell-skeleton]': '!unstyled()',
    '[style.--_hell-skeleton-width]': 'width()',
    '[style.--_hell-skeleton-height]': 'height()',
  },
})
export class HellSkeleton {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly width = input<string>('100%');
  readonly height = input<string>('14px');
}

@Directive({
  selector: '[hellSpinner]',
  host: {
    '[class.hell-spinner]': '!unstyled()',
    role: 'status',
    'aria-label': 'Loading',
  },
})
export class HellSpinner {
  readonly unstyled = input(false, { transform: booleanAttribute });
}
