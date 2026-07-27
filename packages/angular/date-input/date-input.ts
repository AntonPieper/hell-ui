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
 * Date format pattern for parsing, display, native bound attributes, and the
 * placeholder hint. It is written with the `YYYY` (four-digit year), `MM`
 * (two-digit month), and `DD` (two-digit day) tokens — each used exactly once —
 * plus literal separators: `YYYY-MM-DD`, `DD.MM.YYYY`, and `MM/DD/YYYY` are all
 * valid patterns. Anything a pattern cannot express (month names, locale
 * formatting, several accepted input shapes) belongs in a custom
 * `HellDateInputAdapter` instead.
 */
export type HellDateInputFormat = string;

/** Business-default ISO date format. */
export const HELL_DEFAULT_DATE_INPUT_FORMAT: HellDateInputFormat = 'YYYY-MM-DD';

/** Injection token resolving to the effective scoped date input format. */
export const HELL_DATE_INPUT_FORMAT = new InjectionToken<HellDateInputFormat>(
  'HELL_DATE_INPUT_FORMAT',
  { factory: () => HELL_DEFAULT_DATE_INPUT_FORMAT },
);

/**
 * Set the date input format for an injector scope. The nearest provider wins
 * over ancestor providers, and a local `format` input wins over every provider.
 * Unsupported patterns throw here rather than at the first keystroke.
 */
export function provideHellDateInputFormat(format: HellDateInputFormat): Provider {
  hellCompileDateInputFormat(format);
  return { provide: HELL_DATE_INPUT_FORMAT, useValue: format };
}

/** Contextual date format passed to date adapter hooks. */
export interface HellDateInputAdapterContext {
  /** Effective format for parsing, formatting, and the placeholder hint. */
  readonly format: HellDateInputFormat;
}

/**
 * Strategy for parsing, formatting, normalizing, and bounds-checking dates.
 */
export type HellDateInputAdapter = HellTypedInputAdapter<Date, HellDateInputAdapterContext>;

/** Default adapter for the configured `YYYY`/`MM`/`DD` format. */
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

/** Calendar field a format token stands for. */
type HellDateInputFormatPart = 'year' | 'month' | 'day';

/** One literal separator or one calendar field of a compiled format. */
type HellDateInputFormatSegment =
  | { readonly literal: string }
  | { readonly part: HellDateInputFormatPart };

interface HellCompiledDateInputFormat {
  /** Literal and token segments in pattern order, used for formatting. */
  readonly segments: readonly HellDateInputFormatSegment[];
  /** Anchored strict matcher whose capture groups follow `order`. */
  readonly matcher: RegExp;
  /** Calendar fields in the order their capture groups appear. */
  readonly order: readonly HellDateInputFormatPart[];
}

const HELL_DATE_INPUT_FORMAT_TOKENS: Readonly<
  Record<string, { readonly part: HellDateInputFormatPart; readonly digits: number }>
> = {
  YYYY: { part: 'year', digits: 4 },
  MM: { part: 'month', digits: 2 },
  DD: { part: 'day', digits: 2 },
};

const compiledDateInputFormats = new Map<string, HellCompiledDateInputFormat>();

/** Compile — and memoize — one format pattern into its formatter and matcher. */
function hellCompileDateInputFormat(format: HellDateInputFormat): HellCompiledDateInputFormat {
  const cached = compiledDateInputFormats.get(format);
  if (cached) return cached;

  const segments: HellDateInputFormatSegment[] = [];
  const order: HellDateInputFormatPart[] = [];
  let source = '';
  let literalStart = 0;

  for (const match of format.matchAll(/YYYY|MM|DD/g)) {
    const literal = format.slice(literalStart, match.index);
    if (literal) {
      segments.push({ literal });
      source += escapeDateInputFormatLiteral(literal);
    }
    const token = HELL_DATE_INPUT_FORMAT_TOKENS[match[0]];
    segments.push({ part: token.part });
    order.push(token.part);
    source += `(\\d{${token.digits}})`;
    literalStart = match.index + match[0].length;
  }

  const tail = format.slice(literalStart);
  if (tail) {
    segments.push({ literal: tail });
    source += escapeDateInputFormatLiteral(tail);
  }

  if (order.length !== 3 || new Set(order).size !== 3) {
    throw new Error(
      `Unsupported hell date input format "${format}": use YYYY, MM, and DD exactly once each, plus literal separators.`,
    );
  }

  const compiled: HellCompiledDateInputFormat = {
    segments,
    order,
    matcher: new RegExp(`^${source}$`),
  };
  compiledDateInputFormats.set(format, compiled);
  return compiled;
}

function escapeDateInputFormatLiteral(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parse the configured format. Empty text commits a nullable clear; text that
 * does not match the pattern, or that names a day the calendar does not have,
 * remains an invalid draft.
 */
function hellParseDateInputText(
  text: string,
  context: HellDateInputAdapterContext,
): HellTypedValueParseResult<Date> {
  const value = text.trim();
  if (!value) return hellTypedValue<Date>(null);

  const compiled = hellCompileDateInputFormat(context.format);
  const match = compiled.matcher.exec(value);
  if (!match) return hellInvalidTypedValue();

  const parts: Record<HellDateInputFormatPart, number> = { year: 0, month: 0, day: 0 };
  compiled.order.forEach((part, index) => {
    parts[part] = Number(match[index + 1]);
  });
  const date = new Date(parts.year, parts.month - 1, parts.day);

  return date.getFullYear() === parts.year &&
    date.getMonth() === parts.month - 1 &&
    date.getDate() === parts.day
    ? hellTypedValue(date)
    : hellInvalidTypedValue();
}

/** Format a date as a stable local-calendar string in the configured format. */
function hellFormatDateInputValue(
  date: Date | null,
  context: HellDateInputAdapterContext,
): string {
  if (!date) return '';
  const parts: Record<HellDateInputFormatPart, number> = {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
  return hellCompileDateInputFormat(context.format)
    .segments.map((segment) =>
      'literal' in segment
        ? segment.literal
        : parts[segment.part].toString().padStart(segment.part === 'year' ? 4 : 2, '0'),
    )
    .join('');
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

/** Coerces an optional format pattern; `''`, `null`, and `undefined` stay unset. */
function hellOptionalDateInputFormat(
  value: string | null | undefined,
): HellDateInputFormat | undefined {
  return value ? value : undefined;
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
 *
 * Typed text, display, native bound attributes, and the placeholder hint follow
 * the effective date format: the local `format` input when set, otherwise the
 * nearest `provideHellDateInputFormat` scope, otherwise ISO `YYYY-MM-DD`. The
 * committed `Date | null` contract is unaffected by the format.
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
  /**
   * Date format for this input, overriding the scoped
   * `provideHellDateInputFormat` policy. Unset (or empty) keeps the scoped
   * format, then ISO `YYYY-MM-DD`.
   */
  readonly format = input(undefined, { transform: hellOptionalDateInputFormat });
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
  private readonly adapter = inject(HELL_DATE_INPUT_ADAPTER);
  private readonly scopedFormat = inject(HELL_DATE_INPUT_FORMAT);
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
  /** Last placeholder hint this directive wrote, so consumer text is never replaced. */
  private appliedPlaceholder: string | null = null;

  /** Effective format: the local input, then the scoped provider, then ISO. */
  private readonly dateFormat = computed(() => this.format() ?? this.scopedFormat);

  private readonly valueState = new HellTypedValueInputState<Date, Date | null>({
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
   * `invalidDateInputDraft` error to the nearest Signal Forms field.
   */
  private readonly rawCommitText = transformedValue(this.value, {
    parse: (text: string) => {
      const parsed = this.parseText(text);
      if (!parsed.valid) return { error: { kind: 'invalidDateInputDraft' } };
      return { value: parsed.value };
    },
    format: (value) => this.adapter.format(this.normalizeValue(value), this.context()),
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

    afterRenderEffect(() => {
      // The effective format doubles as the placeholder hint. A placeholder the
      // directive did not write is consumer-owned text and is left untouched;
      // reading after render sees static attributes and template bindings alike.
      const hint = this.dateFormat();
      const current = this.host.getAttribute('placeholder');
      if (current !== null && current !== this.appliedPlaceholder) return;
      if (current === hint) return;
      this.renderer.setAttribute(this.host, 'placeholder', hint);
      this.appliedPlaceholder = hint;
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
      this.host.value = this.adapter.format(result.value, this.context());
      this.rawCommitText.set(text);
    } else if (result.reason === 'invalid' && this.signalFormField !== null) {
      this.rawCommitText.set(text);
    }
  }

  private context(): HellDateInputAdapterContext {
    return { format: this.dateFormat() };
  }

  private parseText(text: string): HellTypedValueParseResult<Date> {
    const parsed = this.adapter.parseText(text, this.context());
    if (!parsed.valid || parsed.value === null) return parsed;
    return this.isWithinBounds(parsed.value) ? parsed : hellInvalidTypedValue();
  }

  private normalizeValue(value: Date | null | undefined): Date | null {
    return this.adapter.normalize
      ? this.adapter.normalize(value, this.context())
      : hellCoerceDateInputValue(value);
  }

  private sameValue(left: Date | null, right: Date | null): boolean {
    return this.adapter.isSameValue?.(left, right) ?? hellSameDateInputValue(left, right);
  }

  private isWithinBounds(value: Date | null): boolean {
    const min = this.min() ?? null;
    const max = this.max() ?? null;
    return (
      this.adapter.isWithinBounds?.(value, min, max, this.context()) ??
      hellIsDateInputValueWithinBounds(value, min, max)
    );
  }

  private formatBound(value: Date | null): string | null {
    const normalized = this.normalizeValue(value);
    return normalized ? this.adapter.format(normalized, this.context()) : null;
  }

  private mergeIdRefs(explicit: string | null, fieldIds: readonly string[] | undefined): string | null {
    const ids = hellUniqueIdRefs([explicit, ...(fieldIds ?? [])].filter(Boolean).join(' '));
    return ids.join(' ') || null;
  }
}
