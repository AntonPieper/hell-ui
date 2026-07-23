import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { faSolidCalendarDays } from '@ng-icons/font-awesome/solid';

import { HELL_CONTROL_GROUP_IMPORTS } from 'hell-ui/control-group';
import { HellDateInput } from 'hell-ui/date-input';
import { HellDatePicker } from 'hell-ui/date-picker';
import { HELL_FIELD_IMPORTS } from 'hell-ui/field';
import { HellIcon } from 'hell-ui/icon';
import { HellPopover, HellPopoverTrigger } from 'hell-ui/popover';

@Component({
  selector: 'app-date-input-with-calendar-picker-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    HellDateInput,
    HellDatePicker,
    HellIcon,
    HellPopover,
    HellPopoverTrigger,
    ...HELL_CONTROL_GROUP_IMPORTS,
    ...HELL_FIELD_IMPORTS,
  ],
  providers: [provideIcons({ faSolidCalendarDays })],
  template: `
    <div class="min-h-[390px] w-full max-w-sm" hellField>
      <label id="ship-date-label" hellFieldLabel for="ship-date">Ship date</label>
      <div
        hellControlGroup
        aria-labelledby="ship-date-label"
        [invalid]="control.invalid"
        [disabled]="control.disabled"
      >
        <input
          #dateField
          id="ship-date"
          hellDateInput
          placeholder="YYYY-MM-DD"
          [formControl]="control"
          [min]="minDate"
          [max]="maxDate"
          [invalid]="control.invalid"
          [ui]="controlUi"
          (valueChange)="focusedDate.set($event ?? minDate)"
        />
        <button
          #calendarTrigger="hellPopoverTrigger"
          hellControlGroupAction
          type="button"
          aria-label="Choose ship date"
          [hellPopoverTrigger]="calendar"
          placement="bottom-end"
          [shift]="pickerShift"
          [disabled]="control.disabled"
        >
          <hell-icon name="faSolidCalendarDays" />
        </button>
      </div>
      <div hellFieldDescription>
        Type an ISO date or use the explicitly composed calendar action.
      </div>
    </div>

    <ng-template #calendar>
      <div
        hellPopover
        data-date-input-calendar
        aria-label="Choose ship date"
        ui="w-auto max-w-none p-0"
      >
        <hell-date-picker
          [date]="control.value ?? undefined"
          [focusedDate]="focusedDate()"
          [min]="minDate"
          [max]="maxDate"
          (dateChange)="selectDate($event)"
          (focusedDateChange)="focusedDate.set($event)"
        />
      </div>
    </ng-template>
  `,
})
export class DateInputWithCalendarPickerExample {
  protected readonly minDate = new Date(2026, 3, 1);
  protected readonly maxDate = new Date(2026, 11, 31);
  protected readonly control = new FormControl<Date | null>(new Date(2026, 5, 15));
  protected readonly focusedDate = signal(new Date(2026, 5, 15));
  protected readonly pickerShift = { padding: 8 } as const;
  protected readonly controlUi =
    'h-auto min-h-0 min-w-0 max-w-none flex-1 rounded-none border-0 bg-transparent shadow-none focus:border-transparent focus:shadow-none data-focus:border-transparent data-focus:shadow-none disabled:bg-transparent data-disabled:bg-transparent';

  private readonly dateField = viewChild.required<ElementRef<HTMLInputElement>>('dateField');
  private readonly calendarTrigger = viewChild<HellPopoverTrigger>('calendarTrigger');
  private focusInputAfterClose = false;

  constructor() {
    effect(() => {
      const trigger = this.calendarTrigger();
      // `open` becomes false after overlay teardown and trigger-focus
      // restoration, so the selected-date focus wins without a timing shim.
      const open = trigger?.open() ?? false;
      if (!trigger || open || !this.focusInputAfterClose) return;

      this.focusInputAfterClose = false;
      this.dateField().nativeElement.focus();
    });
  }

  protected selectDate(date: Date | undefined): void {
    if (!date) return;
    this.control.setValue(date);
    this.control.markAsTouched();
    this.focusedDate.set(date);
    this.focusInputAfterClose = true;
    void this.calendarTrigger()?.hide();
  }
}
