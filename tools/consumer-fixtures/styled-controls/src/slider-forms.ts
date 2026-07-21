import { Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { HellSlider } from '@hell-ui/angular/slider';

/**
 * Slider Control Value Authority boundary coverage (#277): the packed
 * `hell-slider` binds one `value` model across direct property binding,
 * two-way binding, Signal Forms `[formField]`, Reactive Forms
 * `[formControl]`, and Template-driven Forms `[(ngModel)]`, and every path
 * reports the same committed scalar at runtime.
 */
@Component({
  selector: 'app-slider-forms',
  imports: [FormsModule, ReactiveFormsModule, FormField, HellSlider],
  template: `
    <hell-slider
      aria-label="Property volume"
      [value]="propertyValue()"
      (valueChange)="propertyValue.set($event)"
    />
    <hell-slider aria-label="Two-way volume" [(value)]="twoWayValue" />
    <hell-slider aria-label="Signal Forms volume" [formField]="volumeForm.volume" />
    <hell-slider aria-label="Reactive volume" [formControl]="reactiveControl" />
    <hell-slider aria-label="Template-driven volume" [(ngModel)]="ngModelValue" />
    <p data-test-id="slider-forms-status">{{ status() }}</p>
  `,
})
export class SliderForms {
  protected readonly propertyValue = signal(10);
  protected readonly twoWayValue = signal(20);
  protected readonly formModel = signal({ volume: 30 });
  protected readonly volumeForm = form(this.formModel);
  protected readonly reactiveControl = new FormControl(40, { nonNullable: true });
  protected readonly ngModelValue = signal(50);

  protected readonly status = computed(
    () =>
      `Slider forms ready ${this.propertyValue()}-${this.twoWayValue()}-` +
      `${this.volumeForm.volume().value()}-${this.reactiveControl.value}-${this.ngModelValue()}`,
  );
}
