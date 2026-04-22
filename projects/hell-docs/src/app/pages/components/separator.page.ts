import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellSeparator } from 'hell';

@Component({
  selector: 'hd-separator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSeparator],
  template: `
    <article class="hd-prose">
      <h1>Separator</h1>
      <p>A thin divider. Renders an <code>&lt;hr&gt;</code>-equivalent with
        the correct ARIA role for both axes.</p>

      <h2>Horizontal</h2>
      <div class="hd-example">
        <p style="margin:0">Section A</p>
        <div hellSeparator></div>
        <p style="margin:0">Section B</p>
      </div>

      <h2>Vertical</h2>
      <div class="hd-example" style="display:flex; align-items:center; gap:1rem; height:60px">
        <span>Left</span>
        <div hellSeparator orientation="vertical"></div>
        <span>Middle</span>
        <div hellSeparator orientation="vertical"></div>
        <span>Right</span>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>orientation</code>: <code>horizontal | vertical</code></li>
        <li><code>unstyled</code></li>
      </ul>
    </article>
  `,
})
export class SeparatorPage {}
