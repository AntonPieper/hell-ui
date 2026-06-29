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
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';

let nextSwitchId = 0;

export type HellSwitchPart = 'root' | 'thumb';
export type HellSwitchUi = HellUi<HellSwitchPart>;

export type HellNativeSwitchPart = 'root';
export type HellNativeSwitchUi = HellUi<HellNativeSwitchPart>;

const HELL_SWITCH_RECIPE = {
  root: 'relative inline-block h-hell-6 w-[36px] cursor-pointer appearance-none rounded-hell-pill border-0 bg-hell-border-strong p-0 m-0 align-middle font-[inherit] text-[inherit] transition-[background-color] duration-[var(--hell-duration-base)] ease-[var(--ease-hell-out)] data-checked:bg-hell-primary data-focus-visible:outline-2 data-focus-visible:outline-hell-focus-ring data-focus-visible:outline-offset-2 data-disabled:cursor-not-allowed data-disabled:opacity-50',
  thumb:
    'absolute left-[2px] top-1/2 size-hell-5 -translate-y-1/2 rounded-hell-pill bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-[left,right] duration-[var(--hell-duration-base)] ease-[var(--ease-hell-out)]',
} satisfies HellRecipe<HellSwitchPart>;

const HELL_NATIVE_SWITCH_RECIPE = {
  root: 'relative inline-block h-hell-6 w-[36px] cursor-pointer appearance-none rounded-hell-pill border-0 bg-hell-border-strong p-0 m-0 align-middle font-[inherit] text-[inherit] transition-[background-color] duration-[var(--hell-duration-base)] ease-[var(--ease-hell-out)] checked:bg-hell-primary focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
} satisfies HellRecipe<HellNativeSwitchPart>;

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
export class HellSwitch extends HellPartStyleable<HellSwitchPart> implements ControlValueAccessor {
  protected readonly recipe = HELL_SWITCH_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly checked = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

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

  writeValue(value: boolean): void {
    this.controlledChecked.writeValue(value === true);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.valueAccessor.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.valueAccessor.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlledChecked.setDisabledState(isDisabled);
  }

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
export class HellNativeSwitch extends HellPartStyleable<HellNativeSwitchPart> {
  protected readonly recipe = HELL_NATIVE_SWITCH_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly required = input(false, { alias: 'required', transform: booleanAttribute });

  readonly checkedChange = output<boolean>();

  private readonly host = inject(ElementRef<HTMLInputElement>);

  protected onChange(): void {
    this.checkedChange.emit(this.host.nativeElement.checked);
  }
}
