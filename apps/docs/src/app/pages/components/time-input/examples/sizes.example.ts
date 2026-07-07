import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellTimeInput, type HellTimeValue } from '@hell-ui/angular/time-input';

@Component({
  selector: 'app-time-input-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTimeInput],
  template: `
    <hell-time-input size="sm" aria-label="Small" [value]="small()" (valueChange)="small.set($event)" />
    <hell-time-input size="md" aria-label="Medium" [value]="medium()" (valueChange)="medium.set($event)" />
    <hell-time-input size="lg" aria-label="Large" [value]="large()" (valueChange)="large.set($event)" />
  `,
})
export class TimeInputSizesExample {
  protected readonly small = signal<HellTimeValue | null>({ hour: 9, minute: 0, second: 0 });
  protected readonly medium = signal<HellTimeValue | null>({ hour: 14, minute: 30, second: 0 });
  protected readonly large = signal<HellTimeValue | null>({ hour: 17, minute: 45, second: 0 });
}
