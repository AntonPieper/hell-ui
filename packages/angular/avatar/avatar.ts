import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgpAvatar, NgpAvatarFallback, NgpAvatarImage } from 'ng-primitives/avatar';
import { HellSize } from '@hell-ui/angular/core';
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';

export type HellAvatarPart = 'root';
export type HellAvatarUi = HellUi<HellAvatarPart>;

const HELL_AVATAR_RECIPE = {
  root: 'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full border-2 border-solid border-hell-surface-elevated bg-hell-primary-soft font-semibold tracking-[0.02em] text-hell-primary-soft-foreground transition-[border-color] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] [--_hell-av-size:32px] h-[var(--_hell-av-size)] w-[var(--_hell-av-size)] text-[calc(var(--_hell-av-size)*0.4)] data-[size=xs]:[--_hell-av-size:20px] data-[size=sm]:[--_hell-av-size:26px] data-[size=md]:[--_hell-av-size:32px] data-[size=lg]:[--_hell-av-size:40px] data-[size=xl]:[--_hell-av-size:56px] data-[shape=square]:rounded-hell-md',
} satisfies HellRecipe<HellAvatarPart>;

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
    '[class]': "part('root')",
    'data-slot': 'root',
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
export class HellAvatar extends HellPartStyleable<HellAvatarPart> {
  protected readonly recipe = HELL_AVATAR_RECIPE;
  protected readonly defaultUiPart = 'root';

  /** Avatar image src. */
  readonly image = input<string | null>(null);
  /** Two-letter fallback (initials). */
  readonly fallback = input<string>('');
  /** Image alt-text — defaults to fallback when omitted. */
  readonly alt = input<string | null>(null);
  readonly size = input<HellSize>('md');
  readonly shape = input<'round' | 'square'>('round');
}
