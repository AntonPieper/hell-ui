import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellRadio, HellRadioGroup, HellRadioIndicator } from '@hell-ui/angular/radio';

@Component({
  selector: 'app-radio-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellRadioGroup, HellRadio, HellRadioIndicator],
  template: `
    <div
      hellRadioGroup
      aria-label="Alert channel"
      orientation="vertical"
      [value]="channel()"
      (valueChange)="channel.set($event!)"
    >
      <!-- State-aware ui: refine the checked state without new CSS. -->
      <button
        hellRadio
        value="email"
        type="button"
        class="inline-flex items-center gap-2"
        ui="data-checked:text-hell-success"
      >
        <span ngpRadioIndicator></span> Email
      </button>
      <button
        hellRadio
        value="sms"
        type="button"
        class="inline-flex items-center gap-2"
        [ui]="{ root: 'data-checked:text-hell-success' }"
      >
        <span ngpRadioIndicator></span> SMS
      </button>
    </div>
  `,
})
export class RadioStylingExample {
  protected readonly channel = signal('email');
}
