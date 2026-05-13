import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HELL_FIELD_DIRECTIVES } from 'hell/primitives';
import { ExampleTabs } from '../../../shared/example-tabs';
import { DateInputPlaceholdersAndLabelsExample } from './examples/placeholders-and-labels.example';
import dateInputPlaceholdersAndLabelsExampleCodeRaw from './examples/placeholders-and-labels.example.ts?raw' with {
  loader: 'text',
};
import { DateInputSizesExample } from './examples/sizes.example';
import dateInputSizesExampleCodeRaw from './examples/sizes.example.ts?raw' with {
  loader: 'text',
};
import { DateInputTextInputCalendarPopoverExample } from './examples/text-input-calendar-popover.example';
import dateInputTextInputCalendarPopoverExampleCodeRaw from './examples/text-input-calendar-popover.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-date-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    RouterLink,
    ...HELL_FIELD_DIRECTIVES,
    DateInputTextInputCalendarPopoverExample,
    DateInputSizesExample,
    DateInputPlaceholdersAndLabelsExample,
  ],
  template: `
    <article class="hd-prose">
      <h1>Date input</h1>
      <p>
        Composite date field: a text input plus calendar-trigger popover. Type or paste an
        explicit <code>YYYY-MM-DD</code> date, then blur or press Enter to commit. Empty text clears to <code>null</code>. Click or keyboard-activate the calendar icon to pick from
        <a routerLink="/components/date-picker">Date picker</a>.
      </p>

      <h2>Text input + calendar popover</h2>
      <hd-example-tabs
        [code]="dateInputTextInputCalendarPopoverExampleCode"
        previewClass="grid gap-4 max-w-md"
      >
        <app-date-input-text-input-calendar-popover-example />
      </hd-example-tabs>

      <h2>Sizes</h2>
      <hd-example-tabs [code]="dateInputSizesExampleCode" previewClass="grid gap-3 max-w-md">
        <app-date-input-sizes-example />
      </hd-example-tabs>

      <h2>Placeholders and labels</h2>
      <hd-example-tabs
        [code]="dateInputPlaceholdersAndLabelsExampleCode"
        previewClass="grid gap-3 max-w-md"
      >
        <app-date-input-placeholders-and-labels-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>date</code>: <code>Date | null</code> current value.</li>
        <li><code>(dateChange)</code>: emits a valid <code>Date</code> after typing or picking, or <code>null</code> when cleared.</li>
        <li><code>min</code>, <code>max</code>: optional typed-input and picker bounds.</li>
        <li><code>size</code>: <code>sm | md | lg</code>.</li>
        <li><code>invalid</code>, <code>disabled</code>: visual / interaction states.</li>
        <li><code>placeholder</code>: text shown while empty.</li>
        <li><code>aria-label</code>: accessible name for standalone usage.</li>
        <li><code>provideHellDateInputAdapter</code>: replace the default strict ISO parse/format policy at an application or feature boundary.</li>
        <li><code>unstyled</code>: opt out of host styling.</li>
      </ul>

      <h2>Adapter contract</h2>
      <p>
        The built-in adapter intentionally accepts only <code>YYYY-MM-DD</code> typed input so Hell does not guess between regional formats. If your product needs locale parsing, masked input, or a Temporal-backed model, provide a <code>HELL_DATE_INPUT_ADAPTER</code> with explicit parse, format, coercion, and equality rules.
      </p>

      <h2>Do</h2>
      <ul>
        <li>Pair with <code>hellFieldLabel</code> for visible naming.</li>
        <li>Use <code>min</code> and <code>max</code> for business constraints.</li>
        <li>Accept typed dates and picker selection as equal paths.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't block keyboard entry by forcing the calendar only.</li>
        <li>Don't use locale-specific placeholders without validation copy.</li>
      </ul>
    </article>
  `,
})
export class DateInputPage {
  protected readonly dateInputTextInputCalendarPopoverExampleCode =
    dateInputTextInputCalendarPopoverExampleCodeRaw;
  protected readonly dateInputSizesExampleCode = dateInputSizesExampleCodeRaw;
  protected readonly dateInputPlaceholdersAndLabelsExampleCode =
    dateInputPlaceholdersAndLabelsExampleCodeRaw;
}
