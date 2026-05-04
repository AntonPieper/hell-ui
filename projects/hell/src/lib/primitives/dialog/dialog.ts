import {
  DOCUMENT,
  DestroyRef,
  Directive,
  ElementRef,
  booleanAttribute,
  effect,
  inject,
  input,
} from '@angular/core';
import {
  NgpDialog,
  NgpDialogOverlay,
  NgpDialogTitle,
  NgpDialogDescription,
  NgpDialogTrigger,
} from 'ng-primitives/dialog';
import type { HellSize } from '../../core/types';
import { HellStyleable } from '../../core/styleable';
import { HellDialogScopeCoordinator, HellDialogScopedOverlayAdapter } from './dialog-scope';

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
    '(click)': 'primeScope()',
    '(keydown.enter)': 'primeScope()',
    '(keydown.space)': 'primeScope()',
  },
})
export class HellDialogTrigger {
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly scope = inject(HellDialogScopeCoordinator);

  protected primeScope(): void {
    this.scope.primeFromTrigger(this.element.nativeElement);
  }
}

@Directive({
  selector: '[hellDialogOverlay]',
  hostDirectives: [NgpDialogOverlay],
  host: {
    '[class.hell-dialog-overlay]': '!unstyled()',
    '[class.hell-backdrop]': '!unstyled()',
    '[attr.data-scoped]': 'scoped() ? "true" : null',
  },
})
export class HellDialogOverlay extends HellStyleable {
  /** When true, overlay reads bounds from nearest dialog root captured by
   *  opening trigger. If none exists, it falls back to viewport. */
  readonly scoped = input(false, { transform: booleanAttribute });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly coordinator = inject(HellDialogScopeCoordinator);
  private readonly doc = inject(DOCUMENT);
  private adapter: HellDialogScopedOverlayAdapter | null = null;

  constructor() {
    super();
    const destroyRef = inject(DestroyRef);
    effect(() => {
      if (this.scoped()) this.connectScope();
      else this.disconnectScope();
    });
    destroyRef.onDestroy(() => this.disconnectScope());
  }

  private connectScope(): void {
    if (this.adapter) return;
    const root = this.coordinator.claimRoot();
    if (!root) return;
    this.adapter = new HellDialogScopedOverlayAdapter(root, this.element.nativeElement, this.doc);
    this.adapter.connect();
  }

  private disconnectScope(): void {
    this.adapter?.destroy();
    this.adapter = null;
  }
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
    '[attr.data-hell-dialog-scope-root]': '"true"',
    '[attr.data-dialog-root]': '"true"',
  },
})
export class HellDialogScope extends HellStyleable {}

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
export class HellDialog extends HellStyleable {
  readonly size = input<HellSize>('md');
}

@Directive({
  selector: '[hellDialogTitle]',
  hostDirectives: [NgpDialogTitle],
  host: { '[class.hell-dialog-title]': '!unstyled()' },
})
export class HellDialogTitle extends HellStyleable {}

@Directive({
  selector: '[hellDialogDescription]',
  hostDirectives: [NgpDialogDescription],
  host: { '[class.hell-dialog-description]': '!unstyled()' },
})
export class HellDialogDescription extends HellStyleable {}

export const HELL_DIALOG_DIRECTIVES = [
  HellDialogTrigger,
  HellDialogOverlay,
  HellDialog,
  HellDialogTitle,
  HellDialogDescription,
  HellDialogScope,
] as const;
