import {
  clampZoomScale,
  getCtrlWheelScaleFactor,
  getNextZoomStep,
  getPreviousZoomStep,
  getZoomOrigin,
  normalizeZoomEventValue,
} from './pdf-viewer.utils';
import {
  HellPdfJsRuntimeAdapter,
  type HellPdfRuntimeAdapter,
  type HellPdfRuntimeBundle,
  type HellPdfPrintSession,
} from './pdf-viewer.adapter';

export type HellPdfSource = string | URL | ArrayBuffer;
export type HellPdfInitialZoom = number | 'auto' | 'page-actual' | 'page-fit' | 'page-width';
export type HellPdfFindStatus = 'pending' | 'found' | 'not-found' | 'wrapped';

export interface HellPdfRuntimeHandlers {
  onPageChange(page: number): void;
  onZoomChange(displayValue: string, emittedValue: number | string): void;
  onPagesReady(): void;
  onFindState(state: { status?: HellPdfFindStatus; current?: number; total?: number }): void;
}

export interface HellPdfLoadOptions {
  initialPage: number;
  initialZoom: HellPdfInitialZoom;
  onLoaded(totalPages: number): void;
}

export interface HellPdfFindRequest {
  source: unknown;
  type: 'again' | '';
  query: string;
  findPrevious: boolean;
}

export interface HellPdfRuntimePort {
  readonly hasDocument: boolean;
  readonly currentScale: number;
  bootstrap(container: HTMLDivElement, handlers: HellPdfRuntimeHandlers): Promise<void>;
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
  print(source: HellPdfSource, ownerDocument?: Document, cleanupDelayMs?: number): Promise<void>;
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
    this.viewerActive = !!host && target instanceof Node && host.contains(target);
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

    return (
      this.viewerActive ||
      (activeElement instanceof Node && host.contains(activeElement)) ||
      (target instanceof Node && host.contains(target)) ||
      !!(
        selection &&
        ((selection.anchorNode && host.contains(selection.anchorNode)) ||
          (selection.focusNode && host.contains(selection.focusNode)))
      )
    );
  }

  private handleCommandShortcut(
    event: KeyboardEvent,
    actions: HellPdfGlobalShortcutActions,
  ): boolean {
    if (!(event.ctrlKey || event.metaKey)) return false;

    if (event.key === 'f' || event.key === 'F') {
      event.preventDefault();
      actions.openFind();
      return true;
    }

    if (event.key === 'p' || event.key === 'P') {
      event.preventDefault();
      actions.print();
      return true;
    }

    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      actions.zoomIn();
      return true;
    }

    if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      actions.zoomOut();
      return true;
    }

    if (event.key === '0') {
      event.preventDefault();
      actions.resetZoom();
      return true;
    }

    return false;
  }
}

export class HellPdfRuntime implements HellPdfRuntimePort {
  private pdfjs: any = null;
  private viewer: any = null;
  private linkService: any = null;
  private findController: any = null;
  private eventBus: any = null;
  private doc: any = null;
  private bundle: HellPdfRuntimeBundle | null = null;
  private container: HTMLDivElement | null = null;
  private containerEventCleanup: (() => void) | null = null;
  private readonly renderedThumbs = new Set<number>();
  private handlers: HellPdfRuntimeHandlers | null = null;
  private initialZoom: HellPdfInitialZoom = 'auto';
  private initialPage = 1;
  private loadToken = 0;
  private printCleanup: (() => void) | null = null;

  constructor(private readonly adapter: HellPdfRuntimeAdapter = new HellPdfJsRuntimeAdapter()) {}

  get hasDocument(): boolean {
    return !!this.doc;
  }

  get currentScale(): number {
    return this.viewer?.currentScale ?? 1;
  }

  async bootstrap(container: HTMLDivElement, handlers: HellPdfRuntimeHandlers): Promise<void> {
    if (this.viewer) return;

    this.container = container;
    this.handlers = handlers;

    const bundle = await this.adapter.createViewer(container);
    this.installContainerInteractions(container);
    this.installEventHandlers(bundle.eventBus, bundle.viewer, bundle.findController);

    this.bundle = bundle;
    this.pdfjs = bundle.pdfjs;
    this.viewer = bundle.viewer;
    this.linkService = bundle.linkService;
    this.findController = bundle.findController;
    this.eventBus = bundle.eventBus;
  }

  async loadDocument(src: HellPdfSource, options: HellPdfLoadOptions): Promise<void> {
    if (!this.bundle || !this.pdfjs || !this.viewer || !this.linkService || !this.findController) {
      throw new Error('PDF runtime must be bootstrapped before loading a document.');
    }

    const token = ++this.loadToken;
    this.initialPage = options.initialPage;
    this.initialZoom = options.initialZoom;
    this.clearActiveDocument();
    this.renderedThumbs.clear();

    const loadingTask = this.adapter.getDocument(this.bundle, src);
    const doc = await loadingTask.promise;
    if (token !== this.loadToken) {
      try {
        doc.destroy();
      } catch {
        /* ignore */
      }
      return;
    }

    this.doc = doc;
    options.onLoaded(doc.numPages);
    this.viewer.setDocument(doc);
    this.linkService.setDocument(doc, null);
    this.findController.setDocument(doc);
  }

  cleanup(): void {
    this.loadToken++;
    this.containerEventCleanup?.();
    this.containerEventCleanup = null;
    this.clearPrintSession();
    this.clearActiveDocument();
    this.viewer?.cleanup?.();
    this.viewer = null;
    this.linkService = null;
    this.findController = null;
    this.eventBus = null;
    this.pdfjs = null;
    this.handlers = null;
    this.container = null;
    this.bundle?.destroy();
    this.bundle = null;
  }

  goTo(page: number): void {
    if (!this.viewer) return;

    const totalPages = this.doc?.numPages ?? 1;
    this.viewer.currentPageNumber = Math.min(Math.max(page, 1), totalPages);
  }

  zoomIn(): void {
    if (!this.viewer) return;
    this.setNumericZoom(getNextZoomStep(this.currentScale));
  }

  zoomOut(): void {
    if (!this.viewer) return;
    this.setNumericZoom(getPreviousZoomStep(this.currentScale));
  }

  setZoomValue(value: string): void {
    if (!this.viewer) return;
    this.viewer.currentScaleValue = value;
  }

  dispatchFind(request: HellPdfFindRequest): void {
    this.eventBus?.dispatch('find', {
      source: request.source,
      type: request.type,
      query: request.query,
      caseSensitive: false,
      entireWord: false,
      highlightAll: true,
      findPrevious: request.findPrevious,
      matchDiacritics: false,
    });
  }

  closeFind(source: unknown): void {
    this.eventBus?.dispatch('findbarclose', { source });
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
  ): Promise<HellPdfPrintSession> {
    return this.adapter.createPrintSession(source, ownerDocument);
  }

  async print(
    source: HellPdfSource,
    ownerDocument?: Document,
    cleanupDelayMs = 30_000,
  ): Promise<void> {
    this.clearPrintSession();

    const session = await this.createPrintSession(source, ownerDocument);
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
    if (!this.doc || !shouldContinue()) return;

    for (const canvas of canvases) {
      if (!shouldContinue()) return;
      const n = Number(canvas.dataset['page']);
      if (!Number.isFinite(n) || this.renderedThumbs.has(n)) continue;
      this.renderedThumbs.add(n);

      try {
        const page = await this.doc.getPage(n);
        const baseViewport = page.getViewport({ scale: 1 });
        const targetW = 120;
        const scale = targetW / baseViewport.width;
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * dpr });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
        canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch {
        this.renderedThumbs.delete(n);
      }
    }
  }

  private installEventHandlers(eventBus: any, pdfViewer: any, findController: any): void {
    eventBus.on('pagechanging', (e: any) => {
      this.handlers?.onPageChange(e.pageNumber);
    });
    eventBus.on('scalechanging', (e: any) => {
      const scale = typeof e.scale === 'number' ? e.scale : 1;
      this.handlers?.onZoomChange(
        normalizeZoomEventValue(e.presetValue, scale),
        e.presetValue ?? scale,
      );
    });
    eventBus.on('pagesinit', () => {
      pdfViewer.currentScaleValue = String(this.initialZoom);
      if (this.initialPage > 1) pdfViewer.currentPageNumber = this.initialPage;
      this.handlers?.onPagesReady();
    });
    eventBus.on('updatefindcontrolstate', (e: any) => {
      this.handlers?.onFindState(this.toFindState(e, findController));
    });
    eventBus.on('updatefindmatchescount', (e: any) => {
      this.handlers?.onFindState({
        current: e.matchesCount?.current ?? 0,
        total: e.matchesCount?.total ?? 0,
      });
    });
  }

  private installContainerInteractions(container: HTMLDivElement): void {
    this.containerEventCleanup?.();

    const onWheel = (event: WheelEvent) => this.onWheelZoom(event);
    container.addEventListener('wheel', onWheel, { passive: false });

    this.containerEventCleanup = () => {
      container.removeEventListener('wheel', onWheel);
    };
  }

  private onWheelZoom(event: WheelEvent): void {
    if (!this.viewer || !this.container || !event.ctrlKey) return;

    const scaleFactor = getCtrlWheelScaleFactor(event);
    if (!Number.isFinite(scaleFactor) || scaleFactor <= 0 || scaleFactor === 1) return;

    event.preventDefault();
    this.setNumericZoom(this.currentScale * scaleFactor, getZoomOrigin(this.container, event));
  }

  private setNumericZoom(scale: number, origin?: [number, number]): void {
    if (!this.viewer || !this.container) return;

    const currentScale = this.currentScale;
    const targetScale = clampZoomScale(scale);
    if (Math.abs(targetScale - currentScale) < 0.0001) return;

    const localX = origin ? origin[0] - this.container.offsetLeft : this.container.clientWidth / 2;
    const localY = origin ? origin[1] - this.container.offsetTop : this.container.clientHeight / 2;
    const previousScrollLeft = this.container.scrollLeft;
    const previousScrollTop = this.container.scrollTop;
    const zoomRatio = targetScale / currentScale;

    this.viewer.currentScale = targetScale;
    this.container.scrollLeft = (previousScrollLeft + localX) * zoomRatio - localX;
    this.container.scrollTop = (previousScrollTop + localY) * zoomRatio - localY;
  }

  private clearPrintSession(): void {
    this.printCleanup?.();
    this.printCleanup = null;
  }

  private clearActiveDocument(): void {
    this.viewer?.setDocument?.(null);
    this.linkService?.setDocument?.(null);
    this.findController?.setDocument?.(null);

    const doc = this.doc;
    this.doc = null;
    if (!doc) return;

    try {
      doc.destroy();
    } catch {
      /* ignore */
    }
  }

  private toFindState(
    event: { state: number; matchesCount?: { current?: number; total?: number } },
    findController: any,
  ) {
    const state = event.matchesCount
      ? {
          current: event.matchesCount.current ?? 0,
          total: event.matchesCount.total ?? 0,
        }
      : {};
    const FindState = (findController?.constructor as any)?.FindState ?? {
      FOUND: 0,
      NOT_FOUND: 1,
      WRAPPED: 2,
      PENDING: 3,
    };

    switch (event.state) {
      case FindState.FOUND:
        return { ...state, status: 'found' as const };
      case FindState.NOT_FOUND:
        return { ...state, status: 'not-found' as const };
      case FindState.WRAPPED:
        return { ...state, status: 'wrapped' as const };
      case FindState.PENDING:
        return { ...state, status: 'pending' as const };
      default:
        return state;
    }
  }
}

function isPdfEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.matches('input,textarea,select');
}
