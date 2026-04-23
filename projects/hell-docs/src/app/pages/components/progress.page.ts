import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellButton, HellProgress, HellProgressBar } from 'hell';

@Component({
  selector: 'hd-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellProgress, HellProgressBar],
  template: `
    <article class="hd-prose">
      <h1>Progress</h1>
      <p>Indicates the percentage of completion for a known-duration task.
        Set <code>value</code> as a number between <code>0</code> and
        <code>max</code> (default 100).</p>

      <h2>Examples</h2>
      <div class="hd-example grid max-w-95 gap-2">
        <div hellProgress [value]="0"><div hellProgressBar></div></div>
        <div hellProgress [value]="33"><div hellProgressBar></div></div>
        <div hellProgress [value]="66"><div hellProgressBar></div></div>
        <div hellProgress [value]="100"><div hellProgressBar></div></div>
      </div>

      <h2>Interactive</h2>
      <div class="hd-example grid max-w-95 gap-2">
        <div hellProgress [value]="value()"><div hellProgressBar></div></div>
        <div class="flex gap-2">
          <button hellButton size="sm" (click)="step(-10)">−10</button>
          <button hellButton size="sm" (click)="step(10)">+10</button>
          <span class="ml-auto">{{ value() }}%</span>
        </div>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>hellProgress</code>: <code>value</code>, <code>max</code> (default 100)</li>
        <li><code>hellProgressBar</code>: the visual fill — apply on a child element</li>
      </ul>
    </article>
  `,
})
export class ProgressPage {
  protected readonly value = signal(40);
  protected step(d: number) {
    this.value.update((v) => Math.max(0, Math.min(100, v + d)));
  }
}
