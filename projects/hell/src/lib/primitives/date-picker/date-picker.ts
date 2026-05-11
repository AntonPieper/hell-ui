import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  computed,
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
import { HellButton } from '../button/button';
import { HellIcon } from '../icon/icon';
import { HellStyleable } from '../../core/styleable';

const HELL_DATE_PICKER_ICONS = {
  faSolidAnglesLeft,
  faSolidAnglesRight,
  faSolidChevronLeft,
  faSolidChevronRight,
};

/**
 * Previous/next year buttons. ng-primitives ships month nav out of the box;
 * year nav is implemented here on top of the picker state so users can jump
 * 12 months at a time without scrubbing through the month buttons.
 */
@Directive({
  selector: 'button[hellDatePickerPreviousYear]',
  host: {
    type: 'button',
    'aria-label': 'Previous year',
    '(click)': 'shift(-12)',
  },
})
export class HellDatePickerPreviousYear {
  private readonly state = injectDatePickerState<Date>({ optional: true });
  private readonly rangeState = injectDateRangePickerState<Date>({ optional: true });
  protected shift(months: number) {
    const s = this.state() ?? this.rangeState();
    if (!s) return;
    const focused = s.focusedDate();
    const next = new Date(focused);
    next.setMonth(next.getMonth() + months);
    s.setFocusedDate(next, undefined, months > 0 ? 'forward' : 'backward');
  }
}

@Directive({
  selector: 'button[hellDatePickerNextYear]',
  host: {
    type: 'button',
    'aria-label': 'Next year',
    '(click)': 'shift(12)',
  },
})
export class HellDatePickerNextYear {
  private readonly state = injectDatePickerState<Date>({ optional: true });
  private readonly rangeState = injectDateRangePickerState<Date>({ optional: true });
  protected shift(months: number) {
    const s = this.state() ?? this.rangeState();
    if (!s) return;
    const focused = s.focusedDate();
    const next = new Date(focused);
    next.setMonth(next.getMonth() + months);
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
              ngpDatePickerPreviousMonth aria-label="Previous month">
        <hell-icon name="faSolidChevronLeft" />
      </button>
    </div>
    <h2 ngpDatePickerLabel class="hell-date-picker-label">{{ label() }}</h2>
    <div class="hell-date-picker-nav">
      <button hellButton variant="ghost" size="sm" iconOnly type="button"
              ngpDatePickerNextMonth aria-label="Next month">
        <hell-icon name="faSolidChevronRight" />
      </button>
      <button hellButton variant="ghost" size="sm" iconOnly type="button" hellDatePickerNextYear>
        <hell-icon name="faSolidAnglesRight" />
      </button>
    </div>
  </div>
  <table ngpDatePickerGrid class="hell-date-picker-grid">
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
        'ngpDatePickerMin:min',
        'ngpDatePickerMax:max',
        'ngpDatePickerDisabled:disabled',
        'ngpDatePickerFirstDayOfWeek:firstDayOfWeek',
      ],
      outputs: ['ngpDatePickerDateChange:dateChange'],
    },
  ],
  imports: [...PICKER_IMPORTS],
  host: { '[class.hell-date-picker]': '!unstyled()' },
  template: PICKER_TEMPLATE,
})
export class HellDatePicker extends HellStyleable {
  readonly locale = input<string | null>(null);

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
        'ngpDateRangePickerMin:min',
        'ngpDateRangePickerMax:max',
        'ngpDateRangePickerDisabled:disabled',
        'ngpDateRangePickerFirstDayOfWeek:firstDayOfWeek',
      ],
      outputs: [
        'ngpDateRangePickerStartDateChange:startDateChange',
        'ngpDateRangePickerEndDateChange:endDateChange',
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

  private readonly state = injectDateRangePickerState<Date>();

  protected readonly label = computed(() =>
    formatMonthLabel(this.state().focusedDate(), this.locale()),
  );
  protected readonly weekdayLabels = computed(() =>
    formatWeekdayLabels(this.locale(), this.state().firstDayOfWeek()),
  );
}
