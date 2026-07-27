import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { TimePickerBasicExample } from './examples/basic.example';
import timePickerBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { TimePickerStepsAndBoundsExample } from './examples/steps-and-bounds.example';
import timePickerStepsAndBoundsExampleCodeRaw from './examples/steps-and-bounds.example.ts?raw' with {
  loader: 'text',
};
import { TimePickerSecondsAndDisabledExample } from './examples/seconds-and-disabled.example';
import timePickerSecondsAndDisabledExampleCodeRaw from './examples/seconds-and-disabled.example.ts?raw' with {
  loader: 'text',
};
import { TimePickerStylingExample } from './examples/styling.example';
import timePickerStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-time-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PageHeader,
    TimePickerBasicExample,
    TimePickerStepsAndBoundsExample,
    TimePickerSecondsAndDisabledExample,
    TimePickerStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Time picker"
        icon="faSolidClock"
        category="Composite"
        importPath="hell-ui/time-picker"
        stylesPath="hell-ui/time-picker/styles.css"
      >
        A column picker for structured hour, minute, and optional second selection.
      </hd-page-header>

      <p>
        <code>hell-time-picker</code> renders one scrollable column per visible unit and owns
        column navigation, bounds, scroll centering, and accessibility for a single structured
        <code>HellTimeValue</code>. It renders inline and deliberately has no text field, parser,
        forms adapter, trigger, or Popover API. Put it directly in a workflow panel, or compose it
        inside <code>hell-popover</code> when the surrounding experience needs a floating picker.
      </p>
      <p>
        Apply <code>hellTimeInput</code> to a native <code>&lt;input&gt;</code> when users should also
        type a time or bind the value to Angular forms. If the workflow needs both surfaces,
        compose Time Input and Time Picker through Control Group and Popover. The consumer owns the
        trigger, shared value, close action, and focus policy; neither entry point hides the other.
      </p>

      <h2>Basic</h2>
      <p>
        Bind <code>[(value)]</code> to a writable signal. Tapping or arrowing to an option commits
        immediately — there is no draft and no confirm step. Scrolling a column only reveals
        options; it never commits.
      </p>
      <p>
        Writing the value from outside the picker scrolls every column back to the new selection,
        so a programmatic change is never left off-screen. Arrowing or tapping inside one column
        deliberately leaves the other columns where they are, so a scroll position you are still
        browsing survives.
      </p>
      <hd-example-tabs [code]="basicExampleCode">
        <app-time-picker-basic-example />
      </hd-example-tabs>

      <h2>Steps and bounds</h2>
      <p>
        <code>minuteStep</code> and <code>secondStep</code> set column granularity. Each must be a
        positive integer that divides 60; an invalid step throws in development builds and falls
        back to <code>1</code> in production. <code>min</code> and <code>max</code> are inclusive
        same-day bounds matching <code>hellTimeInput</code>. Options that cannot take part in any
        in-range time are disabled, skipped by the keyboard, and inert to pointer input.
      </p>
      <p>
        A <code>null</code> value renders a <code>--:--</code> placeholder and no selection. The
        first activation commits a complete value in one write: the earliest in-range time whose
        activated unit is the chosen option. With <code>min</code> 09:00, choosing minute
        <code>30</code> commits 09:30 rather than an out-of-range 00:30.
      </p>
      <hd-example-tabs [code]="stepsAndBoundsExampleCode">
        <app-time-picker-steps-and-bounds-example />
      </hd-example-tabs>

      <h2>Seconds and disabled state</h2>
      <p>
        Add <code>seconds</code> to show the third column. <code>second</code> remains required in
        <code>HellTimeValue</code>; commits made while seconds are hidden normalize it to
        <code>0</code>. <code>disabled</code> removes every option from the tab order and from
        pointer interaction while keeping the readout and the selected option visible.
      </p>
      <p>
        When a committed value does not sit on the step grid — an external write, or a time typed
        into a composed Time Input — the column renders that value as one extra in-place option so
        the selection stays visible. Picker interaction never creates off-step options.
      </p>
      <hd-example-tabs
        [code]="secondsAndDisabledExampleCode"
        previewClass="grid gap-6 items-start"
      >
        <app-time-picker-seconds-and-disabled-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Pass a class string to refine the default <code>root</code> part, or a
        <code>HellTimePickerUi</code> map to refine the picker-owned anatomy. All refinements merge
        through the shared Part-Class Pipeline.
      </p>
      <table class="hd-doc-table">
        <thead>
          <tr><th>Part</th><th>Styles</th></tr>
        </thead>
        <tbody>
          <tr><td><code>root</code></td><td>The complete picker surface.</td></tr>
          <tr><td><code>header</code></td><td>The readout row.</td></tr>
          <tr><td><code>readout</code></td><td>The formatted value, or the placeholder.</td></tr>
          <tr><td><code>columns</code></td><td>The row of unit columns.</td></tr>
          <tr><td><code>column</code></td><td>One label-and-options unit group.</td></tr>
          <tr><td><code>columnLabel</code></td><td>The Hours, Minutes, or Seconds caption.</td></tr>
          <tr><td><code>options</code></td><td>One column's scrollable listbox.</td></tr>
          <tr><td><code>option</code></td><td>One selectable unit value.</td></tr>
        </tbody>
      </table>
      <p>
        Options size themselves from an internal column metric that component CSS raises to at
        least 44px under <code>&#64;media (pointer: coarse)</code>, so touch targets grow without a
        separate density input.
      </p>
      <hd-example-tabs [code]="stylingExampleCode">
        <app-time-picker-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>value</code> / <code>(valueChange)</code>:
          <code>HellTimeValue | null</code>. <code>HellTimeValue</code> contains required
          <code>hour</code>, <code>minute</code>, and <code>second</code> fields.
        </li>
        <li>
          <code>seconds</code>: <code>boolean</code>. Shows the seconds column. Default
          <code>false</code>.
        </li>
        <li>
          <code>disabled</code>: <code>boolean</code>. Disables every interaction. Default
          <code>false</code>.
        </li>
        <li>
          <code>min</code> / <code>max</code>: <code>HellTimeValue | undefined</code>. Inclusive
          same-day bounds. Unset by default; ranges do not wrap past midnight.
        </li>
        <li>
          <code>minuteStep</code> / <code>secondStep</code>: <code>number</code>. Column
          granularity; a positive integer that divides 60. Default <code>1</code>.
        </li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellTimePickerPart&gt;</code>. String shorthand
          refines <code>root</code>; object form covers the eight parts above.
        </li>
        <li>
          Exported types: <code>HellTimeValue</code>, <code>HellTimePickerLabels</code>,
          <code>HellTimePickerPart</code>, and <code>HellTimePickerUi</code>.
        </li>
      </ul>

      <h3>Labels</h3>
      <p>
        Override built-in labels per injector scope with
        <code class="break-all whitespace-normal"
          >provideHellLabels(HELL_TIME_PICKER_LABELS, overrides)</code
        > from
        <code>hell-ui/core</code>. The fields are <code>hours</code>,
        <code>minutes</code>, <code>seconds</code>, <code>selectedTime</code>, and
        <code>noTimeSelected</code>.
      </p>

      <h2>Accessibility</h2>
      <ul>
        <li>
          The root is a <code>role="group"</code> named from <code>selectedTime</code> or
          <code>noTimeSelected</code>. The readout is <code>aria-hidden</code>, so the current
          value is announced exactly once.
        </li>
        <li>
          Each column is a <code>role="listbox"</code> labelled by its caption, and each option is
          a <code>role="option"</code> with <code>aria-selected</code> and
          <code>data-selected</code>.
        </li>
        <li>
          Tab and Shift+Tab move between columns; each column keeps exactly one tab stop through a
          roving <code>tabindex</code> on its selected option, or its first enabled option when
          nothing is selected.
        </li>
        <li>
          Arrow Up/Down move within a column and selection follows focus, so every step commits.
          Arrow Left/Right move to the previous or next column. Home/End jump to the first or last
          enabled option, and Page Up/Down move by five options. Nothing wraps.
        </li>
        <li>
          Typing digits edits the focused column: digits accumulate into a two-digit unit value,
          the entry completes on the second digit or as soon as no further digit could fit, and the
          result snaps to the nearest enabled option before focus advances to the next column.
        </li>
        <li>
          Out-of-bounds options expose <code>aria-disabled</code> and <code>data-disabled</code>,
          and are skipped by arrows and typed digits.
        </li>
        <li>
          Enter and Space perform no picker action, so a surrounding Popover recipe keeps its own
          Escape and Done behavior.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use the picker when structured visual selection is the whole interaction.</li>
        <li>Bind the same <code>seconds</code>, <code>min</code>, and <code>max</code> values to a composed Time Input.</li>
        <li>Compose it with Popover and an explicit close action when selection should float.</li>
        <li>Choose whether dismissal restores the trigger or a related input, then test that focus policy.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't expect parsing, text entry, CVA, field association, or adornments here.</li>
        <li>Don't ship a bespoke preset row through the picker; render preset buttons beside it.</li>
        <li>Don't use it for ranges outside the fixed clock bounds, or for ranges that wrap midnight.</li>
      </ul>
    </article>
  `,
})
export class TimePickerPage {
  protected readonly basicExampleCode = timePickerBasicExampleCodeRaw;
  protected readonly stepsAndBoundsExampleCode = timePickerStepsAndBoundsExampleCodeRaw;
  protected readonly secondsAndDisabledExampleCode = timePickerSecondsAndDisabledExampleCodeRaw;
  protected readonly stylingExampleCode = timePickerStylingExampleCodeRaw;
}
