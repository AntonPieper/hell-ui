import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellDateInput } from '@hell-ui/angular/date-input';
import { HellTimeInput, type HellTimeValue } from '@hell-ui/angular/time-input';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';

@Component({
  selector: 'app-time-input-with-field-schedule-row-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput, HellTimeInput, ...HELL_FIELD_IMPORTS],
  template: `
    <div class="flex flex-wrap items-end gap-3">
      <div hellField>
        <label hellFieldLabel for="shift-date">Shift date</label>
        <input
          id="shift-date"
          hellDateInput
          size="sm"
          [value]="date()"
          (valueChange)="date.set($event)"
        />
      </div>

      <div hellField>
        <label hellFieldLabel for="shift-start">Starts</label>
        <input
          id="shift-start"
          hellTimeInput
          size="sm"
          [value]="start()"
          (valueChange)="start.set($event)"
        />
      </div>

      <div hellField>
        <label hellFieldLabel for="shift-end">Ends</label>
        <input
          id="shift-end"
          hellTimeInput
          size="sm"
          [value]="end()"
          (valueChange)="end.set($event)"
        />
      </div>
    </div>

    <p class="hd-muted">
      {{ date()?.toDateString() ?? 'No date' }}, {{ format(start()) }}–{{ format(end()) }}
    </p>
  `,
})
export class TimeInputWithFieldScheduleRowExample {
  protected readonly date = signal<Date | null>(new Date(2026, 6, 7));
  protected readonly start = signal<HellTimeValue | null>({ hour: 9, minute: 0, second: 0 });
  protected readonly end = signal<HellTimeValue | null>({ hour: 17, minute: 30, second: 0 });

  protected format(value: HellTimeValue | null): string {
    if (!value) return '…';
    const pad = (part: number) => part.toString().padStart(2, '0');
    return `${pad(value.hour)}:${pad(value.minute)}`;
  }
}
