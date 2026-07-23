import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { TimeInputBasicExample } from './examples/basic.example';
import timeInputBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { TimeInputFormsExample } from './examples/forms.example';
import timeInputFormsExampleCodeRaw from './examples/forms.example.ts?raw' with {
  loader: 'text',
};
import { TimeInputReactiveFormsExample } from './examples/reactive-forms.example';
import timeInputReactiveFormsExampleCodeRaw from './examples/reactive-forms.example.ts?raw' with {
  loader: 'text',
};
import { TimeInputSecondsAndValidationExample } from './examples/seconds-and-validation.example';
import timeInputSecondsAndValidationExampleCodeRaw from './examples/seconds-and-validation.example.ts?raw' with {
  loader: 'text',
};
import { TimeInputSizesExample } from './examples/sizes.example';
import timeInputSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { TimeInputStylingExample } from './examples/styling.example';
import timeInputStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};
import { TimeInputWithFieldScheduleRowExample } from './examples/with-field-schedule-row.example';
import timeInputWithFieldScheduleRowExampleCodeRaw from './examples/with-field-schedule-row.example.ts?raw' with {
  loader: 'text',
};
import { TimeInputWithTimePickerExample } from './examples/with-time-picker.example';
import timeInputWithTimePickerExampleCodeRaw from './examples/with-time-picker.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-time-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    RouterLink,
    TimeInputBasicExample,
    TimeInputFormsExample,
    TimeInputReactiveFormsExample,
    TimeInputSecondsAndValidationExample,
    TimeInputSizesExample,
    TimeInputStylingExample,
    TimeInputWithFieldScheduleRowExample,
    TimeInputWithTimePickerExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Time input"
        icon="faSolidClock"
        category="Styled primitive"
        importPath="hell-ui/time-input"
        stylesPath="hell-ui/time-input/styles.css"
      >
        Time parsing, formatting, validation, and forms behavior on a real native input.
      </hd-page-header>

      <p>
        Apply <code>hellTimeInput</code> to an <code>&lt;input&gt;</code>. The native element keeps
        its focus, keyboard, event, attribute, Field, and form-submission semantics while the
        directive owns the Typed Value Input state machine: drafts, strict parsing, stable
        formatting, validation state, nullable clears, and external synchronization. The
        <code>value</code> model is the one committed <code>HellTimeValue | null</code> authority
        — bind it one-way (<code>[value]</code> plus <code>(valueChange)</code>), two-way
        (<code>[(value)]</code>), or through Angular forms.
      </p>
      <p>
        The directive reuses the single-host <a routerLink="/components/input">Input</a> styling
        contract. Its <code>size</code> and <code>ui</code> bindings therefore refine only the real
        input root. Clock actions, popovers, and
        <a routerLink="/components/time-picker">Time Picker</a> are separate composition concerns,
        not hidden Time Input anatomy.
      </p>

      <h2>Controlled value</h2>
      <p>
        The default adapter accepts <code>HH:mm</code>, compact digits such as <code>930</code>, and
        common 12-hour forms such as <code>9:30 am</code>. A valid blur or Enter commits a structured
        time; empty text commits <code>null</code>. Partial, malformed, or out-of-range text remains
        visible as an invalid draft without replacing the committed value.
      </p>
      <p>
        The directive does not force an input type. Keep the default text input for compact,
        12-hour, or custom-adapter formats and visible invalid drafts. Author
        <code>type="time"</code> only when browser-sanitized native time editing is the intended
        policy.
      </p>
      <hd-example-tabs [code]="timeInputBasicExampleCode" previewClass="grid max-w-sm gap-2">
        <app-time-input-basic-example />
      </hd-example-tabs>

      <h2>Time Picker composition recipe</h2>
      <p>
        When visual selection is useful, compose the real Time Input inside
        <a routerLink="/components/control-group">Control Group</a>, add a consumer-owned action,
        and open the standalone Time Picker through Popover. The recipe below keeps one
        <code>FormControl</code> value model. Picker interactions update that model without closing
        the surface; the explicit Done action closes and returns focus to the input. Escape closes
        and restores focus to the trigger through the Popover contract.
      </p>
      <hd-example-tabs
        [code]="timeInputWithTimePickerExampleCode"
        previewClass="grid gap-2"
      >
        <app-time-input-with-time-picker-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <p>
        <code>sm</code>, <code>md</code>, and <code>lg</code> come directly from the reused Input root
        contract; they do not imply picker or trigger geometry.
      </p>
      <hd-example-tabs [code]="timeInputSizesExampleCode" previewClass="grid max-w-sm gap-3">
        <app-time-input-sizes-example />
      </hd-example-tabs>

      <h2>Seconds, bounds, and validation</h2>
      <p>
        Add <code>seconds</code> to parse and format <code>HH:mm:ss</code> and reflect a native
        <code>step</code> of <code>1</code>; the default minute precision reflects
        <code>60</code>. <code>min</code> and <code>max</code> are inclusive structured same-day
        bounds typed <code>HellTimeValue | undefined</code> (<code>null</code> bindings still
        mean unbounded). <code>required</code>, <code>disabled</code>, and the explicit
        <code>invalid</code> presentation override all reflect on the native input and are also
        driven by bound forms. Malformed drafts, missing required values, and out-of-range values
        become invalid automatically.
      </p>
      <hd-example-tabs
        [code]="timeInputSecondsAndValidationExampleCode"
        previewClass="grid max-w-md gap-3"
      >
        <app-time-input-seconds-and-validation-example />
      </hd-example-tabs>

      <h2>Signal Forms</h2>
      <p>
        Time Input implements Signal Forms'
        <code>FormValueControl&lt;HellTimeValue | null&gt;</code>: bind a field via
        <code>[formField]</code> and the field writes into <code>value</code>, user commits update
        the field exactly once, and blur emits <code>(touch)</code> to mark it touched. The
        field's <code>required()</code> and <code>disabled()</code> rules flow into the matching
        inputs. Structured times have no <code>minDate()</code>/<code>maxDate()</code>
        equivalent, so range policy stays a schema-owned <code>validate</code> rule; the field's
        errors still drive the reserved <code>invalid</code> input back onto the native host.
        Draft text stays interaction state: an unparseable committed draft never becomes a value —
        instead the commit reports one <code>invalidTimeInputDraft</code> parse error to the
        nearest field through Angular's <code>transformedValue</code> contract, and a later valid
        or empty commit clears it.
      </p>
      <hd-example-tabs [code]="timeInputFormsExampleCode" previewClass="grid max-w-md gap-2">
        <app-time-input-forms-example />
      </hd-example-tabs>

      <h2>Reactive forms and Field</h2>
      <p>
        <code>formControl</code> and <code>ngModel</code> bind the same <code>value</code> model
        through Angular's built-in Signal Forms interoperability — no
        <code>ControlValueAccessor</code> is involved anymore. Programmatic writes never emit
        <code>valueChange</code>; user commits update the form before blur marks it touched.
        Validation policy belongs to the form: declare required and range rules on the control
        itself, while an unparseable or out-of-bounds committed draft simply never commits and
        keeps the input's visual invalid state until corrected. Equivalent external writes
        preserve active typing, while genuinely changed values replace stale drafts. An enclosing
        <a routerLink="/components/field">Field</a> associates its label, descriptions, and errors
        with this same native input.
      </p>
      <hd-example-tabs
        [code]="timeInputReactiveFormsExampleCode"
        previewClass="grid max-w-md gap-4"
      >
        <app-time-input-reactive-forms-example />
      </hd-example-tabs>

      <h2>Schedule-row recipe</h2>
      <p>
        Scheduling remains application composition: use a Date Input for the day and two Time
        Inputs for start and end. Each native control keeps its own visible Field label while the
        application owns range policy and timezone context.
      </p>
      <hd-example-tabs [code]="timeInputWithFieldScheduleRowExampleCode">
        <app-time-input-with-field-schedule-row-example />
      </hd-example-tabs>

      <h2>Adapter</h2>
      <p>
        Override parsing and display policy per injector with
        <code>provideHellTimeInputAdapter</code>. A <code>HellTimeInputAdapter</code> supplies
        <code>parseText</code>, <code>format</code>, and optional <code>normalize</code>,
        <code>isSameValue</code>, and <code>isWithinBounds</code> hooks. Return
        <code>hellTypedValue(value)</code> for a commit, <code>hellTypedValue(null)</code> for a
        clear, or <code>hellInvalidTypedValue()</code> to retain an invalid draft.
        <code>parseText</code>, <code>format</code>, <code>normalize</code>, and
        <code>isWithinBounds</code> receive the active <code>seconds</code> precision through
        <code>HellTimeInputAdapterContext</code>; <code>isSameValue</code> compares normalized values.
      </p>

      <h2>Styling</h2>
      <p>
        Time Input has no owned multi-part anatomy. Its <code>ui</code> binding is the reused Input
        root map, so a string or <code>{{ '{ root: "…" }' }}</code> refines the native input only.
        Style a composed Control Group, action, Popover, Icon, and Time Picker at each primitive's
        own local Part Style Map. Import
        <code>hell-ui/time-picker/styles.css</code> separately when rendering the picker;
        Time Input's stylesheet no longer includes it.
      </p>
      <hd-example-tabs [code]="timeInputStylingExampleCode" previewClass="grid max-w-sm gap-2">
        <app-time-input-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <table class="hd-doc-table">
        <thead>
          <tr><th>Interface</th><th>Type</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>input[hellTimeInput]</code></td>
            <td>directive</td>
            <td>Typed time drafts, commits, validation, and forms behavior on the native host.</td>
          </tr>
          <tr>
            <td><code>value</code> / <code>valueChange</code></td>
            <td><code>ModelSignal&lt;HellTimeValue | null&gt;</code></td>
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
            <td><code>HellTimeValue | undefined</code></td>
            <td>Inclusive same-day bounds, also reflected in stable adapter format.</td>
          </tr>
          <tr>
            <td><code>touch</code></td>
            <td><code>OutputRef&lt;void&gt;</code></td>
            <td>Emits on blur; Angular forms use it to mark the field or control touched.</td>
          </tr>
          <tr>
            <td><code>seconds</code></td>
            <td><code>boolean</code></td>
            <td>Includes seconds in parsing, formatting, bounds, and native step metadata.</td>
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
      <p>
        Native attributes such as <code>name</code>, <code>placeholder</code>,
        <code>autocomplete</code>, and <code>aria-label</code> stay consumer-authored on the
        host; a named input participates in native form serialization.
      </p>

      <h2>Migration to one Control Value Authority</h2>
      <ul>
        <li>
          <code>value</code> is now a <code>ModelSignal&lt;HellTimeValue | null&gt;</code>:
          <code>[value]</code> plus <code>(valueChange)</code> behave as before, and
          <code>[(value)]</code> two-way binding is new. Model inputs take no static-attribute
          coercion; a typed <code>HellTimeValue | null</code> binding was already required.
        </li>
        <li>
          The directive no longer implements <code>ControlValueAccessor</code> or
          <code>Validator</code>. <code>formControl</code> and <code>ngModel</code> keep working
          through Angular's Signal Forms interoperability, but the directive writes no errors
          onto classic controls anymore: <code>invalidTimeInputDraft</code>,
          <code>required</code>, and <code>outOfRangeTime</code> control errors are gone. Parse
          failures are reported as <code>invalidTimeInputDraft</code> field errors in Signal
          Forms only.
        </li>
        <li>
          Declare required and range policy on the form — <code>Validators.required</code> or
          your own range validator for classic controls, or <code>required()</code> and a
          <code>validate</code> range rule for Signal Forms — and the input keeps reflecting
          missing required values, out-of-range committed values, and invalid drafts visually.
        </li>
        <li>
          <code>min</code>/<code>max</code> are typed <code>HellTimeValue | undefined</code>
          instead of <code>HellTimeValue | null</code>; <code>null</code> bindings still mean
          unbounded.
        </li>
      </ul>

      <h2>Migration from the owned component</h2>
      <ul>
        <li>
          Replace <code>&lt;hell-time-input inputId="start" … /&gt;</code> with
          <code>&lt;input id="start" hellTimeInput … /&gt;</code>. There is no old-selector or
          <code>inputId</code> alias.
        </li>
        <li>
          Move <code>name</code>, <code>placeholder</code>, input type, autocomplete, and other
          element attributes directly onto the native input.
        </li>
        <li>
          Replace the old <code>root</code>, <code>input</code>, <code>trigger</code>,
          <code>triggerIcon</code>, <code>pickerPanel</code>, and <code>picker*</code> Time Input
          parts with local <code>ui</code> maps on Input, Control Group/action or Button, Popover,
          Icon, and Time Picker as shown in the composition recipe.
        </li>
        <li>
          Author the picker trigger, its accessible label, the close action, and focus policy in
          consumer markup. The former Time Input trigger and picker Label Contract is removed with
          the owned anatomy.
        </li>
        <li>
          Add <code>hell-ui/time-picker/styles.css</code> when composing Time Picker;
          <code>time-input/styles.css</code> now ships only the native input recipe source.
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
          dismissal behavior; the recipe deliberately returns focus to the input after Done.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use a visible Field label or a native <code>aria-label</code> on standalone inputs.</li>
        <li>Use <code>seconds</code> only when the workflow genuinely needs second precision.</li>
        <li>Add a picker only when segmented visual selection materially helps the workflow.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't create a second picker-owned value model; update the same controlled value or form control.</li>
        <li>Don't hide the input when a Time Picker exists; typing and native focus remain first-class.</li>
        <li>Don't target removed Time Input anatomy; style each composed primitive locally.</li>
        <li>Don't omit timezone context in scheduling flows; <code>HellTimeValue</code> carries none.</li>
      </ul>
    </article>
  `,
})
export class TimeInputPage {
  protected readonly timeInputBasicExampleCode = timeInputBasicExampleCodeRaw;
  protected readonly timeInputFormsExampleCode = timeInputFormsExampleCodeRaw;
  protected readonly timeInputReactiveFormsExampleCode = timeInputReactiveFormsExampleCodeRaw;
  protected readonly timeInputSecondsAndValidationExampleCode =
    timeInputSecondsAndValidationExampleCodeRaw;
  protected readonly timeInputSizesExampleCode = timeInputSizesExampleCodeRaw;
  protected readonly timeInputStylingExampleCode = timeInputStylingExampleCodeRaw;
  protected readonly timeInputWithFieldScheduleRowExampleCode =
    timeInputWithFieldScheduleRowExampleCodeRaw;
  protected readonly timeInputWithTimePickerExampleCode = timeInputWithTimePickerExampleCodeRaw;
}
