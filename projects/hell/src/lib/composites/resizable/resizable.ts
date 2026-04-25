import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  Directive,
  ElementRef,
  HostListener,
  QueryList,
  booleanAttribute,
  computed,
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

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;

  // Populated by panes during ngOnInit. Order corresponds to DOM order.
  private readonly panes: HellResizablePane[] = [];

  registerPane(p: HellResizablePane) {
    if (!this.panes.includes(p)) this.panes.push(p);
  }
  unregisterPane(p: HellResizablePane) {
    const i = this.panes.indexOf(p);
    if (i >= 0) this.panes.splice(i, 1);
  }

  ngAfterContentInit() {
    // Sort by DOM order to be safe (initial registration order can vary).
    this.panes.sort((a, b) => {
      const pos = a.host.compareDocumentPosition(b.host);
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
  }

  /** All panes in DOM order. */
  getPanes(): readonly HellResizablePane[] { return this.panes; }

  /** Find the index of a pane (or -1). */
  indexOf(p: HellResizablePane | null) {
    return p ? this.panes.indexOf(p) : -1;
  }

  /** Total available size on the main axis, minus handles. */
  getAvailableSize(): number {
    const horizontal = this.orientation() === 'horizontal';
    const total = horizontal
      ? this.host.clientWidth
      : this.host.clientHeight;
    let handlesSize = 0;
    const handles = (this.host as HTMLElement).querySelectorAll(
      ':scope > [hellResizableHandle], :scope > .hell-resizable-handle',
    ) as NodeListOf<HTMLElement>;
    handles.forEach((h: HTMLElement) => {
      handlesSize += horizontal ? h.offsetWidth : h.offsetHeight;
    });
    return Math.max(0, total - handlesSize);
  }
}

@Directive({
  selector: '[hellResizablePane]',
  host: {
    '[class.hell-resizable-pane]': '!unstyled()',
    '[attr.data-orientation]': 'orientation()',
    '[style.--_hell-resizable-pane-flex]': 'flexValue()',
    '[style.--_hell-resizable-pane-min-size]': 'minSize() + "px"',
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

  protected readonly flexValue = computed(() => {
    const px = this._size();
    return px == null
      ? `${this.initialFlex()} 1 0`
      : `0 0 ${px}px`;
  });

  readonly resizable = inject(HellResizable);
  readonly host: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  protected readonly orientation = this.resizable.orientation;

  constructor() {
    this.resizable.registerPane(this);
  }

  ngOnDestroy() {
    this.resizable.unregisterPane(this);
  }

  setSize(px: number) { this._size.set(px); }

  measure(): number {
    return this.orientation() === 'horizontal'
      ? this.host.offsetWidth
      : this.host.offsetHeight;
  }
}

const KEY_DELTA = 16;

@Component({
  selector: '[hellResizableHandle]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hell-resizable-handle]': '!unstyled()',
    '[attr.data-active]': 'dragging() ? "true" : null',
    '[attr.data-appearance]': 'appearance()',
    '[attr.aria-orientation]': 'resizable.orientation() === "horizontal" ? "vertical" : "horizontal"',
    role: 'separator',
    tabindex: '0',
    '[attr.aria-valuenow]': 'ariaValueNow()',
  },
  template: '<span class="hell-resizable-handle-grip" aria-hidden="true"></span>',
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

  /** Lookup the panes immediately preceding and following this handle. */
  private adjacent(): { prev: HellResizablePane | null; next: HellResizablePane | null } {
    const panes = this.resizable.getPanes();
    let prev: HellResizablePane | null = null;
    let next: HellResizablePane | null = null;
    for (const p of panes) {
      const cmp = this.host.compareDocumentPosition(p.host);
      if (cmp & Node.DOCUMENT_POSITION_PRECEDING) prev = p; // pane is before handle
      else if (cmp & Node.DOCUMENT_POSITION_FOLLOWING && !next) { next = p; break; }
    }
    return { prev, next };
  }

  @HostListener('pointerdown', ['$event'])
  protected onPointerDown(e: PointerEvent) {
    // Only react to primary button / first touch / any pen.
    if (e.button !== 0) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    this.dragging.set(true);
    const horizontal = this.resizable.orientation() === 'horizontal';

    // Lock every pane's current pixel size so the third-pane drift bug
    // (proportional flex grow factors stealing space from non-adjacent
    // panes) cannot happen. Only the two adjacent panes will be mutated.
    for (const p of this.resizable.getPanes()) p.setSize(p.measure());

    const { prev, next } = this.adjacent();
    if (!prev || !next) return;

    const startA = prev.measure();
    const startB = next.measure();
    const sumAB = startA + startB;
    const startCoord = horizontal ? e.clientX : e.clientY;
    const minA = prev.minSize();
    const minB = next.minSize();

    const move = (ev: PointerEvent) => {
      const delta = (horizontal ? ev.clientX : ev.clientY) - startCoord;
      let newA = startA + delta;
      let newB = startB - delta;
      if (newA < minA) { newA = minA; newB = sumAB - minA; }
      if (newB < minB) { newB = minB; newA = sumAB - minB; }
      prev.setSize(newA);
      next.setSize(newB);
      this.ariaValueNow.set(Math.round((newA / sumAB) * 100));
    };
    const up = (ev: PointerEvent) => {
      this.dragging.set(false);
      try { (e.target as Element).releasePointerCapture?.(e.pointerId); } catch {}
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  @HostListener('keydown', ['$event'])
  protected onKey(e: KeyboardEvent) {
    const horizontal = this.resizable.orientation() === 'horizontal';
    const { prev, next } = this.adjacent();
    if (!prev || !next) return;
    const decrement = horizontal
      ? e.key === 'ArrowLeft'
      : e.key === 'ArrowUp';
    const increment = horizontal
      ? e.key === 'ArrowRight'
      : e.key === 'ArrowDown';
    const home = e.key === 'Home';
    const end = e.key === 'End';
    if (!decrement && !increment && !home && !end) return;
    e.preventDefault();
    // Lock every pane on first keypress.
    for (const p of this.resizable.getPanes()) {
      if (p._size() == null) p.setSize(p.measure());
    }
    const a = prev.measure();
    const b = next.measure();
    const sum = a + b;
    let newA = a;
    if (home) newA = prev.minSize();
    else if (end) newA = sum - next.minSize();
    else newA = a + (increment ? KEY_DELTA : -KEY_DELTA);
    newA = Math.max(prev.minSize(), Math.min(sum - next.minSize(), newA));
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
