import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  Renderer2,
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
import { HellButton } from '../button/button';
import { HellIcon } from '../icon/icon';
import { HELL_LABELS } from '../../core/labels';
import { HellStyleable } from '../../core/styleable';

const HELL_DATE_PICKER_ICONS = {
  faSolidAnglesLeft,
  faSolidAnglesRight,
  faSolidChevronLeft,
  faSolidChevronRight,
};

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
    '[attr.aria-label]': 'labels.datePicker.previousYear',
    '[attr.aria-disabled]': 'disabled()',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '(click)': 'shift(-12)',
  },
})
export class HellDatePickerPreviousYear {
  protected readonly labels = inject(HELL_LABELS);
  private readonly state = injectDatePickerState<Date>({ optional: true });
  private readonly rangeState = injectDateRangePickerState<Date>({ optional: true });
  private readonly buttonState = injectButtonState({ optional: true });
  protected readonly disabled = computed(() =>
    hellDatePickerYearShiftDisabled(this.state() ?? this.rangeState(), -12),
  );

  constructor() {
    effect(() => this.buttonState()?.setDisabled(this.disabled()));
  }

  protected shift(months: number) {
    if (this.disabled()) return;
    const s = this.state() ?? this.rangeState();
    if (!s) return;
    const focused = s.focusedDate();
    const next = hellShiftDateByMonths(focused, months);
    s.setFocusedDate(next, undefined, months > 0 ? 'forward' : 'backward');
  }
}

@Directive({
  selector: 'button[hellDatePickerNextYear]',
  host: {
    type: 'button',
    '[disabled]': 'disabled()',
    '[attr.aria-label]': 'labels.datePicker.nextYear',
    '[attr.aria-disabled]': 'disabled()',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '(click)': 'shift(12)',
  },
})
export class HellDatePickerNextYear {
  protected readonly labels = inject(HELL_LABELS);
  private readonly state = injectDatePickerState<Date>({ optional: true });
  private readonly rangeState = injectDateRangePickerState<Date>({ optional: true });
  private readonly buttonState = injectButtonState({ optional: true });
  protected readonly disabled = computed(() =>
    hellDatePickerYearShiftDisabled(this.state() ?? this.rangeState(), 12),
  );

  constructor() {
    effect(() => this.buttonState()?.setDisabled(this.disabled()));
  }

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
  <div class="hell-date-picker-header">
    <div class="hell-date-picker-nav">
      <button hellButton variant="ghost" size="sm" iconOnly type="button" hellDatePickerPreviousYear>
        <hell-icon name="faSolidAnglesLeft" />
      </button>
      <button hellButton variant="ghost" size="sm" iconOnly type="button"
              ngpDatePickerPreviousMonth [attr.aria-label]="labels.datePicker.previousMonth">
        <hell-icon name="faSolidChevronLeft" />
      </button>
    </div>
    <h2 ngpDatePickerLabel class="hell-date-picker-label">{{ label() }}</h2>
    <div class="hell-date-picker-nav">
      <button hellButton variant="ghost" size="sm" iconOnly type="button"
              ngpDatePickerNextMonth [attr.aria-label]="labels.datePicker.nextMonth">
        <hell-icon name="faSolidChevronRight" />
      </button>
      <button hellButton variant="ghost" size="sm" iconOnly type="button" hellDatePickerNextYear>
        <hell-icon name="faSolidAnglesRight" />
      </button>
    </div>
  </div>
  <table
    ngpDatePickerGrid
    class="hell-date-picker-grid"
    [attr.aria-label]="label()"
  >
    <thead>
      <tr>
        @for (weekday of weekdayLabels(); track weekday.abbr) {
          <th scope="col" [attr.abbr]="weekday.abbr">{{ weekday.narrow }}</th>
        }
      </tr>
    </thead>
    <tbody>
      <tr *ngpDatePickerRowRender>
        <td *ngpDatePickerCellRender="let date" ngpDatePickerCell>
          <button ngpDatePickerDateButton type="button">
            {{ date.getDate() }}
          </button>
        </td>
      </tr>
    </tbody>
  </table>
`;

interface HellWeekdayLabel {
  readonly abbr: string;
  readonly narrow: string;
}

function formatMonthLabel(date: Date, locale: string | null): string {
  return new Intl.DateTimeFormat(locale ?? undefined, {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatWeekdayLabels(locale: string | null, firstDayOfWeek: number): HellWeekdayLabel[] {
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
  HellButton,
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
  host: { '[class.hell-date-picker]': '!unstyled()' },
  template: PICKER_TEMPLATE,
})
export class HellDatePicker extends HellStyleable {
  readonly locale = input<string | null>(null);

  protected readonly labels = inject(HELL_LABELS);
  private readonly state = injectDatePickerState<Date>();

  protected readonly label = computed(() =>
    formatMonthLabel(this.state().focusedDate(), this.locale()),
  );
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
    '[class.hell-date-picker]': '!unstyled()',
    '[attr.data-range]': '"true"',
  },
  template: PICKER_TEMPLATE,
})
export class HellDateRangePicker extends HellStyleable {
  readonly locale = input<string | null>(null);

  protected readonly labels = inject(HELL_LABELS);
  private readonly state = injectDateRangePickerState<Date>();
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly rangeCompletionState = effect(() => {
    const complete = Boolean(this.state().startDate() && this.state().endDate());
    const element = this.elementRef.nativeElement;

    if (complete) {
      this.renderer.setAttribute(element, 'data-range-complete', '');
    } else {
      this.renderer.removeAttribute(element, 'data-range-complete');
    }
  });

  protected readonly label = computed(() =>
    formatMonthLabel(this.state().focusedDate(), this.locale()),
  );
  protected readonly weekdayLabels = computed(() =>
    formatWeekdayLabels(this.locale(), this.state().firstDayOfWeek()),
  );
}
