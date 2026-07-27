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
    adapter.loadQueue.push(
      { promise: first.promise, destroy: vi.fn() },
      { promise: second.promise, destroy: vi.fn() },
    );

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
    await nextFrame();

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
    await nextFrame();

    expect(zoomWheel.defaultPrevented).toBe(true);
    expect(adapter.session.setNumericZoom).toHaveBeenCalledOnce();
    expect(adapter.session.setNumericZoom.mock.calls[0]?.[0]).toBeGreaterThan(1);

    runtime.cleanup();
    container.dispatchEvent(
      new WheelEvent('wheel', { ctrlKey: true, deltaY: -10, bubbles: true, cancelable: true }),
    );
    await nextFrame();

    expect(adapter.session.setNumericZoom).toHaveBeenCalledOnce();
  });

  it('coalesces a gesture zoom burst into one scale write per frame', async () => {
    const adapter = new FakePdfAdapter();
    const runtime = new HellPdfRuntime(adapter);
    const container = document.createElement('div') as HTMLDivElement;
    await runtime.bootstrap(container, createRuntimeHandlers());

    for (let i = 0; i < 12; i++) {
      container.dispatchEvent(
        new WheelEvent('wheel', {
          ctrlKey: true,
          deltaY: -6,
          clientX: 4,
          clientY: 4,
          bubbles: true,
          cancelable: true,
        }),
      );
    }
    await nextFrame();

    expect(adapter.session.setNumericZoom).toHaveBeenCalledOnce();
    // The burst still lands on the scale the last event asked for.
    expect(adapter.session.setNumericZoom.mock.calls[0]?.[0]).toBeCloseTo(
      Math.round(Math.exp(6 * 0.007 * 12) * 100) / 100,
      2,
    );
    // Gesture writes ask pdf.js to postpone re-rasterizing until the gesture settles.
    expect(adapter.session.setNumericZoom.mock.calls[0]?.[1]?.drawingDelay).toBeGreaterThanOrEqual(
      0,
    );
  });

  it('applies keyboard and toolbar zoom immediately instead of deferring drawing', async () => {
    const adapter = new FakePdfAdapter();
    const runtime = new HellPdfRuntime(adapter);
    const container = document.createElement('div') as HTMLDivElement;
    await runtime.bootstrap(container, createRuntimeHandlers());

    runtime.zoomIn();

    expect(adapter.session.setNumericZoom).toHaveBeenCalledOnce();
    expect(adapter.session.setNumericZoom.mock.calls[0]?.[1]).toBeUndefined();
  });

  it('drops a pending gesture zoom when a preset zoom is selected', async () => {
    const adapter = new FakePdfAdapter();
    const runtime = new HellPdfRuntime(adapter);
    const container = document.createElement('div') as HTMLDivElement;
    await runtime.bootstrap(container, createRuntimeHandlers());

    container.dispatchEvent(
      new WheelEvent('wheel', {
        ctrlKey: true,
        deltaY: -6,
        clientX: 4,
        clientY: 4,
        bubbles: true,
        cancelable: true,
      }),
    );
    runtime.setZoomValue('page-width');
    await nextFrame();

    expect(adapter.session.setZoomValue).toHaveBeenCalledWith('page-width');
    expect(adapter.session.setNumericZoom).not.toHaveBeenCalled();
  });

  it('re-applies a container-fitted preset zoom when the container is resized', async () => {
    const adapter = new FakePdfAdapter();
    const runtime = new HellPdfRuntime(adapter);
    const container = document.createElement('div') as HTMLDivElement;
    const observers = stubResizeObserver();

    try {
      await runtime.bootstrap(container, createRuntimeHandlers());
      adapter.loadQueue.push({ promise: Promise.resolve(fakeDocument(2)), destroy: vi.fn() });
      await runtime.loadDocument('resize.pdf', {
        initialPage: 1,
        initialZoom: 'auto',
        onLoaded: vi.fn(),
      });

      expect(observers.observed()).toContain(container);

      observers.trigger();
      await nextFrame();

      expect(adapter.session.refreshPresetZoom).toHaveBeenCalled();

      runtime.cleanup();
      observers.trigger();
      await nextFrame();

      expect(adapter.session.refreshPresetZoom).toHaveBeenCalledOnce();
    } finally {
      observers.restore();
    }
  });

  it('zooms around the gesture center on two-touch pinch', async () => {
    const adapter = new FakePdfAdapter();
    const runtime = new HellPdfRuntime(adapter);
    const container = document.createElement('div') as HTMLDivElement;
    vi.spyOn(container, 'offsetLeft', 'get').mockReturnValue(10);
    vi.spyOn(container, 'offsetTop', 'get').mockReturnValue(20);
    vi.spyOn(container, 'clientWidth', 'get').mockReturnValue(300);
    vi.spyOn(container, 'clientHeight', 'get').mockReturnValue(400);
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 200,
      width: 300,
      height: 400,
      top: 200,
      right: 400,
      bottom: 600,
      left: 100,
      toJSON: () => ({}),
    });
    await runtime.bootstrap(container, createRuntimeHandlers());

    container.dispatchEvent(touchPointer('pointerdown', 1, 130, 260));
    container.dispatchEvent(touchPointer('pointerdown', 2, 230, 260));

    const pinchMove = touchPointer('pointermove', 2, 280, 260);
    container.dispatchEvent(pinchMove);
    await nextFrame();

    expect(pinchMove.defaultPrevented).toBe(true);
    expect(adapter.session.setNumericZoom).toHaveBeenCalledWith(1.5, expect.anything());
    expect(container.scrollLeft).toBeCloseTo(52.5);
    expect(container.scrollTop).toBeCloseTo(30);

    runtime.cleanup();
    container.dispatchEvent(touchPointer('pointermove', 2, 340, 260));
    await nextFrame();

    expect(adapter.session.setNumericZoom).toHaveBeenCalledOnce();
  });

  it('keeps thumbnails behind the PDF Adapter seam', async () => {
    const adapter = new FakePdfAdapter();
    const runtime = new HellPdfRuntime(adapter);
    await runtime.bootstrap(
      document.createElement('div') as HTMLDivElement,
      createRuntimeHandlers(),
    );
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
    await runtime.bootstrap(
      document.createElement('div') as HTMLDivElement,
      createRuntimeHandlers(),
    );
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

  it('repaints thumbnails onto the fresh canvases a reopened overview creates', async () => {
    const adapter = new FakePdfAdapter();
    const runtime = new HellPdfRuntime(adapter);
    await runtime.bootstrap(
      document.createElement('div') as HTMLDivElement,
      createRuntimeHandlers(),
    );
    const doc = fakeDocument(3);
    adapter.loadQueue.push({ promise: Promise.resolve(doc), destroy: vi.fn() });
    await runtime.loadDocument('thumbs.pdf', {
      initialPage: 1,
      initialZoom: 'auto',
      onLoaded: vi.fn(),
    });

    const opened = document.createElement('canvas');
    opened.dataset['page'] = '2';
    await runtime.renderThumbs([opened], () => true);
    await runtime.renderThumbs([opened], () => true);

    expect(adapter.session.renderThumbnail).toHaveBeenCalledOnce();

    // Closing the overview discards the canvases; reopening builds new blank
    // ones for the same page numbers, and those have to be painted again.
    const reopened = document.createElement('canvas');
    reopened.dataset['page'] = '2';
    await runtime.renderThumbs([reopened], () => true);

    expect(adapter.session.renderThumbnail).toHaveBeenCalledTimes(2);
    expect(adapter.session.renderThumbnail).toHaveBeenLastCalledWith(doc, 2, reopened);
  });

  it('destroys the active document during cleanup', async () => {
    const adapter = new FakePdfAdapter();
    const runtime = new HellPdfRuntime(adapter);
    await runtime.bootstrap(
      document.createElement('div') as HTMLDivElement,
      createRuntimeHandlers(),
    );
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

  it('stops global PDF shortcuts when focus moves outside after pointer activity', () => {
    const host = document.createElement('div');
    const inside = document.createElement('button');
    const outside = document.createElement('input');
    host.append(inside);
    document.body.append(host, outside);

    const scope = new HellPdfViewerInteractionScope(() => host);
    const actions = createShortcutActions();
    let handled = true;

    scope.recordPointerTarget(inside);
    outside.focus();
    outside.addEventListener('keydown', (event) => {
      handled = scope.handleGlobalShortcut(event, actions);
    });
    outside.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, cancelable: true }),
    );

    expect(handled).toBe(false);
    expect(actions.openFind).not.toHaveBeenCalled();

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
    expect(
      scope.handleGlobalShortcut(
        new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, altKey: true }),
        actions,
      ),
    ).toBe(false);
    expect(
      scope.handleGlobalShortcut(
        new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, shiftKey: true }),
        actions,
      ),
    ).toBe(false);
    expect(
      scope.handleGlobalShortcut(
        new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, metaKey: true }),
        actions,
      ),
    ).toBe(false);

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

    input.dispatchEvent(
      new foreignWindow.KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }),
    );

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

    const event = new KeyboardEvent('keydown', {
      key: 'PageDown',
      bubbles: true,
      cancelable: true,
    });
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
  refreshPresetZoom = vi.fn();

  setNumericZoom = vi.fn((scale: number, _options?: { readonly drawingDelay?: number }): void => {
    this.currentScale = scale;
  });
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/** jsdom ships no ResizeObserver; install a controllable one for the test. */
function stubResizeObserver() {
  const view = window as unknown as { ResizeObserver?: typeof ResizeObserver };
  const previous = Object.getOwnPropertyDescriptor(view, 'ResizeObserver');
  const instances: { targets: Set<Element>; notify: () => void }[] = [];

  class TestResizeObserver {
    private readonly targets = new Set<Element>();

    constructor(notify: () => void) {
      instances.push({ targets: this.targets, notify });
    }

    observe(target: Element): void {
      this.targets.add(target);
    }

    unobserve(target: Element): void {
      this.targets.delete(target);
    }

    disconnect(): void {
      this.targets.clear();
    }
  }

  view.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;

  return {
    observed: () => instances.flatMap((entry) => [...entry.targets]),
    trigger: () => {
      for (const entry of instances) {
        if (entry.targets.size > 0) entry.notify();
      }
    },
    restore: () => {
      if (previous) Object.defineProperty(view, 'ResizeObserver', previous);
      else delete view.ResizeObserver;
    },
  };
}

function ctrlKey(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, ctrlKey: true });
}

function touchPointer(
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  pointerId: number,
  clientX: number,
  clientY: number,
): PointerEvent {
  return new PointerEvent(type, {
    pointerId,
    pointerType: 'touch',
    clientX,
    clientY,
    bubbles: true,
    cancelable: true,
  });
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
