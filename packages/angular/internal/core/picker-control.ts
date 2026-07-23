import type { DestroyRef } from '@angular/core';

import { HellFloatingScopeRegistry, hellContainsFloatingTarget } from './floating-scope';
import type {
  HellPickMultipleValue,
  HellPickSingleValue,
  HellPickValue,
} from './pick-value';

/**
 * Normalizes an engine-emitted single pick value: nullish commits a clear.
 * The input must already be typed pick output; untyped engine emissions are
 * decoded to `HellPickValue<T>` by the caller instead of being cast here.
 */
export function hellNormalizePickSingleValue<T>(
  value: HellPickSingleValue<T> | undefined,
): HellPickSingleValue<T> {
  return value ?? null;
}

/** Narrows a non-null pick value to its multiple (array) shape. */
function hellIsPickMultipleValue<T>(value: T | readonly T[]): value is readonly T[] {
  return Array.isArray(value);
}

/** Normalizes an engine-emitted multiple pick value to a fresh array. */
export function hellNormalizePickMultipleValue<T>(
  value: HellPickValue<T> | undefined,
): HellPickMultipleValue<T> {
  if (value == null) return [];
  if (hellIsPickMultipleValue(value)) return [...value];
  return [value];
}

/**
 * Normalizes a pick value against the picker's current mode. Single mode
 * passes an already-array value through unchanged, matching the engine's own
 * mode/value reconciliation.
 */
export function hellNormalizePickValue<T>(
  value: HellPickValue<T> | undefined,
  multiple: boolean,
): HellPickValue<T> {
  if (multiple) return hellNormalizePickMultipleValue<T>(value);
  return value ?? null;
}

/**
 * Identity-level pick-value equality: two multiple values are the same when
 * they hold the same items in the same order, and two single values when they
 * are the same reference (nullish values all read as an empty selection).
 * The picker roots use it to keep model-to-engine synchronization from
 * writing a normalized copy back after the engine itself produced the value,
 * without treating `compareWith`-equal replacements as no-ops.
 */
export function hellSamePickValue<T>(
  left: HellPickValue<T> | undefined,
  right: HellPickValue<T> | undefined,
): boolean {
  if (left != null && right != null && hellIsPickMultipleValue(left) && hellIsPickMultipleValue(right)) {
    return (
      left.length === right.length && left.every((item, index) => Object.is(item, right[index]))
    );
  }
  return Object.is(left ?? null, right ?? null);
}

/** Structural stream shape shared by the picker engines' outputs. */
export interface HellPickerEngineStream<TValue> {
  subscribe(next: (value: TValue) => void): { unsubscribe(): void };
}

/**
 * Focus-boundary adapter one picker engine (ngp select, ngp combobox)
 * presents to the shared touched plumbing. `host` anchors outside-control
 * checks and `openChanges` gates whether registered dropdowns count as
 * inside.
 */
export interface HellPickerFocusScopeAdapter {
  /** Host element that anchors outside-control focus checks. */
  readonly host: () => HTMLElement;
  /** Engine open emissions; an open dropdown counts as inside the control. */
  readonly openChanges: HellPickerEngineStream<boolean>;
}

/**
 * Shared focus-boundary plumbing for the headless picker roots (select root,
 * combobox root). Owns the floating-scope registry that makes a portaled
 * dropdown count as "inside" while the engine reports it open, so each picker
 * marks its Angular forms touched boundary only when focus truly leaves the
 * control.
 */
export class HellPickerFocusScope {
  private readonly floatingScope = new HellFloatingScopeRegistry();
  private dropdownOpen = false;

  constructor(private readonly engine: HellPickerFocusScopeAdapter) {}

  /** Subscribes to the engine's open stream until `destroyRef` tears down. */
  connect(destroyRef: DestroyRef): void {
    const openSub = this.engine.openChanges.subscribe((open) => {
      this.dropdownOpen = open;
    });
    destroyRef.onDestroy(() => openSub.unsubscribe());
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

  /** Registers a portaled dropdown so it counts as inside the control. */
  registerDropdown(dropdown: HTMLElement): void {
    this.floatingScope.registerFloatingElement(dropdown);
  }

  /** Unregisters a previously registered dropdown. */
  unregisterDropdown(dropdown: HTMLElement): void {
    this.floatingScope.unregisterFloatingElement(dropdown);
  }
}
