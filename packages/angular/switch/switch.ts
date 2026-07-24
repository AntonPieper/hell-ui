import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  booleanAttribute,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { type FormCheckboxControl } from '@angular/forms/signals';
import { NgpSwitchThumb, ngpSwitch, provideSwitchState } from 'ng-primitives/switch';
import type { HellUi, HellUiInput } from 'hell-ui/core';
import { hellPartStyler, type HellRecipe } from 'hell-ui/internal/core';

let nextSwitchId = 0;

/** Public parts of the HellSwitch module, styleable through its Part Style Map. */
export type HellSwitchPart = 'root' | 'thumb';
/** Part Style Map accepted by the HellSwitch `ui` input. */
export type HellSwitchUi = HellUi<HellSwitchPart>;

const HELL_SWITCH_RECIPE = {
  root: 'relative inline-block h-hell-6 w-[36px] cursor-pointer appearance-none rounded-hell-pill border-0 bg-hell-border-strong p-0 m-0 align-middle font-[family-name:inherit] text-[inherit] transition-[background-color] duration-[var(--hell-duration-base)] ease-[var(--ease-hell-out)] data-checked:bg-hell-primary data-focus-visible:outline-2 data-focus-visible:outline-hell-focus-ring data-focus-visible:outline-offset-2 data-disabled:cursor-not-allowed data-disabled:opacity-50',
  thumb:
    'absolute top-1/2 size-hell-5 rounded-hell-pill bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-[left,transform] duration-[var(--hell-duration-base)] ease-[var(--ease-hell-out)]',
} satisfies HellRecipe<HellSwitchPart>;

const HELL_NATIVE_SWITCH_RECIPE = {
  root: 'relative inline-block h-hell-6 w-[36px] cursor-pointer appearance-none rounded-hell-pill border-0 bg-hell-border-strong p-0 m-0 align-middle font-[family-name:inherit] text-[inherit] transition-[background-color] duration-[var(--hell-duration-base)] ease-[var(--ease-hell-out)] checked:bg-hell-primary focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
} satisfies HellRecipe<'root'>;

/**
 * Styled switch built on `ngpSwitch`. Use for binary on/off settings where the
 * action is applied immediately (vs. checkbox which is committed on submit).
 *
 * The `checked` model is the switch's one Control Value Authority: bind it
 * one-way (`[checked]` plus `(checkedChange)`), two-way (`[(checked)]`), or
 * through Angular forms — Signal Forms `[formField]` via the
 * `FormCheckboxControl` contract, and `formControl`/`ngModel` via Angular's
 * built-in Signal Forms interoperability.
 *
 * The host is a real `<button>` so it is natively labelable — wrap it in a
 * `<label>` (or use it inside `hellField`) and label clicks toggle the
 * switch without any combination-aware wiring on our side.
 */
@Component({
  selector: 'button[hellSwitch]',
  imports: [NgpSwitchThumb],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideSwitchState()],
  host: {
    type: 'button',
    '[class]': "part('root')",
    'data-slot': 'root',
    '(blur)': 'markControlTouched()',
  },
  template: `<span ngpSwitchThumb data-slot="thumb" [class]="part('thumb')"></span>`,
})
export class HellSwitch implements FormCheckboxControl {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellSwitchPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellSwitchPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SWITCH_RECIPE,
  });

  /**
   * Committed checked state — the one Control Value Authority. User toggles
   * write it exactly once per interaction and emit `(checkedChange)`;
   * external property, two-way, and form writes flow in without re-emitting.
   * Expects a `boolean` binding (no static-attribute coercion). Defaults to
   * `false`.
   */
  readonly checked = model(false);
  /** Disables toggling the switch. Also driven by bound forms. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Emits when focus leaves the switch. Angular forms listen to this output
   * to mark the bound field or control as touched.
   */
  readonly touch = output<void>();

  private readonly host = inject<ElementRef<HTMLButtonElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly switchId = signal(
    this.host.nativeElement.getAttribute('id') ?? `hell-switch-${nextSwitchId++}`,
  );

  /** ng-primitives switch state driving checked/disabled and toggle behavior. */
  protected readonly state = ngpSwitch({
    id: this.switchId,
    checked: this.checked,
    disabled: this.disabled,
    onCheckedChange: (checked) => this.checked.set(checked),
  });
  private readonly installSpaceKeyHandler = this.registerSpaceKeyHandler();

  /** Emits the `touch` output that marks the switch as touched for Angular forms. */
  protected markControlTouched(): void {
    this.touch.emit();
  }

  private onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || !this.isSpaceKey(event.key)) return;

    event.preventDefault();
    if (this.disabled()) return;

    this.state.toggle(event);
  }

  private isSpaceKey(key: string): boolean {
    return key === ' ' || key === 'Space' || key === 'Spacebar';
  }

  private registerSpaceKeyHandler(): true {
    const host = this.host.nativeElement;
    const onKeydown = (event: KeyboardEvent) => this.onKeydown(event);
    host.addEventListener('keydown', onKeydown, { capture: true });
    this.destroyRef.onDestroy(() =>
      host.removeEventListener('keydown', onKeydown, { capture: true }),
    );
    return true;
  }
}

/**
 * Native switch variant that uses browser checkbox semantics and Angular Forms.
 */
@Directive({
  selector: 'input[type="checkbox"][hellNativeSwitch]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.type]': '"checkbox"',
    '[attr.role]': '"switch"',
    '[attr.required]': 'required() ? "" : null',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.data-required]': 'required() ? "true" : null',
    '(change)': 'onChange()',
  },
})
export class HellNativeSwitch {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_NATIVE_SWITCH_RECIPE,
  });

  /** Marks the switch as required for native form validation. Defaults to `false`. */
  readonly required = input(false, { alias: 'required', transform: booleanAttribute });

  /** Emits the new checked state whenever the switch is toggled. */
  readonly checkedChange = output<boolean>();

  private readonly host = inject(ElementRef<HTMLInputElement>);

  /** Emits `checkedChange` with the native checkbox's current checked state. */
  protected onChange(): void {
    this.checkedChange.emit(this.host.nativeElement.checked);
  }
}
