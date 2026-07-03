import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  booleanAttribute,
  OnDestroy,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HellControlledValueState } from '@hell-ui/angular/internal/core';
import { HellControlValueAccessorBridge } from '@hell-ui/angular/internal/core';
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';
import {
  hellContainsFloatingTarget,
  hellRegisterFloatingHost,
  HellFloatingScopeRegistry,
} from '@hell-ui/angular/internal/core';
import {
  NgpCombobox,
  NgpComboboxButton,
  NgpComboboxDropdown,
  NgpComboboxInput,
  NgpComboboxOption,
  NgpComboboxPortal,
  injectComboboxState,
} from 'ng-primitives/combobox';
import {
  writeComboboxStateDisabled,
  writeComboboxStateValue,
} from '@hell-ui/angular/internal/ng-primitives';

export type HellComboboxSingleValue<T = unknown> = T | null;
export type HellComboboxMultipleValue<T = unknown> = readonly T[];
export type HellComboboxValue<T = unknown> =
  | HellComboboxSingleValue<T>
  | HellComboboxMultipleValue<T>;
export type HellComboboxDisplayWith<T = unknown> = (value: T) => string;
export type HellComboboxCompareWith<T = unknown> = (a: T, b: T) => boolean;

export type HellComboboxPart = 'root';
export type HellComboboxUi = HellUi<HellComboboxPart>;

export type HellComboboxInputPart = 'root';
export type HellComboboxInputUi = HellUi<HellComboboxInputPart>;

export type HellComboboxButtonPart = 'root';
export type HellComboboxButtonUi = HellUi<HellComboboxButtonPart>;

export type HellComboboxDropdownPart = 'root';
export type HellComboboxDropdownUi = HellUi<HellComboboxDropdownPart>;

export type HellComboboxOptionPart = 'root';
export type HellComboboxOptionUi = HellUi<HellComboboxOptionPart>;

export type HellComboboxEmptyPart = 'root';
export type HellComboboxEmptyUi = HellUi<HellComboboxEmptyPart>;

export type HellComboboxBasicPart =
  | 'root'
  | 'control'
  | 'input'
  | 'button'
  | 'dropdown'
  | 'option'
  | 'empty';
export type HellComboboxBasicUi = HellUi<HellComboboxBasicPart>;

const HELL_COMBOBOX_RECIPE = {
  root: 'inline-flex h-hell-control-md w-full cursor-text items-center gap-0 rounded-hell-md border border-solid border-hell-border bg-hell-surface-elevated ps-hell-4 pe-0 font-[inherit] text-[13px] text-hell-foreground outline-none transition-[border-color,box-shadow] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] data-hover:border-hell-border-strong data-focus:border-hell-border-focus data-focus:shadow-[0_0_0_3px_var(--color-hell-focus-ring)] data-disabled:cursor-not-allowed data-disabled:bg-hell-surface-subtle data-disabled:text-hell-foreground-muted data-invalid:border-hell-danger',
} satisfies HellRecipe<HellComboboxPart>;

const HELL_COMBOBOX_INPUT_RECIPE = {
  root: 'h-full min-w-0 flex-auto border-0 bg-transparent p-0 font-[inherit] text-[inherit] text-current outline-none placeholder:text-hell-foreground-muted',
} satisfies HellRecipe<HellComboboxInputPart>;

const HELL_COMBOBOX_BUTTON_RECIPE = {
  root: 'inline-flex h-full w-hell-control-md shrink-0 cursor-pointer items-center justify-center rounded-ee-[inherit] rounded-se-[inherit] border-0 border-s border-s-transparent bg-transparent p-0 text-hell-foreground-muted outline-none data-hover:text-hell-foreground',
} satisfies HellRecipe<HellComboboxButtonPart>;

const HELL_COMBOBOX_DROPDOWN_RECIPE = {
  root: 'fixed flex max-h-[min(320px,var(--ngp-combobox-available-height,320px))] w-[var(--ngp-combobox-width,var(--ngp-combobox-input-width,220px))] flex-col gap-px overflow-y-auto rounded-hell-md border border-solid border-hell-border bg-hell-surface-elevated p-hell-2 shadow-hell-lg outline-none origin-[var(--ngp-combobox-transform-origin,top)] animate-[hell-pop-in_var(--hell-duration-fast)_var(--ease-hell-out)]',
} satisfies HellRecipe<HellComboboxDropdownPart>;

const HELL_COMBOBOX_OPTION_RECIPE = {
  root: 'flex cursor-pointer items-center gap-hell-3 rounded-hell-sm bg-transparent px-[calc(var(--spacing)*2.5)] py-[calc(var(--spacing)*1.5)] text-[13px] text-hell-foreground outline-none data-active:bg-hell-surface-muted data-selected:bg-hell-primary-soft data-selected:font-medium data-selected:text-hell-primary-soft-foreground data-disabled:cursor-not-allowed data-disabled:bg-hell-surface-subtle data-disabled:text-hell-foreground-muted [&[data-selected][data-active]]:bg-[color-mix(in_oklab,var(--color-hell-primary)_18%,var(--color-hell-surface-muted))]',
} satisfies HellRecipe<HellComboboxOptionPart>;

const HELL_COMBOBOX_EMPTY_RECIPE = {
  root: 'px-[calc(var(--spacing)*2.5)] py-[calc(var(--spacing)*2)] text-xs text-hell-foreground-subtle',
} satisfies HellRecipe<HellComboboxEmptyPart>;

const HELL_COMBOBOX_BASIC_RECIPE = {
  root: '',
  control: '',
  input: '',
  button: '',
  dropdown: '',
  option: '',
  empty: '',
} satisfies HellRecipe<HellComboboxBasicPart>;

/**
 * Headless combobox shell around `NgpCombobox`. Pair with
 * `hellComboboxInput`, `hellComboboxButton`, `hellComboboxOption`, and a
 * dropdown rendered through `*hellComboboxPortal`. Bind `[value]` /
 * `(valueChange)` for selection, `[options]` for the option registry, and
 * `[compareWith]` when option identity is not reference-based. In multiple
 * mode the value follows ng-primitives' array contract.
 */
@Directive({
  selector: '[hellCombobox]',
  hostDirectives: [
    {
      directive: NgpCombobox,
      inputs: [
        'ngpComboboxValue:value',
        'ngpComboboxMultiple:multiple',
        'ngpComboboxDisabled:disabled',
        'ngpComboboxAllowDeselect:allowDeselect',
        'ngpComboboxCompareWith:compareWith',
        'ngpComboboxDropdownPlacement:placement',
        'ngpComboboxDropdownContainer:container',
        'ngpComboboxDropdownFlip:flip',
        'ngpComboboxOptions:options',
      ],
      outputs: ['ngpComboboxValueChange:valueChange', 'ngpComboboxOpenChange:openChange'],
    },
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HellCombobox),
      multi: true,
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '(focusout)': 'markControlTouched($event)',
  },
})
export class HellCombobox<T = unknown>
  extends HellPartStyleable<HellComboboxPart>
  implements ControlValueAccessor
{
  protected readonly recipe = HELL_COMBOBOX_RECIPE;
  protected readonly defaultUiPart = 'root';

  private readonly combobox = inject(NgpCombobox);
  private readonly comboboxState = injectComboboxState<NgpCombobox>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly valueAccessor = new HellControlValueAccessorBridge<HellComboboxValue<T>>();
  private readonly floatingScope = new HellFloatingScopeRegistry();
  private dropdownOpen = false;

  constructor() {
    super();
    const valueSub = this.combobox.valueChange.subscribe((value) => {
      this.valueAccessor.emitValue(this.normalizeValue(value));
    });
    const openSub = this.combobox.openChange.subscribe((open) => {
      this.dropdownOpen = open;
    });
    this.destroyRef.onDestroy(() => {
      valueSub.unsubscribe();
      openSub.unsubscribe();
    });
  }

  writeValue(value: HellComboboxValue<T>): void {
    writeComboboxStateValue(this.comboboxState(), this.normalizeWriteValue(value));
  }

  registerOnChange(fn: (value: HellComboboxValue<T>) => void): void {
    this.valueAccessor.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.valueAccessor.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    writeComboboxStateDisabled(this.comboboxState(), isDisabled);
  }

  isOutsideControl(next: EventTarget | Node | null): boolean {
    return !hellContainsFloatingTarget(
      {
        root: () => this.host.nativeElement,
        scope: this.floatingScope,
        floatingActive: () => this.dropdownOpen,
      },
      next,
    );
  }

  markControlTouched(event: FocusEvent): void {
    if (this.isOutsideControl(event.relatedTarget)) {
      this.valueAccessor.markTouched();
    }
  }

  registerDropdown(dropdown: HTMLElement): void {
    this.floatingScope.registerFloatingElement(dropdown);
  }

  unregisterDropdown(dropdown: HTMLElement): void {
    this.floatingScope.unregisterFloatingElement(dropdown);
  }

  private normalizeValue(value: unknown): HellComboboxValue<T> {
    if (this.combobox.multiple()) {
      return this.normalizeMultipleValue(value);
    }
    return this.normalizeSingleValue(value);
  }

  private normalizeSingleValue(value: unknown): HellComboboxSingleValue<T> {
    if (value == null) return null;
    return value as T;
  }

  private normalizeMultipleValue(value: unknown): HellComboboxMultipleValue<T> {
    if (value == null) return [];
    if (Array.isArray(value)) return [...value];
    return [value as T];
  }

  private normalizeWriteValue(value: HellComboboxValue<T>): HellComboboxValue<T> {
    if (this.combobox.multiple()) return this.normalizeMultipleValue(value);
    return this.normalizeSingleValue(value);
  }
}

/** Text input that drives combobox filtering and keyboard focus. */
@Directive({
  selector: 'input[hellComboboxInput]',
  hostDirectives: [NgpComboboxInput],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellComboboxInput extends HellPartStyleable<HellComboboxInputPart> {
  protected readonly recipe = HELL_COMBOBOX_INPUT_RECIPE;
  protected readonly defaultUiPart = 'root';
}

/** Toggle button for opening and closing the combobox dropdown. */
@Directive({
  selector: 'button[hellComboboxButton]',
  hostDirectives: [NgpComboboxButton],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellComboboxButton extends HellPartStyleable<HellComboboxButtonPart> {
  protected readonly recipe = HELL_COMBOBOX_BUTTON_RECIPE;
  protected readonly defaultUiPart = 'root';
}

/**
 * Floating dropdown surface for combobox options. Registers with any active
 * Hell Floating Scope so parent floating controls do not treat option clicks as
 * outside interactions.
 */
@Directive({
  selector: '[hellComboboxDropdown]',
  hostDirectives: [NgpComboboxDropdown],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '(focusout)': 'markControlTouched($event)',
  },
})
export class HellComboboxDropdown
  extends HellPartStyleable<HellComboboxDropdownPart>
  implements OnDestroy
{
  protected readonly recipe = HELL_COMBOBOX_DROPDOWN_RECIPE;
  protected readonly defaultUiPart = 'root';

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly combobox = inject(HellCombobox, { optional: true });
  private readonly basicCombobox = inject(HellComboboxBasic, { optional: true });

  constructor() {
    super();
    hellRegisterFloatingHost();
    if (this.combobox) {
      this.combobox.registerDropdown(this.host.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.combobox) {
      this.combobox.unregisterDropdown(this.host.nativeElement);
    }
  }

  markControlTouched(event: FocusEvent): void {
    this.combobox?.markControlTouched(event);
    this.basicCombobox?.markControlTouched(event);
  }
}

/**
 * Structural directive: renders the dropdown only while the combobox is
 * open and positions it as a floating overlay anchored to the trigger.
 *
 *  Usage: place on the `<div hellComboboxDropdown>` with a leading `*`:
 *    <div *hellComboboxPortal hellComboboxDropdown>...</div>
 *
 *  This wraps `NgpComboboxPortal`, which needs a `TemplateRef`; the star
 *  syntax desugars the host into an `ng-template` so DI resolves. Without
 *  this, the dropdown markup renders inline and stays visible.
 */
@Directive({
  selector: '[hellComboboxPortal]',
  hostDirectives: [NgpComboboxPortal],
})
export class HellComboboxPortal {}

/**
 * Selectable combobox option. `[value]` is the payload emitted by the parent
 * combobox; `[index]` is available for virtualized or manually ordered lists.
 */
@Directive({
  selector: '[hellComboboxOption]',
  hostDirectives: [
    {
      directive: NgpComboboxOption,
      inputs: [
        'ngpComboboxOptionValue:value',
        'ngpComboboxOptionDisabled:disabled',
        'ngpComboboxOptionIndex:index',
      ],
      outputs: ['ngpComboboxOptionActivated:activated'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
  },
})
export class HellComboboxOption extends HellPartStyleable<HellComboboxOptionPart> {
  protected readonly recipe = HELL_COMBOBOX_OPTION_RECIPE;
  protected readonly defaultUiPart = 'root';

  private readonly option = inject(NgpComboboxOption);
  protected readonly disabled = computed(() => this.option.disabled());
}

@Directive({
  selector: '[hellComboboxEmpty]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellComboboxEmpty extends HellPartStyleable<HellComboboxEmptyPart> {
  protected readonly recipe = HELL_COMBOBOX_EMPTY_RECIPE;
  protected readonly defaultUiPart = 'root';
}

/**
 * Convenience combobox that composes `hellCombobox`, `hellComboboxInput`,
 * `hellComboboxButton`, and portal/dropdown patterns into a simple list
 * component.
 */
@Component({
  selector: 'hell-combobox-basic',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HellComboboxBasic),
      multi: true,
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
  imports: [
    HellCombobox,
    HellComboboxButton,
    HellComboboxDropdown,
    HellComboboxEmpty,
    HellComboboxInput,
    HellComboboxOption,
    HellComboboxPortal,
  ],
  template: `
    <div
      hellCombobox
      [value]="effectiveValue()"
      [multiple]="multiple()"
      [allowDeselect]="allowDeselect()"
      [compareWith]="compareWith()"
      [disabled]="effectiveDisabled()"
      data-slot="control"
      [ui]="part('control')"
      (focusout)="markControlTouched($event)"
      (openChange)="onOpenChange($event)"
      (valueChange)="onValueChange($event)"
    >
      <input
        hellComboboxInput
        data-slot="input"
        [ui]="part('input')"
        [value]="filter()"
        [placeholder]="placeholder()"
        [attr.aria-label]="ariaLabel()"
        (input)="onFilterInput($any($event.target).value)"
      />
      <button
        hellComboboxButton
        type="button"
        data-slot="button"
        [ui]="part('button')"
        [attr.aria-label]="toggleLabel()"
      ></button>
      <div
        *hellComboboxPortal
        hellComboboxDropdown
        data-slot="dropdown"
        [ui]="part('dropdown')"
      >
        @for (option of filteredOptions(); track option) {
          <div
            hellComboboxOption
            data-slot="option"
            [ui]="part('option')"
            [value]="option"
          >
            {{ displayWith()(option) }}
          </div>
        } @empty {
          <div hellComboboxEmpty data-slot="empty" [ui]="part('empty')">
            {{ emptyLabel() }}
          </div>
        }
      </div>
    </div>
  `,
})
export class HellComboboxBasic<T = unknown>
  extends HellPartStyleable<HellComboboxBasicPart>
  implements ControlValueAccessor
{
  protected readonly recipe = HELL_COMBOBOX_BASIC_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly options = input<readonly T[]>([]);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly allowDeselect = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly placeholder = input('Search');
  readonly toggleLabel = input('Toggle options');
  readonly emptyLabel = input('No matches');
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  readonly compareWith = input<HellComboboxCompareWith<T>>((a, b) => a === b);
  readonly displayWith = input<HellComboboxDisplayWith<T>>((value) => String(value));
  readonly value = input<HellComboboxValue<T> | null>(null);

  readonly valueChange = output<HellComboboxValue<T>>();
  readonly openChange = output<boolean>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly valueAccessor = new HellControlValueAccessorBridge<HellComboboxValue<T>>();
  private readonly controlledValue = new HellControlledValueState<HellComboboxValue<T>>({
    externalValue: this.value,
    externalDisabled: this.disabled,
    initialValue: null,
  });
  private readonly filterOverride = signal<string | null>(null);
  private readonly combobox = viewChild(HellCombobox);

  protected readonly effectiveValue = this.controlledValue.value;
  protected readonly effectiveDisabled = this.controlledValue.disabled;

  protected readonly selectedLabel = computed(() => {
    const value = this.effectiveValue();
    if (this.multiple()) {
      const selectedValues = Array.isArray(value) ? value : value == null ? [] : [value as T];
      if (!selectedValues.length) return '';
      return selectedValues.map((option) => this.displayWith()(option)).join(', ');
    }

    if (value == null) return '';
    return this.displayWith()(value as T);
  });

  protected readonly filterValue = computed(() => this.filterOverride() ?? this.selectedLabel());

  protected readonly filteredOptions = computed(() => {
    const term = this.filterValue().trim().toLowerCase();
    if (!term) return this.options();
    return this.options().filter((option) =>
      this.displayWith()(option).toLowerCase().includes(term),
    );
  });

  protected onValueChange(next: HellComboboxValue<T>): void {
    this.controlledValue.acceptUserValue(next);
    this.valueChange.emit(next);
    this.valueAccessor.emitValue(next);
    this.filterOverride.set(null);
  }

  protected onFilterInput(value: string): void {
    this.filterOverride.set(value);
  }

  protected onOpenChange(next: boolean): void {
    this.openChange.emit(next);

    if (!next) {
      this.filterOverride.set(null);
    }
  }

  markControlTouched(event: FocusEvent): void {
    const combobox = this.combobox();
    const outside = combobox
      ? combobox.isOutsideControl(event.relatedTarget)
      : !hellContainsFloatingTarget({ root: () => this.host.nativeElement }, event.relatedTarget);

    if (outside) this.valueAccessor.markTouched();
  }

  writeValue(value: HellComboboxValue<T>): void {
    this.controlledValue.writeValue(this.normalizeWriteValue(value));
    this.filterOverride.set(null);
  }

  registerOnChange(fn: (value: HellComboboxValue<T>) => void): void {
    this.valueAccessor.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.valueAccessor.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlledValue.setDisabledState(isDisabled);
  }

  protected filter(): string {
    return this.filterValue();
  }

  private normalizeSingleValue(value: unknown): HellComboboxSingleValue<T> {
    if (value == null) return null;
    return value as T;
  }

  private normalizeMultipleValue(value: unknown): HellComboboxMultipleValue<T> {
    if (value == null) return [];
    if (Array.isArray(value)) return [...value];
    return [value as T];
  }

  private normalizeWriteValue(value: HellComboboxValue<T>): HellComboboxValue<T> {
    if (this.multiple()) {
      return this.normalizeMultipleValue(value);
    }
    return this.normalizeSingleValue(value);
  }
}

export const HELL_COMBOBOX_DIRECTIVES = [
  HellCombobox,
  HellComboboxInput,
  HellComboboxButton,
  HellComboboxDropdown,
  HellComboboxPortal,
  HellComboboxOption,
  HellComboboxEmpty,
] as const;

export const HELL_COMBOBOX_BASIC_DIRECTIVES = [HellComboboxBasic] as const;
