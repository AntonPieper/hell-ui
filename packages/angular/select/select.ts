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
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';
import { HellControlledValueState } from '@hell-ui/angular/internal/core';
import { HellControlValueAccessorBridge } from '@hell-ui/angular/internal/core';
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';
import {
  hellContainsFloatingTarget,
  hellRegisterFloatingHost,
  HellFloatingScopeRegistry,
} from '@hell-ui/angular/internal/core';
import {
  hellSyncFormFieldDescriptions,
  hellSyncFormFieldLabels,
} from '@hell-ui/angular/internal/core';
import {
  NgpSelect,
  NgpSelectDropdown,
  NgpSelectOption,
  NgpSelectPortal,
  injectSelectState,
} from 'ng-primitives/select';
import {
  injectFormFieldState,
  ngpFormField,
  provideFormFieldState,
} from 'ng-primitives/form-field';
import { writeSelectStateDisabled, writeSelectStateValue } from '@hell-ui/angular/internal/ng-primitives';

export type HellSelectSingleValue<T = unknown> = T | null;
export type HellSelectMultipleValue<T = unknown> = readonly T[];
export type HellSelectFormValue<T = unknown> =
  | HellSelectSingleValue<T>
  | HellSelectMultipleValue<T>;
export type HellSelectDisplayWith<T = unknown> = (value: T) => string;
export type HellSelectCompareWith<T = unknown> = (a: T, b: T) => boolean;

export type HellSelectPart = 'root';
export type HellSelectUi = HellUi<HellSelectPart>;

export type HellSelectValuePart = 'root';
export type HellSelectValueUi = HellUi<HellSelectValuePart>;

export type HellSelectPlaceholderPart = 'root';
export type HellSelectPlaceholderUi = HellUi<HellSelectPlaceholderPart>;

export type HellSelectDropdownPart = 'root';
export type HellSelectDropdownUi = HellUi<HellSelectDropdownPart>;

export type HellSelectOptionPart = 'root';
export type HellSelectOptionUi = HellUi<HellSelectOptionPart>;

export type HellSelectBasicPart =
  | 'root'
  | 'trigger'
  | 'value'
  | 'placeholder'
  | 'dropdown'
  | 'option';
export type HellSelectBasicUi = HellUi<HellSelectBasicPart>;

const HELL_SELECT_RECIPE = {
  root: 'inline-flex h-hell-control-md w-full cursor-pointer items-center gap-hell-3 rounded-hell-md border border-solid border-hell-border bg-hell-surface-elevated ps-hell-4 pe-hell-3 text-start font-[inherit] text-[13px] text-hell-foreground outline-none transition-[border-color,box-shadow] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] data-hover:border-hell-border-strong data-focus:border-hell-border-focus data-focus:shadow-[0_0_0_3px_var(--color-hell-focus-ring)] data-disabled:cursor-not-allowed data-disabled:bg-hell-surface-subtle data-disabled:text-hell-foreground-muted data-invalid:border-hell-danger',
} satisfies HellRecipe<HellSelectPart>;

const HELL_SELECT_VALUE_RECIPE = {
  root: 'min-w-0 flex-auto overflow-hidden text-ellipsis whitespace-nowrap',
} satisfies HellRecipe<HellSelectValuePart>;

const HELL_SELECT_PLACEHOLDER_RECIPE = {
  root: 'min-w-0 flex-auto overflow-hidden text-ellipsis whitespace-nowrap text-hell-foreground-muted',
} satisfies HellRecipe<HellSelectPlaceholderPart>;

const HELL_SELECT_DROPDOWN_RECIPE = {
  root: 'fixed z-[var(--hell-z-popover,60)] flex max-h-[min(320px,var(--ngp-select-available-height,320px))] w-[var(--ngp-select-width,220px)] flex-col gap-px overflow-y-auto rounded-hell-md border border-solid border-hell-border bg-hell-surface-elevated p-hell-2 shadow-hell-lg outline-none origin-[var(--ngp-select-transform-origin,top)] animate-[hell-pop-in_var(--hell-duration-fast)_var(--ease-hell-out)]',
} satisfies HellRecipe<HellSelectDropdownPart>;

const HELL_SELECT_OPTION_RECIPE = {
  root: 'flex cursor-pointer items-center gap-hell-3 rounded-hell-sm bg-transparent px-[calc(var(--spacing)*2.5)] py-[calc(var(--spacing)*1.5)] text-[13px] text-hell-foreground outline-none data-active:bg-hell-surface-muted data-selected:bg-hell-primary-soft data-selected:font-medium data-selected:text-hell-primary-soft-foreground data-disabled:cursor-not-allowed data-disabled:bg-hell-surface-subtle data-disabled:text-hell-foreground-muted [&[data-selected][data-active]]:bg-[color-mix(in_oklab,var(--color-hell-primary)_18%,var(--color-hell-surface-muted))]',
} satisfies HellRecipe<HellSelectOptionPart>;

const HELL_SELECT_BASIC_RECIPE = {
  root: '',
  trigger: '',
  value: '',
  placeholder: '',
  dropdown: '',
  option: '',
} satisfies HellRecipe<HellSelectBasicPart>;

/** Rich, headless select. Trigger element is the host of `[hellSelect]`;
 *  use ng-content to render the selected value (or a placeholder), pair
 *  with `[hellSelectDropdown]` inside a `*hellSelectPortal`, and emit
 *  `valueChange` to react to selection. For native `<select>` controls,
 *  use `[hellNativeSelect]` instead. */
@Directive({
  selector: '[hellSelect]',
  hostDirectives: [
    {
      directive: NgpSelect,
      inputs: [
        'ngpSelectValue:value',
        'ngpSelectMultiple:multiple',
        'ngpSelectDisabled:disabled',
        'ngpSelectCompareWith:compareWith',
        'ngpSelectDropdownPlacement:placement',
        'ngpSelectDropdownContainer:container',
        'ngpSelectDropdownFlip:flip',
        'ngpSelectOptions:options',
      ],
      outputs: ['ngpSelectValueChange:valueChange', 'ngpSelectOpenChange:openChange'],
    },
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HellSelect),
      multi: true,
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '(focusout)': 'markControlTouched($event)',
  },
})
export class HellSelect<T = unknown>
  extends HellPartStyleable<HellSelectPart>
  implements ControlValueAccessor
{
  protected readonly recipe = HELL_SELECT_RECIPE;
  protected readonly defaultUiPart = 'root';

  private readonly select = inject(NgpSelect);
  private readonly selectState = injectSelectState<NgpSelect>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly valueAccessor = new HellControlValueAccessorBridge<HellSelectFormValue<T>>();
  private readonly floatingScope = new HellFloatingScopeRegistry();
  private dropdownOpen = false;

  constructor() {
    super();
    const valueSub = this.select.valueChange.subscribe((value) => {
      this.valueAccessor.emitValue(this.normalizeValue(value));
    });
    const openSub = this.select.openChange.subscribe((open) => {
      this.dropdownOpen = open;
    });
    this.destroyRef.onDestroy(() => {
      valueSub.unsubscribe();
      openSub.unsubscribe();
    });
  }

  writeValue(value: HellSelectFormValue<T>): void {
    writeSelectStateValue(this.selectState(), this.normalizeWriteValue(value));
  }

  registerOnChange(fn: (value: HellSelectFormValue<T>) => void): void {
    this.valueAccessor.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.valueAccessor.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    writeSelectStateDisabled(this.selectState(), isDisabled);
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

  private normalizeValue(value: unknown): HellSelectFormValue<T> {
    if (this.select.multiple()) {
      return this.normalizeMultipleValue(value);
    }
    return this.normalizeSingleValue(value);
  }

  private normalizeSingleValue(value: unknown): HellSelectSingleValue<T> {
    if (value == null) return null;
    return value as T;
  }

  private normalizeMultipleValue(value: unknown): HellSelectMultipleValue<T> {
    if (value == null) return [];
    if (Array.isArray(value)) return [...value];
    return [value as T];
  }

  private normalizeWriteValue(value: HellSelectFormValue<T>): HellSelectFormValue<T> {
    if (this.select.multiple()) return this.normalizeMultipleValue(value);
    return this.normalizeSingleValue(value);
  }
}

@Directive({
  selector: '[hellSelectValue]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellSelectValue extends HellPartStyleable<HellSelectValuePart> {
  protected readonly recipe = HELL_SELECT_VALUE_RECIPE;
  protected readonly defaultUiPart = 'root';
}

@Directive({
  selector: '[hellSelectPlaceholder]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellSelectPlaceholder extends HellPartStyleable<HellSelectPlaceholderPart> {
  protected readonly recipe = HELL_SELECT_PLACEHOLDER_RECIPE;
  protected readonly defaultUiPart = 'root';
}

@Directive({
  selector: '[hellSelectDropdown]',
  hostDirectives: [NgpSelectDropdown],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '(focusout)': 'markControlTouched($event)',
  },
})
export class HellSelectDropdown
  extends HellPartStyleable<HellSelectDropdownPart>
  implements OnDestroy
{
  protected readonly recipe = HELL_SELECT_DROPDOWN_RECIPE;
  protected readonly defaultUiPart = 'root';

  private readonly dropdown = inject(NgpSelectDropdown);
  private readonly select = inject(HellSelect, { optional: true });
  private readonly basicSelect = inject(HellSelectBasic, { optional: true });

  constructor() {
    super();
    hellRegisterFloatingHost();
    if (this.select) {
      this.select.registerDropdown(this.dropdown.elementRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.select) {
      this.select.unregisterDropdown(this.dropdown.elementRef.nativeElement);
    }
  }

  markControlTouched(event: FocusEvent): void {
    this.select?.markControlTouched(event);
    this.basicSelect?.markControlTouched(event);
  }
}

@Directive({
  selector: '[hellSelectPortal]',
  hostDirectives: [NgpSelectPortal],
})
export class HellSelectPortal {}

@Directive({
  selector: '[hellSelectOption]',
  hostDirectives: [
    {
      directive: NgpSelectOption,
      inputs: [
        'ngpSelectOptionValue:value',
        'ngpSelectOptionDisabled:disabled',
        'ngpSelectOptionIndex:index',
      ],
      outputs: ['ngpSelectOptionActivated:activated'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
  },
})
export class HellSelectOption extends HellPartStyleable<HellSelectOptionPart> {
  protected readonly recipe = HELL_SELECT_OPTION_RECIPE;
  protected readonly defaultUiPart = 'root';

  private readonly option = inject(NgpSelectOption);
  protected readonly disabled = computed(() => this.option.disabled());
}

@Component({
  selector: 'hell-select-basic',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideFormFieldState()],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HellSelectBasic),
      multi: true,
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
  imports: [
    HellSelect,
    HellSelectDropdown,
    HellSelectOption,
    HellSelectPortal,
    HellSelectPlaceholder,
    HellSelectValue,
  ],
  template: `
    <button
      hellSelect
      type="button"
      [value]="effectiveValue()"
      [multiple]="multiple()"
      [compareWith]="compareWith()"
      [disabled]="effectiveDisabled()"
      [attr.aria-label]="triggerAriaLabel()"
      data-slot="trigger"
      [ui]="part('trigger')"
      (focusout)="markControlTouched($event)"
      (openChange)="openChange.emit($event)"
      (valueChange)="onValueChange($event)"
    >
      @if (selectedLabel()) {
        <span hellSelectValue data-slot="value" [ui]="part('value')">
          {{ selectedLabel() }}
        </span>
      } @else {
        <span
          hellSelectPlaceholder
          data-slot="placeholder"
          [ui]="part('placeholder')"
        >
          {{ placeholder() }}
        </span>
      }
      <ng-template hellSelectPortal>
        <div hellSelectDropdown data-slot="dropdown" [ui]="part('dropdown')">
          @for (option of options(); track option) {
            <div
              hellSelectOption
              data-slot="option"
              [ui]="part('option')"
              [value]="option"
            >
              {{ displayWith()(option) }}
            </div>
          }
        </div>
      </ng-template>
    </button>
  `,
})
export class HellSelectBasic<T = unknown>
  extends HellPartStyleable<HellSelectBasicPart>
  implements ControlValueAccessor
{
  protected readonly recipe = HELL_SELECT_BASIC_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly options = input<readonly T[]>([]);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly placeholder = input('Select');
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | null>(null, { alias: 'aria-describedby' });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly compareWith = input<HellSelectCompareWith<T>>((a, b) => a === b);
  readonly displayWith = input<HellSelectDisplayWith<T>>((value) => String(value));
  readonly value = input<HellSelectFormValue<T> | null>(null);

  readonly valueChange = output<HellSelectFormValue<T>>();
  readonly openChange = output<boolean>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly innerSelect = viewChild(HellSelect);
  private readonly valueAccessor = new HellControlValueAccessorBridge<HellSelectFormValue<T>>();
  private readonly inheritedFormField = injectFormFieldState({ optional: true, skipSelf: true });
  private readonly formField =
    this.inheritedFormField() ??
    ngpFormField({ ngControl: signal<NgControl | undefined>(undefined) });
  private readonly controlledValue = new HellControlledValueState<HellSelectFormValue<T>>({
    externalValue: this.value,
    externalDisabled: this.disabled,
    initialValue: null,
  });

  protected readonly effectiveValue = this.controlledValue.value;
  protected readonly effectiveDisabled = this.controlledValue.disabled;
  protected readonly triggerAriaLabel = () =>
    this.ariaLabel() ?? this.host.nativeElement.getAttribute('aria-label');
  private readonly triggerAriaLabelledby = computed(
    () => this.ariaLabelledby() ?? this.host.nativeElement.getAttribute('aria-labelledby'),
  );
  private readonly triggerAriaDescribedby = computed(
    () => this.ariaDescribedby() ?? this.host.nativeElement.getAttribute('aria-describedby'),
  );

  protected readonly selectedLabel = computed(() => {
    const value = this.effectiveValue();
    if (this.multiple()) {
      const selectedValues = Array.isArray(value) ? value : value == null ? [] : [value as T];
      if (!selectedValues.length) return null;
      return selectedValues.map((item) => this.displayWith()(item)).join(', ');
    }

    if (value == null) return null;
    return this.displayWith()(value as T);
  });

  constructor() {
    super();
    hellSyncFormFieldLabels(this.formField, this.triggerAriaLabelledby);
    hellSyncFormFieldDescriptions(this.formField, this.triggerAriaDescribedby);
  }

  protected onValueChange(next: HellSelectFormValue<T>): void {
    this.controlledValue.acceptUserValue(next);
    this.valueChange.emit(next);
    this.valueAccessor.emitValue(next);
  }

  markControlTouched(event: FocusEvent): void {
    const inner = this.innerSelect();
    const outside = inner
      ? inner.isOutsideControl(event.relatedTarget)
      : !hellContainsFloatingTarget({ root: () => this.host.nativeElement }, event.relatedTarget);

    if (outside) this.valueAccessor.markTouched();
  }

  writeValue(value: HellSelectFormValue<T>): void {
    this.controlledValue.writeValue(this.normalizeWriteValue(value));
  }

  registerOnChange(fn: (value: HellSelectFormValue<T>) => void): void {
    this.valueAccessor.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.valueAccessor.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlledValue.setDisabledState(isDisabled);
  }

  private normalizeSingleValue(value: unknown): HellSelectSingleValue<T> {
    if (value == null) return null;
    return value as T;
  }

  private normalizeMultipleValue(value: unknown): HellSelectMultipleValue<T> {
    if (value == null) return [];
    if (Array.isArray(value)) return [...value];
    return [value as T];
  }

  private normalizeWriteValue(value: HellSelectFormValue<T>): HellSelectFormValue<T> {
    if (this.multiple()) {
      return this.normalizeMultipleValue(value);
    }
    return this.normalizeSingleValue(value);
  }
}

export const HELL_SELECT_DIRECTIVES = [
  HellSelect,
  HellSelectValue,
  HellSelectPlaceholder,
  HellSelectDropdown,
  HellSelectPortal,
  HellSelectOption,
] as const;

export const HELL_SELECT_BASIC_DIRECTIVES = [HellSelectBasic] as const;
