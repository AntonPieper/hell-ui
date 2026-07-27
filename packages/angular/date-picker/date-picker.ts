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
  nav: 'inline-flex gap-hell-1',
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
  // Tailwind's variant sort, not source order, decides which `data-*` variant
  // wins at equal specificity, and `data-[today]` beats every filled state. A
  // selected day is very often also today, which painted its number in its own
  // background colour and drew the today ring inside the fill — a
  // `data-[selected]:shadow-none` after it is simply dead. Both halves of the
  // today treatment are scoped out of the filled states instead of relying on
  // order. Selection deliberately still shows through `data-[disabled]`: a
  // disabled picker keeps its selection visible.
  dateButton:
    'grid aspect-square h-auto w-full cursor-pointer appearance-none place-items-center rounded-hell-sm border-0 bg-transparent p-0 font-[family-name:inherit] text-xs text-hell-foreground transition-[background-color,color] duration-[var(--hell-duration-fast)] ease-hell-out data-[today]:font-semibold not-data-[selected]:not-data-[range-start]:not-data-[range-end]:not-data-[range-between]:data-[today]:text-hell-primary not-data-[selected]:not-data-[range-start]:not-data-[range-end]:not-data-[range-between]:data-[today]:shadow-[inset_0_0_0_1px_var(--color-hell-primary-soft)] data-[hover]:bg-hell-surface-subtle data-[press]:bg-hell-surface-muted data-[outside-month]:text-hell-foreground-muted data-[selected]:bg-hell-primary data-[selected]:text-hell-primary-foreground data-[disabled]:cursor-not-allowed data-[disabled]:text-hell-foreground-subtle data-[disabled]:opacity-40 data-[range-start]:bg-hell-primary data-[range-start]:text-hell-primary-foreground data-[range-end]:bg-hell-primary data-[range-end]:text-hell-primary-foreground data-[range-between]:bg-hell-primary-soft data-[range-between]:text-hell-primary-soft-foreground data-[focus-visible]:outline-2 data-[focus-visible]:outline-hell-focus-ring data-[focus-visible]:outline-offset-1',
  panel: 'w-full table-fixed border-separate border-spacing-hell-1',
  panelCell: 'p-0 text-center',
  // Unlike a day, an out-of-bounds month or year is never a selection the user
  // made — it is only the value in view — so here the filled treatment is
  // scoped out of `data-[disabled]` and a disabled option reads uniformly
  // unavailable.
  panelOption:
    'grid h-9 w-full cursor-pointer appearance-none place-items-center rounded-hell-sm border-0 bg-transparent p-0 font-[family-name:inherit] text-xs text-hell-foreground transition-[background-color,color] duration-[var(--hell-duration-fast)] ease-hell-out hover:bg-hell-surface-subtle data-[today]:font-semibold not-data-[disabled]:not-data-[selected]:data-[today]:text-hell-primary not-data-[disabled]:not-data-[selected]:data-[today]:shadow-[inset_0_0_0_1px_var(--color-hell-primary-soft)] not-data-[disabled]:data-[selected]:bg-hell-primary not-data-[disabled]:data-[selected]:text-hell-primary-foreground data-[disabled]:cursor-not-allowed data-[disabled]:text-hell-foreground-subtle data-[disabled]:opacity-40 focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1',
} satisfies HellRecipe<HellDatePickerPart>;

const HELL_DATE_RANGE_PICKER_RECIPE: HellRecipe<HellDateRangePickerPart> =
  HELL_DATE_PICKER_RECIPE;

let nextDatePickerPanelId = 0;

/**
 * Reading direction of the rendered picker. ng-primitives resolves the day
 * grid's arrow keys the same way, so both grids answer left/right visually.
 */
function hellReadDirection(element: HTMLElement): 'ltr' | 'rtl' {
  return element.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl'
    ? 'rtl'
    : 'ltr';
}

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
      @if (view() === 'day') {
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
      } @else {
        <button
          data-slot="navButton"
          data-direction="previous"
          [attr.data-step]="pageStep()"
          [class]="part('navButton')"
          type="button"
          [disabled]="previousPageDisabled()"
          [attr.data-disabled]="previousPageDisabled() ? '' : null"
          [attr.aria-label]="previousPageLabel()"
          (click)="pagePanel(-1)"
        >
          <hell-icon name="faSolidAnglesLeft" />
        </button>
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
        <button
          data-slot="navButton"
          data-direction="next"
          data-step="year"
          class="ms-auto"
          [class]="part('navButton')"
          type="button"
          hellDatePickerNextYear
        >
          <hell-icon name="faSolidAnglesRight" />
        </button>
      } @else {
        <button
          data-slot="navButton"
          data-direction="next"
          [attr.data-step]="pageStep()"
          class="ms-auto"
          [class]="part('navButton')"
          type="button"
          [disabled]="nextPageDisabled()"
          [attr.data-disabled]="nextPageDisabled() ? '' : null"
          [attr.aria-label]="nextPageLabel()"
          (click)="pagePanel(1)"
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
      [attr.tabindex]="activeOptionIndex() === null ? 0 : null"
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

// Punctuation locales put between a month and a year, carrying no unit meaning.
const HELL_DATE_PICKER_LABEL_SEPARATOR = /^[,./،‐-―·]*$/u;
const HELL_DATE_PICKER_LABEL_DIGIT = /\p{Nd}/u;
// A unit marker is *glued* to its unit: either directly adjacent or joined by a
// no-break space. That gap is what separates a marker from an ordinary
// connective — `ja` writes `2026<year-marker>` and `ru` puts a narrow no-break
// space before its `г.` suffix, while `es` writes `abril de 2026` and `vi`
// writes `tháng 4 năm 2026` with plain spaces. Without this gate `de`,
// `del`, and `năm` — Vietnamese for *year* — land in the month button.
const HELL_DATE_PICKER_LABEL_GLUE = /^[\u00a0\u202f\ufeff]*$/u;
// Unit separators that can ride on the tail of an otherwise meaningful
// marker. Deliberately excludes `.`, which ends legitimate year markers.
const HELL_DATE_PICKER_LABEL_COMMA = /[,\u060c;]+$/u;

// Structural return type: a named module-local interface here would leak
// through the pickers' protected template members as an ae-forgotten-export.
function formatLabelSegments(
  date: Date,
  locale: string | null,
): { readonly type: 'month' | 'year' | 'literal'; readonly value: string }[] {
  const parts: { type: 'month' | 'year' | 'literal'; value: string }[] = new Intl.DateTimeFormat(
    locale ?? undefined,
    { month: 'long', year: 'numeric' },
  )
    .formatToParts(date)
    .map((segment) => ({
      type: segment.type === 'month' ? 'month' : segment.type === 'year' ? 'year' : 'literal',
      value: segment.value,
    }));

  // `ja-JP` formats as `year "2026" | literal "年" | month "4" | literal "月"`,
  // so emitting parts verbatim would label the month trigger `4` and strand
  // `月` outside the control. A literal glued to its unit is folded into it —
  // the unit before it, or the one after it for leading eras — while ordinary
  // connectives (`abril de 2026`, `tháng 4 năm 2026`) and surrounding
  // whitespace stay outside, so the buttons hold their unit and nothing else.
  const segments: { type: 'month' | 'year' | 'literal'; value: string }[] = [];
  let pendingPrefix = '';
  // Whether the last thing emitted was a literal this gate refused to fold.
  // A refusal is a boundary: a marker on the far side of one is not glued to
  // the unit beyond it, so it must not start a prefix either. Without this,
  // `uz-u-ca-buddhist` (`2569 (BE), aprel`) leaves `(` outside while pushing
  // `BE), ` into the month button — the shape the leading gap already rules
  // out for backward folds.
  let boundary = false;

  for (const part of parts) {
    if (part.type !== 'literal') {
      // A buffered marker is treated as qualifying the year — `AP 1405` — so
      // any other unit arriving first flushes it out as plain text. Without
      // this, `tr-u-ca-buddhist` labels its month button `BE Nisan`.
      //
      // Positional, not semantic: the part types have already collapsed to
      // month/year/literal, so this cannot tell an era from a month word. Under
      // `vi-u-ca-chinese`, whose leading literal is `tháng ` ("month"), it
      // flushes a prefix that did belong to the month. Accepted — that is a
      // `-u-ca-` calendar, outside the documented `locale` contract, and the
      // heading still reads in full either way. Distinguishing the two would
      // mean keeping `formatToParts`' `era` tag instead of collapsing it.
      if (pendingPrefix && part.type !== 'year') {
        segments.push({ type: 'literal', value: pendingPrefix });
        pendingPrefix = '';
      }
      segments.push({ type: part.type, value: pendingPrefix + part.value });
      pendingPrefix = '';
      boundary = false;
      continue;
    }

    const lead = part.value.slice(0, part.value.length - part.value.trimStart().length);
    const trail = part.value.slice(part.value.trimEnd().length);
    const core = part.value.slice(lead.length, part.value.length - trail.length);

    if (
      core === '' ||
      HELL_DATE_PICKER_LABEL_SEPARATOR.test(core) ||
      HELL_DATE_PICKER_LABEL_DIGIT.test(core) ||
      !HELL_DATE_PICKER_LABEL_GLUE.test(lead)
    ) {
      if (pendingPrefix) {
        // A buffered leading era stays attached to the unit it prefixes across
        // whitespace (`lrc` wants `AP <year>` in one trigger), but punctuation
        // is a boundary: `cv-u-ca-japanese` would otherwise carry a stray
        // comma into the year button. Flush the era out as plain text.
        if (part.value.trim() === '') {
          pendingPrefix += part.value;
          continue;
        }
        segments.push({ type: 'literal', value: pendingPrefix });
        pendingPrefix = '';
      }
      segments.push({ type: 'literal', value: part.value });
      boundary = true;
      continue;
    }

    // The gate rejects a literal whose whole core is punctuation, but a marker
    // can still carry the unit separator on its tail: `ky` writes `-ж., ` and
    // `tt` writes ` ел, `. Peel that comma back off so only the marker folds.
    // Full stops stay: `ru`, `uk`, `bg`, `mk` and `lv` end their marker in one.
    const separatorTail = HELL_DATE_PICKER_LABEL_COMMA.exec(core)?.[0] ?? '';
    const marker = core.slice(0, core.length - separatorTail.length);
    const tail = separatorTail + trail;

    const previous = segments.at(-1);
    if (marker && previous && previous.type !== 'literal') {
      previous.value += lead + marker;
      if (tail) segments.push({ type: 'literal', value: tail });
      boundary = false;
      continue;
    }

    if (boundary || !marker) {
      segments.push({ type: 'literal', value: part.value });
      boundary = true;
      continue;
    }

    // Order matters: a buffered prefix was read before this lead, so it has to
    // stay in front of it rather than being emitted after.
    if (pendingPrefix) {
      pendingPrefix += lead + marker + tail;
      continue;
    }
    if (lead) segments.push({ type: 'literal', value: lead });
    pendingPrefix = marker + tail;
  }

  if (pendingPrefix) segments.push({ type: 'literal', value: pendingPrefix });

  return segments;
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
    const pickerDisabled = current.disabled();
    const min = current.min();
    const max = current.max();

    return Array.from({ length: HELL_DATE_PICKER_MONTH_COUNT }, (_, month) => {
      const span = hellDatePickerMonthSpan(year, month);
      // The accessible name adds the year to the visible short month rather
      // than swapping in the long one: WCAG 2.5.3 needs the visible label to
      // be contained in the accessible name, and abbreviations are not always
      // a prefix of the full name (`ru-RU` shortens `апрель` to `апр.`).
      const label = short.format(span.start);
      return {
        index: month,
        value: month,
        label,
        name: `${label} ${year}`,
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
  // `null` means no option can hold it — every month or year in view is out of
  // bounds — and the grid itself becomes the tab stop instead, so the panel
  // stays reachable, pageable, and dismissable rather than inert.
  const activeOptionIndex = computed<number | null>(() => {
    const options = panelOptions();
    if (options.length === 0) return null;
    const requested = requestedOptionIndex();
    if (options[requested] && !options[requested].disabled) return requested;
    return hellDatePickerClosestEnabledIndex(
      options.map((option) => option.disabled),
      Math.min(Math.max(requested, 0), options.length - 1),
    );
  });

  const panelLabel = computed(() =>
    view() === 'year' ? labels.chooseYear : labels.chooseMonth,
  );

  // One predicate for both halves of paging: the chevrons and PageUp/PageDown
  // do the same job, so they must agree on what is reachable. The month grid
  // pages by one year and the year grid by one screen of years; both are gated
  // on whether that whole target span falls outside `min`/`max`.
  const pageShiftDisabled = (delta: number): boolean => {
    const current = state();
    if (current.disabled()) return true;

    const [first, last] =
      view() === 'year'
        ? [
            yearPageStart() + delta * HELL_DATE_PICKER_YEAR_COUNT,
            yearPageStart() + delta * HELL_DATE_PICKER_YEAR_COUNT + HELL_DATE_PICKER_YEAR_COUNT - 1,
          ]
        : [current.focusedDate().getFullYear() + delta, current.focusedDate().getFullYear() + delta];

    return hellDatePickerSpanOutsideBounds(
      hellDatePickerYearSpan(first).start,
      hellDatePickerYearSpan(last).end,
      current.min(),
      current.max(),
    );
  };

  const previousPageDisabled = computed(() => pageShiftDisabled(-1));
  const nextPageDisabled = computed(() => pageShiftDisabled(1));
  const pageStep = computed(() => (view() === 'year' ? 'yearPage' : 'year'));
  const previousPageLabel = computed(() =>
    view() === 'year' ? labels.previousYears : labels.previousYear,
  );
  const nextPageLabel = computed(() => (view() === 'year' ? labels.nextYears : labels.nextYear));

  const focusAfterRender = (select: () => HTMLElement | null): void => {
    afterNextRender({ write: () => select()?.focus({ preventScroll: true }) }, { injector });
  };

  const focusActiveOption = (): void =>
    focusAfterRender(() => {
      const index = activeOptionIndex();
      if (index === null) {
        return host.nativeElement.querySelector<HTMLElement>('[data-slot="panel"]');
      }
      return host.nativeElement.querySelector<HTMLButtonElement>(
        `[data-slot="panelOption"][data-index="${index}"]`,
      );
    });

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

    // ng-primitives never clamps the initial focused date, so a picker whose
    // bounds exclude today opens on a year with nothing selectable at all —
    // no tab stop, and both year steps disabled. Nudge the focus into range
    // first (setFocusedDate clamps), so a drill-down always opens on a page
    // the user can act on.
    const unclamped = current.focusedDate();
    const yearInView = hellDatePickerYearSpan(unclamped.getFullYear());
    if (
      hellDatePickerSpanOutsideBounds(
        yearInView.start,
        yearInView.end,
        current.min(),
        current.max(),
      )
    ) {
      const min = current.min();
      current.setFocusedDate(unclamped, undefined, min && unclamped < min ? 'forward' : 'backward');
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
    // Same gate the chevrons render from, so the keyboard can never reach a
    // page the pointer cannot.
    if (pageShiftDisabled(delta)) return false;

    if (view() === 'year') {
      yearPageStart.update((start) => start + delta * HELL_DATE_PICKER_YEAR_COUNT);
      return true;
    }

    const current = state();
    current.setFocusedDate(
      hellShiftDateByMonths(current.focusedDate(), delta * HELL_DATE_PICKER_MONTH_COUNT),
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
      activeOptionIndex() ?? 0,
      options.length,
      columns(),
      hellReadDirection(host.nativeElement),
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
    pageStep,
    previousPageLabel,
    nextPageLabel,
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
  /** `data-step` the open drill-down's pager reports. */
  protected readonly pageStep = this.views.pageStep;
  /** Accessible name of the pager that steps the open drill-down backwards. */
  protected readonly previousPageLabel = this.views.previousPageLabel;
  /** Accessible name of the pager that steps the open drill-down forwards. */
  protected readonly nextPageLabel = this.views.nextPageLabel;
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
  /** `data-step` the open drill-down's pager reports. */
  protected readonly pageStep = this.views.pageStep;
  /** Accessible name of the pager that steps the open drill-down backwards. */
  protected readonly previousPageLabel = this.views.previousPageLabel;
  /** Accessible name of the pager that steps the open drill-down forwards. */
  protected readonly nextPageLabel = this.views.nextPageLabel;
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
