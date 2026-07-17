import {
  Directive,
  ElementRef,
  InjectionToken,
  Renderer2,
  afterRenderEffect,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  type Provider,
  type Signal,
} from '@angular/core';
import {
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  type AbstractControl,
  type ControlValueAccessor,
  type NgControl,
  type ValidationErrors,
  type Validator,
} from '@angular/forms';
import {
  injectFormFieldState,
  ngpFormField,
  provideFormFieldState,
} from 'ng-primitives/form-field';
import { injectInputState } from 'ng-primitives/input';

import {
  hellInvalidTypedValue,
  hellTypedValue,
  type HellTimeValue,
  type HellTypedInputAdapter,
  type HellTypedValueParseResult,
} from '@hell-ui/angular/core';
import { HellInput } from '@hell-ui/angular/input';
import {
  HellTypedValueInputState,
  hellSyncFormFieldDescriptions,
  hellSyncFormFieldLabels,
  hellUniqueIdRefs,
} from '@hell-ui/angular/internal/core';
export type { HellTimeValue } from '@hell-ui/angular/core';

/** Contextual precision passed to time adapter hooks. */
export interface HellTimeInputAdapterContext {
  /** Whether seconds are part of the visible and committed value. */
  readonly seconds: boolean;
}

/** Strategy for parsing, formatting, normalizing, comparing, and bounding times. */
export type HellTimeInputAdapter = HellTypedInputAdapter<
  HellTimeValue,
  HellTimeInputAdapterContext
>;

/** Default adapter for `HH:mm`, optional `HH:mm:ss`, compact, and 12-hour text. */
export const HELL_DEFAULT_TIME_INPUT_ADAPTER: HellTimeInputAdapter = {
  parseText: hellParseTimeInputText,
  format: hellFormatTimeInputValue,
  normalize: hellNormalizeTimeInputValue,
  isSameValue: hellSameTimeInputValue,
  isWithinBounds: hellIsTimeInputValueWithinBounds,
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

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function hellFormatTimeInputValue(
  value: HellTimeValue | null,
  context: HellTimeInputAdapterContext,
): string {
  if (!value) return '';
  return context.seconds
    ? `${pad(value.hour)}:${pad(value.minute)}:${pad(value.second)}`
    : `${pad(value.hour)}:${pad(value.minute)}`;
}

function hellNormalizeTimeInputValue(
  value: HellTimeValue | null | undefined,
  context: HellTimeInputAdapterContext,
): HellTimeValue | null {
  if (!isValidTime(value)) return null;
  return context.seconds ? value : { ...value, second: 0 };
}

function hellParseTimeInputText(
  text: string,
  context: HellTimeInputAdapterContext,
): HellTypedValueParseResult<HellTimeValue> {
  const source = text.trim().toLowerCase();
  if (!source) return hellTypedValue<HellTimeValue>(null);

  const compact = /^(\d{1,4})$/.exec(source);
  if (compact) {
    const digits = compact[1];
    const hourText = digits.length <= 2 ? digits : digits.slice(0, -2);
    const minuteText = digits.length <= 2 ? '0' : digits.slice(-2);
    return parsedTimeValue(
      { hour: Number(hourText), minute: Number(minuteText), second: 0 },
      context,
    );
  }

  const meridiem = /^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?\s*(a|am|p|pm)$/.exec(
    source,
  );
  if (meridiem) {
    if (!context.seconds && meridiem[3] !== undefined) return hellInvalidTypedValue();
    let hour = Number(meridiem[1]);
    if (hour < 1 || hour > 12) return hellInvalidTypedValue();
    if (hour === 12) hour = 0;
    if (meridiem[4].startsWith('p')) hour += 12;
    return parsedTimeValue(
      {
        hour,
        minute: Number(meridiem[2] ?? '0'),
        second: Number(meridiem[3] ?? '0'),
      },
      context,
    );
  }

  const separated = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.exec(source);
  if (!separated || (!context.seconds && separated[3] !== undefined)) {
    return hellInvalidTypedValue();
  }
  return parsedTimeValue(
    {
      hour: Number(separated[1]),
      minute: Number(separated[2]),
      second: Number(separated[3] ?? '0'),
    },
    context,
  );
}

function parsedTimeValue(
  value: HellTimeValue,
  context: HellTimeInputAdapterContext,
): HellTypedValueParseResult<HellTimeValue> {
  const normalized = hellNormalizeTimeInputValue(value, context);
  return normalized ? hellTypedValue(normalized) : hellInvalidTypedValue();
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

function timeValueSeconds(value: HellTimeValue): number {
  return value.hour * 3600 + value.minute * 60 + value.second;
}

function hellIsTimeInputValueWithinBounds(
  value: HellTimeValue | null,
  min: HellTimeValue | null,
  max: HellTimeValue | null,
  context: HellTimeInputAdapterContext,
): boolean {
  const normalized = hellNormalizeTimeInputValue(value, context);
  if (!normalized) return true;
  const normalizedMin = hellNormalizeTimeInputValue(min, context);
  const normalizedMax = hellNormalizeTimeInputValue(max, context);
  const seconds = timeValueSeconds(normalized);
  return (
    (!normalizedMin || seconds >= timeValueSeconds(normalizedMin)) &&
    (!normalizedMax || seconds <= timeValueSeconds(normalizedMax))
  );
}

function hellSameTimeInputValue(
  left: HellTimeValue | null,
  right: HellTimeValue | null,
): boolean {
  return (
    left?.hour === right?.hour &&
    left?.minute === right?.minute &&
    left?.second === right?.second
  );
}

let nextTimeInputId = 0;

/**
 * Typed time behavior for a real input. Parsing, validation, and forms live on
 * the native field; picker triggers and Time Picker panels compose separately.
 */
@Directive({
  selector: 'input[hellTimeInput]',
  exportAs: 'hellTimeInput',
  hostDirectives: [{ directive: HellInput, inputs: ['size', 'ui'] }],
  providers: [
    provideFormFieldState({ inherit: false }),
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
    '[attr.id]': 'id()',
    '[value]': 'display()',
    '[disabled]': 'isDisabled()',
    '[required]': 'required()',
    '[attr.step]': 'nativeStep()',
    '[attr.min]': 'nativeMin()',
    '[attr.max]': 'nativeMax()',
    '[attr.aria-invalid]': 'isInvalid() ? "true" : null',
    '[attr.aria-describedby]': 'fieldAriaDescribedby()',
    '[attr.aria-labelledby]': 'fieldAriaLabelledby()',
    '[attr.data-invalid]': 'isInvalid() ? "true" : null',
    '[attr.data-disabled]': 'isDisabled() ? "true" : null',
    '[attr.data-required]': 'required() ? "true" : null',
    '(input)': 'onInput()',
    '(blur)': 'onBlur()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class HellTimeInput implements ControlValueAccessor, Validator {
  /** Native input id, generated when the consumer does not author one. */
  readonly id = input(`hell-time-input-${++nextTimeInputId}`);
  /** Forces invalid presentation and accessibility state. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Disables native interaction outside forms use. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks a nullable clear as a required-value validation error. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Current controlled time value. */
  readonly value = input<HellTimeValue | null>(null);
  /** Inclusive lower same-day time bound. */
  readonly min = input<HellTimeValue | null>(null);
  /** Inclusive upper same-day time bound. */
  readonly max = input<HellTimeValue | null>(null);
  /** Includes seconds in parsing, formatting, bounds, and native step metadata. */
  readonly seconds = input(false, { transform: booleanAttribute });
  /** Additional `aria-describedby` ids merged with an enclosing Field. */
  readonly ariaDescribedby = input<string | null>(null, { alias: 'aria-describedby' });
  /** Additional `aria-labelledby` ids merged with an enclosing Field. */
  readonly ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });

  /** Emits each successfully committed time or nullable clear. */
  readonly valueChange = output<HellTimeValue | null>();

  private readonly host = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);
  private readonly adapter = inject(HELL_TIME_INPUT_ADAPTER);
  private readonly inputState = injectInputState();
  private readonly inheritedFormField = injectFormFieldState({
    optional: true,
    skipSelf: true,
  });
  private readonly formField = ngpFormField({
    ngControl: signal<NgControl | undefined>(undefined),
  });

  private readonly controlMode = signal(false);
  private readonly controlValue = signal<HellTimeValue | null>(null);
  private readonly controlDisabled = signal(false);
  private onControlChange: (value: HellTimeValue | null) => void = () => {};
  private onControlTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};
  private hasExternalSnapshot = false;
  private externalSnapshot: HellTimeValue | null = null;

  private readonly valueState = new HellTypedValueInputState<
    HellTimeValue,
    HellTimeValue | null
  >({
    external: () => this.effectiveValue(),
    parseExternal: (value) => this.normalizeValue(value),
    parseText: (text) => this.parseText(text),
    format: (value) => this.adapter.format(value, this.context()),
    externalChanged: (base, current) => !this.sameValue(base, current),
  });

  /** Current committed time normalized to visible precision. */
  protected readonly current: Signal<HellTimeValue | null> = this.valueState.current;
  /** Native text for either the active draft or committed value. */
  protected readonly display = this.valueState.display;
  /** Whether the active draft is malformed or outside current bounds. */
  protected readonly invalidDraft = this.valueState.invalidDraft;
  /** Whether the committed external value falls outside current bounds. */
  protected readonly outOfRange = computed(
    () => this.current() !== null && !this.isWithinBounds(this.current()),
  );
  /** Whether a required time is missing. */
  protected readonly requiredMissing = computed(
    () => this.required() && this.current() === null && !this.invalidDraft(),
  );
  /** Effective invalid state from behavior, Field, or an explicit override. */
  protected readonly isInvalid = (): boolean =>
    this.invalid() ||
    this.invalidDraft() ||
    this.outOfRange() ||
    this.requiredMissing() ||
    this.inheritedFormField()?.invalid() === true;
  /** Effective disabled state from the public input or forms API. */
  protected readonly isDisabled = () => this.disabled() || this.controlDisabled();
  /** Native step metadata matching visible precision. */
  protected readonly nativeStep = computed(() => (this.seconds() ? '1' : '60'));
  /** Native lower-bound metadata using the active adapter. */
  protected readonly nativeMin = computed(() => this.formatBound(this.min()));
  /** Native upper-bound metadata using the active adapter. */
  protected readonly nativeMax = computed(() => this.formatBound(this.max()));
  /** Effective description ids from native attributes and an enclosing Field. */
  protected readonly fieldAriaDescribedby = computed(() =>
    this.mergeIdRefs(this.ariaDescribedby(), this.inheritedFormField()?.descriptions()),
  );
  /** Effective label ids from native attributes and an enclosing Field. */
  protected readonly fieldAriaLabelledby = computed(() =>
    this.mergeIdRefs(this.ariaLabelledby(), this.inheritedFormField()?.labels()),
  );

  constructor() {
    hellSyncFormFieldDescriptions(this.formField, this.fieldAriaDescribedby);
    hellSyncFormFieldLabels(this.formField, this.fieldAriaLabelledby);

    effect(() => {
      const disabled = this.isDisabled();
      const inputState = this.inputState();
      if (inputState.disabled() !== disabled) inputState.setDisabled(disabled);
      this.formField.disabled.set(disabled);
    });

    effect(() => {
      this.formField.invalid.set(this.isInvalid());
    });

    const inheritedFormField = this.inheritedFormField();
    effect((onCleanup) => {
      const id = this.id();
      this.formField.setFormControl(id);
      inheritedFormField?.setFormControl(id);
      onCleanup(() => {
        if (this.formField.formControl() === id) this.formField.removeFormControl();
        if (inheritedFormField?.formControl() === id) inheritedFormField.removeFormControl();
      });
    });

    if (inheritedFormField) {
      hellSyncFormFieldDescriptions(
        this.formField,
        computed(() => inheritedFormField.descriptions().join(' ') || null),
      );
      hellSyncFormFieldLabels(
        this.formField,
        computed(() => inheritedFormField.labels().join(' ') || null),
      );
    }

    effect(() => {
      const external = this.normalizeValue(this.effectiveValue());
      if (this.hasExternalSnapshot && !this.sameValue(this.externalSnapshot, external)) {
        this.valueState.clearDraft();
        this.valueState.clearLocal();
      }
      this.externalSnapshot = external;
      this.hasExternalSnapshot = true;
    });

    effect(() => {
      this.invalidDraft();
      this.current();
      this.min();
      this.max();
      this.required();
      this.seconds();
      this.onValidatorChange();
    });

    afterRenderEffect(() => {
      // The composed Input primitive also reflects an id after render. Time
      // Input owns the public id and Field registration, so it settles last.
      const id = this.id();
      if (this.host.id !== id) this.renderer.setAttribute(this.host, 'id', id);
    });
  }

  /** Writes a time from Angular forms without emitting it back. */
  writeValue(value: HellTimeValue | null): void {
    const normalized = this.normalizeValue(value);
    const changed = !this.controlMode() || !this.sameValue(this.controlValue(), normalized);

    this.controlMode.set(true);
    this.controlValue.set(normalized);
    if (changed) {
      this.valueState.clearDraft();
      this.valueState.clearLocal();
    }
    this.onValidatorChange();
  }

  /** Registers the Angular forms change callback. */
  registerOnChange(fn: (value: HellTimeValue | null) => void): void {
    this.onControlChange = fn;
  }

  /** Registers the Angular forms touched callback. */
  registerOnTouched(fn: () => void): void {
    this.onControlTouched = fn;
  }

  /** Registers the Angular forms validator-change callback. */
  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  /** Applies disabled state supplied by Angular forms. */
  setDisabledState(isDisabled: boolean): void {
    this.controlDisabled.set(isDisabled);
  }

  /** Reports malformed drafts, missing required values, and bound violations. */
  validate(_control: AbstractControl | null): ValidationErrors | null {
    const errors: ValidationErrors = {};
    if (this.invalidDraft()) errors['invalidTimeInputDraft'] = true;
    else if (this.requiredMissing()) errors['required'] = true;
    if (this.outOfRange()) errors['outOfRangeTime'] = true;
    return Object.keys(errors).length > 0 ? errors : null;
  }

  /** Records the native field value as a draft. */
  protected onInput(): void {
    this.valueState.writeDraft(this.host.value);
    this.onValidatorChange();
  }

  /** Commits a draft and marks the native field touched on blur. */
  protected onBlur(): void {
    const result = this.valueState.commitDraft();
    if (result.committed) this.emitValue(result.value);
    this.onControlTouched();
    this.onValidatorChange();
  }

  /** Commits on Enter without cancelling native form submission. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    const result = this.valueState.commitText(this.host.value);
    if (result.committed) this.emitValue(result.value);
    this.onValidatorChange();
  }

  private context(): HellTimeInputAdapterContext {
    return { seconds: this.seconds() };
  }

  private effectiveValue(): HellTimeValue | null {
    return this.controlMode() ? this.controlValue() : this.value();
  }

  private parseText(text: string): HellTypedValueParseResult<HellTimeValue> {
    const parsed = this.adapter.parseText(text, this.context());
    if (!parsed.valid || parsed.value === null) return parsed;
    return this.isWithinBounds(parsed.value) ? parsed : hellInvalidTypedValue();
  }

  private normalizeValue(value: HellTimeValue | null | undefined): HellTimeValue | null {
    return this.adapter.normalize
      ? this.adapter.normalize(value, this.context())
      : hellNormalizeTimeInputValue(value, this.context());
  }

  private sameValue(left: HellTimeValue | null, right: HellTimeValue | null): boolean {
    return this.adapter.isSameValue?.(left, right) ?? hellSameTimeInputValue(left, right);
  }

  private isWithinBounds(value: HellTimeValue | null): boolean {
    return (
      this.adapter.isWithinBounds?.(value, this.min(), this.max(), this.context()) ??
      hellIsTimeInputValueWithinBounds(value, this.min(), this.max(), this.context())
    );
  }

  private formatBound(value: HellTimeValue | null): string | null {
    const normalized = this.normalizeValue(value);
    return normalized ? this.adapter.format(normalized, this.context()) : null;
  }

  private mergeIdRefs(explicit: string | null, fieldIds: readonly string[] | undefined): string | null {
    const ids = hellUniqueIdRefs([explicit, ...(fieldIds ?? [])].filter(Boolean).join(' '));
    return ids.join(' ') || null;
  }

  private emitValue(value: HellTimeValue | null): void {
    // Native submission may run before Angular renders the committed display.
    this.host.value = this.adapter.format(value, this.context());
    if (this.controlMode()) this.controlValue.set(value);
    this.valueChange.emit(value);
    this.onControlChange(value);
    this.onValidatorChange();
  }
}
