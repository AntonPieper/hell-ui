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
import { FocusMonitor, InteractivityChecker } from '@angular/cdk/a11y';
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
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';
import { HellNativeInteractiveDisabledGuard } from '@hell-ui/angular/internal/core';
import {
  HELL_DIALOG_SCOPE_ROOT,
  HellDialogScopedOverlayAdapter,
  hellFindDialogScopeRoot,
} from './dialog-scope';

/** Public parts of the HellDialogOverlay module, styleable through its Part Style Map. */
export type HellDialogOverlayPart = 'root';
/** Part Style Map accepted by the HellDialogOverlay `ui` input. */
export type HellDialogOverlayUi = HellUi<HellDialogOverlayPart>;

/** Public parts of the HellDialog module, styleable through its Part Style Map. */
export type HellDialogPart = 'root';
/** Part Style Map accepted by the HellDialog `ui` input. */
export type HellDialogUi = HellUi<HellDialogPart>;

/** Public parts of the HellDialogTitle module, styleable through its Part Style Map. */
export type HellDialogTitlePart = 'root';
/** Part Style Map accepted by the HellDialogTitle `ui` input. */
export type HellDialogTitleUi = HellUi<HellDialogTitlePart>;

/** Public parts of the HellDialogDescription module, styleable through its Part Style Map. */
export type HellDialogDescriptionPart = 'root';
/** Part Style Map accepted by the HellDialogDescription `ui` input. */
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

/** Template context provided to the `<ng-template>` bound to `hellDialogTrigger`. */
export interface HellDialogTemplateContext<TData = unknown, TResult = unknown> {
  /** The dialog reference for the dialog being rendered. */
  readonly $implicit: NgpDialogRef<TData, TResult>;
  /** Closes the dialog, optionally passing a result back to the trigger's `closed` output. */
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
  /** The `<ng-template>` to render as the dialog's content. */
  readonly template = input.required<TemplateRef<HellDialogTemplateContext<TData, TResult>>>({
    alias: 'hellDialogTrigger',
  });
  /** Controls whether pressing Escape dismisses the dialog. */
  readonly closeOnEscape = input<
    NgpDismissGuard<KeyboardEvent> | undefined,
    NgpDismissGuardInput<KeyboardEvent> | undefined
  >(undefined, {
    alias: 'closeOnEscape',
    transform: optionalDismissGuardAttribute,
  });
  /** Controls whether clicking outside the dialog dismisses it. */
  readonly closeOnOutsideClick = input<
    NgpDismissGuard<Element> | undefined,
    NgpDismissGuardInput<Element> | undefined
  >(undefined, {
    alias: 'closeOnOutsideClick',
    transform: optionalDismissGuardAttribute,
  });
  /** Whether the trigger is disabled. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Data passed through to the opened dialog. */
  readonly dialogData = input<TData | undefined>(undefined);
  /** Alias for `dialogData`; takes precedence when both are set. */
  readonly hellDialogData = input<TData | undefined>(undefined, { alias: 'hellDialogData' });
  /** Emits the dialog's result when it closes. */
  readonly closed = output<TResult | undefined>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialogManager = inject(NgpDialogManager);
  private readonly injector = inject(Injector);

  private resolveDialogData(): TData | undefined {
    return this.hellDialogData() ?? this.dialogData();
  }

  /** Opens the dialog, scoping it to the nearest Dialog Scope root if any. */
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

/** Backdrop rendered behind an `hellDialog`, styled and optionally scoped to a container. */
@Directive({
  selector: '[hellDialogOverlay]',
  hostDirectives: [NgpDialogOverlay],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-scoped]': 'scoped() ? "true" : null',
  },
})
export class HellDialogOverlay {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellDialogOverlayPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellDialogOverlayPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_DIALOG_OVERLAY_RECIPE,
  });

  /** When true, overlay reads bounds from nearest dialog root captured by
   *  opening trigger. If none exists, it falls back to viewport. */
  readonly scoped = input(false, { transform: booleanAttribute });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly scopeRoot = inject(HELL_DIALOG_SCOPE_ROOT, { optional: true });
  private readonly doc = inject(DOCUMENT);
  private adapter: HellDialogScopedOverlayAdapter | null = null;

  constructor() {
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
  },
})
export class HellDialogScope {}

/** Styled dialog surface rendered inside `hellDialogOverlay`. */
@Directive({
  selector: '[hellDialog]',
  hostDirectives: [NgpDialog],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-elevation]': '"3"',
    '[attr.data-size]': 'size()',
    '(keydown.tab)': 'onTabKeydown($event)',
  },
})
export class HellDialog {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellDialogPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellDialogPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_DIALOG_RECIPE,
  });

  /** Max-width breakpoint of the dialog; `sm`, `md`, `lg`, or `xl`. Defaults to `'md'`. */
  readonly size = input<Exclude<HellSize, 'xs'>>('md');

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly focusMonitor = inject(FocusMonitor);
  private readonly interactivityChecker = inject(InteractivityChecker);

  /** Traps focus by cycling Tab/Shift+Tab between the dialog's focusable candidates. */
  protected onTabKeydown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (
      keyboardEvent.defaultPrevented ||
      keyboardEvent.altKey ||
      keyboardEvent.ctrlKey ||
      keyboardEvent.metaKey
    )
      return;

    const host = this.element.nativeElement;
    const active = host.ownerDocument.activeElement;
    if (active instanceof HTMLElement && !host.contains(active)) return;

    const candidates = this.focusableCandidates(host);
    if (!candidates.length) {
      event.preventDefault();
      this.focusMonitor.focusVia(host, 'keyboard', { preventScroll: true });
      return;
    }

    const currentIndex = active instanceof HTMLElement ? candidates.indexOf(active) : -1;
    const nextIndex = keyboardEvent.shiftKey
      ? currentIndex <= 0
        ? candidates.length - 1
        : currentIndex - 1
      : currentIndex < 0 || currentIndex === candidates.length - 1
        ? 0
        : currentIndex + 1;

    event.preventDefault();
    this.focusMonitor.focusVia(candidates[nextIndex], 'keyboard', { preventScroll: true });
  }

  private focusableCandidates(host: HTMLElement): HTMLElement[] {
    const candidates = host.querySelectorAll<HTMLElement>(
      [
        'button',
        '[href]',
        'input',
        'select',
        'textarea',
        'summary',
        '[tabindex]',
      ].join(','),
    );

    return Array.from(candidates).filter((candidate) => {
      if (candidate === host || candidate.tabIndex < 0) return false;
      if (candidate.closest('[inert], [aria-hidden="true"]')) return false;
      return (
        this.interactivityChecker.isFocusable(candidate) &&
        this.interactivityChecker.isVisible(candidate)
      );
    });
  }
}

/** Styled title element for an `hellDialog`. */
@Directive({
  selector: '[hellDialogTitle]',
  hostDirectives: [NgpDialogTitle],
  host: { '[class]': "part('root')", 'data-slot': 'root' },
})
export class HellDialogTitle {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellDialogTitlePart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellDialogTitlePart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_DIALOG_TITLE_RECIPE,
  });
}

/** Styled description element for an `hellDialog`. */
@Directive({
  selector: '[hellDialogDescription]',
  hostDirectives: [NgpDialogDescription],
  host: { '[class]': "part('root')", 'data-slot': 'root' },
})
export class HellDialogDescription {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellDialogDescriptionPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellDialogDescriptionPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_DIALOG_DESCRIPTION_RECIPE,
  });
}

/** All directives that make up the Dialog module, for convenient bulk import. */
export const HELL_DIALOG_DIRECTIVES = [
  HellDialogTrigger,
  HellDialogOverlay,
  HellDialogTitle,
  HellDialogDescription,
  HellDialog,
  HellDialogScope,
] as const;
