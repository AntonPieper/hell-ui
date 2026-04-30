import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  HostListener,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { HellOrientation } from '../../core/types';

/**
 * Resizable group. Wrap two or more `[hellResizablePane]` elements with
 * explicit `[hellResizableHandle]` siblings between them inside a
 * `[hellResizable]` host. The container splits its main-axis size between
 * panes proportionally; dragging a handle redistributes size between the
 * two adjacent panes only — other panes are unaffected. Works with mouse,
 * touch, pen, and keyboard (arrow keys; Home/End jump to the pane min/max).
 */
@Directive({
  selector: '[hellResizable]',
  host: {
    '[class.hell-resizable]': '!unstyled()',
    '[attr.data-orientation]': 'orientation()',
  },
  exportAs: 'hellResizable',
})
export class HellResizable implements AfterContentInit {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly orientation = input<HellOrientation>('horizontal');
  readonly rescaleOnResize = input(true, { transform: booleanAttribute });

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly constrained = signal(false);
  private userSized = false;

  // Populated by panes during ngOnInit. Order corresponds to DOM order.
  private readonly panes: HellResizablePane[] = [];

  constructor() {
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => this.fitPanesToAvailableSize());
    observer.observe(this.host);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  registerPane(p: HellResizablePane) {
    if (!this.panes.includes(p)) this.panes.push(p);
    queueMicrotask(() => this.fitPanesToAvailableSize());
  }
  unregisterPane(p: HellResizablePane) {
    const i = this.panes.indexOf(p);
    if (i >= 0) this.panes.splice(i, 1);
    queueMicrotask(() => this.fitPanesToAvailableSize());
  }

  ngAfterContentInit() {
    // Sort by DOM order to be safe (initial registration order can vary).
    this.panes.sort((a, b) => {
      const pos = a.host.compareDocumentPosition(b.host);
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    this.fitPanesToAvailableSize();
  }

  /** All panes in DOM order. */
  getPanes(): readonly HellResizablePane[] {
    return this.panes;
  }

  /** Find the index of a pane (or -1). */
  indexOf(p: HellResizablePane | null) {
    return p ? this.panes.indexOf(p) : -1;
  }

  /** Total available size on the main axis, minus handles. */
  getAvailableSize(): number {
    const horizontal = this.orientation() === 'horizontal';
    const total = horizontal ? this.host.clientWidth : this.host.clientHeight;
    let handlesSize = 0;
    const handles = (this.host as HTMLElement).querySelectorAll(
      ':scope > [hellResizableHandle], :scope > .hell-resizable-handle',
    ) as NodeListOf<HTMLElement>;
    handles.forEach((h: HTMLElement) => {
      handlesSize += horizontal ? h.offsetWidth : h.offsetHeight;
    });
    return Math.max(0, total - handlesSize);
  }

  isConstrained(): boolean {
    return this.constrained();
  }

  markUserSized(): void {
    this.userSized = true;
  }

  fitPanesToAvailableSize(): void {
    if (!this.rescaleOnResize()) return;

    const panes = this.getPanes();
    if (!panes.length) return;

    const available = this.getAvailableSize();
    if (available <= 0) return;

    const minSizes = panes.map((pane) => pane.minSize());
    const minTotal = minSizes.reduce((sum, value) => sum + value, 0);
    const isConstrained = available < minTotal;
    this.constrained.set(isConstrained);

    if (!this.userSized && !isConstrained) {
      for (const pane of panes) {
        pane.setEffectiveMinSize(null);
        if (pane.hasSize()) pane.resetSize();
      }
      return;
    }

    const hasExplicitSize = panes.some((pane) => pane.hasSize());
    if (!hasExplicitSize && !isConstrained) {
      for (const pane of panes) pane.setEffectiveMinSize(null);
      return;
    }

    const sourceSizes = panes.map((pane, index) => (pane.currentSize() ?? pane.measure()) || minSizes[index]);
    const sourceTotal = sourceSizes.reduce((sum, value) => sum + value, 0);
    if (!isConstrained && Math.abs(sourceTotal - available) < 1) {
      for (const pane of panes) pane.setEffectiveMinSize(null);
      return;
    }

    const fitted = this.fitSizesToTotal(sourceSizes, minSizes, available);
    for (let i = 0; i < panes.length; i++) {
      const effectiveMin = isConstrained ? Math.min(minSizes[i], fitted[i]) : null;
      panes[i].setEffectiveMinSize(effectiveMin);
    }
    for (let i = 0; i < panes.length; i++) panes[i].setSize(fitted[i]);
  }

  private fitSizesToTotal(
    sourceSizes: readonly number[],
    minSizes: readonly number[],
    total: number,
  ): number[] {
    const count = sourceSizes.length;
    const sourceTotal = sourceSizes.reduce((sum, value) => sum + value, 0);
    const minTotal = minSizes.reduce((sum, value) => sum + value, 0);
    const source = sourceTotal > 0 ? sourceSizes : minSizes;
    const baseTotal = source.reduce((sum, value) => sum + value, 0) || count;

    if (minTotal > total) {
      return source.map((value) => (total * value) / baseTotal);
    }

    const result = new Array<number>(count).fill(0);
    const remaining = new Set(source.map((_, index) => index));
    let remainingTotal = total;
    let remainingSourceTotal = baseTotal;

    while (remaining.size > 0) {
      const scale = remainingSourceTotal > 0 ? remainingTotal / remainingSourceTotal : 1;
      let clamped = false;

      for (const index of Array.from(remaining)) {
        const next = source[index] * scale;
        if (next < minSizes[index]) {
          result[index] = minSizes[index];
          remaining.delete(index);
          remainingTotal -= minSizes[index];
          remainingSourceTotal -= source[index];
          clamped = true;
        }
      }

      if (!clamped) {
        for (const index of remaining) result[index] = source[index] * scale;
        break;
      }
    }

    const resultTotal = result.reduce((sum, value) => sum + value, 0);
    const delta = total - resultTotal;
    if (Math.abs(delta) > 0.01) result[count - 1] += delta;
    return result.map((value) => Math.max(0, value));
  }
}

@Directive({
  selector: '[hellResizablePane]',
  host: {
    '[class.hell-resizable-pane]': '!unstyled()',
    '[attr.data-orientation]': 'orientation()',
  },
})
export class HellResizablePane {
  readonly unstyled = input(false, { transform: booleanAttribute });
  /** Initial flex grow factor — used until the user starts dragging. */
  readonly initialFlex = input(1, { transform: numberAttribute });
  /** Minimum pane size in pixels. */
  readonly minSize = input(80, { transform: numberAttribute });

  /** Current absolute size in pixels — set by the handle once dragging
   *  starts. While `null`, the pane uses its initial flex grow factor. */
  readonly _size = signal<number | null>(null);
  private readonly effectiveMinSize = signal<number | null>(null);

  protected readonly flexValue = computed(() => {
    const px = this._size();
    return px == null ? `${this.initialFlex()} 1 0` : `0 0 ${px}px`;
  });
  protected readonly minSizeValue = computed(() => this.effectiveMinSize() ?? this.minSize());

  readonly resizable = inject(HellResizable);
  readonly host: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  protected readonly orientation = this.resizable.orientation;

  constructor() {
    this.resizable.registerPane(this);
    effect(() => {
      this.writeFlexValue(this.flexValue());
      this.writeMinSizeValue(this.minSizeValue());
    });
  }

  ngOnDestroy() {
    this.resizable.unregisterPane(this);
  }

  setSize(px: number) {
    this._size.set(px);
    this.writeFlexValue(this.flexValue());
  }

  resetSize() {
    this._size.set(null);
    this.writeFlexValue(this.flexValue());
  }

  hasSize(): boolean {
    return this._size() != null;
  }

  currentSize(): number | null {
    return this._size();
  }

  setEffectiveMinSize(px: number | null): void {
    this.effectiveMinSize.set(px);
    this.writeMinSizeValue(this.minSizeValue());
  }

  currentMinSize(): number {
    return this.minSizeValue();
  }

  measure(): number {
    return this.orientation() === 'horizontal' ? this.host.offsetWidth : this.host.offsetHeight;
  }

  private writeFlexValue(value: string): void {
    this.host.style.setProperty('--_hell-resizable-pane-flex', value);
  }

  private writeMinSizeValue(value: number): void {
    this.host.style.setProperty('--_hell-resizable-pane-min-size', `${value}px`);
  }
}

const KEY_DELTA = 16;

interface ResizeDragState {
  pointerId: number;
  horizontal: boolean;
  prev: HellResizablePane;
  next: HellResizablePane;
  startA: number;
  sum: number;
  startCoord: number;
  minA: number;
  minB: number;
}

@Component({
  selector: '[hellResizableHandle]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hell-resizable-handle]': '!unstyled()',
    '[attr.data-active]': 'dragging() ? "true" : null',
    '[attr.data-appearance]': 'appearance()',
    '[attr.aria-orientation]':
      'resizable.orientation() === "horizontal" ? "vertical" : "horizontal"',
    '[attr.aria-disabled]': 'resizable.isConstrained() ? "true" : null',
    role: 'separator',
    '[attr.tabindex]': 'resizable.isConstrained() ? "-1" : "0"',
    '[attr.aria-valuenow]': 'ariaValueNow()',
  },
  template: '<span data-slot="grip" aria-hidden="true"></span>',
})
export class HellResizableHandle {
  readonly unstyled = input(false, { transform: booleanAttribute });
  /**
   * Visual treatment for the handle.
   * - `line`  (default) — minimal hairline that thickens on hover.
   * - `grip`  — pill-shaped grip with dotted indicator. Recommended when
   *   the handle is the primary affordance.
   */
  readonly appearance = input<'line' | 'grip'>('line');

  protected readonly dragging = signal(false);
  protected readonly ariaValueNow = signal<number | null>(null);

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  protected readonly resizable = inject(HellResizable);
  private dragState: ResizeDragState | null = null;

  /** Lookup the panes immediately preceding and following this handle. */
  private adjacent(): { prev: HellResizablePane | null; next: HellResizablePane | null } {
    const parent = this.host.parentElement;
    if (!parent) return { prev: null, next: null };

    const panes = this.resizable.getPanes();
    const children = Array.from(parent.children) as HTMLElement[];
    const handleIndex = children.indexOf(this.host);
    if (handleIndex < 0) return { prev: null, next: null };

    const paneFor = (element: HTMLElement) => panes.find((pane) => pane.host === element) ?? null;
    const findPane = (start: number, step: 1 | -1): HellResizablePane | null => {
      for (let i = start; i >= 0 && i < children.length; i += step) {
        const pane = paneFor(children[i]);
        if (pane) return pane;
      }
      return null;
    };

    return {
      prev: findPane(handleIndex - 1, -1),
      next: findPane(handleIndex + 1, 1),
    };
  }

  private lockPanes(): Map<HellResizablePane, number> {
    const panes = this.resizable.getPanes();
    const sizes = new Map<HellResizablePane, number>();
    for (const pane of panes) sizes.set(pane, pane.measure());
    for (const pane of panes) pane.setSize(sizes.get(pane) ?? pane.measure());
    return sizes;
  }

  private constrain(value: number, sum: number, minA: number, minB: number): number {
    if (sum <= 0) return 0;

    const minTotal = minA + minB;
    if (minTotal > sum) {
      return Math.max(0, Math.min(sum, value));
    }

    return Math.max(minA, Math.min(sum - minB, value));
  }

  private applyDrag(e: PointerEvent): void {
    const state = this.dragState;
    if (!state || e.pointerId !== state.pointerId) return;

    e.preventDefault();
    const delta = (state.horizontal ? e.clientX : e.clientY) - state.startCoord;
    const newA = this.constrain(
      state.startA + delta,
      state.sum,
      state.minA,
      state.minB,
    );
    state.prev.setSize(newA);
    state.next.setSize(state.sum - newA);
    this.ariaValueNow.set(Math.round((newA / state.sum) * 100));
  }

  private finishDrag(e?: PointerEvent): void {
    const state = this.dragState;
    if (!state) return;

    if (!e || e.pointerId === state.pointerId) {
      this.dragState = null;
      this.dragging.set(false);
      try {
        this.host.releasePointerCapture?.(state.pointerId);
      } catch {}
    }
  }

  @HostListener('pointerdown', ['$event'])
  protected onPointerDown(e: PointerEvent) {
    // Only react to primary button / first touch / any pen.
    if (e.button !== 0) return;
    this.resizable.fitPanesToAvailableSize();
    if (this.resizable.isConstrained()) return;

    const { prev, next } = this.adjacent();
    if (!prev || !next) {
      return;
    }

    e.preventDefault();
    const horizontal = this.resizable.orientation() === 'horizontal';
    const sizes = this.lockPanes();
    const startA = sizes.get(prev) ?? prev.measure();
    const startB = sizes.get(next) ?? next.measure();
    const sumAB = startA + startB;
    if (sumAB <= 0) return;

    const startCoord = horizontal ? e.clientX : e.clientY;
    this.resizable.markUserSized();

    this.dragState = {
      pointerId: e.pointerId,
      horizontal,
      prev,
      next,
      startA,
      sum: sumAB,
      startCoord,
      minA: prev.currentMinSize(),
      minB: next.currentMinSize(),
    };
    this.dragging.set(true);

    try {
      this.host.setPointerCapture?.(e.pointerId);
    } catch {}
  }

  @HostListener('pointermove', ['$event'])
  protected onPointerMove(e: PointerEvent) {
    this.applyDrag(e);
  }

  @HostListener('pointerup', ['$event'])
  @HostListener('pointercancel', ['$event'])
  protected onPointerEnd(e: PointerEvent) {
    if (this.dragState?.pointerId !== e.pointerId) return;
    e.preventDefault();
    this.finishDrag(e);
  }

  @HostListener('lostpointercapture', ['$event'])
  protected onLostPointerCapture(e: PointerEvent) {
    this.finishDrag(e);
  }

  @HostListener('keydown', ['$event'])
  protected onKey(e: KeyboardEvent) {
    this.resizable.fitPanesToAvailableSize();
    if (this.resizable.isConstrained()) return;

    const horizontal = this.resizable.orientation() === 'horizontal';
    const { prev, next } = this.adjacent();
    if (!prev || !next) return;
    const decrement = horizontal ? e.key === 'ArrowLeft' : e.key === 'ArrowUp';
    const increment = horizontal ? e.key === 'ArrowRight' : e.key === 'ArrowDown';
    const home = e.key === 'Home';
    const end = e.key === 'End';
    if (!decrement && !increment && !home && !end) return;
    e.preventDefault();
    const sizes = this.lockPanes();
    const a = sizes.get(prev) ?? prev.measure();
    const b = sizes.get(next) ?? next.measure();
    const sum = a + b;
    if (sum <= 0) return;

    this.resizable.markUserSized();
    let newA = a;
    if (home) newA = prev.currentMinSize();
    else if (end) newA = sum - next.currentMinSize();
    else newA = a + (increment ? KEY_DELTA : -KEY_DELTA);
    newA = this.constrain(newA, sum, prev.currentMinSize(), next.currentMinSize());
    prev.setSize(newA);
    next.setSize(sum - newA);
    this.ariaValueNow.set(Math.round((newA / sum) * 100));
  }
}

export const HELL_RESIZABLE_DIRECTIVES = [
  HellResizable,
  HellResizablePane,
  HellResizableHandle,
] as const;
