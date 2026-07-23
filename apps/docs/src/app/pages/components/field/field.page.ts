import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { FieldAllPartsStylingExample } from './examples/all-parts-styling.example';
import fieldAllPartsStylingExampleCodeRaw from './examples/all-parts-styling.example.ts?raw' with {
  loader: 'text',
};
import { FieldBasicExample } from './examples/basic.example';
import fieldBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { FieldOrientationExample } from './examples/orientation.example';
import fieldOrientationExampleCodeRaw from './examples/orientation.example.ts?raw' with {
  loader: 'text',
};
import { FieldValidationExample } from './examples/validation.example';
import fieldValidationExampleCodeRaw from './examples/validation.example.ts?raw' with {
  loader: 'text',
};
import { FieldWithFormSectionExample } from './examples/with-form-section.example';
import fieldWithFormSectionExampleCodeRaw from './examples/with-form-section.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    FieldBasicExample,
    FieldOrientationExample,
    FieldValidationExample,
    FieldWithFormSectionExample,
    FieldAllPartsStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Field"
        icon="faSolidRectangleList"
        category="Styled primitive"
        importPath="hell-ui/field"
        stylesPath="hell-ui/field/styles.css"
      >
        Wires a label, description, and error message to one control with correct ids and
        <code>aria-describedby</code> — no manual wiring.
      </hd-page-header>
      <p>
        <code>hellField</code> is a directive suite — <code>hellField</code>,
        <code>hellFieldLabel</code>, <code>hellFieldDescription</code>, and
        <code>hellFieldError</code> — built on the <code>NgpFormField</code> primitive from
        <code>ng-primitives</code>. Each directive attaches to markup you already own; together
        they track which label, description, and error elements belong to the control inside them
        and reflect that into <code>aria-labelledby</code> / <code>aria-describedby</code> on the
        control automatically. Every Hell text control, select, checkbox, and switch reads this
        wiring for free because they're all built on the same form-field primitive underneath.
      </p>
      <p>
        Use it around <em>every</em> control in your forms. In a dense business app that means
        every filter, every settings toggle, and every field in a create/edit dialog — it gives you
        a clickable label, accessible description and error text, and consistent spacing without
        hand-matching <code>id</code>/<code>for</code>/<code>aria-describedby</code> yourself.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="fieldBasicExampleCode" previewClass="grid max-w-sm gap-4">
        <app-field-basic-example />
      </hd-example-tabs>

      <h2>Orientation</h2>
      <p>
        <code>orientation</code> is <code>vertical</code> (default) or <code>horizontal</code>.
        Vertical stacks label, control, description, and error. Horizontal lays the label next to
        the control on one line — handy for a checkbox, switch, or any control that pairs
        naturally with a single inline label — and wraps description/error text onto its own full
        line below.
      </p>
      <hd-example-tabs [code]="fieldOrientationExampleCode" previewClass="grid max-w-sm gap-4">
        <app-field-orientation-example />
      </hd-example-tabs>

      <h2>Validation</h2>
      <p>
        Swap <code>hellFieldDescription</code> for <code>hellFieldError</code> when validation
        fails. <code>hellFieldError</code> joins the same <code>aria-describedby</code> chain as
        the description, so assistive tech announces it the moment it appears — pair it with the
        control's own <code>invalid</code> input (which sets that control's
        <code>aria-invalid</code>) for the visual cue.
      </p>
      <hd-example-tabs [code]="fieldValidationExampleCode" previewClass="grid max-w-sm gap-4">
        <app-field-validation-example />
      </hd-example-tabs>

      <h2>With a form section</h2>
      <p>
        A small "invite a teammate" form: a <code>hellCard</code> (narrow entry point
        <code>hell-ui/card</code>) holding a text input, a native select, and a
        horizontal checkbox field — each wrapped in its own <code>hellField</code>. This is the
        shape most business-app forms take: stack vertical fields for the primary inputs, then
        drop to a horizontal field for a trailing opt-in checkbox.
      </p>
      <hd-example-tabs [code]="fieldWithFormSectionExampleCode">
        <app-field-with-form-section-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Every field module follows the same Part Style Map shape: it owns exactly one public part,
        <code>root</code>, so its <code>ui</code> input takes either a shorthand class string or an
        explicit <code>{{ '{' }} root: string {{ '}' }}</code> map. Refine the module you actually
        want to change — <code>hellField</code>'s <code>ui</code> only reaches the wrapper, not the
        label, description, or error text inside it.
      </p>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Module</th>
            <th>Part</th>
            <th>Styles</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>HellField</code></td>
            <td><code>root</code></td>
            <td>The wrapper — layout direction, gap, and any background/border you add.</td>
          </tr>
          <tr>
            <td><code>HellFieldLabel</code></td>
            <td><code>root</code></td>
            <td>The clickable label text — size, weight, and color.</td>
          </tr>
          <tr>
            <td><code>HellFieldDescription</code></td>
            <td><code>root</code></td>
            <td>Neutral helper text below (or beside) the control.</td>
          </tr>
          <tr>
            <td><code>HellFieldError</code></td>
            <td><code>root</code></td>
            <td>Validation error text, styled independently from the description.</td>
          </tr>
        </tbody>
      </table>
      <p>The example below refines every part across every module in the entry point:</p>
      <hd-example-tabs [code]="fieldAllPartsStylingExampleCode" previewClass="grid max-w-sm">
        <app-field-all-parts-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <p>
        Every directive below accepts <code>ui</code>: a shorthand class string or a
        <code>{{ '{' }} root: string {{ '}' }}</code> map.
      </p>
      <ul>
        <li>
          <code>[hellField]</code> — wrapper (host directive <code>NgpFormField</code>).
          <ul>
            <li>
              <code>orientation</code>: <code>'vertical' | 'horizontal'</code>, default
              <code>'vertical'</code>. Reflected as <code>data-orientation</code> on the wrapper,
              and mirrored onto any enclosed <code>hellFieldDescription</code> /
              <code>hellFieldError</code> for orientation-aware layout.
            </li>
            <li>
              <code>ui: HellUiInput&lt;'root'&gt;</code>.
            </li>
          </ul>
        </li>
        <li>
          <code>label[hellFieldLabel]</code> — the visible label (host directive
          <code>NgpLabel</code>). Auto-sets <code>for</code> to the enclosed control's id; clicking
          it focuses the control, or toggles it immediately for checkbox/switch/radio roles.
          <ul>
            <li>
              <code>ui: HellUiInput&lt;'root'&gt;</code>.
            </li>
          </ul>
        </li>
        <li>
          <code>[hellFieldDescription]</code> — neutral helper text (host directive
          <code>NgpDescription</code>), announced through the control's
          <code>aria-describedby</code>.
          <ul>
            <li>
              <code>ui: HellUiInput&lt;'root'&gt;</code>.
            </li>
          </ul>
        </li>
        <li>
          <code>[hellFieldError]</code> — validation error text (host directive
          <code>NgpError</code>, forwarding its <code>id</code> and
          <code>ngpErrorValidator</code> inputs), also announced through
          <code>aria-describedby</code>.
          <ul>
            <li>
              <code>ui: HellUiInput&lt;'root'&gt;</code>.
            </li>
          </ul>
        </li>
        <li>Import every directive at once via <code>HELL_FIELD_IMPORTS</code>.</li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          One <code>hellField</code> wraps one control. The control gets
          <code>aria-labelledby</code> pointing at every <code>hellFieldLabel</code> inside the
          field, and <code>aria-describedby</code> pointing at every
          <code>hellFieldDescription</code> / <code>hellFieldError</code> inside it — wiring is
          automatic as elements are added or removed.
        </li>
        <li>
          <code>hellFieldLabel</code> renders a real <code>for</code>/<code>id</code> pairing when
          it's an HTML <code>&lt;label&gt;</code>; clicking it moves focus to the control, and
          immediately toggles checkbox, switch, and radio roles instead of relying on native label
          click forwarding.
        </li>
        <li>
          This wiring only fires for controls built on Hell/ng-primitives form primitives (input,
          textarea, native select, checkbox, switch, select, combobox, date input, time input,
          radio, slider…). A plain unstyled <code>&lt;div&gt;</code> placeholder won't pick up the
          ids.
        </li>
        <li>
          <code>hellFieldError</code> itself doesn't set <code>aria-invalid</code> — pair it with
          the control's own <code>invalid</code> input (for example <code>hellInput</code>'s
          <code>invalid</code>) so the error is both visible and programmatically flagged.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Wrap every form control in <code>hellField</code>, even ones that feel "obvious".</li>
        <li>Use horizontal orientation for compact, single-line control + label pairs.</li>
        <li>Keep error copy specific and actionable, and set the control's <code>invalid</code> input alongside it.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't put more than one unrelated control inside one field — labels and descriptions would apply to all of them.</li>
        <li>Don't replace a label with a placeholder; placeholders disappear once the user starts typing.</li>
        <li>Don't show both a description and an error for the same state — swap the description out when the error appears.</li>
      </ul>
    </article>
  `,
})
export class FieldPage {
  protected readonly fieldBasicExampleCode = fieldBasicExampleCodeRaw;
  protected readonly fieldOrientationExampleCode = fieldOrientationExampleCodeRaw;
  protected readonly fieldValidationExampleCode = fieldValidationExampleCodeRaw;
  protected readonly fieldWithFormSectionExampleCode = fieldWithFormSectionExampleCodeRaw;
  protected readonly fieldAllPartsStylingExampleCode = fieldAllPartsStylingExampleCodeRaw;
}
