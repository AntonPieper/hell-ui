import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { ExampleTabs } from '../../../shared/example-tabs';
import { FieldHorizontalExample } from './examples/horizontal.example';
import fieldHorizontalExampleCodeRaw from './examples/horizontal.example.ts?raw' with {
  loader: 'text',
};
import { FieldVerticalDefaultExample } from './examples/vertical-default.example';
import fieldVerticalDefaultExampleCodeRaw from './examples/vertical-default.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    ...HELL_FIELD_DIRECTIVES,
    FieldVerticalDefaultExample,
    FieldHorizontalExample,
  ],
  template: `
    <article class="hd-prose">
      <h1>Field</h1>
      <p>
        A form-field shell that wires <code>label</code>, <code>description</code> and
        <code>error</code> elements to the control inside it via the underlying form-field primitive
        — no manual <code>id</code>/<code>for</code> matching needed. Use it around
        <em>every</em> control in your forms; it gives you a clickable label, accessible description
        / error wiring, and consistent spacing for free.
      </p>

      <h2>Vertical (default)</h2>
      <hd-example-tabs [code]="fieldVerticalDefaultExampleCode" previewClass="grid max-w-md gap-4">
        <app-field-vertical-default-example />
      </hd-example-tabs>

      <h2>Horizontal</h2>
      <p>
        For checkboxes, switches, or any control that pairs naturally with a single inline label.
      </p>
      <hd-example-tabs [code]="fieldHorizontalExampleCode" previewClass="grid max-w-md gap-2">
        <app-field-horizontal-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>hellField</code>: wrapper. <code>orientation</code> is
          <code>vertical | horizontal</code>; <code>ui</code> refines the local
          <code>root</code> part.
        </li>
        <li>
          <code>hellFieldLabel</code>: visible label, auto-linked to the control. Clicking it
          focuses or toggles the control. Exposes local <code>root</code> <code>ui</code>.
        </li>
        <li>
          <code>hellFieldDescription</code>: neutral helper text announced by assistive tech.
          Exposes local <code>root</code> <code>ui</code>.
        </li>
        <li>
          <code>hellFieldError</code>: error text announced by assistive tech when present.
          Exposes local <code>root</code> <code>ui</code>.
        </li>
        <li>Import the bundle via <code>HELL_FIELD_DIRECTIVES</code>.</li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Use <code>hellField</code> to bind label, hint and error copy to one control.</li>
        <li>Use horizontal orientation only for compact settings rows.</li>
        <li>Keep errors actionable and specific.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't put multiple unrelated controls in one field.</li>
        <li>Don't replace labels with placeholders.</li>
      </ul>
    </article>
  `,
})
export class FieldPage {
  protected readonly fieldVerticalDefaultExampleCode = fieldVerticalDefaultExampleCodeRaw;
  protected readonly fieldHorizontalExampleCode = fieldHorizontalExampleCodeRaw;
}
