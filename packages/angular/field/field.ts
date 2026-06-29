import { Directive, inject, input } from '@angular/core';
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';
import { NgpFormField, NgpDescription, NgpError, NgpLabel } from 'ng-primitives/form-field';

export type HellFieldPart = 'root';
export type HellFieldUi = HellUi<HellFieldPart>;

export type HellFieldLabelPart = 'root';
export type HellFieldLabelUi = HellUi<HellFieldLabelPart>;

export type HellFieldDescriptionPart = 'root';
export type HellFieldDescriptionUi = HellUi<HellFieldDescriptionPart>;

export type HellFieldErrorPart = 'root';
export type HellFieldErrorUi = HellUi<HellFieldErrorPart>;

const HELL_FIELD_RECIPE = {
  root: 'flex min-w-0 flex-col gap-hell-2 data-[orientation=horizontal]:flex-row data-[orientation=horizontal]:flex-wrap data-[orientation=horizontal]:items-center data-[orientation=horizontal]:gap-hell-3',
} satisfies HellRecipe<HellFieldPart>;

const HELL_FIELD_LABEL_RECIPE = {
  root: 'inline-flex items-center gap-hell-2 text-xs font-semibold tracking-normal text-hell-foreground',
} satisfies HellRecipe<HellFieldLabelPart>;

const HELL_FIELD_DESCRIPTION_RECIPE = {
  root: 'text-xs text-hell-foreground-muted data-[orientation=horizontal]:basis-full',
} satisfies HellRecipe<HellFieldDescriptionPart>;

const HELL_FIELD_ERROR_RECIPE = {
  root: 'text-xs text-hell-danger data-[orientation=horizontal]:basis-full',
} satisfies HellRecipe<HellFieldErrorPart>;

/**
 * `hell-field` — a form field shell that wires label, description and error
 * elements to the control inside it via the form-field primitive.
 *
 * Usage:
 *   <div hellField>
 *     <label hellFieldLabel>Email</label>
 *     <input hellInput type="email" />
 *     <div hellFieldDescription>We never share this.</div>
 *     <div hellFieldError>Required.</div>
 *   </div>
 */
@Directive({
  selector: '[hellField]',
  hostDirectives: [NgpFormField],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-orientation]': 'orientation()',
  },
})
export class HellField extends HellPartStyleable<HellFieldPart> {
  protected readonly recipe = HELL_FIELD_RECIPE;
  protected readonly defaultUiPart = 'root';

  /**
   * Layout direction. `vertical` (default) stacks label / control /
   * description / error. `horizontal` lays them out in a row — handy for
   * checkbox + label or switch + label patterns.
   */
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');
}

@Directive({
  selector: 'label[hellFieldLabel]',
  hostDirectives: [NgpLabel],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellFieldLabel extends HellPartStyleable<HellFieldLabelPart> {
  protected readonly recipe = HELL_FIELD_LABEL_RECIPE;
  protected readonly defaultUiPart = 'root';
}

@Directive({
  selector: '[hellFieldDescription]',
  hostDirectives: [NgpDescription],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-orientation]': 'field?.orientation() ?? null',
  },
})
export class HellFieldDescription extends HellPartStyleable<HellFieldDescriptionPart> {
  protected readonly recipe = HELL_FIELD_DESCRIPTION_RECIPE;
  protected readonly defaultUiPart = 'root';
  protected readonly field = inject(HellField, { optional: true });
}

@Directive({
  selector: '[hellFieldError]',
  hostDirectives: [
    {
      directive: NgpError,
      inputs: ['id', 'ngpErrorValidator'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-orientation]': 'field?.orientation() ?? null',
  },
})
export class HellFieldError extends HellPartStyleable<HellFieldErrorPart> {
  protected readonly recipe = HELL_FIELD_ERROR_RECIPE;
  protected readonly defaultUiPart = 'root';
  protected readonly field = inject(HellField, { optional: true });
}

export const HELL_FIELD_DIRECTIVES = [
  HellField,
  HellFieldLabel,
  HellFieldDescription,
  HellFieldError,
] as const;
