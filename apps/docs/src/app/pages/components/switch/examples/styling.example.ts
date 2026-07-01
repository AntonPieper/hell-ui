import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellSwitch } from '@hell-ui/angular/switch';

@Component({
  selector: 'app-switch-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSwitch],
  template: `
    <div class="inline-flex items-center gap-3">
      <!-- State-aware ui shorthand on the root part. -->
      <button hellSwitch checked aria-label="Success switch" ui="data-checked:bg-hell-success"></button>
      <span>Success tint</span>
    </div>
    <div class="inline-flex items-center gap-3">
      <!-- Multi-part map: HellSwitchPart is 'root' | 'thumb'. -->
      <button
        hellSwitch
        checked
        aria-label="Square switch"
        [ui]="{ root: 'rounded-hell-sm', thumb: 'rounded-hell-sm' }"
      ></button>
      <span>Square track and thumb</span>
    </div>
  `,
})
export class SwitchStylingExample {}
