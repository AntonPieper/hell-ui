import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellTimeInput, type HellTimeValue } from '@hell-ui/angular/composites';

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
  protected readonly value = signal<HellTimeValue | null>({ hour: 14, minute: 30, second: 0 });
  protected readonly small = signal<HellTimeValue | null>({ hour: 9, minute: 0, second: 0 });
  protected readonly large = signal<HellTimeValue | null>({ hour: 17, minute: 30, second: 0 });
}
