import {
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  booleanAttribute,
  computed,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  hellPartStyler,
  type HellPickValue,
  type HellRecipe,
  type HellUiInput,
} from '@hell-ui/angular/core';
import {
  hellRegisterFloatingHost,
  HellPickerControl,
} from '@hell-ui/angular/internal/core';
import {
  HELL_FLOATING_POP_IN,
  HELL_FLOATING_SURFACE,
} from '@hell-ui/angular/internal/floating';
import {
  writeComboboxStateDisabled,
  writeComboboxStateValue,
} from '@hell-ui/angular/internal/ng-primitives';
import { hellOptionSurfaceRecipe } from '@hell-ui/angular/internal/option';
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
  root: 'inline-flex h-hell-control-md w-full cursor-text items-center gap-0 rounded-hell-md border border-solid border-hell-border bg-hell-surface-elevated ps-hell-4 pe-0 font-[inherit] text-[13px] text-hell-foreground outline-none transition-[border-color,box-shadow] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] data-hover:border-hell-border-strong data-focus:border-hell-border-focus data-focus:shadow-[0_0_0_3px_var(--color-hell-focus-ring)] data-disabled:cursor-not-allowed data-disabled:bg-hell-surface-subtle data-disabled:text-hell-foreground-muted data-invalid:border-hell-danger',
} satisfies HellRecipe<'root'>;

const HELL_COMBOBOX_INPUT_RECIPE = {
  root: 'h-full min-w-0 flex-auto border-0 bg-transparent p-0 font-[inherit] text-[inherit] text-current outline-none placeholder:text-hell-foreground-muted',
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
 * Combobox-local coordination for forms, boundary clamping, and portaled
 * dropdown containment. Projected directives coordinate through DI so none of
 * the registration or containment machinery becomes a public extension API.
 */
@Injectable()
class HellComboboxController<T = unknown> {
  private readonly combobox = inject(NgpCombobox);
  private readonly comboboxState = injectComboboxState<NgpCombobox>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly control = new HellPickerControl<T>({
    host: () => this.host.nativeElement,
    multiple: () => this.combobox.multiple(),
    valueChanges: this.combobox.valueChange,
    openChanges: this.combobox.openChange,
    writeValue: (value) => writeComboboxStateValue(this.comboboxState(), value),
    setDisabled: (disabled) => writeComboboxStateDisabled(this.comboboxState(), disabled),
  });
  private readWrapNavigation: () => boolean = () => true;
  private readonly onFocusOut = (event: FocusEvent): void => {
    this.control.markControlTouched(event);
  };

  constructor() {
    this.control.connect(this.destroyRef);
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

  writeValue(value: HellPickValue<T>): void {
    this.control.writeValue(value);
  }

  registerOnChange(fn: (value: HellPickValue<T>) => void): void {
    this.control.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.control.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.control.setDisabledState(isDisabled);
  }

  registerDropdown(dropdown: HTMLElement, destroyRef: DestroyRef): void {
    const onFocusOut = (event: FocusEvent): void => {
      this.control.markControlTouched(event);
    };
    this.control.registerDropdown(dropdown);
    dropdown.addEventListener('focusout', onFocusOut);
    destroyRef.onDestroy(() => {
      dropdown.removeEventListener('focusout', onFocusOut);
      this.control.unregisterDropdown(dropdown);
    });
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
 */
@Directive({
  selector: '[hellCombobox]',
  exportAs: 'hellCombobox',
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
    HellComboboxController,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HellCombobox),
      multi: true,
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellCombobox<T = unknown> implements ControlValueAccessor {
  /** Tailwind class refinements for the root Public Part. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });
  /** Whether Arrow Up/Down wrap between the first and last enabled option. */
  readonly wrapNavigation = input(true, { transform: booleanAttribute });

  /** Merged Part-Class Pipeline classes for the root Public Part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_COMBOBOX_RECIPE,
  });

  private readonly controller = inject(HellComboboxController) as HellComboboxController<T>;

  constructor() {
    this.controller.configureWrapNavigation(() => this.wrapNavigation());
  }

  writeValue(value: HellPickValue<T>): void {
    this.controller.writeValue(value);
  }

  registerOnChange(fn: (value: HellPickValue<T>) => void): void {
    this.controller.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.controller.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.controller.setDisabledState(isDisabled);
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
export const HELL_COMBOBOX_DIRECTIVES = [
  HellCombobox,
  HellComboboxInput,
  HellComboboxButton,
  HellComboboxDropdown,
  HellComboboxPortal,
  HellComboboxOption,
  HellComboboxEmpty,
] as const;
