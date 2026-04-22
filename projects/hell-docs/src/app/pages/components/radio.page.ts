import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellRadioGroup, HellRadio, HellRadioIndicator } from 'hell';

@Component({
  selector: 'hd-radio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellRadioGroup, HellRadio, HellRadioIndicator],
  template: `
    <article class="hd-prose">
      <h1>Radio</h1>
      <p>Pick one option from a small set. Use a select instead for &gt; 5
        options.</p>

      <h2>Example</h2>
      <div class="hd-example" style="display:grid; gap:1rem">
        <div
          hellRadioGroup
          orientation="vertical"
          [value]="plan()"
          (valueChange)="plan.set($any($event))"
        >
          <button hellRadio value="free" type="button" style="display:inline-flex; align-items:center; gap:0.5rem">
            <span ngpRadioIndicator></span> Free
          </button>
          <button hellRadio value="pro" type="button" style="display:inline-flex; align-items:center; gap:0.5rem">
            <span ngpRadioIndicator></span> Pro
          </button>
          <button hellRadio value="enterprise" type="button" style="display:inline-flex; align-items:center; gap:0.5rem">
            <span ngpRadioIndicator></span> Enterprise
          </button>
        </div>

        <p>Selected: <code>{{ plan() }}</code></p>
      </div>

      <h2>Horizontal</h2>
      <div class="hd-example">
        <div hellRadioGroup orientation="horizontal" value="md">
          <button hellRadio value="sm" type="button" style="display:inline-flex; align-items:center; gap:0.4rem">
            <span ngpRadioIndicator></span> Small
          </button>
          <button hellRadio value="md" type="button" style="display:inline-flex; align-items:center; gap:0.4rem">
            <span ngpRadioIndicator></span> Medium
          </button>
          <button hellRadio value="lg" type="button" style="display:inline-flex; align-items:center; gap:0.4rem">
            <span ngpRadioIndicator></span> Large
          </button>
        </div>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>hellRadioGroup</code>: <code>value</code>, <code>valueChange</code>, <code>orientation</code>, <code>disabled</code></li>
        <li><code>hellRadio</code>: <code>value</code>, <code>disabled</code></li>
        <li><code>ngpRadioIndicator</code>: visual marker (re-exported as <code>HellRadioIndicator</code>)</li>
      </ul>
    </article>
  `,
})
export class RadioPage {
  protected readonly plan = signal<'free' | 'pro' | 'enterprise'>('free');
}
