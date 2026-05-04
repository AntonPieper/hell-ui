import type { Subscription } from 'rxjs';
import {
  HellFloatingScopedInsetsRuntime,
  hellFindFloatingScopeRoot,
  type HellFloatingInsetVars,
} from '../../core/overlay-scope';

export interface HellDialogRuntimeRef {
  afterClosed$: {
    subscribe(next: () => void): Subscription;
  };
}

export interface HellDialogTriggerRuntime {
  dialogRef: HellDialogRuntimeRef | null;
}

export const HELL_DIALOG_SCOPE_ROOT_ATTRIBUTE = 'data-hell-dialog-scope-root';
const HELL_DIALOG_SCOPE_LEGACY_ROOT_ATTRIBUTE = 'data-dialog-root';
const HELL_DIALOG_SCOPE_ROOT_SELECTOR = `[${HELL_DIALOG_SCOPE_ROOT_ATTRIBUTE}="true"], [${HELL_DIALOG_SCOPE_LEGACY_ROOT_ATTRIBUTE}="true"]`;
const HELL_DIALOG_SCOPE_VARS: HellFloatingInsetVars = {
  top: '--hell-dialog-scope-top',
  right: '--hell-dialog-scope-right',
  bottom: '--hell-dialog-scope-bottom',
  left: '--hell-dialog-scope-left',
} as const;

export class HellDialogScopeRuntime {
  private closeSubscription: Subscription | null = null;
  private readonly insets: HellFloatingScopedInsetsRuntime;

  constructor(private readonly doc: Document) {
    this.insets = new HellFloatingScopedInsetsRuntime({
      document: doc,
      rootSelector: HELL_DIALOG_SCOPE_ROOT_SELECTOR,
      variables: HELL_DIALOG_SCOPE_VARS,
    });
  }

  primeFromTrigger(trigger: HTMLElement): void {
    this.insets.primeFromTrigger(trigger);
  }

  observeClose(ref: HellDialogRuntimeRef | null): void {
    if (!ref) return;
    this.closeSubscription?.unsubscribe();
    this.closeSubscription = ref.afterClosed$.subscribe(() => this.clear());
  }

  updateScope(): void {
    this.insets.updateScope();
  }

  clear(): void {
    this.closeSubscription?.unsubscribe();
    this.closeSubscription = null;
    this.insets.clear();
  }
}

export function hellFindDialogScopeRoot(trigger: HTMLElement): HTMLElement | null {
  return hellFindFloatingScopeRoot(trigger, HELL_DIALOG_SCOPE_ROOT_SELECTOR);
}
