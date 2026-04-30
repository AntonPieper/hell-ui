import {
  HellPdfRuntime,
  HellPdfViewerInteractionScope,
  type HellPdfSource,
} from './pdf-viewer.runtime';
import type {
  HellPdfPrintSession,
  HellPdfRuntimeAdapter,
  HellPdfRuntimeBundle,
} from './pdf-viewer.adapter';

describe('PDF Runtime', () => {
  it('keeps download and print browser work behind the PDF Adapter seam', async () => {
    const printSession: HellPdfPrintSession = {
      cleanup: vi.fn(),
      print: vi.fn().mockResolvedValue(undefined),
    };
    const adapter: HellPdfRuntimeAdapter = {
      createViewer: vi.fn(async () => null as unknown as HellPdfRuntimeBundle),
      getDocument: vi.fn(),
      download: vi.fn(async () => undefined),
      createPrintSession: vi.fn(async () => printSession),
    };
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
    const adapter: HellPdfRuntimeAdapter = {
      createViewer: vi.fn(async () => null as unknown as HellPdfRuntimeBundle),
      getDocument: vi.fn(),
      download: vi.fn(async () => undefined),
      createPrintSession: vi.fn(async () => printSession),
    };
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
    const adapter: HellPdfRuntimeAdapter = {
      createViewer: vi.fn(async () => null as unknown as HellPdfRuntimeBundle),
      getDocument: vi.fn(),
      download: vi.fn(async () => undefined),
      createPrintSession: vi.fn(async () => printSession),
    };
    const runtime = new HellPdfRuntime(adapter);

    await expect(runtime.print('document.pdf')).rejects.toThrow('blocked');

    expect(printSession.cleanup).toHaveBeenCalled();
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
