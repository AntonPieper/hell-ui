import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { HellSlider } from '@hell-ui/angular/slider';

@Component({
  selector: 'app-slider-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_DIRECTIVES, HellSlider],
  template: `
    <div hellField>
      <label hellFieldLabel for="volume-slider">Volume</label>
      <div class="flex items-center gap-4">
        <hell-slider
          id="volume-slider"
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
