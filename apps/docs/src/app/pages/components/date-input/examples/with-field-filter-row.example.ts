import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidXmark } from '@ng-icons/font-awesome/solid';
import { HellButton } from '@hell-ui/angular/button';
import { HellDateInput } from '@hell-ui/angular/date-input';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';

@Component({
  selector: 'app-date-input-with-field-filter-row-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellDateInput, HellIcon, ...HELL_FIELD_IMPORTS],
  providers: [provideIcons({ faSolidXmark })],
  template: `
    <div class="flex flex-wrap items-end gap-3">
      <div hellField>
        <label hellFieldLabel for="report-from">From</label>
        <input
          id="report-from"
          hellDateInput
          size="sm"
          [value]="from()"
          [max]="to() ?? null"
          (valueChange)="from.set($event)"
        />
      </div>

      <div hellField>
        <label hellFieldLabel for="report-to">To</label>
        <input
          id="report-to"
          hellDateInput
          size="sm"
          [value]="to()"
          [min]="from() ?? null"
          (valueChange)="to.set($event)"
        />
      </div>

      <button hellButton variant="ghost" size="sm" type="button" (click)="clear()">
        <hell-icon name="faSolidXmark" />
        Clear
      </button>
    </div>

    <p class="hd-muted">
      Range: {{ from()?.toDateString() ?? '…' }} – {{ to()?.toDateString() ?? '…' }}
    </p>
  `,
})
export class DateInputWithFieldFilterRowExample {
  protected readonly from = signal<Date | null>(new Date(2026, 0, 1));
  protected readonly to = signal<Date | null>(new Date(2026, 2, 31));

  protected clear(): void {
    this.from.set(null);
    this.to.set(null);
  }
}
