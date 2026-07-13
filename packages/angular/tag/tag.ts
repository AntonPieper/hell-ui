import { Directive, input } from '@angular/core';
import { HellTagVariant } from '@hell-ui/angular/core';
import { hellPartStyler, type HellRecipe, type HellUiInput } from '@hell-ui/angular/core';

const HELL_TAG_RECIPE = {
  root: 'inline-flex items-center gap-hell-1 whitespace-nowrap rounded-full [--_hell-tag-bg:var(--color-hell-surface-muted)] [--_hell-tag-fg:var(--color-hell-foreground-muted)] bg-[var(--_hell-tag-bg)] px-hell-2 py-[2px] text-[11px] font-semibold leading-tight tracking-[0.02em] text-[var(--_hell-tag-fg)] data-[variant=primary]:[--_hell-tag-bg:var(--color-hell-primary-soft)] data-[variant=primary]:[--_hell-tag-fg:var(--color-hell-primary)] data-[variant=success]:[--_hell-tag-bg:var(--color-hell-success-soft)] data-[variant=success]:[--_hell-tag-fg:var(--color-hell-success-strong)] data-[variant=info]:[--_hell-tag-bg:var(--color-hell-info-soft)] data-[variant=info]:[--_hell-tag-fg:var(--color-hell-info-strong)] data-[variant=danger]:[--_hell-tag-bg:var(--color-hell-danger-soft)] data-[variant=danger]:[--_hell-tag-fg:var(--color-hell-danger-strong)] data-[variant=warning]:[--_hell-tag-bg:var(--color-hell-warning-soft)] data-[variant=warning]:[--_hell-tag-fg:var(--color-hell-warning-strong)]',
} satisfies HellRecipe<'root'>;

const HELL_BADGE_RECIPE = {
  root: 'inline-flex h-hell-4 min-w-hell-4 items-center justify-center rounded-full bg-hell-danger px-hell-1 py-0 text-[10px] font-bold text-white',
} satisfies HellRecipe<'root'>;

const HELL_KBD_RECIPE = {
  root: 'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded bg-hell-surface-subtle px-[5px] py-0 font-mono text-[11px] text-hell-foreground-muted border border-b-2 border-solid border-hell-border',
} satisfies HellRecipe<'root'>;

/** Compact label used to categorize or annotate content. */
@Directive({
  selector: '[hellTag]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-variant]': 'variant()',
  },
})
export class HellTag {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TAG_RECIPE,
  });

  /** Color scheme conveying the tag's semantic meaning. Defaults to `default`. */
  readonly variant = input<HellTagVariant>('default');
}

/** Small numeric or status indicator, typically overlaid on another element. */
@Directive({
  selector: '[hellBadge]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellBadge {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_BADGE_RECIPE,
  });
}

/** Styled representation of a keyboard key or shortcut. */
@Directive({
  selector: 'kbd[hellKbd], [hellKbd]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellKbd {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_KBD_RECIPE,
  });
}
