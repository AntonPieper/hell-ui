import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellDialpad } from '@hell-ui/angular/dialpad';

@Component({
  selector: 'app-dialpad-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDialpad],
  template: `
    <hell-dialpad (valueChange)="number.set($event)" (call)="called.set($event)" />

    @if (called(); as call) {
      <p class="mt-3 text-sm hd-muted">Calling {{ call }}…</p>
    }
  `,
})
export class DialpadBasicExample {
  protected readonly number = signal('');
  protected readonly called = signal('');
}
