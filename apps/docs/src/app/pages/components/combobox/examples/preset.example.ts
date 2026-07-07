import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_COMBOBOX_BASIC_DIRECTIVES } from '@hell-ui/angular/combobox';

const WAREHOUSES = [
  'Berlin DC',
  'Frankfurt Hub',
  'Hamburg Port',
  'Leipzig Cross-dock',
  'Munich South',
  'Stuttgart Returns',
];

@Component({
  selector: 'app-combobox-preset-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_COMBOBOX_BASIC_DIRECTIVES],
  template: `
    <hell-combobox-basic
      class="block max-w-72"
      aria-label="Origin warehouse"
      placeholder="Select warehouse…"
      emptyLabel="No warehouse matches"
      allowDeselect
      [options]="warehouses"
      [value]="value()"
      (valueChange)="value.set($any($event))"
    />
  `,
})
export class ComboboxPresetExample {
  protected readonly warehouses = WAREHOUSES;
  protected readonly value = signal<string | null>(null);
}
