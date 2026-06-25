import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_SELECT_BASIC_DIRECTIVES } from '@hell-ui/angular/select';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

@Component({
  selector: 'app-select-basic-preset-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_SELECT_BASIC_DIRECTIVES],
  template: `
    <div class="grid max-w-60 gap-1">
      <span id="priority-select-label" class="text-sm font-medium">Priority</span>
      <p id="priority-select-description" class="m-0 text-sm text-hell-foreground-muted">
        Used to sort incoming work.
      </p>
      <hell-select-basic
        [aria-labelledby]="'priority-select-label'"
        [aria-describedby]="'priority-select-description'"
        [options]="options"
        [value]="value()"
        placeholder="Pick priority"
        (valueChange)="value.set($event === null ? null : $any($event))"
      />
    </div>
  `,
})
export class SelectBasicPresetExample {
  protected readonly options = PRIORITIES;
  protected readonly value = signal<string | null>(null);
}
