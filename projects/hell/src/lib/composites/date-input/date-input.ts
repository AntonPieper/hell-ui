import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  booleanAttribute,
  inject,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { faSolidCalendar } from '@ng-icons/font-awesome/solid';
import { HellButton } from '../../primitives/button/button';
import { HellIcon } from '../../primitives/icon/icon';
import { HellInput } from '../../primitives/input/input';
import { HellPopover, HellPopoverTrigger } from '../../primitives/popover/popover';
import { HellDatePicker } from '../../primitives/date-picker/date-picker';
import { HELL_LABELS } from '../../core/labels';
import type { HellSize } from '../../core/types';
import { HellStyleable } from '../../core/styleable';
import {
  HellTypedValueInputState,
  hellInvalidTypedValue,
  hellTypedValue,
} from '../../core/typed-value-input';

const HELL_DATE_INPUT_ICONS = {
  faSolidCalendar,
};

/**
 * Try to parse a user-typed string into a `Date`. Accepts ISO `YYYY-MM-DD`
 * and the stable business format we render back into the input. Empty text
 * commits a nullable clear; unparseable text stays as an invalid draft.
 */
function tryParseDateText(text: string) {
  const t = text.trim();
  if (!t) return hellTypedValue<Date>(null);
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (iso) {
    const year = +iso[1];
    const month = +iso[2];
    const day = +iso[3];
    const d = new Date(year, month - 1, day);
    if (Number.isNaN(d.getTime())) return hellInvalidTypedValue();
    return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day
      ? hellTypedValue(d)
      : hellInvalidTypedValue();
  }
  return hellInvalidTypedValue();
}

function formatDate(d: Date | null): string {
  if (!d) return '';
  const year = d.getFullYear().toString().padStart(4, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateDayTime(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function isDateWithinBounds(d: Date | null, min: Date | null, max: Date | null): boolean {
  if (!d) return true;
  const day = dateDayTime(d);
  return (!min || day >= dateDayTime(min)) && (!max || day <= dateDayTime(max));
}

function dateChanged(a: Date | null, b: Date | null): boolean {
  return a?.getTime() !== b?.getTime();
}

/**
 * Date input — a text field paired with a calendar icon trigger that opens
 * an inline date picker popover. Users can type or paste an explicit
 * `YYYY-MM-DD` date or pick from the calendar.
 *
 * Bind to `[date]` and listen to `(dateChange)`. Pair with `hellField` for
 * label / description / error wiring.
 */
@Component({
  selector: 'hell-date-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellIcon, HellInput, HellPopover, HellPopoverTrigger, HellDatePicker],
  providers: [
    provideIcons(HELL_DATE_INPUT_ICONS),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HellDateInput),
      multi: true,
    },
  ],
  host: {
    '[class.hell-date-input]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.data-invalid]': 'isInvalid() ? "true" : null',
    '[attr.data-disabled]': 'isDisabled() ? "true" : null',
  },
  template: `
    <input
      #field
      hellInput
      unstyled
      [size]="size()"
      type="text"
      data-slot="field"
      [invalid]="isInvalid()"
      [attr.aria-invalid]="isInvalid() ? 'true' : null"
      [attr.aria-label]="ariaLabel()"
      [disabled]="isDisabled()"
      [placeholder]="placeholder()"
      [value]="display()"
      (input)="onInput(field.value)"
      (blur)="onBlur()"
      (keydown.enter)="commit(field.value, $event)"
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
      [disabled]="isDisabled()"
      [attr.aria-label]="triggerAriaLabel()"
    >
      <hell-icon name="faSolidCalendar" />
    </button>

    <ng-template #cal>
      <div hellPopover>
        <hell-date-picker
          [date]="current() ?? undefined"
          [min]="min() ?? undefined"
          [max]="max() ?? undefined"
          [disabled]="isDisabled()"
          (dateChange)="onPick($event)"
        />
      </div>
    </ng-template>
  `,
})
export class HellDateInput extends HellStyleable implements ControlValueAccessor {
  readonly size = input<Exclude<HellSize, 'xs' | 'xl'>>('md');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly date = input<Date | null>(null);
  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);
  readonly placeholder = input<string>('YYYY-MM-DD');
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  readonly dateChange = output<Date | null>();

  private readonly controlMode = signal(false);
  private readonly controlValue = signal<Date | null>(null);
  private readonly controlDisabled = signal(false);
  private onControlChange: (value: Date | null) => void = () => {};
  private onControlTouched: () => void = () => {};

  private readonly valueState = new HellTypedValueInputState<Date, Date | null>({
    external: () => this.effectiveDate(),
    parseExternal: (date) => date,
    parseText: (text) => this.parseText(text),
    format: formatDate,
    externalChanged: dateChanged,
  });
  protected readonly current = this.valueState.current;
  protected readonly display = this.valueState.display;
  protected readonly invalidDraft = this.valueState.invalidDraft;
  protected readonly isInvalid = () => this.invalid() || this.invalidDraft();
  protected readonly isDisabled = () => this.disabled() || this.controlDisabled();
  protected readonly triggerAriaLabel = () => {
    const label = this.ariaLabel();
    return label ? this.labels.dateInput.chooseDateFor(label) : this.labels.dateInput.chooseDate;
  };

  private readonly labels = inject(HELL_LABELS);
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  writeValue(value: Date | null): void {
    this.controlMode.set(true);
    this.controlValue.set(value instanceof Date && !Number.isNaN(value.valueOf()) ? value : null);
    this.valueState.clearDraft();
    this.valueState.clearLocal();
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onControlChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onControlTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlDisabled.set(isDisabled);
  }

  private effectiveDate(): Date | null {
    return this.controlMode() ? this.controlValue() : this.date();
  }

  private parseText(text: string) {
    const parsed = tryParseDateText(text);
    if (!parsed.valid || !parsed.value) return parsed;
    return isDateWithinBounds(parsed.value, this.min(), this.max())
      ? parsed
      : hellInvalidTypedValue();
  }

  protected onInput(value: string) {
    this.valueState.writeDraft(value);
  }

  protected onBlur() {
    this.onControlTouched();
    const parsed = this.valueState.commitDraft();
    if (parsed.committed) this.emitValue(parsed.value);
  }

  protected commit(text: string, event?: Event) {
    event?.preventDefault();
    const parsed = this.valueState.commitText(text);
    if (parsed.committed) this.emitValue(parsed.value);
  }

  protected onPick(d: Date | undefined) {
    if (!d || !isDateWithinBounds(d, this.min(), this.max())) return;
    const picked = this.valueState.setValue(d);
    if (picked.committed) this.emitValue(picked.value);
    this.onControlTouched();
    this.field().nativeElement.focus();
  }

  private emitValue(value: Date | null): void {
    if (this.controlMode()) this.controlValue.set(value);
    this.dateChange.emit(value);
    this.onControlChange(value);
  }
}
