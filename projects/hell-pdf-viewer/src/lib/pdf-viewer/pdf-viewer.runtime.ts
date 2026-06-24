import { containsNode, isElementLike } from '../dom';
import {
  clampZoomScale,
  getCtrlWheelScaleFactor,
  getNextZoomStep,
  getPreviousZoomStep,
  getZoomOrigin,
} from './pdf-viewer.utils';
import {
  HellPdfAdapterBootstrapOptions,
  HellPdfJsRuntimeAdapter,
  type HellPdfDocumentHandle,
  type HellPdfDocumentLoadTask,
  type HellPdfRuntimeAdapter,
  type HellPdfWorkerSource,
  type HellPdfPrintSession,
  type HellPdfViewerSession,
} from './pdf-viewer.adapter';
import type { HellPdfPrintOptions } from './pdf-viewer.print';

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
  private readonly renderedThumbs = new Set<number>();
  private handlers: HellPdfRuntimeHandlers | null = null;
  private initialZoom: HellPdfInitialZoom = 'auto';
  private initialPage = 1;
  private loadToken = 0;
  private loadTask: HellPdfDocumentLoadTask | null = null;
  private printCleanup: (() => void) | null = null;

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
        onZoomChange: (displayValue, emittedValue) =>
          this.handlers?.onZoomChange(displayValue, emittedValue),
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
    this.renderedThumbs.clear();

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
    this.resetPinchGesture();
    this.clearPrintSession();
    void this.cancelActiveLoadTask();
    this.clearActiveDocument();
    this.session?.cleanup();
    this.session = null;
    this.handlers = null;
    this.container = null;
  }

  goTo(page: number): void {
    if (!this.session) return;

    const totalPages = this.doc?.numPages ?? 1;
    this.session.setPage(page, totalPages);
  }

  zoomIn(): void {
    if (!this.session) return;
    this.setNumericZoom(getNextZoomStep(this.currentScale));
  }

  zoomOut(): void {
    if (!this.session) return;
    this.setNumericZoom(getPreviousZoomStep(this.currentScale));
  }

  setZoomValue(value: string): void {
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
      const win = ownerDocument?.defaultView ?? (typeof window === 'undefined' ? null : window);
      win?.setTimeout(() => session.cleanup(), cleanupDelayMs);
    } catch (error) {
      this.clearPrintSession();
      throw error;
    }
  }

  async renderThumbs(
    canvases: readonly HTMLCanvasElement[],
    shouldContinue: () => boolean,
  ): Promise<void> {
    if (!this.doc || !this.session || !shouldContinue()) return;

    for (const canvas of canvases) {
      if (!shouldContinue()) return;
      const n = Number(canvas.dataset['page']);
      if (!Number.isFinite(n) || this.renderedThumbs.has(n)) continue;
      this.renderedThumbs.add(n);

      try {
        await this.session.renderThumbnail(this.doc, n, canvas);
      } catch {
        this.renderedThumbs.delete(n);
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
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('touchcancel', onTouchEnd);

    this.containerEventCleanup = () => {
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

  private onWheelZoom(event: WheelEvent): void {
    if (!this.session || !this.container || !event.ctrlKey) return;

    const scaleFactor = getCtrlWheelScaleFactor(event);
    if (!Number.isFinite(scaleFactor) || scaleFactor <= 0 || scaleFactor === 1) return;

    event.preventDefault();
    this.setNumericZoom(this.currentScale * scaleFactor, getZoomOrigin(this.container, event));
  }

  private onPointerDown(event: PointerEvent): void {
    if (!this.session || !this.container || event.pointerType !== 'touch') return;

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
    this.setNumericZoom(
      this.pinchGesture.startScale * (distance / this.pinchGesture.startDistance),
      getZoomOrigin(this.container, center),
    );
  }

  private onPointerEnd(event: PointerEvent): void {
    if (event.pointerType !== 'touch') return;

    this.activeTouchPointers.delete(event.pointerId);
    this.pinchGesture = null;

    if (this.activeTouchPointers.size >= 2) {
      this.startPinchGesture();
    }
  }

  private onTouchStart(event: TouchEvent): void {
    if (!this.session || !this.container || this.activeTouchPointers.size > 0) return;

    if (event.touches.length >= 2) {
      this.startTouchPinchGesture(event);
    }
  }

  private onTouchMove(event: TouchEvent): void {
    if (!this.session || !this.container || this.activeTouchPointers.size > 0) return;
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
    this.setNumericZoom(
      this.touchPinchGesture.startScale * (distance / this.touchPinchGesture.startDistance),
      getZoomOrigin(this.container, center),
    );
  }

  private onTouchEnd(event: TouchEvent): void {
    if (this.activeTouchPointers.size > 0) return;

    this.touchPinchGesture = null;
    if (event.touches.length >= 2) {
      this.startTouchPinchGesture(event);
    }
  }

  private startPinchGesture(): void {
    const points = this.getPinchPoints();
    if (!points) return;

    this.pinchGesture = {
      startDistance: getPointerDistance(points[0], points[1]),
      startScale: this.currentScale,
    };
  }

  private startTouchPinchGesture(event: TouchEvent): void {
    const points = getTouchPinchPoints(event);
    if (!points) return;

    this.touchPinchGesture = {
      startDistance: getPointerDistance(points[0], points[1]),
      startScale: this.currentScale,
    };
  }

  private resetPinchGesture(): void {
    this.activeTouchPointers.clear();
    this.pinchGesture = null;
    this.touchPinchGesture = null;
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

  private setNumericZoom(scale: number, origin?: [number, number]): void {
    if (!this.session || !this.container) return;

    const currentScale = this.currentScale;
    const targetScale = clampZoomScale(scale);
    if (Math.abs(targetScale - currentScale) < 0.0001) return;

    const localX = origin ? origin[0] - this.container.offsetLeft : this.container.clientWidth / 2;
    const localY = origin ? origin[1] - this.container.offsetTop : this.container.clientHeight / 2;
    const previousScrollLeft = this.container.scrollLeft;
    const previousScrollTop = this.container.scrollTop;
    const zoomRatio = targetScale / currentScale;

    this.session.setNumericZoom(targetScale);
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

  const element = target as Element;
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
