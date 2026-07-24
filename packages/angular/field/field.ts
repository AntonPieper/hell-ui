import { Directive, inject, input } from '@angular/core';
import { hellPartStyler, type HellRecipe, type HellUiInput } from 'hell-ui/core';
import { NgpFormField, NgpDescription, NgpError, NgpLabel } from 'ng-primitives/form-field';

const HELL_FIELD_RECIPE = {
  root: 'flex min-w-0 flex-col gap-hell-2 data-[orientation=horizontal]:flex-row data-[orientation=horizontal]:flex-wrap data-[orientation=horizontal]:items-center data-[orientation=horizontal]:gap-hell-3',
} satisfies HellRecipe<'root'>;

const HELL_FIELD_LABEL_RECIPE = {
  root: 'inline-flex items-center gap-hell-2 text-[13px] font-semibold tracking-normal text-hell-foreground',
} satisfies HellRecipe<'root'>;

const HELL_FIELD_DESCRIPTION_RECIPE = {
  root: 'text-[13px] leading-normal text-hell-foreground-muted data-[orientation=horizontal]:basis-full',
} satisfies HellRecipe<'root'>;

const HELL_FIELD_ERROR_RECIPE = {
  root: 'text-[13px] leading-normal text-hell-danger data-[orientation=horizontal]:basis-full',
} satisfies HellRecipe<'root'>;

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
export class HellField {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_FIELD_RECIPE,
  });

  /**
   * Layout direction. `vertical` (default) stacks label / control /
   * description / error. `horizontal` lays them out in a row — handy for
   * checkbox + label or switch + label patterns.
   */
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');
}

/** Label element associated with the field's control. */
@Directive({
  selector: 'label[hellFieldLabel]',
  hostDirectives: [NgpLabel],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellFieldLabel {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_FIELD_LABEL_RECIPE,
  });
}

/** Helper text describing the field's control, wired to it for accessibility. */
@Directive({
  selector: '[hellFieldDescription]',
  hostDirectives: [NgpDescription],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-orientation]': 'field?.orientation() ?? null',
  },
})
export class HellFieldDescription {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_FIELD_DESCRIPTION_RECIPE,
  });
  /** Enclosing `HellField`, used to mirror its orientation. */
  protected readonly field = inject(HellField, { optional: true });
}

/** Validation error message for the field's control, shown when validation fails. */
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
export class HellFieldError {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_FIELD_ERROR_RECIPE,
  });
  /** Enclosing `HellField`, used to mirror its orientation. */
  protected readonly field = inject(HellField, { optional: true });
}

/** All directives that make up the field entry point, for bulk `imports`. */
export const HELL_FIELD_IMPORTS = [
  HellField,
  HellFieldLabel,
  HellFieldDescription,
  HellFieldError,
] as const;
