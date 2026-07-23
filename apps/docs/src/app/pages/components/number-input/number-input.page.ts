import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { NumberInputBasicExample } from './examples/basic.example';
import numberInputBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { NumberInputDurationSecondsExample } from './examples/duration-seconds.example';
import numberInputDurationSecondsExampleCodeRaw from './examples/duration-seconds.example.ts?raw' with {
  loader: 'text',
};
import { NumberInputFormsExample } from './examples/forms.example';
import numberInputFormsExampleCodeRaw from './examples/forms.example.ts?raw' with {
  loader: 'text',
};
import { NumberInputReactiveFormsExample } from './examples/reactive-forms.example';
import numberInputReactiveFormsExampleCodeRaw from './examples/reactive-forms.example.ts?raw' with {
  loader: 'text',
};
import { NumberInputSizesExample } from './examples/sizes.example';
import numberInputSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { NumberInputStylingExample } from './examples/styling.example';
import numberInputStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-number-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    RouterLink,
    NumberInputBasicExample,
    NumberInputDurationSecondsExample,
    NumberInputFormsExample,
    NumberInputReactiveFormsExample,
    NumberInputSizesExample,
    NumberInputStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Number input"
        icon="faSolidHashtag"
        category="Styled primitive"
        importPath="hell-ui/number-input"
        stylesPath="hell-ui/number-input/styles.css"
      >
        Numeric parsing, validation, stepping, and forms behavior on a real native input.
      </hd-page-header>

      <p>
        Apply <code>hellNumberInput</code> to an authored <code>&lt;input&gt;</code>. The directive
        owns the Typed Value Input state machine—drafts, parsing, formatting, validation state,
        and keyboard stepping—while the native element keeps focus, events, attributes, Field
        association, and form-submission semantics. The <code>value</code> model is the one
        committed <code>number | null</code> authority — bind it one-way (<code>[value]</code>
        plus <code>(valueChange)</code>), two-way (<code>[(value)]</code>), or through Angular
        forms.
      </p>
      <p>
        The default adapter deliberately uses a text field with decimal or numeric
        <code>inputmode</code>. It rejects exponent notation and preserves malformed drafts instead
        of letting native <code>type="number"</code> sanitization erase them. Date, Time, and Number
        Input remain separate semantic behaviors even though they share this draft/commit model.
      </p>

      <h2>Basic composition</h2>
      <p>
        The input is the only value controller. Export it as <code>hellNumberInput</code> and bind
        each <code>hellNumberStep</code> button through <code>hellNumberStepFor</code>. The
        directional buttons compose in a
        <a routerLink="/components/control-group">Control Group</a>; there is no hidden stepper
        flag or second value model.
      </p>
      <hd-example-tabs [code]="numberInputBasicExampleCode">
        <app-number-input-basic-example />
      </hd-example-tabs>

      <h2>Projected suffix and accessible value text</h2>
      <p>
        Units are consumer-owned content through <code>hellControlGroupSuffix</code>. Keep the
        model numeric and author <code>aria-valuetext</code> on the input when the unit changes how
        assistive technology should announce the value. The behavior never reads visible suffix
        text or turns it into a string API.
      </p>
      <hd-example-tabs
        [code]="numberInputDurationSecondsExampleCode"
        previewClass="grid max-w-sm gap-3"
      >
        <app-number-input-duration-seconds-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <p>
        The input reuses the single-root Input <code>size</code> and <code>ui</code> contract.
        When it sits in a Control Group, set the group and input size together and let each
        projected directive own its local root styling.
      </p>
      <hd-example-tabs [code]="numberInputSizesExampleCode" previewClass="grid max-w-xs gap-3">
        <app-number-input-sizes-example />
      </hd-example-tabs>

      <h2>Signal Forms</h2>
      <p>
        Number Input implements Signal Forms'
        <code>FormValueControl&lt;number | null&gt;</code>: bind a field via
        <code>[formField]</code> and the field writes into <code>value</code>, user commits and
        steps update the field exactly once, and blur or stepping emits <code>(touch)</code> to
        mark it touched. The field's <code>required()</code>, <code>min()</code>, and
        <code>max()</code> rules flow into the matching inputs, so schema bounds drive the
        spinbutton ARIA metadata, Home/End jumps, and stepper disabling. Draft text stays
        interaction state: a malformed committed draft never becomes a value — instead the commit
        reports one <code>invalidNumberInputDraft</code> parse error to the nearest field through
        Angular's <code>transformedValue</code> contract, and a later valid or empty commit
        clears it.
      </p>
      <hd-example-tabs [code]="numberInputFormsExampleCode" previewClass="grid max-w-md gap-2">
        <app-number-input-forms-example />
      </hd-example-tabs>

      <h2>Reactive forms and validation</h2>
      <p>
        <code>formControl</code> and <code>ngModel</code> bind the same <code>value</code> model
        through Angular's built-in Signal Forms interoperability — no
        <code>ControlValueAccessor</code> is involved anymore. Programmatic writes never emit
        <code>valueChange</code>; user commits update the form before blur marks it touched.
        Validation policy belongs to the form: declare required and range rules on the control
        itself, while a malformed committed draft simply never commits and keeps the input's
        visual invalid state until corrected. Typing never clamps; arrows and step buttons do.
      </p>
      <hd-example-tabs
        [code]="numberInputReactiveFormsExampleCode"
        previewClass="grid max-w-md gap-3"
      >
        <app-number-input-reactive-forms-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Number Input no longer owns multi-part anatomy. The input and each Number Step expose one
        local <code>root</code> Part through <code>ui: HellUiInput&lt;'root'&gt;</code>; Control
        Group and its projected suffix expose their own root maps. Refine each directive where it
        owns DOM instead of passing a remote object map into the value controller.
      </p>
      <hd-example-tabs [code]="numberInputStylingExampleCode">
        <app-number-input-styling-example />
      </hd-example-tabs>

      <h2>Input API</h2>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Interface</th>
            <th>Contract</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>input[hellNumberInput]</code></td>
            <td>
              Native directive and <code>exportAs="hellNumberInput"</code>. Keep native
              <code>id</code>, <code>name</code>, <code>placeholder</code>, autocomplete, and
              labeling attributes on this element.
            </td>
          </tr>
          <tr>
            <td><code>value</code> / <code>(valueChange)</code></td>
            <td>
              One committed <code>ModelSignal&lt;number | null&gt;</code> authority:
              <code>[value]</code>, <code>[(value)]</code>, <code>[formField]</code>,
              <code>formControl</code>, and <code>ngModel</code>.
            </td>
          </tr>
          <tr>
            <td><code>min</code> / <code>max</code></td>
            <td>
              Inclusive <code>number | undefined</code> bounds for invalid state, ARIA metadata,
              and stepping; also driven by a bound field's <code>min()</code>/<code>max()</code>
              metadata.
            </td>
          </tr>
          <tr>
            <td><code>touch</code></td>
            <td>
              Emits on blur and after stepping; Angular forms use it to mark the field or control
              touched.
            </td>
          </tr>
          <tr>
            <td><code>step</code> / <code>stepMultiplier</code></td>
            <td>Default <code>1</code> and <code>10</code>; Shift and Page keys use the multiplier.</td>
          </tr>
          <tr>
            <td><code>integer</code></td>
            <td>Rejects fractional drafts and switches <code>inputmode</code> to numeric.</td>
          </tr>
          <tr>
            <td><code>required</code>, <code>invalid</code>, <code>disabled</code></td>
            <td>Native state plus stable ARIA and <code>data-*</code> reflection.</td>
          </tr>
          <tr>
            <td><code>size</code> / <code>ui</code></td>
            <td>The composed Input directive's single-root styling contract.</td>
          </tr>
          <tr>
            <td><code>aria-describedby</code> / <code>aria-labelledby</code></td>
            <td>Authored ids merge with any enclosing Field associations.</td>
          </tr>
        </tbody>
      </table>

      <h2>Number Step API</h2>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Interface</th>
            <th>Contract</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>button[hellNumberStep]</code></td>
            <td>
              Required <code>'increment' | 'decrement'</code> direction. Project any glyph or copy;
              the directive defaults native type to <code>button</code> and stays out of tab order.
            </td>
          </tr>
          <tr>
            <td><code>hellNumberStepFor</code></td>
            <td>
              Required explicit controller reference, normally
              <code>#quantity="hellNumberInput"</code>.
            </td>
          </tr>
          <tr>
            <td><code>disabled</code></td>
            <td>Merges with target disabled state and directional bound disabling.</td>
          </tr>
          <tr>
            <td><code>aria-label</code></td>
            <td>
              Optional override; otherwise the Label Contract uses the input's accessible name.
            </td>
          </tr>
          <tr>
            <td><code>ui</code></td>
            <td>Single-root Number Step Part Style Map.</td>
          </tr>
        </tbody>
      </table>
      <p>
        <code>HELL_NUMBER_INPUT_IMPORTS</code> contains <code>HellNumberInput</code> and
        <code>HellNumberStep</code>. <code>HELL_NUMBER_INPUT_LABELS</code> owns the four default
        increment/decrement strings. <code>provideHellNumberInputAdapter</code> replaces parsing,
        formatting, normalization, and equality policy per injector scope.
      </p>

      <h2>Keyboard and pointer behavior</h2>
      <ul>
        <li>ArrowUp / ArrowDown apply one step; Shift applies <code>stepMultiplier</code>.</li>
        <li>PageUp / PageDown always apply the multiplied step.</li>
        <li>Home / End jump to <code>min</code> / <code>max</code> only when that bound exists.</li>
        <li>Enter commits without cancelling native form submission.</li>
        <li>A focused wheel event is cancelled so scrolling never mutates the numeric value.</li>
        <li>
          Number Step clicks commit a pending valid draft first, retain input focus, and repeat
          after a hold delay until release or a bound disables that direction.
        </li>
      </ul>

      <h2>Migration to one Control Value Authority</h2>
      <ul>
        <li>
          <code>value</code> is now a <code>ModelSignal&lt;number | null&gt;</code>:
          <code>[value]</code> plus <code>(valueChange)</code> behave as before, and
          <code>[(value)]</code> two-way binding is new. Model inputs take no static-attribute
          coercion; a typed <code>number | null</code> binding was already required.
        </li>
        <li>
          The directive no longer implements <code>ControlValueAccessor</code> or
          <code>Validator</code>. <code>formControl</code> and <code>ngModel</code> keep working
          through Angular's Signal Forms interoperability, but the directive writes no errors
          onto classic controls anymore: the <code>numberInputMalformed</code>,
          <code>required</code>, and <code>min</code>/<code>max</code> control errors are gone.
          Parse failures are reported as <code>invalidNumberInputDraft</code> field errors in
          Signal Forms only.
        </li>
        <li>
          Declare required and range policy on the form —
          <code>Validators.required</code>/<code>Validators.min</code>/<code>Validators.max</code>
          for classic controls, or <code>required()</code>/<code>min()</code>/<code>max()</code>
          schema rules for Signal Forms — and the input keeps reflecting missing required values,
          out-of-range committed values, and malformed drafts visually.
        </li>
        <li>
          <code>min</code>/<code>max</code> are typed <code>number | undefined</code> instead of
          <code>number | null</code>; <code>null</code> bindings still mean unbounded.
        </li>
      </ul>

      <h2>Migration from owned anatomy</h2>
      <p>
        Replace the former <code>&lt;hell-number-input&gt;</code> host with a native
        <code>&lt;input hellNumberInput&gt;</code>. Move <code>inputId</code>, <code>name</code>,
        <code>placeholder</code>, autocomplete, and ARIA attributes directly onto it. Replace the
        removed <code>steppers</code> flag with explicit directional buttons and replace the
        removed <code>suffix</code> string with projected Control Group content plus authored
        <code>aria-valuetext</code>. The old five-part
        <code>HellNumberInputPart</code>/<code>HellNumberInputUi</code> map has no alias; style the
        input, steps, group, and suffix through their local root maps.
      </p>

      <h2>Accessibility</h2>
      <ul>
        <li>
          The input always exposes <code>role="spinbutton"</code>. It reflects bounds whenever
          present and omits only <code>aria-valuenow</code> while empty.
        </li>
        <li>
          Keep a visible Field label or native accessible name on the input. Step labels derive
          from it and remain overrideable through the Label Contract or native
          <code>aria-label</code>.
        </li>
        <li>
          Directional buttons stay <code>tabindex="-1"</code>; the input remains the one keyboard
          tab stop and owns the APG spinbutton keys.
        </li>
        <li>
          Bind visible unit meaning through <code>aria-valuetext</code>; projected suffix text is
          presentational and never the input's only accessible unit description.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Keep one value binding or bound form control on the native Number Input.</li>
        <li>Use explicit bounds and a visible label for business quantities.</li>
        <li>Compose only the unit and directional actions the workflow needs.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use native <code>type="number"</code> when invalid drafts or adapters matter.</li>
        <li>Don't query nearby inputs from a Number Step; bind its controller explicitly.</li>
        <li>Don't store a second numeric model in Control Group or projected content.</li>
      </ul>
    </article>
  `,
})
export class NumberInputPage {
  protected readonly numberInputBasicExampleCode = numberInputBasicExampleCodeRaw;
  protected readonly numberInputDurationSecondsExampleCode =
    numberInputDurationSecondsExampleCodeRaw;
  protected readonly numberInputFormsExampleCode = numberInputFormsExampleCodeRaw;
  protected readonly numberInputReactiveFormsExampleCode = numberInputReactiveFormsExampleCodeRaw;
  protected readonly numberInputSizesExampleCode = numberInputSizesExampleCodeRaw;
  protected readonly numberInputStylingExampleCode = numberInputStylingExampleCodeRaw;
}
