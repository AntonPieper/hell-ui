import type { Subscription } from 'rxjs';

export interface HellDialogRuntimeRef {
  afterClosed$: {
    subscribe(next: () => void): Subscription;
  };
}

export interface HellDialogTriggerRuntime {
  dialogRef: HellDialogRuntimeRef | null;
}

export class HellDialogScopeRuntime {
  private activeRoot: HTMLElement | null = null;
  private closeSubscription: Subscription | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private readonly syncScope = () => this.updateScope();

  constructor(private readonly doc: Document) {}

  primeFromTrigger(trigger: HTMLElement): void {
    const root = trigger.closest<HTMLElement>('[data-dialog-root="true"]');
    if (!root || this.activeRoot === root) return;

    this.activeRoot = root;
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
    if (!this.activeRoot) return;

    const rect = this.activeRoot.getBoundingClientRect();
    const win = this.doc.defaultView;
    if (!win) return;

    const styles = this.doc.documentElement.style;
    styles.setProperty('--hell-dialog-scope-top', `${Math.max(0, rect.top)}px`);
    styles.setProperty(
      '--hell-dialog-scope-right',
      `${Math.max(0, win.innerWidth - rect.right)}px`,
    );
    styles.setProperty(
      '--hell-dialog-scope-bottom',
      `${Math.max(0, win.innerHeight - rect.bottom)}px`,
    );
    styles.setProperty('--hell-dialog-scope-left', `${Math.max(0, rect.left)}px`);
  }

  clear(): void {
    this.closeSubscription?.unsubscribe();
    this.closeSubscription = null;

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    const win = this.doc.defaultView;
    win?.removeEventListener('scroll', this.syncScope, true);
    win?.removeEventListener('resize', this.syncScope);

    this.activeRoot = null;

    const styles = this.doc.documentElement.style;
    styles.removeProperty('--hell-dialog-scope-top');
    styles.removeProperty('--hell-dialog-scope-right');
    styles.removeProperty('--hell-dialog-scope-bottom');
    styles.removeProperty('--hell-dialog-scope-left');
  }
}
