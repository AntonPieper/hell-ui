import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_FIELD_DIRECTIVES, HellSlider } from 'hell';

@Component({
  selector: 'app-slider-hover-revealed-thumb-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_DIRECTIVES, HellSlider],
  template: `
    <div hellField>
      <label hellFieldLabel>Hover thumb</label>
      <hell-slider thumb="hover" [value]="seek()" (valueChange)="seek.set($event)" />
    </div>
    <div hellField>
      <label hellFieldLabel>Hover thumb + grow on engage</label>
      <hell-slider thumb="hover" grow [value]="seek()" (valueChange)="seek.set($event)" />
    </div>
  `,
})
export class SliderHoverRevealedThumbExample {
  protected readonly vol = signal(50);
  protected readonly seek = signal(35);
}
