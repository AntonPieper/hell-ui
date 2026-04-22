import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellButton } from 'hell';

@Component({
  selector: 'hd-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton],
  template: `
    <article class="hd-prose">
      <h1>Button</h1>
      <p>Trigger an action or navigate. Built on the
        <code>NgpButton</code> primitive for keyboard, focus and disabled
        handling. Use the <code>variant</code> input for visual emphasis and
        <code>size</code> for density.</p>

      <h2>Examples</h2>
      <div class="hd-example" style="display:flex; gap:0.5rem; flex-wrap:wrap">
        <button hellButton variant="primary">Primary</button>
        <button hellButton variant="default">Default</button>
        <button hellButton variant="soft">Soft</button>
        <button hellButton variant="ghost">Ghost</button>
        <button hellButton variant="danger">Danger</button>
        <button hellButton variant="primary" disabled>Disabled</button>
      </div>

      <h2>Sizes</h2>
      <div class="hd-example" style="display:flex; gap:0.5rem; align-items:center">
        <button hellButton size="sm">Small</button>
        <button hellButton size="md">Medium</button>
        <button hellButton size="lg">Large</button>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>variant</code>: <code>default | primary | soft | ghost | link | danger | success</code></li>
        <li><code>size</code>: <code>xs | sm | md | lg | xl</code></li>
        <li><code>iconOnly</code>: square button for a single icon</li>
        <li><code>block</code>: stretches to container width</li>
        <li><code>unstyled</code>: opt out of all styling, keep behaviour</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use <code>primary</code> sparingly — one per region.</li>
        <li>Use <code>ghost</code> for low-emphasis actions in toolbars.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't put two <code>danger</code> buttons next to each other.</li>
        <li>Don't override colours via class — use CSS variables instead.</li>
      </ul>
    </article>
  `,
})
export class ButtonPage {}
