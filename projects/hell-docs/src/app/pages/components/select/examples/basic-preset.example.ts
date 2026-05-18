import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_SELECT_BASIC_DIRECTIVES } from '@hell-ui/angular/select';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

@Component({
  selector: 'app-select-basic-preset-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_SELECT_BASIC_DIRECTIVES],
  template: `
    <hell-select-basic
      [options]="options"
      [value]="value()"
      placeholder="Pick priority"
      (valueChange)="value.set($event === null ? null : $any($event))"
    />
  `,
})
export class SelectBasicPresetExample {
  protected readonly options = PRIORITIES;
  protected readonly value = signal<string | null>(null);
}
