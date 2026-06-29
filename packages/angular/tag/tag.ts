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
  root: 'inline-flex items-center gap-hell-1 whitespace-nowrap rounded-full bg-hell-surface-muted px-hell-2 py-[2px] text-[11px] font-semibold leading-tight tracking-[0.02em] text-hell-foreground-muted data-[variant=primary]:bg-hell-primary-soft data-[variant=primary]:text-hell-primary data-[variant=success]:bg-hell-success-soft data-[variant=success]:text-hell-success-strong data-[variant=info]:bg-hell-info-soft data-[variant=info]:text-hell-info-strong data-[variant=danger]:bg-hell-danger-soft data-[variant=danger]:text-hell-danger-strong data-[variant=warning]:bg-hell-warning-soft data-[variant=warning]:text-hell-warning-strong',
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
