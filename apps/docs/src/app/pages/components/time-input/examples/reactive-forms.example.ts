import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HellTimeInput, type HellTimeValue } from '@hell-ui/angular/time-input';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';

@Component({
  selector: 'app-time-input-reactive-forms-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ...HELL_FIELD_IMPORTS, HellTimeInput],
  template: `
    <div hellField>
      <label hellFieldLabel for="reactive-time">Meeting time</label>
      <hell-time-input inputId="reactive-time" [formControl]="control" />
      <div hellFieldDescription>
        Reactive forms read/write <code>HellTimeValue | null</code>; transport formatting stays
        your responsibility.
      </div>
    </div>

    <p class="hd-muted">Form value: {{ format(control.value) }}</p>
  `,
})
export class TimeInputReactiveFormsExample {
  protected readonly control = new FormControl<HellTimeValue | null>({
    hour: 9,
    minute: 30,
    second: 0,
  });

  protected format(value: HellTimeValue | null): string {
    if (!value) return 'not set';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(value.hour)}:${pad(value.minute)}`;
  }
}
