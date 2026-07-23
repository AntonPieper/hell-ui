import {
  Directive,
  ElementRef,
  InjectionToken,
  Renderer2,
  afterRenderEffect,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  type Provider,
  type Signal,
} from '@angular/core';
import { type NgControl } from '@angular/forms';
import { FormField, transformedValue, type FormValueControl } from '@angular/forms/signals';
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
  type HellTypedValueCommitResult,
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

function isValidTime(value: unknown): value is HellTimeValue {
  if (typeof value !== 'object' || value === null) return false;
  const { hour, minute, second } = value as Partial<HellTimeValue>;
  return isTimeUnit(hour, 23) && isTimeUnit(minute, 59) && isTimeUnit(second, 59);
}

function isTimeUnit(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max;
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

/**
 * `FormUiControl` reserves `min`/`max` as `HellTimeValue | undefined` inputs so
 * bound forms can write and clear the control's bounds through the reserved
 * names. Property bindings keep accepting `HellTimeValue | null`; `null`,
 * `undefined`, and non-time values mean "unset".
 */
function hellTimeInputBoundAttribute(value: unknown): HellTimeValue | undefined {
  return isValidTime(value) ? value : undefined;
}

let nextTimeInputId = 0;

/**
 * Typed time behavior for a real input. Parsing, validation state, and forms
 * integration live on the native field; picker triggers and Time Picker panels
 * compose separately.
 *
 * The `value` model is the one Control Value Authority for the committed
 * `HellTimeValue | null`: bind it one-way (`[value]` plus `(valueChange)`),
 * two-way (`[(value)]`), or through Angular forms — Signal Forms
 * `[formField]` via the `FormValueControl` contract, and
 * `formControl`/`ngModel` via Angular's built-in Signal Forms
 * interoperability. Draft text stays interaction state: incomplete or invalid
 * text never commits, and commit attempts report parse failures through
 * `transformedValue` as `invalidTimeInputDraft` errors on the nearest Signal
 * Forms field.
 */
@Directive({
  selector: 'input[hellTimeInput]',
  exportAs: 'hellTimeInput',
  hostDirectives: [{ directive: HellInput, inputs: ['size', 'ui'] }],
  providers: [provideFormFieldState({ inherit: false })],
  host: {
    // Angular's `ngNoCva` marker: `formControl`/`ngModel` on this native input
    // must bind the directive's `value` model through Signal Forms custom
    // control interoperability instead of the string-writing
    // `DefaultValueAccessor` that otherwise attaches to text inputs.
    ngNoCva: '',
    '[attr.id]': 'id()',
    '[value]': 'display()',
    '[disabled]': 'disabled()',
    '[required]': 'required()',
    '[attr.step]': 'nativeStep()',
    '[attr.min]': 'nativeMin()',
    '[attr.max]': 'nativeMax()',
    '[attr.aria-invalid]': 'isInvalid() ? "true" : null',
    '[attr.aria-describedby]': 'fieldAriaDescribedby()',
    '[attr.aria-labelledby]': 'fieldAriaLabelledby()',
    '[attr.data-invalid]': 'isInvalid() ? "true" : null',
    '[attr.data-disabled]': 'disabled() ? "true" : null',
    '[attr.data-required]': 'required() ? "true" : null',
    '(input)': 'onInput()',
    '(blur)': 'onBlur()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class HellTimeInput implements FormValueControl<HellTimeValue | null> {
  /** Native input id, generated when the consumer does not author one. */
  readonly id = input(`hell-time-input-${++nextTimeInputId}`);
  /** Forces the invalid presentation. Also driven by bound forms. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Disables native interaction. Also driven by bound forms. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks null as visually missing. Also driven by a field's `required()` rule. */
  readonly required = input(false, { transform: booleanAttribute });
  /**
   * Committed time value — the one Control Value Authority. User commits on
   * blur or Enter write it exactly once and emit `(valueChange)`; external
   * property, two-way, and form writes flow in without re-emitting. Invalid
   * or incomplete draft text never reaches this model.
   */
  readonly value = model<HellTimeValue | null>(null);
  /**
   * Inclusive lower same-day time bound. `undefined` (or `null`) means
   * unbounded. Also writable by bound forms through the reserved input.
   */
  readonly min = input(undefined, { transform: hellTimeInputBoundAttribute });
  /**
   * Inclusive upper same-day time bound. `undefined` (or `null`) means
   * unbounded. Also writable by bound forms through the reserved input.
   */
  readonly max = input(undefined, { transform: hellTimeInputBoundAttribute });
  /** Includes seconds in parsing, formatting, bounds, and native step metadata. */
  readonly seconds = input(false, { transform: booleanAttribute });
  /** Additional `aria-describedby` ids merged with an enclosing Field. */
  readonly ariaDescribedby = input<string | null>(null, { alias: 'aria-describedby' });
  /** Additional `aria-labelledby` ids merged with an enclosing Field. */
  readonly ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });

  /**
   * Emits when focus leaves the native input. Angular forms listen to this
   * output to mark the bound field or control as touched.
   */
  readonly touch = output<void>();

  private readonly host = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);
  private readonly adapter = inject(HELL_TIME_INPUT_ADAPTER);
  private readonly inputState = injectInputState();
  /**
   * The Signal Forms `FormField` directive bound to this host, when present.
   * Parse failures are reported only into its field: classic
   * `formControl`/`ngModel` bindings deliberately receive no directive-owned
   * errors, because their required and range policy is form-owned too and the
   * silent parse-error revalidation Angular's interop performs
   * (`emitEvent: false`) would leave event-driven Field mirrors stale.
   */
  private readonly signalFormField = inject(FormField, { self: true, optional: true });
  private readonly inheritedFormField = injectFormFieldState({
    optional: true,
    skipSelf: true,
  });
  private readonly formField = ngpFormField({
    ngControl: signal<NgControl | undefined>(undefined),
  });

  private hasExternalSnapshot = false;
  private externalSnapshot: HellTimeValue | null = null;

  private readonly valueState = new HellTypedValueInputState<
    HellTimeValue,
    HellTimeValue | null
  >({
    external: () => this.value(),
    parseExternal: (value) => this.normalizeValue(value),
    parseText: (text) => this.parseText(text),
    format: (value) => this.adapter.format(value, this.context()),
    externalChanged: (base, current) => !this.sameValue(base, current),
  });

  /**
   * Raw-text commit boundary over the `value` model. Commit attempts write the
   * committed text here: a valid parse updates the model exactly once, while a
   * parse failure leaves the model untouched and reports one
   * `invalidTimeInputDraft` error to the nearest Signal Forms field.
   */
  private readonly rawCommitText = transformedValue(this.value, {
    parse: (text: string) => {
      const parsed = this.parseText(text);
      if (!parsed.valid) return { error: { kind: 'invalidTimeInputDraft' } };
      return { value: parsed.value };
    },
    format: (value) => this.adapter.format(this.normalizeValue(value), this.context()),
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
  /** Effective invalid state from behavior, Field, forms, or an explicit override. */
  protected readonly isInvalid = (): boolean =>
    this.invalid() ||
    this.invalidDraft() ||
    this.outOfRange() ||
    this.requiredMissing() ||
    this.inheritedFormField()?.invalid() === true;
  /** Native step metadata matching visible precision. */
  protected readonly nativeStep = computed(() => (this.seconds() ? '1' : '60'));
  /** Native lower-bound metadata using the active adapter. */
  protected readonly nativeMin = computed(() => this.formatBound(this.min() ?? null));
  /** Native upper-bound metadata using the active adapter. */
  protected readonly nativeMax = computed(() => this.formatBound(this.max() ?? null));
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
      const disabled = this.disabled();
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
      const external = this.normalizeValue(this.value());
      if (this.hasExternalSnapshot && !this.sameValue(this.externalSnapshot, external)) {
        this.valueState.clearDraft();
        this.valueState.clearLocal();
      }
      this.externalSnapshot = external;
      this.hasExternalSnapshot = true;
    });

    afterRenderEffect(() => {
      // The composed Input primitive also reflects an id after render. Time
      // Input owns the public id and Field registration, so it settles last.
      const id = this.id();
      if (this.host.id !== id) this.renderer.setAttribute(this.host, 'id', id);
    });
  }

  /** Records the native field value as a draft. */
  protected onInput(): void {
    this.valueState.writeDraft(this.host.value);
  }

  /** Commits a draft and marks the native field touched on blur. */
  protected onBlur(): void {
    const text = this.host.value;
    this.applyCommit(this.valueState.commitDraft(), text);
    this.touch.emit();
  }

  /** Commits on Enter without cancelling native form submission. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    const text = this.host.value;
    this.applyCommit(this.valueState.commitText(text), text);
  }

  /**
   * Routes one commit attempt through the raw-text boundary: successful
   * commits write the model once (after synchronously canonicalizing the
   * native text so native form submission serializes the stable format), and
   * invalid commits report their parse failure without touching the model.
   * Stale and draft-free attempts change nothing.
   */
  private applyCommit(
    result: HellTypedValueCommitResult<HellTimeValue | null>,
    text: string,
  ): void {
    if (result.committed) {
      // Native submission may run before Angular renders the committed display.
      this.host.value = this.adapter.format(result.value, this.context());
      this.rawCommitText.set(text);
    } else if (result.reason === 'invalid' && this.signalFormField !== null) {
      this.rawCommitText.set(text);
    }
  }

  private context(): HellTimeInputAdapterContext {
    return { seconds: this.seconds() };
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
    const min = this.min() ?? null;
    const max = this.max() ?? null;
    return (
      this.adapter.isWithinBounds?.(value, min, max, this.context()) ??
      hellIsTimeInputValueWithinBounds(value, min, max, this.context())
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
}
