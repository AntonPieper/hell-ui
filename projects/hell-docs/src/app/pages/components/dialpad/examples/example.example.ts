import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDialpad } from '@hell-ui/angular/dialpad';

@Component({
  selector: 'app-dialpad-example-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDialpad],
  template: `
    <hell-dialpad
      (digit)="onDigit($event)"
      (valueChange)="number.set($event)"
      (call)="called.set($event)"
    />
    <div>
      <p>
        Last digit: <code>{{ last() || '—' }}</code>
      </p>
      <p>
        Current number: <code>{{ number() || '—' }}</code>
      </p>
      <p>
        Last call: <code>{{ called() || '—' }}</code>
      </p>
    </div>
  `,
})
export class DialpadExampleExample {
  protected readonly last = signal('');
  protected readonly number = signal('');
  protected readonly called = signal('');
  protected onDigit(d: string) {
    this.last.set(d);
  }
}
