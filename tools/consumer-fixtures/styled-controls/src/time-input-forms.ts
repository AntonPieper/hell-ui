import { Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, form } from '@angular/forms/signals';
import { HellTimeInput, type HellTimeValue } from '@hell-ui/angular/time-input';

function formatTime(value: HellTimeValue | null): string {
  if (!value) return 'null';
  const pad = (part: number) => part.toString().padStart(2, '0');
  return `${pad(value.hour)}:${pad(value.minute)}`;
}

function time(hour: number, minute: number): HellTimeValue {
  return { hour, minute, second: 0 };
}

/**
 * Time Input Control Value Authority boundary coverage (#286): the packed
 * `input[hellTimeInput]` binds one `value` model across direct property
 * binding, two-way binding, Signal Forms `[formField]`, Reactive Forms
 * `[formControl]`, and Template-driven Forms `[(ngModel)]`, and every path
 * reports the same committed nullable time at runtime.
 */
@Component({
  selector: 'app-time-input-forms',
  imports: [FormsModule, ReactiveFormsModule, FormField, HellTimeInput],
  template: `
    <input
      hellTimeInput
      aria-label="Property time"
      [value]="propertyValue()"
      (valueChange)="propertyValue.set($event)"
    />
    <input hellTimeInput aria-label="Two-way time" [(value)]="twoWayValue" />
    <input hellTimeInput aria-label="Signal Forms time" [formField]="scheduleForm.start" />
    <input hellTimeInput aria-label="Reactive time" [formControl]="reactiveControl" />
    <input hellTimeInput aria-label="Template-driven time" [(ngModel)]="ngModelValue" />
    <p data-test-id="time-input-forms-status">{{ status() }}</p>
  `,
})
export class TimeInputForms {
  protected readonly propertyValue = signal<HellTimeValue | null>(time(8, 15));
  protected readonly twoWayValue = signal<HellTimeValue | null>(time(9, 30));
  protected readonly formModel = signal<{ start: HellTimeValue | null }>({
    start: time(10, 45),
  });
  protected readonly scheduleForm = form(this.formModel);
  protected readonly reactiveControl = new FormControl<HellTimeValue | null>(time(12, 0));
  protected readonly ngModelValue = signal<HellTimeValue | null>(time(13, 15));

  protected readonly status = computed(
    () =>
      `Time input forms ready ${formatTime(this.propertyValue())} ` +
      `${formatTime(this.twoWayValue())} ${formatTime(this.scheduleForm.start().value())} ` +
      `${formatTime(this.reactiveControl.value)} ${formatTime(this.ngModelValue())}`,
  );
}
