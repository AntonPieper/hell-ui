import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellTimeInput, type HellTimeValue } from '@hell-ui/angular/time-input';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';

@Component({
  selector: 'app-time-input-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_FIELD_IMPORTS, HellTimeInput],
  template: `
    <div hellField>
      <label hellFieldLabel for="reminder-time">Reminder time</label>
      <hell-time-input
        inputId="reminder-time"
        [value]="value()"
        (valueChange)="value.set($event)"
      />
      <div hellFieldDescription>Type <code>HH:mm</code> or open the picker.</div>
    </div>
  `,
})
export class TimeInputBasicExample {
  protected readonly value = signal<HellTimeValue | null>({ hour: 14, minute: 30, second: 0 });
}
