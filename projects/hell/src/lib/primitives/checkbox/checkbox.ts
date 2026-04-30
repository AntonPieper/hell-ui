import { Component, ChangeDetectionStrategy, booleanAttribute, input } from '@angular/core';
import { NgpCheckbox, injectCheckboxState } from 'ng-primitives/checkbox';
import { HellStyleable } from '../../core/styleable';

/**
 * Styled checkbox built on `NgpCheckbox`. Forwards `checked`, `indeterminate`,
 * `disabled` and `required` to the host directive and emits `checkedChange`.
 *
 * The host is a real `<button>` — a natively labelable element — so wrapping
 * it in a `<label>` (directly, or via any `<label for>` mechanism such as
 * `hellField`) makes label clicks toggle the checkbox with zero wiring on
 * our side.
 */
@Component({
  selector: 'button[hellCheckbox]',
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
    type: 'button',
    '[class.hell-checkbox]': '!unstyled()',
  },
  template: `
    @if (state().indeterminate()) {
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        aria-hidden="true"
      >
        <path d="M3 8h10" />
      </svg>
    } @else if (state().checked()) {
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        aria-hidden="true"
      >
        <path d="M3 8l3.2 3.2L13 4.5" />
      </svg>
    }
  `,
})
export class HellCheckbox extends HellStyleable {
  protected readonly state = injectCheckboxState();
}
