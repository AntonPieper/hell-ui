import {
  Directive,
  ElementRef,
  InjectionToken,
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

import {
  hellInvalidTypedValue,
  hellTypedValue,
  type HellTypedInputAdapter,
  type HellTypedValueParseResult,
} from 'hell-ui/core';
import { HellInput } from 'hell-ui/input';
import {
  HellTypedValueInputState,
  hellSyncFormFieldDescriptions,
  hellSyncFormFieldLabels,
  hellUniqueIdRefs,
  type HellTypedValueCommitResult,
} from 'hell-ui/internal/core';

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

/**
 * `FormUiControl` reserves `min`/`max` as `Date | undefined` inputs so Signal
 * Forms can reflect `minDate()`/`maxDate()` validator metadata into the
 * control (and clear it with `undefined` again). Property bindings keep
 * accepting `Date | null`; `null`, `undefined`, and non-`Date` values mean
 * "unset".
 */
function hellDateInputBoundAttribute(value: unknown): Date | undefined {
  return value instanceof Date ? value : undefined;
}

let nextDateInputId = 0;

/**
 * Typed date behavior for a real text input. The directive owns draft parsing,
 * validation state, and forms integration; calendar triggers and Date Picker
 * panels compose separately around the input.
 *
 * The `value` model is the one Control Value Authority for the committed
 * `Date | null`: bind it one-way (`[value]` plus `(valueChange)`), two-way
 * (`[(value)]`), or through Angular forms — Signal Forms `[formField]` via the
 * `FormValueControl` contract, and `formControl`/`ngModel` via Angular's
 * built-in Signal Forms interoperability. Draft text stays interaction state:
 * incomplete or invalid text never commits, and commit attempts report parse
 * failures through `transformedValue` as `invalidDateInputDraft` errors on the
 * nearest Signal Forms field.
 */
@Directive({
  selector: 'input[hellDateInput]',
  exportAs: 'hellDateInput',
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
export class HellDateInput implements FormValueControl<Date | null> {
  /** Native input id, generated when the consumer does not author one. */
  readonly id = input(`hell-date-input-${++nextDateInputId}`);
  /** Forces the invalid presentation. Also driven by bound forms. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Disables native input interaction. Also driven by bound forms. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks null as visually missing. Also driven by a field's `required()` rule. */
  readonly required = input(false, { transform: booleanAttribute });
  /**
   * Committed date value — the one Control Value Authority. User commits on
   * blur or Enter write it exactly once and emit `(valueChange)`; external
   * property, two-way, and form writes flow in without re-emitting. Invalid
   * or incomplete draft text never reaches this model.
   */
  readonly value = model<Date | null>(null);
  /**
   * Inclusive lower date bound. `undefined` (or `null`) means unbounded. Also
   * driven by a bound Signal Forms field's `minDate()` validator metadata.
   */
  readonly min = input(undefined, { transform: hellDateInputBoundAttribute });
  /**
   * Inclusive upper date bound. `undefined` (or `null`) means unbounded. Also
   * driven by a bound Signal Forms field's `maxDate()` validator metadata.
   */
  readonly max = input(undefined, { transform: hellDateInputBoundAttribute });
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
  private readonly adapter = inject(HELL_DATE_INPUT_ADAPTER);
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
  private externalSnapshot: Date | null = null;

  private readonly valueState = new HellTypedValueInputState<Date, Date | null>({
    external: () => this.value(),
    parseExternal: (value) => this.normalizeValue(value),
    parseText: (text) => this.parseText(text),
    format: (value) => this.adapter.format(value),
    externalChanged: (base, current) => !this.sameValue(base, current),
  });

  /**
   * Raw-text commit boundary over the `value` model. Commit attempts write the
   * committed text here: a valid parse updates the model exactly once, while a
   * parse failure leaves the model untouched and reports one
   * `invalidDateInputDraft` error to the nearest Signal Forms field.
   */
  private readonly rawCommitText = transformedValue(this.value, {
    parse: (text: string) => {
      const parsed = this.parseText(text);
      if (!parsed.valid) return { error: { kind: 'invalidDateInputDraft' } };
      return { value: parsed.value };
    },
    format: (value) => this.adapter.format(this.normalizeValue(value)),
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
  /** Effective invalid state from behavior, Field, forms, or an explicit override. */
  protected readonly isInvalid = (): boolean =>
    this.invalid() ||
    this.invalidDraft() ||
    this.outOfRange() ||
    this.requiredMissing() ||
    this.inheritedFormField()?.invalid() === true;
  /** Native lower-bound attribute using the adapter's stable format. */
  protected readonly nativeMin = computed(() => this.formatBound(this.min() ?? null));
  /** Native upper-bound attribute using the adapter's stable format. */
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
  }

  /** Records the native field value as a draft while preserving the input event. */
  protected onInput(): void {
    this.valueState.writeDraft(this.host.value);
  }

  /** Commits a draft and marks the native field touched on blur. */
  protected onBlur(): void {
    const text = this.host.value;
    this.applyCommit(this.valueState.commitDraft(), text);
    this.touch.emit();
  }

  /** Commits on Enter while preserving the native keyboard event and form behavior. */
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
  private applyCommit(result: HellTypedValueCommitResult<Date | null>, text: string): void {
    if (result.committed) {
      // Native submission can run before Angular renders the committed display.
      this.host.value = this.adapter.format(result.value);
      this.rawCommitText.set(text);
    } else if (result.reason === 'invalid' && this.signalFormField !== null) {
      this.rawCommitText.set(text);
    }
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
      this.adapter.isWithinBounds?.(value, this.min() ?? null, this.max() ?? null) ??
      hellIsDateInputValueWithinBounds(value, this.min() ?? null, this.max() ?? null)
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
}
