import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { ListboxBasicExample } from './examples/basic.example';
import listboxBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-listbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, ListboxBasicExample],
  template: `
    <article class="hd-prose">
      <h1>Listbox</h1>
      <p>
        Low-level listbox wiring for selectable option lists. It wraps ng-primitives listbox
        behavior while keeping rendering in your markup.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="listboxBasicExampleCode">
        <app-listbox-basic-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>hellListbox</code>: root. Accepts array-shaped <code>value</code>, <code>mode</code>, <code>disabled</code>, and emits <code>valueChange</code>.</li>
        <li><code>hellListboxOption</code>: selectable option. Accepts <code>value</code> and <code>disabled</code>.</li>
        <li><code>hellListboxSection</code> and <code>hellListboxHeader</code>: structural grouping.</li>
        <li><code>hellListboxTrigger</code>: trigger wiring for composites that open a listbox panel.</li>
        <li><code>unstyled</code>: opt out of host styling on styled directives.</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use listbox when the user is choosing from visible options.</li>
        <li>Keep the option value stable; render labels separately.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't use listbox for command execution; use Menu or Omnibar items.</li>
      </ul>
    </article>
  `,
})
export class ListboxPage {
  protected readonly listboxBasicExampleCode = listboxBasicExampleCodeRaw;
}
