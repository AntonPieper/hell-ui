import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  Injectable,
  TemplateRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { HellStyleable } from '../../core/styleable';

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
  /** Stable id; pass to update an existing toast (replace contents in place). */
  id?: number;
}

interface ToastInternal extends Required<Omit<HellToastOptions, 'template' | 'action' | 'id'>> {
  id: number;
  template: HellToastOptions['template'] | null;
  action: HellToastAction | null;
  removing: boolean;
  createdAt: number;
}

const DEFAULT_DURATION = 4500;
const EXIT_MS = 220;
const TOAST_STACK_GAP = 12;
const TOAST_FALLBACK_HEIGHT = 64;

/** Minimal stack item shape used by the exported toast layout helpers. */
export interface HellToastStackItem {
  readonly id: number;
  readonly removing: boolean;
}

/** Frozen position data captured when an exiting toast starts animating out. */
export interface HellToastStackSnapshot {
  readonly front: number;
  readonly offset: string;
}

/** Count visible, non-removing toasts in front of an item in the stack. */
export function hellToastFrontDistance(
  list: readonly HellToastStackItem[],
  item: HellToastStackItem,
  exitSnapshot: ReadonlyMap<number, HellToastStackSnapshot> = new Map(),
): number {
  if (item.removing) return exitSnapshot.get(item.id)?.front ?? 0;
  let n = 0;
  for (let j = list.indexOf(item) + 1; j < list.length; j++) {
    if (!list[j].removing) n++;
  }
  return n;
}

/** CSS pixel offset from the stack front, preserving exit snapshots while removing. */
export function hellToastOffsetPx(
  list: readonly HellToastStackItem[],
  item: HellToastStackItem,
  heights: ReadonlyMap<number, number>,
  maxVisible: number,
  exitSnapshot: ReadonlyMap<number, HellToastStackSnapshot> = new Map(),
): string {
  if (item.removing)
    return exitSnapshot.get(item.id)?.offset ?? hellToastHeightPx(item.id, heights);
  return hellToastLiveOffsetPx(list, item, heights, maxVisible);
}

/** Number of visible positions by which an item exceeds `maxVisible`. */
export function hellToastOverflow(
  list: readonly HellToastStackItem[],
  item: HellToastStackItem,
  maxVisible: number,
  exitSnapshot: ReadonlyMap<number, HellToastStackSnapshot> = new Map(),
): number {
  return Math.max(0, hellToastFrontDistance(list, item, exitSnapshot) - (maxVisible - 1));
}

/** Measured toast height in CSS pixels, falling back before measurement exists. */
export function hellToastHeightPx(id: number, heights: ReadonlyMap<number, number>): string {
  return `${heights.get(id) ?? TOAST_FALLBACK_HEIGHT}px`;
}

/** Capture and retain removing-toast positions so exit animations do not jump. */
export function hellToastSnapshotExits(
  list: readonly HellToastStackItem[],
  heights: ReadonlyMap<number, number>,
  maxVisible: number,
  current: ReadonlyMap<number, HellToastStackSnapshot>,
): Map<number, HellToastStackSnapshot> {
  const next = new Map(current);
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item.removing || next.has(item.id)) continue;
    next.set(item.id, {
      front: list.length - 1 - i,
      offset: hellToastLiveOffsetFromIndex(list, i, heights, maxVisible),
    });
  }
  for (const id of [...next.keys()]) {
    if (!list.some((item) => item.id === id)) next.delete(id);
  }
  return next;
}

function hellToastStackSnapshotsEqual(
  a: ReadonlyMap<number, HellToastStackSnapshot>,
  b: ReadonlyMap<number, HellToastStackSnapshot>,
): boolean {
  if (a.size !== b.size) return false;
  for (const [id, snapshot] of a) {
    const other = b.get(id);
    if (!other || other.front !== snapshot.front || other.offset !== snapshot.offset) return false;
  }
  return true;
}

function hellToastLiveOffsetPx(
  list: readonly HellToastStackItem[],
  item: HellToastStackItem,
  heights: ReadonlyMap<number, number>,
  maxVisible: number,
): string {
  return hellToastLiveOffsetFromIndex(list, list.indexOf(item), heights, maxVisible);
}

function hellToastLiveOffsetFromIndex(
  list: readonly HellToastStackItem[],
  index: number,
  heights: ReadonlyMap<number, number>,
  maxVisible: number,
): string {
  let acc = 0;
  let counted = 0;
  for (let j = index + 1; j < list.length; j++) {
    if (list[j].removing) continue;
    if (counted >= maxVisible - 1) break;
    acc += (heights.get(list[j].id) ?? TOAST_FALLBACK_HEIGHT) + TOAST_STACK_GAP;
    counted++;
  }
  return `${acc}px`;
}

/**
 * Global toast store. Mount one `hell-toaster` in the app shell; callers can
 * inject this service anywhere, show toasts, update by stable id, and pause or
 * resume timers while the stack is hovered/focused.
 */
@Injectable({ providedIn: 'root' })
export class HellToastService {
  private nextId = 1;
  private timers = new Map<
    number,
    { handle: ReturnType<typeof setTimeout>; remaining: number; startedAt: number }
  >();

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
    const list = this.toasts();
    const existing = list.findIndex((t) => t.id === id);
    if (existing >= 0) {
      const copy = [...list];
      copy[existing] = next;
      this.toasts.set(copy);
    } else {
      this.toasts.set([...list, next]);
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
    setTimeout(() => {
      this.toasts.set(this.toasts().filter((t) => t.id !== id));
    }, EXIT_MS);
  }

  /** Dismiss every toast currently mounted. */
  dismissAll(): void {
    for (const t of this.toasts()) this.dismiss(t.id);
  }

  /** Pause auto-dismiss for every toast (used while the stack is hovered). */
  pauseAll(): void {
    for (const [id, t] of this.timers) {
      clearTimeout(t.handle);
      const elapsed = Date.now() - t.startedAt;
      this.timers.set(id, {
        handle: 0 as unknown as ReturnType<typeof setTimeout>,
        remaining: Math.max(0, t.remaining - elapsed),
        startedAt: Date.now(),
      });
    }
  }

  /** Resume auto-dismiss for every paused toast. */
  resumeAll(): void {
    for (const [id, t] of this.timers) {
      if (t.remaining <= 0) continue;
      const handle = setTimeout(() => this.dismiss(id), t.remaining);
      this.timers.set(id, { handle, remaining: t.remaining, startedAt: Date.now() });
    }
  }

  private scheduleAutoDismiss(t: ToastInternal): void {
    this.clearTimer(t.id);
    if (t.duration <= 0) return;
    const handle = setTimeout(() => this.dismiss(t.id), t.duration);
    this.timers.set(t.id, { handle, remaining: t.duration, startedAt: Date.now() });
  }

  private clearTimer(id: number): void {
    const t = this.timers.get(id);
    if (!t) return;
    clearTimeout(t.handle);
    this.timers.delete(id);
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
  },
  template: `
    @if (hasToasts()) {
      <ol
        data-slot="list"
        role="region"
        aria-label="Notifications"
        tabindex="-1"
        (mouseenter)="onEnter()"
        (mouseleave)="onLeave()"
        (focusin)="onEnter()"
        (focusout)="onLeave()"
      >
        @for (t of svc.toasts(); track t.id; let i = $index) {
          <li
            data-slot="toast"
            [attr.data-variant]="t.variant"
            [attr.data-state]="t.removing ? 'closed' : 'open'"
            [attr.data-front]="frontDistance(t)"
            [attr.data-visible]="frontDistance(t) < maxVisible() ? 'true' : 'false'"
            [attr.data-overflow]="overflow(t) > 0 ? overflow(t) : null"
            [style.--hell-toast-front]="frontDistance(t)"
            [style.--hell-toast-overflow]="overflow(t)"
            [style.--hell-toast-offset]="offsetPx(t)"
            [style.--hell-toast-h]="heightPx(t.id)"
            [style.--hell-toast-z]="i + 1"
            (mouseenter)="svc.pauseAll()"
            (mouseleave)="svc.resumeAll()"
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
                (click)="t.action!.onClick(() => svc.dismiss(t.id))"
              >
                {{ t.action.label }}
              </button>
            }

            @if (t.dismissible) {
              <button
                type="button"
                data-slot="close"
                aria-label="Dismiss"
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
    }
  `,
})
export class HellToaster extends HellStyleable {
  readonly svc = inject(HellToastService);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;

  protected readonly hasToasts = computed(() => this.svc.toasts().length > 0);

  readonly position = input<HellToastPosition>('bottom-right');
  readonly maxVisible = input<number>(3);

  protected readonly expanded = signal(false);
  /** id → measured pixel height */
  private readonly heights = signal(new Map<number, number>());
  /** Frozen layout for toasts that are currently exiting, so survivors can
   *  slide into the freed slot while the dismissed toast keeps its position. */
  private readonly exitSnapshot = signal(new Map<number, { front: number; offset: string }>());
  private ro: ResizeObserver | null = null;
  private observed = new WeakSet<Element>();
  /** Pending collapse handle. Re-entry cancels it so transient mouseleave
   *  events during dismiss-driven reflows don't yank the stack closed. */
  private collapseHandle: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super();
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
      const snap = hellToastSnapshotExits(
        list,
        this.heights(),
        this.maxVisible(),
        this.exitSnapshot(),
      );
      if (!hellToastStackSnapshotsEqual(snap, this.exitSnapshot())) this.exitSnapshot.set(snap);
      // Re-observe after the list changed.
      queueMicrotask(() => this.observeAll());
    });
  }

  protected onEnter() {
    if (this.collapseHandle != null) {
      clearTimeout(this.collapseHandle);
      this.collapseHandle = null;
    }
    this.expanded.set(true);
    this.svc.pauseAll();
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
      this.expanded.set(false);
      this.svc.resumeAll();
    }, 320);
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
   *  Toasts beyond `maxVisible` clamp to the back-most visible slot so they
   *  peek behind it instead of running off-screen. */
  protected offsetPx(t: ToastInternal): string {
    return hellToastOffsetPx(
      this.svc.toasts(),
      t,
      this.heights(),
      this.maxVisible(),
      this.exitSnapshot(),
    );
  }

  /** How many positions past the visible cap this toast sits (>=0). */
  protected overflow(t: ToastInternal): number {
    return hellToastOverflow(this.svc.toasts(), t, this.maxVisible(), this.exitSnapshot());
  }

  protected heightPx(id: number): string {
    return hellToastHeightPx(id, this.heights());
  }

  protected ctxFor(id: number) {
    return { id, dismiss: () => this.svc.dismiss(id) };
  }

  private observeAll(): void {
    if (typeof ResizeObserver === 'undefined') return;
    if (!this.ro) {
      this.ro = new ResizeObserver((entries) => {
        let changed = false;
        const next = new Map(this.heights());
        for (const e of entries) {
          const id = Number((e.target as HTMLElement).dataset['toastId']);
          if (!Number.isFinite(id)) continue;
          const h = (e.target as HTMLElement).getBoundingClientRect().height;
          if (next.get(id) !== h) {
            next.set(id, h);
            changed = true;
          }
        }
        if (changed) this.heights.set(next);
      });
    }
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
      const h = el.getBoundingClientRect().height;
      if (cur !== h && h > 0) {
        const next = new Map(this.heights());
        next.set(id, h);
        this.heights.set(next);
      }
    });
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
}

export const HELL_TOAST_DIRECTIVES = [HellToaster, HellToastTemplate] as const;
