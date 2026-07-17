import {
  DestroyRef,
  Directive,
  ElementRef,
  InjectionToken,
  Renderer2,
  afterEveryRender,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  numberAttribute,
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
  hellCreateLabels,
  hellInvalidTypedValue,
  hellPartStyler,
  hellTypedValue,
  type HellRecipe,
  type HellTypedInputAdapter,
  type HellTypedValueParseResult,
  type HellUiInput,
} from '@hell-ui/angular/core';
import { HellInput } from '@hell-ui/angular/input';
import {
  HellTypedValueInputState,
  hellSyncFormFieldDescriptions,
  hellSyncFormFieldLabels,
  hellUniqueIdRefs,
} from '@hell-ui/angular/internal/core';

/** Built-in accessibility labels owned by the Number Input entry point. */
export interface HellNumberInputLabels {
  /** Accessible label for an increment step without a named target. */
  readonly increment: string;
  /** Accessible label for a decrement step without a named target. */
  readonly decrement: string;
  /** Accessible label for an increment step targeting a named input. */
  readonly incrementFor: (label: string) => string;
  /** Accessible label for a decrement step targeting a named input. */
  readonly decrementFor: (label: string) => string;
}

/** Injection token resolving to the effective Number Input labels. */
export const HELL_NUMBER_INPUT_LABELS: InjectionToken<HellNumberInputLabels> =
  hellCreateLabels<HellNumberInputLabels>('HELL_NUMBER_INPUT_LABELS', {
    increment: 'Increase value',
    decrement: 'Decrease value',
    incrementFor: (label) => `Increase ${label}`,
    decrementFor: (label) => `Decrease ${label}`,
  });

/** Contextual flags passed to adapter parse and format hooks. */
export interface HellNumberInputAdapterContext {
  /** Whether the field accepts integers only. */
  readonly integer: boolean;
}

/** Strategy for parsing, formatting, normalizing, and comparing numeric values. */
export type HellNumberInputAdapter = HellTypedInputAdapter<
  number,
  HellNumberInputAdapterContext
>;

const INTEGER_PATTERN = /^[+-]?\d+$/;
const DECIMAL_PATTERN = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;

function hellParseNumberInputText(
  text: string,
  context: HellNumberInputAdapterContext,
): HellTypedValueParseResult<number> {
  const trimmed = text.trim();
  if (!trimmed) return hellTypedValue<number>(null);

  const pattern = context.integer ? INTEGER_PATTERN : DECIMAL_PATTERN;
  if (!pattern.test(trimmed)) return hellInvalidTypedValue();

  const value = Number(trimmed);
  return Number.isFinite(value) ? hellTypedValue(value) : hellInvalidTypedValue();
}

function hellFormatNumberInputValue(
  value: number | null,
  _context: HellNumberInputAdapterContext,
): string {
  return value === null || !Number.isFinite(value) ? '' : String(value);
}

function hellNormalizeNumberInputValue(
  value: number | null | undefined,
  _context: HellNumberInputAdapterContext,
): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function hellSameNumberInputValue(left: number | null, right: number | null): boolean {
  return left === right;
}

/** Default adapter for plain signed decimal text and nullable clears. */
export const HELL_DEFAULT_NUMBER_INPUT_ADAPTER: HellNumberInputAdapter = {
  parseText: hellParseNumberInputText,
  format: hellFormatNumberInputValue,
  normalize: hellNormalizeNumberInputValue,
  isSameValue: hellSameNumberInputValue,
};

/** Injection token resolving to the effective Number Input adapter. */
export const HELL_NUMBER_INPUT_ADAPTER = new InjectionToken<HellNumberInputAdapter>(
  'HELL_NUMBER_INPUT_ADAPTER',
  { factory: () => HELL_DEFAULT_NUMBER_INPUT_ADAPTER },
);

/** Override the Number Input adapter for an injector scope. */
export function provideHellNumberInputAdapter(adapter: HellNumberInputAdapter): Provider {
  return { provide: HELL_NUMBER_INPUT_ADAPTER, useValue: adapter };
}

/** Direction selected by a Number Step button. */
export type HellNumberStepDirection = 'increment' | 'decrement';

interface HellNumberInputStepController {
  readonly isDisabled: (direction: HellNumberStepDirection) => boolean;
  readonly apply: (direction: HellNumberStepDirection, multiplied: boolean) => void;
  readonly focus: () => void;
  readonly label: (direction: HellNumberStepDirection) => string;
}

const NUMBER_INPUT_STEP_CONTROLLERS = new WeakMap<
  HellNumberInput,
  HellNumberInputStepController
>();

function numberInputStepController(target: HellNumberInput): HellNumberInputStepController {
  const controller = NUMBER_INPUT_STEP_CONTROLLERS.get(target);
  if (!controller) throw new Error('Number Step target is not an active HellNumberInput.');
  return controller;
}

const HELL_NUMBER_STEP_RECIPE = {
  root: 'inline-flex min-w-hell-control-sm flex-none cursor-pointer select-none items-center justify-center border-0 border-s border-hell-border bg-transparent px-hell-2 font-[inherit] font-medium text-hell-foreground-muted transition-[background-color,color] duration-[var(--hell-duration-fast)] ease-hell-out hover:bg-hell-surface-muted hover:text-hell-foreground focus-visible:relative focus-visible:z-[1] focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-[-2px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40',
} satisfies HellRecipe<'root'>;

let nextNumberInputId = 0;

/**
 * Numeric parsing, validation, stepping, and forms behavior for a real input.
 * Step buttons and suffix content compose separately through consumer markup.
 */
@Directive({
  selector: 'input[hellNumberInput]',
  exportAs: 'hellNumberInput',
  hostDirectives: [{ directive: HellInput, inputs: ['size', 'ui'] }],
  providers: [
    provideFormFieldState({ inherit: false }),
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
    type: 'text',
    role: 'spinbutton',
    '[attr.id]': 'id()',
    '[value]': 'display()',
    '[disabled]': 'isDisabled()',
    '[required]': 'required()',
    '[attr.inputmode]': 'integer() ? "numeric" : "decimal"',
    '[attr.aria-valuenow]': 'current()',
    '[attr.aria-valuemin]': 'min()',
    '[attr.aria-valuemax]': 'max()',
    '[attr.aria-invalid]': 'isInvalid() ? "true" : null',
    '[attr.aria-describedby]': 'fieldAriaDescribedby()',
    '[attr.aria-labelledby]': 'fieldAriaLabelledby()',
    '[attr.data-invalid]': 'isInvalid() ? "true" : null',
    '[attr.data-disabled]': 'isDisabled() ? "true" : null',
    '[attr.data-required]': 'required() ? "true" : null',
    '[attr.data-integer]': 'integer() ? "true" : null',
    '(input)': 'onInput()',
    '(blur)': 'onBlur()',
    '(keydown)': 'onKeydown($event)',
    '(wheel)': 'onWheel($event)',
  },
})
export class HellNumberInput implements ControlValueAccessor, Validator {
  /** Native input id, generated when the consumer does not author one. */
  readonly id = input(`hell-number-input-${++nextNumberInputId}`);
  /** Forces invalid presentation and accessibility state. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Disables native interaction outside forms use. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Marks a nullable clear as a required-value validation error. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Current controlled numeric value. */
  readonly value = input<number | null>(null);
  /** Inclusive lower bound for validation and stepping. */
  readonly min = input<number | null>(null);
  /** Inclusive upper bound for validation and stepping. */
  readonly max = input<number | null>(null);
  /** Amount applied by one arrow or Number Step activation. */
  readonly step = input(1, { transform: numberAttribute });
  /** Multiplier applied by Shift+Arrow and PageUp/PageDown. */
  readonly stepMultiplier = input(10, { transform: numberAttribute });
  /** Rejects fractional drafts and uses numeric input-mode metadata. */
  readonly integer = input(false, { transform: booleanAttribute });
  /** Additional `aria-describedby` ids merged with an enclosing Field. */
  readonly ariaDescribedby = input<string | null>(null, { alias: 'aria-describedby' });
  /** Additional `aria-labelledby` ids merged with an enclosing Field. */
  readonly ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });

  /** Emits each successfully committed number or nullable clear. */
  readonly valueChange = output<number | null>();

  private readonly host = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);
  private readonly adapter = inject(HELL_NUMBER_INPUT_ADAPTER);
  private readonly labels = inject(HELL_NUMBER_INPUT_LABELS);
  private readonly inputState = injectInputState();
  private readonly inheritedFormField = injectFormFieldState({
    optional: true,
    skipSelf: true,
  });
  private readonly formField = ngpFormField({
    ngControl: signal<NgControl | undefined>(undefined),
  });

  private readonly controlMode = signal(false);
  private readonly controlValue = signal<number | null>(null);
  private readonly controlDisabled = signal(false);
  private onControlChange: (value: number | null) => void = () => {};
  private onControlTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};
  private hasExternalSnapshot = false;
  private externalSnapshot: number | null = null;
  private readonly accessibleNameSnapshot = signal<string | null>(null);

  private readonly valueState = new HellTypedValueInputState<number, number | null>({
    external: () => this.effectiveValue(),
    parseExternal: (value) => this.normalizeValue(value),
    parseText: (text) => this.adapter.parseText(text, this.context()),
    format: (value) => this.adapter.format(value, this.context()),
    externalChanged: (base, current) => !this.sameValue(base, current),
  });

  /** Current committed numeric value. */
  protected readonly current: Signal<number | null> = this.valueState.current;
  /** Native text for either the active draft or committed value. */
  protected readonly display = this.valueState.display;
  /** Whether the active draft is malformed. */
  protected readonly invalidDraft = this.valueState.invalidDraft;
  /** Whether the committed value falls outside current bounds. */
  protected readonly outOfRange = computed(() => this.rangeError(this.current()) !== null);
  /** Whether a required number is missing. */
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
  /** Effective description ids from native attributes and an enclosing Field. */
  protected readonly fieldAriaDescribedby = computed(() =>
    this.mergeIdRefs(this.ariaDescribedby(), this.inheritedFormField()?.descriptions()),
  );
  /** Effective label ids from native attributes and an enclosing Field. */
  protected readonly fieldAriaLabelledby = computed(() =>
    this.mergeIdRefs(this.ariaLabelledby(), this.inheritedFormField()?.labels()),
  );

  constructor() {
    NUMBER_INPUT_STEP_CONTROLLERS.set(this, {
      isDisabled: (direction) => this.isStepDisabled(direction),
      apply: (direction, multiplied) => this.applyStep(direction, multiplied),
      focus: () => this.host.focus(),
      label: (direction) => this.stepLabel(direction),
    });

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
      this.integer();
      this.onValidatorChange();
    });

    afterEveryRender(() => {
      // The composed Input primitive and authored attributes also settle after
      // host bindings. Number Input owns the public id and needs a text field so
      // invalid drafts are never sanitized by native number-input behavior.
      const id = this.id();
      if (this.host.id !== id) this.renderer.setAttribute(this.host, 'id', id);
      if (this.host.type !== 'text') this.renderer.setAttribute(this.host, 'type', 'text');
      const accessibleName = this.readAccessibleName();
      if (this.accessibleNameSnapshot() !== accessibleName) {
        this.accessibleNameSnapshot.set(accessibleName);
      }
    });
  }

  /** Writes a number from Angular forms without emitting it back. */
  writeValue(value: number | null): void {
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
  registerOnChange(fn: (value: number | null) => void): void {
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
    if (this.invalidDraft()) errors['numberInputMalformed'] = true;
    else if (this.requiredMissing()) errors['required'] = true;

    const rangeError = this.rangeError(this.current());
    if (rangeError) Object.assign(errors, rangeError);
    return Object.keys(errors).length > 0 ? errors : null;
  }

  private isStepDisabled(direction: HellNumberStepDirection): boolean {
    if (this.isDisabled()) return true;
    const candidate = this.stepCandidate();
    if (candidate === null) return false;
    return direction === 'increment'
      ? this.max() !== null && candidate >= (this.max() as number)
      : this.min() !== null && candidate <= (this.min() as number);
  }

  private applyStep(direction: HellNumberStepDirection, multiplied = false): void {
    if (this.isStepDisabled(direction)) return;
    this.commitPendingDraft();

    const directionValue = direction === 'increment' ? 1 : -1;
    const amount =
      this.step() * (multiplied ? this.stepMultiplier() : 1);
    const current = this.current();
    const base = current ?? this.stepAnchor();
    const target = current === null ? base : base + directionValue * amount;
    this.jumpTo(target);
  }

  private stepLabel(direction: HellNumberStepDirection): string {
    const name = this.accessibleNameSnapshot();
    if (direction === 'increment') {
      return name ? this.labels.incrementFor(name) : this.labels.increment;
    }
    return name ? this.labels.decrementFor(name) : this.labels.decrement;
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

  /** Handles commit, arrows, multiplier keys, and bounded Home/End jumps. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      const result = this.valueState.commitText(this.host.value);
      if (result.committed) this.emitValue(result.value);
      this.onValidatorChange();
      return;
    }

    if (this.isDisabled()) return;
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.applyStep('increment', event.shiftKey);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.applyStep('decrement', event.shiftKey);
        break;
      case 'PageUp':
        event.preventDefault();
        this.applyStep('increment', true);
        break;
      case 'PageDown':
        event.preventDefault();
        this.applyStep('decrement', true);
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

  /** Prevents focused-wheel scrolling from changing numeric field behavior. */
  protected onWheel(event: WheelEvent): void {
    if (this.host.ownerDocument?.activeElement === this.host) event.preventDefault();
  }

  private commitPendingDraft(): void {
    const result = this.valueState.commitDraft();
    if (result.committed) this.emitValue(result.value);
  }

  private jumpTo(target: number): void {
    this.commitPendingDraft();
    const next = this.roundToStep(this.clamp(target));
    const previous = this.current();
    const result = this.valueState.setValue(next);
    if (result.committed && next !== previous) this.emitValue(result.value);
    this.onControlTouched();
    this.onValidatorChange();
  }

  private stepAnchor(): number {
    return this.clamp(this.min() ?? 0);
  }

  private stepCandidate(): number | null {
    const parsed = this.adapter.parseText(this.display(), this.context());
    return parsed.valid ? this.normalizeValue(parsed.value) : this.current();
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

  private normalizeValue(value: number | null | undefined): number | null {
    const context = this.context();
    return this.adapter.normalize
      ? this.adapter.normalize(value, context)
      : hellNormalizeNumberInputValue(value, context);
  }

  private sameValue(left: number | null, right: number | null): boolean {
    return this.adapter.isSameValue?.(left, right) ?? hellSameNumberInputValue(left, right);
  }

  private mergeIdRefs(
    explicit: string | null,
    fieldIds: readonly string[] | undefined,
  ): string | null {
    const ids = hellUniqueIdRefs([explicit, ...(fieldIds ?? [])].filter(Boolean).join(' '));
    return ids.join(' ') || null;
  }

  private readAccessibleName(): string | null {
    const ids = this.fieldAriaLabelledby()?.split(/\s+/).filter(Boolean) ?? [];
    const text = ids
      .map((id) => this.elementById(id)?.textContent?.trim() ?? '')
      .filter(Boolean)
      .join(' ')
      .trim();
    if (text) return text;

    const direct = this.host.getAttribute('aria-label')?.trim();
    if (direct) return direct;

    const nativeLabel = Array.from(this.host.labels ?? [])
      .map((label) => label.textContent?.trim() ?? '')
      .filter(Boolean)
      .join(' ')
      .trim();
    return nativeLabel || null;
  }

  private elementById(id: string): Element | null {
    const documentMatch = this.host.ownerDocument.getElementById(id);
    if (documentMatch) return documentMatch;

    // Angular test hosts and embedded roots may be detached from ownerDocument.
    // Search the local ancestor tree without assuming a global document mount.
    let scope: HTMLElement | null = this.host.parentElement;
    while (scope) {
      if (scope.id === id) return scope;
      const localMatch = Array.from(scope.querySelectorAll<HTMLElement>('[id]')).find(
        (candidate) => candidate.id === id,
      );
      if (localMatch) return localMatch;
      scope = scope.parentElement;
    }
    return null;
  }

  private emitValue(value: number | null): void {
    // Native submission may run before Angular renders the committed display.
    this.host.value = this.adapter.format(value, this.context());
    if (this.controlMode()) this.controlValue.set(value);
    this.valueChange.emit(value);
    this.onControlChange(value);
    this.onValidatorChange();
  }
}

const HOLD_DELAY_MS = 400;
const HOLD_REPEAT_MS = 60;

/**
 * One directional button that controls an explicit exported Number Input.
 * Its projected content owns the glyph or copy; the directive owns stepping.
 */
@Directive({
  selector: 'button[hellNumberStep]',
  exportAs: 'hellNumberStep',
  host: {
    '[class]': "part('root')",
    '[attr.type]': 'nativeButtonType()',
    tabindex: '-1',
    'data-slot': 'root',
    '[attr.data-direction]': 'direction()',
    '[attr.data-disabled]': 'isDisabled() ? "true" : null',
    '[attr.disabled]': 'isDisabled() ? "" : null',
    '[attr.aria-label]': 'label()',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'stopHold()',
    '(pointerleave)': 'stopHold()',
    '(pointercancel)': 'stopHold()',
    '(click)': 'onClick($event)',
  },
})
export class HellNumberStep {
  /** Direction applied by this button. */
  readonly direction = input.required<HellNumberStepDirection>({ alias: 'hellNumberStep' });
  /** Explicit Number Input controller targeted by this button. */
  readonly target = input.required<HellNumberInput>({ alias: 'hellNumberStepFor' });
  /** Disables this step independently of its target's state and bounds. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Optional accessible-label override. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  /** Tailwind refinements for this button's single root Public Part. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for the root Public Part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_NUMBER_STEP_RECIPE,
  });
  private readonly controller = computed(() => numberInputStepController(this.target()));
  /** Effective native disabled state from the button, target, or target bounds. */
  protected readonly isDisabled = computed(
    () => this.disabled() || this.controller().isDisabled(this.direction()),
  );
  /** Effective accessible label from an override or the named target. */
  protected readonly label = computed(
    () => this.ariaLabel() ?? this.controller().label(this.direction()),
  );

  private readonly host = inject<ElementRef<HTMLButtonElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private holdTimeout: ReturnType<typeof setTimeout> | null = null;
  private holdInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.stopHold());
  }

  /** Preserves an authored native type and otherwise prevents form submission. */
  protected nativeButtonType(): string {
    return this.host.getAttribute('type') ?? 'button';
  }

  /** Starts an immediate step followed by hold-to-repeat for primary pointers. */
  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || this.isDisabled()) return;
    event.preventDefault();
    this.stopHold();
    this.activate(event.shiftKey);
    this.holdTimeout = setTimeout(() => {
      this.holdInterval = setInterval(() => {
        if (this.isDisabled()) {
          this.stopHold();
          return;
        }
        this.activate(event.shiftKey);
      }, HOLD_REPEAT_MS);
    }, HOLD_DELAY_MS);
  }

  /** Supports keyboard, assistive-technology, and programmatic click activation. */
  protected onClick(event: MouseEvent): void {
    // A pointer activation already stepped on pointerdown so holding can repeat.
    if (event.detail > 0 || this.isDisabled()) return;
    this.activate(event.shiftKey);
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

  private activate(multiplied: boolean): void {
    const controller = this.controller();
    controller.apply(this.direction(), multiplied);
    controller.focus();
  }
}

/** Canonical bulk-import tuple for the Number Input entry point. */
export const HELL_NUMBER_INPUT_IMPORTS = [HellNumberInput, HellNumberStep] as const;
