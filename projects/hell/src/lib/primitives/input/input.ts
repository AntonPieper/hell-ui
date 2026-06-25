import { Directive, ElementRef, booleanAttribute, inject, input } from '@angular/core';
import { NgpInput } from 'ng-primitives/input';
import { NgpTextarea } from 'ng-primitives/textarea';
import { HellPartStyleable, type HellRecipe, type HellUi } from '../../core/styleable';
import { HellSize } from '../../core/types';

export type HellInputPart = 'root';
export type HellInputUi = HellUi<HellInputPart>;

export type HellNativeSelectPart = 'root';
export type HellNativeSelectUi = HellUi<HellNativeSelectPart>;

export type HellTextareaPart = 'root';
export type HellTextareaUi = HellUi<HellTextareaPart>;

const HELL_FORM_CONTROL_STATE_CLASSES =
  'outline-none transition-[border-color,box-shadow] duration-[var(--hell-duration-fast)] ease-hell-out data-hover:border-hell-border-strong data-focus:border-hell-border-focus data-focus:shadow-[0_0_0_3px_var(--color-hell-focus-ring)] focus:border-hell-border-focus focus:shadow-[0_0_0_3px_var(--color-hell-focus-ring)] disabled:cursor-not-allowed disabled:border-hell-border disabled:bg-hell-surface-subtle disabled:text-hell-foreground-muted data-disabled:cursor-not-allowed data-disabled:border-hell-border data-disabled:bg-hell-surface-subtle data-disabled:text-hell-foreground-muted aria-invalid:!border-hell-danger invalid:!border-hell-danger';

const HELL_TEXT_CONTROL_PLACEHOLDER_CLASSES =
  'placeholder:text-hell-foreground-subtle disabled:placeholder:text-hell-foreground-subtle disabled:placeholder:opacity-70 data-disabled:placeholder:text-hell-foreground-subtle data-disabled:placeholder:opacity-70';

const HELL_INPUT_RECIPE = {
  root: `inline-flex h-hell-control-md w-full rounded-hell-md border border-hell-border bg-hell-surface-elevated px-hell-4 font-[inherit] text-[13px] text-hell-foreground ${HELL_FORM_CONTROL_STATE_CLASSES} ${HELL_TEXT_CONTROL_PLACEHOLDER_CLASSES} data-[size=sm]:h-hell-control-sm data-[size=sm]:px-hell-3 data-[size=sm]:text-xs data-[size=lg]:h-hell-control-lg data-[size=lg]:px-hell-5 data-[size=lg]:text-sm`,
} satisfies HellRecipe<HellInputPart>;

const HELL_NATIVE_SELECT_RECIPE = {
  root: `inline-flex h-hell-control-md w-full appearance-none rounded-hell-md border border-hell-border bg-hell-surface-elevated bg-[image:linear-gradient(45deg,transparent_50%,var(--color-hell-foreground-muted)_50%),linear-gradient(135deg,var(--color-hell-foreground-muted)_50%,transparent_50%)] bg-[length:4px_4px] bg-[position:calc(100%_-_12px)_50%,calc(100%_-_8px)_50%] bg-no-repeat ps-hell-4 pe-[calc(var(--spacing-hell-4)+1rem)] font-[inherit] text-[13px] text-hell-foreground ${HELL_FORM_CONTROL_STATE_CLASSES} data-[size=sm]:h-hell-control-sm data-[size=sm]:ps-hell-3 data-[size=sm]:pe-[calc(var(--spacing-hell-3)+1rem)] data-[size=sm]:text-xs data-[size=lg]:h-hell-control-lg data-[size=lg]:ps-hell-5 data-[size=lg]:pe-[calc(var(--spacing-hell-5)+1rem)] data-[size=lg]:text-sm`,
} satisfies HellRecipe<HellNativeSelectPart>;

const HELL_TEXTAREA_RECIPE = {
  root: `block min-h-[calc(var(--spacing-hell-control-md)*2)] w-full resize-y rounded-hell-md border border-hell-border bg-hell-surface-elevated px-hell-4 py-hell-3 font-[inherit] text-[13px] leading-normal text-hell-foreground ${HELL_FORM_CONTROL_STATE_CLASSES} ${HELL_TEXT_CONTROL_PLACEHOLDER_CLASSES} data-[size=sm]:min-h-[calc(var(--spacing-hell-control-sm)*2)] data-[size=sm]:px-hell-3 data-[size=sm]:py-hell-2 data-[size=sm]:text-xs data-[size=lg]:min-h-[calc(var(--spacing-hell-control-lg)*2)] data-[size=lg]:px-hell-5 data-[size=lg]:py-hell-4 data-[size=lg]:text-sm`,
} satisfies HellRecipe<HellTextareaPart>;

function hellInitialDataSlot(): string {
  return (
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.getAttribute('data-slot') ?? 'root'
  );
}

@Directive({
  selector: 'input[hellInput]',
  hostDirectives: [{ directive: NgpInput, inputs: ['disabled', 'id'] }],
  host: {
    '[class]': "part('root')",
    '[attr.data-slot]': 'slot',
    '[attr.data-size]': 'size()',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
  },
})
export class HellInput extends HellPartStyleable<HellInputPart> {
  protected readonly recipe = HELL_INPUT_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly size = input<Exclude<HellSize, 'xs' | 'xl'>>('md');
  readonly invalid = input(false, { alias: 'invalid', transform: booleanAttribute });
  protected readonly slot = hellInitialDataSlot();
}

@Directive({
  selector: 'select[hellNativeSelect]',
  hostDirectives: [{ directive: NgpInput, inputs: ['disabled', 'id'] }],
  host: {
    '[class]': "part('root')",
    '[attr.data-slot]': 'slot',
    '[attr.data-size]': 'size()',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
  },
})
export class HellNativeSelect extends HellPartStyleable<HellNativeSelectPart> {
  protected readonly recipe = HELL_NATIVE_SELECT_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly size = input<Exclude<HellSize, 'xs' | 'xl'>>('md');
  readonly invalid = input(false, { alias: 'invalid', transform: booleanAttribute });
  protected readonly slot = hellInitialDataSlot();
}

@Directive({
  selector: 'textarea[hellTextarea]',
  hostDirectives: [{ directive: NgpTextarea, inputs: ['disabled', 'id'] }],
  host: {
    '[class]': "part('root')",
    '[attr.data-slot]': 'slot',
    '[attr.data-size]': 'size()',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
  },
})
export class HellTextarea extends HellPartStyleable<HellTextareaPart> {
  protected readonly recipe = HELL_TEXTAREA_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly size = input<Exclude<HellSize, 'xs' | 'xl'>>('md');
  readonly invalid = input(false, { alias: 'invalid', transform: booleanAttribute });
  protected readonly slot = hellInitialDataSlot();
}
