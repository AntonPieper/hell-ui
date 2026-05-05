import {
  HellPdfRuntime,
  HellPdfViewerInteractionScope,
  type HellPdfRuntimeHandlers,
  type HellPdfSource,
} from './pdf-viewer.runtime';
import type {
  HellPdfDocumentHandle,
  HellPdfPrintSession,
  HellPdfRuntimeAdapter,
  HellPdfViewerSession,
  HellPdfViewerSessionHandlers,
} from './pdf-viewer.adapter';

describe('PDF Runtime', () => {
  it('keeps download and print browser work behind the PDF Adapter seam', async () => {
    const printSession: HellPdfPrintSession = {
      cleanup: vi.fn(),
      print: vi.fn().mockResolvedValue(undefined),
    };
    const adapter = new FakePdfAdapter();
    adapter.download = vi.fn(async () => undefined);
    adapter.createPrintSession = vi.fn(async () => printSession);
    const runtime = new HellPdfRuntime(adapter);
    const source: HellPdfSource = 'document.pdf';

    await runtime.download(source, 'report.pdf');
    const session = await runtime.createPrintSession(source);
    await session.print();
    session.cleanup();

    expect(adapter.download).toHaveBeenCalledWith(source, 'report.pdf', undefined);
    expect(adapter.createPrintSession).toHaveBeenCalledWith(source, undefined);
    expect(printSession.print).toHaveBeenCalled();
    expect(printSession.cleanup).toHaveBeenCalled();
  });

  it('owns print session cleanup in the PDF Runtime', async () => {
    const printSession: HellPdfPrintSession = {
      cleanup: vi.fn(),
      print: vi.fn().mockResolvedValue(undefined),
    };
    const adapter = new FakePdfAdapter();
    adapter.createPrintSession = vi.fn(async () => printSession);
    const runtime = new HellPdfRuntime(adapter);

    await runtime.print('document.pdf');
    runtime.cleanup();

    expect(adapter.createPrintSession).toHaveBeenCalledWith('document.pdf', undefined);
    expect(printSession.print).toHaveBeenCalled();
    expect(printSession.cleanup).toHaveBeenCalled();
  });

  it('cleans a print session when printing fails', async () => {
    const printSession: HellPdfPrintSession = {
      cleanup: vi.fn(),
      print: vi.fn().mockRejectedValue(new Error('blocked')),
    };
    const adapter = new FakePdfAdapter();
    adapter.createPrintSession = vi.fn(async () => printSession);
    const runtime = new HellPdfRuntime(adapter);

    await expect(runtime.print('document.pdf')).rejects.toThrow('blocked');

    expect(printSession.cleanup).toHaveBeenCalled();
  });

  it('uses an adversarial PDF Adapter to ignore stale document loads', async () => {
    const adapter = new FakePdfAdapter();
    const runtime = new HellPdfRuntime(adapter);
    const container = document.createElement('div') as HTMLDivElement;
    await runtime.bootstrap(container, createRuntimeHandlers());

    const first = deferred<HellPdfDocumentHandle>();
    const second = deferred<HellPdfDocumentHandle>();
    const firstDoc = fakeDocument(1);
    const secondDoc = fakeDocument(2);
    adapter.loadQueue.push(first.promise, second.promise);

    const firstLoad = runtime.loadDocument('first.pdf', {
      initialPage: 1,
      initialZoom: 'auto',
      onLoaded: vi.fn(),
    });
    const onLoaded = vi.fn();
    const secondLoad = runtime.loadDocument('second.pdf', {
      initialPage: 2,
      initialZoom: 'page-width',
      onLoaded,
    });

    second.resolve(secondDoc);
    await secondLoad;
    first.resolve(firstDoc);
    await firstLoad;

    expect(firstDoc.destroy).toHaveBeenCalledOnce();
    expect(secondDoc.destroy).not.toHaveBeenCalled();
    expect(adapter.session.document).toBe(secondDoc);
    expect(onLoaded).toHaveBeenCalledWith(2);
  });

  it('keeps thumbnails behind the PDF Adapter seam', async () => {
    const adapter = new FakePdfAdapter();
    const runtime = new HellPdfRuntime(adapter);
    await runtime.bootstrap(document.createElement('div') as HTMLDivElement, createRuntimeHandlers());
    const doc = fakeDocument(3);
    adapter.loadQueue.push(Promise.resolve(doc));
    await runtime.loadDocument('thumbs.pdf', {
      initialPage: 1,
      initialZoom: 'auto',
      onLoaded: vi.fn(),
    });

    const canvas = document.createElement('canvas');
    canvas.dataset['page'] = '2';
    await runtime.renderThumbs([canvas], () => true);

    expect(adapter.session.renderThumbnail).toHaveBeenCalledWith(doc, 2, canvas);
  });

  it('keeps global PDF shortcuts scoped to an active viewer', () => {
    const host = document.createElement('div');
    const inside = document.createElement('button');
    const outside = document.createElement('button');
    host.append(inside);
    document.body.append(host, outside);

    const scope = new HellPdfViewerInteractionScope(() => host);
    const actions = createShortcutActions();

    expect(scope.handleGlobalShortcut(ctrlKey('f'), actions)).toBe(false);

    scope.recordPointerTarget(inside);

    expect(scope.handleGlobalShortcut(ctrlKey('f'), actions)).toBe(true);
    expect(actions.openFind).toHaveBeenCalled();

    host.remove();
    outside.remove();
  });

  it('handles shortcuts from a foreign document realm', () => {
    const iframe = document.createElement('iframe');
    document.body.append(iframe);
    const foreignDocument = iframe.contentDocument;
    const foreignWindow = iframe.contentWindow as (Window & typeof globalThis) | null;
    if (!foreignDocument || !foreignWindow) throw new Error('Expected iframe realm.');

    const host = foreignDocument.createElement('div');
    const inside = foreignDocument.createElement('button');
    host.append(inside);
    foreignDocument.body.append(host);

    const scope = new HellPdfViewerInteractionScope(() => host);
    const actions = createShortcutActions();

    scope.recordPointerTarget(inside);

    expect(
      scope.handleGlobalShortcut(
        new foreignWindow.KeyboardEvent('keydown', { key: 'f', ctrlKey: true }),
        actions,
      ),
    ).toBe(true);
    expect(actions.openFind).toHaveBeenCalled();

    iframe.remove();
  });

  it('keeps viewer key handling out of foreign-realm editable targets', () => {
    const iframe = document.createElement('iframe');
    document.body.append(iframe);
    const foreignDocument = iframe.contentDocument;
    const foreignWindow = iframe.contentWindow as (Window & typeof globalThis) | null;
    if (!foreignDocument || !foreignWindow) throw new Error('Expected iframe realm.');

    const host = foreignDocument.createElement('div');
    const input = foreignDocument.createElement('input');
    host.append(input);
    foreignDocument.body.append(host);

    const scope = new HellPdfViewerInteractionScope(() => host);
    const actions = createShortcutActions();
    let handled = true;
    input.addEventListener('keydown', (event) => {
      handled = scope.handleViewerKey(event, actions);
    });

    input.dispatchEvent(new foreignWindow.KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));

    expect(handled).toBe(false);
    expect(actions.nextPage).not.toHaveBeenCalled();

    iframe.remove();
  });

  it('keeps viewer key handling out of editable targets', () => {
    const host = document.createElement('div');
    const input = document.createElement('input');
    host.append(input);
    document.body.append(host);

    const scope = new HellPdfViewerInteractionScope(() => host);
    const actions = createShortcutActions();
    let handled = true;
    input.addEventListener('keydown', (event) => {
      handled = scope.handleViewerKey(event, actions);
    });

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));

    expect(handled).toBe(false);
    expect(actions.nextPage).not.toHaveBeenCalled();

    host.remove();
  });
});

class FakePdfAdapter implements HellPdfRuntimeAdapter {
  readonly session = new FakePdfSession();
  readonly loadQueue: Promise<HellPdfDocumentHandle>[] = [];

  createViewer = vi.fn(
    async (_container: HTMLDivElement, handlers: HellPdfViewerSessionHandlers) => {
      this.session.handlers = handlers;
      return this.session;
    },
  );

  loadDocument = vi.fn(async () => {
    const next = this.loadQueue.shift();
    if (!next) throw new Error('No fake load queued.');
    return await next;
  });

  download: HellPdfRuntimeAdapter['download'] = vi.fn(async () => undefined);
  createPrintSession: HellPdfRuntimeAdapter['createPrintSession'] = vi.fn(async () => ({
    cleanup: vi.fn(),
    print: vi.fn(async () => undefined),
  }));
}

class FakePdfSession implements HellPdfViewerSession {
  currentScale = 1;
  document: HellPdfDocumentHandle | null = null;
  handlers: HellPdfViewerSessionHandlers | null = null;
  renderThumbnail = vi.fn(async () => undefined);
  cleanup = vi.fn();
  dispatchFind = vi.fn();
  closeFind = vi.fn();
  setZoomValue = vi.fn();

  setDocument(doc: HellPdfDocumentHandle | null): void {
    this.document = doc;
  }

  setPage = vi.fn();

  setNumericZoom(scale: number): void {
    this.currentScale = scale;
  }
}

function ctrlKey(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, ctrlKey: true });
}

function createShortcutActions() {
  return {
    openFind: vi.fn(),
    print: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    resetZoom: vi.fn(),
    nextPage: vi.fn(),
    previousPage: vi.fn(),
    firstPage: vi.fn(),
    lastPage: vi.fn(),
  };
}

function createRuntimeHandlers(): HellPdfRuntimeHandlers {
  return {
    onPageChange: vi.fn(),
    onZoomChange: vi.fn(),
    onPagesReady: vi.fn(),
    onFindState: vi.fn(),
  };
}

function fakeDocument(numPages: number): HellPdfDocumentHandle {
  return { numPages, destroy: vi.fn() };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
