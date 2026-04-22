import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellInput, HellTextarea } from 'hell';

@Component({
  selector: 'hd-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellInput, HellTextarea],
  template: `
    <article class="hd-prose">
      <h1>Input &amp; Textarea</h1>
      <p>Single-line and multi-line text inputs. Apply the
        <code>hellInput</code> directive to a native <code>&lt;input&gt;</code>,
        and <code>hellTextarea</code> to a <code>&lt;textarea&gt;</code>.</p>

      <h2>Sizes</h2>
      <div class="hd-example" style="display:flex; gap:0.5rem; flex-wrap:wrap">
        <input hellInput size="sm" placeholder="Small" />
        <input hellInput size="md" placeholder="Medium (default)" />
        <input hellInput size="lg" placeholder="Large" />
      </div>

      <h2>States</h2>
      <div class="hd-example" style="display:flex; gap:0.5rem; flex-wrap:wrap">
        <input hellInput placeholder="Default" />
        <input hellInput placeholder="Invalid" invalid />
        <input hellInput placeholder="Disabled" disabled />
      </div>

      <h2>Textarea</h2>
      <div class="hd-example" style="display:grid; gap:0.5rem">
        <textarea hellTextarea rows="4" placeholder="Type a message…"></textarea>
        <textarea hellTextarea rows="3" placeholder="Invalid" invalid></textarea>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>size</code>: <code>xs | sm | md | lg | xl</code></li>
        <li><code>invalid</code>: visually marks the control as invalid</li>
        <li><code>disabled</code>: native disabled state</li>
        <li><code>unstyled</code></li>
      </ul>
    </article>
  `,
})
export class InputPage {}
