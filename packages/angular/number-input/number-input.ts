import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  NO_ERRORS_SCHEMA,
  type ElementRef,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  InjectionToken,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
  type Provider,
  type Signal,
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
import {
  NgpFormControl,
  injectFormFieldState,
  ngpFormField,
  provideFormFieldState,
} from 'ng-primitives/form-field';
import { hellCreateLabels } from '@hell-ui/angular/core';
import {
  hellSyncFormFieldDescriptions,
  hellSyncFormFieldLabels,
} from '@hell-ui/angular/internal/core';
import type { HellSize } from '@hell-ui/angular/core';
import {
  hellPartStyler,
  hellInvalidTypedValue,
  hellTypedValue,
  type HellRecipe,
  type HellTypedValueParseResult,
  type HellUi,
  type HellUiInput,
} from '@hell-ui/angular/core';
import { HellTypedValueInputState } from '@hell-ui/angular/internal/core';

/** Built-in accessibility labels owned by the number input entry point. */
export interface HellNumberInputLabels {
  /** Accessible label for the increment stepper when no field label is set. */
  readonly increment: string;
  /** Accessible label for the decrement stepper when no field label is set. */
  readonly decrement: string;
  /** Accessible label for the increment stepper, incorporating the field label. */
  readonly incrementFor: (label: string) => string;
  /** Accessible label for the decrement stepper, incorporating the field label. */
  readonly decrementFor: (label: string) => string;
}

/** Injection token resolving to the effective number input labels. */
export const HELL_NUMBER_INPUT_LABELS: InjectionToken<HellNumberInputLabels> = hellCreateLabels<HellNumberInputLabels>(
  'HELL_NUMBER_INPUT_LABELS',
  {
    increment: 'Increase value',
    decrement: 'Decrease value',
    incrementFor: (label) => `Increase ${label}`,
    decrementFor: (label) => `Decrease ${label}`,
  },
);

let nextNumberInputId = 0;

/** Public parts of the HellNumberInput module, styleable through its Part Style Map. */
export type HellNumberInputPart = 'root' | 'input' | 'increment' | 'decrement' | 'suffix';

/** Part Style Map accepted by the HellNumberInput `ui` input. */
export type HellNumberInputUi = HellUi<HellNumberInputPart>;

const HELL_NUMBER_INPUT_RECIPE = {
  root: 'relative inline-flex w-full max-w-40 min-w-24 items-stretch rounded-hell-md border border-hell-border bg-hell-surface-elevated transition-[background-color,border-color,box-shadow] duration-[var(--hell-duration-fast)] ease-hell-out hover:border-hell-border-strong focus-within:border-hell-border-focus focus-within:shadow-[0_0_0_3px_var(--color-hell-focus-ring)] data-[invalid=true]:border-hell-danger data-[disabled=true]:cursor-not-allowed data-[disabled=true]:border-hell-border data-[disabled=true]:bg-hell-surface-subtle',
  input:
    'h-hell-control-md min-w-0 flex-1 rounded-hell-md border-0 bg-transparent px-hell-3 py-0 font-[inherit] text-[13px] text-hell-foreground tabular-nums outline-none placeholder:text-hell-foreground-subtle disabled:cursor-not-allowed disabled:text-hell-foreground-muted data-[size=sm]:h-hell-control-sm data-[size=sm]:text-xs data-[size=lg]:h-hell-control-lg data-[size=lg]:text-sm',
  suffix:
    'inline-flex flex-none select-none items-center ps-hell-1 pe-hell-2 text-[12px] text-hell-foreground-muted tabular-nums data-[size=sm]:text-[11px] data-[size=lg]:text-[13px]',
  increment:
    'inline-flex flex-1 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-hell-foreground-subtle transition-[background-color,color] duration-[var(--hell-duration-fast)] ease-hell-out hover:bg-hell-surface-muted hover:text-hell-foreground focus-visible:relative focus-visible:z-[1] focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-[-2px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40',
  decrement:
    'inline-flex flex-1 cursor-pointer items-center justify-center border-0 border-t border-hell-border bg-transparent p-0 text-hell-foreground-subtle transition-[background-color,color] duration-[var(--hell-duration-fast)] ease-hell-out hover:bg-hell-surface-muted hover:text-hell-foreground focus-visible:relative focus-visible:z-[1] focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-[-2px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40',
} satisfies HellRecipe<HellNumberInputPart>;

/** Contextual flags passed to adapter parse and format hooks. */
export interface HellNumberInputAdapterContext {
  /** Whether the field is in integer-only mode. */
  readonly integer: boolean;
}

/** Strategy for parsing, formatting, normalizing, and comparing numeric values. */
export interface HellNumberInputAdapter {
  /** Parse visible text. Return `{ valid: true, value: null }` to commit a clear. */
  readonly parseText: (
    text: string,
    context: HellNumberInputAdapterContext,
  ) => HellTypedValueParseResult<number>;
  /** Format a committed value for the text field. */
  readonly format: (value: number | null, context: HellNumberInputAdapterContext) => string;
  /** Coerce external form/input values before display; non-finite values should return null. */
  readonly normalize?: (
    value: number | null | undefined,
    context: HellNumberInputAdapterContext,
  ) => number | null;
  /** Compare numeric values semantically instead of by object identity. */
  readonly isSameValue?: (a: number | null, b: number | null) => boolean;
}

const INTEGER_PATTERN = /^[+-]?\d+$/;
const DECIMAL_PATTERN = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;

/**
 * Parse number input text into a value or an invalid draft. Accepts an optional
 * sign, plain digits, and a single decimal point in decimal mode; integer mode
 * rejects any fractional part. Exponent notation is rejected so parsing stays
 * deterministic. Empty text commits a nullable clear; anything else that does
 * not match stays as an invalid draft.
 */
function hellParseNumberInputText(
  text: string,
  context: HellNumberInputAdapterContext,
): HellTypedValueParseResult<number> {
  const trimmed = text.trim();
  if (!trimmed) return hellTypedValue<number>(null);

  const pattern = context.integer ? INTEGER_PATTERN : DECIMAL_PATTERN;
  if (!pattern.test(trimmed)) return hellInvalidTypedValue();

  const value = Number(trimmed);
  if (!Number.isFinite(value)) return hellInvalidTypedValue();
  return hellTypedValue(value);
}

/** Format a numeric value as its plain decimal string, or empty string when null. */
function hellFormatNumberInputValue(
  value: number | null,
  _context: HellNumberInputAdapterContext,
): string {
  return value === null || !Number.isFinite(value) ? '' : String(value);
}

/** Coerce an external value to a finite number, or null when it is not usable. */
function hellNormalizeNumberInputValue(
  value: number | null | undefined,
  _context: HellNumberInputAdapterContext,
): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Compare two numeric values by identity, treating null as its own value. */
function hellSameNumberInputValue(a: number | null, b: number | null): boolean {
  return a === b;
}

/** Default number input adapter parsing and formatting plain decimal strings. */
export const HELL_DEFAULT_NUMBER_INPUT_ADAPTER: HellNumberInputAdapter = {
  parseText: hellParseNumberInputText,
  format: hellFormatNumberInputValue,
  normalize: hellNormalizeNumberInputValue,
  isSameValue: hellSameNumberInputValue,
};

/** Injection token resolving to the effective number input adapter. */
export const HELL_NUMBER_INPUT_ADAPTER = new InjectionToken<HellNumberInputAdapter>(
  'HELL_NUMBER_INPUT_ADAPTER',
  { factory: () => HELL_DEFAULT_NUMBER_INPUT_ADAPTER },
);

/** Override the number input adapter for an injector scope. */
export function provideHellNumberInputAdapter(adapter: HellNumberInputAdapter): Provider {
  return { provide: HELL_NUMBER_INPUT_ADAPTER, useValue: adapter };
}

const HOLD_DELAY_MS = 400;
const HOLD_REPEAT_MS = 60;

/**
 * Number input — a text field with numeric semantics on the shared Typed Value
 * Input model. It parses and formats a real `number | null`, follows the APG
 * spinbutton pattern (reflected value/min/max), steps with Arrow keys
 * (Shift for a larger jump) and Home/End, offers optional hold-to-repeat
 * stepper buttons and a unit suffix, and never clamps typing live — out-of-range
 * values commit but fail validation.
 *
 * Bind `[value]` as `number | null` and listen to `(valueChange)`. Pair with
 * `hellField` for label / description / error wiring.
 */
@Component({
  selector: 'hell-number-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgpFormControl],
  schemas: [NO_ERRORS_SCHEMA],
  viewProviders: [provideFormFieldState()],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HellNumberInput),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => HellNumberInput),
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
      autocomplete="off"
      [attr.inputmode]="integer() ? 'numeric' : 'decimal'"
      [attr.data-size]="size()"
      [attr.data-invalid]="isInvalid() ? 'true' : null"
      [invalid]="isInvalid()"
      role="spinbutton"
      [attr.aria-valuenow]="current()"
      [attr.aria-valuemin]="min()"
      [attr.aria-valuemax]="max()"
      [attr.aria-valuetext]="valueText()"
      [id]="inputId()"
      [attr.name]="name()"
      [attr.aria-invalid]="isInvalid() ? 'true' : null"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-describedby]="fieldAriaDescribedby()"
      [attr.aria-labelledby]="fieldAriaLabelledby()"
      [disabled]="isDisabled()"
      [attr.placeholder]="placeholder()"
      [value]="display()"
      (input)="onInput(field.value)"
      (blur)="onBlur()"
      (keydown)="onKeydown($event, field.value)"
      (wheel)="onWheel($event)"
    />

    @if (suffix(); as unit) {
      <span
        data-slot="suffix"
        [class]="part('suffix')"
        [attr.data-size]="size()"
        aria-hidden="true"
      >
        {{ unit }}
      </span>
    }

    @if (steppers()) {
      <span class="flex flex-none flex-col items-stretch border-s border-hell-border">
        <button
          type="button"
          tabindex="-1"
          data-slot="increment"
          [class]="part('increment')"
          [attr.data-size]="size()"
          [disabled]="isIncrementDisabled()"
          [attr.aria-label]="incrementLabel()"
          (pointerdown)="onStepperPointerDown($event, 1)"
          (pointerup)="stopHold()"
          (pointerleave)="stopHold()"
          (pointercancel)="stopHold()"
          (keydown)="onStepperKeydown($event, 1)"
        >
          <svg
            viewBox="0 0 10 10"
            class="size-hell-3 w-hell-6"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M2 6.25 5 3.25 8 6.25" />
          </svg>
        </button>
        <button
          type="button"
          tabindex="-1"
          data-slot="decrement"
          [class]="part('decrement')"
          [attr.data-size]="size()"
          [disabled]="isDecrementDisabled()"
          [attr.aria-label]="decrementLabel()"
          (pointerdown)="onStepperPointerDown($event, -1)"
          (pointerup)="stopHold()"
          (pointerleave)="stopHold()"
          (pointercancel)="stopHold()"
          (keydown)="onStepperKeydown($event, -1)"
        >
          <svg
            viewBox="0 0 10 10"
            class="size-hell-3 w-hell-6"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M2 3.75 5 6.75 8 3.75" />
          </svg>
        </button>
      </span>
    }
  `,
})
export class HellNumberInput implements ControlValueAccessor, Validator {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellNumberInputPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellNumberInputPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_NUMBER_INPUT_RECIPE,
  });

  /** Control height. Defaults to `md`. */
  readonly size = input<Exclude<HellSize, 'xs' | 'xl'>>('md');
  /** Forces the invalid visual state. Defaults to `false`. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Disables the field and steppers. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks the control required for validation. Defaults to `false`. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Current numeric value in uncontrolled use. Defaults to `null`. */
  readonly value = input<number | null>(null);
  /** Lower bound enforced by stepping and validation. Defaults to `null`. */
  readonly min = input<number | null>(null);
  /** Upper bound enforced by stepping and validation. Defaults to `null`. */
  readonly max = input<number | null>(null);
  /** Amount a single Arrow/stepper step changes the value. Defaults to `1`. */
  readonly step = input(1, { transform: numberAttribute });
  /** Multiplier applied to `step` for Shift+Arrow and PageUp/PageDown. Defaults to `10`. */
  readonly stepMultiplier = input(10, { transform: numberAttribute });
  /** Integer-only mode: rejects fractional typing and uses the numeric keypad. Defaults to `false`. */
  readonly integer = input(false, { transform: booleanAttribute });
  /** Renders increment/decrement stepper buttons. Defaults to `false`. */
  readonly steppers = input(false, { transform: booleanAttribute });
  /** Unit suffix rendered after the value, e.g. `seconds`, `ms`, `%`. Defaults to `null`. */
  readonly suffix = input<string | null>(null);
  /** Placeholder text for the field. Defaults to `null`. */
  readonly placeholder = input<string | null>(null);
  /** `id` of the text field. Defaults to a generated unique id. */
  readonly inputId = input<string>(`hell-number-input-${++nextNumberInputId}-field`);
  /** `name` attribute of the text field. Defaults to `null`. */
  readonly name = input<string | null>(null);
  /** Accessible label for the field. Defaults to `null`. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  /** `aria-describedby` reference for the field. Defaults to `null`. */
  readonly ariaDescribedby = input<string | null>(null, { alias: 'aria-describedby' });
  /** `aria-labelledby` reference for the field. Defaults to `null`. */
  readonly ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });

  /** Emits when the committed numeric value changes. */
  readonly valueChange = output<number | null>();

  private readonly numberAdapter = inject(HELL_NUMBER_INPUT_ADAPTER);
  /** Resolved accessibility labels for the stepper buttons. */
  protected readonly labels = inject(HELL_NUMBER_INPUT_LABELS);
  private readonly destroyRef = inject(DestroyRef);

  private readonly controlMode = signal(false);
  private readonly controlValue = signal<number | null>(null);
  private readonly controlDisabled = signal(false);
  private onControlChange: (value: number | null) => void = () => {};
  private onControlTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  private holdTimeout: ReturnType<typeof setTimeout> | null = null;
  private holdInterval: ReturnType<typeof setInterval> | null = null;

  private readonly valueState = new HellTypedValueInputState<number, number | null>({
    external: () => this.effectiveValue(),
    parseExternal: (value) => this.normalizeValue(value),
    parseText: (text) => this.numberAdapter.parseText(text, this.context()),
    format: (value) => this.formatValue(value),
    externalChanged: (base, current) => !this.sameValue(base, current),
  });

  /** Current committed numeric value, or null. */
  protected readonly current: Signal<number | null> = this.valueState.current;
  /** Text shown in the field for the current value or draft. */
  protected readonly display = this.valueState.display;
  /** Whether the current draft text is unparseable. */
  protected readonly invalidDraft = this.valueState.invalidDraft;

  /** Whether the committed value is outside `min` / `max`. */
  protected readonly outOfRange = computed(() => this.rangeError(this.current()) !== null);
  /** Whether a required value is missing. */
  protected readonly requiredMissing = computed(
    () => this.required() && this.current() === null && !this.invalidDraft(),
  );
  /** Whether the control is in an invalid state. */
  protected readonly isInvalid = () =>
    this.invalid() ||
    this.invalidDraft() ||
    this.outOfRange() ||
    this.requiredMissing() ||
    this.formField.invalid() === true;
  /** Whether the control is disabled by input or form state. */
  protected readonly isDisabled = () => this.disabled() || this.controlDisabled();

  /** `aria-valuetext` combining the current value with its unit suffix. */
  protected readonly valueText = computed<string | null>(() => {
    const unit = this.suffix();
    const currentValue = this.current();
    if (!unit || currentValue === null) return null;
    return `${this.formatValue(currentValue)} ${unit}`;
  });

  /** `aria-describedby` value from ancestor form field descriptions. */
  protected readonly fieldAriaDescribedby = computed(
    () => this.formField.descriptions().join(' ') || null,
  );
  /** `aria-labelledby` value from ancestor form field labels. */
  protected readonly fieldAriaLabelledby = computed(
    () => this.formField.labels().join(' ') || null,
  );

  /** Whether the increment stepper is disabled at the upper bound. */
  protected readonly isIncrementDisabled = computed(() => {
    if (this.isDisabled()) return true;
    const max = this.max();
    const currentValue = this.current();
    return max !== null && currentValue !== null && currentValue >= max;
  });
  /** Whether the decrement stepper is disabled at the lower bound. */
  protected readonly isDecrementDisabled = computed(() => {
    if (this.isDisabled()) return true;
    const min = this.min();
    const currentValue = this.current();
    return min !== null && currentValue !== null && currentValue <= min;
  });

  private readonly inheritedFormField = injectFormFieldState({ optional: true, skipSelf: true });
  private readonly formField =
    this.inheritedFormField() ??
    ngpFormField({ ngControl: signal<NgControl | undefined>(undefined) });
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  constructor() {
    hellSyncFormFieldDescriptions(this.formField, this.ariaDescribedby);
    hellSyncFormFieldLabels(this.formField, this.ariaLabelledby);
    effect(() => {
      this.invalidDraft();
      this.current();
      this.min();
      this.max();
      this.required();
      this.onValidatorChange();
    });
    this.destroyRef.onDestroy(() => this.stopHold());
  }

  /** Accessible label for the increment stepper. */
  protected readonly incrementLabel = () => {
    const label = this.ariaLabel();
    return label ? this.labels.incrementFor(label) : this.labels.increment;
  };
  /** Accessible label for the decrement stepper. */
  protected readonly decrementLabel = () => {
    const label = this.ariaLabel();
    return label ? this.labels.decrementFor(label) : this.labels.decrement;
  };

  /** Writes a value from the form model into the control. */
  writeValue(value: number | null): void {
    this.controlMode.set(true);
    this.controlValue.set(this.normalizeValue(value));
    this.valueState.clearDraft();
    this.valueState.clearLocal();
    this.onValidatorChange();
  }

  /** Registers the form model's change callback. */
  registerOnChange(fn: (value: number | null) => void): void {
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

  /** Reports required, malformed, below-min, and above-max as distinct errors. */
  validate(_control: AbstractControl | null): ValidationErrors | null {
    const errors: ValidationErrors = {};

    if (this.invalidDraft()) {
      errors['numberInputMalformed'] = true;
    } else if (this.requiredMissing()) {
      errors['required'] = true;
    }

    const rangeError = this.rangeError(this.current());
    if (rangeError) Object.assign(errors, rangeError);

    return Object.keys(errors).length > 0 ? errors : null;
  }

  /** Records field text as a draft as the user types. */
  protected onInput(value: string): void {
    this.valueState.writeDraft(value);
    this.onValidatorChange();
  }

  /** Commits the pending draft when the field loses focus. */
  protected onBlur(): void {
    const next = this.valueState.commitDraft();
    if (next.committed) this.emitValue(next.value);
    this.onControlTouched();
    this.onValidatorChange();
  }

  /** Handles committing (Enter), stepping (Arrows), and jumping (Home/End). */
  protected onKeydown(event: KeyboardEvent, text: string): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const next = this.valueState.commitText(text);
      if (next.committed) this.emitValue(next.value);
      this.onValidatorChange();
      return;
    }

    if (this.isDisabled()) return;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.stepBy(1, event.shiftKey);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.stepBy(-1, event.shiftKey);
        break;
      case 'PageUp':
        event.preventDefault();
        this.stepBy(1, true);
        break;
      case 'PageDown':
        event.preventDefault();
        this.stepBy(-1, true);
        break;
      case 'Home':
        if (this.min() !== null) {
          event.preventDefault();
          this.jumpTo(this.min() as number);
        }
        break;
      case 'End':
        if (this.max() !== null) {
          event.preventDefault();
          this.jumpTo(this.max() as number);
        }
        break;
      default:
        break;
    }
  }

  /** Ignores wheel scrolling while the field is focused so it never changes the value. */
  protected onWheel(event: WheelEvent): void {
    const element = this.field().nativeElement;
    if (element.ownerDocument?.activeElement === element) {
      event.preventDefault();
    }
  }

  /** Starts a step plus hold-to-repeat from a pointer press on a stepper. */
  protected onStepperPointerDown(event: PointerEvent, direction: 1 | -1): void {
    if (typeof event.button === 'number' && event.button !== 0) return;
    // Keep focus on the text field so keyboard stepping stays available.
    event.preventDefault();
    this.startHold(direction, event.shiftKey);
  }

  /** Steps once when a stepper button is activated by keyboard. */
  protected onStepperKeydown(event: KeyboardEvent, direction: 1 | -1): void {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;
    event.preventDefault();
    this.stepBy(direction, event.shiftKey);
  }

  /** Stops any in-progress hold-to-repeat timers. */
  protected stopHold(): void {
    if (this.holdTimeout !== null) {
      clearTimeout(this.holdTimeout);
      this.holdTimeout = null;
    }
    if (this.holdInterval !== null) {
      clearInterval(this.holdInterval);
      this.holdInterval = null;
    }
  }

  private startHold(direction: 1 | -1, large: boolean): void {
    if (this.isDisabled()) return;
    this.stepBy(direction, large);
    this.stopHold();
    this.holdTimeout = setTimeout(() => {
      this.holdInterval = setInterval(() => this.stepBy(direction, large), HOLD_REPEAT_MS);
    }, HOLD_DELAY_MS);
  }

  private stepBy(direction: 1 | -1, large: boolean): void {
    if (this.isDisabled()) return;
    // Commit any pending typed draft first so we step from what the user typed,
    // not the stale committed value it shadows.
    this.commitPendingDraft();
    const stepSize = large ? this.step() * this.stepMultiplier() : this.step();
    const currentValue = this.current();
    const base = currentValue ?? this.stepAnchor();
    const raw = currentValue === null ? base : base + direction * stepSize;
    this.jumpTo(raw);
  }

  private jumpTo(target: number): void {
    // Home/End reach this directly, so commit a pending draft here too.
    this.commitPendingDraft();
    const next = this.roundToStep(this.clamp(target));
    const previous = this.current();
    const result = this.valueState.setValue(next);
    if (result.committed && next !== previous) this.emitValue(result.value);
    this.onControlTouched();
    this.onValidatorChange();
  }

  /** Commits the pending draft through the same path Enter uses, if one exists. */
  private commitPendingDraft(): void {
    const result = this.valueState.commitDraft();
    if (result.committed) this.emitValue(result.value);
  }

  private stepAnchor(): number {
    return this.clamp(this.min() ?? 0);
  }

  private clamp(value: number): number {
    const min = this.min();
    const max = this.max();
    let next = value;
    if (min !== null) next = Math.max(next, min);
    if (max !== null) next = Math.min(next, max);
    return next;
  }

  private roundToStep(value: number): number {
    if (this.integer()) return Math.round(value);
    const decimals = this.decimalsOf(this.step());
    return decimals > 0 ? Number(value.toFixed(decimals)) : value;
  }

  private decimalsOf(step: number): number {
    const text = String(step);
    const dot = text.indexOf('.');
    return dot < 0 ? 0 : text.length - dot - 1;
  }

  private rangeError(value: number | null): ValidationErrors | null {
    if (value === null) return null;
    const min = this.min();
    const max = this.max();
    if (min !== null && value < min) return { min: { min, actual: value } };
    if (max !== null && value > max) return { max: { max, actual: value } };
    return null;
  }

  private context(): HellNumberInputAdapterContext {
    return { integer: this.integer() };
  }

  private effectiveValue(): number | null {
    return this.controlMode() ? this.controlValue() : this.value();
  }

  private formatValue(value: number | null): string {
    return this.numberAdapter.format(value, this.context());
  }

  private normalizeValue(value: number | null | undefined): number | null {
    const context = this.context();
    return this.numberAdapter.normalize
      ? this.numberAdapter.normalize(value, context)
      : hellNormalizeNumberInputValue(value, context);
  }

  private sameValue(a: number | null, b: number | null): boolean {
    return this.numberAdapter.isSameValue?.(a, b) ?? hellSameNumberInputValue(a, b);
  }

  private emitValue(value: number | null): void {
    if (this.controlMode()) this.controlValue.set(value);
    this.valueChange.emit(value);
    this.onControlChange(value);
    this.onValidatorChange();
  }
}
