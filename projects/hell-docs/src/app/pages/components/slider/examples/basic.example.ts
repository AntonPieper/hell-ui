import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_FIELD_DIRECTIVES, HellSlider } from 'hell';

@Component({
  selector: 'app-slider-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_DIRECTIVES, HellSlider],
  template: `
    <div hellField>
      <label hellFieldLabel>Volume</label>
      <div class="flex items-center gap-4">
        <hell-slider
          [value]="vol()"
          (valueChange)="vol.set($event)"
          [min]="0"
          [max]="100"
          [step]="1"
          aria-label="Volume"
        />
        <code class="w-12 text-end">{{ vol() }}%</code>
      </div>
    </div>
  `,
})
export class SliderBasicExample {
  protected readonly vol = signal(50);
  protected readonly seek = signal(35);
}
