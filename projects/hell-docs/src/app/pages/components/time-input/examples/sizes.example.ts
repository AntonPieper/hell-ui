import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HELL_FIELD_DIRECTIVES, HellTimeInput } from 'hell';

@Component({
  selector: 'app-time-input-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTimeInput],
  template: `
    <hell-time-input size="sm" [value]="small()" (valueChange)="small.set($event)" />
    <hell-time-input size="md" [value]="value()" (valueChange)="value.set($event)" />
    <hell-time-input size="lg" [value]="large()" (valueChange)="large.set($event)" />
  `,
})
export class TimeInputSizesExample {
  protected readonly value = signal<string | null>('14:30');
  protected readonly small = signal<string | null>('09:00');
  protected readonly large = signal<string | null>('17:30');
  protected readonly precise = signal<string | null>('12:34:56');
}
