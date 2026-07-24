import { LiveAnnouncer } from '@angular/cdk/a11y';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injectable,
  TemplateRef,
  inject,
  input,
  type InjectionToken,
} from '@angular/core';
import { hellCreateLabels, type HellLabels } from 'hell-ui/core';
import type { HellUi, HellUiInput } from 'hell-ui/core';
import { hellPartStyler, type HellRecipe } from 'hell-ui/internal/core';

import {
  ɵHELL_TOAST_STACK_OWNER,
  ɵHellToastHostState,
  ɵHellToastStack,
  ɵHellToastStackRenderer,
  ɵregisterToastStack,
  ɵunregisterToastStack,
} from './toast-internal';

/** Built-in accessibility labels owned by the toast entry point. */
export interface HellToastLabels {
  /** Accessible label for the toast region landmark. */
  readonly notifications: string;
  /** Screen-reader announcement for a template-based toast with no derivable text. */
  readonly notification: string;
  /** Accessible label for the scrollable toast stack viewport. */
  readonly stack: string;
  /** Accessible label for an individual toast's close button. */
  readonly dismiss: string;
  /** Accessible label for the dismiss-all button. */
  readonly dismissAll: string;
}

/** Injection token resolving to the effective toast labels. */
export const HELL_TOAST_LABELS: InjectionToken<HellLabels<HellToastLabels>> =
  hellCreateLabels<HellToastLabels>('HELL_TOAST_LABELS', {
    notifications: 'Notifications',
    notification: 'Notification',
    stack: 'Notification stack',
    dismiss: 'Dismiss',
    dismissAll: 'Dismiss all',
  });

/** Visual and semantic style of a toast. */
export type HellToastVariant = 'default' | 'success' | 'info' | 'warning' | 'danger';
/** Screen corner the toaster is anchored to. */
export type HellToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/** Public parts of the HellToaster module, styleable through its Part Style Map. */
export type HellToasterPart =
  | 'root'
  | 'region'
  | 'viewport'
  | 'list'
  | 'toast'
  | 'glyph'
  | 'body'
  | 'title'
  | 'description'
  | 'action'
  | 'close'
  | 'toolbar'
  | 'dismissAll';

/** Part Style Map accepted by the HellToaster `ui` input. */
export type HellToasterUi = HellUi<HellToasterPart>;

// Placement-dependent values (anchor offsets, --hell-toast-dir,
// --hell-toast-origin, exit direction) live in styles.css keyed off
// `data-position`; recipe utilities would beat those component-layer
// rules from the utilities layer and pin every placement to bottom-right.
const HELL_TOASTER_RECIPE = {
  root: 'fixed z-[9999] pointer-events-none w-[var(--hell-toaster-w)] max-w-[calc(100vw-32px)] [--hell-toaster-w:360px] [--hell-toaster-gap:12px] [--hell-toaster-peek:14px] [--hell-toaster-scale-step:0.06] [--hell-toast-gutter:10px] [--hell-toaster-viewport-max-h:min(420px,calc(100vh-104px))]',
  region: 'relative block pointer-events-auto',
  viewport:
    'relative box-border h-16 w-full pe-[var(--hell-toast-gutter)] overflow-visible transition-[height] duration-[var(--hell-duration-base)] ease-[var(--ease-hell-out)] focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-8',
  list: 'relative m-0 h-16 list-none p-0',
  toast:
    'absolute left-0 right-0 grid grid-cols-[auto_1fr_auto_auto] items-start gap-hell-3 rounded-hell-lg border border-hell-border bg-hell-surface-elevated p-hell-4 text-[13px] leading-[1.4] text-hell-foreground shadow-hell-lg pointer-events-auto transition-[transform,opacity,box-shadow] duration-[var(--hell-duration-base)] ease-[var(--ease-hell-out)]',
  glyph: 'mt-px h-[18px] w-[18px] flex-none text-[var(--hell-toast-glyph)]',
  body: 'min-w-0',
  title: 'break-words text-[13px] font-semibold text-hell-foreground',
  description: 'mt-0.5 break-words text-[12.5px] text-hell-foreground-muted',
  action:
    'appearance-none whitespace-nowrap rounded-hell-sm border border-hell-border-strong bg-hell-surface px-2.5 py-1 text-xs font-semibold text-hell-foreground transition-[background-color] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] hover:bg-hell-surface-muted active:bg-hell-surface-subtle focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-2',
  close:
    '-my-0.5 -ms-0 me-[-4px] inline-flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-hell-sm border-0 bg-transparent text-hell-foreground-subtle transition-[color,background-color] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] hover:bg-hell-surface-muted hover:text-hell-foreground focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1',
  // The hidden-state offset/scale is `transform` in styles.css; translate/scale
  // utilities would set the independent CSS properties on top of it and keep the
  // toolbar offset and shrunken even once the expanded reveal completes.
  toolbar:
    'absolute z-4 flex opacity-0 pointer-events-none transition-[opacity,transform] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)]',
  dismissAll:
    'inline-flex cursor-pointer items-center gap-hell-2 whitespace-nowrap rounded-hell-sm border border-hell-border bg-hell-surface-elevated px-2.5 py-[7px] text-xs font-semibold leading-none text-hell-foreground no-underline shadow-hell-md transition-[border-color,background-color,color] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] hover:border-hell-border-strong hover:bg-hell-surface-elevated active:bg-hell-surface-muted focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-2',
} satisfies HellRecipe<HellToasterPart>;

/** Optional action button configuration for a toast. */
export interface HellToastAction {
  /** Text shown on the action button. */
  label: string;
  /** Invoked when the action is clicked; receives a callback that dismisses the toast. */
  onClick: (dismiss: () => void) => void;
}

/** Patch accepted by {@link HellToastRef.update}. */
export interface HellToastUpdate {
  /** Replace the heading line. Pass `null` to clear it; omit it to keep the current title. */
  title?: string | null;
  /** Replace the supporting body line. Pass `null` to clear it; omit it to keep the current description. */
  description?: string | null;
  /** Replace the visual + semantic style. */
  variant?: HellToastVariant;
  /**
   * Replace the auto-dismiss timeout in ms and restart its countdown from this update.
   * `0` keeps the toast mounted. Omitting `duration` preserves the current countdown.
   */
  duration?: number;
  /** Replace the action button. Pass `null` to remove it. */
  action?: HellToastAction | null;
  /** Show or hide the close button. */
  dismissible?: boolean;
  /** Replace the custom body. Pass `null` to return to title/description content. */
  template?: TemplateRef<{ $implicit: HellToastRef }> | null;
}

/** Handle for updating or dismissing one toast without exposing its renderer id. */
export interface HellToastRef {
  /**
   * Patch this toast in place without creating or announcing another toast.
   * Calls made after dismissal begins are idempotent no-ops.
   */
  update(patch: HellToastUpdate): void;
  /** Begin this toast's exit animation. Repeated calls are idempotent. */
  dismiss(): void;
}

/** Configuration passed to `HellToastService.show` and its variant shortcuts. */
export interface HellToastOptions {
  /** Heading line. Falls back to `description` when omitted. */
  title?: string;
  /** Supporting body line. */
  description?: string;
  /** Visual + semantic style. */
  variant?: HellToastVariant;
  /** Auto-dismiss timeout in ms. `0` keeps the toast until dismissed manually. */
  duration?: number;
  /** Optional action button rendered to the right of the body. */
  action?: HellToastAction;
  /** Whether a close button is shown (default `true`). */
  dismissible?: boolean;
  /** Custom template body. Receives the toast's `HellToastRef` as its implicit context. */
  template?: TemplateRef<{ $implicit: HellToastRef }>;
  /**
   * Screen-reader announcement text for this toast. Sent through CDK `LiveAnnouncer`.
   * Overrides any derived `title`/`description` text, which is useful for
   * template-based toasts where visible content has no stable text mapping.
   */
  announcement?: string;
}

/**
 * Public toast creation facade. Mount one `hell-toaster` in the app shell;
 * callers can inject this service anywhere and retain the returned reference
 * when one toast needs to be updated or dismissed later.
 */
@Injectable({ providedIn: 'root' })
export class HellToastService {
  private readonly stack = new ɵHellToastStack(inject(LiveAnnouncer), inject(HELL_TOAST_LABELS));

  constructor() {
    ɵregisterToastStack(this, this.stack);
    inject(DestroyRef).onDestroy(() => {
      this.stack.destroy();
      ɵunregisterToastStack(this, this.stack);
    });
  }

  /** Add a toast and return its scoped update/dismiss reference. */
  show(opts: HellToastOptions): HellToastRef {
    return this.stack.create(opts);
  }

  /** Show a `default`-variant toast and return its reference. */
  message(
    title: string,
    opts: Omit<HellToastOptions, 'title' | 'variant'> = {},
  ): HellToastRef {
    return this.show({ ...opts, title, variant: 'default' });
  }

  /** Show a `success`-variant toast and return its reference. */
  success(
    title: string,
    opts: Omit<HellToastOptions, 'title' | 'variant'> = {},
  ): HellToastRef {
    return this.show({ ...opts, title, variant: 'success' });
  }

  /** Show an `info`-variant toast and return its reference. */
  info(title: string, opts: Omit<HellToastOptions, 'title' | 'variant'> = {}): HellToastRef {
    return this.show({ ...opts, title, variant: 'info' });
  }

  /** Show a `warning`-variant toast and return its reference. */
  warning(
    title: string,
    opts: Omit<HellToastOptions, 'title' | 'variant'> = {},
  ): HellToastRef {
    return this.show({ ...opts, title, variant: 'warning' });
  }

  /** Show a `danger`-variant toast and return its reference. */
  error(title: string, opts: Omit<HellToastOptions, 'title' | 'variant'> = {}): HellToastRef {
    return this.show({ ...opts, title, variant: 'danger' });
  }

  /** Dismiss every toast currently mounted. */
  dismissAll(): void {
    this.stack.dismissAll();
  }
}

const HELL_TOASTER_TEMPLATE = `
  <div
    class="contents"
    hellToastStackRenderer
    #renderer="hellToastStackRenderer"
    [position]="position()"
    [maxVisible]="maxVisible()"
  >
    @if (renderer.hasToasts()) {
      <!-- Visual grouping only; announcements use Angular CDK LiveAnnouncer. -->
      <section
        data-slot="region"
        [class]="part('region')"
        role="region"
        [attr.aria-label]="renderer.labels.notifications"
        [style.--hell-toast-stack-h]="renderer.stackHeightPx()"
        [style.--hell-toast-viewport-h]="renderer.expandedViewportHeightPx()"
        [style.--hell-toast-scrollbar-w]="renderer.nativeScrollbarWidthPx()"
        tabindex="-1"
        (mouseenter)="renderer.onEnter()"
        (mouseleave)="renderer.onLeave()"
        (focusin)="renderer.onEnter()"
        (focusout)="renderer.onFocusOut($event)"
      >
        <div
          data-slot="viewport"
          [class]="part('viewport')"
          [attr.tabindex]="renderer.isScrollable() ? 0 : null"
          [attr.aria-label]="renderer.isScrollable() ? renderer.labels.stack : null"
          (scroll)="renderer.onViewportScroll($event)"
        >
          <ol data-slot="list" [class]="part('list')">
            @for (t of renderer.toasts(); track t.id; let i = $index) {
              <li
                data-slot="toast"
                [class]="part('toast')"
                [attr.data-variant]="t.variant"
                [attr.data-state]="t.removing ? 'closed' : 'open'"
                [attr.data-front]="renderer.frontDistance(t)"
                [attr.data-visible]="renderer.frontDistance(t) < renderer.maxVisible() ? 'true' : 'false'"
                [attr.data-overflow]="renderer.overflow(t) > 0 ? renderer.overflow(t) : null"
                [attr.data-edge]="renderer.edgeProgress(t) > 0 ? 'true' : null"
                [attr.aria-hidden]="renderer.isCollapsedOverflow(t) ? 'true' : null"
                [style.--hell-toast-front]="renderer.frontDistance(t)"
                [style.--hell-toast-overflow]="renderer.overflow(t)"
                [style.--hell-toast-offset]="renderer.offsetPx(t)"
                [style.--hell-toast-h]="renderer.heightPx(t.id)"
                [style.--hell-toast-z]="i + 1"
                [style.--hell-toast-edge-progress]="renderer.edgeProgress(t)"
                [style.--hell-toast-edge-opacity]="renderer.edgeOpacity(t)"
              >
                <div data-slot="glyph" [class]="part('glyph')" aria-hidden="true">
                  @switch (t.variant) {
                    @case ('success') {
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="8" cy="8" r="6.5" />
                        <path d="M5 8.5l2 2 4-4.5" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    }
                    @case ('danger') {
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="8" cy="8" r="6.5" />
                        <path d="M5.5 5.5l5 5m0-5l-5 5" stroke-linecap="round" />
                      </svg>
                    }
                    @case ('warning') {
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M8 1.5L15 14H1L8 1.5z" stroke-linejoin="round" />
                        <path d="M8 6v3.5M8 11.8v.4" stroke-linecap="round" />
                      </svg>
                    }
                    @case ('info') {
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="8" cy="8" r="6.5" />
                        <path d="M8 7v4M8 4.6v.4" stroke-linecap="round" />
                      </svg>
                    }
                    @default {
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="8" cy="8" r="6.5" />
                      </svg>
                    }
                  }
                </div>

                <div data-slot="body" [class]="part('body')">
                  @if (t.template) {
                    <ng-container
                      [ngTemplateOutlet]="t.template"
                      [ngTemplateOutletContext]="{ $implicit: t.ref }"
                    />
                  } @else {
                    @if (t.title) {
                      <div data-slot="title" [class]="part('title')">{{ t.title }}</div>
                    }
                    @if (t.description) {
                      <div data-slot="description" [class]="part('description')">
                        {{ t.description }}
                      </div>
                    }
                  }
                </div>

                @if (t.action) {
                  <button
                    type="button"
                    data-slot="action"
                    [class]="part('action')"
                    [attr.tabindex]="renderer.toastControlTabIndex(t)"
                    (click)="t.action!.onClick(t.ref.dismiss)"
                  >
                    {{ t.action.label }}
                  </button>
                }

                @if (t.dismissible) {
                  <button
                    type="button"
                    data-slot="close"
                    [class]="part('close')"
                    [attr.aria-label]="renderer.labels.dismiss"
                    [attr.tabindex]="renderer.toastControlTabIndex(t)"
                    (click)="t.ref.dismiss()"
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4l8 8m0-8l-8 8" stroke-linecap="round" />
                    </svg>
                  </button>
                }
              </li>
            }
          </ol>
        </div>
        @if (renderer.showDismissAll()) {
          <div data-slot="toolbar" [class]="part('toolbar')">
            <button
              type="button"
              data-slot="dismissAll"
              [class]="part('dismissAll')"
              [attr.aria-label]="renderer.labels.dismissAll"
              [attr.tabindex]="renderer.expanded() ? null : -1"
              (click)="renderer.dismissAll()"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                aria-hidden="true"
              >
                <path d="M4 4l8 8m0-8l-8 8" stroke-linecap="round" />
              </svg>
              <span>{{ renderer.labels.dismissAll }}</span>
            </button>
          </div>
        }
      </section>
    }
  </div>
`;

/**
 * Mount once near the root of the application. Renders the private Toast Stack
 * for toasts created through `HellToastService`.
 *
 *   <hell-toaster position="bottom-right" [maxVisible]="3" />
 */
@Component({
  selector: 'hell-toaster',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, ɵHellToastStackRenderer],
  providers: [
    ɵHellToastHostState,
    { provide: ɵHELL_TOAST_STACK_OWNER, useExisting: HellToastService },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-position]': 'position()',
    '[attr.data-expanded]': 'expanded() ? "true" : null',
    '[attr.data-scrollable]': 'scrollable() ? "true" : null',
  },
  template: HELL_TOASTER_TEMPLATE,
})
export class HellToaster {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellToasterPart>>(undefined, { alias: 'ui' });

  /** Screen corner the stack is anchored to. Defaults to `bottom-right`. */
  readonly position = input<HellToastPosition>('bottom-right');
  /** Maximum number of toasts shown before the stack collapses. Defaults to `3`. */
  readonly maxVisible = input<number>(3);

  /** Merged Part-Class Pipeline classes for one public toaster part. */
  protected readonly part = hellPartStyler<HellToasterPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TOASTER_RECIPE,
  });
  /** Whether the owned stack is expanded for pointer or keyboard interaction. */
  protected readonly expanded = inject(ɵHellToastHostState).expanded;
  /** Whether the owned stack currently requires its scrollable viewport. */
  protected readonly scrollable = inject(ɵHellToastHostState).scrollable;
}

/** All Hell toast directives and components, for convenient bulk import. */
export const HELL_TOAST_IMPORTS = [HellToaster] as const;
