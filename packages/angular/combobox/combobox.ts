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
import type {
  HellPickValue,
  HellUiInput,
} from 'hell-ui/core';
import {
  hellRegisterFloatingHost,
  hellNormalizePickValue,
  hellSamePickValue,
  HellPickerFocusScope,
  hellPartStyler,
  type HellRecipe,
} from 'hell-ui/internal/core';
import {
  HELL_FLOATING_POP_IN,
  HELL_FLOATING_SURFACE,
} from 'hell-ui/internal/floating';
import {
  writeComboboxStateDisabled,
  writeComboboxStateValue,
} from 'hell-ui/internal/ng-primitives';
import { hellOptionSurfaceRecipe } from 'hell-ui/internal/option';
import {
  NgpCombobox,
  NgpComboboxButton,
  NgpComboboxDropdown,
  NgpComboboxInput,
  NgpComboboxOption,
  NgpComboboxPortal,
  injectComboboxState,
} from 'ng-primitives/combobox';

const HELL_COMBOBOX_RECIPE = {
  root: 'inline-flex h-hell-control-md w-full cursor-text items-center gap-0 rounded-hell-md border border-solid border-hell-border bg-hell-surface-elevated ps-hell-4 pe-0 font-[family-name:inherit] text-[13px] text-hell-foreground outline-none transition-[border-color,box-shadow] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] data-hover:border-hell-border-strong data-focus:border-hell-border-focus data-focus:shadow-[0_0_0_3px_var(--color-hell-focus-ring)] data-disabled:cursor-not-allowed data-disabled:bg-hell-surface-subtle data-disabled:text-hell-foreground-muted data-invalid:border-hell-danger',
} satisfies HellRecipe<'root'>;

const HELL_COMBOBOX_INPUT_RECIPE = {
  root: 'h-full min-w-0 flex-auto border-0 bg-transparent p-0 font-[family-name:inherit] text-[inherit] text-current outline-none placeholder:text-hell-foreground-muted',
} satisfies HellRecipe<'root'>;

const HELL_COMBOBOX_BUTTON_RECIPE = {
  root: 'inline-flex h-full w-hell-control-md shrink-0 cursor-pointer items-center justify-center rounded-ee-[inherit] rounded-se-[inherit] border-0 border-s border-s-transparent bg-transparent p-0 text-hell-foreground-muted outline-none data-hover:text-hell-foreground',
} satisfies HellRecipe<'root'>;

const HELL_COMBOBOX_DROPDOWN_RECIPE = {
  root: `fixed flex max-h-[min(320px,var(--ngp-combobox-available-height,320px))] w-[var(--ngp-combobox-width,var(--ngp-combobox-input-width,220px))] flex-col gap-px overflow-y-auto ${HELL_FLOATING_SURFACE} p-hell-2 ${HELL_FLOATING_POP_IN} origin-[var(--ngp-combobox-transform-origin,top)]`,
} satisfies HellRecipe<'root'>;

const HELL_COMBOBOX_OPTION_RECIPE = hellOptionSurfaceRecipe();

const HELL_COMBOBOX_EMPTY_RECIPE = {
  root: 'px-[calc(var(--spacing)*2.5)] py-[calc(var(--spacing)*2)] text-xs text-hell-foreground-subtle',
} satisfies HellRecipe<'root'>;

/**
 * Combobox-local coordination for the touched focus boundary, boundary
 * clamping, and portaled dropdown containment. Projected directives
 * coordinate through DI so none of the registration or containment machinery
 * becomes a public extension API.
 */
@Injectable()
class HellComboboxController {
  private readonly combobox = inject(NgpCombobox);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly scope = new HellPickerFocusScope({
    host: () => this.host.nativeElement,
    openChanges: this.combobox.openChange,
  });
  private onTouch: () => void = () => {};
  private readWrapNavigation: () => boolean = () => true;
  private readonly onFocusOut = (event: FocusEvent): void => {
    this.markControlTouched(event);
  };

  constructor() {
    this.scope.connect(this.destroyRef);
    this.host.nativeElement.addEventListener('focusout', this.onFocusOut);
    this.host.nativeElement.addEventListener('keydown', this.clampNavigation, {
      capture: true,
    });
    this.destroyRef.onDestroy(() => {
      this.host.nativeElement.removeEventListener('focusout', this.onFocusOut);
      this.host.nativeElement.removeEventListener('keydown', this.clampNavigation, {
        capture: true,
      });
    });
  }

  configureWrapNavigation(readWrapNavigation: () => boolean): void {
    this.readWrapNavigation = readWrapNavigation;
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

  private readonly clampNavigation = (event: KeyboardEvent): void => {
    if (
      this.readWrapNavigation() ||
      (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')
    ) {
      return;
    }
    if (!(event.target instanceof HTMLInputElement)) return;
    const activeId = event.target.getAttribute('aria-activedescendant');
    const activeOption = activeId ? event.target.ownerDocument.getElementById(activeId) : null;
    const listbox = activeOption?.closest('[role="listbox"]');
    if (!activeOption || !listbox) return;
    const enabled = Array.from(listbox.querySelectorAll<HTMLElement>('[role="option"]')).filter(
      (option) =>
        option.getAttribute('aria-disabled') !== 'true' &&
        !option.hasAttribute('data-disabled'),
    );
    const first = enabled[0];
    const last = enabled.at(-1);
    const atBoundary =
      (event.key === 'ArrowUp' && activeOption === first) ||
      (event.key === 'ArrowDown' && activeOption === last);
    if (!atBoundary) return;
    event.preventDefault();
    event.stopPropagation();
  };
}

/**
 * Rich, projection-first combobox. The consumer owns the editable input,
 * domain option markup, search state, status chrome, and selected-value
 * presentation while ng-primitives owns the combobox interaction semantics.
 *
 * The `value` model is the combobox's one Control Value Authority — a shared
 * Pick Value: `T | null` in single mode, `readonly T[]` in multiple mode.
 * Bind it one-way (`[value]` plus `(valueChange)`), two-way (`[(value)]`),
 * or through Angular forms — Signal Forms `[formField]` via the
 * `FormValueControl` contract, and `formControl`/`ngModel` via Angular's
 * built-in Signal Forms interoperability. External writes synchronize into
 * `ng-primitives` through the accepted guarded state adapter without
 * re-emitting a selection commit; search text, the active option, and the
 * overlay open state stay interaction state.
 */
@Directive({
  selector: '[hellCombobox]',
  exportAs: 'hellCombobox',
  hostDirectives: [
    {
      directive: NgpCombobox,
      inputs: [
        'ngpComboboxMultiple:multiple',
        'ngpComboboxAllowDeselect:allowDeselect',
        'ngpComboboxCompareWith:compareWith',
        'ngpComboboxDropdownPlacement:placement',
        'ngpComboboxDropdownContainer:container',
        'ngpComboboxDropdownFlip:flip',
        'ngpComboboxOptions:options',
      ],
      outputs: ['ngpComboboxOpenChange:openChange'],
    },
  ],
  providers: [HellComboboxController],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellCombobox<T = unknown> implements FormValueControl<HellPickValue<T>> {
  /** Tailwind class refinements for the root Public Part. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });
  /** Whether Arrow Up/Down wrap between the first and last enabled option. */
  readonly wrapNavigation = input(true, { transform: booleanAttribute });

  /** Merged Part-Class Pipeline classes for the root Public Part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_COMBOBOX_RECIPE,
  });

  /**
   * Committed Pick Value — the one Control Value Authority. User selections
   * write it exactly once per commit and emit `(valueChange)`; external
   * property, two-way, and form writes flow in without re-emitting. Defaults
   * to `null` (no selection in single mode, an empty selection in multiple
   * mode).
   */
  readonly value = model<HellPickValue<T>>(null);

  /** Whether the combobox is disabled. Also driven by bound forms. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Emits when focus leaves the control and its open dropdown entirely.
   * Angular forms listen to this output to mark the bound field or control
   * as touched.
   */
  readonly touch = output<void>();

  private readonly combobox = inject(NgpCombobox);
  private readonly comboboxState = injectComboboxState<NgpCombobox>();
  private readonly controller = inject(HellComboboxController);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.controller.configureWrapNavigation(() => this.wrapNavigation());
    this.controller.connectTouch(() => this.touch.emit());

    // External value writes (property, two-way, form) synchronize into the
    // primitive through the guarded state adapter; the identity guard keeps
    // user selections (which the engine already holds) from writing a
    // normalized copy back.
    effect(() => {
      const state = this.comboboxState();
      const value = hellNormalizePickValue<T>(this.value(), this.combobox.multiple());
      if (hellSamePickValue<T>(state.value() as HellPickValue<T> | undefined, value)) return;
      untracked(() => writeComboboxStateValue(state, value));
    });

    effect(() => {
      const state = this.comboboxState();
      const disabled = this.disabled();
      if (state.disabled() === disabled) return;
      untracked(() => writeComboboxStateDisabled(state, disabled));
    });

    const valueSub = this.combobox.valueChange.subscribe(
      (value: HellPickValue<T> | undefined) => {
        this.value.set(hellNormalizePickValue<T>(value, this.combobox.multiple()));
      },
    );
    this.destroyRef.onDestroy(() => valueSub.unsubscribe());
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
export class HellComboboxInput {
  /** Tailwind class refinements for the root Public Part. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for the root Public Part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_COMBOBOX_INPUT_RECIPE,
  });
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
export class HellComboboxButton {
  /** Tailwind class refinements for the root Public Part. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for the root Public Part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_COMBOBOX_BUTTON_RECIPE,
  });
}

/** Floating listbox surface for projected combobox options. */
@Directive({
  selector: '[hellComboboxDropdown]',
  hostDirectives: [NgpComboboxDropdown],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellComboboxDropdown {
  /** Tailwind class refinements for the root Public Part. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for the root Public Part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_COMBOBOX_DROPDOWN_RECIPE,
  });

  private readonly dropdownElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly controller = inject(HellComboboxController);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    hellRegisterFloatingHost();
    this.controller.registerDropdown(this.dropdownElement.nativeElement, this.destroyRef);
  }
}

/** Structural directive that portals the dropdown while the combobox is open. */
@Directive({
  selector: '[hellComboboxPortal]',
  hostDirectives: [NgpComboboxPortal],
})
export class HellComboboxPortal {}

/** Selectable, consumer-rendered domain option. */
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
export class HellComboboxOption {
  /** Tailwind class refinements for the root Public Part. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for the root Public Part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_COMBOBOX_OPTION_RECIPE,
  });

  private readonly option = inject(NgpComboboxOption);
  protected readonly disabled = computed(() => this.option.disabled());
}

/** Consumer-owned no-results or empty-state surface. */
@Directive({
  selector: '[hellComboboxEmpty]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellComboboxEmpty {
  /** Tailwind class refinements for the root Public Part. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for the root Public Part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_COMBOBOX_EMPTY_RECIPE,
  });
}

/** All projection-first Combobox directives, for bulk imports. */
export const HELL_COMBOBOX_IMPORTS = [
  HellCombobox,
  HellComboboxInput,
  HellComboboxButton,
  HellComboboxDropdown,
  HellComboboxPortal,
  HellComboboxOption,
  HellComboboxEmpty,
] as const;
