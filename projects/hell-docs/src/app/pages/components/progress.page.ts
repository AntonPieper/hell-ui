import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellButton, HellProgress, HellProgressBar } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, HellButton, HellProgress, HellProgressBar],
  template: `
    <article class="hd-prose">
      <h1>Progress</h1>
      <p>
        Indicates the percentage of completion for a known-duration task. Set <code>value</code> as
        a number between <code>0</code> and <code>max</code> (default 100).
      </p>

      <h2>Examples</h2>
      <hd-example-tabs [code]="exampleCodes[0]" previewClass="grid max-w-95 gap-2">
        <div hellProgress [value]="0"><div hellProgressBar></div></div>
        <div hellProgress [value]="33"><div hellProgressBar></div></div>
        <div hellProgress [value]="66"><div hellProgressBar></div></div>
        <div hellProgress [value]="100"><div hellProgressBar></div></div>
      </hd-example-tabs>

      <h2>Interactive</h2>
      <hd-example-tabs [code]="exampleCodes[1]" previewClass="grid max-w-95 gap-2">
        <div hellProgress [value]="value()"><div hellProgressBar></div></div>
        <div class="flex gap-2">
          <button hellButton size="sm" (click)="step(-10)">−10</button>
          <button hellButton size="sm" (click)="step(10)">+10</button>
          <span class="ml-auto">{{ value() }}%</span>
        </div>
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>hellProgress</code>: <code>value</code>, <code>max</code> (default 100)</li>
        <li><code>hellProgressBar</code>: the visual fill — apply on a child element</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use progress when completion percentage is known.</li>
        <li>Pair bars with text for precise long-running jobs.</li>
        <li>Use native values consistently from 0 to max.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't show fake progress for unknown duration; use Spinner or Skeleton.</li>
        <li>Don't rely on color alone for status.</li>
      </ul>
    </article>
  `,
})
export class ProgressPage {
  protected readonly exampleCodes = [
    '<div hellProgress [value]="0"><div hellProgressBar></div></div>\n<div hellProgress [value]="33"><div hellProgressBar></div></div>\n<div hellProgress [value]="66"><div hellProgressBar></div></div>\n<div hellProgress [value]="100"><div hellProgressBar></div></div>\n',
    '<div hellProgress [value]="45"><div hellProgressBar></div></div>\n<span class="hd-muted">45%</span>\n',
  ] as const;
  protected readonly value = signal(40);
  protected step(d: number) {
    this.value.update((v) => Math.max(0, Math.min(100, v + d)));
  }
}
