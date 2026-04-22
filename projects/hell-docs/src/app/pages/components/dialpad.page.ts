import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellDialpad } from 'hell';

@Component({
  selector: 'hd-dialpad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDialpad],
  template: `
    <article class="hd-prose">
      <h1>Dialpad</h1>
      <p>Telephony dialpad with key letters, used in CTI / VoIP applications.
        Emits <code>(digit)</code> on every key press and <code>(valueChange)</code>
        with the running number.</p>

      <h2>Example</h2>
      <div class="hd-example" style="display:flex; gap:1.5rem; align-items:flex-start; flex-wrap:wrap">
        <hell-dialpad (digit)="onDigit($event)" (valueChange)="number.set($event)" />
        <div>
          <p>Last digit: <code>{{ last() || '—' }}</code></p>
          <p>Current number: <code>{{ number() || '—' }}</code></p>
        </div>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>value</code>: controlled mode</li>
        <li><code>(digit)</code>: emits the pressed key</li>
        <li><code>(valueChange)</code>: emits the running number</li>
      </ul>
    </article>
  `,
})
export class DialpadPage {
  protected readonly last = signal('');
  protected readonly number = signal('');
  protected onDigit(d: string) {
    this.last.set(d);
  }
}
