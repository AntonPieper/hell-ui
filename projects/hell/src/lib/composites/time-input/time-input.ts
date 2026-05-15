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
import { ControlValueAccessor, NG_VALIDATORS, type AbstractControl, type ValidationErrors, type Validator, NG_VALUE_ACCESSOR } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { faSolidClock } from '@ng-icons/font-awesome/solid';
import { HellButton } from '../../primitives/button/button';
import { HellIcon } from '../../primitives/icon/icon';
import { HellInput } from '../../primitives/input/input';
import { HellPopover, HellPopoverTrigger } from '../../primitives/popover/popover';
import { HELL_LABELS } from '../../core/labels';
import type { HellSize } from '../../core/types';
import { HellStyleable } from '../../core/styleable';
import {
  HellTypedValueInputState,
  type HellTypedValueParseResult,
  hellInvalidTypedValue,
  hellTypedValue,
} from '../../core/typed-value-input';
import {
  hellTimeInputNextPickerCellIndex,
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

export interface HellTimeInputAdapterContext {
  readonly seconds: boolean;
}

type HellTimeUnit = HellTimeInputPickerUnit;

export type HellTimeInputParseResult = HellTypedValueParseResult<HellTimeValue>;

export interface HellTimeInputAdapter {
  /** Parse visible text. Return `{ valid: true, value: null }` to commit a clear. */
  readonly parseText: (text: string, context: HellTimeInputAdapterContext) => HellTimeInputParseResult;
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

export function hellSameTimeInputValue(
  a: HellTimeValue | null,
  b: HellTimeValue | null,
): boolean {
  return a?.hour === b?.hour && a?.minute === b?.minute && a?.second === b?.second;
}

/**
 * Time input — text field paired with a clock icon trigger that opens a
 * roving-focus grid picker. Bind `[value]` as a structured
 * `HellTimeValue | null` and listen to `(valueChange)`.
 *
 * The picker uses hour, minute, and optional second grids with one tab stop per
 * section, arrow/Home/End navigation, and +/- 5 minute nudges.
 */
@Component({
  selector: 'hell-time-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellIcon, HellInput, HellPopover, HellPopoverTrigger],
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
      [attr.aria-invalid]="isInvalid() ? 'true' : null"
      [attr.aria-label]="ariaLabel()"
      [disabled]="isDisabled()"
      [placeholder]="placeholder() ?? (seconds() ? 'HH:mm:ss' : 'HH:mm')"
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
      [hellPopoverTrigger]="picker"
      placement="bottom-end"
      [disabled]="isDisabled()"
      [attr.aria-label]="triggerAriaLabel()"
    >
      <hell-icon name="faSolidClock" />
    </button>

    <ng-template #picker>
      <div hellPopover data-slot="picker">
        <div data-slot="picker-header">
          <span data-slot="picker-readout">{{ format(current(), seconds()) }}</span>
          <div data-slot="picker-stepper">
            <button
              hellButton
              variant="ghost"
              size="sm"
              type="button"
              (click)="nudge('minute', -5)"
              [attr.aria-label]="labels.timeInput.subtractFiveMinutes"
            >
              −5m
            </button>
            <button
              hellButton
              variant="ghost"
              size="sm"
              type="button"
              (click)="nudge('minute', 5)"
              [attr.aria-label]="labels.timeInput.addFiveMinutes"
            >
              +5m
            </button>
          </div>
        </div>

        <div data-slot="picker-section">
          <div data-slot="picker-section-label">{{ labels.timeInput.hours }}</div>
          <div data-slot="picker-grid" data-unit="hours" role="group" [attr.aria-label]="labels.timeInput.hours">
            @for (h of hours; track h; let hourIndex = $index) {
              <button
                hellButton
                [variant]="h === current().hour ? 'primary' : 'ghost'"
                size="sm"
                type="button"
                data-slot="picker-cell"
                [attr.tabindex]="pickerCellTabIndex('hour', hourIndex)"
                [attr.aria-pressed]="h === current().hour ? 'true' : 'false'"
                (focus)="onPickerCellFocus('hour', hourIndex)"
                (keydown)="onPickerCellKeydown($event, 'hour', hourIndex)"
                (click)="setUnit('hour', h)"
              >
                {{ pad(h) }}
              </button>
            }
          </div>
        </div>

        <div data-slot="picker-section">
          <div data-slot="picker-section-label">{{ labels.timeInput.minutes }}</div>
          <div data-slot="picker-grid" data-unit="minutes" role="group" [attr.aria-label]="labels.timeInput.minutes">
            @for (m of minutes; track m; let minuteIndex = $index) {
              <button
                hellButton
                [variant]="m === current().minute ? 'primary' : 'ghost'"
                size="sm"
                type="button"
                data-slot="picker-cell"
                [attr.tabindex]="pickerCellTabIndex('minute', minuteIndex)"
                [attr.aria-pressed]="m === current().minute ? 'true' : 'false'"
                (focus)="onPickerCellFocus('minute', minuteIndex)"
                (keydown)="onPickerCellKeydown($event, 'minute', minuteIndex)"
                (click)="setUnit('minute', m)"
              >
                {{ pad(m) }}
              </button>
            }
          </div>
        </div>

        @if (seconds()) {
          <div data-slot="picker-section">
            <div data-slot="picker-section-label">{{ labels.timeInput.seconds }}</div>
            <div data-slot="picker-grid" data-unit="seconds" role="group" [attr.aria-label]="labels.timeInput.seconds">
              @for (s of secondsList; track s; let secondIndex = $index) {
                <button
                  hellButton
                  [variant]="s === current().second ? 'primary' : 'ghost'"
                  size="sm"
                  type="button"
                  data-slot="picker-cell"
                  [attr.tabindex]="pickerCellTabIndex('second', secondIndex)"
                  [attr.aria-pressed]="s === current().second ? 'true' : 'false'"
                  (focus)="onPickerCellFocus('second', secondIndex)"
                  (keydown)="onPickerCellKeydown($event, 'second', secondIndex)"
                  (click)="setUnit('second', s)"
                >
                  {{ pad(s) }}
                </button>
              }
            </div>
          </div>
        }
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
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  readonly valueChange = output<HellTimeValue | null>();

  // Hour grid: 24h in a 6×4. Minute/second grids: 0-59 in a 4-column layout.
  protected readonly hours = Array.from({ length: 24 }, (_, i) => i);
  protected readonly minutes = Array.from({ length: 60 }, (_, i) => i);
  protected readonly secondsList = Array.from({ length: 60 }, (_, i) => i);
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

  private readonly focusedHourIndex = signal(0);
  private readonly focusedMinuteIndex = signal(0);
  private readonly focusedSecondIndex = signal(0);

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

  constructor() {
    super();
    effect(() => {
      this.invalidDraft();
      this.current();
      this.syncPickerFocusFromValue(this.current());
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

  protected setUnit(unit: HellTimeUnit, n: number) {
    const value = this.normalizeValue({ ...this.current(), [unit]: n });
    if (!value) return;
    const next = this.valueState.setValue(value);
    if (next.committed) this.emitValue(next.value);
    this.onControlTouched();
    this.onValidatorChange();
  }

  protected nudge(unit: HellTimeUnit, delta: number) {
    const t = { ...this.current() };
    if (unit === 'hour') t.hour = (t.hour + delta + 24) % 24;
    else if (unit === 'minute') {
      const totalMinutes = (t.hour * 60 + t.minute + delta + 24 * 60) % (24 * 60);
      t.hour = Math.floor(totalMinutes / 60);
      t.minute = totalMinutes % 60;
    } else t.second = (t.second + delta + 60) % 60;
    const value = this.normalizeValue(t);
    if (!value) return;
    const next = this.valueState.setValue(value);
    if (next.committed) this.emitValue(next.value);
    this.onControlTouched();
    this.onValidatorChange();
  }

  protected pickerCellTabIndex(unit: HellTimeUnit, index: number): string {
    return this.focusedPickerCellIndex(unit) === index ? '0' : '-1';
  }

  protected onPickerCellFocus(unit: HellTimeUnit, index: number): void {
    this.setFocusedPickerCellIndex(unit, index);
  }

  protected onPickerCellKeydown(event: KeyboardEvent, unit: HellTimeUnit, currentIndex: number): void {
    const nextIndex = hellTimeInputNextPickerCellIndex(
      event.key,
      currentIndex,
      unit,
      this.valuesForUnit(unit).length,
    );
    if (nextIndex === null) return;

    event.preventDefault();
    this.setFocusedPickerCellIndex(unit, nextIndex);
    this.focusPickerCell(event.currentTarget, nextIndex);
  }

  private focusPickerCell(target: EventTarget | null, nextIndex: number): void {
    const button = target instanceof HTMLElement ? target : null;
    const grid = button?.closest('[data-slot="picker-grid"]');
    if (!(grid instanceof HTMLElement)) return;
    const cells = grid.querySelectorAll<HTMLButtonElement>('[data-slot="picker-cell"]');
    cells[nextIndex]?.focus();
  }

  private focusedPickerCellIndex(unit: HellTimeUnit): number {
    if (unit === 'hour') return this.focusedHourIndex();
    if (unit === 'minute') return this.focusedMinuteIndex();
    return this.focusedSecondIndex();
  }

  private setFocusedPickerCellIndex(unit: HellTimeUnit, index: number): void {
    const values = this.valuesForUnit(unit);
    if (!values.length) return;
    const clamped = Math.max(0, Math.min(values.length - 1, index));
    if (unit === 'hour') this.focusedHourIndex.set(clamped);
    else if (unit === 'minute') this.focusedMinuteIndex.set(clamped);
    else this.focusedSecondIndex.set(clamped);
  }

  private syncPickerFocusFromValue(value: HellTimeValue): void {
    this.setFocusedPickerCellIndex('hour', value.hour);
    this.setFocusedPickerCellIndex('minute', this.valuesForUnit('minute').indexOf(value.minute));
    this.setFocusedPickerCellIndex('second', this.valuesForUnit('second').indexOf(value.second));
  }

  private valuesForUnit(unit: HellTimeUnit): readonly number[] {
    if (unit === 'hour') return this.hours;
    if (unit === 'minute') return this.minutes;
    return this.secondsList;
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
