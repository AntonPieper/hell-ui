import { effect, untracked, type Signal } from '@angular/core';
import type { NgpFormFieldState } from 'ng-primitives/form-field';
import { hellUniqueIdRefs } from './idrefs';

/**
 * Mirrors externally-provided aria idrefs into an ng-primitives form-field
 * state without duplicating ids already registered by projected Hell labels or
 * descriptions. Cleanup removes only the ids this bridge added.
 */
export function hellSyncFormFieldDescriptions(
  formField: NgpFormFieldState,
  describedBy: Signal<string | null>,
): void {
  hellSyncFormFieldIdrefs(
    () => formField.descriptions(),
    (id) => formField.addDescription(id),
    (id) => formField.removeDescription(id),
    describedBy,
  );
}

/** See `hellSyncFormFieldDescriptions`, but for aria-labelledby idrefs. */
export function hellSyncFormFieldLabels(
  formField: NgpFormFieldState,
  labelledBy: Signal<string | null>,
): void {
  hellSyncFormFieldIdrefs(
    () => formField.labels(),
    (id) => formField.addLabel(id),
    (id) => formField.removeLabel(id),
    labelledBy,
  );
}

function hellSyncFormFieldIdrefs(
  existingIds: () => readonly string[],
  add: (id: string) => void,
  remove: (id: string) => void,
  idrefs: Signal<string | null>,
): void {
  effect((onCleanup) => {
    const existing = untracked(() => new Set(existingIds()));
    const ids = hellUniqueIdRefs(idrefs()).filter((id) => !existing.has(id));

    untracked(() => ids.forEach(add));
    onCleanup(() => untracked(() => ids.forEach(remove)));
  });
}
