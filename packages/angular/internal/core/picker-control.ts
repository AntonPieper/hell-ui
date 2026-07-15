import type { DestroyRef } from '@angular/core';

import { HellControlValueAccessorBridge } from './control-value-accessor';
import { HellFloatingScopeRegistry, hellContainsFloatingTarget } from './floating-scope';
import type {
  HellPickMultipleValue,
  HellPickSingleValue,
  HellPickValue,
} from './pick-value';

/** Normalizes an engine-emitted single pick value: nullish commits a clear. */
export function hellNormalizePickSingleValue<T>(value: unknown): HellPickSingleValue<T> {
  if (value == null) return null;
  return value as T;
}

/** Normalizes an engine-emitted multiple pick value to a fresh array. */
export function hellNormalizePickMultipleValue<T>(value: unknown): HellPickMultipleValue<T> {
  if (value == null) return [];
  if (Array.isArray(value)) return [...value];
  return [value as T];
}

/** Normalizes a pick value against the picker's current mode. */
export function hellNormalizePickValue<T>(value: unknown, multiple: boolean): HellPickValue<T> {
  if (multiple) return hellNormalizePickMultipleValue<T>(value);
  return hellNormalizePickSingleValue<T>(value);
}

/** Structural stream shape shared by the picker engines' outputs. */
export interface HellPickerEngineStream<TValue> {
  subscribe(next: (value: TValue) => void): { unsubscribe(): void };
}

/**
 * Adapter one picker engine (ngp select, ngp combobox) presents to the shared
 * control plumbing. `writeValue` must write into the engine without
 * re-emitting, and `host` anchors outside-control checks.
 */
export interface HellPickerEngineAdapter<T> {
  /** Host element that anchors outside-control focus checks. */
  readonly host: () => HTMLElement;
  /** Whether the engine is currently in multiple mode. */
  readonly multiple: () => boolean;
  /** Engine value emissions, re-emitted to the form after normalization. */
  readonly valueChanges: HellPickerEngineStream<unknown>;
  /** Engine open emissions; an open dropdown counts as inside the control. */
  readonly openChanges: HellPickerEngineStream<boolean>;
  /** Writes a normalized form value into the engine without re-emitting. */
  readonly writeValue: (value: HellPickValue<T>) => void;
  /** Writes the form disabled state into the engine. */
  readonly setDisabled: (disabled: boolean) => void;
}

/**
 * Shared ControlValueAccessor + dropdown-registration plumbing for the
 * headless picker roots (select root, combobox root). Owns the CVA bridge,
 * the floating-scope registry that makes a portaled dropdown count as
 * "inside", and the mode-aware value normalization, so each picker only
 * supplies its engine adapter.
 */
export class HellPickerControl<T> {
  private readonly valueAccessor = new HellControlValueAccessorBridge<HellPickValue<T>>();
  private readonly floatingScope = new HellFloatingScopeRegistry();
  private dropdownOpen = false;

  constructor(private readonly engine: HellPickerEngineAdapter<T>) {}

  /** Subscribes to the engine streams until `destroyRef` tears down. */
  connect(destroyRef: DestroyRef): void {
    const valueSub = this.engine.valueChanges.subscribe((value) => {
      this.valueAccessor.emitValue(hellNormalizePickValue<T>(value, this.engine.multiple()));
    });
    const openSub = this.engine.openChanges.subscribe((open) => {
      this.dropdownOpen = open;
    });
    destroyRef.onDestroy(() => {
      valueSub.unsubscribe();
      openSub.unsubscribe();
    });
  }

  writeValue(value: HellPickValue<T>): void {
    this.engine.writeValue(hellNormalizePickValue<T>(value, this.engine.multiple()));
  }

  registerOnChange(fn: (value: HellPickValue<T>) => void): void {
    this.valueAccessor.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.valueAccessor.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.engine.setDisabled(isDisabled);
  }

  /** Whether `next` is outside the host and any open, registered dropdown. */
  isOutsideControl(next: EventTarget | Node | null): boolean {
    return !hellContainsFloatingTarget(
      {
        root: this.engine.host,
        scope: this.floatingScope,
        floatingActive: () => this.dropdownOpen,
      },
      next,
    );
  }

  /** Marks the control touched when focus moves outside the control. */
  markControlTouched(event: FocusEvent): void {
    if (this.isOutsideControl(event.relatedTarget)) {
      this.valueAccessor.markTouched();
    }
  }

  /** Registers a portaled dropdown so it counts as inside the control. */
  registerDropdown(dropdown: HTMLElement): void {
    this.floatingScope.registerFloatingElement(dropdown);
  }

  /** Unregisters a previously registered dropdown. */
  unregisterDropdown(dropdown: HTMLElement): void {
    this.floatingScope.unregisterFloatingElement(dropdown);
  }
}
