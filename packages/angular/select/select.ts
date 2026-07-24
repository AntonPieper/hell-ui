import {
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  untracked,
} from '@angular/core';
import { type FormValueControl } from '@angular/forms/signals';
import type { HellPickValue, HellSize, HellUiInput } from 'hell-ui/core';
import { hellOptionSurfaceRecipe } from 'hell-ui/internal/option';
import {
  HELL_FLOATING_POP_IN,
  HELL_FLOATING_SURFACE,
  HELL_FLOATING_Z_POPOVER,
} from 'hell-ui/internal/floating';
import {
  hellRegisterFloatingHost,
  hellNormalizePickValue,
  hellSamePickValue,
  HellPickerFocusScope,
  hellPartStyler,
  type HellRecipe,
} from 'hell-ui/internal/core';
import {
  NgpSelect,
  NgpSelectDropdown,
  NgpSelectOption,
  NgpSelectPortal,
  injectSelectState,
} from 'ng-primitives/select';
import { NgpInput } from 'ng-primitives/input';

const HELL_SELECT_RECIPE = {
  root: 'inline-flex h-hell-control-md w-full cursor-pointer items-center gap-hell-3 rounded-hell-md border border-solid border-hell-border bg-hell-surface-elevated ps-hell-4 pe-hell-3 text-start font-[family-name:inherit] text-[13px] text-hell-foreground outline-none transition-[border-color,box-shadow] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] data-hover:border-hell-border-strong data-focus:border-hell-border-focus data-focus:shadow-[0_0_0_3px_var(--color-hell-focus-ring)] data-disabled:cursor-not-allowed data-disabled:bg-hell-surface-subtle data-disabled:text-hell-foreground-muted data-invalid:border-hell-danger',
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

/**
 * Select-local coordination for the touched focus boundary and
 * portaled-dropdown containment. This class is deliberately unexported:
 * projected directives coordinate through DI without adding registration
 * methods to the public root.
 */
@Injectable()
class HellSelectController {
  private readonly select = inject(NgpSelect);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly scope = new HellPickerFocusScope({
    host: () => this.host.nativeElement,
    openChanges: this.select.openChange,
  });
  private onTouch: () => void = () => {};
  private readonly onFocusOut = (event: FocusEvent): void => {
    this.markControlTouched(event);
  };

  constructor() {
    this.scope.connect(this.destroyRef);
    this.host.nativeElement.addEventListener('focusout', this.onFocusOut);
    this.destroyRef.onDestroy(() => {
      this.host.nativeElement.removeEventListener('focusout', this.onFocusOut);
    });
  }

  /** Registers the root's touched notification for the focus boundary. */
  connectTouch(onTouch: () => void): void {
    this.onTouch = onTouch;
  }

  registerDropdown(dropdown: HTMLElement, destroyRef: DestroyRef): void {
    const onFocusOut = (event: FocusEvent): void => {
      this.markControlTouched(event);
    };
    this.scope.registerDropdown(dropdown);
    dropdown.addEventListener('focusout', onFocusOut);
    destroyRef.onDestroy(() => {
      dropdown.removeEventListener('focusout', onFocusOut);
      this.scope.unregisterDropdown(dropdown);
    });
  }

  private markControlTouched(event: FocusEvent): void {
    if (this.scope.isOutsideControl(event.relatedTarget)) {
      this.onTouch();
    }
  }
}

/**
 * Rich, projection-first select. The trigger element is the host of
 * `[hellSelect]`; project the selected domain value (or a placeholder) and
 * pair with `[hellSelectDropdown]` inside a `*hellSelectPortal`. For native
 * `<select>` controls, use `[hellNativeSelect]` instead.
 *
 * The `value` model is the select's one Control Value Authority — a shared
 * Pick Value: `T | null` in single mode, `readonly T[]` in multiple mode.
 * Bind it one-way (`[value]` plus `(valueChange)`), two-way (`[(value)]`),
 * or through Angular forms — Signal Forms `[formField]` via the
 * `FormValueControl` contract, and `formControl`/`ngModel` via Angular's
 * built-in Signal Forms interoperability. External writes synchronize into
 * `ng-primitives` through its public non-emitting `setValue` setter without
 * re-emitting a selection commit.
 */
@Directive({
  selector: '[hellSelect]',
  hostDirectives: [
    {
      directive: NgpSelect,
      inputs: [
        'ngpSelectMultiple:multiple',
        'ngpSelectCompareWith:compareWith',
        'ngpSelectDropdownPlacement:placement',
        'ngpSelectDropdownContainer:container',
        'ngpSelectDropdownFlip:flip',
        'ngpSelectOptions:options',
      ],
      outputs: ['ngpSelectOpenChange:openChange'],
    },
  ],
  providers: [HellSelectController],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellSelect<T = unknown> implements FormValueControl<HellPickValue<T>> {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SELECT_RECIPE,
  });

  /**
   * Committed Pick Value — the one Control Value Authority. User selections
   * write it exactly once per commit and emit `(valueChange)`; external
   * property, two-way, and form writes flow in without re-emitting. Defaults
   * to `null` (no selection in single mode, an empty selection in multiple
   * mode).
   */
  readonly value = model<HellPickValue<T>>(null);

  /** Whether the select is disabled. Also driven by bound forms. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Emits when focus leaves the trigger and its open dropdown entirely.
   * Angular forms listen to this output to mark the bound field or control
   * as touched.
   */
  readonly touch = output<void>();

  private readonly select = inject(NgpSelect);
  private readonly selectState = injectSelectState<HellPickValue<T>>();
  private readonly controller = inject(HellSelectController);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.controller.connectTouch(() => this.touch.emit());

    // External value writes (property, two-way, form) synchronize into the
    // primitive through its public non-emitting setter; the identity guard
    // keeps user selections (which the engine already holds) from writing
    // a normalized copy back.
    effect(() => {
      const state = this.selectState();
      const value = hellNormalizePickValue<T>(this.value(), this.select.multiple());
      if (hellSamePickValue<T>(state.value(), value)) return;
      untracked(() => state.setValue(value, { emit: false }));
    });

    effect(() => {
      const state = this.selectState();
      const disabled = this.disabled();
      if (state.disabled() === disabled) return;
      untracked(() => state.setDisabled(disabled));
    });

    const valueSub = this.select.valueChange.subscribe((value: HellPickValue<T> | undefined) => {
      this.value.set(hellNormalizePickValue<T>(value, this.select.multiple()));
    });
    this.destroyRef.onDestroy(() => valueSub.unsubscribe());
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
  },
})
export class HellSelectDropdown {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_SELECT_DROPDOWN_RECIPE,
  });

  private readonly dropdownElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly controller = inject(HellSelectController);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    hellRegisterFloatingHost();
    this.controller.registerDropdown(this.dropdownElement.nativeElement, this.destroyRef);
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

const HELL_NATIVE_SELECT_STATE_CLASSES =
  'outline-none transition-[border-color,box-shadow] duration-[var(--hell-duration-fast)] ease-hell-out data-hover:border-hell-border-strong data-focus:border-hell-border-focus data-focus:shadow-[0_0_0_3px_var(--color-hell-focus-ring)] focus:border-hell-border-focus focus:shadow-[0_0_0_3px_var(--color-hell-focus-ring)] disabled:cursor-not-allowed disabled:border-hell-border disabled:bg-hell-surface-subtle disabled:text-hell-foreground-muted data-disabled:cursor-not-allowed data-disabled:border-hell-border data-disabled:bg-hell-surface-subtle data-disabled:text-hell-foreground-muted aria-invalid:!border-hell-danger invalid:!border-hell-danger';

const HELL_NATIVE_SELECT_RECIPE = {
  root: `inline-flex h-hell-control-md w-full appearance-none rounded-hell-md border border-hell-border bg-hell-surface-elevated bg-[image:linear-gradient(45deg,transparent_50%,var(--color-hell-foreground-muted)_50%),linear-gradient(135deg,var(--color-hell-foreground-muted)_50%,transparent_50%)] bg-[length:4px_4px] bg-[position:calc(100%_-_12px)_50%,calc(100%_-_8px)_50%] bg-no-repeat ps-hell-4 pe-[calc(var(--spacing-hell-4)+1rem)] font-[family-name:inherit] text-[13px] text-hell-foreground ${HELL_NATIVE_SELECT_STATE_CLASSES} data-[size=sm]:h-hell-control-sm data-[size=sm]:ps-hell-3 data-[size=sm]:pe-[calc(var(--spacing-hell-3)+1rem)] data-[size=sm]:text-xs data-[size=lg]:h-hell-control-lg data-[size=lg]:ps-hell-5 data-[size=lg]:pe-[calc(var(--spacing-hell-5)+1rem)] data-[size=lg]:text-sm`,
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

/** All directives that make up the Select entry point, for bulk `imports`. */
export const HELL_SELECT_IMPORTS = [
  HellSelect,
  HellSelectValue,
  HellSelectPlaceholder,
  HellSelectDropdown,
  HellSelectPortal,
  HellSelectOption,
] as const;
