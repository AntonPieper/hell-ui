import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { HellButton } from '../button/button';
import { HellIcon } from '../icon/icon';
import { HellPopover, HellPopoverTrigger } from '../popover/popover';
import { HellDatePicker } from '../date-picker/date-picker';
import { HellSize } from '../../core/types';

/**
 * Date input — a styled trigger button paired with a calendar popover built
 * on `ng-primitives/date-picker`. Bind to `[date]` and listen to
 * `(dateChange)` for the selected `Date`. Pass `[min]` / `[max]` to bound
 * the picker.
 */
@Component({
  selector: 'hell-date-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellIcon, HellPopover, HellPopoverTrigger, HellDatePicker],
  host: {
    '[class.hell-date-input]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.data-invalid]': 'invalid() ? "true" : null',
    '[attr.data-disabled]': 'disabled() ? "true" : null',
  },
  template: `
    <button
      hellButton
      variant="ghost"
      type="button"
      class="hell-date-input-trigger"
      [hellPopoverTrigger]="cal"
      placement="bottom-start"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel()"
    >
      <hell-icon name="faSolidCalendar" class="hell-date-input-icon" />
      <span class="hell-date-input-value">{{ formatted() || placeholder() }}</span>
    </button>

    <ng-template #cal>
      <div hellPopover>
        <hell-date-picker
          [date]="current() ?? undefined"
          [min]="min() ?? undefined"
          [max]="max() ?? undefined"
          [disabled]="disabled()"
          (dateChange)="onPick($event)"
        />
      </div>
    </ng-template>
  `,
})
export class HellDateInput {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly size = input<HellSize>('md');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly date = input<Date | null>(null);
  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);
  readonly placeholder = input<string>('Select date');
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  readonly dateChange = output<Date>();

  private readonly local = signal<Date | null>(null);
  protected readonly current = computed<Date | null>(() => this.date() ?? this.local());

  protected readonly formatted = computed(() => {
    const d = this.current();
    if (!d) return '';
    return d.toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  });

  protected onPick(d: Date | undefined) {
    if (!d) return;
    this.local.set(d);
    this.dateChange.emit(d);
  }
}
