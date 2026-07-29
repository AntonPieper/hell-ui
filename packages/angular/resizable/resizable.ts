import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
} from '@angular/core';
import { hellCreateLabels, type HellLabels, type HellUi, type HellUiInput } from 'hell-ui/core';
import {
  HellResizePairInteractionController,
  hellFitResizeSizesToTotal,
  hellResizePairAriaValue,
  type HellResizeDirection,
  hellPartStyler,
  type HellRecipe,
} from 'hell-ui/internal/core';
import { isDocumentPositionFollowing } from 'hell-ui/internal/core';
import { HellOrientation } from 'hell-ui/core';
import type { InjectionToken } from '@angular/core';

/** Built-in accessibility labels owned by the resizable entry point. */
export interface HellResizableLabels {
  /** Accessible label for a resize handle when no `aria-label` is set. */
  readonly resizePanels: string;
}

/** Injection token resolving to the effective resizable labels. */
export const HELL_RESIZABLE_LABELS: InjectionToken<HellLabels<HellResizableLabels>> = hellCreateLabels<HellResizableLabels>('HELL_RESIZABLE_LABELS', {
  resizePanels: 'Resize panels',
});

/** Public parts of the HellResizableHandle module, styleable through its Part Style Map. */
export type HellResizableHandlePart = 'root' | 'grip';
/** Part Style Map accepted by the HellResizableHandle `ui` input. */
export type HellResizableHandleUi = HellUi<HellResizableHandlePart>;

const HELL_RESIZABLE_RECIPE = {
  root: 'flex h-full w-full',
} satisfies HellRecipe<'root'>;

const HELL_RESIZABLE_PANE_RECIPE = {
  root: 'min-h-0 min-w-0 overflow-auto',
} satisfies HellRecipe<'root'>;

const HELL_RESIZABLE_HANDLE_RECIPE = {
  root: 'flex bg-transparent',
  grip: '',
} satisfies HellRecipe<HellResizableHandlePart>;

function hellElementDirection(element: HTMLElement): HellResizeDirection {
  return element.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl'
    ? 'rtl'
    : 'ltr';
}

/**
 * Whether a pane still takes part in the group's flex line. A pane hidden by an
 * outer module — Master Detail hides the inactive pane in a compact frame — is
 * `display: none` and occupies no width, so any size distributed to it becomes a
 * strip of the group that nothing can render into.
 *
 * This reads the pane's own computed `display` rather than asking whether it
 * generates a box (`getClientRects()`), which keeps the check meaningful under a
 * DOM implementation that has no layout: the unit tests can then hide a pane the
 * way a consumer does instead of stubbing rectangles. Two blind spots come with
 * that, both harmless here:
 *
 * - A pane hidden by an ancestor between it and the group still reads as laid
 *   out. Panes are the group's own flex items, so such an ancestor takes the
 *   group down with it and `availableSize()` returns 0, which stops the fit one
 *   step earlier.
 * - `content-visibility: hidden` skips a pane's contents but keeps its box, and
 *   the box is what the split is about, so counting it is correct.
 */
function hellIsPaneLaidOut(host: HTMLElement): boolean {
  const view = host.ownerDocument.defaultView;
  return !view || view.getComputedStyle(host).display !== 'none';
}

function hellAriaControlsValue(
  value: string | readonly string[] | null | undefined,
): string | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  const ids = value.map((id) => id.trim()).filter(Boolean);
  return ids.length ? ids.join(' ') : null;
}

interface HellResizablePaneRegistration {
  readonly host: HTMLElement;
  readonly minSize: () => number;
  readonly hasSize: () => boolean;
  readonly currentSize: () => number | null;
  readonly currentMinSize: () => number;
  readonly measure: () => number;
  readonly setSize: (px: number) => void;
  readonly resetSize: () => void;
  readonly setEffectiveMinSize: (px: number | null) => void;
}

/**
 * Resizable-local pane coordination. Panes and handles communicate through
 * this provider so registry, measurement, constraints, and direct sizing stay
 * out of the public directive declarations.
 */
@Injectable()
class HellResizableController {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);
  private readonly constrained = signal(false);
  private readonly panes: HellResizablePaneRegistration[] = [];
  private readonly parkedSizes = new Map<HellResizablePaneRegistration, number>();
  private readonly observer: ResizeObserver | null;
  private userSized = false;
  private resizeFrame = 0;

  orientation: () => HellOrientation = () => 'horizontal';
  rescaleOnResize: () => boolean = () => true;

  constructor() {
    const ResizeObserverCtor = this.host.ownerDocument.defaultView?.ResizeObserver;
    this.observer = ResizeObserverCtor
      ? new ResizeObserverCtor(() => this.scheduleFitPanesToAvailableSize())
      : null;
    if (!this.observer) return;

    // Panes are observed alongside the group: a pane entering or leaving the
    // layout changes how the group's size has to be split even when the group
    // itself never resizes, and the observer makes that a fact the fit reads
    // rather than one it has to be scheduled ahead of.
    this.observer.observe(this.host);
    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
      this.cancelScheduledFit();
    });
  }

  registerPane(pane: HellResizablePaneRegistration): void {
    if (!this.panes.includes(pane)) this.panes.push(pane);
    this.observer?.observe(pane.host);
    queueMicrotask(() => this.fitPanesToAvailableSize());
  }

  unregisterPane(pane: HellResizablePaneRegistration): void {
    const index = this.panes.indexOf(pane);
    if (index >= 0) this.panes.splice(index, 1);
    this.parkedSizes.delete(pane);
    this.observer?.unobserve(pane.host);
    queueMicrotask(() => this.fitPanesToAvailableSize());
  }

  afterContentInit(): void {
    this.panes.sort((a, b) => {
      if (isDocumentPositionFollowing(a.host, b.host, a.host.ownerDocument.defaultView)) {
        return -1;
      }
      if (isDocumentPositionFollowing(b.host, a.host, a.host.ownerDocument.defaultView)) {
        return 1;
      }
      return 0;
    });
    this.fitPanesToAvailableSize();
  }

  isConstrained(): boolean {
    return this.constrained();
  }

  createResizeInteraction(
    handle: HTMLElement,
    onActiveChange: (active: boolean) => void,
    onValueChange: (ariaValueNow: number) => void,
  ): HellResizePairInteractionController<HellResizablePaneRegistration> {
    return new HellResizePairInteractionController<HellResizablePaneRegistration>({
      handle,
      ownerWindow: () => handle.ownerDocument.defaultView,
      onActiveChange,
      onValueChange: (result) => onValueChange(result.ariaValueNow),
      orientation: () => (this.orientation() === 'horizontal' ? 'horizontal' : 'vertical'),
      direction: () => hellElementDirection(handle),
      beforeStart: () => {
        this.fitPanesToAvailableSize();
        return !this.isConstrained();
      },
      afterStart: () => {
        this.userSized = true;
      },
      pair: () => this.adjacentPair(handle),
      itemAdapter: () => {
        const sizes = this.lockPanes();
        return {
          measure: (pane) => sizes.get(pane) ?? pane.measure(),
          minSize: (pane) => pane.currentMinSize(),
          setSize: (pane, size) => pane.setSize(size),
        };
      },
    });
  }

  ariaValueFor(handle: HTMLElement): number | null {
    const pair = this.adjacentPair(handle);
    if (!pair) return null;

    const beforePx = pair.before.currentSize() ?? pair.before.measure();
    const afterPx = pair.after.currentSize() ?? pair.after.measure();
    return hellResizePairAriaValue(
      beforePx,
      afterPx,
      pair.before.currentMinSize(),
      pair.after.currentMinSize(),
    );
  }

  private fitPanesToAvailableSize(): void {
    if (!this.rescaleOnResize()) return;
    if (!this.panes.length) return;

    // Only panes that generate a box share the group's size. With none of them
    // in layout there is no split to describe — whether the group is hidden or
    // everything inside it is — so committed sizes are left exactly as they are.
    const panes = this.panes.filter((pane) => hellIsPaneLaidOut(pane.host));
    if (!panes.length) return;

    const available = this.availableSize();
    if (available <= 0) return;

    for (const pane of this.panes) {
      if (panes.includes(pane)) continue;
      pane.setEffectiveMinSize(null);
      this.parkPane(pane);
    }

    // One pane in layout has nothing to split against. It fills the group on
    // its own, and the split the group had is parked rather than overwritten
    // with a width that only describes this narrower frame. No handle can find
    // a pair in that state, so the group reports itself unresizable and its
    // handles stop being interactive until a second pane is back in layout.
    if (panes.length < 2) {
      this.constrained.set(true);
      this.parkPane(panes[0]);
      panes[0].setEffectiveMinSize(available);
      return;
    }

    for (const pane of panes) this.unparkPane(pane);

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

  /**
   * Hold a pane's committed size aside and let it flex again. A pane that is
   * not sharing the group must carry no rigid width: out of layout it would
   * reserve space it cannot render into, and back in layout it would describe a
   * frame it was never measured against.
   */
  private parkPane(pane: HellResizablePaneRegistration): void {
    const size = pane.currentSize();
    if (size == null) return;
    this.parkedSizes.set(pane, size);
    pane.resetSize();
  }

  /** Give a pane back the size it was parked with once the group can split again. */
  private unparkPane(pane: HellResizablePaneRegistration): void {
    const parked = this.parkedSizes.get(pane);
    if (parked == null) return;
    this.parkedSizes.delete(pane);
    if (!pane.hasSize()) pane.setSize(parked);
  }

  private availableSize(): number {
    const horizontal = this.orientation() === 'horizontal';
    const total = horizontal ? this.host.clientWidth : this.host.clientHeight;
    let handlesSize = 0;
    const handles = this.host.querySelectorAll<HTMLElement>(
      ':scope > [hellResizableHandle][data-slot="root"]',
    );
    handles.forEach((handle) => {
      handlesSize += horizontal ? handle.offsetWidth : handle.offsetHeight;
    });
    return Math.max(0, total - handlesSize);
  }

  private adjacentPair(
    handle: HTMLElement,
  ): { before: HellResizablePaneRegistration; after: HellResizablePaneRegistration } | null {
    const parent = handle.parentElement;
    if (!parent) return null;

    const children = Array.from(parent.querySelectorAll<HTMLElement>(':scope > *'));
    const handleIndex = children.indexOf(handle);
    if (handleIndex < 0) return null;

    // A pane out of layout is not a resize partner: it has no width to trade,
    // so the handle reaches past it to the next pane that does, and no-ops when
    // there is none.
    const paneFor = (element: HTMLElement): HellResizablePaneRegistration | null =>
      this.panes.find((pane) => pane.host === element && hellIsPaneLaidOut(pane.host)) ?? null;
    const findPane = (
      start: number,
      step: 1 | -1,
    ): HellResizablePaneRegistration | null => {
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

  private lockPanes(): Map<HellResizablePaneRegistration, number> {
    const panes = this.panes.filter((pane) => hellIsPaneLaidOut(pane.host));
    const sizes = new Map<HellResizablePaneRegistration, number>();
    for (const pane of panes) sizes.set(pane, pane.measure());
    for (const pane of panes) pane.setSize(sizes.get(pane) ?? pane.measure());
    return sizes;
  }

  private scheduleFitPanesToAvailableSize(): void {
    const view = this.host.ownerDocument.defaultView;
    if (!view?.requestAnimationFrame) {
      queueMicrotask(() => this.fitPanesToAvailableSize());
      return;
    }
    if (this.resizeFrame) return;
    this.resizeFrame = view.requestAnimationFrame(() => {
      this.resizeFrame = 0;
      this.fitPanesToAvailableSize();
    });
  }

  private cancelScheduledFit(): void {
    const view = this.host.ownerDocument.defaultView;
    if (this.resizeFrame && view?.cancelAnimationFrame) {
      view.cancelAnimationFrame(this.resizeFrame);
    }
    this.resizeFrame = 0;
  }
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
  providers: [HellResizableController],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-orientation]': 'orientation()',
  },
  exportAs: 'hellResizable',
})
export class HellResizable implements AfterContentInit {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_RESIZABLE_RECIPE,
  });

  /** Main axis along which panes are laid out and resized. Defaults to `horizontal`. */
  readonly orientation = input<HellOrientation>('horizontal');
  /** When false, container resizes do not rebalance panes after user sizing. */
  readonly rescaleOnResize = input(true, { transform: booleanAttribute });

  private readonly controller = inject(HellResizableController, { self: true });

  constructor() {
    this.controller.orientation = () => this.orientation();
    this.controller.rescaleOnResize = () => this.rescaleOnResize();
  }

  /** Orders registered panes by DOM position and performs the initial fit. */
  ngAfterContentInit(): void {
    this.controller.afterContentInit();
  }
}

/** A single resizable region within a `[hellResizable]` group. */
@Directive({
  selector: '[hellResizablePane]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellResizablePane {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_RESIZABLE_PANE_RECIPE,
  });

  /** Initial flex grow factor — used until the user starts dragging. */
  readonly initialFlex = input(1, { transform: numberAttribute });
  /** Minimum pane size in pixels. */
  readonly minSize = input(80, { transform: numberAttribute });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly controller = inject(HellResizableController);
  private readonly destroyRef = inject(DestroyRef);
  private readonly size = signal<number | null>(null);
  private readonly effectiveMinSize = signal<number | null>(null);
  private readonly flexValue = computed(() => {
    const px = this.size();
    return px == null ? `${this.initialFlex()} 1 0` : `0 0 ${px}px`;
  });
  private readonly minSizeValue = computed(() => this.effectiveMinSize() ?? this.minSize());
  private readonly registration: HellResizablePaneRegistration = {
    host: this.host,
    minSize: () => this.minSize(),
    hasSize: () => this.size() != null,
    currentSize: () => this.size(),
    currentMinSize: () => this.minSizeValue(),
    measure: () =>
      this.controller.orientation() === 'horizontal'
        ? this.host.offsetWidth
        : this.host.offsetHeight,
    setSize: (px) => {
      this.size.set(px);
      this.writeFlexValue(this.flexValue());
    },
    resetSize: () => {
      this.size.set(null);
      this.writeFlexValue(this.flexValue());
    },
    setEffectiveMinSize: (px) => {
      this.effectiveMinSize.set(px);
      this.writeMinSizeValue(this.minSizeValue());
    },
  };

  constructor() {
    this.controller.registerPane(this.registration);
    this.destroyRef.onDestroy(() => this.controller.unregisterPane(this.registration));
    effect(() => {
      this.host.setAttribute('data-orientation', this.controller.orientation());
      this.writeFlexValue(this.flexValue());
      this.writeMinSizeValue(this.minSizeValue());
    });
  }

  private writeFlexValue(value: string): void {
    this.host.style.setProperty('--_hell-resizable-pane-flex', value);
  }

  private writeMinSizeValue(value: number): void {
    this.host.style.setProperty('--_hell-resizable-pane-min-size', `${value}px`);
  }
}

/** Draggable divider between two adjacent panes in a `[hellResizable]` group. */
@Component({
  selector: '[hellResizableHandle]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-active]': 'dragging() ? "true" : null',
    '[attr.data-appearance]': 'appearance()',
    role: 'separator',
    '[attr.aria-label]': 'ariaLabel() ?? labels.resizePanels',
    '[attr.aria-controls]': 'ariaControlsValue()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': '100',
    '[attr.aria-valuenow]': 'ariaValueNow()',
    '(pointerdown)': 'onPointerDown($event)',
    '(keydown)': 'onKey($event)',
  },
  template: '<span data-slot="grip" [class]="part(\'grip\')" aria-hidden="true"></span>',
})
export class HellResizableHandle implements AfterViewInit {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellResizableHandlePart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellResizableHandlePart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_RESIZABLE_HANDLE_RECIPE,
  });

  /**
   * Visual treatment for the handle.
   * - `line`  (default) — minimal hairline that thickens on hover.
   * - `grip`  — pill-shaped grip with dotted indicator. Recommended when
   *   the handle is the primary affordance.
   */
  readonly appearance = input<'line' | 'grip'>('line');
  /** Accessible label for the handle. Falls back to the resizable labels default. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  /** Effective resizable labels resolved from the injector. */
  protected readonly labels = inject(HELL_RESIZABLE_LABELS);
  /** Id(s) of the element(s) this handle controls, mirrored to `aria-controls`. */
  readonly ariaControls = input<string | readonly string[] | null>(null, {
    alias: 'aria-controls',
  });
  /** Normalized `aria-controls` value derived from `ariaControls`. */
  protected readonly ariaControlsValue = computed(() => hellAriaControlsValue(this.ariaControls()));

  /** Whether the handle is currently being dragged. */
  protected readonly dragging = signal(false);
  /** Current `aria-valuenow` reflecting the adjacent panes' size split. */
  protected readonly ariaValueNow = signal<number | null>(null);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly controller = inject(HellResizableController);
  private readonly destroyRef = inject(DestroyRef);
  private readonly resizeInteraction = this.controller.createResizeInteraction(
    this.host,
    (active) => this.dragging.set(active),
    (ariaValueNow) => this.ariaValueNow.set(ariaValueNow),
  );

  constructor() {
    effect(() => {
      this.host.setAttribute(
        'aria-orientation',
        this.controller.orientation() === 'horizontal' ? 'vertical' : 'horizontal',
      );
      if (this.controller.isConstrained()) {
        this.host.setAttribute('aria-disabled', 'true');
        this.host.setAttribute('tabindex', '-1');
      } else {
        this.host.removeAttribute('aria-disabled');
        this.host.setAttribute('tabindex', '0');
      }
    });
    this.destroyRef.onDestroy(() => this.resizeInteraction.destroy());
  }

  /** Initializes `aria-valuenow` once the adjacent panes are available. */
  ngAfterViewInit(): void {
    this.refreshAriaValueNow();
  }

  /** Starts a pointer-driven resize gesture. */
  protected onPointerDown(e: PointerEvent) {
    this.refreshAriaValueNow();
    this.resizeInteraction.startPointer(e);
  }

  /** Applies keyboard-driven resizing (arrow keys; Home/End for min/max). */
  protected onKey(e: KeyboardEvent) {
    this.refreshAriaValueNow();
    this.resizeInteraction.applyKey(e);
  }

  private refreshAriaValueNow(): void {
    this.ariaValueNow.set(this.controller.ariaValueFor(this.host));
  }
}

/** Standalone imports for the complete resizable API: group, pane, and handle. */
export const HELL_RESIZABLE_IMPORTS = [
  HellResizable,
  HellResizablePane,
  HellResizableHandle,
] as const;
