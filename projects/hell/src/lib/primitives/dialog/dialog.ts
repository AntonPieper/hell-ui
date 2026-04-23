import {
  DOCUMENT,
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  booleanAttribute,
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
import { HellSize } from '../../core/types';

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
})
export class HellDialogTrigger {}

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
  /** When true, the overlay is constrained to the bounds of the nearest
   *  `[hellDialogScope]` ancestor (or the viewport if none is registered),
   *  leaving the rest of the app interactive. */
  readonly scoped = input(false, { transform: booleanAttribute });
}

/**
 * Marks an element as the bounding region for `<div hellDialogOverlay scoped>`.
 * Tracks its size/position via ResizeObserver and exposes it as
 * `--hell-dialog-scope-{x,y,w,h}` CSS variables on the document root, which
 * the scoped overlay reads instead of `inset: 0`.
 *
 * Pair with `hellAppContent` to keep the surrounding chrome (sidebars,
 * topbar) interactive while a dialog is open over the main content.
 */
@Directive({
  selector: '[hellDialogScope]',
  exportAs: 'hellDialogScope',
})
export class HellDialogScope implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly doc = inject(DOCUMENT);
  private ro: ResizeObserver | null = null;
  private readonly handler = () => this.update();

  ngOnInit(): void {
    this.update();
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(this.handler);
      this.ro.observe(this.el);
    }
    const win = this.doc.defaultView;
    win?.addEventListener('scroll', this.handler, { passive: true, capture: true });
    win?.addEventListener('resize', this.handler);
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
    const win = this.doc.defaultView;
    win?.removeEventListener('scroll', this.handler, true as unknown as EventListenerOptions);
    win?.removeEventListener('resize', this.handler);
    const s = this.doc.documentElement.style;
    s.removeProperty('--hell-dialog-scope-x');
    s.removeProperty('--hell-dialog-scope-y');
    s.removeProperty('--hell-dialog-scope-w');
    s.removeProperty('--hell-dialog-scope-h');
  }

  private update(): void {
    const rect = this.el.getBoundingClientRect();
    const s = this.doc.documentElement.style;
    s.setProperty('--hell-dialog-scope-x', `${rect.left}px`);
    s.setProperty('--hell-dialog-scope-y', `${rect.top}px`);
    s.setProperty('--hell-dialog-scope-w', `${rect.width}px`);
    s.setProperty('--hell-dialog-scope-h', `${rect.height}px`);
  }
}

@Directive({
  selector: '[hellDialog]',
  hostDirectives: [NgpDialog],
  host: {
    '[class.hell-dialog]': '!unstyled()',
    '[attr.data-size]': 'size()',
  },
})
export class HellDialog {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly size = input<HellSize>('md');
}

@Directive({
  selector: '[hellDialogHeader]',
  host: { '[class.hell-dialog-header]': '!unstyled()' },
})
export class HellDialogHeader {
  readonly unstyled = input(false, { transform: booleanAttribute });
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

@Directive({
  selector: '[hellDialogBody]',
  host: { '[class.hell-dialog-body]': '!unstyled()' },
})
export class HellDialogBody {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellDialogFooter]',
  host: { '[class.hell-dialog-footer]': '!unstyled()' },
})
export class HellDialogFooter {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

export const HELL_DIALOG_DIRECTIVES = [
  HellDialogTrigger,
  HellDialogOverlay,
  HellDialog,
  HellDialogHeader,
  HellDialogTitle,
  HellDialogDescription,
  HellDialogBody,
  HellDialogFooter,
  HellDialogScope,
] as const;
