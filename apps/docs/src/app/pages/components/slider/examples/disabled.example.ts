import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';
import { HellSlider } from '@hell-ui/angular/slider';

@Component({
  selector: 'app-slider-disabled-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_IMPORTS, HellSlider],
  template: `
    <div hellField>
      <label hellFieldLabel id="disabled-volume-slider-label" for="disabled-volume-slider">
        Disabled volume
      </label>
      <hell-slider id="disabled-volume-slider" [value]="50" disabled />
    </div>
  `,
})
export class SliderDisabledExample {}
