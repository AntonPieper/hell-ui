import {
  ChangeDetectionStrategy,
  Component,
  NO_ERRORS_SCHEMA,
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
  NgpFormControl,
  injectFormFieldState,
  ngpFormField,
  provideFormFieldState,
} from 'ng-primitives/form-field';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellPopover, HellPopoverTrigger } from '@hell-ui/angular/popover';
import { hellCreateLabels } from '@hell-ui/angular/core';
import {
  hellSyncFormFieldDescriptions,
  hellSyncFormFieldLabels,
} from '@hell-ui/angular/internal/core';
import type { HellSize } from '@hell-ui/angular/core';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';
import {
  HellTypedValueInputState,
  type HellTypedValueParseResult,
  hellInvalidTypedValue,
  hellTypedValue,
} from '@hell-ui/angular/internal/core';
import {
  hellTimeInputNextPickerValue,
  hellTimeInputPickerMaxValue,
  type HellTimeInputPickerUnit,
} from './time-input-picker';

/** Built-in accessibility labels owned by the time input entry point. */
export interface HellTimeInputLabels {
  readonly chooseTime: string;
  readonly chooseTimeFor: (label: string) => string;
  readonly subtractFiveMinutes: string;
  readonly addFiveMinutes: string;
  readonly hours: string;
  readonly minutes: string;
  readonly seconds: string;
  readonly selectedTime?: (time: string) => string;
  readonly decreaseUnit?: (unitLabel: string) => string;
  readonly increaseUnit?: (unitLabel: string) => string;
  readonly minutePresets?: string;
  readonly minutePreset?: (minute: number) => string;
}

const HELL_TIME_INPUT_LABELS_CONTRACT = hellCreateLabels<HellTimeInputLabels>('HELL_TIME_INPUT_LABELS', {
  chooseTime: 'Choose time',
  chooseTimeFor: (label) => `Choose time for ${label}`,
  subtractFiveMinutes: 'Subtract 5 minutes',
  addFiveMinutes: 'Add 5 minutes',
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',
  selectedTime: (time) => `Selected time ${time}`,
  decreaseUnit: (unitLabel) => `Decrease ${unitLabel.toLowerCase()}`,
  increaseUnit: (unitLabel) => `Increase ${unitLabel.toLowerCase()}`,
  minutePresets: 'Minute presets',
  minutePreset: (minute) => `Set minutes to ${minute.toString().padStart(2, '0')}`,
});

/** Injection token resolving to the effective time input labels. */
export const HELL_TIME_INPUT_LABELS: InjectionToken<HellTimeInputLabels> = HELL_TIME_INPUT_LABELS_CONTRACT.token;

/** Override any subset of the time input labels for an injector scope. */
export function provideHellTimeInputLabels(overrides: Partial<HellTimeInputLabels>): Provider {
  return HELL_TIME_INPUT_LABELS_CONTRACT.provide(overrides);
}

export interface HellTimeValue {
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

const HELL_TIME_INPUT_ICONS = {
  faSolidClock,
};

let nextTimeInputId = 0;

/** Public parts of the HellTimeInput module, styleable through its Part Style Map. */
export type HellTimeInputPart =
  | 'root'
  | 'input'
  | 'trigger'
  | 'triggerIcon'
  | 'pickerPanel'
  | 'pickerHeader'
  | 'pickerReadout'
  | 'pickerUnits'
  | 'pickerUnit'
  | 'pickerUnitLabel'
  | 'pickerUnitControl'
  | 'pickerUnitValue'
  | 'pickerUnitStep'
  | 'minutePresets'
  | 'minutePreset';

/** Part Style Map accepted by the HellTimeInput `ui` input. */
export type HellTimeInputUi = HellUi<HellTimeInputPart>;

const HELL_TIME_INPUT_RECIPE = {
  root: 'relative inline-flex w-full max-w-48 min-w-36 items-stretch rounded-hell-md border border-hell-border bg-hell-surface-elevated transition-[background-color,border-color,box-shadow] duration-[var(--hell-duration-fast)] ease-hell-out hover:border-hell-border-strong focus-within:border-hell-border-focus focus-within:shadow-[0_0_0_3px_var(--color-hell-focus-ring)] data-[invalid=true]:border-hell-danger data-[disabled=true]:cursor-not-allowed data-[disabled=true]:border-hell-border data-[disabled=true]:bg-hell-surface-subtle',
  input:
    'h-hell-control-md min-w-0 flex-1 rounded-hell-md border-0 bg-transparent px-hell-3 py-0 font-[inherit] text-[13px] tracking-normal text-hell-foreground tabular-nums outline-none placeholder:text-hell-foreground-subtle disabled:cursor-not-allowed disabled:text-hell-foreground-muted data-[size=sm]:h-hell-control-sm data-[size=sm]:text-xs data-[size=lg]:h-hell-control-lg data-[size=lg]:text-sm',
  trigger:
    'me-hell-1 inline-flex h-hell-control-sm w-hell-control-sm flex-none cursor-pointer items-center justify-center self-center rounded-hell-md border border-transparent bg-transparent p-0 text-hell-foreground-muted transition-[background-color,color,box-shadow] duration-[var(--hell-duration-fast)] ease-hell-out hover:bg-hell-surface-muted hover:text-hell-foreground focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  triggerIcon: 'size-hell-4 text-[length:var(--spacing-hell-4)]',
  pickerPanel:
    'grid w-[min(20rem,calc(100vw-2rem))] gap-hell-2 rounded-hell-md border border-hell-border bg-hell-surface-elevated p-hell-3 text-[13px] text-hell-foreground shadow-hell-lg outline-none',
  pickerHeader: 'flex min-h-hell-control-sm items-center justify-start',
  pickerReadout: 'text-[22px] font-semibold leading-none tracking-normal text-hell-foreground tabular-nums',
  pickerUnits: 'grid grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-hell-2',
  pickerUnit: 'grid min-w-0 gap-hell-1',
  pickerUnitLabel: 'text-[10px] font-semibold uppercase tracking-normal text-hell-foreground-muted',
  pickerUnitControl:
    'grid min-w-0 grid-cols-[minmax(0,1fr)_var(--spacing-hell-control-sm)_var(--spacing-hell-control-sm)] items-stretch overflow-hidden rounded-hell-sm border border-hell-border bg-hell-surface-elevated',
  pickerUnitValue:
    'inline-flex h-hell-control-sm min-w-0 cursor-pointer items-center justify-center border-0 border-e border-solid border-hell-border bg-transparent px-hell-2 font-[inherit] text-lg font-semibold text-hell-foreground tabular-nums focus-visible:outline-0 focus-visible:shadow-[inset_0_0_0_2px_var(--color-hell-primary-foreground),0_0_0_3px_var(--color-hell-focus-ring)]',
  pickerUnitStep:
    'h-hell-control-sm cursor-pointer border-0 bg-transparent font-[inherit] text-[13px] font-medium text-hell-foreground-muted transition-[background-color,color,box-shadow] duration-[var(--hell-duration-fast)] ease-hell-out hover:bg-hell-surface-subtle focus-visible:relative focus-visible:z-[1] focus-visible:outline-0 focus-visible:shadow-[inset_0_0_0_2px_var(--color-hell-border-focus),0_0_0_2px_var(--color-hell-focus-ring)]',
  minutePresets: 'grid grid-cols-4 gap-hell-1',
  minutePreset:
    'h-hell-control-sm cursor-pointer rounded-hell-pill border border-hell-border bg-hell-surface-elevated font-[inherit] text-xs font-medium text-hell-foreground tabular-nums transition-[background-color,border-color,color,box-shadow] duration-[var(--hell-duration-fast)] ease-hell-out hover:bg-hell-surface-subtle focus-visible:relative focus-visible:z-[1] focus-visible:outline-0 focus-visible:shadow-[inset_0_0_0_2px_var(--color-hell-border-focus),0_0_0_2px_var(--color-hell-focus-ring)] data-[selected=true]:border-hell-primary data-[selected=true]:bg-hell-primary data-[selected=true]:text-hell-primary-foreground',
} satisfies HellRecipe<HellTimeInputPart>;

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

  const compact = /^(\d{1,4})$/.exec(t);
  if (compact) {
    const digits = compact[1];
    const hourText = digits.length <= 2 ? digits : digits.slice(0, -2);
    const minuteText = digits.length <= 2 ? '0' : digits.slice(-2);
    const value = { hour: +hourText, minute: +minuteText, second: 0 };
    return isValidTime(value)
      ? hellTypedValue(hellNormalizeTimeInputValue(value, context))
      : hellInvalidTypedValue();
  }

  const ampm = /^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?\s*(a|am|p|pm)$/.exec(t);
  if (ampm) {
    if (!context.seconds && ampm[3] !== undefined) return hellInvalidTypedValue();
    let hour = +ampm[1];
    const minute = +(ampm[2] ?? '0');
    const second = +(ampm[3] ?? '0');
    if (hour === 12) hour = 0;
    if (ampm[4].startsWith('p')) hour += 12;
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
  imports: [NgpFormControl, HellIcon, HellPopover, HellPopoverTrigger],
  schemas: [NO_ERRORS_SCHEMA],
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
      [type]="nativeTimeInput ? 'time' : 'text'"
      [attr.data-size]="size()"
      [attr.data-invalid]="isInvalid() ? 'true' : null"
      [attr.inputmode]="nativeTimeInput ? null : 'text'"
      [attr.min]="nativeTimeInput ? '00:00' : null"
      [attr.max]="nativeTimeInput ? (seconds() ? '23:59:59' : '23:59') : null"
      [attr.step]="nativeTimeInput ? (seconds() ? '1' : '60') : null"
      autocomplete="off"
      [invalid]="isInvalid()"
      [id]="inputId()"
      [attr.name]="name()"
      [attr.aria-invalid]="isInvalid() ? 'true' : null"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-describedby]="fieldAriaDescribedby()"
      [attr.aria-labelledby]="fieldAriaLabelledby()"
      [disabled]="isDisabled()"
      [placeholder]="placeholder() ?? (seconds() ? 'HH:mm:ss' : 'HH:mm')"
      [value]="display()"
      (focus)="onFieldFocus(field)"
      (input)="onInput(field.value)"
      (blur)="onBlur()"
      (keydown.enter)="commit(field.value, $event)"
    />
    <button
      type="button"
      data-slot="trigger"
      [class]="part('trigger')"
      [hellPopoverTrigger]="picker"
      placement="bottom-end"
      [shift]="pickerShift"
      [disabled]="isDisabled()"
      [attr.data-size]="size()"
      [attr.data-disabled]="isDisabled() ? 'true' : null"
      [attr.aria-label]="triggerAriaLabel()"
    >
      <hell-icon data-slot="triggerIcon" [class]="part('triggerIcon')" name="faSolidClock" />
    </button>

    <ng-template #picker>
      <!-- Panel overrides flow through the popover's Part Style Map so they
           merge deterministically with the popover recipe. -->
      <div hellPopover data-slot="pickerPanel" [ui]="part('pickerPanel')">
        <div data-slot="pickerHeader" [class]="part('pickerHeader')">
          <span
            data-slot="pickerReadout"
            [class]="part('pickerReadout')"
            [attr.aria-label]="selectedTimeLabel()"
          >
            {{ format(current(), seconds()) }}
          </span>
        </div>

        <div data-slot="pickerUnits" [class]="part('pickerUnits')">
          @for (unit of visibleUnits(); track unit) {
            <div data-slot="pickerUnit" [class]="part('pickerUnit')" [attr.data-unit]="unit">
              <span
                [id]="unitLabelId(unit)"
                data-slot="pickerUnitLabel"
                [class]="part('pickerUnitLabel')"
              >
                {{ unitLabel(unit) }}
              </span>
              <div data-slot="pickerUnitControl" [class]="part('pickerUnitControl')">
                <div
                  data-slot="pickerUnitValue"
                  [class]="part('pickerUnitValue')"
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
                  data-slot="pickerUnitStep"
                  [class]="part('pickerUnitStep')"
                  (click)="stepUnit(unit, -1)"
                  [attr.aria-label]="decreaseUnitLabel(unit)"
                >
                  −
                </button>
                <button
                  type="button"
                  data-slot="pickerUnitStep"
                  [class]="part('pickerUnitStep')"
                  (click)="stepUnit(unit, 1)"
                  [attr.aria-label]="increaseUnitLabel(unit)"
                >
                  +
                </button>
              </div>
            </div>
          }
        </div>

        <div
          data-slot="minutePresets"
          [class]="part('minutePresets')"
          role="group"
          [attr.aria-label]="minutePresetsLabel()"
        >
          @for (minute of minutePresets; track minute) {
            <button
              type="button"
              data-slot="minutePreset"
              [class]="part('minutePreset')"
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
export class HellTimeInput implements ControlValueAccessor, Validator {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTimeInputPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTimeInputPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TIME_INPUT_RECIPE,
  });

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
  private readonly timeAdapter = inject(HELL_TIME_INPUT_ADAPTER);

  protected readonly format = (value: HellTimeValue | null, seconds: boolean) =>
    value ? this.timeAdapter.format(value, { seconds }) : '';
  protected readonly nativeTimeInput = this.timeAdapter === HELL_DEFAULT_TIME_INPUT_ADAPTER;

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
  protected readonly fieldAriaDescribedby = computed(
    () => this.formField.descriptions().join(' ') || null,
  );
  protected readonly fieldAriaLabelledby = computed(
    () => this.formField.labels().join(' ') || null,
  );
  protected readonly labels = inject(HELL_TIME_INPUT_LABELS);
  private readonly inheritedFormField = injectFormFieldState({ optional: true, skipSelf: true });
  private readonly formField =
    this.inheritedFormField() ??
    ngpFormField({ ngControl: signal<NgControl | undefined>(undefined) });

  constructor() {
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
    return label ? this.labels.chooseTimeFor(label) : this.labels.chooseTime;
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

  protected onFieldFocus(field: HTMLInputElement) {
    if (!field.value || this.isDisabled()) return;
    queueMicrotask(() => {
      try {
        field.select();
      } catch {
        // Some native time controls expose segmented selection instead of text ranges.
      }
    });
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

  protected visibleUnits(): readonly HellTimeUnit[] {
    return this.seconds() ? this.hourMinuteSecondUnits : this.hourMinuteUnits;
  }

  protected unitLabel(unit: HellTimeUnit): string {
    if (unit === 'hour') return this.labels.hours;
    if (unit === 'minute') return this.labels.minutes;
    return this.labels.seconds;
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
      this.labels.selectedTime?.(this.format(this.current(), this.seconds())) ??
      `Selected time ${this.format(this.current(), this.seconds())}`
    );
  }

  protected decreaseUnitLabel(unit: HellTimeUnit): string {
    const label = this.unitLabel(unit);
    return this.labels.decreaseUnit?.(label) ?? `Decrease ${label.toLowerCase()}`;
  }

  protected increaseUnitLabel(unit: HellTimeUnit): string {
    const label = this.unitLabel(unit);
    return this.labels.increaseUnit?.(label) ?? `Increase ${label.toLowerCase()}`;
  }

  protected minutePresetsLabel(): string {
    return this.labels.minutePresets ?? 'Minute presets';
  }

  protected minutePresetLabel(minute: number): string {
    return this.labels.minutePreset?.(minute) ?? `Set minutes to ${pad(minute)}`;
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
