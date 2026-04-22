import { Directive, booleanAttribute, input } from '@angular/core';
import { NgpButton } from 'ng-primitives/button';
import { HellButtonVariant, HellSize } from '../../core/types';

/**
 * Styled button built on `NgpButton`.
 *
 * Adds:
 *   - `variant`  default | primary | soft | ghost | link | danger | success
 *   - `size`     xs | sm | md | lg | xl
 *   - `iconOnly` square icon-button shape
 *   - `block`    full width
 *   - `unstyled` opts out of `hell-button` host class
 *
 * Styling reacts to `data-variant`, `data-size`, `data-icon-only`,
 * `data-block` and to ng-primitives state attrs (`data-hover`, `data-press`,
 * `data-focus-visible`, `data-disabled`).
 */
@Directive({
  selector: 'button[hellButton], a[hellButton]',
  hostDirectives: [{ directive: NgpButton }],
  host: {
    '[class.hell-button]': '!unstyled()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.data-icon-only]': 'iconOnly() ? "" : null',
    '[attr.data-block]': 'block() ? "" : null',
  },
})
export class HellButton {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly variant = input<HellButtonVariant>('default');
  readonly size = input<HellSize>('md');
  readonly iconOnly = input(false, { transform: booleanAttribute });
  readonly block = input(false, { transform: booleanAttribute });
}
