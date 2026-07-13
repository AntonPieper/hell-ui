import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  booleanAttribute,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgpSwitchThumb, ngpSwitch, provideSwitchState } from 'ng-primitives/switch';
import { HellControlledValueState } from '@hell-ui/angular/internal/core';
import { HellControlValueAccessorBridge } from '@hell-ui/angular/internal/core';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';

let nextSwitchId = 0;

/** Public parts of the HellSwitch module, styleable through its Part Style Map. */
export type HellSwitchPart = 'root' | 'thumb';
/** Part Style Map accepted by the HellSwitch `ui` input. */
export type HellSwitchUi = HellUi<HellSwitchPart>;

const HELL_SWITCH_RECIPE = {
  root: 'relative inline-block h-hell-6 w-[36px] cursor-pointer appearance-none rounded-hell-pill border-0 bg-hell-border-strong p-0 m-0 align-middle font-[inherit] text-[inherit] transition-[background-color] duration-[var(--hell-duration-base)] ease-[var(--ease-hell-out)] data-checked:bg-hell-primary data-focus-visible:outline-2 data-focus-visible:outline-hell-focus-ring data-focus-visible:outline-offset-2 data-disabled:cursor-not-allowed data-disabled:opacity-50',
  thumb:
    'absolute top-1/2 size-hell-5 rounded-hell-pill bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-[left,transform] duration-[var(--hell-duration-base)] ease-[var(--ease-hell-out)]',
} satisfies HellRecipe<HellSwitchPart>;

const HELL_NATIVE_SWITCH_RECIPE = {
  root: 'relative inline-block h-hell-6 w-[36px] cursor-pointer appearance-none rounded-hell-pill border-0 bg-hell-border-strong p-0 m-0 align-middle font-[inherit] text-[inherit] transition-[background-color] duration-[var(--hell-duration-base)] ease-[var(--ease-hell-out)] checked:bg-hell-primary focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
} satisfies HellRecipe<'root'>;

/**
 * Styled switch built on `ngpSwitch`. Use for binary on/off settings where the
 * action is applied immediately (vs. checkbox which is committed on submit).
 *
 * The host is a real `<button>` so it is natively labelable — wrap it in a
 * `<label>` (or use it inside `hellField`) and label clicks toggle the
 * switch without any combination-aware wiring on our side. It also implements
 * `ControlValueAccessor` for Angular Forms.
 */
@Component({
  selector: 'button[hellSwitch]',
  imports: [NgpSwitchThumb],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    provideSwitchState(),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HellSwitch),
      multi: true,
    },
  ],
  host: {
    type: 'button',
    '[class]': "part('root')",
    'data-slot': 'root',
    '(blur)': 'markControlTouched()',
  },
  template: `<span ngpSwitchThumb data-slot="thumb" [class]="part('thumb')"></span>`,
})
export class HellSwitch implements ControlValueAccessor {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellSwitchPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellSwitchPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SWITCH_RECIPE,
  });

  /** Controlled checked state. Defaults to `false`. */
  readonly checked = input(false, { transform: booleanAttribute });
  /** Disables toggling the switch. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Emits the new checked state whenever the switch is toggled. */
  readonly checkedChange = output<boolean>();

  private readonly controlledChecked = new HellControlledValueState<boolean>({
    externalValue: this.checked,
    externalDisabled: this.disabled,
    initialValue: false,
  });
  private readonly valueAccessor = new HellControlValueAccessorBridge<boolean>();
  private readonly host = inject<ElementRef<HTMLButtonElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly switchId = signal(
    this.host.nativeElement.getAttribute('id') ?? `hell-switch-${nextSwitchId++}`,
  );

  private readonly effectiveChecked = this.controlledChecked.value;
  private readonly effectiveDisabled = this.controlledChecked.disabled;

  /** ng-primitives switch state driving checked/disabled and toggle behavior. */
  protected readonly state = ngpSwitch({
    id: this.switchId,
    checked: this.effectiveChecked,
    disabled: this.effectiveDisabled,
    onCheckedChange: (checked) => {
      this.controlledChecked.acceptUserValue(checked);
      this.checkedChange.emit(checked);
      this.valueAccessor.emitValue(checked);
    },
  });
  private readonly installSpaceKeyHandler = this.registerSpaceKeyHandler();

  /** Applies a form-driven value to the switch. */
  writeValue(value: boolean): void {
    this.controlledChecked.writeValue(value === true);
  }

  /** Registers the callback invoked when the switch value changes. */
  registerOnChange(fn: (value: boolean) => void): void {
    this.valueAccessor.registerOnChange(fn);
  }

  /** Registers the callback invoked when the switch is touched. */
  registerOnTouched(fn: () => void): void {
    this.valueAccessor.registerOnTouched(fn);
  }

  /** Applies a form-driven disabled state to the switch. */
  setDisabledState(isDisabled: boolean): void {
    this.controlledChecked.setDisabledState(isDisabled);
  }

  /** Notifies the form control that the switch has been touched. */
  protected markControlTouched(): void {
    this.valueAccessor.markTouched();
  }

  private onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || !this.isSpaceKey(event.key)) return;

    event.preventDefault();
    if (this.effectiveDisabled()) return;

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
