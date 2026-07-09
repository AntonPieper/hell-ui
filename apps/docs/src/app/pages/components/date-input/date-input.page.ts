import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { DateInputBasicExample } from './examples/basic.example';
import dateInputBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { DateInputSizesExample } from './examples/sizes.example';
import dateInputSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { DateInputBoundsAndValidationExample } from './examples/bounds-and-validation.example';
import dateInputBoundsAndValidationExampleCodeRaw from './examples/bounds-and-validation.example.ts?raw' with {
  loader: 'text',
};
import { DateInputReactiveFormsExample } from './examples/reactive-forms.example';
import dateInputReactiveFormsExampleCodeRaw from './examples/reactive-forms.example.ts?raw' with {
  loader: 'text',
};
import { DateInputWithFieldFilterRowExample } from './examples/with-field-filter-row.example';
import dateInputWithFieldFilterRowExampleCodeRaw from './examples/with-field-filter-row.example.ts?raw' with {
  loader: 'text',
};
import { DateInputStylingExample } from './examples/styling.example';
import dateInputStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-date-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    RouterLink,
    DateInputBasicExample,
    DateInputSizesExample,
    DateInputBoundsAndValidationExample,
    DateInputReactiveFormsExample,
    DateInputWithFieldFilterRowExample,
    DateInputStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Date input"
        icon="faSolidCalendarDay"
        category="Composite"
        importPath="@hell-ui/angular/date-input"
        stylesPath="@hell-ui/angular/date-input/styles.css"
      >
        A type-or-pick date field: strict ISO text entry with an inline calendar fallback, one
        component, one form value.
      </hd-page-header>
      <p>
        <code>hell-date-input</code> is a Typed Value Input: a text field that parses and formats a
        stable <code>YYYY-MM-DD</code> string, plus a calendar-trigger button that opens a
        <a routerLink="/components/date-picker">Date picker</a> popover for the same value. Both
        paths — typing and picking — commit through the same parse/validate/emit pipeline, so
        callers only ever see a <code>Date | null</code>.
      </p>
      <p>
        It implements <code>ControlValueAccessor</code> and <code>Validator</code>, so it drops
        into reactive or template-driven forms like any native control. Use it for business dates
        that need explicit, unambiguous entry — invoice dates, due dates, report ranges — anywhere
        a locale-guessing native <code>&lt;input type="date"&gt;</code> is too unpredictable for a
        dense business app.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="dateInputBasicExampleCode">
        <app-date-input-basic-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <hd-example-tabs [code]="dateInputSizesExampleCode" previewClass="grid gap-3 max-w-md">
        <app-date-input-sizes-example />
      </hd-example-tabs>

      <h2>Bounds and validation</h2>
      <p>
        <code>min</code> / <code>max</code> constrain both typed input and the calendar; dates
        outside the range fail validation with <code>outOfRangeDate</code>. Unparseable typed text
        fails with <code>invalidDateInputDraft</code> and marks the field invalid automatically —
        you can also force the invalid look directly.
      </p>
      <hd-example-tabs
        [code]="dateInputBoundsAndValidationExampleCode"
        previewClass="grid gap-3 max-w-md"
      >
        <app-date-input-bounds-and-validation-example />
      </hd-example-tabs>

      <h2>Reactive forms</h2>
      <hd-example-tabs
        [code]="dateInputReactiveFormsExampleCode"
        previewClass="grid gap-3 max-w-md"
      >
        <app-date-input-reactive-forms-example />
      </hd-example-tabs>

      <h2>With field and button</h2>
      <p>
        A report filter row: two labeled <code>hell-date-input</code> fields cross-constrain each
        other's <code>min</code> / <code>max</code>, and a ghost <code>hellButton</code> clears both
        in one action. This is the shape most business filter bars end up in.
      </p>
      <hd-example-tabs [code]="dateInputWithFieldFilterRowExampleCode">
        <app-date-input-with-field-filter-row-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>ui</code> accepts either a shorthand class string, which refines the default
        <code>root</code> part, or a <code>HellDateInputUi</code> map keyed by part name. Refinement
        classes merge deterministically on top of the recipe through Hell's Tailwind merge, so they
        win over conflicting recipe utilities.
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
            <td><code>trigger</code></td>
            <td>The calendar icon button — shape, hover/focus, disabled state.</td>
          </tr>
          <tr>
            <td><code>triggerIcon</code></td>
            <td>The calendar glyph inside the trigger button.</td>
          </tr>
          <tr>
            <td><code>pickerPanel</code></td>
            <td>
              The popover surface wrapping the calendar. Keeps its part identity even though it
              renders in an overlay outside the host.
            </td>
          </tr>
        </tbody>
      </table>
      <hd-example-tabs [code]="dateInputStylingExampleCode">
        <app-date-input-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>date</code>: <code>Date | null</code>. Current value. Default <code>null</code>.</li>
        <li>
          <code>(dateChange)</code>: <code>EventEmitter&lt;Date | null&gt;</code>. Emits a valid
          <code>Date</code> after typing (blur or Enter) or picking, or <code>null</code> when
          cleared.
        </li>
        <li>
          Implements <code>ControlValueAccessor</code> and <code>Validator</code>. Reactive and
          template-driven forms read/write <code>Date | null</code>; native HTML form submission is
          not provided.
        </li>
        <li>
          Validator errors: <code>invalidDateInputDraft</code> for typed text that can't be parsed,
          and <code>outOfRangeDate</code> for a committed value outside <code>min</code> /
          <code>max</code>.
        </li>
        <li><code>min</code>, <code>max</code>: <code>Date | null</code>. Bounds enforced on typed input, picker selection, and validation. Default <code>null</code>.</li>
        <li><code>size</code>: <code>'sm' | 'md' | 'lg'</code>. Default <code>'md'</code>.</li>
        <li><code>invalid</code>: <code>boolean</code>. Forces the invalid visual/ARIA state on top of any draft/validator-driven invalidity. Default <code>false</code>.</li>
        <li><code>disabled</code>: <code>boolean</code>. Disables the text field and the calendar trigger. Default <code>false</code>.</li>
        <li><code>placeholder</code>: <code>string</code>. Text shown while empty. Default <code>'YYYY-MM-DD'</code>.</li>
        <li>
          <code>inputId</code>: <code>string</code>. Id applied to the internal text field for
          visible label <code>for</code> wiring. Defaults to an auto-generated
          <code>hell-date-input-&lt;n&gt;-field</code>.
        </li>
        <li><code>name</code>: <code>string | null</code>. Native <code>name</code> attribute on the text field. Default <code>null</code>.</li>
        <li><code>aria-label</code>: <code>string | null</code>. Accessible name for standalone usage; also names the calendar trigger button. Default <code>null</code>.</li>
        <li><code>aria-describedby</code>, <code>aria-labelledby</code>: <code>string | null</code>. Merge with descriptions/labels supplied by an ancestor <code>hellField</code>.</li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellDateInputPart&gt;</code> — a shorthand class
          string refining <code>root</code>, or a <code>HellDateInputUi</code> map covering
          <code>root</code>, <code>input</code>, <code>trigger</code>, <code>triggerIcon</code>, and
          <code>pickerPanel</code>.
        </li>
        <li>
          Exported types: <code>HellDateInputPart</code>
          (<code>'root' | 'input' | 'trigger' | 'triggerIcon' | 'pickerPanel'</code>),
          <code>HellDateInputUi</code> (<code>HellUi&lt;HellDateInputPart&gt;</code>).
        </li>
        <li>
          <code>provideHellDateInputAdapter</code>: replace the default strict ISO
          parse/format/coerce/compare/bounds policy — see below.
        </li>
        <li>
          <code>provideHellDateInputLabels</code>: override the <code>chooseDate</code> /
          <code>chooseDateFor</code> Label Contract strings for the calendar trigger's accessible
          name.
        </li>
      </ul>

      <h2>Adapter contract</h2>
      <p>
        The built-in <code>HELL_DATE_INPUT_ADAPTER</code> accepts only strict ISO date-only
        <code>YYYY-MM-DD</code> typed input (four-digit year, two-digit month, two-digit day) and
        treats it as a local-midnight date without locale parsing. Empty text commits a clear to
        <code>null</code>; anything else that doesn't match commits nothing and marks the draft
        invalid. If your product needs locale-aware parsing, a masked input, or a Temporal-backed
        model, provide a <code>HellDateInputAdapter</code> with explicit <code>parseText</code>,
        <code>format</code>, and optional <code>coerce</code> / <code>isSameValue</code> /
        <code>isWithinBounds</code> functions via <code>provideHellDateInputAdapter</code>.
      </p>

      <h2>Accessibility</h2>
      <ul>
        <li>
          The text field is a plain labeled <code>&lt;input type="text"&gt;</code>:
          <code>aria-invalid</code> reflects invalid/out-of-range state, and
          <code>aria-describedby</code> / <code>aria-labelledby</code> merge with an ancestor
          <code>hellField</code>'s description and label ids automatically.
        </li>
        <li>
          The calendar trigger is a <code>&lt;button type="button"&gt;</code> with its own
          accessible name from the Label Contract (<code>"Choose date"</code>, or
          <code>"Choose date for &lt;label&gt;"</code> when <code>aria-label</code> is set) — it
          never depends on the text field's label alone.
        </li>
        <li>
          Pressing Enter in the text field commits the typed value and prevents the default form
          submit; blurring the field also commits.
        </li>
        <li>
          The calendar popover follows the shared Floating Dismissal rules (outside click, Escape,
          focus-out) and returns focus to the text field after a date is picked.
        </li>
        <li>Disabled state disables both the text field and the calendar trigger together.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Pair with <code>hellFieldLabel</code> for visible naming, or set <code>aria-label</code> for standalone fields.</li>
        <li>Use <code>min</code> and <code>max</code> to encode real business constraints, not just picker cosmetics.</li>
        <li>Treat typed dates and picker selection as equally valid input paths.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't block keyboard entry by hiding or disabling the text field — the calendar is a shortcut, not the only path.</li>
        <li>Don't change the visible placeholder format without also relaxing or replacing the parse adapter to match.</li>
      </ul>
    </article>
  `,
})
export class DateInputPage {
  protected readonly dateInputBasicExampleCode = dateInputBasicExampleCodeRaw;
  protected readonly dateInputSizesExampleCode = dateInputSizesExampleCodeRaw;
  protected readonly dateInputBoundsAndValidationExampleCode =
    dateInputBoundsAndValidationExampleCodeRaw;
  protected readonly dateInputReactiveFormsExampleCode = dateInputReactiveFormsExampleCodeRaw;
  protected readonly dateInputWithFieldFilterRowExampleCode =
    dateInputWithFieldFilterRowExampleCodeRaw;
  protected readonly dateInputStylingExampleCode = dateInputStylingExampleCodeRaw;
}
