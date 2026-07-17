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
import { hellPartStyler, hellCreateLabels, type HellRecipe, type HellUi, type HellUiInput } from '@hell-ui/angular/core';
import {
  HellResizePairInteractionController,
  hellFitResizeSizesToTotal,
  hellResizePairAriaValue,
  type HellResizeDirection,
} from '@hell-ui/angular/internal/core';
import { isDocumentPositionFollowing } from '@hell-ui/angular/internal/core';
import { HellOrientation } from '@hell-ui/angular/core';
import type { InjectionToken } from '@angular/core';

/** Built-in accessibility labels owned by the resizable entry point. */
export interface HellResizableLabels {
  /** Accessible label for a resize handle when no `aria-label` is set. */
  readonly resizePanels: string;
}

/** Injection token resolving to the effective resizable labels. */
export const HELL_RESIZABLE_LABELS: InjectionToken<HellResizableLabels> = hellCreateLabels<HellResizableLabels>('HELL_RESIZABLE_LABELS', {
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
  private userSized = false;
  private resizeFrame = 0;

  orientation: () => HellOrientation = () => 'horizontal';
  rescaleOnResize: () => boolean = () => true;

  constructor() {
    const ResizeObserverCtor = this.host.ownerDocument.defaultView?.ResizeObserver;
    if (!ResizeObserverCtor) return;

    const observer = new ResizeObserverCtor(() => this.scheduleFitPanesToAvailableSize());
    observer.observe(this.host);
    this.destroyRef.onDestroy(() => {
      observer.disconnect();
      this.cancelScheduledFit();
    });
  }

  registerPane(pane: HellResizablePaneRegistration): void {
    if (!this.panes.includes(pane)) this.panes.push(pane);
    queueMicrotask(() => this.fitPanesToAvailableSize());
  }

  unregisterPane(pane: HellResizablePaneRegistration): void {
    const index = this.panes.indexOf(pane);
    if (index >= 0) this.panes.splice(index, 1);
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

    const available = this.availableSize();
    if (available <= 0) return;

    const minSizes = this.panes.map((pane) => pane.minSize());
    const minTotal = minSizes.reduce((sum, value) => sum + value, 0);
    const isConstrained = available < minTotal;
    this.constrained.set(isConstrained);

    if (!this.userSized && !isConstrained) {
      for (const pane of this.panes) {
        pane.setEffectiveMinSize(null);
        if (pane.hasSize()) pane.resetSize();
      }
      return;
    }

    const hasExplicitSize = this.panes.some((pane) => pane.hasSize());
    if (!hasExplicitSize && !isConstrained) {
      for (const pane of this.panes) pane.setEffectiveMinSize(null);
      return;
    }

    const sourceSizes = this.panes.map(
      (pane, index) => (pane.currentSize() ?? pane.measure()) || minSizes[index],
    );
    const sourceTotal = sourceSizes.reduce((sum, value) => sum + value, 0);
    if (!isConstrained && Math.abs(sourceTotal - available) < 1) {
      for (const pane of this.panes) pane.setEffectiveMinSize(null);
      return;
    }

    const fitted = hellFitResizeSizesToTotal(sourceSizes, minSizes, available);
    for (let i = 0; i < this.panes.length; i++) {
      const effectiveMin = isConstrained ? Math.min(minSizes[i], fitted[i]) : null;
      this.panes[i].setEffectiveMinSize(effectiveMin);
    }
    for (let i = 0; i < this.panes.length; i++) this.panes[i].setSize(fitted[i]);
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

    const paneFor = (element: HTMLElement): HellResizablePaneRegistration | null =>
      this.panes.find((pane) => pane.host === element) ?? null;
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
    const sizes = new Map<HellResizablePaneRegistration, number>();
    for (const pane of this.panes) sizes.set(pane, pane.measure());
    for (const pane of this.panes) pane.setSize(sizes.get(pane) ?? pane.measure());
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
