import { Directive, input } from '@angular/core';
import { HellStyleable } from '@hell-ui/angular/core';
import { NgpFormField, NgpDescription, NgpError, NgpLabel } from 'ng-primitives/form-field';

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
    '[class.hell-field]': '!unstyled()',
    '[attr.data-orientation]': 'orientation()',
  },
})
export class HellField extends HellStyleable {
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
  host: { '[class.hell-field-label]': '!unstyled()' },
})
export class HellFieldLabel extends HellStyleable {}

@Directive({
  selector: '[hellFieldDescription]',
  hostDirectives: [NgpDescription],
  host: { '[class.hell-field-description]': '!unstyled()' },
})
export class HellFieldDescription extends HellStyleable {}

@Directive({
  selector: '[hellFieldError]',
  hostDirectives: [
    {
      directive: NgpError,
      inputs: ['id', 'ngpErrorValidator'],
    },
  ],
  host: { '[class.hell-field-error]': '!unstyled()' },
})
export class HellFieldError extends HellStyleable {}

export const HELL_FIELD_DIRECTIVES = [
  HellField,
  HellFieldLabel,
  HellFieldDescription,
  HellFieldError,
] as const;
