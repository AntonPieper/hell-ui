import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellNumberInput } from '@hell-ui/angular/number-input';

@Component({
  selector: 'app-number-input-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellNumberInput],
  template: `
    <hell-number-input
      aria-label="Listen port"
      integer
      steppers
      [min]="1"
      [max]="65535"
      [value]="port()"
      (valueChange)="port.set($event)"
    />
    <p class="hd-note">Ports are integers from 1 to 65535.</p>
  `,
})
export class NumberInputBasicExample {
  protected readonly port = signal<number | null>(8080);
}
