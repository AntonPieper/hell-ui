import { Directive, ElementRef, booleanAttribute, inject, input } from '@angular/core';
import { NgpButton, injectButtonState } from 'ng-primitives/button';
import { HellButtonVariant, HellSize } from '../../core/types';
import { HellStyleable } from '../../core/styleable';

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
  hostDirectives: [{ directive: NgpButton, inputs: ['disabled'] }],
  host: {
    '[class.hell-button]': '!unstyled()',
    '[attr.type]': 'nativeButtonType()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.data-icon-only]': 'iconOnly() ? "" : null',
    '[attr.data-block]': 'block() ? "" : null',
    '[attr.aria-disabled]': 'anchorAriaDisabled()',
    '[attr.tabindex]': 'disabledAnchorTabIndex()',
    '(click)': 'preventDisabledAnchor($event)',
    '(keydown.enter)': 'preventDisabledAnchor($event)',
  },
})
export class HellButton extends HellStyleable {
  readonly variant = input<HellButtonVariant>('default');
  readonly size = input<HellSize>('md');
  readonly iconOnly = input(false, { transform: booleanAttribute });
  readonly block = input(false, { transform: booleanAttribute });

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly buttonState = injectButtonState();

  protected anchorAriaDisabled(): 'true' | null {
    return this.isAnchor() && this.buttonState().disabled() ? 'true' : null;
  }

  protected disabledAnchorTabIndex(): -1 | null {
    return this.isAnchor() && this.buttonState().disabled() ? -1 : null;
  }

  protected preventDisabledAnchor(event: Event): void {
    if (!this.isAnchor() || !this.buttonState().disabled()) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
  }

  protected nativeButtonType(): string | null {
    if (!this.isButton()) return null;
    return this.host.getAttribute('type') ?? 'button';
  }

  private isButton(): boolean {
    return this.host.tagName.toLowerCase() === 'button';
  }

  private isAnchor(): boolean {
    return this.host.tagName.toLowerCase() === 'a';
  }
}
