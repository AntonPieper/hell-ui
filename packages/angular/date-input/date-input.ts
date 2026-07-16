import {
  Directive,
  ElementRef,
  InjectionToken,
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

import {
  hellInvalidTypedValue,
  hellTypedValue,
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

/**
 * Strategy for parsing, formatting, normalizing, and bounds-checking dates.
 */
export type HellDateInputAdapter = HellTypedInputAdapter<Date>;

/** Default ISO `YYYY-MM-DD` date adapter. */
export const HELL_DEFAULT_DATE_INPUT_ADAPTER: HellDateInputAdapter = {
  parseText: hellParseDateInputText,
  format: hellFormatDateInputValue,
  normalize: hellCoerceDateInputValue,
  isSameValue: hellSameDateInputValue,
  isWithinBounds: hellIsDateInputValueWithinBounds,
};

/** Injection token resolving to the effective date input adapter. */
export const HELL_DATE_INPUT_ADAPTER = new InjectionToken<HellDateInputAdapter>(
  'HELL_DATE_INPUT_ADAPTER',
  { factory: () => HELL_DEFAULT_DATE_INPUT_ADAPTER },
);

/** Override the date input adapter for an injector scope. */
export function provideHellDateInputAdapter(adapter: HellDateInputAdapter): Provider {
  return { provide: HELL_DATE_INPUT_ADAPTER, useValue: adapter };
}

/**
 * Parse the business-default ISO `YYYY-MM-DD` format. Empty text commits a
 * nullable clear; unparseable text remains an invalid draft.
 */
function hellParseDateInputText(text: string): HellTypedValueParseResult<Date> {
  const value = text.trim();
  if (!value) return hellTypedValue<Date>(null);

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!iso) return hellInvalidTypedValue();

  const year = Number(iso[1]);
  const month = Number(iso[2]);
  const day = Number(iso[3]);
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? hellTypedValue(date)
    : hellInvalidTypedValue();
}

/** Format a date as a stable local-calendar `YYYY-MM-DD` string. */
function hellFormatDateInputValue(date: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear().toString().padStart(4, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateDayTime(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function dateDayValue(value: Date | null | undefined): Date | null {
  return value instanceof Date && !Number.isNaN(value.valueOf())
    ? new Date(value.getFullYear(), value.getMonth(), value.getDate())
    : null;
}

function hellIsDateInputValueWithinBounds(
  date: Date | null,
  min: Date | null,
  max: Date | null,
): boolean {
  if (!date) return true;
  const day = dateDayTime(date);
  return (!min || day >= dateDayTime(min)) && (!max || day <= dateDayTime(max));
}

function hellSameDateInputValue(left: Date | null, right: Date | null): boolean {
  if (!left || !right) return left === right;
  return dateDayTime(left) === dateDayTime(right);
}

function hellCoerceDateInputValue(value: Date | null | undefined): Date | null {
  return dateDayValue(value);
}

let nextDateInputId = 0;

/**
 * Typed date behavior for a real text input. The directive owns draft parsing,
 * validation, controlled state, and forms integration; calendar triggers and
 * Date Picker panels compose separately around the input.
 */
@Directive({
  selector: 'input[hellDateInput]',
  exportAs: 'hellDateInput',
  hostDirectives: [{ directive: HellInput, inputs: ['size', 'ui'] }],
  providers: [
    provideFormFieldState({ inherit: false }),
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
    '[attr.id]': 'id()',
    '[value]': 'display()',
    '[disabled]': 'isDisabled()',
    '[required]': 'required()',
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
export class HellDateInput implements ControlValueAccessor, Validator {
  /** Native input id, generated when the consumer does not author one. */
  readonly id = input(`hell-date-input-${++nextDateInputId}`);
  /** Forces the invalid presentation and accessibility state. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Disables native input interaction outside forms use. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks null as a required-value validation error. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Current controlled date value. */
  readonly value = input<Date | null>(null);
  /** Inclusive lower date bound. */
  readonly min = input<Date | null>(null);
  /** Inclusive upper date bound. */
  readonly max = input<Date | null>(null);
  /** Additional `aria-describedby` ids merged with an enclosing Field. */
  readonly ariaDescribedby = input<string | null>(null, { alias: 'aria-describedby' });
  /** Additional `aria-labelledby` ids merged with an enclosing Field. */
  readonly ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });

  /** Emits each successfully committed date or nullable clear. */
  readonly valueChange = output<Date | null>();

  private readonly host = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private readonly adapter = inject(HELL_DATE_INPUT_ADAPTER);
  private readonly inheritedFormField = injectFormFieldState({
    optional: true,
    skipSelf: true,
  });
  private readonly formField = ngpFormField({
    ngControl: signal<NgControl | undefined>(undefined),
  });

  private readonly controlMode = signal(false);
  private readonly controlValue = signal<Date | null>(null);
  private readonly controlDisabled = signal(false);
  private onControlChange: (value: Date | null) => void = () => {};
  private onControlTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};
  private hasExternalSnapshot = false;
  private externalSnapshot: Date | null = null;

  private readonly valueState = new HellTypedValueInputState<Date, Date | null>({
    external: () => this.effectiveValue(),
    parseExternal: (value) => this.normalizeValue(value),
    parseText: (text) => this.parseText(text),
    format: (value) => this.adapter.format(value),
    externalChanged: (base, current) => !this.sameValue(base, current),
  });

  /** Current committed date, normalized to the adapter's value policy. */
  protected readonly current: Signal<Date | null> = this.valueState.current;
  /** Native input text for either the current draft or committed value. */
  protected readonly display = this.valueState.display;
  /** Whether the active draft cannot be parsed or falls outside the bounds. */
  protected readonly invalidDraft = this.valueState.invalidDraft;
  /** Whether the committed external value falls outside the current bounds. */
  protected readonly outOfRange = computed(
    () => this.current() !== null && !this.isWithinBounds(this.current()),
  );
  /** Whether a required date is missing. */
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
  /** Native lower-bound attribute using the adapter's stable format. */
  protected readonly nativeMin = computed(() => this.formatBound(this.min()));
  /** Native upper-bound attribute using the adapter's stable format. */
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
      this.onValidatorChange();
    });
  }

  /** Writes a date from an Angular form without emitting it back. */
  writeValue(value: Date | null): void {
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
  registerOnChange(fn: (value: Date | null) => void): void {
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

  /** Applies disabled state supplied by Angular forms to the native input. */
  setDisabledState(isDisabled: boolean): void {
    this.controlDisabled.set(isDisabled);
  }

  /** Reports malformed drafts, missing required values, and bound violations. */
  validate(_control: AbstractControl | null): ValidationErrors | null {
    const errors: ValidationErrors = {};

    if (this.invalidDraft()) {
      errors['invalidDateInputDraft'] = true;
    } else if (this.requiredMissing()) {
      errors['required'] = true;
    }
    if (this.outOfRange()) {
      errors['outOfRangeDate'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  /** Records the native field value as a draft while preserving the input event. */
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

  /** Commits on Enter while preserving the native keyboard event and form behavior. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    const result = this.valueState.commitText(this.host.value);
    if (result.committed) this.emitValue(result.value);
    this.onValidatorChange();
  }

  private effectiveValue(): Date | null {
    return this.controlMode() ? this.controlValue() : this.value();
  }

  private parseText(text: string): HellTypedValueParseResult<Date> {
    const parsed = this.adapter.parseText(text);
    if (!parsed.valid || parsed.value === null) return parsed;
    return this.isWithinBounds(parsed.value) ? parsed : hellInvalidTypedValue();
  }

  private normalizeValue(value: Date | null | undefined): Date | null {
    return this.adapter.normalize
      ? this.adapter.normalize(value)
      : hellCoerceDateInputValue(value);
  }

  private sameValue(left: Date | null, right: Date | null): boolean {
    return this.adapter.isSameValue?.(left, right) ?? hellSameDateInputValue(left, right);
  }

  private isWithinBounds(value: Date | null): boolean {
    return (
      this.adapter.isWithinBounds?.(value, this.min(), this.max()) ??
      hellIsDateInputValueWithinBounds(value, this.min(), this.max())
    );
  }

  private formatBound(value: Date | null): string | null {
    const normalized = this.normalizeValue(value);
    return normalized ? this.adapter.format(normalized) : null;
  }

  private mergeIdRefs(explicit: string | null, fieldIds: readonly string[] | undefined): string | null {
    const ids = hellUniqueIdRefs([explicit, ...(fieldIds ?? [])].filter(Boolean).join(' '));
    return ids.join(' ') || null;
  }

  private emitValue(value: Date | null): void {
    // Native submission can run before Angular renders the committed display.
    this.host.value = this.adapter.format(value);
    if (this.controlMode()) this.controlValue.set(value);
    this.valueChange.emit(value);
    this.onControlChange(value);
    this.onValidatorChange();
  }
}
