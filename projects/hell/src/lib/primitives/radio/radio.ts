import {
  DestroyRef,
  Directive,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  type AbstractControl,
  type ValidationErrors,
  type Validator,
} from '@angular/forms';
import {
  NgpRadioGroup,
  NgpRadioItem,
  NgpRadioIndicator,
  injectRadioGroupState,
} from 'ng-primitives/radio';
import {
  injectRovingFocusGroupState,
  injectRovingFocusItemState,
} from 'ng-primitives/roving-focus';
import {
  writeRadioGroupStateDisabled,
  writeRadioGroupStateValue,
  writeRovingFocusActiveItem,
} from '../adapters/ngp-state-adapters';
import { containsNode } from '../../core/dom';
import { HellControlValueAccessorBridge } from '../../core/control-value-accessor';
import { HellOrientation } from '../../core/types';
import { HellStyleable } from '../../core/styleable';

type HellRadioRovingRegistration = {
  readonly element: HTMLButtonElement;
  readonly checked: () => boolean;
  readonly disabled: () => boolean;
  readonly rovingFocusItemId: () => string;
};

class HellRadioRovingRegistry {
  readonly items = signal<readonly HellRadioRovingRegistration[]>([]);

  register(item: HellRadioRovingRegistration): void {
    this.items.update((items) => [...items, item]);
  }

  unregister(item: HellRadioRovingRegistration): void {
    this.items.update((items) => items.filter((registered) => registered !== item));
  }
}

@Directive({
  selector: '[hellRadioGroup]',
  hostDirectives: [
    {
      directive: NgpRadioGroup,
      inputs: [
        'ngpRadioGroupValue:value',
        'ngpRadioGroupDisabled:disabled',
        'ngpRadioGroupOrientation:orientation',
        'ngpRadioGroupCompareWith:compareWith',
      ],
      outputs: ['ngpRadioGroupValueChange:valueChange'],
    },
  ],
  providers: [
    HellRadioRovingRegistry,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HellRadioGroup),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => HellRadioGroup),
      multi: true,
    },
  ],
  host: {
    '[class.hell-radio-group]': '!unstyled()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.data-required]': 'required() ? "true" : null',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class HellRadioGroup<T = unknown>
  extends HellStyleable
  implements ControlValueAccessor, Validator
{
  readonly orientation = input<HellOrientation>('vertical');
  readonly required = input(false, { transform: booleanAttribute });

  private readonly group = inject(NgpRadioGroup<T>);
  private readonly groupState = injectRadioGroupState<T>();
  private readonly rovingFocusGroupState = injectRovingFocusGroupState();
  private readonly rovingRegistry = inject(HellRadioRovingRegistry);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cva = new HellControlValueAccessorBridge<T | null>();
  private onValidatorChange: () => void = () => {};
  private readonly disabled = computed(() => this.groupState().disabled());

  constructor() {
    super();
    effect(() => {
      this.required();
      this.disabled();
      this.onValidatorChange();
    });

    effect(() => {
      const itemId = this.rovingTabStopItemId();
      const groupState = this.rovingFocusGroupState();
      if (groupState.activeItem() === itemId) return;
      untracked(() => writeRovingFocusActiveItem(groupState, itemId));
    });

    const valueSub = this.group.valueChange.subscribe((value) => {
      this.cva.emitValue(value);
    });
    this.destroyRef.onDestroy(() => valueSub.unsubscribe());

    const host = this.host.nativeElement;
    const onKeydown = (event: KeyboardEvent) => this.onKeydown(event);
    host.addEventListener('keydown', onKeydown, { capture: true });
    this.destroyRef.onDestroy(() =>
      host.removeEventListener('keydown', onKeydown, { capture: true }),
    );
  }

  writeValue(value: T | null): void {
    writeRadioGroupStateValue(this.groupState(), value);
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.cva.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.cva.registerOnTouched(fn);
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    writeRadioGroupStateDisabled(this.groupState(), isDisabled);
    this.onValidatorChange();
  }

  validate(control: AbstractControl | null): ValidationErrors | null {
    if (!this.required() || control?.disabled || this.disabled()) return null;
    const value = control ? control.value : this.groupState().value();
    return this.isEmptyValue(value) ? { required: true } : null;
  }

  private isEmptyValue(value: T | null): boolean {
    return value == null || value === '';
  }

  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (!containsNode(this.host.nativeElement, next)) {
      this.cva.markTouched();
    }
  }

  private onKeydown(event: KeyboardEvent): void {
    const target = event.target;
    if (event.defaultPrevented || this.disabled() || !(target instanceof HTMLElement)) return;
    if (target.closest('[hellRadioGroup]') !== this.host.nativeElement) return;

    const movement = this.keyboardMovement(event.key);
    if (!movement) return;

    const items = this.enabledItems();
    if (!items.length) return;

    const current = this.currentItem(items);
    const next = this.nextItem(items, current, movement);
    if (!next) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    next.focus({ preventScroll: true });
  }

  private keyboardMovement(key: string): 'first' | 'last' | 'next' | 'previous' | null {
    switch (key) {
      case 'Home':
        return 'first';
      case 'End':
        return 'last';
      case 'ArrowDown':
      case 'ArrowRight':
        return 'next';
      case 'ArrowUp':
      case 'ArrowLeft':
        return 'previous';
      default:
        return null;
    }
  }

  private enabledItems(): HTMLButtonElement[] {
    return Array.from(
      this.host.nativeElement.querySelectorAll<HTMLButtonElement>('button[hellRadio]'),
    ).filter(
      (item) =>
        item.closest('[hellRadioGroup]') === this.host.nativeElement &&
        !item.disabled &&
        item.getAttribute('aria-disabled') !== 'true',
    );
  }

  private rovingTabStopItemId(): string | null {
    if (this.disabled()) return null;

    const items = this.sortedRadioItems().filter((item) => !item.disabled());
    const checked = items.find((item) => item.checked());
    return (checked ?? items[0])?.rovingFocusItemId() ?? null;
  }

  private sortedRadioItems(): readonly HellRadioRovingRegistration[] {
    return [...this.rovingRegistry.items()].sort((a, b) =>
      a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    );
  }

  private currentItem(items: readonly HTMLButtonElement[]): HTMLButtonElement {
    const active = this.host.nativeElement.ownerDocument.activeElement;
    return (
      items.find((item) => item === active) ??
      items.find((item) => item.getAttribute('aria-checked') === 'true') ??
      items[0]
    );
  }

  private nextItem(
    items: readonly HTMLButtonElement[],
    current: HTMLButtonElement,
    movement: 'first' | 'last' | 'next' | 'previous',
  ): HTMLButtonElement | null {
    if (movement === 'first') return items[0] ?? null;
    if (movement === 'last') return items.at(-1) ?? null;

    const currentIndex = Math.max(items.indexOf(current), 0);
    const delta = movement === 'next' ? 1 : -1;
    const nextIndex = (currentIndex + delta + items.length) % items.length;
    return items[nextIndex] ?? null;
  }
}

@Directive({
  selector: 'button[hellRadio]',
  hostDirectives: [
    {
      directive: NgpRadioItem,
      inputs: ['ngpRadioItemValue:value', 'ngpRadioItemDisabled:disabled'],
    },
  ],
  host: {
    '[class.hell-radio]': '!unstyled()',
    '[attr.disabled]': 'isDisabled() ? "" : null',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
    type: 'button',
  },
})
export class HellRadio extends HellStyleable {
  private readonly groupState = injectRadioGroupState<unknown>();
  private readonly rovingRegistry = inject(HellRadioRovingRegistry);
  private readonly radioItem = inject(NgpRadioItem<unknown>);
  private readonly rovingFocusGroupState = injectRovingFocusGroupState();
  private readonly rovingFocusItemState = injectRovingFocusItemState();
  private readonly host = inject<ElementRef<HTMLButtonElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly groupDisabled = computed(() => this.groupState().disabled());
  protected readonly itemDisabled = computed(() => this.radioItem.disabled());
  protected readonly isDisabled = computed(() => this.groupDisabled() || this.itemDisabled());

  constructor() {
    super();
    const item: HellRadioRovingRegistration = {
      element: this.host.nativeElement,
      checked: this.radioItem.checked,
      disabled: this.isDisabled,
      rovingFocusItemId: () => this.rovingFocusItemState().id(),
    };
    this.rovingRegistry.register(item);
    this.destroyRef.onDestroy(() => this.rovingRegistry.unregister(item));

    const host = this.host.nativeElement;
    const syncRovingFocusActiveItem = () => this.syncRovingFocusActiveItem();
    host.addEventListener('focus', syncRovingFocusActiveItem);
    host.addEventListener('click', syncRovingFocusActiveItem);
    this.destroyRef.onDestroy(() => {
      host.removeEventListener('focus', syncRovingFocusActiveItem);
      host.removeEventListener('click', syncRovingFocusActiveItem);
    });
  }

  private syncRovingFocusActiveItem(): void {
    if (this.isDisabled()) return;
    writeRovingFocusActiveItem(this.rovingFocusGroupState(), this.rovingFocusItemState().id());
  }
}

@Directive({
  selector: '[hellNativeRadioGroup]',
  host: {
    '[class.hell-radio-group]': '!unstyled()',
    '[attr.data-orientation]': 'orientation()',
    role: 'radiogroup',
  },
})
export class HellNativeRadioGroup extends HellStyleable {
  readonly orientation = input<HellOrientation>('vertical');
}

@Directive({
  selector: 'input[type="radio"][hellNativeRadio]',
  host: {
    '[class.hell-radio]': '!unstyled()',
    '[attr.type]': '"radio"',
    '[attr.required]': 'required() ? "" : null',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.data-required]': 'required() ? "true" : null',
    '(change)': 'onChange()',
  },
})
export class HellNativeRadio extends HellStyleable {
  readonly required = input(false, { alias: 'required', transform: booleanAttribute });

  readonly checkedChange = output<boolean>();
  private readonly host = inject(ElementRef<HTMLInputElement>);

  protected onChange(): void {
    this.checkedChange.emit(this.host.nativeElement.checked);
  }
}

export { NgpRadioIndicator as HellRadioIndicator };
