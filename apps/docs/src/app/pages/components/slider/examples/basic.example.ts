import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_FIELD_IMPORTS } from 'hell-ui/field';
import { HellSlider } from 'hell-ui/slider';

@Component({
  selector: 'app-slider-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_IMPORTS, HellSlider],
  template: `
    <div hellField>
      <label hellFieldLabel id="volume-slider-label" for="volume-slider">Volume</label>
      <div class="flex items-center gap-4">
        <hell-slider
          id="volume-slider"
          [value]="volume()"
          (valueChange)="volume.set($event)"
          [min]="0"
          [max]="100"
          [step]="1"
        />
        <code class="w-12 text-end">{{ volume() }}%</code>
      </div>
    </div>
  `,
})
export class SliderBasicExample {
  protected readonly volume = signal(50);
}
