import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  booleanAttribute,
  effect,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { type FormCheckboxControl } from '@angular/forms/signals';
import { ngpCheckbox } from 'ng-primitives/checkbox';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';

/** Public parts of the HellCheckbox module, styleable through its Part Style Map. */
export type HellCheckboxPart = 'root' | 'indicator';
/** Part Style Map accepted by the HellCheckbox `ui` input. */
export type HellCheckboxUi = HellUi<HellCheckboxPart>;

const HELL_CHECKBOX_RECIPE = {
  root: 'inline-flex size-hell-5 cursor-pointer appearance-none items-center justify-center rounded-hell-sm border border-solid border-hell-border-strong bg-hell-surface-elevated p-0 m-0 font-[family-name:inherit] text-hell-primary-foreground transition-[background-color,border-color] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] data-hover:border-hell-primary data-focus-visible:outline-2 data-focus-visible:outline-hell-focus-ring data-focus-visible:outline-offset-2 data-checked:border-hell-primary data-checked:bg-hell-primary data-indeterminate:border-hell-primary data-indeterminate:bg-hell-primary data-disabled:cursor-not-allowed data-disabled:opacity-50',
  indicator: 'block size-hell-4 translate-y-[-0.5px]',
} satisfies HellRecipe<HellCheckboxPart>;

const HELL_NATIVE_CHECKBOX_RECIPE = {
  root: 'relative inline-flex size-hell-5 cursor-pointer appearance-none items-center justify-center rounded-hell-sm border border-solid border-hell-border-strong bg-hell-surface-elevated p-0 m-0 font-[family-name:inherit] text-hell-foreground transition-[background-color,border-color] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] checked:border-hell-primary checked:bg-hell-primary checked:text-hell-primary-foreground indeterminate:border-hell-primary indeterminate:bg-hell-primary indeterminate:text-hell-primary-foreground data-[indeterminate]:border-hell-primary data-[indeterminate]:bg-hell-primary data-[indeterminate]:text-hell-primary-foreground focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
} satisfies HellRecipe<'root'>;

/**
 * Styled checkbox built on `ngpCheckbox`. The `checked` model is the
 * checkbox's one Control Value Authority: bind it one-way (`[checked]` plus
 * `(checkedChange)`), two-way (`[(checked)]`), or through Angular forms —
 * Signal Forms `[formField]` via the `FormCheckboxControl` contract, and
 * `formControl`/`ngModel` via Angular's built-in Signal Forms
 * interoperability.
 *
 * `button[hellCheckbox]` is a custom ARIA checkbox widget, not a native
 * `<input type="checkbox">`. It remains useful for styled, compact controls
 * but does not provide all native checkbox form semantics. For native input
 * behavior (including built-in form constraints and input semantics), use
 * `input[hellNativeCheckbox]`.
 */
@Component({
  selector: 'button[hellCheckbox]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    type: 'button',
    '[class]': "part('root')",
    'data-slot': 'root',
    '(blur)': 'markControlTouched()',
    '[attr.required]': 'required() ? "" : null',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.data-required]': 'required() ? "true" : null',
  },
  template: `
    @if (state.indeterminate()) {
      <svg
        data-slot="indicator"
        [class]="part('indicator')"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        aria-hidden="true"
      >
        <path d="M3 8h10" />
      </svg>
    } @else if (state.checked()) {
      <svg
        data-slot="indicator"
        [class]="part('indicator')"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        aria-hidden="true"
      >
        <path d="M3 8l3.2 3.2L13 4.5" />
      </svg>
    }
  `,
})
export class HellCheckbox implements FormCheckboxControl {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellCheckboxPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellCheckboxPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_CHECKBOX_RECIPE,
  });

  /**
   * Committed checked state — the one Control Value Authority. User toggles
   * write it exactly once per interaction and emit `(checkedChange)`;
   * external property, two-way, and form writes flow in without re-emitting.
   * Expects a `boolean` binding (no static-attribute coercion). Defaults to
   * `false`.
   */
  readonly checked = model(false);
  /** Whether the checkbox is in the indeterminate (mixed) state. Defaults to `false`. */
  readonly indeterminate = input(false, { transform: booleanAttribute });
  /** Whether the checkbox is disabled. Also driven by bound forms. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Whether the checkbox is marked required for assistive technology.
   * Reflected as `required`/`aria-required`/`data-required`; also driven by a
   * bound Signal Forms field's `required()` metadata. Required policy itself
   * belongs to the form (`required()` schema rule or
   * `Validators.requiredTrue`). Defaults to `false`.
   */
  readonly required = input(false, { transform: booleanAttribute });

  /** Emits the new indeterminate state whenever it changes. */
  readonly indeterminateChange = output<boolean>();
  /**
   * Emits when focus leaves the checkbox. Angular forms listen to this
   * output to mark the bound field or control as touched.
   */
  readonly touch = output<void>();

  /** Headless checkbox state and behavior from `ngpCheckbox`. */
  protected readonly state = ngpCheckbox({
    checked: this.checked,
    indeterminate: this.indeterminate,
    disabled: this.disabled,
    onCheckedChange: (checked) => this.checked.set(checked),
    onIndeterminateChange: (indeterminate) => this.indeterminateChange.emit(indeterminate),
  });

  /** Emits the `touch` output that marks the checkbox as touched for Angular forms. */
  protected markControlTouched(): void {
    this.touch.emit();
  }
}

/**
 * Native checkbox variant that leans on browser + Angular form semantics instead of
 * ng-primitives + custom wiring.
 */
@Directive({
  selector: 'input[type="checkbox"][hellNativeCheckbox]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.type]': '"checkbox"',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.data-indeterminate]': 'indeterminate() ? "" : null',
    '(change)': 'onChange()',
    '[attr.data-required]': 'required() ? "true" : null',
    '[attr.required]': 'required() ? "" : null',
  },
})
export class HellNativeCheckbox {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_NATIVE_CHECKBOX_RECIPE,
  });

  /** Whether the checkbox must be checked for form validity. Defaults to `false`. */
  readonly required = input(false, { alias: 'required', transform: booleanAttribute });
  /** Whether the checkbox is in the indeterminate (mixed) state. Defaults to `false`. */
  readonly indeterminate = input(false, { alias: 'indeterminate', transform: booleanAttribute });

  /** Emits the native checked state whenever the checkbox changes. */
  readonly checkedChange = output<boolean>();
  /** Emits the native indeterminate state whenever the checkbox changes. */
  readonly indeterminateChange = output<boolean>();

  private readonly host = inject(ElementRef<HTMLInputElement>);

  constructor() {
    effect(() => {
      this.host.nativeElement.indeterminate = this.indeterminate();
    });
  }

  /** Relays the native input's checked and indeterminate state on `change`. */
  protected onChange(): void {
    this.checkedChange.emit(this.host.nativeElement.checked);
    this.indeterminateChange.emit(this.host.nativeElement.indeterminate);
  }
}
