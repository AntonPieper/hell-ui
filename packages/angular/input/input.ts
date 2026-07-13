import { Directive, booleanAttribute, input } from '@angular/core';
import { NgpInput } from 'ng-primitives/input';
import { NgpTextarea } from 'ng-primitives/textarea';
import { hellPartStyler, type HellRecipe, type HellUiInput } from '@hell-ui/angular/core';
import { HellSize } from '@hell-ui/angular/core';

const HELL_FORM_CONTROL_STATE_CLASSES =
  'outline-none transition-[border-color,box-shadow] duration-[var(--hell-duration-fast)] ease-hell-out data-hover:border-hell-border-strong data-focus:border-hell-border-focus data-focus:shadow-[0_0_0_3px_var(--color-hell-focus-ring)] focus:border-hell-border-focus focus:shadow-[0_0_0_3px_var(--color-hell-focus-ring)] disabled:cursor-not-allowed disabled:border-hell-border disabled:bg-hell-surface-subtle disabled:text-hell-foreground-muted data-disabled:cursor-not-allowed data-disabled:border-hell-border data-disabled:bg-hell-surface-subtle data-disabled:text-hell-foreground-muted aria-invalid:!border-hell-danger invalid:!border-hell-danger';

const HELL_TEXT_CONTROL_PLACEHOLDER_CLASSES =
  'placeholder:text-hell-foreground-subtle disabled:placeholder:text-hell-foreground-subtle disabled:placeholder:opacity-70 data-disabled:placeholder:text-hell-foreground-subtle data-disabled:placeholder:opacity-70';

const HELL_INPUT_RECIPE = {
  root: `inline-flex h-hell-control-md w-full rounded-hell-md border border-hell-border bg-hell-surface-elevated px-hell-4 font-[inherit] text-[13px] text-hell-foreground ${HELL_FORM_CONTROL_STATE_CLASSES} ${HELL_TEXT_CONTROL_PLACEHOLDER_CLASSES} data-[size=sm]:h-hell-control-sm data-[size=sm]:px-hell-3 data-[size=sm]:text-xs data-[size=lg]:h-hell-control-lg data-[size=lg]:px-hell-5 data-[size=lg]:text-sm`,
} satisfies HellRecipe<'root'>;

const HELL_NATIVE_SELECT_RECIPE = {
  root: `inline-flex h-hell-control-md w-full appearance-none rounded-hell-md border border-hell-border bg-hell-surface-elevated bg-[image:linear-gradient(45deg,transparent_50%,var(--color-hell-foreground-muted)_50%),linear-gradient(135deg,var(--color-hell-foreground-muted)_50%,transparent_50%)] bg-[length:4px_4px] bg-[position:calc(100%_-_12px)_50%,calc(100%_-_8px)_50%] bg-no-repeat ps-hell-4 pe-[calc(var(--spacing-hell-4)+1rem)] font-[inherit] text-[13px] text-hell-foreground ${HELL_FORM_CONTROL_STATE_CLASSES} data-[size=sm]:h-hell-control-sm data-[size=sm]:ps-hell-3 data-[size=sm]:pe-[calc(var(--spacing-hell-3)+1rem)] data-[size=sm]:text-xs data-[size=lg]:h-hell-control-lg data-[size=lg]:ps-hell-5 data-[size=lg]:pe-[calc(var(--spacing-hell-5)+1rem)] data-[size=lg]:text-sm`,
} satisfies HellRecipe<'root'>;

const HELL_TEXTAREA_RECIPE = {
  root: `block min-h-[calc(var(--spacing-hell-control-md)*2)] w-full resize-y rounded-hell-md border border-hell-border bg-hell-surface-elevated px-hell-4 py-hell-3 font-[inherit] text-[13px] leading-normal text-hell-foreground ${HELL_FORM_CONTROL_STATE_CLASSES} ${HELL_TEXT_CONTROL_PLACEHOLDER_CLASSES} data-[size=sm]:min-h-[calc(var(--spacing-hell-control-sm)*2)] data-[size=sm]:px-hell-3 data-[size=sm]:py-hell-2 data-[size=sm]:text-xs data-[size=lg]:min-h-[calc(var(--spacing-hell-control-lg)*2)] data-[size=lg]:px-hell-5 data-[size=lg]:py-hell-4 data-[size=lg]:text-sm data-auto-grow:field-sizing-content data-auto-grow:resize-none`,
} satisfies HellRecipe<'root'>;

/** Styled text input built on `NgpInput`. Sizes via `size`; error styling via `invalid`. */
@Directive({
  selector: 'input[hellInput]',
  hostDirectives: [{ directive: NgpInput, inputs: ['disabled', 'id'] }],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-size]': 'size()',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
  },
})
export class HellInput {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_INPUT_RECIPE,
  });

  /** Control size; `sm`, `md`, or `lg`. */
  readonly size = input<Exclude<HellSize, 'xs' | 'xl'>>('md');
  /** Marks the control invalid for styling and `aria-invalid`. */
  readonly invalid = input(false, { alias: 'invalid', transform: booleanAttribute });
}

/** Styled native `<select>` built on `NgpInput`, with a CSS-drawn chevron. */
@Directive({
  selector: 'select[hellNativeSelect]',
  hostDirectives: [{ directive: NgpInput, inputs: ['disabled', 'id'] }],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-size]': 'size()',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
  },
})
export class HellNativeSelect {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_NATIVE_SELECT_RECIPE,
  });

  /** Control size; `sm`, `md`, or `lg`. */
  readonly size = input<Exclude<HellSize, 'xs' | 'xl'>>('md');
  /** Marks the control invalid for styling and `aria-invalid`. */
  readonly invalid = input(false, { alias: 'invalid', transform: booleanAttribute });
}

/**
 * Styled resizable `<textarea>` built on `NgpTextarea`. Opt into content-based
 * height growth with `autoGrow`; bound it in CSS via `min-block-size` (minimum —
 * `rows` is not a floor under `field-sizing: content`) plus `max-block-size` and
 * `overflow-y: auto` (maximum).
 */
@Directive({
  selector: 'textarea[hellTextarea]',
  hostDirectives: [{ directive: NgpTextarea, inputs: ['disabled', 'id'] }],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-size]': 'size()',
    '[attr.data-auto-grow]': "autoGrow() ? '' : null",
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
  },
})
export class HellTextarea {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TEXTAREA_RECIPE,
  });

  /** Control size; `sm`, `md`, or `lg`. */
  readonly size = input<Exclude<HellSize, 'xs' | 'xl'>>('md');
  /** Marks the control invalid for styling and `aria-invalid`. */
  readonly invalid = input(false, { alias: 'invalid', transform: booleanAttribute });
  /**
   * Grows the textarea with its content via CSS `field-sizing: content`, with no
   * JavaScript measurement. Reflected as `data-auto-grow` and disables the native
   * resize handle while active (the two affordances conflict). Cap the growth in
   * CSS (`max-block-size` + `overflow-y: auto`) so a long paste scrolls internally
   * instead of pushing the page. Degrades to a normal fixed-size textarea where
   * `field-sizing` is unsupported (no JavaScript polyfill).
   */
  readonly autoGrow = input(false, { alias: 'autoGrow', transform: booleanAttribute });
}
