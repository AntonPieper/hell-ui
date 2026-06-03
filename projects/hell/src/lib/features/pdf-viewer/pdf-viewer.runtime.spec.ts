import {
  HellPdfRuntime,
  HellPdfViewerInteractionScope,
  type HellPdfRuntimeHandlers,
  type HellPdfSource,
} from './pdf-viewer.runtime';
import type {
  HellPdfDocumentHandle,
  HellPdfDocumentLoadTask,
  HellPdfPrintSession,
  HellPdfRuntimeAdapter,
  HellPdfViewerSession,
  HellPdfViewerSessionHandlers,
} from './pdf-viewer.adapter';

describe('PDF Runtime', () => {
  it('passes explicit worker override from runtime to adapter during bootstrap', async () => {
    const adapter = new FakePdfAdapter();
    const runtime = new HellPdfRuntime(adapter);
    const container = document.createElement('div') as HTMLDivElement;

    await runtime.bootstrap(container, createRuntimeHandlers(), { worker: '/assets/worker.mjs' as const });

    expect(adapter.createViewer).toHaveBeenCalledWith(
      container,
      expect.any(Object),
      { worker: '/assets/worker.mjs' },
    );
  });

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

    expect(adapter.createPrintSession).toHaveBeenCalledWith('document.pdf', undefined, {});
    expect(printSession.print).toHaveBeenCalled();
    expect(printSession.cleanup).toHaveBeenCalled();
  });

  it('passes print fetch options through the PDF Runtime seam', async () => {
    const printSession: HellPdfPrintSession = {
      cleanup: vi.fn(),
      print: vi.fn().mockResolvedValue(undefined),
    };
    const adapter = new FakePdfAdapter();
    adapter.createPrintSession = vi.fn(async () => printSession);
    const runtime = new HellPdfRuntime(adapter);
    const fetchOptions: RequestInit = {
      credentials: 'include',
      headers: { Authorization: 'Bearer test' },
    };

    await runtime.print('secure.pdf', undefined, { fetch: fetchOptions, cleanupDelayMs: 1 });

    expect(adapter.createPrintSession).toHaveBeenCalledWith('secure.pdf', undefined, {
      fetch: fetchOptions,
      cleanupDelayMs: 1,
    });
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
    adapter.loadQueue.push({ promise: first.promise, destroy: vi.fn() }, { promise: second.promise, destroy: vi.fn() });

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

  it('installs and cleans up ctrl-wheel zoom handling', async () => {
    const adapter = new FakePdfAdapter();
    const runtime = new HellPdfRuntime(adapter);
    const container = document.createElement('div') as HTMLDivElement;
    await runtime.bootstrap(container, createRuntimeHandlers());

    const plainWheel = new WheelEvent('wheel', { deltaY: -10, bubbles: true, cancelable: true });
    container.dispatchEvent(plainWheel);

    expect(plainWheel.defaultPrevented).toBe(false);
    expect(adapter.session.setNumericZoom).not.toHaveBeenCalled();

    const zoomWheel = new WheelEvent('wheel', {
      ctrlKey: true,
      deltaY: -10,
      clientX: 4,
      clientY: 4,
      bubbles: true,
      cancelable: true,
    });
    container.dispatchEvent(zoomWheel);

    expect(zoomWheel.defaultPrevented).toBe(true);
    expect(adapter.session.setNumericZoom).toHaveBeenCalledOnce();
    expect(adapter.session.setNumericZoom.mock.calls[0]?.[0]).toBeGreaterThan(1);

    runtime.cleanup();
    container.dispatchEvent(
      new WheelEvent('wheel', { ctrlKey: true, deltaY: -10, bubbles: true, cancelable: true }),
    );

    expect(adapter.session.setNumericZoom).toHaveBeenCalledOnce();
  });

  it('keeps thumbnails behind the PDF Adapter seam', async () => {
    const adapter = new FakePdfAdapter();
    const runtime = new HellPdfRuntime(adapter);
    await runtime.bootstrap(document.createElement('div') as HTMLDivElement, createRuntimeHandlers());
    const doc = fakeDocument(3);
    adapter.loadQueue.push({ promise: Promise.resolve(doc), destroy: vi.fn() });
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

  it('retries thumbnails after adapter render failures', async () => {
    const adapter = new FakePdfAdapter();
    const runtime = new HellPdfRuntime(adapter);
    await runtime.bootstrap(document.createElement('div') as HTMLDivElement, createRuntimeHandlers());
    const doc = fakeDocument(3);
    adapter.loadQueue.push({ promise: Promise.resolve(doc), destroy: vi.fn() });
    await runtime.loadDocument('thumbs.pdf', {
      initialPage: 1,
      initialZoom: 'auto',
      onLoaded: vi.fn(),
    });
    adapter.session.renderThumbnail.mockRejectedValueOnce(new Error('canvas unavailable'));

    const canvas = document.createElement('canvas');
    canvas.dataset['page'] = '2';
    await runtime.renderThumbs([canvas], () => true);
    await runtime.renderThumbs([canvas], () => true);

    expect(adapter.session.renderThumbnail).toHaveBeenCalledTimes(2);
  });

  it('destroys the active document during cleanup', async () => {
    const adapter = new FakePdfAdapter();
    const runtime = new HellPdfRuntime(adapter);
    await runtime.bootstrap(document.createElement('div') as HTMLDivElement, createRuntimeHandlers());
    const doc = fakeDocument(1);
    adapter.loadQueue.push({ promise: Promise.resolve(doc), destroy: vi.fn() });
    await runtime.loadDocument('active.pdf', {
      initialPage: 1,
      initialZoom: 'auto',
      onLoaded: vi.fn(),
    });

    runtime.cleanup();

    expect(doc.destroy).toHaveBeenCalledOnce();
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

  it('requires exact command modifiers for global PDF shortcuts', () => {
    const host = document.createElement('div');
    const inside = document.createElement('button');
    host.append(inside);
    document.body.append(host);

    const scope = new HellPdfViewerInteractionScope(() => host);
    const actions = createShortcutActions();
    scope.recordPointerTarget(inside);

    expect(scope.handleGlobalShortcut(ctrlKey('f'), actions)).toBe(true);
    expect(scope.handleGlobalShortcut(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, altKey: true }), actions)).toBe(false);
    expect(scope.handleGlobalShortcut(new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, shiftKey: true }), actions)).toBe(false);
    expect(scope.handleGlobalShortcut(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, metaKey: true }), actions)).toBe(false);

    expect(actions.openFind).toHaveBeenCalledOnce();
    expect(actions.print).not.toHaveBeenCalled();

    host.remove();
  });

  it('does not leak global shortcuts across viewer scopes', () => {
    const hostA = document.createElement('div');
    const hostB = document.createElement('div');
    const insideA = document.createElement('button');
    const insideB = document.createElement('button');
    hostA.append(insideA);
    hostB.append(insideB);
    document.body.append(hostA, hostB);

    const scopeA = new HellPdfViewerInteractionScope(() => hostA);
    const scopeB = new HellPdfViewerInteractionScope(() => hostB);
    const actionsA = createShortcutActions();
    const actionsB = createShortcutActions();

    scopeA.recordPointerTarget(insideA);
    scopeB.recordPointerTarget(insideA);

    expect(scopeA.handleGlobalShortcut(ctrlKey('+'), actionsA)).toBe(true);
    expect(scopeB.handleGlobalShortcut(ctrlKey('+'), actionsB)).toBe(false);
    expect(actionsA.zoomIn).toHaveBeenCalledOnce();
    expect(actionsB.zoomIn).not.toHaveBeenCalled();

    scopeA.recordPointerTarget(insideB);
    scopeB.recordPointerTarget(insideB);

    expect(scopeA.handleGlobalShortcut(ctrlKey('+'), actionsA)).toBe(false);
    expect(scopeB.handleGlobalShortcut(ctrlKey('+'), actionsB)).toBe(true);
    expect(actionsA.zoomIn).toHaveBeenCalledOnce();
    expect(actionsB.zoomIn).toHaveBeenCalledOnce();

    hostA.remove();
    hostB.remove();
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

  it('keeps viewer key handling out of contenteditable regions', () => {
    const host = document.createElement('div');
    const editor = document.createElement('div');
    const child = document.createElement('span');
    editor.setAttribute('contenteditable', 'true');
    editor.append(child);
    host.append(editor);
    document.body.append(host);

    const scope = new HellPdfViewerInteractionScope(() => host);
    const actions = createShortcutActions();
    let handled = true;
    child.addEventListener('keydown', (event) => {
      handled = scope.handleViewerKey(event, actions);
    });

    child.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));

    expect(handled).toBe(false);
    expect(actions.nextPage).not.toHaveBeenCalled();

    host.remove();
  });

  it('handles viewer page keys on non-editable content', () => {
    const host = document.createElement('div');
    const textLayer = document.createElement('span');
    host.append(textLayer);
    document.body.append(host);

    const scope = new HellPdfViewerInteractionScope(() => host);
    const actions = createShortcutActions();
    let handled = false;
    textLayer.addEventListener('keydown', (event) => {
      handled = scope.handleViewerKey(event, actions);
    });

    const event = new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true });
    textLayer.dispatchEvent(event);

    expect(handled).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(actions.nextPage).toHaveBeenCalledOnce();

    host.remove();
  });
});

class FakePdfAdapter implements HellPdfRuntimeAdapter {
  readonly session = new FakePdfSession();
  readonly loadQueue: HellPdfDocumentLoadTask[] = [];

  createViewer = vi.fn(
    async (_container: HTMLDivElement, handlers: HellPdfViewerSessionHandlers) => {
      this.session.handlers = handlers;
      return this.session;
    },
  );

  loadDocument = vi.fn(async () => {
    const next = this.loadQueue.shift();
    if (!next) throw new Error('No fake load queued.');
    return next;
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

  setNumericZoom = vi.fn((scale: number): void => {
    this.currentScale = scale;
  });
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
