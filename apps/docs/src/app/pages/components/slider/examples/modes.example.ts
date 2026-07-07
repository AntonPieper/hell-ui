import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { HellSlider } from '@hell-ui/angular/slider';

@Component({
  selector: 'app-slider-modes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_DIRECTIVES, HellSlider],
  template: `
    <div hellField>
      <label hellFieldLabel id="hover-thumb-slider-label" for="hover-thumb-slider">
        Hover thumb
      </label>
      <hell-slider
        id="hover-thumb-slider"
        thumb="hover"
        [value]="seek()"
        (valueChange)="seek.set($event)"
      />
    </div>
    <div hellField>
      <label hellFieldLabel id="hover-grow-slider-label" for="hover-grow-slider">
        Hover thumb + grow on engage
      </label>
      <hell-slider
        id="hover-grow-slider"
        thumb="hover"
        grow
        [value]="seek()"
        (valueChange)="seek.set($event)"
      />
    </div>
  `,
})
export class SliderModesExample {
  protected readonly seek = signal(35);
}
