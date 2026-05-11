import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import {
  HellResizePairInteractionController,
  hellFitResizeSizesToTotal,
  type HellResizeDirection,
} from '../../core/resize-behavior';
import { HellOrientation } from '../../core/types';
import { HellStyleable } from '../../core/styleable';

function hellElementDirection(element: HTMLElement): HellResizeDirection {
  return element.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl'
    ? 'rtl'
    : 'ltr';
}

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
export class HellResizable extends HellStyleable implements AfterContentInit {
  readonly orientation = input<HellOrientation>('horizontal');
  /** When false, container resizes do not rebalance panes after user sizing. */
  readonly rescaleOnResize = input(true, { transform: booleanAttribute });

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly constrained = signal(false);
  private userSized = false;

  // Populated by panes during ngOnInit. Order corresponds to DOM order.
  private readonly panes: HellResizablePane[] = [];

  constructor() {
    super();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => this.fitPanesToAvailableSize());
    observer.observe(this.host);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  /** Child/advanced integration hook; panes register themselves on init. */
  registerPane(p: HellResizablePane) {
    if (!this.panes.includes(p)) this.panes.push(p);
    queueMicrotask(() => this.fitPanesToAvailableSize());
  }
  /** Child/advanced integration hook; removes a pane from resize accounting. */
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

  /** Marks that explicit pixel sizes should be preserved across future fits. */
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

    const sourceSizes = panes.map(
      (pane, index) => (pane.currentSize() ?? pane.measure()) || minSizes[index],
    );
    const sourceTotal = sourceSizes.reduce((sum, value) => sum + value, 0);
    if (!isConstrained && Math.abs(sourceTotal - available) < 1) {
      for (const pane of panes) pane.setEffectiveMinSize(null);
      return;
    }

    const fitted = hellFitResizeSizesToTotal(sourceSizes, minSizes, available);
    for (let i = 0; i < panes.length; i++) {
      const effectiveMin = isConstrained ? Math.min(minSizes[i], fitted[i]) : null;
      panes[i].setEffectiveMinSize(effectiveMin);
    }
    for (let i = 0; i < panes.length; i++) panes[i].setSize(fitted[i]);
  }
}

@Directive({
  selector: '[hellResizablePane]',
  host: {
    '[class.hell-resizable-pane]': '!unstyled()',
    '[attr.data-orientation]': 'orientation()',
  },
})
export class HellResizablePane extends HellStyleable implements OnDestroy {
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
    super();
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
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.tabindex]': 'resizable.isConstrained() ? "-1" : "0"',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': '100',
    '[attr.aria-valuenow]': 'ariaValueNow()',
  },
  template: '<span data-slot="grip" aria-hidden="true"></span>',
})
export class HellResizableHandle extends HellStyleable implements OnDestroy {
  /**
   * Visual treatment for the handle.
   * - `line`  (default) — minimal hairline that thickens on hover.
   * - `grip`  — pill-shaped grip with dotted indicator. Recommended when
   *   the handle is the primary affordance.
   */
  readonly appearance = input<'line' | 'grip'>('line');
  readonly ariaLabel = input('Resize panels', { alias: 'aria-label' });

  protected readonly dragging = signal(false);
  protected readonly ariaValueNow = signal<number | null>(null);

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  protected readonly resizable = inject(HellResizable);
  private readonly resizeInteraction = new HellResizePairInteractionController<HellResizablePane>({
    handle: this.host,
    ownerWindow: () => this.host.ownerDocument.defaultView,
    onActiveChange: (active) => this.dragging.set(active),
    onValueChange: (result) => this.ariaValueNow.set(result.ariaValueNow),
    orientation: () => (this.resizable.orientation() === 'horizontal' ? 'horizontal' : 'vertical'),
    direction: () => hellElementDirection(this.host),
    beforeStart: () => {
      this.resizable.fitPanesToAvailableSize();
      return !this.resizable.isConstrained();
    },
    afterStart: () => this.resizable.markUserSized(),
    pair: () => this.adjacentPair(),
    itemAdapter: () => {
      const sizes = this.lockPanes();
      return {
        measure: (pane) => sizes.get(pane) ?? pane.measure(),
        minSize: (pane) => pane.currentMinSize(),
        setSize: (pane, size) => pane.setSize(size),
      };
    },
  });

  /** Lookup the panes immediately preceding and following this handle. */
  private adjacentPair(): { before: HellResizablePane; after: HellResizablePane } | null {
    const parent = this.host.parentElement;
    if (!parent) return null;

    const panes = this.resizable.getPanes();
    const children = Array.from(parent.children) as HTMLElement[];
    const handleIndex = children.indexOf(this.host);
    if (handleIndex < 0) return null;

    const paneFor = (element: HTMLElement) => panes.find((pane) => pane.host === element) ?? null;
    const findPane = (start: number, step: 1 | -1): HellResizablePane | null => {
      for (let i = start; i >= 0 && i < children.length; i += step) {
        const pane = paneFor(children[i]);
        if (pane) return pane;
      }
      return null;
    };

    const before = findPane(handleIndex - 1, -1);
    const after = findPane(handleIndex + 1, 1);
    return before && after ? { before, after } : null;
  }

  private lockPanes(): Map<HellResizablePane, number> {
    const panes = this.resizable.getPanes();
    const sizes = new Map<HellResizablePane, number>();
    for (const pane of panes) sizes.set(pane, pane.measure());
    for (const pane of panes) pane.setSize(sizes.get(pane) ?? pane.measure());
    return sizes;
  }

  @HostListener('pointerdown', ['$event'])
  protected onPointerDown(e: PointerEvent) {
    this.resizeInteraction.startPointer(e);
  }

  @HostListener('keydown', ['$event'])
  protected onKey(e: KeyboardEvent) {
    this.resizeInteraction.applyKey(e);
  }

  ngOnDestroy(): void {
    this.resizeInteraction.destroy();
  }
}

/** Standalone imports for the complete resizable API: group, pane, and handle. */
export const HELL_RESIZABLE_DIRECTIVES = [
  HellResizable,
  HellResizablePane,
  HellResizableHandle,
] as const;
