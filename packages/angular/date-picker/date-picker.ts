import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidAnglesLeft,
  faSolidAnglesRight,
  faSolidChevronLeft,
  faSolidChevronRight,
} from '@ng-icons/font-awesome/solid';
import {
  NgpDatePicker,
  NgpDatePickerCell,
  NgpDatePickerCellRender,
  NgpDatePickerDateButton,
  NgpDatePickerGrid,
  NgpDatePickerLabel,
  NgpDatePickerNextMonth,
  NgpDatePickerPreviousMonth,
  NgpDatePickerRowRender,
  NgpDateRangePicker,
  injectDatePickerState,
  injectDateRangePickerState,
} from 'ng-primitives/date-picker';
import { injectButtonState } from 'ng-primitives/button';
import { HellIcon } from 'hell-ui/icon';
import { hellCreateLabels, type HellLabels } from 'hell-ui/core';
import type { HellUi, HellUiInput } from 'hell-ui/core';
import { hellPartStyler, type HellRecipe } from 'hell-ui/internal/core';
import type { InjectionToken } from '@angular/core';

/** Built-in accessibility labels owned by the date picker entry point. */
export interface HellDatePickerLabels {
  /** Accessible label for the previous-year navigation button. */
  readonly previousYear: string;
  /** Accessible label for the next-year navigation button. */
  readonly nextYear: string;
  /** Accessible label for the previous-month navigation button. */
  readonly previousMonth: string;
  /** Accessible label for the next-month navigation button. */
  readonly nextMonth: string;
}

/** Injection token resolving to the effective date picker labels. */
export const HELL_DATE_PICKER_LABELS: InjectionToken<HellLabels<HellDatePickerLabels>> = hellCreateLabels<HellDatePickerLabels>('HELL_DATE_PICKER_LABELS', {
  previousYear: 'Previous year',
  nextYear: 'Next year',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
});

const HELL_DATE_PICKER_ICONS = {
  faSolidAnglesLeft,
  faSolidAnglesRight,
  faSolidChevronLeft,
  faSolidChevronRight,
};

/** Public parts of the HellDatePicker module, styleable through its Part Style Map. */
export type HellDatePickerPart =
  | 'root'
  | 'header'
  | 'nav'
  | 'navButton'
  | 'label'
  | 'grid'
  | 'weekdayHeader'
  | 'cell'
  | 'dateButton';

/** Part Style Map accepted by the HellDatePicker `ui` input. */
export type HellDatePickerUi = HellUi<HellDatePickerPart>;

/**
 * Public parts of the HellDateRangePicker module. The range picker renders the
 * same calendar chrome as HellDatePicker (they share one template), so one
 * part family serves both and cannot drift.
 */
export type HellDateRangePickerPart = HellDatePickerPart;

/** Part Style Map accepted by the HellDateRangePicker `ui` input. */
export type HellDateRangePickerUi = HellUi<HellDateRangePickerPart>;

const HELL_DATE_PICKER_RECIPE = {
  root: 'inline-block w-[17.5rem] rounded-hell-md border border-hell-border bg-hell-surface-elevated p-hell-3 shadow-hell-sm',
  header:
    'mb-hell-2 grid grid-cols-[calc(var(--spacing-hell-control-sm)*2+var(--spacing-hell-1))_minmax(0,1fr)_calc(var(--spacing-hell-control-sm)*2+var(--spacing-hell-1))] items-center gap-hell-2',
  nav: 'inline-flex gap-hell-1',
  navButton:
    'inline-flex h-hell-control-sm w-hell-control-sm cursor-pointer items-center justify-center rounded-hell-md border border-transparent bg-transparent p-0 text-hell-foreground transition-[background-color,color,box-shadow] duration-[var(--hell-duration-fast)] ease-hell-out hover:bg-hell-surface-muted focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50 data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50',
  label:
    'm-0 min-w-0 text-center text-[13px] font-semibold leading-[var(--spacing-hell-control-sm)] text-hell-foreground whitespace-nowrap',
  grid: 'w-full table-fixed border-separate border-spacing-y-hell-1',
  weekdayHeader:
    'h-6 p-0 text-[11px] font-semibold tracking-normal text-hell-foreground-subtle uppercase',
  cell: 'p-0 text-center',
  dateButton:
    'grid aspect-square h-auto w-full cursor-pointer appearance-none place-items-center rounded-hell-sm border-0 bg-transparent p-0 font-[family-name:inherit] text-xs text-hell-foreground transition-[background-color,color] duration-[var(--hell-duration-fast)] ease-hell-out data-[today]:font-semibold data-[today]:text-hell-primary data-[today]:shadow-[inset_0_0_0_1px_var(--color-hell-primary-soft)] data-[hover]:bg-hell-surface-subtle data-[press]:bg-hell-surface-muted data-[outside-month]:text-hell-foreground-muted data-[selected]:bg-hell-primary data-[selected]:text-hell-primary-foreground data-[selected]:shadow-none data-[disabled]:cursor-not-allowed data-[disabled]:text-hell-foreground-subtle data-[disabled]:opacity-40 data-[range-start]:bg-hell-primary data-[range-start]:text-hell-primary-foreground data-[range-start]:shadow-none data-[range-end]:bg-hell-primary data-[range-end]:text-hell-primary-foreground data-[range-end]:shadow-none data-[range-between]:bg-hell-primary-soft data-[range-between]:text-hell-primary-soft-foreground data-[focus-visible]:outline-2 data-[focus-visible]:outline-hell-focus-ring data-[focus-visible]:outline-offset-1',
} satisfies HellRecipe<HellDatePickerPart>;

const HELL_DATE_RANGE_PICKER_RECIPE: HellRecipe<HellDateRangePickerPart> =
  HELL_DATE_PICKER_RECIPE;

function hellShiftDateByMonths(date: Date, months: number): Date {
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() + months;
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  return new Date(
    targetYear,
    targetMonth,
    Math.min(date.getDate(), lastDay),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}

interface HellDatePickerNavigationState {
  readonly disabled: () => boolean;
  readonly focusedDate: () => Date;
  readonly min: () => Date | undefined;
  readonly max: () => Date | undefined;
}

function hellDatePickerYearShiftDisabled(
  state: HellDatePickerNavigationState | undefined,
  months: number,
): boolean {
  if (!state || state.disabled()) return true;

  const target = hellShiftDateByMonths(state.focusedDate(), months);
  const targetMonthStart = new Date(target.getFullYear(), target.getMonth(), 1, 0, 0, 0, 0);
  const targetMonthEnd = new Date(target.getFullYear(), target.getMonth() + 1, 0, 23, 59, 59, 999);
  const min = state.min();
  const max = state.max();

  return Boolean((min && targetMonthEnd < min) || (max && targetMonthStart > max));
}

/**
 * Previous/next year buttons. ng-primitives ships month nav out of the box;
 * year nav is implemented here on top of the picker state so users can jump
 * 12 months at a time without scrubbing through the month buttons.
 */
@Directive({
  selector: 'button[hellDatePickerPreviousYear]',
  host: {
    type: 'button',
    '[disabled]': 'disabled()',
    '[attr.aria-label]': 'labels.previousYear',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '(click)': 'shift(-12)',
  },
})
export class HellDatePickerPreviousYear {
  /** Resolved accessibility labels for the date picker. */
  protected readonly labels = inject(HELL_DATE_PICKER_LABELS);
  private readonly state = injectDatePickerState<Date>({ optional: true });
  private readonly rangeState = injectDateRangePickerState<Date>({ optional: true });
  private readonly buttonState = injectButtonState({ optional: true });
  /** Whether shifting back a year would move outside the `min`/`max` range. */
  protected readonly disabled = computed(() =>
    hellDatePickerYearShiftDisabled(this.state() ?? this.rangeState(), -12),
  );

  constructor() {
    effect(() => this.buttonState()?.setDisabled(this.disabled()));
  }

  /** Moves the focused date by the given number of months. */
  protected shift(months: number) {
    if (this.disabled()) return;
    const s = this.state() ?? this.rangeState();
    if (!s) return;
    const focused = s.focusedDate();
    const next = hellShiftDateByMonths(focused, months);
    s.setFocusedDate(next, undefined, months > 0 ? 'forward' : 'backward');
  }
}

/** Next-year navigation button, jumping the focused date forward 12 months. */
@Directive({
  selector: 'button[hellDatePickerNextYear]',
  host: {
    type: 'button',
    '[disabled]': 'disabled()',
    '[attr.aria-label]': 'labels.nextYear',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '(click)': 'shift(12)',
  },
})
export class HellDatePickerNextYear {
  /** Resolved accessibility labels for the date picker. */
  protected readonly labels = inject(HELL_DATE_PICKER_LABELS);
  private readonly state = injectDatePickerState<Date>({ optional: true });
  private readonly rangeState = injectDateRangePickerState<Date>({ optional: true });
  private readonly buttonState = injectButtonState({ optional: true });
  /** Whether shifting forward a year would move outside the `min`/`max` range. */
  protected readonly disabled = computed(() =>
    hellDatePickerYearShiftDisabled(this.state() ?? this.rangeState(), 12),
  );

  constructor() {
    effect(() => this.buttonState()?.setDisabled(this.disabled()));
  }

  /** Moves the focused date by the given number of months. */
  protected shift(months: number) {
    if (this.disabled()) return;
    const s = this.state() ?? this.rangeState();
    if (!s) return;
    const focused = s.focusedDate();
    const next = hellShiftDateByMonths(focused, months);
    s.setFocusedDate(next, undefined, months > 0 ? 'forward' : 'backward');
  }
}

const PICKER_TEMPLATE = `
  <div data-slot="header" [class]="part('header')">
    <div data-slot="nav" [class]="part('nav')" data-direction="previous">
      <button
        data-slot="navButton"
        data-direction="previous"
        data-step="year"
        [class]="part('navButton')"
        type="button"
        hellDatePickerPreviousYear
      >
        <hell-icon name="faSolidAnglesLeft" />
      </button>
      <button
        data-slot="navButton"
        data-direction="previous"
        data-step="month"
        [class]="part('navButton')"
        type="button"
        ngpDatePickerPreviousMonth
        [attr.aria-label]="labels.previousMonth"
      >
        <hell-icon name="faSolidChevronLeft" />
      </button>
    </div>
    <h2 ngpDatePickerLabel data-slot="label" [class]="part('label')">{{ label() }}</h2>
    <div data-slot="nav" [class]="part('nav')" data-direction="next">
      <button
        data-slot="navButton"
        data-direction="next"
        data-step="month"
        [class]="part('navButton')"
        type="button"
        ngpDatePickerNextMonth
        [attr.aria-label]="labels.nextMonth"
      >
        <hell-icon name="faSolidChevronRight" />
      </button>
      <button
        data-slot="navButton"
        data-direction="next"
        data-step="year"
        [class]="part('navButton')"
        type="button"
        hellDatePickerNextYear
      >
        <hell-icon name="faSolidAnglesRight" />
      </button>
    </div>
  </div>
  <table
    ngpDatePickerGrid
    data-slot="grid"
    [class]="part('grid')"
    [attr.aria-label]="label()"
  >
    <thead>
      <tr>
        @for (weekday of weekdayLabels(); track weekday.abbr) {
          <th
            data-slot="weekdayHeader"
            [class]="part('weekdayHeader')"
            scope="col"
            [attr.abbr]="weekday.abbr"
          >
            {{ weekday.narrow }}
          </th>
        }
      </tr>
    </thead>
    <tbody>
      <tr *ngpDatePickerRowRender>
        <td
          *ngpDatePickerCellRender="let date"
          ngpDatePickerCell
          data-slot="cell"
          [class]="part('cell')"
        >
          <button
            ngpDatePickerDateButton
            data-slot="dateButton"
            [class]="part('dateButton')"
            type="button"
          >
            {{ date.getDate() }}
          </button>
        </td>
      </tr>
    </tbody>
  </table>
`;

function formatMonthLabel(date: Date, locale: string | null): string {
  return new Intl.DateTimeFormat(locale ?? undefined, {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

// Structural return type: a named module-local interface here would leak
// through the pickers' protected template members as an ae-forgotten-export.
function formatWeekdayLabels(
  locale: string | null,
  firstDayOfWeek: number,
): { readonly abbr: string; readonly narrow: string }[] {
  const firstJsDay = firstDayOfWeek === 7 ? 0 : firstDayOfWeek;
  const narrow = new Intl.DateTimeFormat(locale ?? undefined, {
    weekday: 'narrow',
    timeZone: 'UTC',
  });
  const long = new Intl.DateTimeFormat(locale ?? undefined, {
    weekday: 'long',
    timeZone: 'UTC',
  });

  return Array.from({ length: 7 }, (_, index) => {
    const jsDay = (firstJsDay + index) % 7;
    const date = new Date(Date.UTC(2023, 0, 1 + jsDay));
    return {
      abbr: long.format(date),
      narrow: narrow.format(date),
    };
  });
}

const PICKER_IMPORTS = [
  HellIcon,
  NgpDatePickerLabel,
  NgpDatePickerNextMonth,
  NgpDatePickerPreviousMonth,
  NgpDatePickerGrid,
  NgpDatePickerCell,
  NgpDatePickerRowRender,
  NgpDatePickerCellRender,
  NgpDatePickerDateButton,
  HellDatePickerPreviousYear,
  HellDatePickerNextYear,
] as const;

/**
 * Calendar-style date picker built on `ng-primitives/date-picker`. Emits via
 * `dateChange` and supports `min`, `max`, and `disabled`. The header offers
 * single- and double-chevron buttons so users can navigate by month or year.
 */
@Component({
  selector: 'hell-date-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons(HELL_DATE_PICKER_ICONS)],
  hostDirectives: [
    {
      directive: NgpDatePicker,
      inputs: [
        'ngpDatePickerDate:date',
        'ngpDatePickerFocusedDate:focusedDate',
        'ngpDatePickerMin:min',
        'ngpDatePickerMax:max',
        'ngpDatePickerDisabled:disabled',
        'ngpDatePickerFirstDayOfWeek:firstDayOfWeek',
      ],
      outputs: [
        'ngpDatePickerDateChange:dateChange',
        'ngpDatePickerFocusedDateChange:focusedDateChange',
      ],
    },
  ],
  imports: [...PICKER_IMPORTS],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
  template: PICKER_TEMPLATE,
})
export class HellDatePicker {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellDatePickerPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellDatePickerPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_DATE_PICKER_RECIPE,
  });

  /** BCP 47 locale used to format the month label and weekday headers. Defaults to the runtime locale. */
  readonly locale = input<string | null>(null);

  /** Resolved accessibility labels for the date picker. */
  protected readonly labels = inject(HELL_DATE_PICKER_LABELS);
  private readonly state = injectDatePickerState<Date>();

  /** Formatted month and year heading for the currently focused date. */
  protected readonly label = computed(() =>
    formatMonthLabel(this.state().focusedDate(), this.locale()),
  );
  /** Weekday column headers, ordered from the picker's first day of week. */
  protected readonly weekdayLabels = computed(() =>
    formatWeekdayLabels(this.locale(), this.state().firstDayOfWeek()),
  );
}

/**
 * Date range picker — same calendar surface as `hell-date-picker` but with
 * range selection. Bind two-way via `[startDate]`/`[endDate]` and listen to
 * `(startDateChange)` / `(endDateChange)`.
 */
@Component({
  selector: 'hell-date-range-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons(HELL_DATE_PICKER_ICONS)],
  hostDirectives: [
    {
      directive: NgpDateRangePicker,
      inputs: [
        'ngpDateRangePickerStartDate:startDate',
        'ngpDateRangePickerEndDate:endDate',
        'ngpDateRangePickerFocusedDate:focusedDate',
        'ngpDateRangePickerMin:min',
        'ngpDateRangePickerMax:max',
        'ngpDateRangePickerDisabled:disabled',
        'ngpDateRangePickerFirstDayOfWeek:firstDayOfWeek',
      ],
      outputs: [
        'ngpDateRangePickerStartDateChange:startDateChange',
        'ngpDateRangePickerEndDateChange:endDateChange',
        'ngpDateRangePickerFocusedDateChange:focusedDateChange',
      ],
    },
  ],
  imports: [...PICKER_IMPORTS],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-range]': '"true"',
    '[attr.data-range-complete]': 'rangeComplete() ? "" : null',
  },
  template: PICKER_TEMPLATE,
})
export class HellDateRangePicker {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellDateRangePickerPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellDateRangePickerPart>(this.ui, {
    defaultPart: 'root',
    recipe: (): HellRecipe<HellDateRangePickerPart> => HELL_DATE_RANGE_PICKER_RECIPE,
  });

  /** BCP 47 locale used to format the month label and weekday headers. Defaults to the runtime locale. */
  readonly locale = input<string | null>(null);

  /** Resolved accessibility labels for the date picker. */
  protected readonly labels = inject(HELL_DATE_PICKER_LABELS);
  private readonly state = injectDateRangePickerState<Date>();
  /** Whether both a start and end date have been selected. */
  protected readonly rangeComplete = computed(() =>
    Boolean(this.state().startDate() && this.state().endDate()),
  );

  /** Formatted month and year heading for the currently focused date. */
  protected readonly label = computed(() =>
    formatMonthLabel(this.state().focusedDate(), this.locale()),
  );
  /** Weekday column headers, ordered from the picker's first day of week. */
  protected readonly weekdayLabels = computed(() =>
    formatWeekdayLabels(this.locale(), this.state().firstDayOfWeek()),
  );
}
