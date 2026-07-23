import { Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { HELL_SELECT_IMPORTS } from '@hell-ui/angular/select';
import type { HellPickValue } from '@hell-ui/angular/core';

/**
 * Select Pick Value Control Value Authority boundary coverage (#287): the
 * packed `[hellSelect]` binds one `value` model across direct property
 * binding, two-way binding, Signal Forms `[formField]`, Reactive Forms
 * `[formControl]`, and Template-driven Forms `[(ngModel)]` in single mode,
 * plus a two-way multiple-mode select (readonly array), and every path
 * reports the same committed Pick Value at runtime.
 */
@Component({
  selector: 'app-select-forms',
  imports: [FormsModule, ReactiveFormsModule, FormField, ...HELL_SELECT_IMPORTS],
  template: `
    <button
      hellSelect
      type="button"
      aria-label="Property priority"
      [value]="propertyValue()"
      (valueChange)="propertyValue.set($any($event))"
    >
      <span hellSelectValue>{{ propertyValue() ?? 'Pick priority' }}</span>
      <div *hellSelectPortal hellSelectDropdown>
        <div hellSelectOption value="low">Low</div>
        <div hellSelectOption value="high">High</div>
      </div>
    </button>
    <button hellSelect type="button" aria-label="Two-way priority" [(value)]="twoWayValue">
      <span hellSelectValue>{{ twoWayValue() ?? 'Pick priority' }}</span>
      <div *hellSelectPortal hellSelectDropdown>
        <div hellSelectOption value="low">Low</div>
        <div hellSelectOption value="high">High</div>
      </div>
    </button>
    <button
      hellSelect
      type="button"
      aria-label="Signal Forms priority"
      [formField]="priorityForm.priority"
    >
      <span hellSelectValue>{{ priorityForm.priority().value() ?? 'Pick priority' }}</span>
      <div *hellSelectPortal hellSelectDropdown>
        <div hellSelectOption value="medium">Medium</div>
        <div hellSelectOption value="high">High</div>
      </div>
    </button>
    <button
      hellSelect
      type="button"
      aria-label="Reactive priority"
      [formControl]="reactiveControl"
    >
      <span hellSelectValue>{{ reactiveControl.value ?? 'Pick priority' }}</span>
      <div *hellSelectPortal hellSelectDropdown>
        <div hellSelectOption value="low">Low</div>
        <div hellSelectOption value="high">High</div>
      </div>
    </button>
    <button
      hellSelect
      type="button"
      aria-label="Template-driven priority"
      [(ngModel)]="ngModelValue"
    >
      <span hellSelectValue>{{ ngModelValue() ?? 'Pick priority' }}</span>
      <div *hellSelectPortal hellSelectDropdown>
        <div hellSelectOption value="low">Low</div>
        <div hellSelectOption value="high">High</div>
      </div>
    </button>
    <button hellSelect multiple type="button" aria-label="Multiple priorities" [(value)]="multipleValue">
      <span hellSelectValue>Multiple priorities</span>
      <div *hellSelectPortal hellSelectDropdown>
        <div hellSelectOption value="low">Low</div>
        <div hellSelectOption value="high">High</div>
      </div>
    </button>
    <p data-test-id="select-forms-status">{{ status() }}</p>
  `,
})
export class SelectForms {
  protected readonly propertyValue = signal<HellPickValue<string>>('low');
  protected readonly twoWayValue = signal<HellPickValue<string>>('high');
  protected readonly formModel = signal<{ priority: string | null }>({ priority: 'medium' });
  protected readonly priorityForm = form(this.formModel);
  protected readonly reactiveControl = new FormControl<string | null>('high');
  protected readonly ngModelValue = signal<string | null>('low');
  protected readonly multipleValue = signal<HellPickValue<string>>(['low', 'high']);

  protected readonly status = computed(() => {
    const multiple = this.multipleValue();
    return (
      `Select forms ready ${this.propertyValue()}-${this.twoWayValue()}-` +
      `${this.priorityForm.priority().value()}-${this.reactiveControl.value}-` +
      `${this.ngModelValue()}-${Array.isArray(multiple) ? multiple.join('+') : multiple}`
    );
  });
}
