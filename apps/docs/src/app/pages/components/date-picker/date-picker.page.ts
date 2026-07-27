import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { DatePickerBasicExample } from './examples/basic.example';
import datePickerBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { DatePickerBoundedExample } from './examples/bounded.example';
import datePickerBoundedExampleCodeRaw from './examples/bounded.example.ts?raw' with {
  loader: 'text',
};
import { DatePickerRangeExample } from './examples/range.example';
import datePickerRangeExampleCodeRaw from './examples/range.example.ts?raw' with {
  loader: 'text',
};
import { DatePickerDisabledExample } from './examples/disabled.example';
import datePickerDisabledExampleCodeRaw from './examples/disabled.example.ts?raw' with {
  loader: 'text',
};
import { DatePickerLocalizedExample } from './examples/localized.example';
import datePickerLocalizedExampleCodeRaw from './examples/localized.example.ts?raw' with {
  loader: 'text',
};
import { DatePickerWithPopoverExample } from './examples/with-popover.example';
import datePickerWithPopoverExampleCodeRaw from './examples/with-popover.example.ts?raw' with {
  loader: 'text',
};
import { DatePickerStylingExample } from './examples/styling.example';
import datePickerStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-date-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    DatePickerBasicExample,
    DatePickerBoundedExample,
    DatePickerRangeExample,
    DatePickerDisabledExample,
    DatePickerLocalizedExample,
    DatePickerWithPopoverExample,
    DatePickerStylingExample,
    PageHeader,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="Date picker"
        icon="faSolidCalendarDays"
        category="Composite"
        importPath="hell-ui/date-picker"
        stylesPath="hell-ui/date-picker/styles.css"
      >
        An inline calendar for picking a single date or a start/end range, with min/max bounds and
        locale-aware labels.
      </hd-page-header>
      <p>
        The entry point ships two components that share one calendar surface:
        <code>hell-date-picker</code> for a single <code>Date</code> and
        <code>hell-date-range-picker</code> for a start/end range. Both are Composites built on
        <code>ng-primitives/date-picker</code>, which owns the ARIA date grid, roving focus,
        keyboard navigation, and month paging. The Hell wrapper adds the header chrome — a
        localized month/year label whose two halves are buttons that drill down to month and year
        grids, plus single-chevron month and double-chevron year navigation — and the default
        styling, while forwarding <code>min</code>, <code>max</code>, <code>disabled</code>, and
        <code>firstDayOfWeek</code> straight through to the primitive.
      </p>
      <p>
        Reach for it when a date is best chosen by looking at a calendar: bounded booking windows,
        report ranges, and scheduling. It renders inline, so in a dense form you usually drop it
        into a <code>hell-popover</code> behind a trigger button (see
        <a href="#with-popover">With popover</a>). When users would rather type a date than scan a
        grid, apply <code>hellDateInput</code> from the <code>date-input</code> entry point to a real
        input. A calendar action remains explicit: compose the input and trigger in a Control Group,
        then open this Date Picker in a Popover.
      </p>

      <h2>Basic</h2>
      <p>
        Bind <code>[date]</code> and listen to <code>(dateChange)</code>. The picker is
        uncontrolled-friendly: pass an initial <code>Date</code> and mirror the change back into
        your signal.
      </p>
      <hd-example-tabs
        [code]="basicExampleCode"
        previewClass="flex flex-wrap items-start gap-6"
      >
        <app-date-picker-basic-example />
      </hd-example-tabs>

      <h2 id="quick-navigation">Quick navigation</h2>
      <p>
        The month and the year in the heading are separate buttons. Activating one replaces the day
        grid with a drill-down grid — twelve months for the year in view, or the twenty-four years
        from eleven before it to twelve after — so a date years away is a handful of interactions
        away instead of a run of month paging. Picking an option returns to the day grid on that
        month or year and puts focus back on the grid's roving tab stop. While a drill-down is open
        the single-chevron month buttons step aside and the double chevrons page the grid: by one
        year in the month grid, by one screen of years in the year grid. Try it on the basic picker
        above — year, <em>2031</em>, month, <em>Sep</em>, then the day.
      </p>
      <p>
        Leaving a drill-down without choosing — activating the same trigger again, or pressing
        <code>Escape</code> — restores the day grid and the trigger. It does not undo paging: the
        month grid pages by moving <code>focusedDate</code>, so if you paged before leaving, the
        day grid stays on the year you paged to and <code>focusedDateChange</code> has already
        emitted. Opening a drill-down on a picker whose <code>min</code>/<code>max</code> exclude
        the focused date also moves <code>focusedDate</code> into range, so the grid always opens
        on a page with something selectable.
      </p>

      <h2>Bounded</h2>
      <p>
        Pass <code>min</code> and <code>max</code> to constrain the selectable window. Days outside
        the range render disabled and are skipped by keyboard navigation, and the year-jump buttons
        disable themselves once the whole target month would fall outside the bounds.
      </p>
      <hd-example-tabs
        [code]="boundedExampleCode"
        previewClass="flex flex-wrap items-start gap-6"
      >
        <app-date-picker-bounded-example />
      </hd-example-tabs>

      <h2>Range</h2>
      <p>
        <code>hell-date-range-picker</code> uses the same calendar but tracks two endpoints. Bind
        <code>[startDate]</code> / <code>[endDate]</code> and listen to
        <code>(startDateChange)</code> / <code>(endDateChange)</code> — they emit independently, so
        an in-progress selection is fully observable. The days between the endpoints pick up the
        <code>data-range-between</code> state and the connected pill shape once both ends are set.
      </p>
      <hd-example-tabs
        [code]="rangeExampleCode"
        previewClass="flex flex-wrap items-start gap-6"
      >
        <app-date-picker-range-example />
      </hd-example-tabs>

      <h2>Disabled</h2>
      <p>
        Set <code>disabled</code> to lock the whole picker. The grid picks up
        <code>data-disabled</code>, every navigation button is disabled, and each day is announced
        as unavailable and skipped by keyboard focus — the range picker keeps its selected
        endpoints and connecting states visible while non-interactive.
      </p>
      <hd-example-tabs
        [code]="disabledExampleCode"
        previewClass="flex flex-wrap items-start gap-6"
      >
        <app-date-picker-disabled-example />
      </hd-example-tabs>

      <h2 id="localized">Localized</h2>
      <p>
        <code>locale</code> takes a BCP-47 tag and drives the month heading and weekday headers
        through <code>Intl.DateTimeFormat</code>; it defaults to the runtime locale.
        <code>firstDayOfWeek</code> reorders the columns — <code>1</code> for Monday through
        <code>7</code> for Sunday (the default). Both inputs exist on the single and range pickers.
      </p>
      <p>
        <code>locale</code> selects <em>display formatting only, for the Gregorian calendar</em>.
        The picker's dates, bounds, and grids are Gregorian throughout, so a tag carrying a
        <code>-u-ca-</code> calendar extension (or a locale whose default calendar is not
        Gregorian, such as <code>th-TH</code> or <code>fa-IR</code>) formats the heading in that
        calendar while the month and year grids keep listing Gregorian values — the two disagree.
        Calendars whose year has no numeric <code>year</code> part at all
        (<code>-u-ca-chinese</code>, <code>-u-ca-dangi</code>) render no year trigger. Pass a
        plain language tag; non-Gregorian calendar support is not part of this contract.
      </p>
      <hd-example-tabs
        [code]="localizedExampleCode"
        previewClass="flex flex-wrap items-start gap-6"
      >
        <app-date-picker-localized-example />
      </hd-example-tabs>

      <h2 id="with-popover">With popover</h2>
      <p>
        The picker renders inline, so in a dense layout you pair it with
        <code>hell-popover</code> and a <code>hellButton</code> trigger to build a compact date
        field. Here a range picker sits inside a popover, the button label summarizes the current
        selection, and <code>min</code> keeps past dates out of a trip-booking window. The picker's
        own border and padding are cleared with a <code>ui</code> shorthand so the popover owns the
        surface.
      </p>
      <hd-example-tabs [code]="withPopoverExampleCode">
        <app-date-picker-with-popover-example />
      </hd-example-tabs>

      <h2>Styling</h2>
      <p>
        Both components follow Hell's Part Style Map contract. Pass a <code>ui</code> string as
        shorthand to refine the default <code>root</code> part, or a <code>[ui]</code> map keyed by
        part name to refine named parts. The two components expose identical part unions
        (<code>HellDatePickerPart</code> and <code>HellDateRangePickerPart</code>), so the same
        map shape styles either one. Selection, today, range, and disabled visuals stay expressed
        through <code>data-*</code> attributes on <code>dateButton</code>, so refine those states
        with <code>data-[selected]:</code>, <code>data-[today]:</code>,
        <code>data-[range-between]:</code>, and friends rather than replacing the base recipe.
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
            <td>The picker host — width, border, elevated surface, padding, shadow.</td>
          </tr>
          <tr>
            <td><code>header</code></td>
            <td>The nav-label-nav row above the grid.</td>
          </tr>
          <tr>
            <td><code>nav</code></td>
            <td>Each navigation cluster (carries <code>data-direction="previous|next"</code>).</td>
          </tr>
          <tr>
            <td><code>navButton</code></td>
            <td>
              The month/year chevron buttons (each carries <code>data-direction</code> and
              <code>data-step="month|year|yearPage"</code>).
            </td>
          </tr>
          <tr>
            <td><code>label</code></td>
            <td>The month-and-year heading (<code>&lt;h2&gt;</code>).</td>
          </tr>
          <tr>
            <td><code>monthTrigger</code></td>
            <td>
              The month half of the heading — a button that opens the month grid, carrying
              <code>aria-expanded</code>.
            </td>
          </tr>
          <tr>
            <td><code>yearTrigger</code></td>
            <td>
              The year half of the heading — a button that opens the year grid, carrying
              <code>aria-expanded</code>.
            </td>
          </tr>
          <tr>
            <td><code>grid</code></td>
            <td>The calendar <code>&lt;table&gt;</code> with <code>role="grid"</code>.</td>
          </tr>
          <tr>
            <td><code>weekdayHeader</code></td>
            <td>The weekday column headers (<code>&lt;th&gt;</code>).</td>
          </tr>
          <tr>
            <td><code>cell</code></td>
            <td>Each day's grid cell (<code>&lt;td&gt;</code> with <code>role="gridcell"</code>).</td>
          </tr>
          <tr>
            <td><code>dateButton</code></td>
            <td>
              The repeated day button, carrying <code>data-today</code>,
              <code>data-selected</code>, <code>data-outside-month</code>,
              <code>data-range-start</code>, <code>data-range-end</code>, and
              <code>data-range-between</code> state attributes.
            </td>
          </tr>
          <tr>
            <td><code>panel</code></td>
            <td>
              The open drill-down grid (<code>role="grid"</code>, carrying
              <code>data-view="month|year"</code>). It replaces <code>grid</code> while open.
            </td>
          </tr>
          <tr>
            <td><code>panelCell</code></td>
            <td>Each drill-down grid cell (<code>&lt;td role="gridcell"&gt;</code>).</td>
          </tr>
          <tr>
            <td><code>panelOption</code></td>
            <td>
              The repeated month or year button, carrying <code>data-selected</code> for the value
              in view, <code>data-today</code> for the current month or year, and
              <code>data-disabled</code> outside <code>min</code>/<code>max</code>.
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        The example below refines every part on the range picker so each surface is visibly
        touched — including the range-specific day states on <code>dateButton</code>.
      </p>
      <hd-example-tabs [code]="stylingExampleCode">
        <app-date-picker-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <h3><code>hell-date-picker</code></h3>
      <ul>
        <li><code>date</code>: <code>Date | undefined</code> — the selected date.</li>
        <li><code>(dateChange)</code>: emits <code>Date | undefined</code> on selection.</li>
        <li><code>min</code> / <code>max</code>: <code>Date | undefined</code> — selectable bounds.</li>
        <li>
          <code>disabled</code>: <code>boolean</code>. Disables day selection, all navigation, and
          the month/year drill-down triggers.
        </li>
        <li>
          <code>firstDayOfWeek</code>: <code>1 | 2 | 3 | 4 | 5 | 6 | 7</code> (Monday…Sunday).
          Default <code>7</code> (Sunday).
        </li>
        <li>
          <code>locale</code>: <code>string | null</code> — BCP-47 tag for the month and weekday
          labels. Default <code>null</code> (runtime locale). Display formatting only, Gregorian
          calendars — see <a href="#localized">Localized</a>.
        </li>
        <li>
          Reflects <code>data-view="day|month|year"</code> on the host, so surrounding layout can
          react to a drill-down being open.
        </li>
        <li>
          <code>focusedDate</code> / <code>(focusedDateChange)</code>: the month the grid shows,
          independent of the selected date. The month and year drill-downs move it, so a jump is
          observable without a selection.
        </li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellDatePickerPart&gt;</code> — a shorthand class
          string (refines <code>root</code>) or a <code>HellDatePickerUi</code> map over the parts
          listed above. Default <code>undefined</code>.
        </li>
        <li>
          Exported types: <code>HellDatePickerPart</code>, <code>HellDatePickerUi</code>
          (<code>HellUi&lt;HellDatePickerPart&gt;</code>).
        </li>
      </ul>

      <h3><code>hell-date-range-picker</code></h3>
      <ul>
        <li><code>startDate</code> / <code>(startDateChange)</code>: range start <code>Date</code>.</li>
        <li><code>endDate</code> / <code>(endDateChange)</code>: range end <code>Date</code>.</li>
        <li>
          <code>min</code>, <code>max</code>, <code>disabled</code>, <code>firstDayOfWeek</code>,
          <code>locale</code>, <code>focusedDate</code> / <code>(focusedDateChange)</code>: same
          as the single picker.
        </li>
        <li>
          <code>ui</code>: <code>HellUiInput&lt;HellDateRangePickerPart&gt;</code>. Exported types:
          <code>HellDateRangePickerPart</code>, <code>HellDateRangePickerUi</code>. Reflects
          <code>data-range="true"</code> on the host and <code>data-range-complete</code> once both
          endpoints are set, alongside the same <code>data-view</code> as the single picker.
        </li>
      </ul>

      <h3>Labels</h3>
      <ul>
        <li>
          <code>provideHellLabels(HELL_DATE_PICKER_LABELS, overrides)</code> overrides the navigation button
          labels (<code>previousYear</code>, <code>nextYear</code>, <code>previousMonth</code>,
          <code>nextMonth</code>), the year-grid paging labels (<code>previousYears</code>,
          <code>nextYears</code>), and the drill-down grid names (<code>chooseMonth</code>,
          <code>chooseYear</code>) for an injector scope. English defaults ship built in.
        </li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>
          The calendar is a <code>role="grid"</code> table named by the formatted month and year;
          each day is a <code>role="gridcell"</code> exposing <code>aria-selected</code> and
          <code>aria-disabled</code>.
        </li>
        <li>
          Roving <code>tabindex</code> keeps one day in the tab order. Within the grid: arrow keys
          move by day (left/right) and week (up/down); <code>Home</code> / <code>End</code> jump to
          the first / last day of the month; <code>PageUp</code> / <code>PageDown</code> move to
          the same day in the previous / next month; <code>Enter</code> and <code>Space</code>
          select.
        </li>
        <li>
          The month and year navigation buttons carry Label Contract accessible names
          (<code>Previous month</code>, <code>Next month</code>, <code>Previous year</code>,
          <code>Next year</code>, and <code>Previous years</code> / <code>Next years</code> while
          the year grid is open), overridable via <code>HELL_DATE_PICKER_LABELS</code>.
        </li>
        <li>
          The heading's month and year triggers are plain buttons named by their visible text —
          never <code>aria-label</code>. The heading is an <code>aria-live="polite"</code> region,
          so trigger labels would be folded into every month-change announcement. Locale unit
          markers stay inside the trigger they belong to, so <code>ja-JP</code> gives
          <em>2026年</em> and <em>4月</em> rather than a bare <em>4</em>. Each trigger carries
          <code>aria-expanded</code>, plus <code>aria-controls</code> while its grid is open.
        </li>
        <li>
          Each drill-down is a <code>role="grid"</code> named <em>Choose a month</em> /
          <em>Choose a year</em>, with <code>role="gridcell"</code> cells exposing
          <code>aria-selected</code> and <code>aria-disabled</code>. Opening one moves focus to the
          option in view. Arrow keys move by column and row and roll onto the neighbouring page at
          the edges; <code>Home</code> / <code>End</code> jump within the page;
          <code>PageUp</code> / <code>PageDown</code> page it; <code>Enter</code> and
          <code>Space</code> commit; <code>Escape</code> returns to the day grid and restores the
          trigger. Left and right follow the reading direction, matching the day grid under
          <code>dir="rtl"</code>. Options outside <code>min</code>/<code>max</code> are disabled
          and skipped; if bounds leave nothing selectable in view, the grid itself takes the tab
          stop so it stays pageable and dismissable.
        </li>
        <li>
          Inside a <code>hell-popover</code>, <code>Escape</code> keeps closing the popover — light
          dismissal stays engine-owned — and the picker reopens on the day grid.
        </li>
        <li>
          Disabled days (out of <code>min</code>/<code>max</code>, or when the whole picker is
          <code>disabled</code>) are announced as unavailable and are skipped by keyboard focus.
        </li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Use it for bounded calendar selection where seeing the month matters.</li>
        <li>Reach for the range picker when start and end are part of one decision.</li>
        <li>Set <code>min</code>/<code>max</code> up front so invalid dates are never selectable.</li>
        <li>Point users at the heading's month and year buttons when a target date is years away.</li>
        <li>Drop the picker into a <code>hell-popover</code> to build a compact date field in dense forms.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't use it for free-form dates where typing wins — use <code>date-input</code>.</li>
        <li>Don't hide <code>min</code>/<code>max</code> rules until submit; constrain the grid instead.</li>
        <li>Don't restyle day states with template <code>class</code>; refine the <code>dateButton</code> <code>data-*</code> states through <code>ui</code>.</li>
      </ul>
    </article>
  `,
})
export class DatePickerPage {
  protected readonly basicExampleCode = datePickerBasicExampleCodeRaw;
  protected readonly boundedExampleCode = datePickerBoundedExampleCodeRaw;
  protected readonly rangeExampleCode = datePickerRangeExampleCodeRaw;
  protected readonly disabledExampleCode = datePickerDisabledExampleCodeRaw;
  protected readonly localizedExampleCode = datePickerLocalizedExampleCodeRaw;
  protected readonly withPopoverExampleCode = datePickerWithPopoverExampleCodeRaw;
  protected readonly stylingExampleCode = datePickerStylingExampleCodeRaw;
}
