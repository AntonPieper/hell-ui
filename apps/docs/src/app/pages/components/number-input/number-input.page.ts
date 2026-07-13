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
import { NumberInputSizesExample } from './examples/sizes.example';
import numberInputSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { NumberInputReactiveFormsExample } from './examples/reactive-forms.example';
import numberInputReactiveFormsExampleCodeRaw from './examples/reactive-forms.example.ts?raw' with {
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
    NumberInputSizesExample,
    NumberInputReactiveFormsExample,
    NumberInputStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Number input"
        icon="faSolidHashtag"
        category="Styled primitive"
        importPath="@hell-ui/angular/number-input"
        stylesPath="@hell-ui/angular/number-input/styles.css"
      >
        A numeric text field that binds a real <code>number | null</code>: min/max/step validation,
        keyboard stepping, optional stepper buttons, and a unit suffix.
      </hd-page-header>
      <p>
        <code>hell-number-input</code> is a Typed Value Input, the same draft/parse/commit model
        behind <a routerLink="/components/date-input">Date input</a> and
        <a routerLink="/components/time-input">Time input</a>. It renders a text field — not a native
        <code>&lt;input type="number"&gt;</code> — so parsing, exponent rejection, and locale
        behavior stay deterministic, then layers APG spinbutton semantics on top: the current value,
        <code>min</code>, and <code>max</code> are reflected as ARIA attributes.
      </p>
      <p>
        It implements <code>ControlValueAccessor</code> and <code>Validator</code>, so it drops into
        reactive or template-driven forms and yields a genuine number instead of a string you have
        to cast and regex-check. Use it for ports, timeouts, priorities, counts, and rates.
      </p>

      <h2>Basic</h2>
      <p>
        A port field: integer-only, bounded to 1–65535, with stepper buttons. ArrowUp / ArrowDown
        step by one (hold Shift for a larger jump); Home / End jump to the bounds. Typing is never
        clamped — an out-of-range value commits but is flagged invalid.
      </p>
      <hd-example-tabs [code]="numberInputBasicExampleCode">
        <app-number-input-basic-example />
      </hd-example-tabs>

      <h2>Unit suffix</h2>
      <p>
        A <code>suffix</code> renders a self-describing unit after the value without wrapper markup.
        The suffix is presentational; the committed value stays a plain number and the unit is
        announced through <code>aria-valuetext</code>.
      </p>
      <hd-example-tabs [code]="numberInputDurationSecondsExampleCode" previewClass="grid gap-3 max-w-xs">
        <app-number-input-duration-seconds-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <hd-example-tabs [code]="numberInputSizesExampleCode" previewClass="grid gap-3 max-w-xs">
        <app-number-input-sizes-example />
      </hd-example-tabs>

      <h2>Reactive forms</h2>
      <p>
        Bound to a <code>FormControl&lt;number | null&gt;</code> inside a <code>hellField</code>.
        <code>min</code> / <code>max</code> report the standard Angular <code>min</code> /
        <code>max</code> validator errors; unparseable text reports
        <code>numberInputMalformed</code>; a required-but-empty field reports <code>required</code>.
      </p>
      <hd-example-tabs [code]="numberInputReactiveFormsExampleCode" previewClass="grid gap-3 max-w-md">
        <app-number-input-reactive-forms-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>ui</code> accepts either a shorthand class string, which refines the default
        <code>root</code> part, or a <code>HellNumberInputUi</code> map keyed by part name.
        Refinement classes merge deterministically on top of the recipe through Hell's Tailwind
        merge, so they win over conflicting recipe utilities.
      </p>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Part</th>
            <th>Styles</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>root</code></td>
            <td>The host element — border, background, focus ring, invalid/disabled state.</td>
          </tr>
          <tr>
            <td><code>input</code></td>
            <td>The text field — typography, padding, size variants.</td>
          </tr>
          <tr>
            <td><code>increment</code></td>
            <td>The increment stepper button.</td>
          </tr>
          <tr>
            <td><code>decrement</code></td>
            <td>The decrement stepper button.</td>
          </tr>
          <tr>
            <td><code>suffix</code></td>
            <td>The unit suffix rendered after the value.</td>
          </tr>
        </tbody>
      </table>
      <hd-example-tabs [code]="numberInputStylingExampleCode">
        <app-number-input-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>value</code>: <code>number | null</code>. Current value. Default <code>null</code>.</li>
        <li>
          <code>(valueChange)</code>: <code>EventEmitter&lt;number | null&gt;</code>. Emits after
          typing (blur or Enter), stepping, or clearing (which emits <code>null</code>).
        </li>
        <li>
          Implements <code>ControlValueAccessor</code> and <code>Validator</code>. Reactive and
          template-driven forms read/write <code>number | null</code>.
        </li>
        <li>
          Validator errors: <code>required</code> (required and empty), <code>numberInputMalformed</code>
          (unparseable draft), <code>min</code> / <code>max</code> (committed value outside bounds,
          shaped like Angular's built-in <code>Validators.min</code> / <code>max</code>).
        </li>
        <li><code>min</code>, <code>max</code>: <code>number | null</code>. Bounds enforced by stepping and validation. Default <code>null</code>.</li>
        <li><code>step</code>: <code>number</code>. Arrow / stepper increment. Default <code>1</code>.</li>
        <li><code>stepMultiplier</code>: <code>number</code>. Multiplier for Shift+Arrow and PageUp/PageDown. Default <code>10</code>.</li>
        <li><code>integer</code>: <code>boolean</code>. Rejects fractional typing and uses the numeric keypad. Default <code>false</code>.</li>
        <li><code>steppers</code>: <code>boolean</code>. Renders increment/decrement buttons with hold-to-repeat. Default <code>false</code>.</li>
        <li><code>suffix</code>: <code>string | null</code>. Unit label after the value. Default <code>null</code>.</li>
        <li><code>required</code>: <code>boolean</code>. Reports a <code>required</code> error while empty. Default <code>false</code>.</li>
        <li><code>size</code>: <code>'sm' | 'md' | 'lg'</code>. Default <code>'md'</code>.</li>
        <li><code>invalid</code>: <code>boolean</code>. Forces the invalid visual/ARIA state. Default <code>false</code>.</li>
        <li><code>disabled</code>: <code>boolean</code>. Disables the field and steppers. Default <code>false</code>.</li>
        <li><code>placeholder</code>: <code>string | null</code>. Text shown while empty. Default <code>null</code>.</li>
        <li>
          <code>inputId</code>: <code>string</code>. Id applied to the internal text field for
          visible label <code>for</code> wiring. Defaults to an auto-generated
          <code>hell-number-input-&lt;n&gt;-field</code>.
        </li>
        <li><code>name</code>: <code>string | null</code>. Native <code>name</code> attribute on the text field. Default <code>null</code>.</li>
        <li><code>aria-label</code>: <code>string | null</code>. Accessible name for standalone usage; also names the stepper buttons. Default <code>null</code>.</li>
        <li><code>aria-describedby</code>, <code>aria-labelledby</code>: <code>string | null</code>. Merge with descriptions/labels supplied by an ancestor <code>hellField</code>.</li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellNumberInputPart&gt;</code> — a shorthand class
          string refining <code>root</code>, or a <code>HellNumberInputUi</code> map covering
          <code>root</code>, <code>input</code>, <code>increment</code>, <code>decrement</code>, and
          <code>suffix</code>.
        </li>
        <li>
          Exported types: <code>HellNumberInputPart</code>
          (<code>'root' | 'input' | 'increment' | 'decrement' | 'suffix'</code>),
          <code>HellNumberInputUi</code> (<code>HellUi&lt;HellNumberInputPart&gt;</code>).
        </li>
        <li>
          <code>provideHellNumberInputAdapter</code>: replace the default parse/format policy —
          see below.
        </li>
        <li>
          <code>HELL_NUMBER_INPUT_LABELS</code>: override the <code>increment</code> /
          <code>decrement</code> Label Contract strings for the stepper buttons' accessible names.
        </li>
      </ul>

      <h2>Adapter contract</h2>
      <p>
        The built-in <code>HELL_NUMBER_INPUT_ADAPTER</code> parses a plain decimal string (optional
        sign, digits, a single <code>.</code> decimal point) and rejects exponent notation; integer
        mode additionally rejects fractional parts. Empty text commits a clear to <code>null</code>.
        For comma-decimal locales, thousands separators, or a custom numeric model, implement the
        <code>HellNumberInputAdapter</code> interface with explicit <code>parseText</code> and
        <code>format</code> (plus optional <code>normalize</code> / <code>isSameValue</code>)
        functions and register it with <code>provideHellNumberInputAdapter</code>. In
        <code>parseText</code>, return <code>hellTypedValue(value)</code> for a committable value
        (<code>null</code> clears the field) or <code>hellInvalidTypedValue()</code> to keep the
        typed text as a visible invalid draft — both imported from
        <code>&#64;hell-ui/angular/core</code>.
      </p>

      <h2>Accessibility</h2>
      <ul>
        <li>
          The field follows the APG spinbutton pattern: it always exposes
          <code>role="spinbutton"</code>, with <code>aria-valuemin</code> / <code>aria-valuemax</code>
          reflected whenever bounds exist and <code>aria-valuenow</code> added once it holds a value —
          an empty field keeps the role and bounds and omits only <code>aria-valuenow</code>. A unit
          suffix is announced through <code>aria-valuetext</code>.
        </li>
        <li>
          Keyboard stepping is the accessible path: ArrowUp / ArrowDown step (Shift or
          PageUp / PageDown for a larger jump); Home / End jump to <code>min</code> / <code>max</code>
          when bounds exist. Enter commits typed text.
        </li>
        <li>
          Stepper buttons are pointer affordances kept out of the tab order
          (<code>tabindex="-1"</code>, following the APG spinbutton prior art). They keep Label
          Contract names (<code>"Increase value"</code> / <code>"Decrease value"</code>, or a
          label-specific variant when <code>aria-label</code> is set) and support press-and-hold
          repetition, but keyboard stepping happens on the field itself — the accessible path — so
          Tab never stops on a stepper.
        </li>
        <li>Scrolling the wheel over a focused field never changes the value.</li>
        <li>
          <code>aria-invalid</code> reflects malformed, out-of-range, and required-empty state, and
          <code>aria-describedby</code> / <code>aria-labelledby</code> merge with an ancestor
          <code>hellField</code> automatically.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Pair with <code>hellFieldLabel</code> for visible naming, or set <code>aria-label</code> for standalone fields.</li>
        <li>Use <code>min</code> / <code>max</code> / <code>step</code> to encode real constraints, so a port field genuinely means 1–65535.</li>
        <li>Use <code>integer</code> for count-like fields and a <code>suffix</code> for units.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't reach for a native <code>&lt;input type="number"&gt;</code> when you need deterministic parsing and a real numeric value.</li>
        <li>Don't treat the stepper buttons as the only path — keyboard stepping on the field is the accessible one.</li>
      </ul>
    </article>
  `,
})
export class NumberInputPage {
  protected readonly numberInputBasicExampleCode = numberInputBasicExampleCodeRaw;
  protected readonly numberInputDurationSecondsExampleCode = numberInputDurationSecondsExampleCodeRaw;
  protected readonly numberInputSizesExampleCode = numberInputSizesExampleCodeRaw;
  protected readonly numberInputReactiveFormsExampleCode = numberInputReactiveFormsExampleCodeRaw;
  protected readonly numberInputStylingExampleCode = numberInputStylingExampleCodeRaw;
}
