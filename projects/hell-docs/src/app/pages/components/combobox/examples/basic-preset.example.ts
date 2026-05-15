import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_COMBOBOX_BASIC_DIRECTIVES } from '@hell-ui/angular/primitives';

const FRUITS = ['Apple', 'Banana', 'Orange', 'Peach', 'Pear', 'Plum', 'Watermelon'];

@Component({
  selector: 'app-combobox-basic-preset-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_COMBOBOX_BASIC_DIRECTIVES],
  template: `
    <hell-combobox-basic
      [options]="options"
      [value]="value()"
      placeholder="Pick fruit"
      (valueChange)="value.set($event === null ? null : $any($event))"
    />
  `,
})
export class ComboboxBasicPresetExample {
  protected readonly options = FRUITS;
  protected readonly value = signal<string | null>(null);
}
