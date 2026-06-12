import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  InjectionToken,
  input,
  output,
  signal,
  type Provider,
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
import { faSolidClock } from '@ng-icons/font-awesome/solid';
import {
  injectFormFieldState,
  ngpFormField,
  provideFormFieldState,
} from 'ng-primitives/form-field';
import { HellButton } from '../../primitives/button/button';
import { HellIcon } from '../../primitives/icon/icon';
import { HellInput } from '../../primitives/input/input';
import { HellPopover, HellPopoverTrigger } from '../../primitives/popover/popover';
import { HELL_LABELS } from '../../core/labels';
import {
  hellSyncFormFieldDescriptions,
  hellSyncFormFieldLabels,
} from '../../core/form-field-idrefs';
import type { HellSize } from '../../core/types';
import { HellStyleable } from '../../core/styleable';
import {
  HellTypedValueInputState,
  type HellTypedValueParseResult,
  hellInvalidTypedValue,
  hellTypedValue,
} from '../../core/typed-value-input';
import {
  hellTimeInputNextPickerValue,
  hellTimeInputPickerMaxValue,
  type HellTimeInputPickerUnit,
} from './time-input-picker';

export interface HellTimeValue {
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

const HELL_TIME_INPUT_ICONS = {
  faSolidClock,
};

let nextTimeInputId = 0;

export interface HellTimeInputAdapterContext {
  readonly seconds: boolean;
}

type HellTimeUnit = HellTimeInputPickerUnit;

export type HellTimeInputParseResult = HellTypedValueParseResult<HellTimeValue>;

export interface HellTimeInputAdapter {
  /** Parse visible text. Return `{ valid: true, value: null }` to commit a clear. */
  readonly parseText: (
    text: string,
    context: HellTimeInputAdapterContext,
  ) => HellTimeInputParseResult;
  /** Format a committed time value for the text field and picker readout. */
  readonly format: (value: HellTimeValue, context: HellTimeInputAdapterContext) => string;
  /** Coerce external form/input values before display; invalid values should return null. */
  readonly normalize?: (
    value: HellTimeValue | null | undefined,
    context: HellTimeInputAdapterContext,
  ) => HellTimeValue | null;
  /** Compare structured time values semantically instead of by object identity. */
  readonly isSameValue?: (a: HellTimeValue | null, b: HellTimeValue | null) => boolean;
}

export const HELL_DEFAULT_TIME_INPUT_ADAPTER: HellTimeInputAdapter = {
  parseText: hellParseTimeInputText,
  format: hellFormatTimeInputValue,
  normalize: hellNormalizeTimeInputValue,
  isSameValue: hellSameTimeInputValue,
};

export const HELL_TIME_INPUT_ADAPTER = new InjectionToken<HellTimeInputAdapter>(
  'HELL_TIME_INPUT_ADAPTER',
  { factory: () => HELL_DEFAULT_TIME_INPUT_ADAPTER },
);

export function provideHellTimeInputAdapter(adapter: HellTimeInputAdapter): Provider {
  return { provide: HELL_TIME_INPUT_ADAPTER, useValue: adapter };
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function hellFormatTimeInputValue(
  t: HellTimeValue,
  context: HellTimeInputAdapterContext,
): string {
  return context.seconds
    ? `${pad(t.hour)}:${pad(t.minute)}:${pad(t.second)}`
    : `${pad(t.hour)}:${pad(t.minute)}`;
}

/**
 * Parse the business-default text formats: `HH:mm`, and `HH:mm:ss` when
 * `seconds` is enabled, plus a couple of common 12-hour spellings
 * (`9:00 am`, `1:30PM`). Locale parsing is intentionally off by default.
 * Empty text commits a nullable clear; unparseable text stays as an invalid
 * draft.
 */
export function hellNormalizeTimeInputValue(
  value: HellTimeValue | null | undefined,
  context: HellTimeInputAdapterContext,
): HellTimeValue | null {
  if (!isValidTime(value)) return null;
  return context.seconds ? value : { ...value, second: 0 };
}

export function hellParseTimeInputText(
  text: string,
  context: HellTimeInputAdapterContext,
): HellTimeInputParseResult {
  const t = text.trim().toLowerCase();
  if (!t) return hellTypedValue<HellTimeValue>(null);
  const ampm = /^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?\s*(am|pm)$/.exec(t);
  if (ampm) {
    if (!context.seconds && ampm[3] !== undefined) return hellInvalidTypedValue();
    let hour = +ampm[1];
    const minute = +(ampm[2] ?? '0');
    const second = +(ampm[3] ?? '0');
    if (hour === 12) hour = 0;
    if (ampm[4] === 'pm') hour += 12;
    const value = { hour, minute, second };
    if (!isValidTime(value)) return hellInvalidTypedValue();
    return hellTypedValue(hellNormalizeTimeInputValue(value, context));
  }
  const m = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.exec(t);
  if (!m || (!context.seconds && m[3] !== undefined)) return hellInvalidTypedValue();
  const hour = +m[1];
  const minute = +m[2];
  const second = +(m[3] ?? '0');
  const value = { hour, minute, second };
  return isValidTime(value)
    ? hellTypedValue(hellNormalizeTimeInputValue(value, context))
    : hellInvalidTypedValue();
}

function isValidTime(value: HellTimeValue | null | undefined): value is HellTimeValue {
  return (
    !!value &&
    Number.isInteger(value.hour) &&
    Number.isInteger(value.minute) &&
    Number.isInteger(value.second) &&
    value.hour >= 0 &&
    value.hour <= 23 &&
    value.minute >= 0 &&
    value.minute <= 59 &&
    value.second >= 0 &&
    value.second <= 59
  );
}

export function hellSameTimeInputValue(a: HellTimeValue | null, b: HellTimeValue | null): boolean {
  return a?.hour === b?.hour && a?.minute === b?.minute && a?.second === b?.second;
}

/**
 * Time input — text field paired with a clock icon trigger that opens a
 * segmented spinbutton picker. Bind `[value]` as a structured
 * `HellTimeValue | null` and listen to `(valueChange)`.
 *
 * The picker uses segmented hour, minute, and optional second spinbuttons with
 * Arrow/Home/End/PageUp/PageDown navigation and quick minute presets.
 */
@Component({
  selector: 'hell-time-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellIcon, HellInput, HellPopover, HellPopoverTrigger],
  viewProviders: [provideFormFieldState()],
  providers: [
    provideIcons(HELL_TIME_INPUT_ICONS),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HellTimeInput),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => HellTimeInput),
      multi: true,
    },
  ],
  host: {
    '[class.hell-time-input]': '!unstyled()',
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
      inputmode="text"
      autocomplete="off"
      [invalid]="isInvalid()"
      [id]="inputId()"
      [attr.name]="name()"
      [attr.aria-invalid]="isInvalid() ? 'true' : null"
      [attr.aria-label]="ariaLabel()"
      [disabled]="isDisabled()"
      [placeholder]="placeholder() ?? (seconds() ? 'HH:mm:ss' : 'HH:mm')"
      [value]="display()"
      (input)="onInput(field.value)"
      (blur)="onBlur()"
      (keydown.enter)="commit(field.value, $event)"
      (keydown)="onFieldKeydown($event)"
    />
    <button
      hellButton
      variant="ghost"
      size="sm"
      iconOnly
      type="button"
      data-slot="trigger"
      [hellPopoverTrigger]="picker"
      placement="bottom-end"
      [shift]="pickerShift"
      [disabled]="isDisabled()"
      [attr.aria-label]="triggerAriaLabel()"
    >
      <hell-icon name="faSolidClock" />
    </button>

    <ng-template #picker>
      <div hellPopover data-slot="picker">
        <div data-slot="picker-header">
          <span data-slot="picker-readout" [attr.aria-label]="selectedTimeLabel()">
            {{ format(current(), seconds()) }}
          </span>
        </div>

        <div data-slot="picker-units">
          @for (unit of visibleUnits(); track unit) {
            <div data-slot="picker-unit" [attr.data-unit]="unit">
              <span [id]="unitLabelId(unit)" data-slot="picker-unit-label">
                {{ unitLabel(unit) }}
              </span>
              <div data-slot="picker-unit-control">
                <button
                  type="button"
                  data-slot="picker-unit-step"
                  (click)="stepUnit(unit, -1)"
                  [attr.aria-label]="decreaseUnitLabel(unit)"
                >
                  −
                </button>
                <div
                  data-slot="picker-unit-value"
                  role="spinbutton"
                  tabindex="0"
                  [attr.aria-labelledby]="unitLabelId(unit)"
                  [attr.aria-valuemin]="0"
                  [attr.aria-valuemax]="unitMax(unit)"
                  [attr.aria-valuenow]="unitValue(unit)"
                  [attr.aria-valuetext]="unitValueText(unit)"
                  (keydown)="onPickerSpinKeydown($event, unit)"
                >
                  {{ pad(unitValue(unit)) }}
                </div>
                <button
                  type="button"
                  data-slot="picker-unit-step"
                  (click)="stepUnit(unit, 1)"
                  [attr.aria-label]="increaseUnitLabel(unit)"
                >
                  +
                </button>
              </div>
            </div>
          }
        </div>

        <div data-slot="minute-presets" role="group" [attr.aria-label]="minutePresetsLabel()">
          @for (minute of minutePresets; track minute) {
            <button
              type="button"
              data-slot="minute-preset"
              [attr.data-selected]="current().minute === minute ? 'true' : null"
              [attr.aria-pressed]="current().minute === minute ? 'true' : 'false'"
              [attr.aria-label]="minutePresetLabel(minute)"
              (click)="setUnit('minute', minute)"
            >
              {{ pad(minute) }}
            </button>
          }
        </div>
      </div>
    </ng-template>
  `,
})
export class HellTimeInput extends HellStyleable implements ControlValueAccessor, Validator {
  readonly size = input<Exclude<HellSize, 'xs' | 'xl'>>('md');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = input<HellTimeValue | null>(null);
  readonly seconds = input(false, { transform: booleanAttribute });
  readonly placeholder = input<string | null>(null);
  readonly inputId = input<string>(`hell-time-input-${++nextTimeInputId}-field`);
  readonly name = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  readonly ariaDescribedby = input<string | null>(null, { alias: 'aria-describedby' });
  readonly ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });

  readonly valueChange = output<HellTimeValue | null>();

  protected readonly minutePresets = [0, 15, 30, 45] as const;
  protected readonly pickerShift = { padding: 8 } as const;
  protected readonly pad = pad;
  protected readonly format = (value: HellTimeValue | null, seconds: boolean) =>
    value ? this.timeAdapter.format(value, { seconds }) : '';

  private readonly timeAdapter = inject(HELL_TIME_INPUT_ADAPTER);

  private readonly controlMode = signal(false);
  private readonly controlValue = signal<HellTimeValue | null>(null);
  private readonly controlDisabled = signal(false);
  private onControlChange: (value: HellTimeValue | null) => void = () => {};
  private onControlTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  private readonly hourMinuteUnits = ['hour', 'minute'] as const;
  private readonly hourMinuteSecondUnits = ['hour', 'minute', 'second'] as const;

  private readonly valueState = new HellTypedValueInputState<HellTimeValue, HellTimeValue | null>({
    external: () => this.effectiveValue(),
    parseExternal: (value) => this.normalizeValue(value),
    parseText: (text) => this.timeAdapter.parseText(text, { seconds: this.seconds() }),
    format: (value) => this.format(value, this.seconds()),
    externalChanged: (base, current) => !this.sameValue(base, current),
  });

  protected readonly current = computed<HellTimeValue>(
    () => this.valueState.current() ?? { hour: 0, minute: 0, second: 0 },
  );
  protected readonly display = this.valueState.display;
  protected readonly invalidDraft = this.valueState.invalidDraft;
  protected readonly isInvalid = () => this.invalid() || this.invalidDraft();
  protected readonly isDisabled = () => this.disabled() || this.controlDisabled();
  protected readonly labels = inject(HELL_LABELS);
  private readonly inheritedFormField = injectFormFieldState({ optional: true, skipSelf: true });
  private readonly formField =
    this.inheritedFormField() ??
    ngpFormField({ ngControl: signal<NgControl | undefined>(undefined) });

  constructor() {
    super();
    hellSyncFormFieldDescriptions(this.formField, this.ariaDescribedby);
    hellSyncFormFieldLabels(this.formField, this.ariaLabelledby);
    effect(() => {
      this.invalidDraft();
      this.current();
      this.onValidatorChange();
    });
  }

  protected readonly triggerAriaLabel = () => {
    const label = this.ariaLabel();
    return label ? this.labels.timeInput.chooseTimeFor(label) : this.labels.timeInput.chooseTime;
  };

  writeValue(value: HellTimeValue | null): void {
    this.controlMode.set(true);
    this.controlValue.set(this.normalizeValue(value));
    this.valueState.clearDraft();
    this.valueState.clearLocal();
    this.onValidatorChange();
  }

  registerOnChange(fn: (value: HellTimeValue | null) => void): void {
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

  private effectiveValue(): HellTimeValue | null {
    return this.controlMode() ? this.controlValue() : this.value();
  }

  protected onInput(value: string) {
    this.valueState.writeDraft(value);
    this.onValidatorChange();
  }

  protected onBlur() {
    const next = this.valueState.commitDraft();
    if (next.committed) this.emitValue(next.value);
    this.onControlTouched();
    this.onValidatorChange();
  }

  protected commit(text: string, event?: Event) {
    event?.preventDefault();
    const next = this.valueState.commitText(text);
    if (next.committed) this.emitValue(next.value);
    this.onValidatorChange();
  }

  protected onFieldKeydown(event: KeyboardEvent): void {
    const keyDeltaMinutes = this.fieldKeyDeltaMinutes(event);
    if (keyDeltaMinutes === null) return;

    event.preventDefault();
    this.stepTimeByMinutes(keyDeltaMinutes);
  }

  protected setUnit(unit: HellTimeUnit, n: number) {
    const value = this.normalizeValue({ ...this.current(), [unit]: n });
    if (!value) return;
    const next = this.valueState.setValue(value);
    if (next.committed) this.emitValue(next.value);
    this.onControlTouched();
    this.onValidatorChange();
  }

  protected visibleUnits(): readonly HellTimeUnit[] {
    return this.seconds() ? this.hourMinuteSecondUnits : this.hourMinuteUnits;
  }

  protected unitLabel(unit: HellTimeUnit): string {
    if (unit === 'hour') return this.labels.timeInput.hours;
    if (unit === 'minute') return this.labels.timeInput.minutes;
    return this.labels.timeInput.seconds;
  }

  protected unitLabelId(unit: HellTimeUnit): string {
    return `${this.inputId()}-${unit}-label`;
  }

  protected unitValue(unit: HellTimeUnit): number {
    return this.current()[unit];
  }

  protected unitMax(unit: HellTimeUnit): number {
    return hellTimeInputPickerMaxValue(unit);
  }

  protected unitValueText(unit: HellTimeUnit): string {
    return `${pad(this.unitValue(unit))} ${this.unitLabel(unit).toLowerCase()}`;
  }

  protected selectedTimeLabel(): string {
    return (
      this.labels.timeInput.selectedTime?.(this.format(this.current(), this.seconds())) ??
      `Selected time ${this.format(this.current(), this.seconds())}`
    );
  }

  protected decreaseUnitLabel(unit: HellTimeUnit): string {
    const label = this.unitLabel(unit);
    return this.labels.timeInput.decreaseUnit?.(label) ?? `Decrease ${label.toLowerCase()}`;
  }

  protected increaseUnitLabel(unit: HellTimeUnit): string {
    const label = this.unitLabel(unit);
    return this.labels.timeInput.increaseUnit?.(label) ?? `Increase ${label.toLowerCase()}`;
  }

  protected minutePresetsLabel(): string {
    return this.labels.timeInput.minutePresets ?? 'Minute presets';
  }

  protected minutePresetLabel(minute: number): string {
    return this.labels.timeInput.minutePreset?.(minute) ?? `Set minutes to ${pad(minute)}`;
  }

  protected stepUnit(unit: HellTimeUnit, delta: number): void {
    const value = this.unitValue(unit);
    const next = Math.min(Math.max(value + delta, 0), this.unitMax(unit));
    if (next === value) return;
    this.setUnit(unit, next);
  }

  protected onPickerSpinKeydown(event: KeyboardEvent, unit: HellTimeUnit): void {
    const next = hellTimeInputNextPickerValue(event.key, this.unitValue(unit), unit);
    if (next === null) return;

    event.preventDefault();
    this.setUnit(unit, next);
  }

  private fieldKeyDeltaMinutes(event: KeyboardEvent): number | null {
    if (event.key === 'ArrowUp') return event.shiftKey ? 60 : 5;
    if (event.key === 'ArrowDown') return event.shiftKey ? -60 : -5;
    if (event.key === 'PageUp') return 60;
    if (event.key === 'PageDown') return -60;
    return null;
  }

  private stepTimeByMinutes(deltaMinutes: number): void {
    const current = this.current();
    const currentSeconds = current.hour * 3600 + current.minute * 60 + current.second;
    const daySeconds = 24 * 3600;
    const nextSeconds =
      (((currentSeconds + deltaMinutes * 60) % daySeconds) + daySeconds) % daySeconds;
    const value = this.normalizeValue({
      hour: Math.floor(nextSeconds / 3600),
      minute: Math.floor((nextSeconds % 3600) / 60),
      second: this.seconds() ? nextSeconds % 60 : 0,
    });
    if (!value) return;
    const next = this.valueState.setValue(value);
    if (next.committed) this.emitValue(next.value);
    this.onControlTouched();
    this.onValidatorChange();
  }

  private normalizeValue(value: HellTimeValue | null | undefined): HellTimeValue | null {
    const context = { seconds: this.seconds() };
    return this.timeAdapter.normalize
      ? this.timeAdapter.normalize(value, context)
      : hellNormalizeTimeInputValue(value, context);
  }

  private sameValue(a: HellTimeValue | null, b: HellTimeValue | null): boolean {
    return this.timeAdapter.isSameValue?.(a, b) ?? hellSameTimeInputValue(a, b);
  }

  validate(_control: AbstractControl | null): ValidationErrors | null {
    const errors: ValidationErrors = {};

    if (this.invalidDraft()) {
      errors['invalidTimeInputDraft'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  private emitValue(value: HellTimeValue | null): void {
    if (this.controlMode()) this.controlValue.set(value);
    this.valueChange.emit(value);
    this.onControlChange(value);
    this.onValidatorChange();
  }
}
