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
import { containsNode } from '../../core/dom';
import { HellControlValueAccessorBridge } from '../../core/control-value-accessor';
import { HellStyleable } from '../../core/styleable';
import { hellRegisterFloatingHost } from '../../core/floating-scope';
import {
  NgpCombobox,
  NgpComboboxButton,
  NgpComboboxDropdown,
  NgpComboboxInput,
  NgpComboboxOption,
  NgpComboboxPortal,
  injectComboboxState,
} from 'ng-primitives/combobox';
import { writeComboboxStateDisabled, writeComboboxStateValue } from '../adapters/ngp-state-adapters';

export type HellComboboxSingleValue<T = unknown> = T | null;
export type HellComboboxMultipleValue<T = unknown> = readonly T[];
export type HellComboboxValue<T = unknown> = HellComboboxSingleValue<T> | HellComboboxMultipleValue<T>;
export type HellComboboxDisplayWith<T = unknown> = (value: T) => string;
export type HellComboboxCompareWith<T = unknown> = (a: T, b: T) => boolean;

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
    '[class.hell-combobox]': '!unstyled()',
    '(focusout)': 'markControlTouched($event)',
  },
})
export class HellCombobox<T = unknown> extends HellStyleable implements ControlValueAccessor {
  private readonly combobox = inject(NgpCombobox);
  private readonly comboboxState = injectComboboxState<NgpCombobox>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cva = new HellControlValueAccessorBridge<HellComboboxValue<T>>();
  private readonly dropdowns = new Set<HTMLElement>();

  constructor() {
    super();
    const valueSub = this.combobox.valueChange.subscribe((value) => {
      this.cva.emitValue(this.normalizeValue(value));
    });
    this.destroyRef.onDestroy(() => valueSub.unsubscribe());
  }

  writeValue(value: HellComboboxValue<T>): void {
    writeComboboxStateValue(this.comboboxState(), this.normalizeWriteValue(value));
  }

  registerOnChange(fn: (value: HellComboboxValue<T>) => void): void {
    this.cva.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.cva.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    writeComboboxStateDisabled(this.comboboxState(), isDisabled);
  }

  isOutsideControl(next: EventTarget | Node | null): boolean {
    const open = this.comboboxState().open();
    if (containsNode(this.host.nativeElement, next)) {
      return false;
    }

    if (!open) {
      return true;
    }

    for (const dropdown of this.dropdowns) {
      if (containsNode(dropdown, next)) {
        return false;
      }
    }

    return true;
  }

  markControlTouched(event: FocusEvent): void {
    if (this.isOutsideControl(event.relatedTarget)) {
      this.cva.markTouched();
    }
  }

  registerDropdown(dropdown: HTMLElement): void {
    this.dropdowns.add(dropdown);
  }

  unregisterDropdown(dropdown: HTMLElement): void {
    this.dropdowns.delete(dropdown);
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
    '[class.hell-combobox-input]': '!unstyled()',
  },
})
export class HellComboboxInput extends HellStyleable {}

/** Toggle button for opening and closing the combobox dropdown. */
@Directive({
  selector: 'button[hellComboboxButton]',
  hostDirectives: [NgpComboboxButton],
  host: {
    '[class.hell-combobox-button]': '!unstyled()',
  },
})
export class HellComboboxButton extends HellStyleable {}

/**
 * Floating dropdown surface for combobox options. Registers with any active
 * Hell Floating Scope so parent floating controls do not treat option clicks as
 * outside interactions.
 */
@Directive({
  selector: '[hellComboboxDropdown]',
  hostDirectives: [NgpComboboxDropdown],
  host: {
    '[class.hell-combobox-dropdown]': '!unstyled()',
    '(focusout)': 'markControlTouched($event)',
  },
})
export class HellComboboxDropdown extends HellStyleable implements OnDestroy {
  private readonly dropdown = inject(NgpComboboxDropdown);
  private readonly select = inject(HellCombobox, { optional: true });
  private readonly basicCombobox = inject(HellComboboxBasic, { optional: true });

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
    '[class.hell-combobox-option]': '!unstyled()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
  },
})
export class HellComboboxOption extends HellStyleable {
  private readonly option = inject(NgpComboboxOption);
  protected readonly disabled = computed(() => this.option.disabled());
}

@Directive({
  selector: '[hellComboboxEmpty]',
  host: { '[class.hell-combobox-empty]': '!unstyled()' },
})
export class HellComboboxEmpty extends HellStyleable {}

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
    '[class.hell-combobox-basic]': '!unstyled()',
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
      [unstyled]="unstyled()"
      [value]="effectiveValue()"
      [multiple]="multiple()"
      [allowDeselect]="allowDeselect()"
      [compareWith]="compareWith()"
      [disabled]="effectiveDisabled()"
      (focusout)="markControlTouched($event)"
      (openChange)="onOpenChange($event)"
      (valueChange)="onValueChange($event)"
    >
      <input
        hellComboboxInput
        [unstyled]="unstyled()"
        [value]="filter()"
        [placeholder]="placeholder()"
        [attr.aria-label]="ariaLabel()"
        (input)="onFilterInput($any($event.target).value)"
      />
      <button
        hellComboboxButton
        [unstyled]="unstyled()"
        type="button"
        [attr.aria-label]="toggleLabel()"
      ></button>
      <div *hellComboboxPortal hellComboboxDropdown [unstyled]="unstyled()">
        @for (option of filteredOptions(); track option) {
          <div hellComboboxOption [value]="option" [unstyled]="unstyled()">
            {{ displayWith()(option) }}
          </div>
        } @empty {
          <div hellComboboxEmpty [unstyled]="unstyled()">{{ emptyLabel() }}</div>
        }
      </div>
    </div>
  `,
})
export class HellComboboxBasic<T = unknown> extends HellStyleable implements ControlValueAccessor {
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
  private readonly cva = new HellControlValueAccessorBridge<HellComboboxValue<T>>();
  private readonly controlMode = signal(false);
  private readonly controlValue = signal<HellComboboxValue<T> | null>(null);
  private readonly controlDisabled = signal(false);
  private readonly filterOverride = signal<string | null>(null);
  private readonly combobox = viewChild(HellCombobox);

  protected readonly effectiveValue = computed(() =>
    this.controlMode() ? this.controlValue() : this.value(),
  );
  protected readonly effectiveDisabled = computed(() => this.disabled() || this.controlDisabled());

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
    if (this.controlMode()) {
      this.controlValue.set(next);
    }
    this.valueChange.emit(next);
    this.cva.emitValue(next);
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
      : !containsNode(this.host.nativeElement, event.relatedTarget);

    if (outside) this.cva.markTouched();
  }

  writeValue(value: HellComboboxValue<T>): void {
    this.controlMode.set(true);
    this.controlValue.set(this.normalizeWriteValue(value));
    this.filterOverride.set(null);
  }

  registerOnChange(fn: (value: HellComboboxValue<T>) => void): void {
    this.cva.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.cva.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlDisabled.set(isDisabled);
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
