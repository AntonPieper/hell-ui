import { InjectionToken } from '@angular/core';
import {
  HellFloatingScopedInsetsRuntime,
  hellFindFloatingScopeRoot,
  type HellFloatingInsetVars,
} from '../../core/floating-scope';

export const HELL_DIALOG_SCOPE_ROOT_ATTRIBUTE = 'data-hell-dialog-scope-root';
const HELL_DIALOG_SCOPE_LEGACY_ROOT_ATTRIBUTE = 'data-dialog-root';
const HELL_DIALOG_SCOPE_ROOT_SELECTOR = `[${HELL_DIALOG_SCOPE_ROOT_ATTRIBUTE}="true"], [${HELL_DIALOG_SCOPE_LEGACY_ROOT_ATTRIBUTE}="true"]`;
const HELL_DIALOG_SCOPE_VARS: HellFloatingInsetVars = {
  top: '--hell-dialog-scope-top',
  right: '--hell-dialog-scope-right',
  bottom: '--hell-dialog-scope-bottom',
  left: '--hell-dialog-scope-left',
} as const;

export const HELL_DIALOG_SCOPE_ROOT = new InjectionToken<HTMLElement | null>(
  'HELL_DIALOG_SCOPE_ROOT',
);

/**
 * Adapter that copies one Dialog Scope root's insets onto the portaled overlay.
 * Each overlay owns its own runtime, so simultaneous scoped dialogs keep
 * independent CSS custom properties and never write shared document vars.
 */
export class HellDialogScopedOverlayAdapter {
  private readonly runtime: HellFloatingScopedInsetsRuntime;

  constructor(
    private readonly root: HTMLElement,
    private readonly overlay: HTMLElement,
    private readonly doc: Document,
  ) {
    this.runtime = new HellFloatingScopedInsetsRuntime({
      document: doc,
      rootSelector: HELL_DIALOG_SCOPE_ROOT_SELECTOR,
      variables: HELL_DIALOG_SCOPE_VARS,
      styleTargets: () => [this.root, this.overlay],
    });
  }

  connect(): void {
    this.runtime.primeRoot(this.root);
  }

  destroy(): void {
    this.runtime.clear();
  }
}

export function hellFindDialogScopeRoot(trigger: HTMLElement): HTMLElement | null {
  return hellFindFloatingScopeRoot(trigger, HELL_DIALOG_SCOPE_ROOT_SELECTOR);
}
