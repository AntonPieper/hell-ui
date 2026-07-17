import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  booleanAttribute,
  input,
} from '@angular/core';
import { HellSize } from '@hell-ui/angular/core';
import { hellPartStyler, type HellRecipe, type HellUiInput } from '@hell-ui/angular/core';

const HELL_AVATAR_GROUP_RECIPE = {
  root: 'inline-flex items-center [--_hell-av-size:32px] [--_hell-avatar-group-overlap:calc(var(--spacing)*-2)] [--_hell-avatar-group-cutout:var(--color-hell-surface)] [--_hell-avatar-group-ring-width:2px] [--_hell-avatar-group-hover-shadow:0_0_0_var(--_hell-avatar-group-ring-width)_var(--_hell-avatar-group-cutout),0_2px_6px_rgb(0_0_0_/_0.12)] data-[size=xs]:[--_hell-av-size:20px] data-[size=xs]:[--_hell-avatar-group-overlap:calc(var(--spacing)*-1.5)] data-[size=sm]:[--_hell-av-size:26px] data-[size=sm]:[--_hell-avatar-group-overlap:calc(var(--spacing)*-1.75)] data-[size=md]:[--_hell-av-size:32px] data-[size=lg]:[--_hell-av-size:40px] data-[size=lg]:[--_hell-avatar-group-overlap:calc(var(--spacing)*-2.5)] data-[size=xl]:[--_hell-av-size:56px] data-[size=xl]:[--_hell-avatar-group-overlap:calc(var(--spacing)*-3)]',
} satisfies HellRecipe<'root'>;

const HELL_AVATAR_GROUP_ITEM_RECIPE = {
  root: 'relative inline-flex shrink-0 min-h-[var(--_hell-av-size)] min-w-[var(--_hell-av-size)] items-center justify-center rounded-full isolate outline-none transition-[box-shadow] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)]',
} satisfies HellRecipe<'root'>;

const HELL_AVATAR_GROUP_OVERFLOW_RECIPE = {
  root: 'relative inline-flex shrink-0 h-[var(--_hell-av-size,32px)] w-[var(--_hell-av-size,32px)] items-center justify-center rounded-full border-2 border-solid border-hell-surface-elevated bg-hell-surface-muted p-0 font-[inherit] text-[11px] font-semibold text-hell-foreground-muted outline-none transition-[background-color,border-color,box-shadow,color] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] [&:is(button,a):hover]:bg-hell-surface-subtle [&:is(button,a):hover]:text-hell-foreground [&:is(button,a):active]:bg-hell-surface-subtle [&:is(button,a):active]:text-hell-foreground [&:is(button,a):active]:border-hell-border-strong data-open:bg-hell-surface-subtle data-open:text-hell-foreground data-open:border-hell-border-strong aria-expanded:bg-hell-surface-subtle aria-expanded:text-hell-foreground aria-expanded:border-hell-border-strong',
} satisfies HellRecipe<'root'>;

/**
 * Stacked avatar container.
 *
 * This component owns only layout and shared styling variables. Consumers
 * project `hell-avatar`, buttons, menu triggers, or any other avatar-like
 * content and wire interactions where they are used.
 */
@Component({
  selector: 'hell-avatar-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-size]': 'size()',
  },
  template: `<ng-content />`,
})
export class HellAvatarGroup {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_AVATAR_GROUP_RECIPE,
  });

  /** Size applied to the group and its projected avatars. Defaults to `md`. */
  readonly size = input<HellSize>('md');
}

/** Marks a single projected avatar as a member of the group, applying stacking and selection styling. */
@Directive({
  selector: '[hellAvatarGroupItem]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-selected]': 'selected() ? "" : null',
  },
})
export class HellAvatarGroupItem {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_AVATAR_GROUP_ITEM_RECIPE,
  });

  /** Marks the item as selected, applying the selected styling. Defaults to `false`. */
  readonly selected = input(false, { transform: booleanAttribute });
}

/** Marker for the overflow indicator (e.g. "+3") shown at the end of the avatar stack. */
@Directive({
  selector: '[hellAvatarGroupOverflow]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellAvatarGroupOverflow {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_AVATAR_GROUP_OVERFLOW_RECIPE,
  });
}

/** All directives that make up the avatar-group entry point, for bulk `imports`. */
export const HELL_AVATAR_GROUP_IMPORTS = [
  HellAvatarGroup,
  HellAvatarGroupItem,
  HellAvatarGroupOverflow,
] as const;

/**
 * Legacy import tuple name.
 * @alias
 * @deprecated Use HELL_AVATAR_GROUP_IMPORTS.
 */
export const HELL_AVATAR_GROUP_DIRECTIVES = HELL_AVATAR_GROUP_IMPORTS;
