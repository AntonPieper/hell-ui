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
import { HELL_LABELS } from '../../core/labels';
import { HellStyleable } from '../../core/styleable';
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

export type HellToastVariant = 'default' | 'success' | 'info' | 'warning' | 'danger';
export type HellToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface HellToastAction {
  label: string;
  onClick: (dismiss: () => void) => void;
}

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
  private readonly labels = inject(HELL_LABELS);
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

  message(title: string, opts: Omit<HellToastOptions, 'title' | 'variant'> = {}) {
    return this.show({ ...opts, title, variant: 'default' });
  }
  success(title: string, opts: Omit<HellToastOptions, 'title' | 'variant'> = {}) {
    return this.show({ ...opts, title, variant: 'success' });
  }
  info(title: string, opts: Omit<HellToastOptions, 'title' | 'variant'> = {}) {
    return this.show({ ...opts, title, variant: 'info' });
  }
  warning(title: string, opts: Omit<HellToastOptions, 'title' | 'variant'> = {}) {
    return this.show({ ...opts, title, variant: 'warning' });
  }
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
      (toast.template ? this.labels.toast.notification : '');
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
    '[class.hell-toaster]': '!unstyled()',
    '[attr.data-position]': 'position()',
    '[attr.data-expanded]': 'expanded() ? "true" : null',
    '[attr.data-scrollable]': 'isScrollable() ? "true" : null',
  },
  template: `
    @if (hasToasts()) {
      <!-- Visual grouping only; announcements use Angular CDK LiveAnnouncer. -->
      <section
        data-slot="region"
        role="region"
        [attr.aria-label]="labels.toast.notifications"
        [style.--hell-toast-stack-h]="stackHeightPx()"
        [style.--hell-toast-viewport-h]="expandedViewportHeightPx()"
        tabindex="-1"
        (mouseenter)="onEnter()"
        (mouseleave)="onLeave()"
        (focusin)="onEnter()"
        (focusout)="onFocusOut($event)"
      >
        <div
          data-slot="viewport"
          [attr.tabindex]="isScrollable() ? 0 : null"
          [attr.aria-label]="isScrollable() ? labels.toast.stack : null"
          (scroll)="onViewportScroll($event)"
        >
          <ol data-slot="list">
            @for (t of svc.toasts(); track t.id; let i = $index) {
              <li
                data-slot="toast"
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
                <div data-slot="glyph" aria-hidden="true">
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

                <div data-slot="body">
                  @if (t.template) {
                    <ng-container
                      [ngTemplateOutlet]="t.template"
                      [ngTemplateOutletContext]="{ $implicit: ctxFor(t.id) }"
                    />
                  } @else {
                    @if (t.title) {
                      <div data-slot="title">{{ t.title }}</div>
                    }
                    @if (t.description) {
                      <div data-slot="description">{{ t.description }}</div>
                    }
                  }
                </div>

                @if (t.action) {
                  <button
                    type="button"
                    data-slot="action"
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
                    [attr.aria-label]="labels.toast.dismiss"
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
          <div data-slot="toolbar">
            <button
              type="button"
              data-slot="dismiss-all"
              [attr.aria-label]="labels.toast.dismissAll"
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
              <span>{{ labels.toast.dismissAll }}</span>
            </button>
          </div>
        }
      </section>
    }
  `,
})
export class HellToaster extends HellStyleable {
  readonly svc = inject(HellToastService);
  protected readonly labels = inject(HELL_LABELS);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;

  protected readonly hasToasts = computed(() => this.svc.toasts().length > 0);
  protected readonly liveToastCount = computed(
    () => this.svc.toasts().filter((toast) => !toast.removing).length,
  );
  protected readonly showDismissAll = computed(() => this.liveToastCount() > 1);

  readonly position = input<HellToastPosition>('bottom-right');
  readonly maxVisible = input<number>(3);

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
  protected readonly stackHeightValue = computed(() =>
    hellToastStackHeightValuePx(this.svc.toasts(), this.heights()),
  );
  protected readonly stackHeightPx = computed(() =>
    hellToastStackHeightPx(this.svc.toasts(), this.heights()),
  );
  protected readonly expandedViewportHeightValue = computed(() =>
    Math.min(this.stackHeightValue(), this.viewportHeightLimit()),
  );
  protected readonly expandedViewportHeightPx = computed(
    () => `${this.expandedViewportHeightValue()}px`,
  );
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

  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => this.cleanupObservers());
    afterNextRender(() => this.observeAll());
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

  protected onEnter() {
    const wasExpanded = this.expanded();
    if (this.collapseHandle != null) {
      clearTimeout(this.collapseHandle);
      this.collapseHandle = null;
    }
    this.expanded.set(true);
    this.svc.pauseAll();
    this.scheduleViewportStateSync(!wasExpanded);
  }

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

  protected onFocusOut(event: FocusEvent) {
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.contains(next)) return;
    this.onLeave();
  }

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

  protected heightPx(id: number): string {
    return hellToastHeightPx(id, this.heights());
  }

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

  protected edgeOpacity(t: ToastInternal): number {
    return hellToastScrollEdgeOpacity(this.edgeProgress(t));
  }

  protected isCollapsedOverflow(t: ToastInternal): boolean {
    return !this.expanded() && this.frontDistance(t) >= this.maxVisible();
  }

  protected toastControlTabIndex(t: ToastInternal): -1 | null {
    return this.isCollapsedOverflow(t) ? -1 : null;
  }

  protected ctxFor(id: number) {
    return { id, dismiss: () => this.svc.dismiss(id) };
  }

  private cleanupObservers(): void {
    this.destroyed = true;
    if (this.collapseHandle != null) {
      clearTimeout(this.collapseHandle);
      this.collapseHandle = null;
    }
    this.ro?.disconnect();
    this.ro = null;
  }

  private collapseStack(): void {
    const viewport = this.viewportElement();
    if (viewport) {
      viewport.scrollTop = 0;
      this.syncViewportState(viewport);
    }
    this.expanded.set(false);
    this.svc.resumeAll();
    this.scheduleViewportStateSync();
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
    if (this.destroyed || typeof ResizeObserver === 'undefined') return;
    if (!this.ro) {
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

export const HELL_TOAST_DIRECTIVES = [HellToaster, HellToastTemplate] as const;
