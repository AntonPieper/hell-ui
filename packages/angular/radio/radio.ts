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
} from '@hell-ui/angular/internal/ng-primitives';
import { containsNode } from '@hell-ui/angular/internal/core';
import { HellControlValueAccessorBridge } from '@hell-ui/angular/internal/core';
import { hellPartStyler, HellOrientation, type HellRecipe, type HellUiInput } from '@hell-ui/angular/core';

const HELL_RADIO_GROUP_RECIPE = {
  root: 'inline-flex flex-col gap-hell-3 data-[orientation=horizontal]:flex-row',
} satisfies HellRecipe<'root'>;

const HELL_NATIVE_RADIO_GROUP_RECIPE = {
  root: 'inline-flex flex-col gap-hell-3 data-[orientation=horizontal]:flex-row',
} satisfies HellRecipe<'root'>;

const HELL_RADIO_RECIPE = {
  root: 'inline-flex cursor-pointer items-center gap-hell-3 rounded-hell-sm border-0 bg-transparent p-0 font-[family-name:inherit] text-[13px] text-hell-foreground data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-visible:outline-2 data-focus-visible:outline-hell-focus-ring data-focus-visible:outline-offset-2',
} satisfies HellRecipe<'root'>;

const HELL_NATIVE_RADIO_RECIPE = {
  root: 'relative inline-flex size-hell-5 cursor-pointer appearance-none items-center justify-center rounded-hell-pill border border-solid border-hell-border-strong bg-hell-surface-elevated p-0 m-0 text-hell-primary-foreground transition-[border-color] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] checked:border-hell-primary focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
} satisfies HellRecipe<'root'>;

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

/**
 * Roving-focus radio group built on `ng-primitives/radio`. Manages the
 * checked value, keyboard navigation between `HellRadio` items, and
 * `ControlValueAccessor`/`Validator` integration for reactive forms.
 */
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
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-orientation]': 'orientation()',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.data-required]': 'required() ? "true" : null',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class HellRadioGroup<T = unknown> implements ControlValueAccessor, Validator {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_RADIO_GROUP_RECIPE,
  });

  /** Layout axis for the group's roving focus and Tailwind data attribute. Defaults to `vertical`. */
  readonly orientation = input<HellOrientation>('vertical');
  /** Whether a value must be selected for the group to be valid. Defaults to `false`. */
  readonly required = input(false, { transform: booleanAttribute });

  private readonly group = inject(NgpRadioGroup<T>);
  private readonly groupState = injectRadioGroupState<T>();
  private readonly rovingFocusGroupState = injectRovingFocusGroupState();
  private readonly rovingRegistry = inject(HellRadioRovingRegistry);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly valueAccessor = new HellControlValueAccessorBridge<T | null>();
  private onValidatorChange: () => void = () => {};
  private readonly disabled = computed(() => this.groupState().disabled());

  constructor() {
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
      this.valueAccessor.emitValue(value);
    });
    this.destroyRef.onDestroy(() => valueSub.unsubscribe());

    const host = this.host.nativeElement;
    const onKeydown = (event: KeyboardEvent) => this.onKeydown(event);
    host.addEventListener('keydown', onKeydown, { capture: true });
    this.destroyRef.onDestroy(() =>
      host.removeEventListener('keydown', onKeydown, { capture: true }),
    );
  }

  /** Writes a value from the form model into the radio group state. */
  writeValue(value: T | null): void {
    writeRadioGroupStateValue(this.groupState(), value);
  }

  /** Registers the callback invoked when the checked value changes. */
  registerOnChange(fn: (value: T | null) => void): void {
    this.valueAccessor.registerOnChange(fn);
  }

  /** Registers the callback invoked when the group is touched. */
  registerOnTouched(fn: () => void): void {
    this.valueAccessor.registerOnTouched(fn);
  }

  /** Registers the callback invoked when validator-relevant state changes. */
  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  /** Applies the disabled state pushed down from the form model. */
  setDisabledState(isDisabled: boolean): void {
    writeRadioGroupStateDisabled(this.groupState(), isDisabled);
    this.onValidatorChange();
  }

  /** Returns a `required` validation error when `required` is set and no value is selected. */
  validate(control: AbstractControl | null): ValidationErrors | null {
    if (!this.required() || control?.disabled || this.disabled()) return null;
    const value = control ? control.value : this.groupState().value();
    return this.isEmptyValue(value) ? { required: true } : null;
  }

  private isEmptyValue(value: T | null): boolean {
    return value == null || value === '';
  }

  /** Marks the group as touched once focus leaves the group entirely. */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (!containsNode(this.host.nativeElement, next)) {
      this.valueAccessor.markTouched();
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

/**
 * Individual radio item button. Must be placed inside a `HellRadioGroup`;
 * participates in its roving focus and checked-value state.
 */
@Directive({
  selector: 'button[hellRadio]',
  hostDirectives: [
    {
      directive: NgpRadioItem,
      inputs: ['ngpRadioItemValue:value', 'ngpRadioItemDisabled:disabled'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.disabled]': 'isDisabled() ? "" : null',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
    type: 'button',
  },
})
export class HellRadio {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_RADIO_RECIPE,
  });

  private readonly groupState = injectRadioGroupState<unknown>();
  private readonly rovingRegistry = inject(HellRadioRovingRegistry);
  private readonly radioItem = inject(NgpRadioItem<unknown>);
  private readonly rovingFocusGroupState = injectRovingFocusGroupState();
  private readonly rovingFocusItemState = injectRovingFocusItemState();
  private readonly host = inject<ElementRef<HTMLButtonElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Whether the enclosing `HellRadioGroup` is disabled. */
  protected readonly groupDisabled = computed(() => this.groupState().disabled());
  /** Whether this item is individually disabled. */
  protected readonly itemDisabled = computed(() => this.radioItem.disabled());
  /** Whether the item is disabled, either individually or via its group. */
  protected readonly isDisabled = computed(() => this.groupDisabled() || this.itemDisabled());

  constructor() {
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

/**
 * Layout wrapper for a group of native `input[type="radio"][hellNativeRadio]`
 * elements. Purely presentational — it does not manage checked state, since
 * native radios coordinate that through their shared `name` attribute.
 */
@Directive({
  selector: '[hellNativeRadioGroup]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-orientation]': 'orientation()',
    role: 'radiogroup',
  },
})
export class HellNativeRadioGroup {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_NATIVE_RADIO_GROUP_RECIPE,
  });

  /** Layout axis for the group's Tailwind data attribute. Defaults to `vertical`. */
  readonly orientation = input<HellOrientation>('vertical');
}

/** Styleable wrapper around a native `input[type="radio"]` element. */
@Directive({
  selector: 'input[type="radio"][hellNativeRadio]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.type]': '"radio"',
    '[attr.required]': 'required() ? "" : null',
    '[attr.aria-required]': 'required() ? "true" : null',
    '[attr.data-required]': 'required() ? "true" : null',
    '(change)': 'onChange()',
  },
})
export class HellNativeRadio {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_NATIVE_RADIO_RECIPE,
  });

  /** Whether the input must be checked for the surrounding form to be valid. Defaults to `false`. */
  readonly required = input(false, { alias: 'required', transform: booleanAttribute });

  /** Emits the input's checked state whenever it changes. */
  readonly checkedChange = output<boolean>();
  private readonly host = inject(ElementRef<HTMLInputElement>);

  /** Re-emits `checkedChange` in response to the native `change` event. */
  protected onChange(): void {
    this.checkedChange.emit(this.host.nativeElement.checked);
  }
}

export { NgpRadioIndicator as HellRadioIndicator };
