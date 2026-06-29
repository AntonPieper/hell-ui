import { Directive, input } from '@angular/core';
import { HellTagVariant } from '@hell-ui/angular/core';
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';

export type HellTagPart = 'root';
export type HellTagUi = HellUi<HellTagPart>;

export type HellBadgePart = 'root';
export type HellBadgeUi = HellUi<HellBadgePart>;

export type HellKbdPart = 'root';
export type HellKbdUi = HellUi<HellKbdPart>;

const HELL_TAG_RECIPE = {
  root: 'inline-flex items-center gap-hell-1 whitespace-nowrap rounded-full [--_hell-tag-bg:var(--color-hell-surface-muted)] [--_hell-tag-fg:var(--color-hell-foreground-muted)] bg-[var(--_hell-tag-bg)] px-hell-2 py-[2px] text-[11px] font-semibold leading-tight tracking-[0.02em] text-[var(--_hell-tag-fg)] data-[variant=primary]:[--_hell-tag-bg:var(--color-hell-primary-soft)] data-[variant=primary]:[--_hell-tag-fg:var(--color-hell-primary)] data-[variant=success]:[--_hell-tag-bg:var(--color-hell-success-soft)] data-[variant=success]:[--_hell-tag-fg:var(--color-hell-success-strong)] data-[variant=info]:[--_hell-tag-bg:var(--color-hell-info-soft)] data-[variant=info]:[--_hell-tag-fg:var(--color-hell-info-strong)] data-[variant=danger]:[--_hell-tag-bg:var(--color-hell-danger-soft)] data-[variant=danger]:[--_hell-tag-fg:var(--color-hell-danger-strong)] data-[variant=warning]:[--_hell-tag-bg:var(--color-hell-warning-soft)] data-[variant=warning]:[--_hell-tag-fg:var(--color-hell-warning-strong)]',
} satisfies HellRecipe<HellTagPart>;

const HELL_BADGE_RECIPE = {
  root: 'inline-flex h-hell-4 min-w-hell-4 items-center justify-center rounded-full bg-hell-danger px-hell-1 py-0 text-[10px] font-bold text-white',
} satisfies HellRecipe<HellBadgePart>;

const HELL_KBD_RECIPE = {
  root: 'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded bg-hell-surface-subtle px-[5px] py-0 font-mono text-[11px] text-hell-foreground-muted border border-b-2 border-solid border-hell-border',
} satisfies HellRecipe<HellKbdPart>;

@Directive({
  selector: '[hellTag]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-variant]': 'variant()',
  },
})
export class HellTag extends HellPartStyleable<HellTagPart> {
  protected readonly recipe = HELL_TAG_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly variant = input<HellTagVariant>('default');
}

@Directive({
  selector: '[hellBadge]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellBadge extends HellPartStyleable<HellBadgePart> {
  protected readonly recipe = HELL_BADGE_RECIPE;
  protected readonly defaultUiPart = 'root';
}

@Directive({
  selector: 'kbd[hellKbd], [hellKbd]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellKbd extends HellPartStyleable<HellKbdPart> {
  protected readonly recipe = HELL_KBD_RECIPE;
  protected readonly defaultUiPart = 'root';
}
