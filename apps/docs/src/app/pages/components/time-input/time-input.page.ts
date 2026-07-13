import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { TimeInputBasicExample } from './examples/basic.example';
import timeInputBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { TimeInputSizesExample } from './examples/sizes.example';
import timeInputSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { TimeInputSecondsAndValidationExample } from './examples/seconds-and-validation.example';
import timeInputSecondsAndValidationExampleCodeRaw from './examples/seconds-and-validation.example.ts?raw' with {
  loader: 'text',
};
import { TimeInputReactiveFormsExample } from './examples/reactive-forms.example';
import timeInputReactiveFormsExampleCodeRaw from './examples/reactive-forms.example.ts?raw' with {
  loader: 'text',
};
import { TimeInputWithFieldScheduleRowExample } from './examples/with-field-schedule-row.example';
import timeInputWithFieldScheduleRowExampleCodeRaw from './examples/with-field-schedule-row.example.ts?raw' with {
  loader: 'text',
};
import { TimeInputStylingExample } from './examples/styling.example';
import timeInputStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-time-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    TimeInputBasicExample,
    TimeInputSizesExample,
    TimeInputSecondsAndValidationExample,
    TimeInputReactiveFormsExample,
    TimeInputWithFieldScheduleRowExample,
    TimeInputStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Time input"
        icon="faSolidClock"
        category="Composite"
        importPath="@hell-ui/angular/time-input"
        stylesPath="@hell-ui/angular/time-input/styles.css"
      >
        A type-or-pick time field: native <code>HH:mm</code> text entry with a segmented
        hour/minute/second picker fallback, one component, one structured form value.
      </hd-page-header>
      <p>
        <code>hell-time-input</code> is a Typed Value Input: with the default adapter it renders a
        native <code>&lt;input type="time"&gt;</code> so the browser rejects illegal strings and
        exposes its own platform time UI, paired with a clock-trigger button that opens a compact
        popover picker for the same value. The picker uses segmented spinbuttons for hour, minute,
        and optional second, plus quick minute presets — a second, discoverable path to the same
        commit pipeline as typing.
      </p>
      <p>
        It implements <code>ControlValueAccessor</code> and <code>Validator</code>, so it drops
        into reactive or template-driven forms like any native control, always reading and writing
        a structured <code>HellTimeValue</code>. Reach for it for business time entry — shift
        starts, reminder times, appointment slots — anywhere a locale-guessing free-text field would
        make illegal times too easy to type.
      </p>

      <h2>Basic</h2>
      <hd-example-tabs [code]="timeInputBasicExampleCode">
        <app-time-input-basic-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <hd-example-tabs [code]="timeInputSizesExampleCode" previewClass="flex flex-wrap items-end gap-3">
        <app-time-input-sizes-example />
      </hd-example-tabs>

      <h2>Seconds and validation states</h2>
      <p>
        Add <code>seconds</code> to widen the field and picker to hour/minute/second — the native
        field switches its <code>step</code> to <code>1</code> and the picker gains a third
        spinbutton. <code>invalid</code> forces the invalid look independent of draft parsing (pair
        it with <code>hellFieldError</code>); <code>disabled</code> disables the field and the
        clock trigger together.
      </p>
      <hd-example-tabs
        [code]="timeInputSecondsAndValidationExampleCode"
        previewClass="grid gap-3 max-w-md"
      >
        <app-time-input-seconds-and-validation-example />
      </hd-example-tabs>

      <h2>Reactive forms</h2>
      <hd-example-tabs
        [code]="timeInputReactiveFormsExampleCode"
        previewClass="grid gap-3 max-w-md"
      >
        <app-time-input-reactive-forms-example />
      </hd-example-tabs>

      <h2>With field and date input</h2>
      <p>
        A shift-scheduling row: a <code>hell-date-input</code> for the day plus two
        <code>hell-time-input</code> fields for start/end, each wrapped in its own labeled
        <code>hellField</code>. This is the shape most scheduling and booking forms end up in —
        one date control and a pair of time controls sharing a row.
      </p>
      <hd-example-tabs [code]="timeInputWithFieldScheduleRowExampleCode">
        <app-time-input-with-field-schedule-row-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        <code>ui</code> accepts either a shorthand class string, which refines the default
        <code>root</code> part, or a <code>HellTimeInputUi</code> map keyed by part name.
        Refinement classes merge deterministically on top of the recipe through Hell's Tailwind
        merge, so they win over conflicting recipe utilities. The picker panel and its contents
        stay part of the same Part Style Map even though they render in a popover outside the host.
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
            <td>The text/time field — typography, padding, size variants.</td>
          </tr>
          <tr>
            <td><code>trigger</code></td>
            <td>The clock icon button — shape, hover/focus, disabled state.</td>
          </tr>
          <tr>
            <td><code>triggerIcon</code></td>
            <td>The clock glyph inside the trigger button.</td>
          </tr>
          <tr>
            <td><code>pickerPanel</code></td>
            <td>The popover surface wrapping the picker.</td>
          </tr>
          <tr>
            <td><code>pickerHeader</code></td>
            <td>The row above the unit controls that holds the readout.</td>
          </tr>
          <tr>
            <td><code>pickerReadout</code></td>
            <td>The large formatted-time text at the top of the picker.</td>
          </tr>
          <tr>
            <td><code>pickerUnits</code></td>
            <td>The grid laying out the hour/minute/second unit groups.</td>
          </tr>
          <tr>
            <td><code>pickerUnit</code></td>
            <td>One unit group — label plus its value/step control.</td>
          </tr>
          <tr>
            <td><code>pickerUnitLabel</code></td>
            <td>The small caption above a unit's control (Hours, Minutes, Seconds).</td>
          </tr>
          <tr>
            <td><code>pickerUnitControl</code></td>
            <td>The bordered group wrapping a unit's value cell and its two step buttons.</td>
          </tr>
          <tr>
            <td><code>pickerUnitValue</code></td>
            <td>The spinbutton cell showing a unit's current zero-padded value.</td>
          </tr>
          <tr>
            <td><code>pickerUnitStep</code></td>
            <td>Each of a unit's decrement (−) and increment (+) buttons.</td>
          </tr>
          <tr>
            <td><code>minutePresets</code></td>
            <td>The group wrapping the quick minute-preset buttons.</td>
          </tr>
          <tr>
            <td><code>minutePreset</code></td>
            <td>One quick-minute button (:00, :15, :30, :45), including its selected state.</td>
          </tr>
        </tbody>
      </table>
      <hd-example-tabs [code]="timeInputStylingExampleCode">
        <app-time-input-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li>
          <code>value</code>: <code>HellTimeValue | null</code> — a structured
          <code>&#123; hour, minute, second &#125;</code> (0–23 / 0–59 / 0–59). Default
          <code>null</code>.
        </li>
        <li>
          <code>(valueChange)</code>: <code>EventEmitter&lt;HellTimeValue | null&gt;</code>. Emits a
          valid value after typing (blur or Enter), a picker interaction, or <code>null</code> when
          cleared.
        </li>
        <li>
          Implements <code>ControlValueAccessor</code> and <code>Validator</code>. Reactive and
          template-driven forms read/write <code>HellTimeValue | null</code>; native HTML form
          submission is not provided.
        </li>
        <li>
          Validator error: <code>invalidTimeInputDraft</code> for typed text that can't be parsed
          by the active adapter.
        </li>
        <li>
          <code>seconds</code>: <code>boolean</code>. Includes a seconds field/picker control and
          switches the committed format to <code>HH:mm:ss</code>. Default <code>false</code>.
        </li>
        <li><code>size</code>: <code>'sm' | 'md' | 'lg'</code>. Default <code>'md'</code>.</li>
        <li><code>invalid</code>: <code>boolean</code>. Forces the invalid visual/ARIA state on top of any draft-driven invalidity. Default <code>false</code>.</li>
        <li><code>disabled</code>: <code>boolean</code>. Disables the field and the clock trigger. Default <code>false</code>.</li>
        <li>
          <code>placeholder</code>: <code>string | null</code>. Text shown while empty. Defaults to
          a format hint (<code>HH:mm</code>, or <code>HH:mm:ss</code> with <code>seconds</code>).
        </li>
        <li>
          <code>inputId</code>: <code>string</code>. Id applied to the internal field for visible
          label <code>for</code> wiring. Defaults to an auto-generated
          <code>hell-time-input-&lt;n&gt;-field</code>.
        </li>
        <li><code>name</code>: <code>string | null</code>. Native <code>name</code> attribute on the field. Default <code>null</code>.</li>
        <li><code>aria-label</code>: <code>string | null</code>. Accessible name for standalone usage; also names the clock trigger button. Default <code>null</code>.</li>
        <li><code>aria-describedby</code>, <code>aria-labelledby</code>: <code>string | null</code>. Merge with descriptions/labels supplied by an ancestor <code>hellField</code>.</li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellTimeInputPart&gt;</code> — a shorthand class
          string refining <code>root</code>, or a <code>HellTimeInputUi</code> map covering every
          part listed under Styling.
        </li>
        <li>
          Exported types: <code>HellTimeInputPart</code> (the fifteen parts listed under Styling),
          <code>HellTimeInputUi</code> (<code>HellUi&lt;HellTimeInputPart&gt;</code>),
          <code>HellTimeValue</code>, <code>HellTimeInputAdapter</code>,
          <code>HellTimeInputAdapterContext</code>.
        </li>
        <li>
          <code>provideHellTimeInputAdapter</code>: replace the default native-compatible
          parse/format/normalize/compare policy — see below.
        </li>
        <li>
          <code>HELL_TIME_INPUT_LABELS</code>: override the Label Contract strings for the
          clock trigger, unit spinbuttons, step buttons, and minute presets
          (<code>HellTimeInputLabels</code>).
        </li>
      </ul>

      <h2>Adapter contract</h2>
      <p>
        The built-in <code>HELL_DEFAULT_TIME_INPUT_ADAPTER</code> formats
        <code>HH:mm</code> (or <code>HH:mm:ss</code> with <code>seconds</code>) and, because it is
        the active adapter, the field renders as a native <code>&lt;input type="time"&gt;</code> —
        the browser itself blocks illegal typed values. Its parser also accepts common 12-hour
        text (<code>9:00 am</code>, <code>1:30pm</code>) and bare digit runs (<code>930</code>) for
        adapter reuse, plus programmatic paths that go around the native control. Empty text
        commits a clear to <code>null</code>. For localized formats or named shortcuts, implement the
        <code>HellTimeInputAdapter</code> interface and register it with
        <code>provideHellTimeInputAdapter</code>, which binds it to the
        <code>HELL_TIME_INPUT_ADAPTER</code> injection token. In <code>parseText</code>, return
        <code>hellTypedValue(value)</code> for a committable value (<code>null</code> clears the
        field) or <code>hellInvalidTypedValue()</code> to keep the typed text as a visible invalid
        draft — both imported from <code>&#64;hell-ui/angular/core</code>. Custom adapters switch the
        field to plain text mode, since the native time control cannot display non-standard text.
      </p>

      <h2>Accessibility</h2>
      <ul>
        <li>
          With the default adapter the field is a native <code>&lt;input type="time"&gt;</code>,
          so it carries platform time-editing semantics for free; a custom adapter renders
          <code>&lt;input type="text"&gt;</code> with <code>inputmode="text"</code> instead.
          <code>aria-invalid</code> reflects invalid draft state in both modes.
        </li>
        <li>
          The clock trigger is a <code>&lt;button type="button"&gt;</code> with its own accessible
          name from the Label Contract (<code>"Choose time"</code>, or
          <code>"Choose time for &lt;label&gt;"</code> when <code>aria-label</code> is set).
        </li>
        <li>
          Each picker unit value is <code>role="spinbutton"</code> with
          <code>aria-valuemin</code>/<code>aria-valuemax</code>/<code>aria-valuenow</code>/<code>aria-valuetext</code>
          and its own <code>aria-labelledby</code>. Arrow Up/Right increments, Arrow Down/Left
          decrements, Page Up/Down step by five, and Home/End jump to the unit's min/max.
        </li>
        <li>
          Minute preset buttons sit in a <code>role="group"</code> with a labeled group name, and
          each button reflects the active preset with <code>aria-pressed</code> and
          <code>data-selected</code>.
        </li>
        <li>
          Focusing the field with existing text selects its contents, so typing immediately
          overwrites the previous value.
        </li>
        <li>Disabled state disables the text field and the clock trigger together.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use <code>seconds</code> only when the workflow genuinely needs second precision.</li>
        <li>Pair with <code>hellFieldLabel</code> for visible naming, or set <code>aria-label</code> for standalone fields.</li>
        <li>Treat typed entry and picker selection as equally valid input paths.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't force time entry for broad periods like "morning" or "afternoon" — use a select instead.</li>
        <li>Don't change the visible placeholder format without also relaxing or replacing the parse adapter to match.</li>
        <li>Don't omit timezone context in scheduling flows — the value carries no timezone information.</li>
      </ul>
    </article>
  `,
})
export class TimeInputPage {
  protected readonly timeInputBasicExampleCode = timeInputBasicExampleCodeRaw;
  protected readonly timeInputSizesExampleCode = timeInputSizesExampleCodeRaw;
  protected readonly timeInputSecondsAndValidationExampleCode =
    timeInputSecondsAndValidationExampleCodeRaw;
  protected readonly timeInputReactiveFormsExampleCode = timeInputReactiveFormsExampleCodeRaw;
  protected readonly timeInputWithFieldScheduleRowExampleCode =
    timeInputWithFieldScheduleRowExampleCodeRaw;
  protected readonly timeInputStylingExampleCode = timeInputStylingExampleCodeRaw;
}
