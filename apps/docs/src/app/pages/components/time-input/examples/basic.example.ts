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
      <input
        id="reminder-time"
        hellTimeInput
        placeholder="HH:mm"
        [value]="value()"
        (valueChange)="value.set($event)"
      />
      <div hellFieldDescription>
        Type <code>HH:mm</code>, compact digits, or a 12-hour time such as
        <code>2:30 pm</code>.
      </div>
    </div>

    <p class="hd-note">Committed value: {{ format(value()) }}</p>
  `,
})
export class TimeInputBasicExample {
  protected readonly value = signal<HellTimeValue | null>({ hour: 14, minute: 30, second: 0 });

  protected format(value: HellTimeValue | null): string {
    if (!value) return 'not set';
    const pad = (part: number) => part.toString().padStart(2, '0');
    return `${pad(value.hour)}:${pad(value.minute)}`;
  }
}
