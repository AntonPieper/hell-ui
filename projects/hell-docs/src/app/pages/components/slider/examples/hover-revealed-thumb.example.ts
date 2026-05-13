import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_FIELD_DIRECTIVES, HellSlider } from '@hell-ui/angular/primitives';

@Component({
  selector: 'app-slider-hover-revealed-thumb-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_DIRECTIVES, HellSlider],
  template: `
    <div hellField>
      <label hellFieldLabel for="hover-thumb-slider">Hover thumb</label>
      <hell-slider id="hover-thumb-slider" thumb="hover" aria-label="Hover thumb" [value]="seek()" (valueChange)="seek.set($event)" />
    </div>
    <div hellField>
      <label hellFieldLabel for="hover-grow-slider">Hover thumb + grow on engage</label>
      <hell-slider id="hover-grow-slider" thumb="hover" grow aria-label="Hover thumb with grow" [value]="seek()" (valueChange)="seek.set($event)" />
    </div>
  `,
})
export class SliderHoverRevealedThumbExample {
  protected readonly vol = signal(50);
  protected readonly seek = signal(35);
}
