import { Component, booleanAttribute, input, ChangeDetectionStrategy } from '@angular/core';
import { NgpAvatar, NgpAvatarFallback, NgpAvatarImage } from 'ng-primitives/avatar';
import { HellSize } from '../../core/types';
import { HellStyleable } from '../../core/styleable';

/**
 * Styled avatar with image + initials fallback.
 *
 * Sizes: xs | sm | md | lg | xl. Shape: round | square.
 * Override `--color-hell-surface` / `--_hell-av-size` on the host to retheme.
 */
@Component({
  selector: 'hell-avatar',
  hostDirectives: [NgpAvatar],
  imports: [NgpAvatarImage, NgpAvatarFallback],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hell-avatar]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.data-shape]': 'shape()',
  },
  template: `
    @if (image()) {
      <img ngpAvatarImage [src]="image()" [alt]="alt() || fallback() || ''" />
    }
    <span ngpAvatarFallback>{{ fallback() }}</span>
  `,
})
export class HellAvatar extends HellStyleable {
  /** Avatar image src. */
  readonly image = input<string | null>(null);
  /** Two-letter fallback (initials). */
  readonly fallback = input<string>('');
  /** Image alt-text — defaults to fallback when omitted. */
  readonly alt = input<string | null>(null);
  readonly size = input<HellSize>('md');
  readonly shape = input<'round' | 'square'>('round');
}
