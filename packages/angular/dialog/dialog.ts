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
  type NgpDialogConfig,
  type NgpDialogRef,
} from 'ng-primitives/dialog';
import {
  dismissGuardAttribute,
  type NgpDismissGuard,
  type NgpDismissGuardInput,
} from 'ng-primitives/portal';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { HellSize } from '@hell-ui/angular/core';
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';
import { HellNativeInteractiveDisabledGuard } from '@hell-ui/angular/internal/core';
import {
  HELL_DIALOG_SCOPE_ROOT,
  HellDialogScopedOverlayAdapter,
  hellFindDialogScopeRoot,
} from './dialog-scope';

export type HellDialogOverlayPart = 'root';
export type HellDialogOverlayUi = HellUi<HellDialogOverlayPart>;

export type HellDialogPart = 'root';
export type HellDialogUi = HellUi<HellDialogPart>;

export type HellDialogTitlePart = 'root';
export type HellDialogTitleUi = HellUi<HellDialogTitlePart>;

export type HellDialogDescriptionPart = 'root';
export type HellDialogDescriptionUi = HellUi<HellDialogDescriptionPart>;

const HELL_DIALOG_OVERLAY_RECIPE = {
  root: 'fixed inset-0 z-[var(--hell-z-dialog)] box-border flex items-center justify-center overflow-auto overscroll-contain bg-hell-overlay p-hell-6 backdrop-blur-[2px] animate-[hell-backdrop-in_var(--hell-duration-base)_var(--ease-hell-out)]',
} satisfies HellRecipe<HellDialogOverlayPart>;

const HELL_DIALOG_RECIPE = {
  root: 'flex max-h-[min(90vh,100%)] w-full max-w-[480px] flex-col overflow-hidden rounded-hell-lg border border-hell-border bg-hell-surface-elevated text-hell-foreground shadow-[var(--shadow-hell-overlay)] outline-none animate-[hell-dialog-in_var(--hell-duration-base)_var(--ease-hell-out)] data-[size=sm]:max-w-[380px] data-[size=lg]:max-w-[720px] data-[size=xl]:max-w-[960px]',
} satisfies HellRecipe<HellDialogPart>;

const HELL_DIALOG_TITLE_RECIPE = {
  root: 'm-0 text-[15px] font-semibold text-hell-foreground',
} satisfies HellRecipe<HellDialogTitlePart>;

const HELL_DIALOG_DESCRIPTION_RECIPE = {
  root: 'mt-hell-1 mb-0 text-[13px] text-hell-foreground-muted',
} satisfies HellRecipe<HellDialogDescriptionPart>;

export interface HellDialogTemplateContext<TData = unknown, TResult = unknown> {
  readonly $implicit: NgpDialogRef<TData, TResult>;
  readonly close: (result?: TResult) => void;
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
    'data-hell-dialog-trigger': '',
    '[attr.type]': 'nativeButtonType()',
    '[attr.disabled]': 'nativeButtonDisabled(disabled())',
    '[attr.aria-disabled]': 'anchorAriaDisabled(disabled())',
    '[attr.tabindex]': 'disabledAnchorTabIndex(disabled())',
    '(click)': 'launch($event)',
    '(keydown.enter)': 'preventDisabledAnchor($event, disabled())',
  },
})
export class HellDialogTrigger<TData = unknown, TResult = unknown> extends HellNativeInteractiveDisabledGuard {
  readonly template = input.required<TemplateRef<HellDialogTemplateContext<TData, TResult>>>({
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
  readonly dialogData = input<TData | undefined>(undefined);
  readonly hellDialogData = input<TData | undefined>(undefined, { alias: 'hellDialogData' });
  readonly closed = output<TResult | undefined>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialogManager = inject(NgpDialogManager);
  private readonly injector = inject(Injector);

  private resolveDialogData(): TData | undefined {
    return this.hellDialogData() ?? this.dialogData();
  }

  protected launch(event: Event): void {
    this.preventActionAnchorNavigation(event, this.disabled());
    if (this.disabled()) return;

    const root = hellFindDialogScopeRoot(this.element.nativeElement);
    const injector = Injector.create({
      parent: this.injector,
      providers: [{ provide: HELL_DIALOG_SCOPE_ROOT, useValue: root }],
    });
    const config = {
      injector,
      closeOnEscape: this.closeOnEscape(),
      closeOnOutsideClick: this.closeOnOutsideClick(),
      data: this.resolveDialogData(),
    } as NgpDialogConfig<TData | undefined> & { data: TData | undefined };

    const dialogRef = this.dialogManager.open<TData | undefined, TResult>(
      this.template() as TemplateRef<HellDialogTemplateContext<TData | undefined, TResult>>,
      config,
    );

    dialogRef.closed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ result }) => this.closed.emit(result as TResult));

    dialogRef.afterClosed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.restoreFocusToTrigger());
  }

  private restoreFocusToTrigger(): void {
    const trigger = this.element.nativeElement;
    requestAnimationFrame(() => {
      if (!trigger.isConnected || this.disabled()) return;
      trigger.focus({ preventScroll: true });
    });
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
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-scoped]': 'scoped() ? "true" : null',
  },
})
export class HellDialogOverlay extends HellPartStyleable<HellDialogOverlayPart> {
  protected readonly recipe = HELL_DIALOG_OVERLAY_RECIPE;
  protected readonly defaultUiPart = 'root';

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
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-elevation]': '"3"',
    '[attr.data-size]': 'size()',
  },
})
export class HellDialog extends HellPartStyleable<HellDialogPart> {
  protected readonly recipe = HELL_DIALOG_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly size = input<HellSize>('md');
}

@Directive({
  selector: '[hellDialogTitle]',
  hostDirectives: [NgpDialogTitle],
  host: { '[class]': "part('root')", 'data-slot': 'root' },
})
export class HellDialogTitle extends HellPartStyleable<HellDialogTitlePart> {
  protected readonly recipe = HELL_DIALOG_TITLE_RECIPE;
  protected readonly defaultUiPart = 'root';
}

@Directive({
  selector: '[hellDialogDescription]',
  hostDirectives: [NgpDialogDescription],
  host: { '[class]': "part('root')", 'data-slot': 'root' },
})
export class HellDialogDescription extends HellPartStyleable<HellDialogDescriptionPart> {
  protected readonly recipe = HELL_DIALOG_DESCRIPTION_RECIPE;
  protected readonly defaultUiPart = 'root';
}

export const HELL_DIALOG_DIRECTIVES = [
  HellDialogTrigger,
  HellDialogOverlay,
  HellDialogTitle,
  HellDialogDescription,
  HellDialog,
  HellDialogScope,
] as const;
