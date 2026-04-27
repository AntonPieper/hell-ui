import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellInput, HellSelect, HellTextarea } from 'hell';

@Component({
  selector: 'hd-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellInput, HellSelect, HellTextarea],
  template: `
    <article class="hd-prose">
      <h1>Input, Select &amp; Textarea</h1>
      <p>Single-line inputs, native selects and multi-line textareas. Apply the
        <code>hellInput</code> directive to a native <code>&lt;input&gt;</code>,
        <code>hellSelect</code> to a <code>&lt;select&gt;</code>, and
        <code>hellTextarea</code> to a <code>&lt;textarea&gt;</code>.</p>

      <h2>Sizes</h2>
      <div class="hd-example flex flex-wrap gap-2">
        <input hellInput size="sm" placeholder="Small" />
        <input hellInput size="md" placeholder="Medium (default)" />
        <input hellInput size="lg" placeholder="Large" />
      </div>

      <h2>States</h2>
      <div class="hd-example flex flex-wrap gap-2">
        <input hellInput placeholder="Default" />
        <input hellInput placeholder="Invalid" invalid />
        <input hellInput placeholder="Disabled" disabled />
      </div>

      <h2>Select</h2>
      <div class="hd-example grid max-w-md gap-2">
        <select hellSelect size="sm" aria-label="Small select">
          <option>Small</option>
          <option>Compact choice</option>
        </select>
        <select hellSelect aria-label="Default select">
          <option>Default</option>
          <option>Second option</option>
        </select>
        <select hellSelect size="lg" aria-label="Large select">
          <option>Large</option>
          <option>More comfortable</option>
        </select>
        <select hellSelect invalid aria-label="Invalid select">
          <option>Invalid</option>
        </select>
        <select hellSelect disabled aria-label="Disabled select">
          <option>Disabled</option>
        </select>
      </div>

      <h2>Textarea</h2>
      <div class="hd-example grid gap-2">
        <textarea hellTextarea size="sm" rows="3" placeholder="Small textarea"></textarea>
        <textarea hellTextarea rows="4" placeholder="Type a message…"></textarea>
        <textarea hellTextarea size="lg" rows="5" placeholder="Large textarea"></textarea>
        <textarea hellTextarea rows="3" placeholder="Invalid" invalid></textarea>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>hellInput</code>: <code>size</code> (<code>sm | md | lg</code>), <code>invalid</code>, <code>disabled</code>, <code>unstyled</code></li>
        <li><code>hellSelect</code>: <code>size</code> (<code>sm | md | lg</code>), <code>invalid</code>, <code>disabled</code>, <code>unstyled</code></li>
        <li><code>hellTextarea</code>: <code>size</code> (<code>sm | md | lg</code>), <code>invalid</code>, <code>disabled</code>, <code>unstyled</code></li>
      </ul>
    </article>
  `,
})
export class InputPage {}
