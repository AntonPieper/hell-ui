import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellRadio, HellRadioGroup, HellRadioIndicator } from 'hell-ui/radio';

@Component({
  selector: 'app-radio-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellRadioGroup, HellRadio, HellRadioIndicator],
  template: `
    <div
      hellRadioGroup
      aria-label="Digest frequency"
      [value]="frequency()"
      (valueChange)="frequency.set($event!)"
    >
      <button hellRadio value="daily" type="button" class="inline-flex items-center gap-2">
        <span ngpRadioIndicator></span> Daily
      </button>
      <button hellRadio value="weekly" type="button" class="inline-flex items-center gap-2">
        <span ngpRadioIndicator></span> Weekly
      </button>
      <button hellRadio value="never" type="button" class="inline-flex items-center gap-2">
        <span ngpRadioIndicator></span> Never
      </button>
    </div>

    <p>
      Selected: <code>{{ frequency() }}</code>
    </p>
  `,
})
export class RadioBasicExample {
  protected readonly frequency = signal<'daily' | 'weekly' | 'never'>('weekly');
}
