import { Directive, booleanAttribute, input } from '@angular/core';
import {
  NgpFormField,
  NgpDescription,
  NgpError,
  NgpLabel,
} from 'ng-primitives/form-field';

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
export class HellField {
  readonly unstyled = input(false, { transform: booleanAttribute });
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
export class HellFieldLabel {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellFieldDescription]',
  hostDirectives: [NgpDescription],
  host: { '[class.hell-field-description]': '!unstyled()' },
})
export class HellFieldDescription {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellFieldError]',
  hostDirectives: [NgpError],
  host: { '[class.hell-field-error]': '!unstyled()' },
})
export class HellFieldError {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

export const HELL_FIELD_DIRECTIVES = [
  HellField,
  HellFieldLabel,
  HellFieldDescription,
  HellFieldError,
] as const;
