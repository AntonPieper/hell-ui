import { containsNode, isElementLike } from 'hell-ui/internal/core';
import {
  clampZoomScale,
  getCtrlWheelScaleFactor,
  getNextZoomStep,
  getPreviousZoomStep,
  getZoomOrigin,
  isPdfZoomPreset,
} from './pdf-viewer.utils';
import {
  HellPdfAdapterBootstrapOptions,
  HellPdfJsRuntimeAdapter,
  type HellPdfDocumentHandle,
  type HellPdfDocumentLoadTask,
  type HellPdfNumericZoomOptions,
  type HellPdfRuntimeAdapter,
  type HellPdfWorkerSource,
  type HellPdfPrintSession,
  type HellPdfViewerSession,
} from './pdf-viewer.adapter';
import type { HellPdfPrintOptions } from './pdf-viewer.print';

/**
 * Milliseconds pdf.js waits after the last gesture-driven scale write before it
 * re-rasterizes pages. Matches the pdf.js reference viewer's zoom delay.
 */
const HELL_PDF_GESTURE_DRAWING_DELAY_MS = 400;

/**
 * How far the wheel accumulator may sit from the scale pdf.js actually holds
 * before it counts as stale: half a two-decimal quantization step, plus float
 * slack. Anything wider means something other than this gesture moved the
 * scale.
 */
const HELL_PDF_GESTURE_SCALE_DRIFT = 0.006;

/**
 * A touch that travels further than this, or stays down longer, is a pan, a
 * long press, or a drag — not a tap. Well inside the platform touch slop so a
 * finger that rolls slightly on lift still counts.
 */
const HELL_PDF_TAP_SLOP_PX = 10;
const HELL_PDF_TAP_MAX_MS = 500;

/**
 * How long after a tap a second one still pairs with it, and how far away it
 * may land. 300 ms matches the platform double-tap window; the wider distance
 * slop covers a second tap aimed by feel rather than at the same pixel.
 */
const HELL_PDF_DOUBLE_TAP_MS = 300;
const HELL_PDF_DOUBLE_TAP_SLOP_PX = 30;

/** How far past its fitted scale a double tap magnifies the document. */
const HELL_PDF_DOUBLE_TAP_ZOOM_FACTOR = 2;

/**
 * How far above the fitted scale the document must sit before a double tap
 * reads as "zoomed in" and toggles back instead of magnifying further. Wide
 * enough that re-fitting rounding never looks like a deliberate zoom.
 */
const HELL_PDF_DOUBLE_TAP_ZOOMED_RATIO = 1.05;

/** pdf.js quantizes gesture-driven scales to two decimals; match it exactly. */
function quantizeGestureScale(scale: number): number {
  return Math.round(scale * 100) / 100;
}

/** Source types accepted by the PDF runtime and adapter. */
export type HellPdfSource = string | URL | ArrayBuffer;
/** pdf.js preset names plus numeric scale values accepted at load time. */
export type HellPdfInitialZoom = number | 'auto' | 'page-actual' | 'page-fit' | 'page-width';
export type HellPdfFindStatus = 'pending' | 'found' | 'not-found' | 'wrapped';

/** UI callbacks emitted by the runtime from pdf.js viewer events. */
export interface HellPdfRuntimeHandlers {
  onPageChange(page: number): void;
  onZoomChange(displayValue: string, emittedValue: number | string): void;
  onPagesReady(): void;
  onFindState(state: { status?: HellPdfFindStatus; current?: number; total?: number }): void;
}

/** Per-load options; each document load owns its own initial navigation state. */
export interface HellPdfLoadOptions {
  initialPage: number;
  initialZoom: HellPdfInitialZoom;
  onLoaded(totalPages: number): void;
}

/** Bootstrap options passed from the Angular viewer surface to the runtime adapter. */
export interface HellPdfRuntimeBootstrapOptions {
  readonly worker?: HellPdfWorkerSource;
}
/** Normalized request forwarded to the pdf.js find controller. */
export interface HellPdfFindRequest {
  source: unknown;
  type: 'again' | '';
  query: string;
  findPrevious: boolean;
}

/** Imperative PDF runtime port used by the Angular viewer component. */
export interface HellPdfRuntimePort {
  readonly hasDocument: boolean;
  readonly currentScale: number;
  /** Create the adapter viewer once before loading documents. */
  bootstrap(
    container: HTMLDivElement,
    handlers: HellPdfRuntimeHandlers,
    options?: HellPdfRuntimeBootstrapOptions,
  ): Promise<void>;
  /** Replace the active document; stale loads are ignored by the runtime. */
  loadDocument(src: HellPdfSource, options: HellPdfLoadOptions): Promise<void>;
  cleanup(): void;
  goTo(page: number): void;
  zoomIn(): void;
  zoomOut(): void;
  setZoomValue(value: string): void;
  dispatchFind(request: HellPdfFindRequest): void;
  closeFind(source: unknown): void;
  download(
    source: HellPdfSource,
    fileName?: string | null,
    ownerDocument?: Document,
  ): Promise<void>;
  print(
    source: HellPdfSource,
    ownerDocument?: Document,
    options?: HellPdfPrintOptions | number,
  ): Promise<void>;
  renderThumbs(
    canvases: readonly HTMLCanvasElement[],
    shouldContinue: () => boolean,
  ): Promise<void>;
}

export interface HellPdfGlobalShortcutActions {
  openFind(): void;
  print(): void;
  zoomIn(): void;
  zoomOut(): void;
  resetZoom(): void;
}

export interface HellPdfViewerKeyActions extends HellPdfGlobalShortcutActions {
  nextPage(): void;
  previousPage(): void;
  firstPage(): void;
  lastPage(): void;
}

export class HellPdfViewerInteractionScope {
  private viewerActive = false;

  constructor(private readonly host: () => HTMLElement | null | undefined) {}

  recordPointerTarget(target: EventTarget | Node | null): void {
    const host = this.host();
    this.viewerActive = !!host && containsNode(host, target);
  }

  handleGlobalShortcut(event: KeyboardEvent, actions: HellPdfGlobalShortcutActions): boolean {
    if (!this.shouldHandleGlobalShortcut(event)) return false;
    return this.handleCommandShortcut(event, actions);
  }

  handleViewerKey(event: KeyboardEvent, actions: HellPdfViewerKeyActions): boolean {
    if (this.handleCommandShortcut(event, actions)) return true;
    if (isPdfEditableTarget(event.target)) return false;

    switch (event.key) {
      case 'PageDown':
        actions.nextPage();
        break;
      case 'PageUp':
        actions.previousPage();
        break;
      case 'Home':
        actions.firstPage();
        break;
      case 'End':
        actions.lastPage();
        break;
      case '+':
      case '=':
        actions.zoomIn();
        break;
      case '-':
      case '_':
        actions.zoomOut();
        break;
      case '0':
        actions.resetZoom();
        break;
      default:
        return false;
    }

    event.preventDefault();
    return true;
  }

  private shouldHandleGlobalShortcut(event: KeyboardEvent): boolean {
    const host = this.host();
    if (!host) return false;

    const doc = host.ownerDocument;
    const activeElement = doc.activeElement;
    const target = event.target;
    const selection = doc.defaultView?.getSelection();
    const activeElementInside = containsNode(host, activeElement);
    const targetInside = containsNode(host, target);
    const selectionInside = !!(
      selection &&
      (containsNode(host, selection.anchorNode) || containsNode(host, selection.focusNode))
    );

    if (isOutsideKeyboardScope(host, activeElement) || isOutsideKeyboardScope(host, target)) {
      this.viewerActive = false;
      return false;
    }

    return this.viewerActive || activeElementInside || targetInside || selectionInside;
  }

  private handleCommandShortcut(
    event: KeyboardEvent,
    actions: HellPdfGlobalShortcutActions,
  ): boolean {
    const key = event.key.toLowerCase();

    if (key === 'f') {
      if (!hasPdfCommandModifier(event)) return false;
      event.preventDefault();
      actions.openFind();
      return true;
    }

    if (key === 'p') {
      if (!hasPdfCommandModifier(event)) return false;
      event.preventDefault();
      actions.print();
      return true;
    }

    if (event.key === '+' || event.key === '=') {
      if (!hasPdfCommandModifier(event, event.key === '+')) return false;
      event.preventDefault();
      actions.zoomIn();
      return true;
    }

    if (event.key === '-' || event.key === '_') {
      if (!hasPdfCommandModifier(event, event.key === '_')) return false;
      event.preventDefault();
      actions.zoomOut();
      return true;
    }

    if (event.key === '0') {
      if (!hasPdfCommandModifier(event)) return false;
      event.preventDefault();
      actions.resetZoom();
      return true;
    }

    return false;
  }
}

function hasPdfCommandModifier(event: KeyboardEvent, allowShift = false): boolean {
  if (event.altKey || (!allowShift && event.shiftKey)) return false;
  return event.ctrlKey !== event.metaKey;
}

function isOutsideKeyboardScope(
  host: HTMLElement,
  target: EventTarget | Node | null | undefined,
): boolean {
  if (!isElementLike(target)) return false;
  const doc = host.ownerDocument;
  if (target === doc.body || target === doc.documentElement) return false;
  return !containsNode(host, target);
}

export class HellPdfRuntime implements HellPdfRuntimePort {
  private session: HellPdfViewerSession | null = null;
  private doc: HellPdfDocumentHandle | null = null;
  private container: HTMLDivElement | null = null;
  private containerEventCleanup: (() => void) | null = null;
  private readonly activeTouchPointers = new Map<
    number,
    { readonly clientX: number; readonly clientY: number }
  >();
  private pinchGesture: { readonly startDistance: number; readonly startScale: number } | null =
    null;
  private touchPinchGesture: {
    readonly startDistance: number;
    readonly startScale: number;
  } | null = null;
  /**
   * Which load a thumbnail canvas was painted for. Keyed by element so canvases
   * discarded when the overview closes are never mistaken for painted ones, and
   * weak so detached canvases stay collectable.
   */
  private readonly renderedThumbs = new WeakMap<HTMLCanvasElement, number>();
  /** Tail of the thumbnail batch queue; see `renderThumbs`. */
  private thumbRenderQueue: Promise<void> = Promise.resolve();
  /** Identity of the newest queued batch; see `renderThumbs`. */
  private thumbBatchGeneration = 0;
  private handlers: HellPdfRuntimeHandlers | null = null;
  private initialZoom: HellPdfInitialZoom = 'auto';
  private initialPage = 1;
  private loadToken = 0;
  private loadTask: HellPdfDocumentLoadTask | null = null;
  private printCleanup: (() => void) | null = null;
  private containerResizeObserver: ResizeObserver | null = null;
  private resizeFrame: number | null = null;
  private zoomFrame: number | null = null;
  private pendingZoom: { readonly scale: number; readonly origin?: [number, number] } | null = null;
  /** Last gesture-requested scale, kept unrounded so slow gestures still accumulate. */
  private gestureScale: number | null = null;
  /** Touch that is still eligible to end as a tap. */
  private tapCandidate: {
    readonly pointerId: number;
    readonly clientX: number;
    readonly clientY: number;
    readonly time: number;
  } | null = null;
  /** Completed tap waiting for a partner within the double-tap window. */
  private lastTap: {
    readonly clientX: number;
    readonly clientY: number;
    readonly time: number;
  } | null = null;
  /**
   * Zoom preset the viewer last settled on and the scale it produced. Double
   * tap toggles against this, so it returns to a re-fitting preset rather than
   * to a frozen number.
   */
  private zoomBaseline: { readonly value: string; readonly scale: number } | null = null;

  constructor(private readonly adapter: HellPdfRuntimeAdapter = new HellPdfJsRuntimeAdapter()) {}

  get hasDocument(): boolean {
    return !!this.doc;
  }

  get currentScale(): number {
    return this.session?.currentScale ?? 1;
  }

  async bootstrap(
    container: HTMLDivElement,
    handlers: HellPdfRuntimeHandlers,
    options: HellPdfRuntimeBootstrapOptions = {},
  ): Promise<void> {
    if (this.session) return;

    this.container = container;
    this.handlers = handlers;

    this.session = await this.adapter.createViewer(
      container,
      {
        initialPage: () => this.initialPage,
        initialZoom: () => this.initialZoom,
        onPageChange: (page) => this.handlers?.onPageChange(page),
        onZoomChange: (displayValue, emittedValue) => {
          this.recordZoomBaseline(displayValue);
          this.handlers?.onZoomChange(displayValue, emittedValue);
        },
        onPagesReady: () => this.handlers?.onPagesReady(),
        onFindState: (state) => this.handlers?.onFindState(state),
      },
      this.normalizeBootstrapOptions(options),
    );
    this.installContainerInteractions(container);
  }

  async loadDocument(src: HellPdfSource, options: HellPdfLoadOptions): Promise<void> {
    if (!this.session) {
      throw new Error('PDF runtime must be bootstrapped before loading a document.');
    }

    const token = ++this.loadToken;
    this.initialPage = options.initialPage;
    this.initialZoom = options.initialZoom;
    this.cancelPendingZoom();
    // The incoming document re-fits from its own `pagesinit`, so the outgoing
    // document's fitted scale must not survive as a double-tap target.
    this.zoomBaseline = null;

    await this.cancelActiveLoadTask();
    this.clearActiveDocument();

    const loadTask = await this.adapter.loadDocument(this.session, src);
    this.loadTask = loadTask;

    let doc: HellPdfDocumentHandle;
    try {
      doc = await loadTask.promise;
    } catch (error) {
      this.loadTask = null;
      if (token !== this.loadToken) {
        return;
      }
      throw error;
    }

    if (token !== this.loadToken) {
      this.destroyDocument(doc);
      return;
    }

    this.loadTask = null;
    this.doc = doc;
    options.onLoaded(doc.numPages);
    this.session.setDocument(doc);
  }

  cleanup(): void {
    this.loadToken++;
    this.containerEventCleanup?.();
    this.containerEventCleanup = null;
    this.cancelPendingZoom();
    this.cancelPendingResize();
    this.resetPinchGesture();
    this.clearPrintSession();
    void this.cancelActiveLoadTask();
    this.clearActiveDocument();
    this.session?.cleanup();
    this.session = null;
    this.handlers = null;
    this.container = null;
    this.zoomBaseline = null;
  }

  goTo(page: number): void {
    if (!this.session) return;

    const totalPages = this.doc?.numPages ?? 1;
    this.session.setPage(page, totalPages);
  }

  zoomIn(): void {
    if (!this.session) return;
    this.cancelPendingZoom();
    this.setNumericZoom(getNextZoomStep(this.currentScale));
  }

  zoomOut(): void {
    if (!this.session) return;
    this.cancelPendingZoom();
    this.setNumericZoom(getPreviousZoomStep(this.currentScale));
  }

  setZoomValue(value: string): void {
    this.cancelPendingZoom();
    this.session?.setZoomValue(value);
  }

  dispatchFind(request: HellPdfFindRequest): void {
    this.session?.dispatchFind(request);
  }

  closeFind(source: unknown): void {
    this.session?.closeFind(source);
  }

  download(
    source: HellPdfSource,
    fileName?: string | null,
    ownerDocument?: Document,
  ): Promise<void> {
    return this.adapter.download(source, fileName, ownerDocument);
  }

  createPrintSession(
    source: HellPdfSource,
    ownerDocument?: Document,
    options?: HellPdfPrintOptions,
  ): Promise<HellPdfPrintSession> {
    return options === undefined
      ? this.adapter.createPrintSession(source, ownerDocument)
      : this.adapter.createPrintSession(source, ownerDocument, options);
  }

  async print(
    source: HellPdfSource,
    ownerDocument?: Document,
    options: HellPdfPrintOptions | number = {},
  ): Promise<void> {
    this.clearPrintSession();

    const printOptions = typeof options === 'number' ? { cleanupDelayMs: options } : options;
    const cleanupDelayMs = printOptions.cleanupDelayMs ?? 30_000;
    const session = await this.createPrintSession(source, ownerDocument, printOptions);
    this.printCleanup = () => session.cleanup();
    try {
      await session.print();
      // eslint-disable-next-line no-restricted-globals -- fallback for cleanup timing when the owner document is detached
      const win = ownerDocument?.defaultView ?? (typeof window === 'undefined' ? null : window);
      win?.setTimeout(() => session.cleanup(), cleanupDelayMs);
    } catch (error) {
      this.clearPrintSession();
      throw error;
    }
  }

  /**
   * Paint a batch of thumbnail canvases, one batch at a time.
   *
   * A virtualized rail hands over a fresh batch on every scroll step, so
   * batches overlap by default, and two of them can reach the same canvas.
   * pdf.js refuses that: `InternalRenderTask` keeps a `WeakSet` of the canvases
   * its live tasks own and throws for a second render against one of them. The
   * throw lands in the newcomer's own task, so the batch already drawing is
   * unaffected — but the newcomer's `catch` below clears the painted marker,
   * and nothing repaints that row until it is unmounted and mounted again, so
   * the user is left with one permanently blank page in the rail.
   *
   * Within a single document load the marker written before the `await` already
   * keeps a second batch off a canvas. What defeats it is a reload: the marker
   * is keyed on `loadToken` so fresh canvases are never mistaken for painted
   * ones, which means a batch that started before the reload and one that
   * starts after disagree about the same canvas and both claim it.
   *
   * Serializing removes the overlap outright. It also keeps a fast scroll from
   * rasterizing several windows at once, and it is what gives the mounted check
   * below its value: by the time a queued batch runs, everything the rail
   * scrolled past is detached and skipped instead of drawn.
   *
   * Serialized, the queue's other hazard is backlog. Every batch is a complete
   * snapshot of the canvases the rail has mounted, so the moment a newer one is
   * queued, the older batches describe windows the rail has scrolled away from
   * — yet unsuperseded they would still paint them, one render at a time, while
   * the pages actually on screen sit blank behind them. A batch therefore stops
   * as soon as it is no longer the newest one: at most one in-flight render
   * lands before the current window starts painting.
   */
  renderThumbs(
    canvases: readonly HTMLCanvasElement[],
    shouldContinue: () => boolean,
  ): Promise<void> {
    const generation = ++this.thumbBatchGeneration;
    const batch = this.thumbRenderQueue.then(() =>
      this.renderThumbBatch(canvases, shouldContinue, generation),
    );
    this.thumbRenderQueue = batch.catch(() => undefined);
    return batch;
  }

  private async renderThumbBatch(
    canvases: readonly HTMLCanvasElement[],
    shouldContinue: () => boolean,
    generation: number,
  ): Promise<void> {
    if (!this.doc || !this.session || !shouldContinue()) return;

    const token = this.loadToken;

    for (const canvas of canvases) {
      if (generation !== this.thumbBatchGeneration) return;
      if (!shouldContinue()) return;
      // Rasterizing a page onto a canvas the rail already unmounted is pure
      // waste, and during a fast scroll it is most of the work.
      if (!canvas.isConnected) continue;
      const n = Number(canvas.dataset['page']);
      if (!Number.isFinite(n) || this.renderedThumbs.get(canvas) === token) continue;
      this.renderedThumbs.set(canvas, token);

      try {
        await this.session.renderThumbnail(this.doc, n, canvas);
      } catch {
        this.renderedThumbs.delete(canvas);
      }
    }
  }

  private normalizeBootstrapOptions(
    options: HellPdfRuntimeBootstrapOptions,
  ): HellPdfAdapterBootstrapOptions {
    if (!options.worker) {
      return {};
    }

    return {
      worker: options.worker,
    };
  }

  private async cancelActiveLoadTask(): Promise<void> {
    const loadTask = this.loadTask;
    this.loadTask = null;
    if (!loadTask) return;

    try {
      await loadTask.destroy();
    } catch {
      /* ignore */
    }
  }

  private destroyDocument(doc: HellPdfDocumentHandle): void {
    try {
      void Promise.resolve(doc.destroy()).catch(() => undefined);
    } catch {
      /* ignore */
    }
  }

  private installContainerInteractions(container: HTMLDivElement): void {
    this.containerEventCleanup?.();

    const onWheel = (event: WheelEvent) => this.onWheelZoom(event);
    const onPointerDown = (event: PointerEvent) => this.onPointerDown(event);
    const onPointerMove = (event: PointerEvent) => this.onPointerMove(event);
    const onPointerEnd = (event: PointerEvent) => this.onPointerEnd(event);
    const onTouchStart = (event: TouchEvent) => this.onTouchStart(event);
    const onTouchMove = (event: TouchEvent) => this.onTouchMove(event);
    const onTouchEnd = (event: TouchEvent) => this.onTouchEnd(event);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('pointerdown', onPointerDown, { passive: true });
    container.addEventListener('pointermove', onPointerMove, { passive: false });
    container.addEventListener('pointerup', onPointerEnd);
    container.addEventListener('pointercancel', onPointerEnd);
    // Non-passive, because a passive listener cannot preventDefault and a
    // second finger has to be able to take the gesture off the browser's own
    // two-finger pan before it starts.
    //
    // This is a cost the viewer accepts, not one it dodges. `touchmove` was
    // already blocking, so scrolling here already waited on the main thread;
    // what this adds is a second, earlier round trip, at touch-down rather than
    // at first movement. The early return for a single touch keeps that
    // acknowledgement cheap only while the main thread is free — and here it is
    // often busy rasterizing pages, which is exactly when the extra latency
    // before a scroll starts is felt.
    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('touchcancel', onTouchEnd);
    this.observeContainerResize(container);

    this.containerEventCleanup = () => {
      this.containerResizeObserver?.disconnect();
      this.containerResizeObserver = null;
      this.cancelPendingResize();
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerEnd);
      container.removeEventListener('pointercancel', onPointerEnd);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
      this.resetPinchGesture();
    };
  }

  /**
   * pdf.js derives `auto`, `page-fit`, and `page-width` from the container box
   * once and never revisits them. Without this observer a viewer that mounts at
   * zero width (hidden tab, collapsed pane, detail pane opened later) keeps the
   * bogus scale that box produced, and a viewer that is merely resized keeps a
   * preset that no longer fits.
   */
  private observeContainerResize(container: HTMLDivElement): void {
    const view = container.ownerDocument.defaultView;
    if (!view?.ResizeObserver) return;

    this.containerResizeObserver = new view.ResizeObserver(() => this.queuePresetZoomRefresh());
    this.containerResizeObserver.observe(container);
  }

  private queuePresetZoomRefresh(): void {
    if (this.resizeFrame !== null) return;

    const view = this.container?.ownerDocument.defaultView;
    if (!view) return;

    this.resizeFrame = view.requestAnimationFrame(() => {
      this.resizeFrame = null;
      if (!this.doc) return;
      this.session?.refreshPresetZoom?.();
    });
  }

  private cancelPendingResize(): void {
    if (this.resizeFrame === null) return;
    this.container?.ownerDocument.defaultView?.cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = null;
  }

  private onWheelZoom(event: WheelEvent): void {
    if (!this.session || !this.container || !event.ctrlKey) return;

    const viewportHeight = this.container.ownerDocument.defaultView?.innerHeight ?? 0;
    const scaleFactor = getCtrlWheelScaleFactor(event, viewportHeight);
    if (!Number.isFinite(scaleFactor) || scaleFactor <= 0 || scaleFactor === 1) return;

    event.preventDefault();
    this.queueGestureZoom(this.wheelBaseScale * scaleFactor, getZoomOrigin(this.container, event));
  }

  /**
   * Scale a new gesture step builds on. A queued flush has not reached pdf.js
   * yet, so its target — not `currentScale` — is the live value.
   */
  private get gestureBaseScale(): number {
    return this.pendingZoom?.scale ?? this.currentScale;
  }

  /**
   * Wheel has no gesture-end event, so unlike pinch the accumulator cannot
   * reset itself when the gesture stops. It has to notice on its own when
   * something else moved the scale: clicking an internal link or outline entry
   * whose destination carries a zoom makes pdf.js write `currentScaleValue`
   * directly. A settled accumulator sits within half a quantization step of the
   * scale it applied, so anything wider is an external change and
   * `currentScale` wins.
   */
  private get wheelBaseScale(): number {
    if (this.pendingZoom) return this.pendingZoom.scale;

    const gestureScale = this.gestureScale;
    const currentScale = this.currentScale;
    return gestureScale !== null &&
      Math.abs(gestureScale - currentScale) <= HELL_PDF_GESTURE_SCALE_DRIFT
      ? gestureScale
      : currentScale;
  }

  private onPointerDown(event: PointerEvent): void {
    if (!this.session || !this.container || event.pointerType !== 'touch') return;

    this.trackTapStart(event);

    this.activeTouchPointers.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });

    try {
      this.container.setPointerCapture(event.pointerId);
    } catch {
      /* Pointer capture is best-effort; jsdom and some browsers can reject it. */
    }

    if (this.activeTouchPointers.size >= 2) {
      this.startPinchGesture();
    }
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.session || !this.container || event.pointerType !== 'touch') return;
    if (!this.activeTouchPointers.has(event.pointerId)) return;

    this.activeTouchPointers.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });

    if (this.activeTouchPointers.size < 2) return;
    if (!this.pinchGesture) this.startPinchGesture();
    if (!this.pinchGesture || this.pinchGesture.startDistance <= 0) return;

    const points = this.getPinchPoints();
    if (!points) return;

    const distance = getPointerDistance(points[0], points[1]);
    if (!Number.isFinite(distance) || distance <= 0) return;

    if (event.cancelable) event.preventDefault();

    const center = getPointerCenter(points[0], points[1]);
    this.queueGestureZoom(
      this.pinchGesture.startScale * (distance / this.pinchGesture.startDistance),
      getZoomOrigin(this.container, center),
    );
  }

  private onPointerEnd(event: PointerEvent): void {
    if (event.pointerType !== 'touch') return;

    // A cancelled pointer is the browser claiming the gesture as a pan, so it
    // never ends as a tap; drop the candidate either way.
    const tapped = event.type === 'pointerup' && this.takeTap(event);
    this.tapCandidate = null;

    this.activeTouchPointers.delete(event.pointerId);
    this.pinchGesture = null;

    if (this.activeTouchPointers.size >= 2) {
      this.startPinchGesture();
      return;
    }

    this.gestureScale = null;

    // A lift that is not a tap ends the pair as surely as a second finger does.
    // Leaving `lastTap` armed through a pan or a cancelled pointer would let
    // the next tap pair with a tap two touches ago and zoom unbidden.
    if (tapped) this.registerTap(event);
    else this.lastTap = null;
  }

  private onTouchStart(event: TouchEvent): void {
    // A second finger means a pinch. `touch-action` cannot express "one-finger
    // pan yes, two-finger pan no", so take the gesture from the browser here,
    // while the event is still cancelable: once the browser owns a pan its
    // touchmove events stop being cancelable and the pinch would fight a scroll.
    if (event.touches.length >= 2 && event.cancelable) event.preventDefault();

    // Below two live pointers the pointer path is not driving the pinch — the
    // environment has no pointer events, or the browser cancelled them when it
    // started a pan. Either way the touch path takes over from here.
    if (!this.session || !this.container || this.activeTouchPointers.size >= 2) return;

    if (event.touches.length >= 2) {
      this.startTouchPinchGesture(event);
    }
  }

  private onTouchMove(event: TouchEvent): void {
    if (!this.session || !this.container || this.activeTouchPointers.size >= 2) return;
    if (event.touches.length < 2) {
      this.touchPinchGesture = null;
      return;
    }

    if (!this.touchPinchGesture) this.startTouchPinchGesture(event);
    if (!this.touchPinchGesture || this.touchPinchGesture.startDistance <= 0) return;

    const points = getTouchPinchPoints(event);
    if (!points) return;

    const distance = getPointerDistance(points[0], points[1]);
    if (!Number.isFinite(distance) || distance <= 0) return;

    if (event.cancelable) event.preventDefault();

    const center = getPointerCenter(points[0], points[1]);
    this.queueGestureZoom(
      this.touchPinchGesture.startScale * (distance / this.touchPinchGesture.startDistance),
      getZoomOrigin(this.container, center),
    );
  }

  private onTouchEnd(event: TouchEvent): void {
    if (this.activeTouchPointers.size >= 2) return;

    this.touchPinchGesture = null;
    if (event.touches.length >= 2) {
      this.startTouchPinchGesture(event);
      return;
    }

    this.gestureScale = null;
  }

  private startPinchGesture(): void {
    const points = this.getPinchPoints();
    if (!points) return;

    this.pinchGesture = {
      startDistance: getPointerDistance(points[0], points[1]),
      startScale: this.gestureBaseScale,
    };
  }

  private startTouchPinchGesture(event: TouchEvent): void {
    const points = getTouchPinchPoints(event);
    if (!points) return;

    this.touchPinchGesture = {
      startDistance: getPointerDistance(points[0], points[1]),
      startScale: this.gestureBaseScale,
    };
  }

  private resetPinchGesture(): void {
    this.activeTouchPointers.clear();
    this.pinchGesture = null;
    this.touchPinchGesture = null;
    this.gestureScale = null;
    this.tapCandidate = null;
    this.lastTap = null;
  }

  /**
   * Start following a touch that could still end as a tap. A second finger
   * turns the sequence into a pinch, which disqualifies both the touch in
   * flight and any tap waiting for a partner.
   */
  private trackTapStart(event: PointerEvent): void {
    if (this.activeTouchPointers.size > 0) {
      this.tapCandidate = null;
      this.lastTap = null;
      return;
    }

    this.tapCandidate = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      time: this.now(),
    };
  }

  /** Whether the lifted touch stayed still and brief enough to count as a tap. */
  private takeTap(event: PointerEvent): boolean {
    const candidate = this.tapCandidate;
    this.tapCandidate = null;
    if (!candidate || candidate.pointerId !== event.pointerId) return false;
    // Another finger is still down, so this lift ends a multi-touch gesture.
    if (this.activeTouchPointers.size > 1) return false;

    const travelled = Math.hypot(
      event.clientX - candidate.clientX,
      event.clientY - candidate.clientY,
    );
    return travelled <= HELL_PDF_TAP_SLOP_PX && this.now() - candidate.time <= HELL_PDF_TAP_MAX_MS;
  }

  /** Pair a completed tap with the previous one, or park it as the next pair's first half. */
  private registerTap(event: PointerEvent): void {
    const time = this.now();
    const previous = this.lastTap;
    this.lastTap = { clientX: event.clientX, clientY: event.clientY, time };
    if (!previous) return;

    const apart = Math.hypot(event.clientX - previous.clientX, event.clientY - previous.clientY);
    if (time - previous.time > HELL_PDF_DOUBLE_TAP_MS || apart > HELL_PDF_DOUBLE_TAP_SLOP_PX) {
      return;
    }

    // A third tap opens a new pair rather than re-triggering against this one.
    this.lastTap = null;
    this.toggleDoubleTapZoom(event);
  }

  /**
   * Double tap toggles between the document's fitted scale and a magnified view
   * anchored on the tap. Zooming back out restores the preset itself — `auto`,
   * `page-fit`, `page-width` — so the document keeps re-fitting on rotation
   * instead of freezing at the number that preset happened to produce.
   */
  private toggleDoubleTapZoom(point: { readonly clientX: number; readonly clientY: number }): void {
    if (!this.session || !this.container) return;

    const baseline = this.zoomBaseline;
    const currentScale = this.currentScale;

    if (baseline && currentScale > baseline.scale * HELL_PDF_DOUBLE_TAP_ZOOMED_RATIO) {
      this.setZoomValue(baseline.value);
      return;
    }

    // Without a preset to fall back on — a document opened at a fixed numeric
    // zoom — the scale in front of the user becomes the toggle's other half.
    this.zoomBaseline ??= { value: String(currentScale), scale: currentScale };
    this.cancelPendingZoom();
    this.setNumericZoom(
      clampZoomScale((baseline?.scale ?? currentScale) * HELL_PDF_DOUBLE_TAP_ZOOM_FACTOR),
      getZoomOrigin(this.container, point),
    );
  }

  /**
   * Remember the scale a preset produced. Only presets qualify: a numeric zoom
   * is where a double tap toggles *to*, so treating one as the baseline would
   * leave the gesture with nothing to return to.
   */
  private recordZoomBaseline(displayValue: string): void {
    if (!isPdfZoomPreset(displayValue)) return;
    this.zoomBaseline = { value: displayValue, scale: this.currentScale };
  }

  private now(): number {
    return this.container?.ownerDocument.defaultView?.performance.now() ?? 0;
  }

  private getPinchPoints():
    | readonly [
        { readonly clientX: number; readonly clientY: number },
        { readonly clientX: number; readonly clientY: number },
      ]
    | null {
    const points = Array.from(this.activeTouchPointers.values());
    if (points.length < 2) return null;
    return [points[0], points[1]];
  }

  /**
   * Collapse a burst of wheel/pinch events into one scale write per frame.
   * A trackpad emits 60-120 zoom events per second and each raw write made
   * pdf.js re-layout and re-rasterize every visible page.
   */
  private queueGestureZoom(scale: number, origin?: [number, number]): void {
    if (!this.session || !this.container) return;

    const targetScale = clampZoomScale(scale);
    this.gestureScale = targetScale;
    this.pendingZoom = { scale: targetScale, origin };

    if (this.zoomFrame !== null) return;

    const view = this.container.ownerDocument.defaultView;
    if (!view) {
      this.flushGestureZoom();
      return;
    }

    this.zoomFrame = view.requestAnimationFrame(() => {
      this.zoomFrame = null;
      this.flushGestureZoom();
    });
  }

  private flushGestureZoom(): void {
    const pending = this.pendingZoom;
    this.pendingZoom = null;
    if (!pending) return;

    // Quantize to match pdf.js: the skip check and the scroll anchoring then
    // work off the scale pdf.js will actually apply. `gestureScale` still holds
    // the unrounded target so a slow gesture keeps accumulating instead of
    // stalling below the step.
    this.setNumericZoom(quantizeGestureScale(pending.scale), pending.origin, {
      drawingDelay: HELL_PDF_GESTURE_DRAWING_DELAY_MS,
    });
  }

  private cancelPendingZoom(): void {
    this.pendingZoom = null;
    this.gestureScale = null;
    if (this.zoomFrame === null) return;
    this.container?.ownerDocument.defaultView?.cancelAnimationFrame(this.zoomFrame);
    this.zoomFrame = null;
  }

  private setNumericZoom(
    scale: number,
    origin?: [number, number],
    options?: HellPdfNumericZoomOptions,
  ): void {
    if (!this.session || !this.container) return;

    const currentScale = this.currentScale;
    const targetScale = clampZoomScale(scale);
    if (Math.abs(targetScale - currentScale) < 0.0001) return;

    const localX = origin ? origin[0] - this.container.offsetLeft : this.container.clientWidth / 2;
    const localY = origin ? origin[1] - this.container.offsetTop : this.container.clientHeight / 2;
    const previousScrollLeft = this.container.scrollLeft;
    const previousScrollTop = this.container.scrollTop;
    const zoomRatio = targetScale / currentScale;

    this.session.setNumericZoom(targetScale, options);
    this.container.scrollLeft = (previousScrollLeft + localX) * zoomRatio - localX;
    this.container.scrollTop = (previousScrollTop + localY) * zoomRatio - localY;
  }

  private clearPrintSession(): void {
    this.printCleanup?.();
    this.printCleanup = null;
  }

  private clearActiveDocument(): void {
    this.session?.setDocument(null);

    const doc = this.doc;
    this.doc = null;
    if (!doc) return;

    this.destroyDocument(doc);
  }
}

function getPointerDistance(
  a: { readonly clientX: number; readonly clientY: number },
  b: { readonly clientX: number; readonly clientY: number },
): number {
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

function getPointerCenter(
  a: { readonly clientX: number; readonly clientY: number },
  b: { readonly clientX: number; readonly clientY: number },
): { readonly clientX: number; readonly clientY: number } {
  return {
    clientX: (a.clientX + b.clientX) / 2,
    clientY: (a.clientY + b.clientY) / 2,
  };
}

function getTouchPinchPoints(
  event: TouchEvent,
):
  | readonly [
      { readonly clientX: number; readonly clientY: number },
      { readonly clientX: number; readonly clientY: number },
    ]
  | null {
  if (event.touches.length < 2) return null;
  return [
    { clientX: event.touches[0].clientX, clientY: event.touches[0].clientY },
    { clientX: event.touches[1].clientX, clientY: event.touches[1].clientY },
  ];
}

function isPdfEditableTarget(target: EventTarget | null): boolean {
  if (!isElementLike(target)) return false;

  const element = target;
  return (
    (typeof element.matches === 'function' && element.matches('input,textarea,select')) ||
    isInsideEditableRegion(element)
  );
}

function isInsideEditableRegion(element: Element): boolean {
  let current: Element | null = element;

  while (current) {
    const value = current.getAttribute('contenteditable');
    if (value !== null) return value.toLowerCase() !== 'false';
    current = current.parentElement;
  }

  return false;
}
