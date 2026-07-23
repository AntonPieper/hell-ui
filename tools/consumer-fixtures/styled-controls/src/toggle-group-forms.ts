import { Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import {
  HellToggleGroup,
  HellToggleGroupItem,
  type HellToggleGroupValue,
} from '@hell-ui/angular/toggle';

/**
 * Toggle Group Control Value Authority boundary coverage (#289): the packed
 * `[hellToggleGroup]` binds one mode-typed `value` model across direct
 * property binding, two-way binding, Signal Forms `[formField]`, Reactive
 * Forms `[formControl]`, and Template-driven Forms `[(ngModel)]` in `single`
 * mode (`string | null`), plus a two-way `multiple` group (readonly string
 * array), and every path reports the same committed value at runtime.
 */
@Component({
  selector: 'app-toggle-group-forms',
  imports: [FormsModule, ReactiveFormsModule, FormField, HellToggleGroup, HellToggleGroupItem],
  template: `
    <div
      hellToggleGroup
      type="single"
      aria-label="Property align"
      [value]="propertyValue()"
      (valueChange)="propertyValue.set($event)"
    >
      <button hellToggleGroupItem value="left" type="button">Left</button>
      <button hellToggleGroupItem value="right" type="button">Right</button>
    </div>
    <div hellToggleGroup type="single" aria-label="Two-way align" [(value)]="twoWayValue">
      <button hellToggleGroupItem value="left" type="button">Left</button>
      <button hellToggleGroupItem value="right" type="button">Right</button>
    </div>
    <div
      hellToggleGroup
      type="single"
      aria-label="Signal Forms align"
      [formField]="alignForm.align"
    >
      <button hellToggleGroupItem value="left" type="button">Left</button>
      <button hellToggleGroupItem value="right" type="button">Right</button>
    </div>
    <div hellToggleGroup type="single" aria-label="Reactive align" [formControl]="reactiveControl">
      <button hellToggleGroupItem value="left" type="button">Left</button>
      <button hellToggleGroupItem value="right" type="button">Right</button>
    </div>
    <div hellToggleGroup type="single" aria-label="Template-driven align" [(ngModel)]="ngModelValue">
      <button hellToggleGroupItem value="left" type="button">Left</button>
      <button hellToggleGroupItem value="right" type="button">Right</button>
    </div>
    <div hellToggleGroup type="multiple" aria-label="Two-way formatting" [(value)]="multipleValue">
      <button hellToggleGroupItem value="bold" type="button">Bold</button>
      <button hellToggleGroupItem value="italic" type="button">Italic</button>
    </div>
    <p data-test-id="toggle-group-forms-status">{{ status() }}</p>
  `,
})
export class ToggleGroupForms {
  protected readonly propertyValue = signal<HellToggleGroupValue>('left');
  protected readonly twoWayValue = signal<HellToggleGroupValue>('right');
  protected readonly formModel = signal<{ align: string | null }>({ align: 'left' });
  protected readonly alignForm = form(this.formModel);
  protected readonly reactiveControl = new FormControl<string | null>('right');
  protected readonly ngModelValue = signal<HellToggleGroupValue>('left');
  protected readonly multipleValue = signal<HellToggleGroupValue>(['bold', 'italic']);

  protected readonly status = computed(() => {
    const multiple = this.multipleValue();
    return (
      `Toggle group forms ready ${this.propertyValue()}-${this.twoWayValue()}-` +
      `${this.alignForm.align().value()}-${this.reactiveControl.value}-${this.ngModelValue()}-` +
      `${Array.isArray(multiple) ? multiple.join('+') : multiple}`
    );
  });
}
