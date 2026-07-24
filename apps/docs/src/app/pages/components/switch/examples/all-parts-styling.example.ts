import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellNativeSwitch, HellSwitch, type HellSwitchUi } from 'hell-ui/switch';

@Component({
  selector: 'app-switch-all-parts-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSwitch, HellNativeSwitch],
  template: `
    <div class="flex items-center gap-2">
      <!-- HellSwitch: root + thumb, both refined through one ui map. -->
      <button hellSwitch [checked]="true" aria-label="Custom switch" [ui]="switchUi"></button>
      <span>Styled switch (root + thumb)</span>
    </div>
    <div class="flex items-center gap-2">
      <!-- HellNativeSwitch: single 'root' part, string shorthand refines it. -->
      <input
        type="checkbox"
        hellNativeSwitch
        checked
        aria-label="Custom native switch"
        ui="w-[44px] rounded-hell-sm checked:bg-hell-success"
      />
      <span>Styled native switch (root)</span>
    </div>
  `,
})
export class SwitchAllPartsStylingExample {
  protected readonly switchUi: HellSwitchUi = {
    root: 'w-[44px] rounded-hell-sm data-checked:bg-hell-success',
    thumb: 'rounded-hell-sm',
  };
}
