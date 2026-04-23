import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';
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
  injectDatePickerState,
} from 'ng-primitives/date-picker';
import { HellButton } from '../button/button';
import { HellIcon } from '../icon/icon';

/**
 * Calendar-style date picker built on `ng-primitives/date-picker`. Emits via
 * `dateChange` and supports `min`, `max`, and `disabled`. Pair with a popover
 * if you want a dropdown-style trigger; the bare component renders inline.
 */
@Component({
  selector: 'hell-date-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: NgpDatePicker,
      inputs: [
        'ngpDatePickerDate:date',
        'ngpDatePickerMin:min',
        'ngpDatePickerMax:max',
        'ngpDatePickerDisabled:disabled',
      ],
      outputs: ['ngpDatePickerDateChange:dateChange'],
    },
  ],
  imports: [
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
  ],
  host: { '[class.hell-date-picker]': '!unstyled()' },
  template: `
    <div class="hell-date-picker-header">
      <button
        hellButton
        variant="ghost"
        size="sm"
        iconOnly
        type="button"
        ngpDatePickerPreviousMonth
        aria-label="Previous month"
      >
        <hell-icon name="faSolidChevronLeft" />
      </button>
      <h2 ngpDatePickerLabel class="hell-date-picker-label">{{ label() }}</h2>
      <button
        hellButton
        variant="ghost"
        size="sm"
        iconOnly
        type="button"
        ngpDatePickerNextMonth
        aria-label="Next month"
      >
        <hell-icon name="faSolidChevronRight" />
      </button>
    </div>
    <table ngpDatePickerGrid class="hell-date-picker-grid">
      <thead>
        <tr>
          <th scope="col" abbr="Sunday">S</th>
          <th scope="col" abbr="Monday">M</th>
          <th scope="col" abbr="Tuesday">T</th>
          <th scope="col" abbr="Wednesday">W</th>
          <th scope="col" abbr="Thursday">T</th>
          <th scope="col" abbr="Friday">F</th>
          <th scope="col" abbr="Saturday">S</th>
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
  `,
})
export class HellDatePicker {
  readonly unstyled = input(false, { transform: booleanAttribute });

  private readonly state = injectDatePickerState<Date>();

  protected readonly label = computed(() => {
    const focused = this.state().focusedDate();
    return `${focused.toLocaleString('default', { month: 'long' })} ${focused.getFullYear()}`;
  });
}
