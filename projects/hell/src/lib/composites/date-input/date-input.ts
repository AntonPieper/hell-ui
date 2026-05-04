import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  booleanAttribute,
  input,
  output,
  viewChild,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidCalendar } from '@ng-icons/font-awesome/solid';
import { HellButton } from '../../primitives/button/button';
import { HellIcon } from '../../primitives/icon/icon';
import { HellInput } from '../../primitives/input/input';
import { HellPopover, HellPopoverTrigger } from '../../primitives/popover/popover';
import { HellDatePicker } from '../../primitives/date-picker/date-picker';
import type { HellSize } from '../../core/types';
import { HellStyleable } from '../../core/styleable';
import { HellTypedValueInputState } from '../../core/typed-value-input';

const HELL_DATE_INPUT_ICONS = {
  faSolidCalendar,
};

/**
 * Try to parse a user-typed string into a `Date`. Accepts ISO `YYYY-MM-DD`
 * and the locale-formatted output we render back into the input. Returns
 * `null` for empty / unparseable input so callers can revert to the
 * previous valid value on blur.
 */
function tryParse(text: string): Date | null {
  const t = text.trim();
  if (!t) return null;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (iso) {
    const year = +iso[1];
    const month = +iso[2];
    const day = +iso[3];
    const d = new Date(year, month - 1, day);
    if (Number.isNaN(d.getTime())) return null;
    return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day ? d : null;
  }
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(d: Date | null): string {
  if (!d) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Date input — a text field paired with a calendar icon trigger that opens
 * an inline date picker popover. Users can type or paste a date directly
 * (ISO `YYYY-MM-DD` always works, plus anything `Date.parse` understands)
 * or pick from the calendar.
 *
 * Bind to `[date]` and listen to `(dateChange)`. Pair with `hellField` for
 * label / description / error wiring.
 */
@Component({
  selector: 'hell-date-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellIcon, HellInput, HellPopover, HellPopoverTrigger, HellDatePicker],
  providers: [provideIcons(HELL_DATE_INPUT_ICONS)],
  host: {
    '[class.hell-date-input]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.data-invalid]': 'invalid() ? "true" : null',
    '[attr.data-disabled]': 'disabled() ? "true" : null',
  },
  template: `
    <input
      #field
      hellInput
      unstyled
      [size]="size()"
      type="text"
      data-slot="field"
      [invalid]="invalid()"
      [attr.aria-invalid]="invalid() ? 'true' : null"
      [attr.aria-label]="ariaLabel()"
      [disabled]="disabled()"
      [placeholder]="placeholder()"
      [value]="display()"
      (input)="onInput($event.target.value)"
      (blur)="onBlur()"
      (keydown.enter)="commit($event.target.value, $event)"
    />
    <button
      hellButton
      variant="ghost"
      size="sm"
      iconOnly
      type="button"
      data-slot="trigger"
      [hellPopoverTrigger]="cal"
      placement="bottom-end"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel() ?? 'Choose date'"
      tabindex="-1"
    >
      <hell-icon name="faSolidCalendar" />
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
export class HellDateInput extends HellStyleable {
  readonly size = input<Exclude<HellSize, 'xs' | 'xl'>>('md');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly date = input<Date | null>(null);
  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);
  readonly placeholder = input<string>('YYYY-MM-DD');
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  readonly dateChange = output<Date>();

  private readonly valueState = new HellTypedValueInputState<Date, Date | null>({
    external: () => this.date(),
    parseExternal: (date) => date,
    parseText: tryParse,
    format: formatDate,
  });
  protected readonly current = this.valueState.current;
  protected readonly display = this.valueState.display;

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  protected onInput(value: string) {
    this.valueState.writeDraft(value);
  }

  protected onBlur() {
    const parsed = this.valueState.commitDraft();
    if (parsed) this.dateChange.emit(parsed);
  }

  protected commit(text: string, event?: Event) {
    event?.preventDefault();
    const parsed = this.valueState.commitText(text);
    if (parsed) this.dateChange.emit(parsed);
  }

  protected onPick(d: Date | undefined) {
    if (!d) return;
    this.dateChange.emit(this.valueState.setValue(d));
    this.field().nativeElement.focus();
  }
}
