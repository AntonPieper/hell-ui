import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellNumberInput } from '@hell-ui/angular/number-input';

@Component({
  selector: 'app-number-input-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellNumberInput],
  template: `
    <hell-number-input
      size="sm"
      aria-label="Small quantity"
      steppers
      [value]="small()"
      (valueChange)="small.set($event)"
    />
    <hell-number-input
      size="md"
      aria-label="Medium quantity"
      steppers
      [value]="medium()"
      (valueChange)="medium.set($event)"
    />
    <hell-number-input
      size="lg"
      aria-label="Large quantity"
      steppers
      [value]="large()"
      (valueChange)="large.set($event)"
    />
  `,
})
export class NumberInputSizesExample {
  protected readonly small = signal<number | null>(2);
  protected readonly medium = signal<number | null>(8);
  protected readonly large = signal<number | null>(16);
}
