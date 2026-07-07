import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidCalendarDays } from '@ng-icons/font-awesome/solid';
import { HellButton } from '@hell-ui/angular/button';
import { HellDateRangePicker } from '@hell-ui/angular/date-picker';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellPopover, HellPopoverTrigger } from '@hell-ui/angular/popover';

@Component({
  selector: 'app-date-picker-with-popover-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ faSolidCalendarDays })],
  imports: [HellButton, HellIcon, HellDateRangePicker, HellPopover, HellPopoverTrigger],
  template: `
    <div class="min-h-[360px] max-w-xs">
      <span class="mb-hell-2 block text-xs font-semibold text-hell-foreground">Trip dates</span>
      <button
        hellButton
        variant="default"
        block
        [hellPopoverTrigger]="calendar"
        placement="bottom-start"
      >
        <hell-icon name="faSolidCalendarDays" />
        {{ summary() }}
      </button>
    </div>

    <ng-template #calendar>
      <div hellPopover aria-label="Choose trip dates" class="w-auto">
        <hell-date-range-picker
          [startDate]="start()"
          [endDate]="end()"
          [min]="today"
          (startDateChange)="start.set($event)"
          (endDateChange)="end.set($event)"
          ui="border-0 p-0 shadow-none"
        />
      </div>
    </ng-template>
  `,
})
export class DatePickerWithPopoverExample {
  protected readonly today = new Date(2026, 3, 1);
  protected readonly start = signal<Date | undefined>(new Date(2026, 3, 6));
  protected readonly end = signal<Date | undefined>(new Date(2026, 3, 13));

  protected readonly summary = computed(() => {
    const start = this.start();
    const end = this.end();
    if (!start) return 'Select dates';
    const format = (date: Date) =>
      new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
    return end ? `${format(start)} – ${format(end)}` : `${format(start)} – …`;
  });
}
