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
  /** Accessible label for the clock trigger button when no field label is set. */
  readonly chooseTime: string;
  /** Accessible label for the clock trigger button, incorporating the field label. */
  readonly chooseTimeFor: (label: string) => string;
  /** Label for the control that steps the picker back by five minutes. */
  readonly subtractFiveMinutes: string;
  /** Label for the control that steps the picker forward by five minutes. */
  readonly addFiveMinutes: string;
  /** Label for the hours spinbutton. */
  readonly hours: string;
  /** Label for the minutes spinbutton. */
  readonly minutes: string;
  /** Label for the seconds spinbutton. */
  readonly seconds: string;
  /** Accessible label announcing the currently selected time in the picker readout. */
  readonly selectedTime?: (time: string) => string;
  /** Accessible label for a unit's decrement step button. */
  readonly decreaseUnit?: (unitLabel: string) => string;
  /** Accessible label for a unit's increment step button. */
  readonly increaseUnit?: (unitLabel: string) => string;
  /** Accessible label for the minute presets group. */
  readonly minutePresets?: string;
  /** Accessible label for a single minute preset button. */
  readonly minutePreset?: (minute: number) => string;
}

/** Injection token resolving to the effective time input labels. */
export const HELL_TIME_INPUT_LABELS: InjectionToken<HellTimeInputLabels> = hellCreateLabels<HellTimeInputLabels>('HELL_TIME_INPUT_LABELS', {
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

/** Structured time value exchanged by the time input. */
export interface HellTimeValue {
  /** Hour of day, from 0 to 23. */
  readonly hour: number;
  /** Minute of hour, from 0 to 59. */
  readonly minute: number;
  /** Second of minute, from 0 to 59. */
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

/** Contextual flags passed to adapter parse, format, and normalize hooks. */
export interface HellTimeInputAdapterContext {
  /** Whether seconds are part of the value being parsed, formatted, or normalized. */
  readonly seconds: boolean;
}

type HellTimeUnit = HellTimeInputPickerUnit;

/** Result of parsing time input text into a value or an invalid draft. */
export type HellTimeInputParseResult = HellTypedValueParseResult<HellTimeValue>;

/** Strategy for parsing, formatting, normalizing, and comparing time values. */
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

/** Default time input adapter parsing and formatting the built-in `HH:mm`/`HH:mm:ss` formats. */
export const HELL_DEFAULT_TIME_INPUT_ADAPTER: HellTimeInputAdapter = {
  parseText: hellParseTimeInputText,
  format: hellFormatTimeInputValue,
  normalize: hellNormalizeTimeInputValue,
  isSameValue: hellSameTimeInputValue,
};

/** Injection token resolving to the effective time input adapter. */
export const HELL_TIME_INPUT_ADAPTER = new InjectionToken<HellTimeInputAdapter>(
  'HELL_TIME_INPUT_ADAPTER',
  { factory: () => HELL_DEFAULT_TIME_INPUT_ADAPTER },
);

/** Override the time input adapter for an injector scope. */
export function provideHellTimeInputAdapter(adapter: HellTimeInputAdapter): Provider {
  return { provide: HELL_TIME_INPUT_ADAPTER, useValue: adapter };
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

/** Format a time value as `HH:mm`, or `HH:mm:ss` when seconds are enabled. */
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

/** Parse time input text into a value or an invalid draft, per the default formats. */
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

/** Compare two time values by their hour, minute, and second fields. */
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

  /** Control height. Defaults to `md`. */
  readonly size = input<Exclude<HellSize, 'xs' | 'xl'>>('md');
  /** Forces the invalid visual state. Defaults to `false`. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Disables the field and trigger. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Current time value in uncontrolled use. Defaults to `null`. */
  readonly value = input<HellTimeValue | null>(null);
  /** Includes seconds in the field and picker. Defaults to `false`. */
  readonly seconds = input(false, { transform: booleanAttribute });
  /** Placeholder text for the field. Defaults to a format hint. */
  readonly placeholder = input<string | null>(null);
  /** `id` of the text field. Defaults to a generated unique id. */
  readonly inputId = input<string>(`hell-time-input-${++nextTimeInputId}-field`);
  /** `name` attribute of the text field. Defaults to `null`. */
  readonly name = input<string | null>(null);
  /** Accessible label for the field. Defaults to `null`. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  /** `aria-describedby` reference for the field. Defaults to `null`. */
  readonly ariaDescribedby = input<string | null>(null, { alias: 'aria-describedby' });
  /** `aria-labelledby` reference for the field. Defaults to `null`. */
  readonly ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });

  /** Emits when the committed time value changes. */
  readonly valueChange = output<HellTimeValue | null>();

  /** Minute values offered as quick presets in the picker. */
  protected readonly minutePresets = [0, 15, 30, 45] as const;
  /** Popover shift padding keeping the picker panel off the viewport edge. */
  protected readonly pickerShift = { padding: 8 } as const;
  /** Zero-pads a number to two digits for display. */
  protected readonly pad = pad;
  private readonly timeAdapter = inject(HELL_TIME_INPUT_ADAPTER);

  /** Formats a time value through the adapter, or empty string when null. */
  protected readonly format = (value: HellTimeValue | null, seconds: boolean) =>
    value ? this.timeAdapter.format(value, { seconds }) : '';
  /** Whether to render a native `<input type="time">`, used only with the default adapter. */
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

  /** Current committed time value, defaulting to midnight when none is set. */
  protected readonly current = computed<HellTimeValue>(
    () => this.valueState.current() ?? { hour: 0, minute: 0, second: 0 },
  );
  /** Text shown in the field for the current value or draft. */
  protected readonly display = this.valueState.display;
  /** Whether the current draft text is unparseable. */
  protected readonly invalidDraft = this.valueState.invalidDraft;
  /** Whether the control is in an invalid state. */
  protected readonly isInvalid = () => this.invalid() || this.invalidDraft();
  /** Whether the control is disabled by input or form state. */
  protected readonly isDisabled = () => this.disabled() || this.controlDisabled();
  /** `aria-describedby` value combining the field input and form field descriptions. */
  protected readonly fieldAriaDescribedby = computed(
    () => this.formField.descriptions().join(' ') || null,
  );
  /** `aria-labelledby` value combining the field input and form field labels. */
  protected readonly fieldAriaLabelledby = computed(
    () => this.formField.labels().join(' ') || null,
  );
  /** Resolved accessibility labels for the control. */
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

  /** Accessible label for the clock trigger button. */
  protected readonly triggerAriaLabel = () => {
    const label = this.ariaLabel();
    return label ? this.labels.chooseTimeFor(label) : this.labels.chooseTime;
  };

  /** Writes a value from the form model into the control. */
  writeValue(value: HellTimeValue | null): void {
    this.controlMode.set(true);
    this.controlValue.set(this.normalizeValue(value));
    this.valueState.clearDraft();
    this.valueState.clearLocal();
    this.onValidatorChange();
  }

  /** Registers the form model's change callback. */
  registerOnChange(fn: (value: HellTimeValue | null) => void): void {
    this.onControlChange = fn;
  }

  /** Registers the form model's touched callback. */
  registerOnTouched(fn: () => void): void {
    this.onControlTouched = fn;
  }

  /** Registers the callback invoked when validation state changes. */
  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  /** Sets the disabled state from the form model. */
  setDisabledState(isDisabled: boolean): void {
    this.controlDisabled.set(isDisabled);
  }

  private effectiveValue(): HellTimeValue | null {
    return this.controlMode() ? this.controlValue() : this.value();
  }

  /** Records field text as a draft as the user types. */
  protected onInput(value: string) {
    this.valueState.writeDraft(value);
    this.onValidatorChange();
  }

  /** Selects the field contents on focus for quick overwriting. */
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

  /** Commits the pending draft when the field loses focus. */
  protected onBlur() {
    const next = this.valueState.commitDraft();
    if (next.committed) this.emitValue(next.value);
    this.onControlTouched();
    this.onValidatorChange();
  }

  /** Commits the given field text, e.g. on Enter. */
  protected commit(text: string, event?: Event) {
    event?.preventDefault();
    const next = this.valueState.commitText(text);
    if (next.committed) this.emitValue(next.value);
    this.onValidatorChange();
  }

  /** Sets a single time unit to a value and commits the result. */
  protected setUnit(unit: HellTimeUnit, n: number) {
    const value = this.normalizeValue({ ...this.current(), [unit]: n });
    if (!value) return;
    const next = this.valueState.setValue(value);
    if (next.committed) this.emitValue(next.value);
    this.onControlTouched();
    this.onValidatorChange();
  }

  /** Units shown in the picker, including seconds when enabled. */
  protected visibleUnits(): readonly HellTimeUnit[] {
    return this.seconds() ? this.hourMinuteSecondUnits : this.hourMinuteUnits;
  }

  /** Localized label for a time unit. */
  protected unitLabel(unit: HellTimeUnit): string {
    if (unit === 'hour') return this.labels.hours;
    if (unit === 'minute') return this.labels.minutes;
    return this.labels.seconds;
  }

  /** DOM id of a unit's label element, for `aria-labelledby`. */
  protected unitLabelId(unit: HellTimeUnit): string {
    return `${this.inputId()}-${unit}-label`;
  }

  /** Current numeric value of a time unit. */
  protected unitValue(unit: HellTimeUnit): number {
    return this.current()[unit];
  }

  /** Maximum value a time unit accepts. */
  protected unitMax(unit: HellTimeUnit): number {
    return hellTimeInputPickerMaxValue(unit);
  }

  /** Accessible `aria-valuetext` for a unit's spinbutton. */
  protected unitValueText(unit: HellTimeUnit): string {
    return `${pad(this.unitValue(unit))} ${this.unitLabel(unit).toLowerCase()}`;
  }

  /** Accessible label announcing the currently selected time. */
  protected selectedTimeLabel(): string {
    return (
      this.labels.selectedTime?.(this.format(this.current(), this.seconds())) ??
      `Selected time ${this.format(this.current(), this.seconds())}`
    );
  }

  /** Accessible label for a unit's decrement button. */
  protected decreaseUnitLabel(unit: HellTimeUnit): string {
    const label = this.unitLabel(unit);
    return this.labels.decreaseUnit?.(label) ?? `Decrease ${label.toLowerCase()}`;
  }

  /** Accessible label for a unit's increment button. */
  protected increaseUnitLabel(unit: HellTimeUnit): string {
    const label = this.unitLabel(unit);
    return this.labels.increaseUnit?.(label) ?? `Increase ${label.toLowerCase()}`;
  }

  /** Accessible label for the minute presets group. */
  protected minutePresetsLabel(): string {
    return this.labels.minutePresets ?? 'Minute presets';
  }

  /** Accessible label for a single minute preset button. */
  protected minutePresetLabel(minute: number): string {
    return this.labels.minutePreset?.(minute) ?? `Set minutes to ${pad(minute)}`;
  }

  /** Steps a time unit by a delta, clamped to its range. */
  protected stepUnit(unit: HellTimeUnit, delta: number): void {
    const value = this.unitValue(unit);
    const next = Math.min(Math.max(value + delta, 0), this.unitMax(unit));
    if (next === value) return;
    this.setUnit(unit, next);
  }

  /** Handles keyboard navigation on a unit's spinbutton. */
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

  /** Reports a validation error while the draft text is unparseable. */
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
