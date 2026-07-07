import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_SELECT_DIRECTIVES } from '@hell-ui/angular/select';

const PRIORITIES = ['Lowest', 'Low', 'Medium', 'High', 'Highest'];

@Component({
  selector: 'app-select-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_SELECT_DIRECTIVES],
  template: `
    <button
      hellSelect
      type="button"
      aria-label="Priority"
      class="max-w-60"
      [value]="value()"
      (valueChange)="value.set($any($event))"
    >
      @if (value(); as current) {
        <span hellSelectValue>{{ current }}</span>
      } @else {
        <span hellSelectPlaceholder>Select priority…</span>
      }
      <ng-template hellSelectPortal>
        <div hellSelectDropdown>
          @for (priority of priorities; track priority) {
            <div hellSelectOption [value]="priority" [disabled]="priority === 'Medium'">
              {{ priority }}
            </div>
          }
        </div>
      </ng-template>
    </button>
  `,
})
export class SelectBasicExample {
  protected readonly priorities = PRIORITIES;
  protected readonly value = signal<string | null>(null);
}
