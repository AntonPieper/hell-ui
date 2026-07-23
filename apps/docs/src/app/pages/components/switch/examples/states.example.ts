import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellSwitch } from '@hell-ui/angular/switch';

@Component({
  selector: 'app-switch-states-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSwitch],
  template: `
    <div class="inline-flex items-center gap-2">
      <button hellSwitch aria-label="Off"></button>
      <span>Off</span>
    </div>
    <div class="inline-flex items-center gap-2">
      <button hellSwitch [checked]="true" aria-label="On"></button>
      <span>On</span>
    </div>
    <div class="inline-flex items-center gap-2">
      <button hellSwitch disabled aria-label="Disabled, off"></button>
      <span>Disabled</span>
    </div>
    <div class="inline-flex items-center gap-2">
      <button hellSwitch [checked]="true" disabled aria-label="Disabled, on"></button>
      <span>Disabled, on</span>
    </div>
  `,
})
export class SwitchStatesExample {}
