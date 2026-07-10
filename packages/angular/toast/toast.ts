import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  TemplateRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { NgTemplateOutlet } from '@angular/common';
import { hellCreateLabels } from '@hell-ui/angular/core';
import { hellPartStyler, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';
import {
  hellToastFrontDistance,
  hellToastHeightPx,
  hellToastOffsetPx,
  hellToastOverflow,
  hellToastScrollEdgeOpacity,
  hellToastScrollEdgeProgress,
  hellToastSnapshotExits,
  hellToastStackHeightPx,
  hellToastStackHeightValuePx,
  hellToastStackSnapshotsEqual,
  type HellToastStackSnapshot,
} from './toast-stack.runtime';
import type { InjectionToken, Provider } from '@angular/core';

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

const HELL_TOAST_LABELS_CONTRACT = hellCreateLabels<HellToastLabels>('HELL_TOAST_LABELS', {
  notifications: 'Notifications',
  notification: 'Notification',
  stack: 'Notification stack',
  dismiss: 'Dismiss',
  dismissAll: 'Dismiss all',
});

/** Injection token resolving to the effective toast labels. */
export const HELL_TOAST_LABELS: InjectionToken<HellToastLabels> = HELL_TOAST_LABELS_CONTRACT.token;

/** Override any subset of the toast labels for an injector scope. */
export function provideHellToastLabels(overrides: Partial<HellToastLabels>): Provider {
  return HELL_TOAST_LABELS_CONTRACT.provide(overrides);
}

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

const HELL_TOASTER_RECIPE = {
  root: 'fixed z-[9999] pointer-events-none w-[var(--hell-toaster-w)] max-w-[calc(100vw-32px)] [--hell-toaster-w:360px] [--hell-toaster-gap:12px] [--hell-toaster-peek:14px] [--hell-toaster-scale-step:0.06] [--hell-toast-gutter:10px] [--hell-toaster-viewport-max-h:min(420px,calc(100vh-104px))] [--hell-toast-dir:-1] [--hell-toast-origin:bottom_center]',
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
  toolbar:
    'absolute z-4 flex opacity-0 pointer-events-none translate-y-1 scale-[0.98] transition-[opacity,transform] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)]',
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
  /** Custom template body. Receives `{ $implicit: { id, dismiss } }`. */
  template?: TemplateRef<{
    $implicit: { id: number; dismiss: () => void };
  }>;
  /**
   * Screen-reader announcement text for this toast. Sent through CDK `LiveAnnouncer`.
   * Overrides any derived `title`/`description` text, which is useful for
   * template-based toasts where visible content has no stable text mapping.
   */
  announcement?: string;
  /** Stable id; pass to update an existing toast (replace contents in place). */
  id?: number;
}

interface ToastInternal extends Required<
  Omit<HellToastOptions, 'template' | 'action' | 'id' | 'announcement'>
> {
  id: number;
  template: HellToastOptions['template'] | null;
  action: HellToastAction | null;
  removing: boolean;
  createdAt: number;
}

const DEFAULT_DURATION = 4500;
const EXIT_MS = 220;

interface ToastTimer {
  readonly handle: ReturnType<typeof setTimeout> | null;
  readonly remaining: number;
  readonly startedAt: number;
  readonly paused: boolean;
}

/**
 * Global toast store. Mount one `hell-toaster` in the app shell; callers can
 * inject this service anywhere, show toasts, update by stable id, and pause or
 * resume timers while the stack is hovered/focused.
 */
@Injectable({ providedIn: 'root' })
export class HellToastService {
  private readonly announcer = inject(LiveAnnouncer);
  private readonly labels = inject(HELL_TOAST_LABELS);
  private nextId = 1;
  private timers = new Map<number, ToastTimer>();
  private exitTimers = new Map<number, ReturnType<typeof setTimeout>>();

  /** Reactive list of currently mounted toasts (oldest → newest). */
  readonly toasts = signal<ToastInternal[]>([]);

  /** Add a toast. Returns the toast id. Pass an existing id to update in place. */
  show(opts: HellToastOptions): number {
    const id = opts.id ?? this.nextId++;
    const next: ToastInternal = {
      id,
      title: opts.title ?? '',
      description: opts.description ?? '',
      variant: opts.variant ?? 'default',
      duration: opts.duration ?? DEFAULT_DURATION,
      dismissible: opts.dismissible ?? true,
      template: opts.template ?? null,
      action: opts.action ?? null,
      removing: false,
      createdAt: Date.now(),
    };
    this.clearExitTimer(id);
    const list = this.toasts();
    const existing = list.findIndex((t) => t.id === id);
    if (existing >= 0) {
      const copy = [...list];
      copy[existing] = next;
      this.toasts.set(copy);
    } else {
      this.toasts.set([...list, next]);
      this.announceToast(next, opts);
    }
    this.scheduleAutoDismiss(next);
    return id;
  }

  /** Show a `default`-variant toast. Returns the toast id. */
  message(title: string, opts: Omit<HellToastOptions, 'title' | 'variant'> = {}) {
    return this.show({ ...opts, title, variant: 'default' });
  }
  /** Show a `success`-variant toast. Returns the toast id. */
  success(title: string, opts: Omit<HellToastOptions, 'title' | 'variant'> = {}) {
    return this.show({ ...opts, title, variant: 'success' });
  }
  /** Show an `info`-variant toast. Returns the toast id. */
  info(title: string, opts: Omit<HellToastOptions, 'title' | 'variant'> = {}) {
    return this.show({ ...opts, title, variant: 'info' });
  }
  /** Show a `warning`-variant toast. Returns the toast id. */
  warning(title: string, opts: Omit<HellToastOptions, 'title' | 'variant'> = {}) {
    return this.show({ ...opts, title, variant: 'warning' });
  }
  /** Show a `danger`-variant toast. Returns the toast id. */
  error(title: string, opts: Omit<HellToastOptions, 'title' | 'variant'> = {}) {
    return this.show({ ...opts, title, variant: 'danger' });
  }

  /** Begin exit animation, then remove from the list. */
  dismiss(id: number): void {
    this.clearTimer(id);
    const list = this.toasts();
    const i = list.findIndex((t) => t.id === id);
    if (i < 0 || list[i].removing) return;
    const copy = [...list];
    copy[i] = { ...copy[i], removing: true };
    this.toasts.set(copy);
    this.clearExitTimer(id);
    const handle = setTimeout(() => {
      this.exitTimers.delete(id);
      const current = this.toasts().find((t) => t.id === id);
      if (!current?.removing) return;
      this.toasts.set(this.toasts().filter((t) => t.id !== id));
    }, EXIT_MS);
    this.exitTimers.set(id, handle);
  }

  /** Dismiss every toast currently mounted. */
  dismissAll(): void {
    for (const t of this.toasts()) this.dismiss(t.id);
  }

  /** Pause auto-dismiss for every toast (used while the stack is hovered). */
  pauseAll(): void {
    for (const [id, t] of this.timers) {
      if (t.paused) continue;
      if (t.handle) clearTimeout(t.handle);
      const elapsed = Date.now() - t.startedAt;
      this.timers.set(id, {
        handle: null,
        remaining: Math.max(0, t.remaining - elapsed),
        startedAt: Date.now(),
        paused: true,
      });
    }
  }

  /** Resume auto-dismiss for every paused toast. */
  resumeAll(): void {
    for (const [id, t] of this.timers) {
      if (!t.paused) continue;
      if (t.remaining <= 0) {
        this.dismiss(id);
        continue;
      }
      const handle = setTimeout(() => this.dismiss(id), t.remaining);
      this.timers.set(id, { handle, remaining: t.remaining, startedAt: Date.now(), paused: false });
    }
  }

  private scheduleAutoDismiss(t: ToastInternal): void {
    this.clearTimer(t.id);
    if (t.duration <= 0) return;
    const handle = setTimeout(() => this.dismiss(t.id), t.duration);
    this.timers.set(t.id, {
      handle,
      remaining: t.duration,
      startedAt: Date.now(),
      paused: false,
    });
  }

  /**
   * Announce newly added toasts through CDK LiveAnnouncer only.
   * The visible toast list is not a live-region; it is a labeled visual container.
   */
  private announceToast(toast: ToastInternal, opts?: Pick<HellToastOptions, 'announcement'>): void {
    const explicitAnnouncement = opts?.announcement?.trim();
    const announcement =
      explicitAnnouncement ||
      [toast.title, toast.description].filter((part) => part.length > 0).join('. ') ||
      (toast.template ? this.labels.notification : '');
    if (!announcement) return;
    this.announcer.announce(announcement, 'polite');
  }

  private clearTimer(id: number): void {
    const t = this.timers.get(id);
    if (!t) return;
    if (t.handle) clearTimeout(t.handle);
    this.timers.delete(id);
  }

  private clearExitTimer(id: number): void {
    const handle = this.exitTimers.get(id);
    if (!handle) return;
    clearTimeout(handle);
    this.exitTimers.delete(id);
  }
}

/**
 * Marker directive — drop into a custom toast template to get the
 * dismiss handle without verbose template binding.
 *
 *   <ng-template #t let-ctx>
 *     <button (click)="ctx.dismiss()">Close</button>
 *   </ng-template>
 */
@Directive({ selector: '[hellToastTemplate]' })
export class HellToastTemplate {}

/**
 * Mount once near the root of the application. Renders the toast stack
 * (Sonner-style: collapsed cards that expand on hover) for any toast
 * created via `HellToastService`.
 *
 *   <hell-toaster position="bottom-right" [maxVisible]="3" />
 */
@Component({
  selector: 'hell-toaster',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-position]': 'position()',
    '[attr.data-expanded]': 'expanded() ? "true" : null',
    '[attr.data-scrollable]': 'isScrollable() ? "true" : null',
  },
  template: `
    @if (hasToasts()) {
      <!-- Visual grouping only; announcements use Angular CDK LiveAnnouncer. -->
      <section
        data-slot="region"
        [class]="part('region')"
        role="region"
        [attr.aria-label]="labels.notifications"
        [style.--hell-toast-stack-h]="stackHeightPx()"
        [style.--hell-toast-viewport-h]="expandedViewportHeightPx()"
        [style.--hell-toast-scrollbar-w]="nativeScrollbarWidthPx()"
        tabindex="-1"
        (mouseenter)="onEnter()"
        (mouseleave)="onLeave()"
        (focusin)="onEnter()"
        (focusout)="onFocusOut($event)"
      >
        <div
          data-slot="viewport"
          [class]="part('viewport')"
          [attr.tabindex]="isScrollable() ? 0 : null"
          [attr.aria-label]="isScrollable() ? labels.stack : null"
          (scroll)="onViewportScroll($event)"
        >
          <ol data-slot="list" [class]="part('list')">
            @for (t of svc.toasts(); track t.id; let i = $index) {
              <li
                data-slot="toast"
                [class]="part('toast')"
                [attr.data-variant]="t.variant"
                [attr.data-state]="t.removing ? 'closed' : 'open'"
                [attr.data-front]="frontDistance(t)"
                [attr.data-visible]="frontDistance(t) < maxVisible() ? 'true' : 'false'"
                [attr.data-overflow]="overflow(t) > 0 ? overflow(t) : null"
                [attr.data-edge]="edgeProgress(t) > 0 ? 'true' : null"
                [attr.aria-hidden]="isCollapsedOverflow(t) ? 'true' : null"
                [style.--hell-toast-front]="frontDistance(t)"
                [style.--hell-toast-overflow]="overflow(t)"
                [style.--hell-toast-offset]="offsetPx(t)"
                [style.--hell-toast-h]="heightPx(t.id)"
                [style.--hell-toast-z]="i + 1"
                [style.--hell-toast-edge-progress]="edgeProgress(t)"
                [style.--hell-toast-edge-opacity]="edgeOpacity(t)"
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
                      [ngTemplateOutletContext]="{ $implicit: ctxFor(t.id) }"
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
                    [attr.tabindex]="toastControlTabIndex(t)"
                    (click)="t.action!.onClick(() => svc.dismiss(t.id))"
                  >
                    {{ t.action.label }}
                  </button>
                }

                @if (t.dismissible) {
                  <button
                    type="button"
                    data-slot="close"
                    [class]="part('close')"
                    [attr.aria-label]="labels.dismiss"
                    [attr.tabindex]="toastControlTabIndex(t)"
                    (click)="svc.dismiss(t.id)"
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
        @if (showDismissAll()) {
          <div data-slot="toolbar" [class]="part('toolbar')">
            <button
              type="button"
              data-slot="dismissAll"
              [class]="part('dismissAll')"
              [attr.aria-label]="labels.dismissAll"
              [attr.tabindex]="expanded() ? null : -1"
              (click)="svc.dismissAll()"
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
              <span>{{ labels.dismissAll }}</span>
            </button>
          </div>
        }
      </section>
    }
  `,
})
export class HellToaster {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellToasterPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellToasterPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TOASTER_RECIPE,
  });

  /** The toast store this toaster renders. */
  readonly svc = inject(HellToastService);
  /** Effective accessibility labels for the toaster's controls. */
  protected readonly labels = inject(HELL_TOAST_LABELS);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;

  /** Whether any toasts are currently mounted. */
  protected readonly hasToasts = computed(() => this.svc.toasts().length > 0);
  /** Number of toasts that are not in the process of exiting. */
  protected readonly liveToastCount = computed(
    () => this.svc.toasts().filter((toast) => !toast.removing).length,
  );
  /** Whether the dismiss-all control should be shown (more than one live toast). */
  protected readonly showDismissAll = computed(() => this.liveToastCount() > 1);

  /** Screen corner the stack is anchored to. Defaults to `bottom-right`. */
  readonly position = input<HellToastPosition>('bottom-right');
  /** Maximum number of toasts shown before the stack collapses. Defaults to `3`. */
  readonly maxVisible = input<number>(3);

  /** Whether the stack is currently expanded (hovered or focused). */
  protected readonly expanded = signal(false);
  /** id → measured pixel height */
  private readonly heights = signal(new Map<number, number>());
  /** Frozen layout for toasts that are currently exiting, so survivors can
   *  slide into the freed slot while the dismissed toast keeps its position. */
  private readonly exitSnapshot = signal(new Map<number, HellToastStackSnapshot>());
  private ro: ResizeObserver | null = null;
  private observed = new WeakSet<Element>();
  private destroyed = false;
  private readonly viewportHeight = signal(0);
  private readonly scrollTop = signal(0);
  private readonly nativeScrollbarWidth = signal(0);
  /** Total measured height of the expanded stack, in pixels. */
  protected readonly stackHeightValue = computed(() =>
    hellToastStackHeightValuePx(this.svc.toasts(), this.heights()),
  );
  /** Total measured stack height as a CSS `px` string. */
  protected readonly stackHeightPx = computed(() =>
    hellToastStackHeightPx(this.svc.toasts(), this.heights()),
  );
  /** Expanded viewport height, clamped to the on-screen limit, in pixels. */
  protected readonly expandedViewportHeightValue = computed(() =>
    Math.min(this.stackHeightValue(), this.viewportHeightLimit()),
  );
  /** Expanded viewport height as a CSS `px` string. */
  protected readonly expandedViewportHeightPx = computed(
    () => `${this.expandedViewportHeightValue()}px`,
  );
  /** Measured native scrollbar width as a CSS `px` string. */
  protected readonly nativeScrollbarWidthPx = computed(() => `${this.nativeScrollbarWidth()}px`);
  /** Whether the stack overflows the visible cap or viewport and needs scrolling. */
  protected readonly isScrollable = computed(() => {
    const viewportHeight = this.viewportHeight();
    return (
      this.liveToastCount() > this.maxVisible() ||
      (viewportHeight > 0 && this.stackHeightValue() > viewportHeight + 1)
    );
  });
  /** Pending collapse handle. Re-entry cancels it so transient mouseleave
   *  events during dismiss-driven reflows don't yank the stack closed. */
  private collapseHandle: ReturnType<typeof setTimeout> | null = null;
  private collapseLayoutResetHandle: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.cleanupObservers());
    this.syncNativeScrollbarWidth();
    afterNextRender(() => {
      this.syncNativeScrollbarWidth();
      this.observeAll();
    });
    effect(() => {
      // Snapshot the layout of any toast that just entered the removing state
      // BEFORE the next paint reflows the survivors, so its exit animation
      // starts from where it visually was. Index-based (counts every sibling,
      // including peers that may be exiting in parallel) so it matches what
      // the user actually sees on screen.
      const list = this.svc.toasts();
      if (list.length === 0) {
        if (this.collapseHandle != null) {
          clearTimeout(this.collapseHandle);
          this.collapseHandle = null;
        }
        this.cancelCollapseLayoutReset();
        this.expanded.set(false);
      }
      const snap = hellToastSnapshotExits(list, this.heights(), this.exitSnapshot());
      if (!hellToastStackSnapshotsEqual(snap, this.exitSnapshot())) this.exitSnapshot.set(snap);
      // Re-observe after the list changed.
      queueMicrotask(() => {
        this.observeAll();
        this.scheduleViewportStateSync();
      });
    });
  }

  /** Expand the stack and pause auto-dismiss when the pointer or focus enters. */
  protected onEnter() {
    const wasExpanded = this.expanded();
    if (this.collapseHandle != null) {
      clearTimeout(this.collapseHandle);
      this.collapseHandle = null;
    }
    this.cancelCollapseLayoutReset();
    this.expanded.set(true);
    this.svc.pauseAll();
    this.scheduleViewportStateSync(!wasExpanded);
  }

  /** Schedule a deferred collapse of the stack when the pointer or focus leaves. */
  protected onLeave() {
    if (this.collapseHandle != null) clearTimeout(this.collapseHandle);
    // Defer collapse so a re-enter within the grace window (e.g. after the
    // cursor lands in empty space mid-dismiss reflow, or focus moves out
    // when a clicked button is removed) keeps the stack open. Once the
    // grace window elapses, double-check via :hover that the pointer is
    // genuinely outside before actually collapsing — covers the case where
    // a survivor slides into the cursor's position after a longer exit
    // animation, which doesn't always re-fire mouseenter on the list.
    this.collapseHandle = setTimeout(() => {
      this.collapseHandle = null;
      if (this.host.matches(':hover')) return;
      const active = this.host.ownerDocument.activeElement;
      if (active && this.host.contains(active)) return;
      this.collapseStack();
    }, 320);
  }

  /** Collapse the stack when focus moves outside the toaster. */
  protected onFocusOut(event: FocusEvent) {
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.contains(next)) return;
    this.onLeave();
  }

  /** Sync scroll-derived viewport state as the stack viewport is scrolled. */
  protected onViewportScroll(event: Event) {
    this.syncViewportState(event.currentTarget as HTMLElement);
  }

  /**
   * How many *live* (non-exiting) toasts sit in front of `t`. The front-most
   * toast returns 0. Removing toasts are skipped so the surviving stack does
   * not shift while a peer plays its exit animation.
   */
  protected frontDistance(t: ToastInternal): number {
    return hellToastFrontDistance(this.svc.toasts(), t, this.exitSnapshot());
  }

  /** Cumulative height of live toasts visually in front of `t` (expanded).
   *  Expanded stacks keep the full measured offset so overflow toasts remain
   *  reachable through the scroll viewport. */
  protected offsetPx(t: ToastInternal): string {
    return hellToastOffsetPx(this.svc.toasts(), t, this.heights(), this.exitSnapshot());
  }

  /** How many positions past the visible cap this toast sits (>=0). */
  protected overflow(t: ToastInternal): number {
    return hellToastOverflow(this.svc.toasts(), t, this.maxVisible(), this.exitSnapshot());
  }

  /** Measured height of the toast with the given id as a CSS `px` string. */
  protected heightPx(id: number): string {
    return hellToastHeightPx(id, this.heights());
  }

  /** Fade progress (0–1) for `t` near a scroll edge, or its collapsed overflow depth. */
  protected edgeProgress(t: ToastInternal): number {
    if (!this.expanded()) return this.overflow(t);
    return hellToastScrollEdgeProgress(
      this.svc.toasts(),
      t,
      this.heights(),
      {
        anchor: this.position().startsWith('bottom') ? 'bottom' : 'top',
        scrollTop: this.scrollTop(),
        viewportHeight: this.viewportHeight(),
        stackHeight: this.stackHeightValue(),
      },
      this.exitSnapshot(),
    );
  }

  /** Opacity applied to `t` derived from its edge-fade progress. */
  protected edgeOpacity(t: ToastInternal): number {
    return hellToastScrollEdgeOpacity(this.edgeProgress(t));
  }

  /** Whether `t` is hidden behind the visible cap while the stack is collapsed. */
  protected isCollapsedOverflow(t: ToastInternal): boolean {
    return !this.expanded() && this.frontDistance(t) >= this.maxVisible();
  }

  /** `tabindex` for a toast's controls: removed from tab order when collapsed out of view. */
  protected toastControlTabIndex(t: ToastInternal): -1 | null {
    return this.isCollapsedOverflow(t) ? -1 : null;
  }

  /** Template context (`{ id, dismiss }`) passed to custom toast templates. */
  protected ctxFor(id: number) {
    return { id, dismiss: () => this.svc.dismiss(id) };
  }

  private cleanupObservers(): void {
    this.destroyed = true;
    if (this.collapseHandle != null) {
      clearTimeout(this.collapseHandle);
      this.collapseHandle = null;
    }
    this.cancelCollapseLayoutReset();
    this.ro?.disconnect();
    this.ro = null;
  }

  private collapseStack(): void {
    const viewport = this.viewportElement();
    this.expanded.set(false);
    this.svc.resumeAll();
    this.scheduleViewportStateSync();
    this.scheduleCollapseLayoutReset(viewport);
  }

  private scheduleCollapseLayoutReset(viewport: HTMLElement | null): void {
    this.cancelCollapseLayoutReset();
    if (!viewport) return;

    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      viewport.removeEventListener('transitionend', onTransitionEnd);
      if (this.collapseLayoutResetHandle != null) {
        clearTimeout(this.collapseLayoutResetHandle);
        this.collapseLayoutResetHandle = null;
      }
      if (this.destroyed || this.expanded()) return;
      viewport.scrollTop = 0;
      this.syncViewportState(viewport);
    };
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== viewport || event.propertyName !== 'height') return;
      finish();
    };
    const resetDelay = this.viewportHeightTransitionMs(viewport);
    if (resetDelay > 0) {
      viewport.addEventListener('transitionend', onTransitionEnd);
      this.collapseLayoutResetHandle = setTimeout(finish, resetDelay + 50);
      return;
    }
    this.collapseLayoutResetHandle = setTimeout(finish, 50);
  }

  private cancelCollapseLayoutReset(): void {
    if (this.collapseLayoutResetHandle != null) {
      clearTimeout(this.collapseLayoutResetHandle);
      this.collapseLayoutResetHandle = null;
    }
  }

  private viewportHeightTransitionMs(viewport: HTMLElement): number {
    const win = viewport.ownerDocument.defaultView;
    if (!win) return 0;
    const style = win.getComputedStyle(viewport);
    const transitionsHeight = style.transitionProperty.split(',').some((property) => {
      const name = property.trim();
      return name === 'height' || name === 'all';
    });
    if (!transitionsHeight) return 0;

    return (
      this.longestTransitionTimeMs(style.transitionDuration) +
      this.longestTransitionTimeMs(style.transitionDelay)
    );
  }

  private longestTransitionTimeMs(value: string): number {
    return value.split(',').reduce((longest, part) => {
      const amount = Number.parseFloat(part);
      const ms =
        Number.isFinite(amount) && amount > 0
          ? part.trim().endsWith('ms')
            ? amount
            : amount * 1000
          : 0;
      return Math.max(longest, ms);
    }, 0);
  }

  private syncNativeScrollbarWidth(): void {
    const doc = this.host.ownerDocument;
    if (!doc.body) return;

    const style = doc.createElement('style');
    style.textContent =
      '[data-hell-toast-scrollbar-probe]::-webkit-scrollbar{width:8px;height:8px}';

    const probe = doc.createElement('div');
    probe.setAttribute('data-hell-toast-scrollbar-probe', '');
    probe.style.cssText =
      'position:absolute;top:-9999px;width:100px;height:100px;overflow:auto;scrollbar-gutter:stable;scrollbar-width:thin;visibility:hidden;pointer-events:none';
    const content = doc.createElement('div');
    content.style.cssText = 'width:200px;height:200px';
    probe.append(content);

    doc.head.append(style);
    doc.body.append(probe);
    const width = Math.max(0, probe.offsetWidth - probe.clientWidth);
    probe.remove();
    style.remove();

    if (this.nativeScrollbarWidth() !== width) this.nativeScrollbarWidth.set(width);
  }

  private scheduleViewportStateSync(resetOrigin = false): void {
    setTimeout(() => {
      if (this.destroyed) return;
      this.syncViewportState(undefined, resetOrigin);
    }, 0);
  }

  private scrollToStackOrigin(viewport = this.viewportElement()): void {
    if (!viewport) return;
    if (!this.expanded() || !this.position().startsWith('bottom')) {
      viewport.scrollTop = 0;
    } else {
      const viewportHeight = viewport.clientHeight || viewport.getBoundingClientRect().height;
      viewport.scrollTop = Math.max(0, viewport.scrollHeight - viewportHeight);
    }
  }

  private viewportHeightLimit(): number {
    const win = this.host.ownerDocument.defaultView;
    return Math.max(64, Math.min(420, (win?.innerHeight ?? 900) - 104));
  }

  private syncViewportState(viewport = this.viewportElement(), alignToOrigin = false): void {
    if (!viewport) return;
    if (alignToOrigin) this.scrollToStackOrigin(viewport);
    const height = viewport.clientHeight || viewport.getBoundingClientRect().height;
    if (this.viewportHeight() !== height) this.viewportHeight.set(height);
    if (this.scrollTop() !== viewport.scrollTop) this.scrollTop.set(viewport.scrollTop);
  }

  private viewportElement(): HTMLElement | null {
    return this.host.querySelector<HTMLElement>('[data-slot="viewport"]');
  }

  private observeAll(): void {
    // eslint-disable-next-line no-restricted-globals -- SSR feature-detect; ResizeObserver has no injectable seam
    if (this.destroyed || typeof ResizeObserver === 'undefined') return;
    if (!this.ro) {
      // eslint-disable-next-line no-restricted-globals -- guarded by the feature check above
      this.ro = new ResizeObserver((entries) => {
        let changed = false;
        const next = new Map(this.heights());
        const viewport = this.viewportElement();
        for (const e of entries) {
          if (viewport && e.target === viewport) {
            this.syncViewportState(viewport);
            continue;
          }
          const id = Number((e.target as HTMLElement).dataset['toastId']);
          if (!Number.isFinite(id)) continue;
          const h = this.measureToastHeight(e.target as HTMLElement);
          if (next.get(id) !== h) {
            next.set(id, h);
            changed = true;
          }
        }
        if (changed) this.heights.set(next);
      });
    }
    const viewport = this.viewportElement();
    if (viewport) this.ro.observe(viewport);
    const items = this.host.querySelectorAll<HTMLElement>('[data-slot="toast"]');
    const seen = new Set<number>();
    items.forEach((el, i) => {
      const id = this.svc.toasts()[i]?.id;
      if (id == null) return;
      el.dataset['toastId'] = String(id);
      seen.add(id);
      if (!this.observed.has(el)) {
        this.ro!.observe(el);
        this.observed.add(el);
      }
      // Seed heights on first paint so initial offsets are correct.
      const cur = this.heights().get(id);
      const h = this.measureToastHeight(el);
      if (cur !== h && h > 0) {
        const next = new Map(this.heights());
        next.set(id, h);
        this.heights.set(next);
      }
    });
    this.syncViewportState();
    // Drop heights for toasts that no longer exist.
    const next = new Map(this.heights());
    let trimmed = false;
    for (const id of next.keys()) {
      if (!seen.has(id)) {
        next.delete(id);
        trimmed = true;
      }
    }
    if (trimmed) this.heights.set(next);
  }

  private measureToastHeight(element: HTMLElement): number {
    return element.offsetHeight || element.getBoundingClientRect().height;
  }
}

/** All Hell toast directives and components, for convenient bulk import. */
export const HELL_TOAST_DIRECTIVES = [HellToaster, HellToastTemplate] as const;
