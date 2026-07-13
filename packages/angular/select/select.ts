import { ChangeDetectionStrategy, Component, DestroyRef, Directive, ElementRef, booleanAttribute, OnDestroy, computed, forwardRef, inject, input, output, signal, viewChild, type Signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';
import { HellControlledValueState } from '@hell-ui/angular/internal/core';
import { HellControlValueAccessorBridge } from '@hell-ui/angular/internal/core';
import { hellPartStyler, type HellOption, type HellOptionCompareWith, type HellOptionDisplayWith, type HellRecipe, type HellSize, type HellUi, type HellUiInput } from '@hell-ui/angular/core';
import { hellOptionSurfaceRecipe } from '@hell-ui/angular/internal/option';
<<<<<<< HEAD
import { hellContainsFloatingTarget, hellRegisterFloatingHost, HellFloatingScopeRegistry } from '@hell-ui/angular/internal/core';
import { hellSyncFormFieldDescriptions, hellSyncFormFieldLabels } from '@hell-ui/angular/internal/core';
import { NgpSelect, NgpSelectDropdown, NgpSelectOption, NgpSelectPortal, injectSelectState } from 'ng-primitives/select';
||||||| 7b91fa1b
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
=======
import {
  HELL_FLOATING_POP_IN,
  HELL_FLOATING_SURFACE,
  HELL_FLOATING_Z_POPOVER,
} from '@hell-ui/angular/internal/floating';
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
>>>>>>> worktree-agent-afc3a8edeb97def97
import { NgpInput } from 'ng-primitives/input';
import { injectFormFieldState, ngpFormField, provideFormFieldState } from 'ng-primitives/form-field';

export type HellSelectSingleValue<T = unknown> = T | null;
export type HellSelectMultipleValue<T = unknown> = readonly T[];
export type HellSelectFormValue<T = unknown> =
  | HellSelectSingleValue<T>
  | HellSelectMultipleValue<T>;

/** Public parts of the HellSelect module, styleable through its Part Style Map. */
export type HellSelectPart =
  | 'root'
  | 'trigger'
  | 'value'
  | 'placeholder'
  | 'dropdown'
  | 'option';
/** Part Style Map accepted by the HellSelect `ui` input. */
export type HellSelectUi = HellUi<HellSelectPart>;

const HELL_SELECT_TRIGGER_RECIPE = {
  root: 'inline-flex h-hell-control-md w-full cursor-pointer items-center gap-hell-3 rounded-hell-md border border-solid border-hell-border bg-hell-surface-elevated ps-hell-4 pe-hell-3 text-start font-[inherit] text-[13px] text-hell-foreground outline-none transition-[border-color,box-shadow] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] data-hover:border-hell-border-strong data-focus:border-hell-border-focus data-focus:shadow-[0_0_0_3px_var(--color-hell-focus-ring)] data-disabled:cursor-not-allowed data-disabled:bg-hell-surface-subtle data-disabled:text-hell-foreground-muted data-invalid:border-hell-danger',
} satisfies HellRecipe<'root'>;

const HELL_SELECT_VALUE_RECIPE = {
  root: 'min-w-0 flex-auto overflow-hidden text-ellipsis whitespace-nowrap',
} satisfies HellRecipe<'root'>;

const HELL_SELECT_PLACEHOLDER_RECIPE = {
  root: 'min-w-0 flex-auto overflow-hidden text-ellipsis whitespace-nowrap text-hell-foreground-muted',
} satisfies HellRecipe<'root'>;

const HELL_SELECT_DROPDOWN_RECIPE = {
  root: `fixed ${HELL_FLOATING_Z_POPOVER} flex max-h-[min(320px,var(--ngp-select-available-height,320px))] w-[var(--ngp-select-width,220px)] flex-col gap-px overflow-y-auto ${HELL_FLOATING_SURFACE} p-hell-2 ${HELL_FLOATING_POP_IN} origin-[var(--ngp-select-transform-origin,top)]`,
} satisfies HellRecipe<'root'>;

const HELL_SELECT_OPTION_RECIPE = hellOptionSurfaceRecipe();

const HELL_SELECT_RECIPE = {
  root: '',
  trigger: '',
  value: '',
  placeholder: '',
  dropdown: '',
  option: '',
} satisfies HellRecipe<HellSelectPart>;

/** Rich, headless select. Trigger element is the host of `[hellSelectTrigger]`;
 *  use ng-content to render the selected value (or a placeholder), pair
 *  with `[hellSelectDropdown]` inside a `*hellSelectPortal`, and emit
 *  `valueChange` to react to selection. For native `<select>` controls,
 *  use `[hellNativeSelect]` instead. */
@Directive({
  selector: '[hellSelectTrigger]',
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
      useExisting: forwardRef(() => HellSelectTrigger),
      multi: true,
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '(focusout)': 'markControlTouched($event)',
  },
})
export class HellSelectTrigger<T = unknown> implements ControlValueAccessor {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SELECT_TRIGGER_RECIPE,
  });

  private readonly select = inject(NgpSelect);
  private readonly selectState = injectSelectState<HellSelectFormValue<T>>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly valueAccessor = new HellControlValueAccessorBridge<HellSelectFormValue<T>>();
  private readonly floatingScope = new HellFloatingScopeRegistry();
  private dropdownOpen = false;

  constructor() {
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
    this.selectState().setValue(this.normalizeWriteValue(value), { emit: false });
  }

  registerOnChange(fn: (value: HellSelectFormValue<T>) => void): void {
    this.valueAccessor.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.valueAccessor.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.selectState().setDisabled(isDisabled);
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
export class HellSelectValue {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SELECT_VALUE_RECIPE,
  });
}

@Directive({
  selector: '[hellSelectPlaceholder]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellSelectPlaceholder {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SELECT_PLACEHOLDER_RECIPE,
  });
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
export class HellSelectDropdown implements OnDestroy {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SELECT_DROPDOWN_RECIPE,
  });

  private readonly dropdownElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly select = inject(HellSelectTrigger, { optional: true });
  private readonly basicSelect = inject(HellSelect, { optional: true });

  constructor() {
    hellRegisterFloatingHost();
    if (this.select) {
      this.select.registerDropdown(this.dropdownElement.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.select) {
      this.select.unregisterDropdown(this.dropdownElement.nativeElement);
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
export class HellSelectOption {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SELECT_OPTION_RECIPE,
  });

  private readonly option = inject(NgpSelectOption);
  protected readonly disabled = computed(() => this.option.disabled());
}

@Component({
  selector: 'hell-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideFormFieldState()],
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
  },
  imports: [
    HellSelectTrigger,
    HellSelectDropdown,
    HellSelectOption,
    HellSelectPortal,
    HellSelectPlaceholder,
    HellSelectValue,
  ],
  template: `
    <button
      hellSelectTrigger
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
          @for (option of options(); track option.value) {
            <div
              hellSelectOption
              data-slot="option"
              [ui]="part('option')"
              [value]="option.value"
              [disabled]="option.disabled ?? false"
            >
              {{ optionLabel(option) }}
            </div>
          }
        </div>
      </ng-template>
    </button>
  `,
})
export class HellSelect<T = unknown> implements ControlValueAccessor {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellSelectPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellSelectPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SELECT_RECIPE,
  });

  /** Options rendered by the preset; labels come from each option unless `displayWith` overrides. */
  readonly options = input<readonly HellOption<T>[]>([]);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly placeholder = input('Select');
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | null>(null, { alias: 'aria-describedby' });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly compareWith = input<HellOptionCompareWith<T>>((a, b) => a === b);
  /** Overrides option labels; also labels selected values missing from `options`. */
  readonly displayWith = input<HellOptionDisplayWith<T> | null>(null);
  readonly value = input<HellSelectFormValue<T> | null>(null);

  readonly valueChange = output<HellSelectFormValue<T>>();
  readonly openChange = output<boolean>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly innerSelect = viewChild(HellSelectTrigger);
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

  // Annotated: ng-packagr's d.ts flattener drops the @angular/core import for
  // types inferred through internal entry points, shipping unbound `Signal`.
  protected readonly effectiveValue: Signal<HellSelectFormValue<T>> = this.controlledValue.value;
  protected readonly effectiveDisabled: Signal<boolean> = this.controlledValue.disabled;
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
      return selectedValues.map((item) => this.labelFor(item)).join(', ');
    }

    if (value == null) return null;
    return this.labelFor(value as T);
  });

  /** Display text for one option row. */
  protected optionLabel(option: HellOption<T>): string {
    return this.displayWith()?.(option.value) ?? option.label;
  }

  /** Display text for a picked value: `displayWith`, else its option's label. */
  private labelFor(value: T): string {
    const override = this.displayWith();
    if (override) return override(value);
    const compare = this.compareWith();
    return this.options().find((option) => compare(option.value, value))?.label ?? String(value);
  }

  constructor() {
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

const HELL_NATIVE_SELECT_STATE_CLASSES =
  'outline-none transition-[border-color,box-shadow] duration-[var(--hell-duration-fast)] ease-hell-out data-hover:border-hell-border-strong data-focus:border-hell-border-focus data-focus:shadow-[0_0_0_3px_var(--color-hell-focus-ring)] focus:border-hell-border-focus focus:shadow-[0_0_0_3px_var(--color-hell-focus-ring)] disabled:cursor-not-allowed disabled:border-hell-border disabled:bg-hell-surface-subtle disabled:text-hell-foreground-muted data-disabled:cursor-not-allowed data-disabled:border-hell-border data-disabled:bg-hell-surface-subtle data-disabled:text-hell-foreground-muted aria-invalid:!border-hell-danger invalid:!border-hell-danger';

const HELL_NATIVE_SELECT_RECIPE = {
  root: `inline-flex h-hell-control-md w-full appearance-none rounded-hell-md border border-hell-border bg-hell-surface-elevated bg-[image:linear-gradient(45deg,transparent_50%,var(--color-hell-foreground-muted)_50%),linear-gradient(135deg,var(--color-hell-foreground-muted)_50%,transparent_50%)] bg-[length:4px_4px] bg-[position:calc(100%_-_12px)_50%,calc(100%_-_8px)_50%] bg-no-repeat ps-hell-4 pe-[calc(var(--spacing-hell-4)+1rem)] font-[inherit] text-[13px] text-hell-foreground ${HELL_NATIVE_SELECT_STATE_CLASSES} data-[size=sm]:h-hell-control-sm data-[size=sm]:ps-hell-3 data-[size=sm]:pe-[calc(var(--spacing-hell-3)+1rem)] data-[size=sm]:text-xs data-[size=lg]:h-hell-control-lg data-[size=lg]:ps-hell-5 data-[size=lg]:pe-[calc(var(--spacing-hell-5)+1rem)] data-[size=lg]:text-sm`,
} satisfies HellRecipe<'root'>;

/** Styled native `<select>` built on `NgpInput`, with a CSS-drawn chevron. */
@Directive({
  selector: 'select[hellNativeSelect]',
  hostDirectives: [{ directive: NgpInput, inputs: ['disabled', 'id'] }],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-size]': 'size()',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
  },
})
export class HellNativeSelect {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_NATIVE_SELECT_RECIPE,
  });

  /** Control size; `sm`, `md`, or `lg`. */
  readonly size = input<Exclude<HellSize, 'xs' | 'xl'>>('md');
  /** Marks the control invalid for styling and `aria-invalid`. */
  readonly invalid = input(false, { alias: 'invalid', transform: booleanAttribute });
}

export const HELL_SELECT_DIRECTIVES = [
  HellSelectTrigger,
  HellSelectValue,
  HellSelectPlaceholder,
  HellSelectDropdown,
  HellSelectPortal,
  HellSelectOption,
] as const;

