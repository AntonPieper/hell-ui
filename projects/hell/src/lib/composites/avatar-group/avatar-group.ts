import {
  Component,
  ChangeDetectionStrategy,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
import { HellAvatar } from '../../primitives/avatar/avatar';
import { HellSize } from '../../core/types';

export interface HellAvatarItem {
  fallback: string;
  image?: string | null;
  alt?: string | null;
}

/**
 * Stacked group of avatars with overflow indicator. Set `max` to cap the
 * number of avatars shown — the rest are summarised as `+N`.
 */
@Component({
  selector: 'hell-avatar-group',
  imports: [HellAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hell-avatar-group]': '!unstyled()',
  },
  template: `
    @for (item of visible(); track $index) {
      <hell-avatar [size]="size()" [image]="item.image ?? null" [fallback]="item.fallback" [alt]="item.alt ?? null" />
    }
    @if (overflowCount() > 0) {
      <span
        class="hell-avatar-overflow"
        [style.--_hell-av-size]="
          size() === 'xs' ? '20px'
            : size() === 'sm' ? '26px'
            : size() === 'lg' ? '40px'
            : size() === 'xl' ? '56px' : '32px'
        "
        [attr.aria-label]="overflowCount() + ' more'"
      >+{{ overflowCount() }}</span>
    }
  `,
})
export class HellAvatarGroup {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly items = input.required<HellAvatarItem[]>();
  readonly max = input<number>(4);
  readonly size = input<HellSize>('md');

  readonly visible = computed(() => this.items().slice(0, this.max()));
  readonly overflowCount = computed(() =>
    Math.max(0, this.items().length - this.max())
  );
}
