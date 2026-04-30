import type { Subscription } from 'rxjs';

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
const HELL_DIALOG_SCOPE_VARS = [
  '--hell-dialog-scope-top',
  '--hell-dialog-scope-right',
  '--hell-dialog-scope-bottom',
  '--hell-dialog-scope-left',
] as const;

export class HellDialogScopeRuntime {
  private activeScopeRoot: HTMLElement | null = null;
  private closeSubscription: Subscription | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private readonly syncScope = () => this.updateScope();

  constructor(private readonly doc: Document) {}

  primeFromTrigger(trigger: HTMLElement): void {
    const root = hellFindDialogScopeRoot(trigger);
    if (!root || this.activeScopeRoot === root) return;

    this.activeScopeRoot = root;
    this.updateScope();

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver?.disconnect();
      this.resizeObserver = new ResizeObserver(this.syncScope);
      this.resizeObserver.observe(root);
    }

    const win = this.doc.defaultView;
    win?.addEventListener('scroll', this.syncScope, { passive: true, capture: true });
    win?.addEventListener('resize', this.syncScope);
  }

  observeClose(ref: HellDialogRuntimeRef | null): void {
    if (!ref) return;
    this.closeSubscription?.unsubscribe();
    this.closeSubscription = ref.afterClosed$.subscribe(() => this.clear());
  }

  updateScope(): void {
    if (!this.activeScopeRoot) return;

    const rect = this.activeScopeRoot.getBoundingClientRect();
    const win = this.doc.defaultView;
    if (!win) return;

    const styles = this.doc.documentElement.style;
    styles.setProperty(HELL_DIALOG_SCOPE_VARS[0], `${Math.max(0, rect.top)}px`);
    styles.setProperty(HELL_DIALOG_SCOPE_VARS[1], `${Math.max(0, win.innerWidth - rect.right)}px`);
    styles.setProperty(
      HELL_DIALOG_SCOPE_VARS[2],
      `${Math.max(0, win.innerHeight - rect.bottom)}px`,
    );
    styles.setProperty(HELL_DIALOG_SCOPE_VARS[3], `${Math.max(0, rect.left)}px`);
  }

  clear(): void {
    this.closeSubscription?.unsubscribe();
    this.closeSubscription = null;

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    const win = this.doc.defaultView;
    win?.removeEventListener('scroll', this.syncScope, true);
    win?.removeEventListener('resize', this.syncScope);

    this.activeScopeRoot = null;

    const styles = this.doc.documentElement.style;
    for (const variable of HELL_DIALOG_SCOPE_VARS) styles.removeProperty(variable);
  }
}

export function hellFindDialogScopeRoot(trigger: HTMLElement): HTMLElement | null {
  return trigger.closest<HTMLElement>(HELL_DIALOG_SCOPE_ROOT_SELECTOR);
}
