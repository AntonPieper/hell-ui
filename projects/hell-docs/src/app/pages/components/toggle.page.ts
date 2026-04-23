import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { HellToggle, HellToggleGroup, HellToggleGroupItem } from 'hell';

@Component({
  selector: 'hd-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellToggle, HellToggleGroup, HellToggleGroupItem],
  template: `
    <article class="hd-prose">
      <h1>Toggle</h1>
      <p>Press-toggle button. Use the standalone <code>hellToggle</code> for a
        single binary action, or wrap several <code>hellToggleGroupItem</code>
        buttons in a <code>hellToggleGroup</code> for single- or multi-select
        choices.</p>

      <h2>Single toggle</h2>
      <div class="hd-example flex gap-2">
        <button hellToggle [selected]="bold()" (selectedChange)="bold.set($event)" type="button">
          <strong>B</strong>
        </button>
        <button hellToggle [selected]="italic()" (selectedChange)="italic.set($event)" type="button">
          <em>I</em>
        </button>
        <button hellToggle [selected]="underline()" (selectedChange)="underline.set($event)" type="button">
          <u>U</u>
        </button>
      </div>
      <p>State: bold={{ bold() }} italic={{ italic() }} underline={{ underline() }}</p>

      <h2>Toggle group (single)</h2>
      <div class="hd-example">
        <div hellToggleGroup type="single" [value]="align()" (valueChange)="align.set($any($event))">
          <button hellToggleGroupItem value="left" type="button">Left</button>
          <button hellToggleGroupItem value="center" type="button">Center</button>
          <button hellToggleGroupItem value="right" type="button">Right</button>
        </div>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>hellToggle</code>: <code>selected</code>, <code>selectedChange</code>, <code>disabled</code></li>
        <li><code>hellToggleGroup</code>: <code>type</code> (<code>single | multiple</code>), <code>value</code>, <code>valueChange</code>, <code>disabled</code></li>
        <li><code>hellToggleGroupItem</code>: <code>value</code>, <code>disabled</code></li>
      </ul>
    </article>
  `,
})
export class TogglePage {
  protected readonly bold = signal(false);
  protected readonly italic = signal(false);
  protected readonly underline = signal(false);
  protected readonly align = signal<string[]>(['left']);
}
