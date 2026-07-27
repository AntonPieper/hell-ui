import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  type Signal,
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
import {
  HELL_DATE_PICKER_MONTH_COLUMNS,
  HELL_DATE_PICKER_MONTH_COUNT,
  HELL_DATE_PICKER_YEAR_COLUMNS,
  HELL_DATE_PICKER_YEAR_COUNT,
  hellDatePickerClosestEnabledIndex,
  hellDatePickerMonthSpan,
  hellDatePickerNextEnabledIndex,
  hellDatePickerPanelMove,
  hellDatePickerPanelRows,
  hellDatePickerSpanOutsideBounds,
  hellDatePickerWithYearMonth,
  hellDatePickerYearPageStart,
  hellDatePickerYearSpan,
} from './date-picker-views';

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
  /** Accessible label for the button that pages the year panel backwards. */
  readonly previousYears: string;
  /** Accessible label for the button that pages the year panel forwards. */
  readonly nextYears: string;
  /** Accessible label for the month drill-down grid. */
  readonly chooseMonth: string;
  /** Accessible label for the year drill-down grid. */
  readonly chooseYear: string;
}

/** Injection token resolving to the effective date picker labels. */
export const HELL_DATE_PICKER_LABELS: InjectionToken<HellLabels<HellDatePickerLabels>> = hellCreateLabels<HellDatePickerLabels>('HELL_DATE_PICKER_LABELS', {
  previousYear: 'Previous year',
  nextYear: 'Next year',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  previousYears: 'Previous years',
  nextYears: 'Next years',
  chooseMonth: 'Choose a month',
  chooseYear: 'Choose a year',
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
  | 'monthTrigger'
  | 'yearTrigger'
  | 'grid'
  | 'weekdayHeader'
  | 'cell'
  | 'dateButton'
  | 'panel'
  | 'panelCell'
  | 'panelOption';

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

const HELL_DATE_PICKER_TRIGGER_RECIPE =
  'inline-flex cursor-pointer items-center rounded-hell-sm border-0 bg-transparent px-hell-1 py-0 align-middle font-[family-name:inherit] text-[13px] font-semibold leading-[var(--spacing-hell-control-sm)] text-hell-foreground transition-[background-color,color] duration-[var(--hell-duration-fast)] ease-hell-out hover:bg-hell-surface-muted aria-expanded:bg-hell-surface-muted aria-expanded:text-hell-primary focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:opacity-50';

const HELL_DATE_PICKER_RECIPE = {
  root: 'inline-block w-[17.5rem] rounded-hell-md border border-hell-border bg-hell-surface-elevated p-hell-3 shadow-hell-sm',
  header:
    'mb-hell-2 grid grid-cols-[calc(var(--spacing-hell-control-sm)*2+var(--spacing-hell-1))_minmax(0,1fr)_calc(var(--spacing-hell-control-sm)*2+var(--spacing-hell-1))] items-center gap-hell-2',
  nav: 'inline-flex gap-hell-1 data-[direction=next]:justify-end',
  navButton:
    'inline-flex h-hell-control-sm w-hell-control-sm cursor-pointer items-center justify-center rounded-hell-md border border-transparent bg-transparent p-0 text-hell-foreground transition-[background-color,color,box-shadow] duration-[var(--hell-duration-fast)] ease-hell-out hover:bg-hell-surface-muted focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50 data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50',
  label:
    'm-0 min-w-0 text-center text-[13px] font-semibold leading-[var(--spacing-hell-control-sm)] text-hell-foreground whitespace-nowrap',
  monthTrigger: HELL_DATE_PICKER_TRIGGER_RECIPE,
  yearTrigger: HELL_DATE_PICKER_TRIGGER_RECIPE,
  grid: 'w-full table-fixed border-separate border-spacing-y-hell-1',
  weekdayHeader:
    'h-6 p-0 text-[11px] font-semibold tracking-normal text-hell-foreground-subtle uppercase',
  cell: 'p-0 text-center',
  dateButton:
    'grid aspect-square h-auto w-full cursor-pointer appearance-none place-items-center rounded-hell-sm border-0 bg-transparent p-0 font-[family-name:inherit] text-xs text-hell-foreground transition-[background-color,color] duration-[var(--hell-duration-fast)] ease-hell-out data-[today]:font-semibold data-[today]:text-hell-primary data-[today]:shadow-[inset_0_0_0_1px_var(--color-hell-primary-soft)] data-[hover]:bg-hell-surface-subtle data-[press]:bg-hell-surface-muted data-[outside-month]:text-hell-foreground-muted data-[selected]:bg-hell-primary data-[selected]:text-hell-primary-foreground data-[selected]:shadow-none data-[disabled]:cursor-not-allowed data-[disabled]:text-hell-foreground-subtle data-[disabled]:opacity-40 data-[range-start]:bg-hell-primary data-[range-start]:text-hell-primary-foreground data-[range-start]:shadow-none data-[range-end]:bg-hell-primary data-[range-end]:text-hell-primary-foreground data-[range-end]:shadow-none data-[range-between]:bg-hell-primary-soft data-[range-between]:text-hell-primary-soft-foreground data-[focus-visible]:outline-2 data-[focus-visible]:outline-hell-focus-ring data-[focus-visible]:outline-offset-1',
  panel: 'w-full table-fixed border-separate border-spacing-hell-1',
  panelCell: 'p-0 text-center',
  // The month/year in view is usually also the current month/year, so the
  // `today` treatment is scoped out of the selected state: an unscoped
  // `data-[today]:text-*` would win the variant sort and paint the selected
  // option's label in its own background colour.
  panelOption:
    'grid h-9 w-full cursor-pointer appearance-none place-items-center rounded-hell-sm border-0 bg-transparent p-0 font-[family-name:inherit] text-xs text-hell-foreground transition-[background-color,color] duration-[var(--hell-duration-fast)] ease-hell-out hover:bg-hell-surface-subtle data-[today]:font-semibold not-data-[selected]:data-[today]:text-hell-primary not-data-[selected]:data-[today]:shadow-[inset_0_0_0_1px_var(--color-hell-primary-soft)] data-[selected]:bg-hell-primary data-[selected]:text-hell-primary-foreground data-[disabled]:cursor-not-allowed data-[disabled]:text-hell-foreground-subtle data-[disabled]:opacity-40 focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1',
} satisfies HellRecipe<HellDatePickerPart>;

const HELL_DATE_RANGE_PICKER_RECIPE: HellRecipe<HellDateRangePickerPart> =
  HELL_DATE_PICKER_RECIPE;

let nextDatePickerPanelId = 0;

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

interface HellDatePickerCalendarState extends HellDatePickerNavigationState {
  setFocusedDate(
    date: Date,
    origin: 'keyboard' | undefined,
    direction: 'forward' | 'backward',
  ): void;
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
      @if (view() === 'year') {
        <button
          data-slot="navButton"
          data-direction="previous"
          data-step="yearPage"
          [class]="part('navButton')"
          type="button"
          [disabled]="previousPageDisabled()"
          [attr.data-disabled]="previousPageDisabled() ? '' : null"
          [attr.aria-label]="labels.previousYears"
          (click)="pagePanel(-1)"
        >
          <hell-icon name="faSolidAnglesLeft" />
        </button>
      } @else {
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
        @if (view() === 'day') {
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
        }
      }
    </div>
    <h2 ngpDatePickerLabel data-slot="label" [class]="part('label')">
      @for (segment of labelSegments(); track $index) {
        @switch (segment.type) {
          @case ('month') {
            <button
              data-slot="monthTrigger"
              [class]="part('monthTrigger')"
              type="button"
              [disabled]="pickerDisabled()"
              [attr.data-disabled]="pickerDisabled() ? '' : null"
              [attr.aria-expanded]="view() === 'month'"
              [attr.aria-controls]="view() === 'month' ? panelId : null"
              (click)="toggleView('month')"
              (keydown)="onTriggerKeydown($event)"
            >{{ segment.value }}</button>
          }
          @case ('year') {
            <button
              data-slot="yearTrigger"
              [class]="part('yearTrigger')"
              type="button"
              [disabled]="pickerDisabled()"
              [attr.data-disabled]="pickerDisabled() ? '' : null"
              [attr.aria-expanded]="view() === 'year'"
              [attr.aria-controls]="view() === 'year' ? panelId : null"
              (click)="toggleView('year')"
              (keydown)="onTriggerKeydown($event)"
            >{{ segment.value }}</button>
          }
          @default {
            <span>{{ segment.value }}</span>
          }
        }
      }
    </h2>
    <div data-slot="nav" [class]="part('nav')" data-direction="next">
      @if (view() === 'year') {
        <button
          data-slot="navButton"
          data-direction="next"
          data-step="yearPage"
          [class]="part('navButton')"
          type="button"
          [disabled]="nextPageDisabled()"
          [attr.data-disabled]="nextPageDisabled() ? '' : null"
          [attr.aria-label]="labels.nextYears"
          (click)="pagePanel(1)"
        >
          <hell-icon name="faSolidAnglesRight" />
        </button>
      } @else {
        @if (view() === 'day') {
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
        }
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
      }
    </div>
  </div>
  @if (view() === 'day') {
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
  } @else {
    <table
      role="grid"
      data-slot="panel"
      [class]="part('panel')"
      [id]="panelId"
      [attr.data-view]="view()"
      [attr.aria-label]="panelLabel()"
      (keydown)="onPanelKeydown($event)"
    >
      <tbody>
        @for (row of panelRows(); track $index) {
          <tr>
            @for (option of row; track option.value) {
              <td
                role="gridcell"
                data-slot="panelCell"
                [class]="part('panelCell')"
                [attr.aria-selected]="option.selected"
                [attr.aria-disabled]="option.disabled"
              >
                <button
                  data-slot="panelOption"
                  [class]="part('panelOption')"
                  type="button"
                  [attr.data-index]="option.index"
                  [attr.data-selected]="option.selected ? '' : null"
                  [attr.data-today]="option.today ? '' : null"
                  [attr.data-disabled]="option.disabled ? '' : null"
                  [attr.aria-label]="option.name"
                  [disabled]="option.disabled"
                  [tabindex]="option.index === activeOptionIndex() ? 0 : -1"
                  (click)="selectOption(option.value)"
                >{{ option.label }}</button>
              </td>
            }
          </tr>
        }
      </tbody>
    </table>
  }
`;

function formatMonthLabel(date: Date, locale: string | null): string {
  return new Intl.DateTimeFormat(locale ?? undefined, {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

// Structural return type: a named module-local interface here would leak
// through the pickers' protected template members as an ae-forgotten-export.
function formatLabelSegments(
  date: Date,
  locale: string | null,
): { readonly type: 'month' | 'year' | 'literal'; readonly value: string }[] {
  return new Intl.DateTimeFormat(locale ?? undefined, {
    month: 'long',
    year: 'numeric',
  })
    .formatToParts(date)
    .map((segment) => ({
      type: segment.type === 'month' ? 'month' : segment.type === 'year' ? 'year' : 'literal',
      value: segment.value,
    }));
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

/**
 * Shared month/year drill-down behind the header's month and year triggers.
 * Both pickers render the same calendar template, so the view state, option
 * grids, paging, and roving focus live here once instead of twice.
 *
 * The returned members are aliased onto each picker as protected template
 * members; the object's shape stays structural so no module-local type leaks
 * into the public API report.
 */
function hellDatePickerViews(state: () => HellDatePickerCalendarState, locale: Signal<string | null>) {
  const host = inject<ElementRef<HTMLElement>>(ElementRef);
  const injector = inject(Injector);
  const labels = inject(HELL_DATE_PICKER_LABELS);
  const panelId = `hell-date-picker-panel-${++nextDatePickerPanelId}`;
  const view = signal<'day' | 'month' | 'year'>('day');
  const yearPageStart = signal(0);
  const requestedOptionIndex = signal(0);

  const columns = computed(() =>
    view() === 'year' ? HELL_DATE_PICKER_YEAR_COLUMNS : HELL_DATE_PICKER_MONTH_COLUMNS,
  );

  const monthOptions = computed(() => {
    const current = state();
    const focused = current.focusedDate();
    const year = focused.getFullYear();
    const today = new Date();
    const short = new Intl.DateTimeFormat(locale() ?? undefined, { month: 'short' });
    const long = new Intl.DateTimeFormat(locale() ?? undefined, {
      month: 'long',
      year: 'numeric',
    });
    const pickerDisabled = current.disabled();
    const min = current.min();
    const max = current.max();

    return Array.from({ length: HELL_DATE_PICKER_MONTH_COUNT }, (_, month) => {
      const span = hellDatePickerMonthSpan(year, month);
      return {
        index: month,
        value: month,
        label: short.format(span.start),
        name: long.format(span.start),
        selected: month === focused.getMonth(),
        today: year === today.getFullYear() && month === today.getMonth(),
        disabled:
          pickerDisabled || hellDatePickerSpanOutsideBounds(span.start, span.end, min, max),
      };
    });
  });

  const yearOptions = computed(() => {
    const current = state();
    const focused = current.focusedDate();
    const start = yearPageStart();
    const todayYear = new Date().getFullYear();
    const pickerDisabled = current.disabled();
    const min = current.min();
    const max = current.max();

    return Array.from({ length: HELL_DATE_PICKER_YEAR_COUNT }, (_, offset) => {
      const year = start + offset;
      const span = hellDatePickerYearSpan(year);
      return {
        index: offset,
        value: year,
        label: String(year),
        name: null,
        selected: year === focused.getFullYear(),
        today: year === todayYear,
        disabled:
          pickerDisabled || hellDatePickerSpanOutsideBounds(span.start, span.end, min, max),
      };
    });
  });

  // Explicit element type: month and year options must present one shape so
  // the grid template, the disabled scan, and the API report stay structural.
  const panelOptions = computed<
    readonly {
      readonly index: number;
      readonly value: number;
      readonly label: string;
      readonly name: string | null;
      readonly selected: boolean;
      readonly today: boolean;
      readonly disabled: boolean;
    }[]
  >(() => {
    if (view() === 'month') return monthOptions();
    if (view() === 'year') return yearOptions();
    return [];
  });

  const panelRows = computed(() => hellDatePickerPanelRows(panelOptions(), columns()));

  // The roving tab stop is derived, not stored: the header's year buttons can
  // move the panel underneath it, and a disabled button cannot hold a tab stop.
  const activeOptionIndex = computed(() => {
    const options = panelOptions();
    const requested = requestedOptionIndex();
    if (options[requested] && !options[requested].disabled) return requested;
    return (
      hellDatePickerClosestEnabledIndex(
        options.map((option) => option.disabled),
        Math.min(Math.max(requested, 0), Math.max(options.length - 1, 0)),
      ) ?? requested
    );
  });

  const panelLabel = computed(() =>
    view() === 'year' ? labels.chooseYear : labels.chooseMonth,
  );

  const yearPageShiftDisabled = (delta: number): boolean => {
    const current = state();
    if (current.disabled()) return true;
    const start = yearPageStart() + delta * HELL_DATE_PICKER_YEAR_COUNT;
    return hellDatePickerSpanOutsideBounds(
      hellDatePickerYearSpan(start).start,
      hellDatePickerYearSpan(start + HELL_DATE_PICKER_YEAR_COUNT - 1).end,
      current.min(),
      current.max(),
    );
  };

  const previousPageDisabled = computed(() => yearPageShiftDisabled(-1));
  const nextPageDisabled = computed(() => yearPageShiftDisabled(1));

  const focusAfterRender = (select: () => HTMLElement | null): void => {
    afterNextRender({ write: () => select()?.focus({ preventScroll: true }) }, { injector });
  };

  const focusActiveOption = (): void =>
    focusAfterRender(() =>
      host.nativeElement.querySelector<HTMLButtonElement>(
        `[data-slot="panelOption"][data-index="${activeOptionIndex()}"]`,
      ),
    );

  const focusTrigger = (opened: 'month' | 'year'): void =>
    focusAfterRender(() =>
      host.nativeElement.querySelector<HTMLButtonElement>(
        `[data-slot="${opened}Trigger"]`,
      ),
    );

  const focusDayGrid = (): void =>
    focusAfterRender(
      () =>
        host.nativeElement.querySelector<HTMLButtonElement>(
          '[data-slot="dateButton"][tabindex="0"]',
        ) ?? host.nativeElement.querySelector<HTMLButtonElement>('[data-slot="dateButton"]'),
    );

  const closeToDayView = (restore: 'trigger' | 'grid'): void => {
    const opened = view();
    if (opened === 'day') return;
    view.set('day');
    if (restore === 'trigger') focusTrigger(opened);
    else focusDayGrid();
  };

  const toggleView = (next: 'month' | 'year'): void => {
    const current = state();
    if (current.disabled()) return;
    if (view() === next) {
      closeToDayView('trigger');
      return;
    }

    const focused = current.focusedDate();
    if (next === 'year') {
      yearPageStart.set(hellDatePickerYearPageStart(focused.getFullYear()));
    }
    view.set(next);
    requestedOptionIndex.set(
      next === 'month' ? focused.getMonth() : focused.getFullYear() - yearPageStart(),
    );
    focusActiveOption();
  };

  const pageBy = (delta: number): boolean => {
    const current = state();
    if (view() === 'year') {
      if (yearPageShiftDisabled(delta)) return false;
      yearPageStart.update((start) => start + delta * HELL_DATE_PICKER_YEAR_COUNT);
      return true;
    }

    const months = delta * HELL_DATE_PICKER_MONTH_COUNT;
    if (hellDatePickerYearShiftDisabled(current, months)) return false;
    current.setFocusedDate(
      hellShiftDateByMonths(current.focusedDate(), months),
      undefined,
      delta > 0 ? 'forward' : 'backward',
    );
    return true;
  };

  const pagePanel = (delta: number): void => {
    pageBy(delta);
  };

  const selectOption = (value: number): void => {
    const current = state();
    const focused = current.focusedDate();
    const target =
      view() === 'month'
        ? hellDatePickerWithYearMonth(focused, focused.getFullYear(), value)
        : hellDatePickerWithYearMonth(focused, value, focused.getMonth());

    view.set('day');
    if (target.getTime() !== focused.getTime()) {
      current.setFocusedDate(target, undefined, target < focused ? 'backward' : 'forward');
    }
    focusDayGrid();
  };

  const onPanelKeydown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeToDayView('trigger');
      return;
    }

    const options = panelOptions();
    const move = hellDatePickerPanelMove(
      event.key,
      activeOptionIndex(),
      options.length,
      columns(),
    );
    if (!move) return;

    event.preventDefault();
    event.stopPropagation();

    if (move.pageDelta !== 0 && !pageBy(move.pageDelta)) return;

    const disabled = panelOptions().map((option) => option.disabled);
    const next =
      hellDatePickerNextEnabledIndex(disabled, move.index, move.step) ??
      hellDatePickerNextEnabledIndex(disabled, move.index, move.step === 1 ? -1 : 1);
    if (next === null) return;

    requestedOptionIndex.set(next);
    focusActiveOption();
  };

  const onTriggerKeydown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.key !== 'Escape' || view() === 'day') return;
    event.preventDefault();
    event.stopPropagation();
    closeToDayView('trigger');
  };

  return {
    panelId,
    view: view.asReadonly(),
    activeOptionIndex,
    panelRows,
    panelLabel,
    previousPageDisabled,
    nextPageDisabled,
    toggleView,
    pagePanel,
    selectOption,
    onPanelKeydown,
    onTriggerKeydown,
  };
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
 * single- and double-chevron buttons so users can navigate by month or year,
 * plus clickable month and year labels that drill down to month and year
 * grids for jumping across distant dates.
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
    '[attr.data-view]': 'view()',
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
  private readonly views = hellDatePickerViews(() => this.state(), this.locale);

  /** Formatted month and year heading for the currently focused date. */
  protected readonly label = computed(() =>
    formatMonthLabel(this.state().focusedDate(), this.locale()),
  );
  /** Locale-ordered heading segments backing the month and year triggers. */
  protected readonly labelSegments = computed(() =>
    formatLabelSegments(this.state().focusedDate(), this.locale()),
  );
  /** Weekday column headers, ordered from the picker's first day of week. */
  protected readonly weekdayLabels = computed(() =>
    formatWeekdayLabels(this.locale(), this.state().firstDayOfWeek()),
  );
  /** Whether the whole picker is disabled, locking the header triggers. */
  protected readonly pickerDisabled = computed(() => this.state().disabled());

  /** DOM id of the month/year drill-down grid. */
  protected readonly panelId = this.views.panelId;
  /** Which calendar surface the picker currently shows. */
  protected readonly view = this.views.view;
  /** Roving tab stop inside the open drill-down grid. */
  protected readonly activeOptionIndex = this.views.activeOptionIndex;
  /** Rows of month or year options for the open drill-down grid. */
  protected readonly panelRows = this.views.panelRows;
  /** Accessible name of the open drill-down grid. */
  protected readonly panelLabel = this.views.panelLabel;
  /** Whether paging the year grid backwards leaves the `min`/`max` range. */
  protected readonly previousPageDisabled = this.views.previousPageDisabled;
  /** Whether paging the year grid forwards leaves the `min`/`max` range. */
  protected readonly nextPageDisabled = this.views.nextPageDisabled;
  /** Opens or closes one drill-down grid from its header trigger. */
  protected readonly toggleView = this.views.toggleView;
  /** Pages the open drill-down grid by one screen. */
  protected readonly pagePanel = this.views.pagePanel;
  /** Commits one month or year option and returns to the day grid. */
  protected readonly selectOption = this.views.selectOption;
  /** Grid keyboard navigation for the open drill-down grid. */
  protected readonly onPanelKeydown = this.views.onPanelKeydown;
  /** Escape handling while a header trigger holds focus. */
  protected readonly onTriggerKeydown = this.views.onTriggerKeydown;
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
    '[attr.data-view]': 'view()',
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
  private readonly views = hellDatePickerViews(() => this.state(), this.locale);
  /** Whether both a start and end date have been selected. */
  protected readonly rangeComplete = computed(() =>
    Boolean(this.state().startDate() && this.state().endDate()),
  );

  /** Formatted month and year heading for the currently focused date. */
  protected readonly label = computed(() =>
    formatMonthLabel(this.state().focusedDate(), this.locale()),
  );
  /** Locale-ordered heading segments backing the month and year triggers. */
  protected readonly labelSegments = computed(() =>
    formatLabelSegments(this.state().focusedDate(), this.locale()),
  );
  /** Weekday column headers, ordered from the picker's first day of week. */
  protected readonly weekdayLabels = computed(() =>
    formatWeekdayLabels(this.locale(), this.state().firstDayOfWeek()),
  );
  /** Whether the whole picker is disabled, locking the header triggers. */
  protected readonly pickerDisabled = computed(() => this.state().disabled());

  /** DOM id of the month/year drill-down grid. */
  protected readonly panelId = this.views.panelId;
  /** Which calendar surface the picker currently shows. */
  protected readonly view = this.views.view;
  /** Roving tab stop inside the open drill-down grid. */
  protected readonly activeOptionIndex = this.views.activeOptionIndex;
  /** Rows of month or year options for the open drill-down grid. */
  protected readonly panelRows = this.views.panelRows;
  /** Accessible name of the open drill-down grid. */
  protected readonly panelLabel = this.views.panelLabel;
  /** Whether paging the year grid backwards leaves the `min`/`max` range. */
  protected readonly previousPageDisabled = this.views.previousPageDisabled;
  /** Whether paging the year grid forwards leaves the `min`/`max` range. */
  protected readonly nextPageDisabled = this.views.nextPageDisabled;
  /** Opens or closes one drill-down grid from its header trigger. */
  protected readonly toggleView = this.views.toggleView;
  /** Pages the open drill-down grid by one screen. */
  protected readonly pagePanel = this.views.pagePanel;
  /** Commits one month or year option and returns to the day grid. */
  protected readonly selectOption = this.views.selectOption;
  /** Grid keyboard navigation for the open drill-down grid. */
  protected readonly onPanelKeydown = this.views.onPanelKeydown;
  /** Escape handling while a header trigger holds focus. */
  protected readonly onTriggerKeydown = this.views.onTriggerKeydown;
}
