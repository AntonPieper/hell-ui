import {
  DOCUMENT,
  Directive,
  ElementRef,
  booleanAttribute,
  inject,
  input,
} from '@angular/core';
import type { Subscription } from 'rxjs';
import {
  NgpDialog,
  NgpDialogOverlay,
  NgpDialogTitle,
  NgpDialogDescription,
  NgpDialogTrigger,
} from 'ng-primitives/dialog';
import type { HellSize } from '../../core/types';

interface DialogRuntimeRef {
  afterClosed$: {
    subscribe(next: () => void): Subscription;
  };
}

interface DialogTriggerRuntime {
  dialogRef: DialogRuntimeRef | null;
}

/**
 * Wrap your trigger element with this directive and bind to a `<ng-template>`.
 *
 *   <button hellButton [hellDialogTrigger]="dialog">Open</button>
 *   <ng-template #dialog let-close="close"> … </ng-template>
 */
@Directive({
  selector: '[hellDialogTrigger]',
  hostDirectives: [
    {
      directive: NgpDialogTrigger,
      inputs: [
        'ngpDialogTrigger:hellDialogTrigger',
        'ngpDialogTriggerCloseOnEscape:closeOnEscape',
        'ngpDialogTriggerCloseOnOutsideClick:closeOnOutsideClick',
      ],
      outputs: ['ngpDialogTriggerClosed:closed'],
    },
  ],
  host: {
    '(pointerdown)': 'primeScope()',
    '(click)': 'primeScope(); observeClose()',
  },
})
export class HellDialogTrigger {
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly doc = inject(DOCUMENT);
  private readonly trigger = inject(NgpDialogTrigger, { self: true });
  private activeRoot: HTMLElement | null = null;
  private closeSubscription: Subscription | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private readonly syncScope = () => this.updateScope();

  protected primeScope(): void {
    const root = this.element.nativeElement.closest<HTMLElement>('[data-dialog-root="true"]');
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

  protected observeClose(): void {
    queueMicrotask(() => {
      const dialogRef = (this.trigger as unknown as DialogTriggerRuntime).dialogRef;
      if (!dialogRef) return;

      this.closeSubscription?.unsubscribe();
      this.closeSubscription = dialogRef.afterClosed$.subscribe(() => this.clearScope());
    });
  }

  private updateScope(): void {
    if (!this.activeRoot) return;

    const rect = this.activeRoot.getBoundingClientRect();
    const win = this.doc.defaultView;
    if (!win) return;

    const styles = this.doc.documentElement.style;
    styles.setProperty('--hell-dialog-scope-top', `${Math.max(0, rect.top)}px`);
    styles.setProperty('--hell-dialog-scope-right', `${Math.max(0, win.innerWidth - rect.right)}px`);
    styles.setProperty('--hell-dialog-scope-bottom', `${Math.max(0, win.innerHeight - rect.bottom)}px`);
    styles.setProperty('--hell-dialog-scope-left', `${Math.max(0, rect.left)}px`);
  }

  private clearScope(): void {
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

@Directive({
  selector: '[hellDialogOverlay]',
  hostDirectives: [NgpDialogOverlay],
  host: {
    '[class.hell-dialog-overlay]': '!unstyled()',
    '[attr.data-scoped]': 'scoped() ? "true" : null',
  },
})
export class HellDialogOverlay {
  readonly unstyled = input(false, { transform: booleanAttribute });
  /** When true, overlay reads bounds from nearest dialog root captured by
   *  opening trigger. If none exists, it falls back to viewport. */
  readonly scoped = input(false, { transform: booleanAttribute });
}

/**
 * Marks an element as the bounding region for `<div hellDialogOverlay scoped>`.
 * Triggers opened inside this element automatically scope to it.
 *
 * Pair with `hellAppContent` to keep the surrounding chrome (sidebars,
 * topbar) interactive while a dialog is open over the main content.
 */
@Directive({
  selector: '[hellDialogScope]',
  exportAs: 'hellDialogScope',
  host: {
    '[attr.data-dialog-root]': '"true"',
  },
})
export class HellDialogScope {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellDialog]',
  hostDirectives: [NgpDialog],
  host: {
    '[class.hell-dialog]': '!unstyled()',
    '[class.hell-card]': '!unstyled()',
    '[attr.data-elevation]': '!unstyled() ? "3" : null',
    '[attr.data-size]': 'size()',
  },
})
export class HellDialog {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly size = input<HellSize>('md');
}

@Directive({
  selector: '[hellDialogTitle]',
  hostDirectives: [NgpDialogTitle],
  host: { '[class.hell-dialog-title]': '!unstyled()' },
})
export class HellDialogTitle {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellDialogDescription]',
  hostDirectives: [NgpDialogDescription],
  host: { '[class.hell-dialog-description]': '!unstyled()' },
})
export class HellDialogDescription {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

export const HELL_DIALOG_DIRECTIVES = [
  HellDialogTrigger,
  HellDialogOverlay,
  HellDialog,
  HellDialogTitle,
  HellDialogDescription,
  HellDialogScope,
] as const;
