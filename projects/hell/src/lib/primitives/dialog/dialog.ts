import {
  DOCUMENT,
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  TemplateRef,
  booleanAttribute,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import {
  NgpDialog,
  NgpDialogManager,
  NgpDialogOverlay,
  NgpDialogTitle,
  NgpDialogDescription,
  type NgpDialogRef,
} from 'ng-primitives/dialog';
import {
  dismissGuardAttribute,
  type NgpDismissGuard,
  type NgpDismissGuardInput,
} from 'ng-primitives/portal';
import type { HellSize } from '../../core/types';
import { HellStyleable } from '../../core/styleable';
import { HellNativeInteractiveDisabledGuard } from '../../core/native-interactive-disabled';
import {
  HELL_DIALOG_SCOPE_ROOT,
  HellDialogScopedOverlayAdapter,
  hellFindDialogScopeRoot,
} from './dialog-scope';

interface HellDialogTemplateContext<T = unknown, R = unknown> {
  readonly $implicit: NgpDialogRef<T, R>;
  readonly close: (result?: R) => void;
}

/**
 * Wrap your trigger element with this directive and bind to a `<ng-template>`.
 *
 *   <button hellButton [hellDialogTrigger]="dialog">Open</button>
 *   <ng-template #dialog let-close="close"> … </ng-template>
 */
@Directive({
  selector: 'button[hellDialogTrigger], a[hellDialogTrigger]',
  host: {
    '[attr.disabled]': 'nativeButtonDisabled(disabled())',
    '[attr.aria-disabled]': 'anchorAriaDisabled(disabled())',
    '[attr.tabindex]': 'disabledAnchorTabIndex(disabled())',
    '(click)': 'launch($event)',
    '(keydown.enter)': 'preventDisabledAnchor($event, disabled())',
  },
})
export class HellDialogTrigger<T = unknown> extends HellNativeInteractiveDisabledGuard {
  readonly template = input.required<TemplateRef<HellDialogTemplateContext>>({
    alias: 'hellDialogTrigger',
  });
  readonly closeOnEscape = input<
    NgpDismissGuard<KeyboardEvent> | undefined,
    NgpDismissGuardInput<KeyboardEvent> | undefined
  >(undefined, {
    alias: 'closeOnEscape',
    transform: optionalDismissGuardAttribute,
  });
  readonly closeOnOutsideClick = input<
    NgpDismissGuard<Element> | undefined,
    NgpDismissGuardInput<Element> | undefined
  >(undefined, {
    alias: 'closeOnOutsideClick',
    transform: optionalDismissGuardAttribute,
  });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly closed = output<T>();

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialogManager = inject(NgpDialogManager);
  private readonly injector = inject(Injector);

  protected launch(event: Event): void {
    if (this.disabled()) {
      this.preventDisabledAnchor(event, true);
      return;
    }

    const root = hellFindDialogScopeRoot(this.element.nativeElement);
    const injector = Injector.create({
      parent: this.injector,
      providers: [{ provide: HELL_DIALOG_SCOPE_ROOT, useValue: root }],
    });
    const dialogRef = this.dialogManager.open(this.template(), {
      injector,
      closeOnEscape: this.closeOnEscape(),
      closeOnOutsideClick: this.closeOnOutsideClick(),
    });

    dialogRef.closed.subscribe(({ result }) => this.closed.emit(result as T));
  }
}

function optionalDismissGuardAttribute<T>(
  value: NgpDismissGuardInput<T> | undefined,
): NgpDismissGuard<T> | undefined {
  return value === undefined ? undefined : dismissGuardAttribute(value);
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
  private readonly scopeRoot = inject(HELL_DIALOG_SCOPE_ROOT, { optional: true });
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
    const root = this.scopeRoot;
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
export class HellDialogScope {}

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
