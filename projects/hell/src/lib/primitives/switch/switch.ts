import { Component, ChangeDetectionStrategy, booleanAttribute, input } from '@angular/core';
import { NgpSwitch, NgpSwitchThumb } from 'ng-primitives/switch';

/**
 * Styled switch built on `NgpSwitch`. Use for binary on/off settings where the
 * action is applied immediately (vs. checkbox which is committed on submit).
 */
@Component({
  selector: 'hell-switch',
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
    '[class.hell-switch]': '!unstyled()',
  },
  template: `<span ngpSwitchThumb class="hell-switch-thumb"></span>`,
})
export class HellSwitch {
  readonly unstyled = input(false, { transform: booleanAttribute });
}
