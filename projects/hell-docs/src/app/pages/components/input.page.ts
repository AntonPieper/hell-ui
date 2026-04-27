import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HellInput, HellSelect, HellTextarea } from 'hell';
import { ExampleTabs } from '../../shared/example-tabs';

@Component({
  selector: 'hd-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, HellInput, HellSelect, HellTextarea],
  template: `
    <article class="hd-prose">
      <h1>Input, Select &amp; Textarea</h1>
      <p>
        Single-line inputs, native selects and multi-line textareas. Apply the
        <code>hellInput</code> directive to a native <code>&lt;input&gt;</code>,
        <code>hellSelect</code> to a <code>&lt;select&gt;</code>, and <code>hellTextarea</code> to a
        <code>&lt;textarea&gt;</code>.
      </p>

      <h2>Sizes</h2>
      <hd-example-tabs [code]="exampleCodes[0]" previewClass="flex flex-wrap gap-2">
        <input hellInput size="sm" placeholder="Small" />
        <input hellInput size="md" placeholder="Medium (default)" />
        <input hellInput size="lg" placeholder="Large" />
      </hd-example-tabs>

      <h2>States</h2>
      <hd-example-tabs [code]="exampleCodes[1]" previewClass="flex flex-wrap gap-2">
        <input hellInput placeholder="Default" />
        <input hellInput placeholder="Invalid" invalid />
        <input hellInput placeholder="Disabled" disabled />
      </hd-example-tabs>

      <h2>Select</h2>
      <hd-example-tabs [code]="exampleCodes[2]" previewClass="grid max-w-md gap-2">
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
      </hd-example-tabs>

      <h2>Textarea</h2>
      <hd-example-tabs [code]="exampleCodes[3]" previewClass="grid gap-2">
        <textarea hellTextarea size="sm" rows="3" placeholder="Small textarea"></textarea>
        <textarea hellTextarea rows="4" placeholder="Type a message…"></textarea>
        <textarea hellTextarea size="lg" rows="5" placeholder="Large textarea"></textarea>
        <textarea hellTextarea rows="3" placeholder="Invalid" invalid></textarea>
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellInput</code>: <code>size</code> (<code>sm | md | lg</code>),
          <code>invalid</code>, <code>disabled</code>, <code>unstyled</code>
        </li>
        <li>
          <code>hellSelect</code>: <code>size</code> (<code>sm | md | lg</code>),
          <code>invalid</code>, <code>disabled</code>, <code>unstyled</code>
        </li>
        <li>
          <code>hellTextarea</code>: <code>size</code> (<code>sm | md | lg</code>),
          <code>invalid</code>, <code>disabled</code>, <code>unstyled</code>
        </li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use <code>hellField</code> around inputs for labels, help and errors.</li>
        <li>Choose <code>sm</code>, <code>md</code> or <code>lg</code> based on density.</li>
        <li>Use <code>invalid</code> only when error copy is present.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't rely on placeholder text as the only label.</li>
        <li>Don't mark a field invalid before the user can act.</li>
      </ul>
    </article>
  `,
})
export class InputPage {
  protected readonly exampleCodes = [
    '<input hellInput size="sm" placeholder="Small" />\n<input hellInput size="md" placeholder="Medium (default)" />\n<input hellInput size="lg" placeholder="Large" />\n',
    '<input hellInput placeholder="Default" />\n<input hellInput placeholder="Invalid" invalid />\n<input hellInput placeholder="Disabled" disabled />\n',
    '<select hellSelect size="sm" aria-label="Small select">\n  <option>Small</option>\n  <option>Compact choice</option>\n</select>\n<select hellSelect aria-label="Default select">\n  <option>Default</option>\n  <option>Second option</option>\n</select>\n<select hellSelect size="lg" aria-label="Large select">\n  <option>Large</option>\n  <option>More comfortable</option>\n</select>\n<select hellSelect invalid aria-label="Invalid select">\n  <option>Invalid</option>\n</select>\n<select hellSelect disabled aria-label="Disabled select">\n  <option>Disabled</option>\n</select>\n',
    '<textarea hellTextarea size="sm" rows="3" placeholder="Small textarea"></textarea>\n<textarea hellTextarea rows="4" placeholder="Type a message\u2026"></textarea>\n<textarea hellTextarea size="lg" rows="5" placeholder="Large textarea"></textarea>\n<textarea hellTextarea rows="3" placeholder="Invalid" invalid></textarea>\n',
  ] as const;
}
