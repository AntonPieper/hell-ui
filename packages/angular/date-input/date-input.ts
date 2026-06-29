import {
  ChangeDetectionStrategy,
  Component,
  NO_ERRORS_SCHEMA,
  type ElementRef,
  computed,
  effect,
  InjectionToken,
  type Provider,
  booleanAttribute,
  inject,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  type AbstractControl,
  type NgControl,
  type ValidationErrors,
  type Validator,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { faSolidCalendar } from '@ng-icons/font-awesome/solid';
import {
  NgpFormControl,
  injectFormFieldState,
  ngpFormField,
  provideFormFieldState,
} from 'ng-primitives/form-field';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellPopover, HellPopoverTrigger } from '@hell-ui/angular/popover';
import { HellDatePicker } from '@hell-ui/angular/date-picker';
import { type HellLabels, HELL_LABELS } from '@hell-ui/angular/core';
import {
  hellSyncFormFieldDescriptions,
  hellSyncFormFieldLabels,
} from '@hell-ui/angular/internal/core';
import type { HellSize } from '@hell-ui/angular/core';
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';
import {
  HellTypedValueInputState,
  type HellTypedValueParseResult,
  hellInvalidTypedValue,
  hellTypedValue,
} from '@hell-ui/angular/internal/core';

const HELL_DATE_INPUT_ICONS = {
  faSolidCalendar,
};

let nextDateInputId = 0;

export type HellDateInputPart = 'root' | 'input' | 'trigger' | 'triggerIcon' | 'pickerPanel';

export type HellDateInputUi = HellUi<HellDateInputPart>;

const HELL_DATE_INPUT_RECIPE = {
  root: 'relative inline-flex w-full max-w-56 min-w-40 items-stretch rounded-hell-md border border-hell-border bg-hell-surface-elevated transition-[background-color,border-color,box-shadow] duration-[var(--hell-duration-fast)] ease-hell-out hover:border-hell-border-strong focus-within:border-hell-border-focus focus-within:shadow-[0_0_0_3px_var(--color-hell-focus-ring)] data-[invalid=true]:border-hell-danger data-[disabled=true]:cursor-not-allowed data-[disabled=true]:border-hell-border data-[disabled=true]:bg-hell-surface-subtle',
  input:
    'h-hell-control-md min-w-0 flex-1 rounded-hell-md border-0 bg-transparent px-hell-3 py-0 font-[inherit] text-[13px] text-hell-foreground tabular-nums outline-none placeholder:text-hell-foreground-subtle disabled:cursor-not-allowed disabled:text-hell-foreground-muted data-[size=sm]:h-hell-control-sm data-[size=sm]:text-xs data-[size=lg]:h-hell-control-lg data-[size=lg]:text-sm',
  trigger:
    'me-hell-1 inline-flex h-hell-control-sm w-hell-control-sm flex-none cursor-pointer items-center justify-center self-center rounded-hell-md border border-transparent bg-transparent p-0 text-hell-foreground-subtle transition-[background-color,color,box-shadow] duration-[var(--hell-duration-fast)] ease-hell-out hover:bg-hell-surface-muted hover:text-hell-foreground focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  triggerIcon: 'size-hell-4',
  pickerPanel: 'block rounded-hell-md bg-transparent p-0 shadow-none',
} satisfies HellRecipe<HellDateInputPart>;

export type HellDateInputParseResult = HellTypedValueParseResult<Date>;

export interface HellDateInputAdapter {
  /** Parse visible text. Return `{ valid: true, value: null }` to commit a clear. */
  readonly parseText: (text: string) => HellDateInputParseResult;
  /** Format the committed value for the text field. */
  readonly format: (value: Date | null) => string;
  /** Coerce external form/input values before display; invalid dates should return null. */
  readonly coerce?: (value: Date | null | undefined) => Date | null;
  /** Compare external values by semantic day/value instead of object identity. */
  readonly isSameValue?: (a: Date | null, b: Date | null) => boolean;
  /** Enforce business bounds after parsing and before emitting typed input. */
  readonly isWithinBounds?: (value: Date | null, min: Date | null, max: Date | null) => boolean;
}

export const HELL_DEFAULT_DATE_INPUT_ADAPTER: HellDateInputAdapter = {
  parseText: hellParseDateInputText,
  format: hellFormatDateInputValue,
  coerce: hellCoerceDateInputValue,
  isSameValue: hellSameDateInputValue,
  isWithinBounds: hellIsDateInputValueWithinBounds,
};

export const HELL_DATE_INPUT_ADAPTER = new InjectionToken<HellDateInputAdapter>(
  'HELL_DATE_INPUT_ADAPTER',
  { factory: () => HELL_DEFAULT_DATE_INPUT_ADAPTER },
);

export function provideHellDateInputAdapter(adapter: HellDateInputAdapter): Provider {
  return { provide: HELL_DATE_INPUT_ADAPTER, useValue: adapter };
}

/**
 * Try to parse a user-typed string into a `Date`. Accepts ISO `YYYY-MM-DD`
 * and the stable business format we render back into the input. Empty text
 * commits a nullable clear; unparseable text stays as an invalid draft.
 */
export function hellParseDateInputText(text: string): HellDateInputParseResult {
  const t = text.trim();
  if (!t) return hellTypedValue<Date>(null);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
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

export function hellFormatDateInputValue(d: Date | null): string {
  if (!d) return '';
  const year = d.getFullYear().toString().padStart(4, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateDayTime(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function dateDayValue(value: Date | null | undefined): Date | null {
  return value instanceof Date && !Number.isNaN(value.valueOf())
    ? new Date(value.getFullYear(), value.getMonth(), value.getDate())
    : null;
}

export function hellIsDateInputValueWithinBounds(
  d: Date | null,
  min: Date | null,
  max: Date | null,
): boolean {
  if (!d) return true;
  const day = dateDayTime(d);
  return (!min || day >= dateDayTime(min)) && (!max || day <= dateDayTime(max));
}

export function hellSameDateInputValue(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return a === b;
  return dateDayTime(a) === dateDayTime(b);
}

export function hellCoerceDateInputValue(value: Date | null | undefined): Date | null {
  return dateDayValue(value);
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
  imports: [NgpFormControl, HellIcon, HellPopover, HellPopoverTrigger, HellDatePicker],
  schemas: [NO_ERRORS_SCHEMA],
  viewProviders: [provideFormFieldState()],
  providers: [
    provideIcons(HELL_DATE_INPUT_ICONS),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HellDateInput),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => HellDateInput),
      multi: true,
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-size]': 'size()',
    '[attr.data-invalid]': 'isInvalid() ? "true" : null',
    '[attr.data-disabled]': 'isDisabled() ? "true" : null',
  },
  template: `
    <input
      #field
      ngpFormControl
      data-slot="input"
      [class]="part('input')"
      type="text"
      [attr.data-size]="size()"
      [attr.data-invalid]="isInvalid() ? 'true' : null"
      [id]="inputId()"
      [attr.name]="name()"
      [attr.aria-invalid]="isInvalid() ? 'true' : null"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-describedby]="fieldAriaDescribedby()"
      [attr.aria-labelledby]="fieldAriaLabelledby()"
      [disabled]="isDisabled()"
      [placeholder]="placeholder()"
      [value]="display()"
      (input)="onInput(field.value)"
      (blur)="onBlur()"
      (keydown.enter)="commit(field.value, $event)"
    />
    <button
      #calendarTrigger="hellPopoverTrigger"
      type="button"
      data-slot="trigger"
      [class]="part('trigger')"
      [hellPopoverTrigger]="cal"
      placement="bottom-end"
      [disabled]="isDisabled()"
      [attr.data-size]="size()"
      [attr.data-disabled]="isDisabled() ? 'true' : null"
      [attr.aria-label]="triggerAriaLabel()"
    >
      <hell-icon data-slot="triggerIcon" [class]="part('triggerIcon')" name="faSolidCalendar" />
    </button>

    <ng-template #cal>
      <div hellPopover data-slot="pickerPanel" [class]="part('pickerPanel')">
        <hell-date-picker
          [date]="current() ?? undefined"
          [focusedDate]="pickerFocusedDate()"
          [min]="min() ?? undefined"
          [max]="max() ?? undefined"
          [disabled]="isDisabled()"
          (dateChange)="onPick($any($event))"
          (focusedDateChange)="pickerFocusedDate.set($any($event))"
        />
      </div>
    </ng-template>
  `,
})
export class HellDateInput
  extends HellPartStyleable<HellDateInputPart>
  implements ControlValueAccessor, Validator
{
  protected readonly recipe = HELL_DATE_INPUT_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly size = input<Exclude<HellSize, 'xs' | 'xl'>>('md');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly date = input<Date | null>(null);
  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);
  readonly placeholder = input<string>('YYYY-MM-DD');
  readonly inputId = input<string>(`hell-date-input-${++nextDateInputId}-field`);
  readonly name = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  readonly ariaDescribedby = input<string | null>(null, { alias: 'aria-describedby' });
  readonly ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });

  readonly dateChange = output<Date | null>();

  private readonly dateAdapter = inject(HELL_DATE_INPUT_ADAPTER);

  private readonly controlMode = signal(false);
  private readonly controlValue = signal<Date | null>(null);
  private readonly controlDisabled = signal(false);
  private onControlChange: (value: Date | null) => void = () => {};
  private onControlTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  private readonly valueState = new HellTypedValueInputState<Date, Date | null>({
    external: () => this.effectiveDate(),
    parseExternal: (date) => this.coerceDate(date),
    parseText: (text) => this.parseText(text),
    format: (date) => this.dateAdapter.format(date),
    externalChanged: (base, current) => !this.sameDate(base, current),
  });
  protected readonly current = this.valueState.current;
  protected readonly display = this.valueState.display;
  protected readonly invalidDraft = this.valueState.invalidDraft;
  protected readonly isInvalid = () =>
    this.invalid() || this.invalidDraft() || this.formField.invalid() === true;
  protected readonly isDisabled = () => this.disabled() || this.controlDisabled();
  protected readonly fieldAriaDescribedby = computed(
    () => this.formField.descriptions().join(' ') || null,
  );
  protected readonly fieldAriaLabelledby = computed(
    () => this.formField.labels().join(' ') || null,
  );
  protected readonly pickerFocusedDate = signal<Date>(dateDayValue(new Date()) ?? new Date());
  protected readonly triggerAriaLabel = () => {
    const label = this.ariaLabel();
    return label ? this.labels.dateInput.chooseDateFor(label) : this.labels.dateInput.chooseDate;
  };

  private readonly labels = inject<HellLabels>(HELL_LABELS);
  private readonly inheritedFormField = injectFormFieldState({ optional: true, skipSelf: true });
  private readonly formField =
    this.inheritedFormField() ??
    ngpFormField({ ngControl: signal<NgControl | undefined>(undefined) });
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');
  private readonly calendarTrigger = viewChild.required<HellPopoverTrigger>('calendarTrigger');

  constructor() {
    super();
    hellSyncFormFieldDescriptions(this.formField, this.ariaDescribedby);
    hellSyncFormFieldLabels(this.formField, this.ariaLabelledby);
    effect(() => {
      this.invalidDraft();
      this.current();
      this.min();
      this.max();
      this.onValidatorChange();
    });
    effect(() => this.pickerFocusedDate.set(this.resolvePickerFocusedDate()));
  }

  writeValue(value: Date | null): void {
    this.controlMode.set(true);
    this.controlValue.set(this.coerceDate(value));
    this.valueState.clearDraft();
    this.valueState.clearLocal();
    this.onValidatorChange();
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onControlChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onControlTouched = fn;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlDisabled.set(isDisabled);
  }

  private effectiveDate(): Date | null {
    return this.controlMode() ? this.controlValue() : this.date();
  }

  private parseText(text: string) {
    const parsed = this.dateAdapter.parseText(text);
    if (!parsed.valid || !parsed.value) return parsed;
    return this.isWithinBounds(parsed.value) ? parsed : hellInvalidTypedValue();
  }

  protected onInput(value: string) {
    this.valueState.writeDraft(value);
    this.onValidatorChange();
  }

  protected onBlur() {
    const parsed = this.valueState.commitDraft();
    if (parsed.committed) this.emitValue(parsed.value);
    this.onControlTouched();
    this.onValidatorChange();
  }

  protected commit(text: string, event?: Event) {
    event?.preventDefault();
    const parsed = this.valueState.commitText(text);
    if (parsed.committed) this.emitValue(parsed.value);
    this.onValidatorChange();
  }

  protected async onPick(d: Date | undefined) {
    if (!d || !this.isWithinBounds(d)) return;
    const picked = this.valueState.setValue(d);
    if (picked.committed) this.emitValue(picked.value);
    this.onControlTouched();
    await this.calendarTrigger().hide();
    const field = this.field().nativeElement;
    setTimeout(() => field.focus());
    this.onValidatorChange();
  }

  private coerceDate(value: Date | null | undefined): Date | null {
    return this.dateAdapter.coerce
      ? this.dateAdapter.coerce(value)
      : hellCoerceDateInputValue(value);
  }

  private sameDate(a: Date | null, b: Date | null): boolean {
    return this.dateAdapter.isSameValue?.(a, b) ?? hellSameDateInputValue(a, b);
  }

  private isWithinBounds(value: Date | null): boolean {
    return (
      this.dateAdapter.isWithinBounds?.(value, this.min(), this.max()) ??
      hellIsDateInputValueWithinBounds(value, this.min(), this.max())
    );
  }

  private resolvePickerFocusedDate(): Date {
    const current = this.current();
    if (current) return current;

    const today = dateDayValue(new Date()) ?? new Date();
    const min = this.min();
    const max = this.max();

    if (min && dateDayTime(today) < dateDayTime(min)) return min;
    if (max && dateDayTime(today) > dateDayTime(max)) return max;
    return today;
  }

  validate(_control: AbstractControl | null): ValidationErrors | null {
    const errors: ValidationErrors = {};

    if (this.invalidDraft()) {
      errors['invalidDateInputDraft'] = true;
    }
    const current = this.current();
    if (current && !this.isWithinBounds(current)) {
      errors['outOfRangeDate'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  private emitValue(value: Date | null): void {
    if (this.controlMode()) this.controlValue.set(value);
    this.dateChange.emit(value);
    this.onControlChange(value);
    this.onValidatorChange();
  }
}
