import type {
  HellPdfFindRequest,
  HellPdfFindStatus,
  HellPdfInitialZoom,
  HellPdfSource,
} from './pdf-viewer.runtime';
import {
  createHiddenPdfPrintHandle,
  printPdfInHiddenIframe,
  type HellPdfPrintOptions,
  type HiddenPdfPrintHandle,
} from './pdf-viewer.print';
import { normalizeZoomEventValue } from './pdf-viewer.utils';

/** Loaded document handle owned by the active runtime adapter. */
export interface HellPdfDocumentHandle {
  readonly numPages: number;
  destroy(): void;
}

/** Callbacks and initial state passed into an adapter-created viewer session. */
export interface HellPdfViewerSessionHandlers {
  readonly initialPage: () => number;
  readonly initialZoom: () => HellPdfInitialZoom;
  readonly onPageChange: (page: number) => void;
  readonly onZoomChange: (displayValue: string, emittedValue: number | string) => void;
  readonly onPagesReady: () => void;
  readonly onFindState: (state: {
    status?: HellPdfFindStatus;
    current?: number;
    total?: number;
  }) => void;
}

/** Adapter-owned viewer session. Runtime commands stay pdf.js-agnostic. */
export interface HellPdfViewerSession {
  readonly currentScale: number;
  setDocument(doc: HellPdfDocumentHandle | null): void;
  setPage(page: number, totalPages: number): void;
  setZoomValue(value: string): void;
  setNumericZoom(scale: number): void;
  dispatchFind(request: HellPdfFindRequest): void;
  closeFind(source: unknown): void;
  renderThumbnail(
    doc: HellPdfDocumentHandle,
    pageNumber: number,
    canvas: HTMLCanvasElement,
  ): Promise<void>;
  cleanup(): void;
}

/**
 * Adapter seam around pdf.js, downloads, and printing. Tests and future pdf.js
 * upgrades can replace browser-heavy work without changing `HellPdfRuntime`.
 */
export interface HellPdfRuntimeAdapter {
  createViewer(
    container: HTMLDivElement,
    handlers: HellPdfViewerSessionHandlers,
  ): Promise<HellPdfViewerSession>;
  loadDocument(
    session: HellPdfViewerSession,
    source: HellPdfSource,
  ): Promise<HellPdfDocumentHandle>;
  download(
    source: HellPdfSource,
    fileName?: string | null,
    ownerDocument?: Document,
  ): Promise<void>;
  createPrintSession(
    source: HellPdfSource,
    ownerDocument?: Document,
    options?: HellPdfPrintOptions,
  ): Promise<HellPdfPrintSession>;
}

/** Hidden print lifecycle handle; callers must cleanup after print or failure. */
export interface HellPdfPrintSession {
  cleanup(): void;
  print(): Promise<void>;
}

interface HellPdfJsWorkerHandle {
  destroy(): void | Promise<void>;
}

interface HellPdfJsLoadingTask {
  readonly promise: Promise<HellPdfDocumentHandle>;
}

interface HellPdfJsModule {
  readonly PDFWorker: new (options: { readonly port: Worker }) => HellPdfJsWorkerHandle;
  getDocument(
    source:
      | string
      | URL
      | ArrayBuffer
      | { readonly url: string; readonly worker: HellPdfJsWorkerHandle }
      | { readonly data: ArrayBuffer; readonly worker: HellPdfJsWorkerHandle },
  ): HellPdfJsLoadingTask;
}

interface HellPdfJsEventBus {
  on(eventName: string, listener: (event: unknown) => void): void;
  dispatch(eventName: string, data: Record<string, unknown>): void;
}

interface HellPdfJsLinkService {
  setViewer(viewer: HellPdfJsViewer): void;
  setDocument(doc: HellPdfDocumentHandle | null, baseUrl?: string | null): void;
}

interface HellPdfJsFindController {
  setDocument(doc: HellPdfDocumentHandle | null): void;
}

interface HellPdfJsViewer {
  currentScale: number;
  currentScaleValue: string;
  currentPageNumber: number;
  setDocument(doc: HellPdfDocumentHandle | null): void;
  cleanup?(): void;
}

interface HellPdfJsViewerModule {
  readonly EventBus: new () => HellPdfJsEventBus;
  readonly PDFLinkService: new (options: { readonly eventBus: HellPdfJsEventBus }) => HellPdfJsLinkService;
  readonly PDFFindController: new (options: {
    readonly eventBus: HellPdfJsEventBus;
    readonly linkService: HellPdfJsLinkService;
  }) => HellPdfJsFindController;
  readonly PDFViewer: new (options: {
    readonly container: HTMLDivElement;
    readonly eventBus: HellPdfJsEventBus;
    readonly linkService: HellPdfJsLinkService;
    readonly findController: HellPdfJsFindController;
    readonly textLayerMode: number;
    readonly annotationMode: number;
    readonly annotationEditorMode: number;
  }) => HellPdfJsViewer;
}

interface HellPdfPageViewport {
  readonly width: number;
  readonly height: number;
}

interface HellPdfRenderTask {
  readonly promise: Promise<void>;
}

interface HellPdfPageHandle {
  getViewport(options: { readonly scale: number }): HellPdfPageViewport;
  render(options: {
    readonly canvasContext: CanvasRenderingContext2D;
    readonly viewport: HellPdfPageViewport;
  }): HellPdfRenderTask;
}

interface HellPdfThumbnailDocumentHandle extends HellPdfDocumentHandle {
  getPage(pageNumber: number): Promise<HellPdfPageHandle>;
}

interface HellPdfPageChangingEvent {
  readonly pageNumber?: unknown;
}

interface HellPdfScaleChangingEvent {
  readonly scale?: unknown;
  readonly presetValue?: unknown;
}

interface HellPdfFindEvent {
  readonly state?: unknown;
  readonly matchesCount?: {
    readonly current?: unknown;
    readonly total?: unknown;
  };
}

const HELL_PDF_FIND_STATE = {
  FOUND: 0,
  NOT_FOUND: 1,
  WRAPPED: 2,
  PENDING: 3,
} as const;

export class HellPdfJsRuntimeAdapter implements HellPdfRuntimeAdapter {
  async createViewer(
    container: HTMLDivElement,
    handlers: HellPdfViewerSessionHandlers,
  ): Promise<HellPdfViewerSession> {
    const pdfjs = (await import('pdfjs-dist')) as unknown as HellPdfJsModule;
    const workerPort = new Worker(new URL('./pdf.worker.ts', import.meta.url), { type: 'module' });
    const pdfWorker = new pdfjs.PDFWorker({ port: workerPort });
    const viewerMod = await hellWithPdfJsGlobal(
      pdfjs,
      async () => (await import('pdfjs-dist/web/pdf_viewer.mjs')) as unknown as HellPdfJsViewerModule,
    );
    const eventBus = new viewerMod.EventBus();
    const linkService = new viewerMod.PDFLinkService({ eventBus });
    const findController = new viewerMod.PDFFindController({ eventBus, linkService });
    const viewer = new viewerMod.PDFViewer({
      container,
      eventBus,
      linkService,
      findController,
      textLayerMode: 2,
      annotationMode: 2,
      annotationEditorMode: -1,
    });

    linkService.setViewer(viewer);

    return new HellPdfJsViewerSession({
      pdfjs,
      viewer,
      linkService,
      findController,
      eventBus,
      pdfWorker,
      workerPort,
      handlers,
    });
  }

  async loadDocument(
    session: HellPdfViewerSession,
    source: HellPdfSource,
  ): Promise<HellPdfDocumentHandle> {
    if (!(session instanceof HellPdfJsViewerSession)) {
      throw new Error('PDF viewer session was not created by this adapter.');
    }
    return await session.loadDocument(source);
  }

  async download(
    source: HellPdfSource,
    fileName?: string | null,
    ownerDocument: Document = document,
  ): Promise<void> {
    const handle = createDownloadHandle(source, fileName);
    const anchor = ownerDocument.createElement('a');
    anchor.href = handle.url;
    anchor.download = handle.suggestedName;
    anchor.rel = 'noreferrer';
    ownerDocument.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    if (handle.cleanup) setTimeout(handle.cleanup, 60_000);
  }

  async createPrintSession(
    source: HellPdfSource,
    ownerDocument: Document = document,
    options?: HellPdfPrintOptions,
  ): Promise<HellPdfPrintSession> {
    const handle = await createHiddenPdfPrintHandle(source, ownerDocument, options);
    return new HellPdfIframePrintSession(handle);
  }
}

export async function hellWithPdfJsGlobal<T>(
  pdfjsLib: unknown,
  loadViewerModule: () => Promise<T>,
): Promise<T> {
  // pdf_viewer.mjs reads globalThis.pdfjsLib at module evaluation time.
  // Keep that pdf.js quirk contained to this import window so multiple
  // viewer instances do not leave a permanent global mutation behind.
  const globalWithPdfJs = globalThis as typeof globalThis & { pdfjsLib?: unknown };
  const hadPrevious = Object.hasOwn(globalWithPdfJs, 'pdfjsLib');
  const previous = globalWithPdfJs.pdfjsLib;
  globalWithPdfJs.pdfjsLib = pdfjsLib;

  try {
    return await loadViewerModule();
  } finally {
    if (hadPrevious) globalWithPdfJs.pdfjsLib = previous;
    else delete globalWithPdfJs.pdfjsLib;
  }
}

interface HellPdfJsViewerSessionOptions {
  readonly pdfjs: HellPdfJsModule;
  readonly viewer: HellPdfJsViewer;
  readonly linkService: HellPdfJsLinkService;
  readonly findController: HellPdfJsFindController;
  readonly eventBus: HellPdfJsEventBus;
  readonly pdfWorker: HellPdfJsWorkerHandle;
  readonly workerPort: Worker;
  readonly handlers: HellPdfViewerSessionHandlers;
}

class HellPdfJsViewerSession implements HellPdfViewerSession {
  constructor(private readonly options: HellPdfJsViewerSessionOptions) {
    this.installEventHandlers();
  }

  get currentScale(): number {
    return this.options.viewer?.currentScale ?? 1;
  }

  loadDocument(source: HellPdfSource): Promise<HellPdfDocumentHandle> {
    const loadingTask = this.options.pdfjs.getDocument(
      typeof source === 'string' || source instanceof URL
        ? { url: source.toString(), worker: this.options.pdfWorker }
        : { data: source, worker: this.options.pdfWorker },
    );
    return loadingTask.promise;
  }

  setDocument(doc: HellPdfDocumentHandle | null): void {
    this.options.viewer.setDocument(doc);
    this.options.linkService.setDocument(doc, null);
    this.options.findController.setDocument(doc);
  }

  setPage(page: number, totalPages: number): void {
    this.options.viewer.currentPageNumber = Math.min(Math.max(page, 1), totalPages);
  }

  setZoomValue(value: string): void {
    this.options.viewer.currentScaleValue = value;
  }

  setNumericZoom(scale: number): void {
    this.options.viewer.currentScale = scale;
  }

  dispatchFind(request: HellPdfFindRequest): void {
    this.options.eventBus.dispatch('find', {
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
    this.options.eventBus.dispatch('findbarclose', { source });
  }

  async renderThumbnail(
    doc: HellPdfDocumentHandle,
    pageNumber: number,
    canvas: HTMLCanvasElement,
  ): Promise<void> {
    const page = await (doc as HellPdfThumbnailDocumentHandle).getPage(pageNumber);
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
    if (!ctx) return;
    await page.render({ canvasContext: ctx, viewport }).promise;
  }

  cleanup(): void {
    this.options.viewer?.cleanup?.();
    this.options.pdfWorker?.destroy?.();
    this.options.workerPort.terminate();
  }

  private installEventHandlers(): void {
    const { eventBus, viewer, handlers } = this.options;
    eventBus.on('pagechanging', (e) => {
      const event = e as HellPdfPageChangingEvent;
      if (typeof event.pageNumber === 'number') handlers.onPageChange(event.pageNumber);
    });
    eventBus.on('scalechanging', (e) => {
      const event = e as HellPdfScaleChangingEvent;
      const scale = typeof event.scale === 'number' ? event.scale : 1;
      const presetValue = typeof event.presetValue === 'string' ? event.presetValue : undefined;
      handlers.onZoomChange(normalizeZoomEventValue(presetValue, scale), presetValue ?? scale);
    });
    eventBus.on('pagesinit', () => {
      viewer.currentScaleValue = String(handlers.initialZoom());
      const initialPage = handlers.initialPage();
      if (initialPage > 1) viewer.currentPageNumber = initialPage;
      handlers.onPagesReady();
    });
    eventBus.on('updatefindcontrolstate', (e) => {
      handlers.onFindState(this.toFindState(e as HellPdfFindEvent));
    });
    eventBus.on('updatefindmatchescount', (e) => {
      const event = e as HellPdfFindEvent;
      handlers.onFindState({
        current: hellPdfNumber(event.matchesCount?.current),
        total: hellPdfNumber(event.matchesCount?.total),
      });
    });
  }

  private toFindState(event: HellPdfFindEvent) {
    const state = event.matchesCount
      ? {
          current: hellPdfNumber(event.matchesCount.current),
          total: hellPdfNumber(event.matchesCount.total),
        }
      : {};
    const findState = HELL_PDF_FIND_STATE;

    switch (event.state) {
      case findState.FOUND:
        return { ...state, status: 'found' as const };
      case findState.NOT_FOUND:
        return { ...state, status: 'not-found' as const };
      case findState.WRAPPED:
        return { ...state, status: 'wrapped' as const };
      case findState.PENDING:
        return { ...state, status: 'pending' as const };
      default:
        return state;
    }
  }
}

function hellPdfNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

class HellPdfIframePrintSession implements HellPdfPrintSession {
  constructor(private readonly handle: HiddenPdfPrintHandle) {}

  cleanup(): void {
    this.handle.cleanup();
  }

  print(): Promise<void> {
    return printPdfInHiddenIframe(this.handle);
  }
}

function createDownloadHandle(source: HellPdfSource, fileName?: string | null) {
  if (typeof source === 'string') {
    return {
      url: source,
      suggestedName: fileName ?? source.split('/').pop()?.split('?')[0] ?? 'document.pdf',
      cleanup: null,
    };
  }

  if (source instanceof URL) {
    return {
      url: source.toString(),
      suggestedName: fileName ?? source.pathname.split('/').pop() ?? 'document.pdf',
      cleanup: null,
    };
  }

  const url = URL.createObjectURL(new Blob([source], { type: 'application/pdf' }));
  return {
    url,
    suggestedName: fileName ?? 'document.pdf',
    cleanup: () => URL.revokeObjectURL(url),
  };
}
