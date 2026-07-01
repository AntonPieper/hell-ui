import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_COMBOBOX_BASIC_DIRECTIVES } from '@hell-ui/angular/combobox';

const ASSIGNEES = ['Ada Lovelace', 'Grace Hopper', 'Katherine Johnson', 'Margaret Hamilton'];

@Component({
  selector: 'app-combobox-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_COMBOBOX_BASIC_DIRECTIVES],
  template: `
    <!-- HellComboboxBasicPart: root | control | input | button | dropdown | option | empty. -->
    <hell-combobox-basic
      class="max-w-72"
      aria-label="Assignee"
      placeholder="Assign to…"
      [options]="options"
      [value]="value()"
      [ui]="{
        control: 'border-hell-primary',
        dropdown: 'border-hell-primary',
        option: 'data-active:bg-hell-primary-soft',
        empty: 'text-hell-danger',
      }"
      (valueChange)="value.set($event === null ? null : $any($event))"
    />
  `,
})
export class ComboboxStylingExample {
  protected readonly options = ASSIGNEES;
  protected readonly value = signal<string | null>(null);
}
