import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { DateInputBasicExample } from './examples/basic.example';
import dateInputBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { DateInputBoundsAndValidationExample } from './examples/bounds-and-validation.example';
import dateInputBoundsAndValidationExampleCodeRaw from './examples/bounds-and-validation.example.ts?raw' with {
  loader: 'text',
};
import { DateInputFormsExample } from './examples/forms.example';
import dateInputFormsExampleCodeRaw from './examples/forms.example.ts?raw' with {
  loader: 'text',
};
import { DateInputReactiveFormsExample } from './examples/reactive-forms.example';
import dateInputReactiveFormsExampleCodeRaw from './examples/reactive-forms.example.ts?raw' with {
  loader: 'text',
};
import { DateInputSizesExample } from './examples/sizes.example';
import dateInputSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { DateInputStylingExample } from './examples/styling.example';
import dateInputStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};
import { DateInputWithCalendarPickerExample } from './examples/with-calendar-picker.example';
import dateInputWithCalendarPickerExampleCodeRaw from './examples/with-calendar-picker.example.ts?raw' with {
  loader: 'text',
};
import { DateInputWithFieldFilterRowExample } from './examples/with-field-filter-row.example';
import dateInputWithFieldFilterRowExampleCodeRaw from './examples/with-field-filter-row.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-date-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    RouterLink,
    DateInputBasicExample,
    DateInputBoundsAndValidationExample,
    DateInputFormsExample,
    DateInputReactiveFormsExample,
    DateInputSizesExample,
    DateInputStylingExample,
    DateInputWithCalendarPickerExample,
    DateInputWithFieldFilterRowExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Date input"
        icon="faSolidCalendarDay"
        category="Styled primitive"
        importPath="@hell-ui/angular/date-input"
        stylesPath="@hell-ui/angular/date-input/styles.css"
      >
        Date parsing, formatting, validation, and forms behavior on a real native input.
      </hd-page-header>

      <p>
        Apply <code>hellDateInput</code> to an <code>&lt;input&gt;</code>. The native element keeps
        its focus, keyboard, event, attribute, Field, and form semantics while the directive owns
        the Typed Value Input state machine: drafts, strict parsing, stable formatting, validation
        state, nullable clears, and external synchronization. The <code>value</code> model is the
        one committed <code>Date | null</code> authority — bind it one-way (<code>[value]</code>
        plus <code>(valueChange)</code>), two-way (<code>[(value)]</code>), or through Angular
        forms.
      </p>
      <p>
        The directive reuses the single-host <a routerLink="/components/input">Input</a> styling
        contract. Its <code>size</code> and <code>ui</code> bindings therefore refine only the real
        input root. Calendar buttons, popovers, and
        <a routerLink="/components/date-picker">Date Picker</a> are separate composition concerns,
        not hidden Date Input anatomy.
      </p>

      <h2>Controlled value</h2>
      <p>
        The default adapter accepts only <code>YYYY-MM-DD</code>. A valid blur or Enter commits a
        local-calendar date; empty text commits <code>null</code>. Partial or malformed text remains
        visible as an invalid draft without emitting a replacement value.
      </p>
      <hd-example-tabs [code]="dateInputBasicExampleCode" previewClass="grid max-w-sm gap-2">
        <app-date-input-basic-example />
      </hd-example-tabs>

      <h2>Calendar composition recipe</h2>
      <p>
        When picking is useful, compose the real Date Input inside
        <a routerLink="/components/control-group">Control Group</a>, add a consumer-owned action,
        and open Date Picker through Popover. The recipe below keeps one value model in the form
        control. Selecting a day updates that model, closes the popover, and focuses the input;
        Escape closes and restores focus to the trigger through the Popover contract.
      </p>
      <hd-example-tabs
        [code]="dateInputWithCalendarPickerExampleCode"
        previewClass="grid gap-2"
      >
        <app-date-input-with-calendar-picker-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <p>
        <code>sm</code>, <code>md</code>, and <code>lg</code> come directly from the reused Input
        root contract; they do not imply picker or trigger geometry.
      </p>
      <hd-example-tabs [code]="dateInputSizesExampleCode" previewClass="grid max-w-sm gap-3">
        <app-date-input-sizes-example />
      </hd-example-tabs>

      <h2>Required, bounds, invalid, and disabled</h2>
      <p>
        <code>required</code>, <code>disabled</code>, <code>min</code>, and <code>max</code> are
        reflected on the native input and drive Date Input's invalid state. Bounds are inclusive
        and typed <code>Date | undefined</code> (<code>null</code> bindings still mean unbounded).
        The <code>invalid</code> input remains an explicit presentation override; malformed
        drafts, missing required values, and out-of-range committed values become invalid
        automatically, and bound forms drive the same <code>required</code>,
        <code>disabled</code>, <code>invalid</code>, <code>min</code>, and <code>max</code>
        inputs.
      </p>
      <hd-example-tabs
        [code]="dateInputBoundsAndValidationExampleCode"
        previewClass="grid max-w-sm gap-3"
      >
        <app-date-input-bounds-and-validation-example />
      </hd-example-tabs>

      <h2>Signal Forms</h2>
      <p>
        Date Input implements Signal Forms' <code>FormValueControl&lt;Date | null&gt;</code>: bind
        a field via <code>[formField]</code> and the field writes into <code>value</code>, user
        commits update the field exactly once, and blur emits <code>(touch)</code> to mark it
        touched. The field's <code>required()</code>, <code>minDate()</code>, and
        <code>maxDate()</code> rules flow into the matching inputs, so schema bounds and the
        native <code>min</code>/<code>max</code> attributes stay aligned. Draft text stays
        interaction state: an unparseable or out-of-range committed draft never becomes a value —
        instead the commit reports one <code>invalidDateInputDraft</code> parse error to the
        nearest field through Angular's <code>transformedValue</code> contract, and a later valid
        or empty commit clears it.
      </p>
      <hd-example-tabs [code]="dateInputFormsExampleCode" previewClass="grid max-w-md gap-2">
        <app-date-input-forms-example />
      </hd-example-tabs>

      <h2>Reactive forms and Field</h2>
      <p>
        <code>formControl</code> and <code>ngModel</code> bind the same <code>value</code> model
        through Angular's built-in Signal Forms interoperability — no
        <code>ControlValueAccessor</code> is involved anymore. Programmatic writes never emit
        <code>valueChange</code>; user commits update the form before blur marks it touched.
        Validation policy belongs to the form: declare required and range rules on the control
        itself, while an unparseable committed draft simply never commits and keeps the input's
        visual invalid state until corrected. Equivalent external writes preserve active typing,
        while genuinely changed values replace stale drafts. An enclosing
        <a routerLink="/components/field">Field</a> associates its label, descriptions, and errors
        with this same native input.
      </p>
      <hd-example-tabs
        [code]="dateInputReactiveFormsExampleCode"
        previewClass="grid max-w-md gap-4"
      >
        <app-date-input-reactive-forms-example />
      </hd-example-tabs>

      <h2>Filter-row recipe</h2>
      <p>
        Date ranges remain application composition: use two Date Inputs, cross-bind their bounds,
        and clear the two controlled values with a normal Button.
      </p>
      <hd-example-tabs
        [code]="dateInputWithFieldFilterRowExampleCode"
        previewClass="grid gap-2"
      >
        <app-date-input-with-field-filter-row-example />
      </hd-example-tabs>

      <h2>Adapter</h2>
      <p>
        Override parsing and display policy per injector with
        <code>provideHellDateInputAdapter</code>. A <code>HellDateInputAdapter</code> supplies
        <code>parseText</code>, <code>format</code>, and optional <code>normalize</code>,
        <code>isSameValue</code>, and <code>isWithinBounds</code> hooks. Return
        <code>hellTypedValue(value)</code> for a commit, <code>hellTypedValue(null)</code> for a
        clear, or <code>hellInvalidTypedValue()</code> to retain an invalid draft.
      </p>

      <h2>Styling</h2>
      <p>
        Date Input has no owned multi-part anatomy. Its <code>ui</code> binding is the reused Input
        root map, so a string or <code>{{ '{ root: "…" }' }}</code> refines the native input only.
        Style a composed Control Group, action, Popover, and Date Picker at each primitive's own
        local Part Style Map.
      </p>
      <hd-example-tabs [code]="dateInputStylingExampleCode" previewClass="grid max-w-sm gap-2">
        <app-date-input-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <table class="hd-doc-table">
        <thead>
          <tr><th>Interface</th><th>Type</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>input[hellDateInput]</code></td>
            <td>directive</td>
            <td>Typed date drafts, commits, validation, and forms behavior on the native host.</td>
          </tr>
          <tr>
            <td><code>value</code> / <code>valueChange</code></td>
            <td><code>ModelSignal&lt;Date | null&gt;</code></td>
            <td>
              One committed value authority: <code>[value]</code>, <code>[(value)]</code>,
              <code>[formField]</code>, <code>formControl</code>, and <code>ngModel</code>.
            </td>
          </tr>
          <tr>
            <td><code>required</code>, <code>disabled</code>, <code>invalid</code></td>
            <td><code>boolean</code></td>
            <td>Native required/disabled state and invalid override; also driven by bound forms.</td>
          </tr>
          <tr>
            <td><code>min</code>, <code>max</code></td>
            <td><code>Date | undefined</code></td>
            <td>
              Inclusive typed bounds in stable adapter format; also driven by a bound field's
              <code>minDate()</code>/<code>maxDate()</code> metadata.
            </td>
          </tr>
          <tr>
            <td><code>touch</code></td>
            <td><code>OutputRef&lt;void&gt;</code></td>
            <td>Emits on blur; Angular forms use it to mark the field or control touched.</td>
          </tr>
          <tr>
            <td><code>id</code></td>
            <td><code>string</code></td>
            <td>Native id; generated when omitted and used for Field label association.</td>
          </tr>
          <tr>
            <td><code>size</code>, <code>ui</code></td>
            <td>Input root contract</td>
            <td>Single-host visual refinement delegated to HellInput.</td>
          </tr>
          <tr>
            <td><code>aria-describedby</code>, <code>aria-labelledby</code></td>
            <td><code>string | null</code></td>
            <td>Native id references merged with an enclosing Field.</td>
          </tr>
        </tbody>
      </table>

      <h2>Migration to one Control Value Authority</h2>
      <ul>
        <li>
          <code>value</code> is now a <code>ModelSignal&lt;Date | null&gt;</code>:
          <code>[value]</code> plus <code>(valueChange)</code> behave as before, and
          <code>[(value)]</code> two-way binding is new. Model inputs take no static-attribute
          coercion; a typed <code>Date | null</code> binding was already required.
        </li>
        <li>
          The directive no longer implements <code>ControlValueAccessor</code> or
          <code>Validator</code>. <code>formControl</code> and <code>ngModel</code> keep working
          through Angular's Signal Forms interoperability, but the directive writes no errors
          onto classic controls anymore: <code>invalidDateInputDraft</code>,
          <code>required</code>, and <code>outOfRangeDate</code> control errors are gone. Parse
          failures are reported as <code>invalidDateInputDraft</code> field errors in Signal
          Forms only.
        </li>
        <li>
          Declare required and range policy on the form — <code>Validators.required</code> or
          your own range validator for classic controls, or
          <code>required()</code>/<code>minDate()</code>/<code>maxDate()</code> schema rules for
          Signal Forms — and the input keeps reflecting missing required values, out-of-range
          committed values, and invalid drafts visually.
        </li>
        <li>
          <code>min</code>/<code>max</code> are typed <code>Date | undefined</code> instead of
          <code>Date | null</code>; <code>null</code> bindings still mean unbounded.
        </li>
      </ul>

      <h2>Migration from the owned component</h2>
      <ul>
        <li>
          Replace <code>&lt;hell-date-input [date]="date" (dateChange)="…" /&gt;</code> with
          <code>&lt;input hellDateInput [value]="date" (valueChange)="…" /&gt;</code>. There is no
          old-selector or <code>date</code>/<code>dateChange</code> alias.
        </li>
        <li>
          Move <code>inputId</code>, <code>name</code>, <code>placeholder</code>, input mode,
          autocomplete, and other element attributes directly onto the native input.
        </li>
        <li>
          Replace the old <code>root</code>, <code>input</code>, <code>trigger</code>,
          <code>triggerIcon</code>, and <code>pickerPanel</code> Date Input parts with local
          <code>ui</code> maps on Input, Control Group/action or Button, Popover, Icon, and Date
          Picker as shown in the composition recipe.
        </li>
        <li>
          Author the calendar trigger and its accessible label in consumer markup. The former
          Date Input trigger Label Contract is removed with the owned trigger.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>The host is the focusable native input; no wrapper or hidden field intercepts events.</li>
        <li>
          <code>aria-invalid</code>, native <code>required</code>/<code>disabled</code>, and Field
          label/description ids reflect on that same host.
        </li>
        <li>
          Enter commits typed text without cancelling native form submission; blur commits and marks
          the control touched.
        </li>
        <li>
          A composed icon trigger needs its own accessible name. Popover owns open, Escape, and
          dismissal behavior; the recipe deliberately returns focus to the input after selection.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use a visible Field label or a native <code>aria-label</code> on standalone inputs.</li>
        <li>Use the strict default ISO format for stable business dates, or replace the adapter coherently.</li>
        <li>Add a picker only when calendar navigation materially helps the workflow.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't create a second picker-owned value model; update the same controlled value or form control.</li>
        <li>Don't hide the input when a calendar exists; typing and native focus remain first-class.</li>
        <li>Don't target removed Date Input anatomy; style each composed primitive locally.</li>
      </ul>
    </article>
  `,
})
export class DateInputPage {
  protected readonly dateInputBasicExampleCode = dateInputBasicExampleCodeRaw;
  protected readonly dateInputBoundsAndValidationExampleCode =
    dateInputBoundsAndValidationExampleCodeRaw;
  protected readonly dateInputFormsExampleCode = dateInputFormsExampleCodeRaw;
  protected readonly dateInputReactiveFormsExampleCode = dateInputReactiveFormsExampleCodeRaw;
  protected readonly dateInputSizesExampleCode = dateInputSizesExampleCodeRaw;
  protected readonly dateInputStylingExampleCode = dateInputStylingExampleCodeRaw;
  protected readonly dateInputWithCalendarPickerExampleCode =
    dateInputWithCalendarPickerExampleCodeRaw;
  protected readonly dateInputWithFieldFilterRowExampleCode =
    dateInputWithFieldFilterRowExampleCodeRaw;
}
