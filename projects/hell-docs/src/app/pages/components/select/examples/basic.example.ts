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
      aria-label="Select priority"
      style="max-width: 240px"
      [value]="value()"
      (valueChange)="value.set($event)"
    >
      @if (value(); as v) {
        <span hellSelectValue>{{ v }}</span>
      } @else {
        <span hellSelectPlaceholder>Select priority…</span>
      }
      <ng-template hellSelectPortal>
        <div hellSelectDropdown>
          @for (option of options; track option) {
            <div hellSelectOption [value]="option" [disabled]="option === disabledPriority">
              {{ option }}
            </div>
          }
        </div>
      </ng-template>
    </button>
  `,
})
export class SelectBasicExample {
  protected readonly options = PRIORITIES;
  protected readonly disabledPriority = 'Medium';
  protected readonly value = signal<string | null>(null);
}
