import { Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { HELL_COMBOBOX_IMPORTS } from '@hell-ui/angular/combobox';
import type { HellPickValue } from '@hell-ui/angular/core';

/**
 * Combobox Pick Value Control Value Authority boundary coverage (#287): the
 * packed `[hellCombobox]` binds one `value` model across direct property
 * binding, two-way binding, Signal Forms `[formField]`, Reactive Forms
 * `[formControl]`, and Template-driven Forms `[(ngModel)]` in single mode,
 * plus a two-way multiple-mode combobox (readonly array), and every path
 * reports the same committed Pick Value at runtime.
 */
@Component({
  selector: 'app-combobox-forms',
  imports: [FormsModule, ReactiveFormsModule, FormField, ...HELL_COMBOBOX_IMPORTS],
  template: `
    <div hellCombobox [value]="propertyValue()" (valueChange)="propertyValue.set($any($event))">
      <input hellComboboxInput aria-label="Property assignee" />
      <button hellComboboxButton type="button" aria-label="Toggle property assignees"></button>
      <div *hellComboboxPortal hellComboboxDropdown>
        <div hellComboboxOption value="atlas">Atlas</div>
        <div hellComboboxOption value="nova">Nova</div>
      </div>
    </div>
    <div hellCombobox [(value)]="twoWayValue">
      <input hellComboboxInput aria-label="Two-way assignee" />
      <button hellComboboxButton type="button" aria-label="Toggle two-way assignees"></button>
      <div *hellComboboxPortal hellComboboxDropdown>
        <div hellComboboxOption value="atlas">Atlas</div>
        <div hellComboboxOption value="nova">Nova</div>
      </div>
    </div>
    <div hellCombobox [formField]="assigneeForm.assignee">
      <input hellComboboxInput aria-label="Signal Forms assignee" />
      <button hellComboboxButton type="button" aria-label="Toggle Signal Forms assignees"></button>
      <div *hellComboboxPortal hellComboboxDropdown>
        <div hellComboboxOption value="lyra">Lyra</div>
        <div hellComboboxOption value="nova">Nova</div>
      </div>
    </div>
    <div hellCombobox [formControl]="reactiveControl">
      <input hellComboboxInput aria-label="Reactive assignee" />
      <button hellComboboxButton type="button" aria-label="Toggle reactive assignees"></button>
      <div *hellComboboxPortal hellComboboxDropdown>
        <div hellComboboxOption value="atlas">Atlas</div>
        <div hellComboboxOption value="nova">Nova</div>
      </div>
    </div>
    <div hellCombobox [(ngModel)]="ngModelValue">
      <input hellComboboxInput aria-label="Template-driven assignee" />
      <button hellComboboxButton type="button" aria-label="Toggle template-driven assignees"></button>
      <div *hellComboboxPortal hellComboboxDropdown>
        <div hellComboboxOption value="atlas">Atlas</div>
        <div hellComboboxOption value="nova">Nova</div>
      </div>
    </div>
    <div hellCombobox multiple [(value)]="multipleValue">
      <input hellComboboxInput aria-label="Multiple assignees" />
      <button hellComboboxButton type="button" aria-label="Toggle multiple assignees"></button>
      <div *hellComboboxPortal hellComboboxDropdown>
        <div hellComboboxOption value="atlas">Atlas</div>
        <div hellComboboxOption value="nova">Nova</div>
      </div>
    </div>
    <p data-test-id="combobox-forms-status">{{ status() }}</p>
  `,
})
export class ComboboxForms {
  protected readonly propertyValue = signal<HellPickValue<string>>('atlas');
  protected readonly twoWayValue = signal<HellPickValue<string>>('nova');
  protected readonly formModel = signal<{ assignee: string | null }>({ assignee: 'lyra' });
  protected readonly assigneeForm = form(this.formModel);
  protected readonly reactiveControl = new FormControl<string | null>('nova');
  protected readonly ngModelValue = signal<string | null>('atlas');
  protected readonly multipleValue = signal<HellPickValue<string>>(['atlas', 'nova']);

  protected readonly status = computed(() => {
    const multiple = this.multipleValue();
    return (
      `Combobox forms ready ${this.propertyValue()}-${this.twoWayValue()}-` +
      `${this.assigneeForm.assignee().value()}-${this.reactiveControl.value}-` +
      `${this.ngModelValue()}-${Array.isArray(multiple) ? multiple.join('+') : multiple}`
    );
  });
}
