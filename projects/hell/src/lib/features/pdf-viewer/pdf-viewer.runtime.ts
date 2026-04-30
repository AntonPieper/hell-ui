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

export class HellPdfRuntime {
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
