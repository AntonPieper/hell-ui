const pdfJsMock = vi.hoisted(() => ({
  getDocument: vi.fn(),
  pdfWorkers: [] as Array<{
    readonly options: { readonly port: Worker };
    readonly destroy: ReturnType<typeof vi.fn>;
  }>,
}));

const pdfViewerMock = vi.hoisted(() => ({
  eventBuses: [] as Array<{
    readonly listeners: Map<string, (event: unknown) => void>;
    readonly dispatch: ReturnType<typeof vi.fn>;
    emit(eventName: string, event?: unknown): void;
  }>,
  linkServices: [] as Array<{
    readonly setViewer: ReturnType<typeof vi.fn>;
    readonly setDocument: ReturnType<typeof vi.fn>;
  }>,
  findControllers: [] as Array<{
    readonly setDocument: ReturnType<typeof vi.fn>;
  }>,
  viewers: [] as Array<{
    currentScale: number;
    currentScaleValue: string;
    currentPageNumber: number;
    readonly setDocument: ReturnType<typeof vi.fn>;
    readonly cleanup: ReturnType<typeof vi.fn>;
  }>,
}));

vi.mock('pdfjs-dist', () => {
  class PDFWorker {
    readonly destroy = vi.fn();

    constructor(readonly options: { readonly port: Worker }) {
      pdfJsMock.pdfWorkers.push(this);
    }
  }

  return {
    PDFWorker,
    getDocument: pdfJsMock.getDocument,
  };
});

vi.mock('pdfjs-dist/web/pdf_viewer.mjs', () => {
  class EventBus {
    readonly listeners = new Map<string, (event: unknown) => void>();
    readonly dispatch = vi.fn((eventName: string, data: Record<string, unknown>) => {
      this.emit(eventName, data);
    });

    constructor() {
      pdfViewerMock.eventBuses.push(this);
    }

    on(eventName: string, listener: (event: unknown) => void): void {
      this.listeners.set(eventName, listener);
    }

    emit(eventName: string, event?: unknown): void {
      this.listeners.get(eventName)?.(event);
    }
  }

  class PDFLinkService {
    readonly setViewer = vi.fn();
    readonly setDocument = vi.fn();

    constructor(_options: { readonly eventBus: EventBus }) {
      pdfViewerMock.linkServices.push(this);
    }
  }

  class PDFFindController {
    readonly setDocument = vi.fn();

    constructor(
      _options: {
        readonly eventBus: EventBus;
        readonly linkService: PDFLinkService;
      },
    ) {
      pdfViewerMock.findControllers.push(this);
    }
  }

  class PDFViewer {
    currentScale = 1;
    currentScaleValue = 'auto';
    currentPageNumber = 1;
    readonly setDocument = vi.fn();
    readonly cleanup = vi.fn();

    constructor(
      _options: {
        readonly container: HTMLDivElement;
        readonly eventBus: EventBus;
        readonly linkService: PDFLinkService;
        readonly findController: PDFFindController;
        readonly textLayerMode: number;
        readonly annotationMode: number;
        readonly annotationEditorMode: number;
      },
    ) {
      pdfViewerMock.viewers.push(this);
    }
  }

  return {
    EventBus,
    PDFLinkService,
    PDFFindController,
    PDFViewer,
  };
});

import {
  HellPdfJsRuntimeAdapter,
  hellWithPdfJsGlobal,
  type HellPdfDocumentHandle,
  type HellPdfViewerSessionHandlers,
} from './pdf-viewer.adapter';
import type { HellPdfFindStatus } from './pdf-viewer.runtime';

class FakeWorker {
  static instances: FakeWorker[] = [];
  readonly terminate = vi.fn();

  constructor(
    readonly url: string | URL,
    readonly options?: WorkerOptions,
  ) {
    FakeWorker.instances.push(this);
  }
}

describe('PDF Adapter globals', () => {
  afterEach(() => {
    delete (globalThis as typeof globalThis & { pdfjsLib?: unknown }).pdfjsLib;
  });

  it('restores a previous pdf.js global after importing the viewer module', async () => {
    const previous = { version: 'previous' };
    const next = { version: 'next' };
    const globalWithPdfJs = globalThis as typeof globalThis & { pdfjsLib?: unknown };
    globalWithPdfJs.pdfjsLib = previous;

    const loaded = await hellWithPdfJsGlobal(next, async () => {
      expect(globalWithPdfJs.pdfjsLib).toBe(next);
      return { viewer: true };
    });

    expect(loaded).toEqual({ viewer: true });
    expect(globalWithPdfJs.pdfjsLib).toBe(previous);
  });

  it('removes the pdf.js global when no previous value existed', async () => {
    const globalWithPdfJs = globalThis as typeof globalThis & { pdfjsLib?: unknown };

    await hellWithPdfJsGlobal({ version: 'next' }, async () => {
      expect(globalWithPdfJs.pdfjsLib).toEqual({ version: 'next' });
      return null;
    });

    expect(Object.hasOwn(globalWithPdfJs, 'pdfjsLib')).toBe(false);
  });

  it('serializes concurrent viewer imports that need the temporary pdf.js global', async () => {
    const globalWithPdfJs = globalThis as typeof globalThis & { pdfjsLib?: unknown };
    const seen: unknown[] = [];
    let releaseFirst!: () => void;

    const first = hellWithPdfJsGlobal({ version: 'first' }, async () => {
      seen.push(globalWithPdfJs.pdfjsLib);
      await new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });
      seen.push(globalWithPdfJs.pdfjsLib);
      return 'first';
    });
    const second = hellWithPdfJsGlobal({ version: 'second' }, async () => {
      seen.push(globalWithPdfJs.pdfjsLib);
      return 'second';
    });

    await Promise.resolve();
    releaseFirst();

    await expect(Promise.all([first, second])).resolves.toEqual(['first', 'second']);
    expect(seen).toEqual([{ version: 'first' }, { version: 'first' }, { version: 'second' }]);
    expect(Object.hasOwn(globalWithPdfJs, 'pdfjsLib')).toBe(false);
  });
});

describe('PDF Adapter browser seam', () => {
  beforeEach(() => {
    pdfJsMock.getDocument.mockReset();
    pdfJsMock.pdfWorkers.length = 0;
    pdfViewerMock.eventBuses.length = 0;
    pdfViewerMock.linkServices.length = 0;
    pdfViewerMock.findControllers.length = 0;
    pdfViewerMock.viewers.length = 0;
    FakeWorker.instances.length = 0;
    vi.stubGlobal('Worker', FakeWorker as unknown as typeof Worker);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fails fast when viewer creation has no worker source', async () => {
    const adapter = new HellPdfJsRuntimeAdapter();
    const handlers = createSessionHandlers();

    await expect(adapter.createViewer(document.createElement('div'), handlers)).rejects.toThrow(
      'HellPdfViewer requires an explicit pdf.js worker source.',
    );
  });

  it('adapts pdf.js viewer events and commands behind a stable session port', async () => {
    const adapter = new HellPdfJsRuntimeAdapter();
    const handlers = createSessionHandlers();
    const session = await adapter.createViewer(document.createElement('div'), handlers, {
      worker: '/assets/pdf.worker.mjs',
    });
    const eventBus = required(pdfViewerMock.eventBuses[0]);
    const linkService = required(pdfViewerMock.linkServices[0]);
    const findController = required(pdfViewerMock.findControllers[0]);
    const viewer = required(pdfViewerMock.viewers[0]);
    const worker = required(FakeWorker.instances[0]);
    const pdfWorker = required(pdfJsMock.pdfWorkers[0]);

    expect(worker.options).toEqual({ type: 'module' });
    expect(worker.url).toBe('/assets/pdf.worker.mjs');
    expect(linkService.setViewer).toHaveBeenCalledWith(viewer);

    eventBus.emit('pagesinit');
    expect(viewer.currentScaleValue).toBe('page-width');
    expect(viewer.currentPageNumber).toBe(3);
    expect(handlers.onPagesReady).toHaveBeenCalledOnce();

    eventBus.emit('pagechanging', { pageNumber: 7 });
    eventBus.emit('pagechanging', { pageNumber: 'bad' });
    expect(handlers.onPageChange).toHaveBeenCalledWith(7);
    expect(handlers.onPageChange).toHaveBeenCalledOnce();

    eventBus.emit('scalechanging', { scale: 1.25, presetValue: 'page-fit' });
    eventBus.emit('scalechanging', { scale: 1.5 });
    expect(handlers.onZoomChange).toHaveBeenNthCalledWith(1, 'page-fit', 'page-fit');
    expect(handlers.onZoomChange).toHaveBeenNthCalledWith(2, '1.5', 1.5);

    for (const [state, status] of [
      [0, 'found'],
      [1, 'not-found'],
      [2, 'wrapped'],
      [3, 'pending'],
    ] as const satisfies readonly (readonly [number, HellPdfFindStatus])[]) {
      eventBus.emit('updatefindcontrolstate', {
        state,
        matchesCount: { current: 2, total: 8 },
      });
      expect(handlers.onFindState).toHaveBeenLastCalledWith({ current: 2, total: 8, status });
    }

    eventBus.emit('updatefindcontrolstate', { state: 999 });
    eventBus.emit('updatefindmatchescount', { matchesCount: { current: 'bad', total: undefined } });
    expect(handlers.onFindState).toHaveBeenLastCalledWith({ current: 0, total: 0 });

    const doc = fakeDocument(12);
    session.setDocument(doc);
    expect(viewer.setDocument).toHaveBeenCalledWith(doc);
    expect(linkService.setDocument).toHaveBeenCalledWith(doc, null);
    expect(findController.setDocument).toHaveBeenCalledWith(doc);

    session.setPage(99, 12);
    expect(viewer.currentPageNumber).toBe(12);
    session.setPage(-5, 12);
    expect(viewer.currentPageNumber).toBe(1);

    session.setZoomValue('auto');
    session.setNumericZoom(2);
    expect(viewer.currentScaleValue).toBe('auto');
    expect(viewer.currentScale).toBe(2);
    expect(session.currentScale).toBe(2);

    session.dispatchFind({ source: 'findbar', type: '', query: 'needle', findPrevious: true });
    expect(eventBus.dispatch).toHaveBeenCalledWith('find', {
      source: 'findbar',
      type: '',
      query: 'needle',
      caseSensitive: false,
      entireWord: false,
      highlightAll: true,
      findPrevious: true,
      matchDiacritics: false,
    });

    session.closeFind('findbar');
    expect(eventBus.dispatch).toHaveBeenCalledWith('findbarclose', { source: 'findbar' });

    const loaded = fakeDocument(4);
    pdfJsMock.getDocument.mockReturnValueOnce({ promise: Promise.resolve(loaded) });
    const urlLoadTask = await adapter.loadDocument(session, new URL('https://example.test/doc.pdf'));
    await expect(urlLoadTask.promise).resolves.toBe(loaded);
    expect(pdfJsMock.getDocument).toHaveBeenLastCalledWith({
      url: 'https://example.test/doc.pdf',
      worker: pdfWorker,
    });

    const bytes = new Uint8Array([1, 2, 3]).buffer;
    pdfJsMock.getDocument.mockReturnValueOnce({ promise: Promise.resolve(loaded) });
    const dataLoadTask = await adapter.loadDocument(session, bytes);
    await dataLoadTask.promise;
    expect(pdfJsMock.getDocument).toHaveBeenLastCalledWith({ data: bytes, worker: pdfWorker });

    await expect(adapter.loadDocument({} as never, 'doc.pdf')).rejects.toThrow(
      'PDF viewer session was not created by this adapter.',
    );

    const canvas = document.createElement('canvas');
    const render = vi.fn(() => ({ promise: Promise.resolve() }));
    const page = {
      getViewport: vi.fn(({ scale }: { readonly scale: number }) => ({
        width: 200 * scale,
        height: 300 * scale,
      })),
      render,
    };
    const thumbDoc = {
      ...fakeDocument(1),
      getPage: vi.fn(async () => page),
    };
    vi.spyOn(canvas, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);

    await session.renderThumbnail(thumbDoc, 1, canvas);

    expect(thumbDoc.getPage).toHaveBeenCalledWith(1);
    expect(canvas.width).toBe(120);
    expect(canvas.height).toBe(180);
    expect(canvas.style.width).toBe('120px');
    expect(canvas.style.height).toBe('180px');
    expect(render).toHaveBeenCalledOnce();

    session.cleanup();
    expect(viewer.cleanup).toHaveBeenCalledOnce();
    expect(pdfWorker.destroy).toHaveBeenCalledOnce();
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it('fails explicitly when downloads run without a document context', async () => {
    const adapter = new HellPdfJsRuntimeAdapter();
    vi.stubGlobal('document', undefined);

    await expect(adapter.download('/document.pdf')).rejects.toThrow(
      'Cannot download PDF without a browser document.',
    );
  });

  it('supports explicit worker source overrides for viewer creation', async () => {
    const adapter = new HellPdfJsRuntimeAdapter();
    const handlers = createSessionHandlers();

    const sessionWithCustomWorker = await adapter.createViewer(document.createElement('div'), handlers, {
      worker: {
        workerUrl: '/assets/pdf.worker.custom.js',
        workerOptions: { name: 'worker' },
      },
    });

    const created = FakeWorker.instances.at(-1);
    sessionWithCustomWorker.cleanup();
    expect(created?.url).toBe('/assets/pdf.worker.custom.js');
    expect(created?.options).toEqual({ type: 'module', name: 'worker' });

    const externalPort = new FakeWorker('external.mjs');
    const sessionWithPort = await adapter.createViewer(document.createElement('div'), handlers, {
      worker: { port: externalPort as unknown as Worker },
    });

    sessionWithPort.cleanup();
    expect(externalPort.terminate).not.toHaveBeenCalled();
  });

  it('creates hidden iframe print sessions through the print helper seam', async () => {
    const adapter = new HellPdfJsRuntimeAdapter();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:printable-pdf');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    const session = await adapter.createPrintSession(new Uint8Array([1, 2, 3]).buffer, document);
    const iframe = required(document.querySelector('iframe'));
    const frameWindow = required(iframe.contentWindow);
    vi.spyOn(frameWindow, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    const focus = vi.spyOn(frameWindow, 'focus').mockImplementation(() => undefined);
    const print = vi.spyOn(frameWindow, 'print').mockImplementation(() => undefined);

    const printed = session.print();
    iframe.dispatchEvent(new Event('load'));
    await printed;
    session.cleanup();

    expect(focus).toHaveBeenCalledOnce();
    expect(print).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:printable-pdf');
  });

  it('creates browser download handles for urls and in-memory PDFs', async () => {
    vi.useFakeTimers();
    const adapter = new HellPdfJsRuntimeAdapter();
    const clicked: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this);
    });
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:hell-pdf');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    await adapter.download('https://example.test/reports/monthly.pdf?token=1', null, document);
    await adapter.download(new URL('https://example.test/reports/annual.pdf'), 'override.pdf', document);
    await adapter.download(new Uint8Array([1, 2, 3]).buffer, undefined, document);

    expect(clicked[0]?.href).toBe('https://example.test/reports/monthly.pdf?token=1');
    expect(clicked[0]?.download).toBe('monthly.pdf');
    expect(clicked[0]?.rel).toBe('noreferrer');
    expect(clicked[0]?.isConnected).toBe(false);
    expect(clicked[1]?.href).toBe('https://example.test/reports/annual.pdf');
    expect(clicked[1]?.download).toBe('override.pdf');
    expect(clicked[2]?.href).toBe('blob:hell-pdf');
    expect(clicked[2]?.download).toBe('document.pdf');
    expect(createObjectURL).toHaveBeenCalledOnce();

    await vi.advanceTimersByTimeAsync(60_000);

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:hell-pdf');
  });
});

function createSessionHandlers(): HellPdfViewerSessionHandlers {
  return {
    initialPage: () => 3,
    initialZoom: () => 'page-width',
    onPageChange: vi.fn(),
    onZoomChange: vi.fn(),
    onPagesReady: vi.fn(),
    onFindState: vi.fn(),
  };
}

function fakeDocument(numPages: number): HellPdfDocumentHandle {
  return { numPages, destroy: vi.fn() };
}

function required<T>(value: T | null | undefined): NonNullable<T> {
  if (value === null || value === undefined) throw new Error('Expected test value.');
  return value;
}
