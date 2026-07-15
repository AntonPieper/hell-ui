import {
  DestroyRef,
  Directive,
  ElementRef,
  InjectionToken,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import type { LiveAnnouncer } from '@angular/cdk/a11y';

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
import type {
  HellToastAction,
  HellToastLabels,
  HellToastOptions,
  HellToastPosition,
  HellToastRef,
  HellToastUpdate,
  HellToastVariant,
} from './toast';

interface ToastInternal {
  readonly id: number;
  readonly ref: HellToastRef;
  readonly title: string;
  readonly description: string;
  readonly variant: HellToastVariant;
  readonly duration: number;
  readonly dismissible: boolean;
  readonly template: HellToastOptions['template'] | null;
  readonly action: HellToastAction | null;
  readonly removing: boolean;
}

interface ToastTimer {
  readonly handle: ReturnType<typeof setTimeout> | null;
  readonly remaining: number;
  readonly startedAt: number;
  readonly paused: boolean;
}

const DEFAULT_DURATION = 4500;
const EXIT_MS = 220;

export class ɵHellToastStack {
  private nextId = 1;
  private readonly timers = new Map<number, ToastTimer>();
  private readonly exitTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private timersPaused = false;

  readonly toasts = signal<ToastInternal[]>([]);

  constructor(
    private readonly announcer: LiveAnnouncer,
    readonly labels: HellToastLabels,
  ) {}

  create(opts: HellToastOptions): HellToastRef {
    const id = this.nextId++;
    const ref: HellToastRef = Object.freeze({
      update: (patch: HellToastUpdate) => this.update(id, patch),
      dismiss: () => this.dismiss(id),
    });
    const next: ToastInternal = {
      id,
      ref,
      title: opts.title ?? '',
      description: opts.description ?? '',
      variant: opts.variant ?? 'default',
      duration: opts.duration ?? DEFAULT_DURATION,
      dismissible: opts.dismissible ?? true,
      template: opts.template ?? null,
      action: opts.action ?? null,
      removing: false,
    };

    this.toasts.update((list) => [...list, next]);
    this.announceToast(next, opts.announcement);
    this.scheduleAutoDismiss(next);
    return ref;
  }

  update(id: number, patch: HellToastUpdate): void {
    const list = this.toasts();
    const index = list.findIndex((toast) => toast.id === id);
    const current = list[index];
    if (!current || current.removing) return;

    const next: ToastInternal = {
      ...current,
      title: patch.title === undefined ? current.title : (patch.title ?? ''),
      description:
        patch.description === undefined ? current.description : (patch.description ?? ''),
      variant: patch.variant ?? current.variant,
      duration: patch.duration ?? current.duration,
      action: patch.action === undefined ? current.action : patch.action,
      dismissible: patch.dismissible ?? current.dismissible,
      template: patch.template === undefined ? current.template : patch.template,
    };
    const copy = [...list];
    copy[index] = next;
    this.toasts.set(copy);

    if (patch.duration !== undefined) this.scheduleAutoDismiss(next);
  }

  dismiss(id: number): void {
    const list = this.toasts();
    const index = list.findIndex((toast) => toast.id === id);
    const current = list[index];
    if (!current || current.removing) return;

    this.clearTimer(id);
    const copy = [...list];
    copy[index] = { ...current, removing: true };
    this.toasts.set(copy);
    this.clearExitTimer(id);
    const handle = setTimeout(() => {
      this.exitTimers.delete(id);
      const latest = this.toasts().find((toast) => toast.id === id);
      if (!latest?.removing) return;
      this.toasts.set(this.toasts().filter((toast) => toast.id !== id));
    }, EXIT_MS);
    this.exitTimers.set(id, handle);
  }

  dismissAll(): void {
    for (const toast of this.toasts()) this.dismiss(toast.id);
  }

  pause(): void {
    if (this.timersPaused) return;
    this.timersPaused = true;
    for (const [id, timer] of this.timers) {
      if (timer.paused) continue;
      if (timer.handle) clearTimeout(timer.handle);
      const elapsed = Date.now() - timer.startedAt;
      this.timers.set(id, {
        handle: null,
        remaining: Math.max(0, timer.remaining - elapsed),
        startedAt: Date.now(),
        paused: true,
      });
    }
  }

  resume(): void {
    if (!this.timersPaused) return;
    this.timersPaused = false;
    for (const [id, timer] of this.timers) {
      if (!timer.paused) continue;
      if (timer.remaining <= 0) {
        this.dismiss(id);
        continue;
      }
      const handle = setTimeout(() => this.dismiss(id), timer.remaining);
      this.timers.set(id, {
        handle,
        remaining: timer.remaining,
        startedAt: Date.now(),
        paused: false,
      });
    }
  }

  destroy(): void {
    for (const timer of this.timers.values()) {
      if (timer.handle) clearTimeout(timer.handle);
    }
    for (const handle of this.exitTimers.values()) clearTimeout(handle);
    this.timers.clear();
    this.exitTimers.clear();
  }

  private scheduleAutoDismiss(toast: ToastInternal): void {
    this.clearTimer(toast.id);
    if (toast.duration <= 0) return;
    if (this.timersPaused) {
      this.timers.set(toast.id, {
        handle: null,
        remaining: toast.duration,
        startedAt: Date.now(),
        paused: true,
      });
      return;
    }
    const handle = setTimeout(() => this.dismiss(toast.id), toast.duration);
    this.timers.set(toast.id, {
      handle,
      remaining: toast.duration,
      startedAt: Date.now(),
      paused: false,
    });
  }

  private announceToast(toast: ToastInternal, explicit?: string): void {
    const explicitAnnouncement = explicit?.trim();
    const announcement =
      explicitAnnouncement ||
      [toast.title, toast.description].filter((part) => part.length > 0).join('. ') ||
      (toast.template ? this.labels.notification : '');
    if (!announcement) return;
    void this.announcer.announce(announcement, 'polite');
  }

  private clearTimer(id: number): void {
    const timer = this.timers.get(id);
    if (!timer) return;
    if (timer.handle) clearTimeout(timer.handle);
    this.timers.delete(id);
  }

  private clearExitTimer(id: number): void {
    const handle = this.exitTimers.get(id);
    if (!handle) return;
    clearTimeout(handle);
    this.exitTimers.delete(id);
  }
}

const toastStacks = new WeakMap<object, ɵHellToastStack>();

export function ɵregisterToastStack(owner: object, stack: ɵHellToastStack): void {
  toastStacks.set(owner, stack);
}

export function ɵunregisterToastStack(owner: object, stack: ɵHellToastStack): void {
  if (toastStacks.get(owner) === stack) toastStacks.delete(owner);
}

function toastStackFor(owner: object): ɵHellToastStack {
  const stack = toastStacks.get(owner);
  if (!stack) throw new Error('HellToastService stack is unavailable');
  return stack;
}

export const ɵHELL_TOAST_STACK_OWNER = new InjectionToken<object>('ɵHELL_TOAST_STACK_OWNER');

export class ɵHellToastHostState {
  readonly expanded = signal(false);
  readonly scrollable = signal(false);
}

@Directive({
  selector: '[hellToastStackRenderer]',
  exportAs: 'hellToastStackRenderer',
  host: { class: 'contents' },
})
export class ɵHellToastStackRenderer {
  readonly position = input.required<HellToastPosition>();
  readonly maxVisible = input.required<number>();

  private readonly stack = toastStackFor(inject(ɵHELL_TOAST_STACK_OWNER));
  readonly toasts = this.stack.toasts;
  readonly labels = this.stack.labels;
  private readonly hostState = inject(ɵHellToastHostState);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;

  readonly hasToasts = computed(() => this.toasts().length > 0);
  readonly liveToastCount = computed(
    () => this.toasts().filter((toast) => !toast.removing).length,
  );
  readonly showDismissAll = computed(() => this.liveToastCount() > 1);
  readonly expanded = this.hostState.expanded;
  private readonly heights = signal(new Map<number, number>());
  private readonly exitSnapshot = signal(new Map<number, HellToastStackSnapshot>());
  private ro: ResizeObserver | null = null;
  private observed = new WeakSet<Element>();
  private destroyed = false;
  private readonly viewportHeight = signal(0);
  private readonly scrollTop = signal(0);
  private readonly nativeScrollbarWidth = signal(0);
  readonly stackHeightValue = computed(() =>
    hellToastStackHeightValuePx(this.toasts(), this.heights()),
  );
  readonly stackHeightPx = computed(() => hellToastStackHeightPx(this.toasts(), this.heights()));
  readonly expandedViewportHeightValue = computed(() =>
    Math.min(this.stackHeightValue(), this.viewportHeightLimit()),
  );
  readonly expandedViewportHeightPx = computed(
    () => `${this.expandedViewportHeightValue()}px`,
  );
  readonly nativeScrollbarWidthPx = computed(() => `${this.nativeScrollbarWidth()}px`);
  readonly isScrollable = computed(() => {
    const viewportHeight = this.viewportHeight();
    return (
      this.liveToastCount() > this.maxVisible() ||
      (viewportHeight > 0 && this.stackHeightValue() > viewportHeight + 1)
    );
  });
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
      this.hostState.scrollable.set(this.isScrollable());
      const list = this.toasts();
      if (list.length === 0) {
        if (this.collapseHandle != null) {
          clearTimeout(this.collapseHandle);
          this.collapseHandle = null;
        }
        this.cancelCollapseLayoutReset();
        this.expanded.set(false);
        this.stack.resume();
      }
      const snapshot = hellToastSnapshotExits(list, this.heights(), this.exitSnapshot());
      if (!hellToastStackSnapshotsEqual(snapshot, this.exitSnapshot())) {
        this.exitSnapshot.set(snapshot);
      }
      queueMicrotask(() => {
        this.observeAll();
        this.scheduleViewportStateSync();
      });
    });
  }

  onEnter(): void {
    const wasExpanded = this.expanded();
    if (this.collapseHandle != null) {
      clearTimeout(this.collapseHandle);
      this.collapseHandle = null;
    }
    this.cancelCollapseLayoutReset();
    this.expanded.set(true);
    this.stack.pause();
    this.scheduleViewportStateSync(!wasExpanded);
  }

  onLeave(): void {
    if (this.collapseHandle != null) clearTimeout(this.collapseHandle);
    this.collapseHandle = setTimeout(() => {
      this.collapseHandle = null;
      if (this.host.matches(':hover')) return;
      const active = this.host.ownerDocument.activeElement;
      if (active && this.host.contains(active)) return;
      this.collapseStack();
    }, 320);
  }

  onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.contains(next)) return;
    this.onLeave();
  }

  onViewportScroll(event: Event): void {
    this.syncViewportState(event.currentTarget as HTMLElement);
  }

  frontDistance(toast: ToastInternal): number {
    return hellToastFrontDistance(this.toasts(), toast, this.exitSnapshot());
  }

  offsetPx(toast: ToastInternal): string {
    return hellToastOffsetPx(this.toasts(), toast, this.heights(), this.exitSnapshot());
  }

  overflow(toast: ToastInternal): number {
    return hellToastOverflow(this.toasts(), toast, this.maxVisible(), this.exitSnapshot());
  }

  heightPx(id: number): string {
    return hellToastHeightPx(id, this.heights());
  }

  edgeProgress(toast: ToastInternal): number {
    if (!this.expanded()) return this.overflow(toast);
    return hellToastScrollEdgeProgress(
      this.toasts(),
      toast,
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

  edgeOpacity(toast: ToastInternal): number {
    return hellToastScrollEdgeOpacity(this.edgeProgress(toast));
  }

  isCollapsedOverflow(toast: ToastInternal): boolean {
    return !this.expanded() && this.frontDistance(toast) >= this.maxVisible();
  }

  toastControlTabIndex(toast: ToastInternal): -1 | null {
    return this.isCollapsedOverflow(toast) ? -1 : null;
  }

  dismissAll(): void {
    this.stack.dismissAll();
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
    this.stack.resume();
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
    const ResizeObserverCtor = this.host.ownerDocument.defaultView?.ResizeObserver;
    if (this.destroyed || !ResizeObserverCtor) return;
    if (!this.ro) {
      this.ro = new ResizeObserverCtor((entries: ResizeObserverEntry[]) => {
        let changed = false;
        const next = new Map(this.heights());
        const viewport = this.viewportElement();
        for (const entry of entries) {
          if (viewport && entry.target === viewport) {
            this.syncViewportState(viewport);
            continue;
          }
          const id = Number((entry.target as HTMLElement).dataset['toastId']);
          if (!Number.isFinite(id)) continue;
          const height = this.measureToastHeight(entry.target as HTMLElement);
          if (next.get(id) !== height) {
            next.set(id, height);
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
    items.forEach((element, index) => {
      const id = this.toasts()[index]?.id;
      if (id == null) return;
      element.dataset['toastId'] = String(id);
      seen.add(id);
      if (!this.observed.has(element)) {
        this.ro!.observe(element);
        this.observed.add(element);
      }
      const current = this.heights().get(id);
      const height = this.measureToastHeight(element);
      if (current !== height && height > 0) {
        const next = new Map(this.heights());
        next.set(id, height);
        this.heights.set(next);
      }
    });
    this.syncViewportState();
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
