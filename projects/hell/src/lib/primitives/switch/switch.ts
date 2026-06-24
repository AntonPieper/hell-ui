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
import { HellControlledValueState } from '../../core/controlled-value-state';
import { HellControlValueAccessorBridge } from '../../core/control-value-accessor';
import { HellStyleable } from '../../core/styleable';

let nextSwitchId = 0;

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
    '[class.hell-switch]': '!unstyled()',
    '(blur)': 'markControlTouched()',
  },
  template: `<span ngpSwitchThumb class="hell-switch-thumb"></span>`,
})
export class HellSwitch extends HellStyleable implements ControlValueAccessor {
  readonly checked = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly checkedChange = output<boolean>();

  private readonly controlledChecked = new HellControlledValueState<boolean>({
    externalValue: this.checked,
    externalDisabled: this.disabled,
    initialValue: false,
  });
  private readonly cva = new HellControlValueAccessorBridge<boolean>();
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
      this.cva.emitValue(checked);
    },
  });
  private readonly installSpaceKeyHandler = this.registerSpaceKeyHandler();

  writeValue(value: boolean): void {
    this.controlledChecked.writeValue(value === true);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.cva.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.cva.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlledChecked.setDisabledState(isDisabled);
  }

  protected markControlTouched(): void {
    this.cva.markTouched();
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
    '[class.hell-switch]': '!unstyled()',
    '[attr.type]': '"checkbox"',
    '[attr.role]': '"switch"',
    '[attr.required]': 'required() ? "" : null',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.data-required]': 'required() ? "true" : null',
    '(change)': 'onChange()',
  },
})
export class HellNativeSwitch extends HellStyleable {
  readonly required = input(false, { alias: 'required', transform: booleanAttribute });

  readonly checkedChange = output<boolean>();

  private readonly host = inject(ElementRef<HTMLInputElement>);

  protected onChange(): void {
    this.checkedChange.emit(this.host.nativeElement.checked);
  }
}
