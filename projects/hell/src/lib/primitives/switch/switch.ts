import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgpSwitchThumb, ngpSwitch, provideSwitchState } from 'ng-primitives/switch';
import { HellControlValueAccessorBridge } from '../../core/control-value-accessor';
import { HellStyleable } from '../../core/styleable';

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

  private readonly controlMode = signal(false);
  private readonly controlChecked = signal(false);
  private readonly controlDisabled = signal(false);
  private readonly cva = new HellControlValueAccessorBridge<boolean>();

  private readonly effectiveChecked = computed(() =>
    this.controlMode() ? this.controlChecked() : this.checked(),
  );
  private readonly effectiveDisabled = computed(() => this.disabled() || this.controlDisabled());

  protected readonly state = ngpSwitch({
    checked: this.effectiveChecked,
    disabled: this.effectiveDisabled,
    onCheckedChange: (checked) => {
      if (this.controlMode()) this.controlChecked.set(checked);
      this.checkedChange.emit(checked);
      this.cva.emitValue(checked);
    },
  });

  writeValue(value: boolean): void {
    this.controlMode.set(true);
    this.controlChecked.set(value === true);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.cva.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.cva.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlDisabled.set(isDisabled);
  }

  protected markControlTouched(): void {
    this.cva.markTouched();
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
