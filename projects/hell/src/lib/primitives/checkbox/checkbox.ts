import { Component, ChangeDetectionStrategy, booleanAttribute, input } from '@angular/core';
import { NgpCheckbox, injectCheckboxState } from 'ng-primitives/checkbox';

/**
 * Styled checkbox built on `NgpCheckbox`. Forwards `checked`, `indeterminate`,
 * `disabled` and `required` to the host directive and emits `checkedChange`.
 * Renders a checkmark / dash glyph based on the primitive state.
 */
@Component({
  selector: 'hell-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: NgpCheckbox,
      inputs: [
        'ngpCheckboxChecked:checked',
        'ngpCheckboxIndeterminate:indeterminate',
        'ngpCheckboxDisabled:disabled',
        'ngpCheckboxRequired:required',
      ],
      outputs: [
        'ngpCheckboxCheckedChange:checkedChange',
        'ngpCheckboxIndeterminateChange:indeterminateChange',
      ],
    },
  ],
  host: {
    '[class.hell-checkbox]': '!unstyled()',
  },
  template: `
    @if (state().indeterminate()) {
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
        <path d="M3 8h10" />
      </svg>
    } @else if (state().checked()) {
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
        <path d="M3 8l3.2 3.2L13 4.5" />
      </svg>
    }
  `,
})
export class HellCheckbox {
  readonly unstyled = input(false, { transform: booleanAttribute });
  protected readonly state = injectCheckboxState();
}
