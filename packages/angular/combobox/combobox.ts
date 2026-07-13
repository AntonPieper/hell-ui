import { ChangeDetectionStrategy, Component, DestroyRef, Directive, ElementRef, Injectable, booleanAttribute, OnDestroy, computed, forwardRef, inject, input, output, signal, viewChild, type Signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HellControlledValueState } from '@hell-ui/angular/internal/core';
import { HellControlValueAccessorBridge } from '@hell-ui/angular/internal/core';
import { HellChip, HellChipRemove, HellChipSet } from '@hell-ui/angular/chip';
import { hellPartStyler, type HellOption, type HellOptionCompareWith, type HellOptionDisplayWith, type HellRecipe, type HellSize, type HellUi, type HellUiInput } from '@hell-ui/angular/core';
import { hellContainsFloatingTarget, hellRegisterFloatingHost, HellFloatingScopeRegistry } from '@hell-ui/angular/internal/core';
import { NgpCombobox, NgpComboboxButton, NgpComboboxDropdown, NgpComboboxInput, NgpComboboxOption, NgpComboboxPortal, injectComboboxState } from 'ng-primitives/combobox';
import { hellOptionSurfaceRecipe } from '@hell-ui/angular/internal/option';
<<<<<<< HEAD
import { writeComboboxStateDisabled, writeComboboxStateValue } from '@hell-ui/angular/internal/ng-primitives';
||||||| 7b91fa1b
import {
  writeComboboxStateDisabled,
  writeComboboxStateValue,
} from '@hell-ui/angular/internal/ng-primitives';
=======
import { HELL_FLOATING_POP_IN, HELL_FLOATING_SURFACE } from '@hell-ui/angular/internal/floating';
import {
  writeComboboxStateDisabled,
  writeComboboxStateValue,
} from '@hell-ui/angular/internal/ng-primitives';
>>>>>>> worktree-agent-afc3a8edeb97def97

export type HellComboboxSingleValue<T = unknown> = T | null;
export type HellComboboxMultipleValue<T = unknown> = readonly T[];
export type HellComboboxValue<T = unknown> =
  | HellComboboxSingleValue<T>
  | HellComboboxMultipleValue<T>;

/** Public parts of the HellComboboxChips module, styleable through its Part Style Map. */
export type HellComboboxChipsPart = 'root' | 'chip';
/** Part Style Map accepted by the HellComboboxChips `ui` input. */
export type HellComboboxChipsUi = HellUi<HellComboboxChipsPart>;

/** Public parts of the HellCombobox module, styleable through its Part Style Map. */
export type HellComboboxPart =
  | 'root'
  | 'control'
  | 'input'
  | 'button'
  | 'dropdown'
  | 'option'
  | 'empty';
/** Part Style Map accepted by the HellCombobox `ui` input. */
export type HellComboboxUi = HellUi<HellComboboxPart>;

const HELL_COMBOBOX_ROOT_RECIPE = {
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

const HELL_COMBOBOX_CHIPS_RECIPE = {
  // `display: contents` lets each chip flow as a direct flex child of the
  // combobox control, so selected tokens wrap and share the wrapper's gap
  // alongside the input instead of nesting in an extra layout box.
  root: 'contents',
  chip: 'max-w-full',
} satisfies HellRecipe<HellComboboxChipsPart>;

const HELL_COMBOBOX_RECIPE = {
  root: '',
  control: '',
  input: '',
  button: '',
  dropdown: '',
  option: '',
  empty: '',
} satisfies HellRecipe<HellComboboxPart>;

/**
 * Combobox-owned coordination seam between `HellComboboxRoot` and its chips
 * presentation. Provided by the combobox host so the chips directive and the
 * input can read the live selection, register a chips presentation, and route
 * removals without those members appearing on the combobox's public API (the
 * same registry seam the chip set uses for its items). Not exported from the
 * entry point.
 *
 * Removals write the selection state and emit `valueChange` in one step — the
 * net effect of toggling an option — so the emitted form value, the options'
 * `aria-selected` state, and the rendered chips never diverge, even for values
 * whose option has been filtered out of the dropdown.
 */
@Injectable()
class HellComboboxSelectionController {
  private readonly combobox = inject(NgpCombobox);
  private readonly comboboxState = injectComboboxState<NgpCombobox>();
  private readonly chipsPresenterCount = signal(0);

  /** Whether a chips presentation is mounted (enables Backspace-on-empty removal). */
  readonly chipsActive = computed(() => this.chipsPresenterCount() > 0);
  /** Effective disabled state, reflecting both the `disabled` input and CVA writes. */
  readonly disabled = computed(() => this.comboboxState().disabled());
  /** Current selection normalized to an array for chip rendering. */
  readonly selectedValues = computed<readonly unknown[]>(() => this.readSelectedValues());

  /** Registers a chips presentation so the input enables Backspace-on-empty removal. */
  registerChipsPresenter(): void {
    this.chipsPresenterCount.update((count) => count + 1);
  }

  /** Unregisters a chips presentation when it leaves the DOM. */
  unregisterChipsPresenter(): void {
    this.chipsPresenterCount.update((count) => Math.max(count - 1, 0));
  }

  /** Removes one value, routing the change through combobox selection state. */
  removeValue(value: unknown): void {
    if (this.comboboxState().disabled()) return;
    const compare = this.combobox.compareWith();
    const next = this.readSelectedValues().filter((candidate) => !compare(candidate, value));
    this.commitSelection(next);
  }

  /** Removes the last selected value (Backspace in the empty input). */
  removeLastValue(): void {
    const values = this.readSelectedValues();
    if (!values.length) return;
    this.removeValue(values[values.length - 1]);
  }

  private commitSelection(next: readonly unknown[]): void {
    writeComboboxStateValue(this.comboboxState(), next);
    this.combobox.valueChange.emit(next);
  }

  private readSelectedValues(): readonly unknown[] {
    const value = this.comboboxState().value();
    if (Array.isArray(value)) return value;
    return value == null ? [] : [value];
  }
}

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
    HellComboboxSelectionController,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HellComboboxRoot),
      multi: true,
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '(focusout)': 'markControlTouched($event)',
  },
})
export class HellComboboxRoot<T = unknown> implements ControlValueAccessor {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });
  /** Whether Arrow Up/Down wrap between the first and last enabled option. */
  readonly wrapNavigation = input(true, { transform: booleanAttribute });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_COMBOBOX_ROOT_RECIPE,
  });

  private readonly combobox = inject(NgpCombobox);
  private readonly comboboxState = injectComboboxState<NgpCombobox>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly valueAccessor = new HellControlValueAccessorBridge<HellComboboxValue<T>>();
  private readonly floatingScope = new HellFloatingScopeRegistry();
  private dropdownOpen = false;

  constructor() {
    this.host.nativeElement.addEventListener('keydown', this.clampNavigation, { capture: true });
    const valueSub = this.combobox.valueChange.subscribe((value) => {
      this.valueAccessor.emitValue(this.normalizeValue(value));
    });
    const openSub = this.combobox.openChange.subscribe((open) => {
      this.dropdownOpen = open;
    });
    this.destroyRef.onDestroy(() => {
      this.host.nativeElement.removeEventListener('keydown', this.clampNavigation, { capture: true });
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

  private readonly clampNavigation = (event: KeyboardEvent): void => {
    if (this.wrapNavigation() || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return;
    if (!(event.target instanceof HTMLInputElement)) return;
    const activeId = event.target.getAttribute('aria-activedescendant');
    const activeOption = activeId ? event.target.ownerDocument.getElementById(activeId) : null;
    const listbox = activeOption?.closest('[role="listbox"]');
    if (!activeOption || !listbox) return;
    const enabled = Array.from(listbox.querySelectorAll<HTMLElement>('[role="option"]'))
      .filter((option) => option.getAttribute('aria-disabled') !== 'true' && !option.hasAttribute('data-disabled'));
    const first = enabled[0];
    const last = enabled.at(-1);
    const atBoundary =
      (event.key === 'ArrowUp' && activeOption === first) ||
      (event.key === 'ArrowDown' && activeOption === last);
    if (!atBoundary) return;
    event.preventDefault();
    event.stopPropagation();
  };

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
    '(keydown)': 'onKeydown($event)',
  },
})
export class HellComboboxInput {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_COMBOBOX_INPUT_RECIPE,
  });

  private readonly host = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly selection = inject(HellComboboxSelectionController, { optional: true });

  /**
   * Removes the last selection when Backspace is pressed in the empty input and
   * a chips presentation is mounted, mirroring the chip set's Backspace removal.
   * Without a chips presentation the input keeps its native Backspace behavior.
   */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Backspace' || event.defaultPrevented) return;
    if (!this.selection?.chipsActive()) return;
    if (this.host.nativeElement.value !== '') return;
    this.selection.removeLastValue();
  }
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
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_COMBOBOX_BUTTON_RECIPE,
  });
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
export class HellComboboxDropdown implements OnDestroy {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_COMBOBOX_DROPDOWN_RECIPE,
  });

  private readonly dropdown = inject(NgpComboboxDropdown);
  private readonly combobox = inject(HellComboboxRoot, { optional: true });
  private readonly basicCombobox = inject(HellCombobox, { optional: true });

  constructor() {
    hellRegisterFloatingHost();
    if (this.combobox) {
      this.combobox.registerDropdown(this.dropdown.elementRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.combobox) {
      this.combobox.unregisterDropdown(this.dropdown.elementRef.nativeElement);
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
export class HellComboboxOption {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_COMBOBOX_OPTION_RECIPE,
  });

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
export class HellComboboxEmpty {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_COMBOBOX_EMPTY_RECIPE,
  });
}

/**
 * Chips presentation for a multiple-mode `hellCombobox`. Place it inside the
 * combobox control, before the `hellComboboxInput`, to render each selected
 * value as a removable chip composed from the `@hell-ui/angular/chip` primitive
 * (`hellChip` / `hellChipRemove`).
 *
 * Removal — via a chip's remove button or Backspace in the empty input — routes
 * through the combobox's selection state, so the emitted form value, the
 * options' `aria-selected` state, and the rendered chips never diverge. A
 * disabled combobox disables every chip's remove button.
 *
 * The presentation host composes `HellChipSet`, making the chips one roving
 * tab stop with Arrow Left/Right and Home/End navigation. Delete/Backspace on
 * the focused chip requests its removal and moves focus to a surviving chip
 * (or back to this host when none remain).
 *
 * Each remove button is a bare `hellChipRemove` with no projected content, so
 * it renders the chip primitive's built-in `×` glyph and derives its accessible
 * name (`Remove {label}`) from the chip's rendered label — the label is written
 * once, as the chip's content, and never restated. Pass `[displayWith]` to
 * label chips when a value's string form is not the label you want; refine the
 * `root` and `chip` parts through the Part Style Map. The remove button is the
 * chip primitive's own `hellChipRemove` part — style it through the chip entry
 * point rather than here, so its built-in `:empty` glyph keeps rendering.
 */
@Component({
  selector: '[hellComboboxChips]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [HellChipSet],
  imports: [HellChip, HellChipRemove],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
  template: `
    @for (chip of chips(); track chip.value) {
      <span
        hellChip
        data-slot="chip"
        [ui]="part('chip')"
        [size]="size()"
        [disabled]="disabled()"
        (remove)="removeChip(chip.value)"
      >
        {{ chip.label }}<button hellChipRemove></button>
      </span>
    }
  `,
})
export class HellComboboxChips<T = unknown> {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellComboboxChipsPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellComboboxChipsPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_COMBOBOX_CHIPS_RECIPE,
  });

  /**
   * Maps a selected value to its chip label — the chip's visible text, which
   * the chip Label Contract also reuses as the remove button's accessible name
   * (`Remove {label}`). Defaults to `String`.
   */
  readonly displayWith = input<HellOptionDisplayWith<T>>((value) => String(value));
  /** Size of the rendered chips. Defaults to `sm`. */
  readonly size = input<HellSize>('sm');

  private readonly selection = inject(HellComboboxSelectionController, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /** Whether the owning combobox is disabled, which also disables chip removal. */
  protected readonly disabled = computed(() => this.selection?.disabled() ?? false);

  /** Selected values paired with their display labels. */
  protected readonly chips = computed(() =>
    (this.selection?.selectedValues() ?? []).map((value) => ({
      value,
      label: this.displayWith()(value as T),
    })),
  );

  constructor() {
    this.selection?.registerChipsPresenter();
    this.destroyRef.onDestroy(() => this.selection?.unregisterChipsPresenter());
  }

  /** Routes a chip removal through the combobox selection state. */
  protected removeChip(value: unknown): void {
    this.selection?.removeValue(value);
  }
}

/**
 * Convenience combobox that composes `hellCombobox`, `hellComboboxInput`,
 * `hellComboboxButton`, and portal/dropdown patterns into a simple list
 * component.
 */
@Component({
  selector: 'hell-combobox',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  },
  imports: [
    HellComboboxRoot,
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
        @for (option of filteredOptions(); track option.value) {
          <div
            hellComboboxOption
            data-slot="option"
            [ui]="part('option')"
            [value]="option.value"
            [disabled]="option.disabled ?? false"
          >
            {{ optionLabel(option) }}
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
export class HellCombobox<T = unknown> implements ControlValueAccessor {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellComboboxPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellComboboxPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_COMBOBOX_RECIPE,
  });

  /** Options rendered by the preset; labels come from each option unless `displayWith` overrides. */
  readonly options = input<readonly HellOption<T>[]>([]);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly allowDeselect = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly placeholder = input('Search');
  readonly toggleLabel = input('Toggle options');
  readonly emptyLabel = input('No matches');
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  readonly compareWith = input<HellOptionCompareWith<T>>((a, b) => a === b);
  /** Overrides option labels; also labels selected values missing from `options`. */
  readonly displayWith = input<HellOptionDisplayWith<T> | null>(null);
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
  private readonly combobox = viewChild(HellComboboxRoot);

  // Annotated: ng-packagr's d.ts flattener drops the @angular/core import for
  // types inferred through internal entry points, shipping unbound `Signal`.
  protected readonly effectiveValue: Signal<HellComboboxValue<T>> = this.controlledValue.value;
  protected readonly effectiveDisabled: Signal<boolean> = this.controlledValue.disabled;

  protected readonly selectedLabel = computed(() => {
    const value = this.effectiveValue();
    if (this.multiple()) {
      const selectedValues = Array.isArray(value) ? value : value == null ? [] : [value as T];
      if (!selectedValues.length) return '';
      return selectedValues.map((item) => this.labelFor(item)).join(', ');
    }

    if (value == null) return '';
    return this.labelFor(value as T);
  });

  protected readonly filterValue = computed(() => this.filterOverride() ?? this.selectedLabel());

  protected readonly filteredOptions = computed(() => {
    const term = this.filterValue().trim().toLowerCase();
    if (!term) return this.options();
    return this.options().filter((option) =>
      this.optionLabel(option).toLowerCase().includes(term),
    );
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
  HellComboboxRoot,
  HellComboboxInput,
  HellComboboxButton,
  HellComboboxDropdown,
  HellComboboxPortal,
  HellComboboxOption,
  HellComboboxEmpty,
  HellComboboxChips,
] as const;

