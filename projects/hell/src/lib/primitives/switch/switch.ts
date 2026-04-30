import { Component, ChangeDetectionStrategy, booleanAttribute, input } from '@angular/core';
import { NgpSwitch, NgpSwitchThumb } from 'ng-primitives/switch';
import { HellStyleable } from '../../core/styleable';

/**
 * Styled switch built on `NgpSwitch`. Use for binary on/off settings where the
 * action is applied immediately (vs. checkbox which is committed on submit).
 *
 * The host is a real `<button>` so it is natively labelable — wrap it in a
 * `<label>` (or use it inside `hellField`) and label clicks toggle the
 * switch without any combination-aware wiring on our side.
 */
@Component({
  selector: 'button[hellSwitch]',
  imports: [NgpSwitchThumb],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: NgpSwitch,
      inputs: ['ngpSwitchChecked:checked', 'ngpSwitchDisabled:disabled'],
      outputs: ['ngpSwitchCheckedChange:checkedChange'],
    },
  ],
  host: {
    type: 'button',
    '[class.hell-switch]': '!unstyled()',
  },
  template: `<span ngpSwitchThumb class="hell-switch-thumb"></span>`,
})
export class HellSwitch extends HellStyleable {}
