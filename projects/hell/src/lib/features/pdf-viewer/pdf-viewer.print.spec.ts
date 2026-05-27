import { createHiddenPdfPrintHandle, printPdfInHiddenIframe } from './pdf-viewer.print';

describe('PDF print helpers', () => {
  const nativeFetch = globalThis.fetch;
  const nativeCreateObjectUrl = URL.createObjectURL;
  const nativeRevokeObjectUrl = URL.revokeObjectURL;

  afterEach(() => {
    globalThis.fetch = nativeFetch;
    URL.createObjectURL = nativeCreateObjectUrl;
    URL.revokeObjectURL = nativeRevokeObjectUrl;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('fails explicitly when printing without a document context', async () => {
    vi.stubGlobal('document', undefined);

    await expect(createHiddenPdfPrintHandle(new Uint8Array([1, 2, 3]).buffer)).rejects.toThrow(
      'Cannot print PDF without a browser document.',
    );
  });

  it('forwards caller fetch options when printing URL sources', async () => {
    const fetchOptions: RequestInit = {
      credentials: 'include',
      headers: { Authorization: 'Bearer test' },
    };
    globalThis.fetch = vi.fn(async () =>
      createFetchResponse('%PDF', 'application/pdf'),
    );
    URL.createObjectURL = vi.fn(() => 'blob:hell-print');
    URL.revokeObjectURL = vi.fn();

    const handle = await createHiddenPdfPrintHandle('/secure.pdf', document, {
      fetch: fetchOptions,
    });

    expect(globalThis.fetch).toHaveBeenCalledWith('/secure.pdf', fetchOptions);
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(handle.iframe.getAttribute('aria-hidden')).toBe('true');

    handle.cleanup();
    handle.cleanup();

    expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:hell-print');
    expect(document.body.contains(handle.iframe)).toBe(false);
  });

  it('prints fetched non-PDF responses as PDF object URLs', async () => {
    globalThis.fetch = vi.fn(async () =>
      createFetchResponse('not pdf', 'application/octet-stream'),
    );
    URL.createObjectURL = vi.fn(() => 'blob:coerced-pdf');
    URL.revokeObjectURL = vi.fn();

    const handle = await createHiddenPdfPrintHandle(new URL('https://example.test/report'), document);

    expect(globalThis.fetch).toHaveBeenCalledWith('https://example.test/report', undefined);
    const [blob] = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0] as [Blob];
    expect(blob.type).toBe('application/pdf');

    handle.cleanup();
  });

  it('creates printable object URLs directly for in-memory PDFs', async () => {
    globalThis.fetch = vi.fn();
    URL.createObjectURL = vi.fn(() => 'blob:memory-pdf');
    URL.revokeObjectURL = vi.fn();

    const handle = await createHiddenPdfPrintHandle(new Uint8Array([1, 2, 3]).buffer, document);

    expect(globalThis.fetch).not.toHaveBeenCalled();
    const [blob] = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0] as [Blob];
    expect(blob.type).toBe('application/pdf');

    handle.cleanup();
  });

  it('fails fast when printable URL fetches are rejected by the server', async () => {
    globalThis.fetch = vi.fn(async () => new Response('nope', { status: 403, statusText: 'Forbidden' }));

    await expect(createHiddenPdfPrintHandle('/blocked.pdf', document)).rejects.toThrow(
      'Failed to fetch printable PDF: 403 Forbidden',
    );
  });

  it('waits for hidden iframe load before invoking browser print', async () => {
    const iframe = document.createElement('iframe');
    document.body.append(iframe);
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) throw new Error('Expected iframe window.');
    const requestAnimationFrame = vi
      .spyOn(frameWindow, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      });
    const focus = vi.spyOn(frameWindow, 'focus').mockImplementation(() => undefined);
    const print = vi.spyOn(frameWindow, 'print').mockImplementation(() => undefined);

    await printPdfInHiddenIframe({
      iframe,
      loaded: Promise.resolve(),
      cleanup: vi.fn(),
    });

    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledOnce();
    expect(print).toHaveBeenCalledOnce();
  });

  it('reports when a printable iframe has no window', async () => {
    await expect(
      printPdfInHiddenIframe({
        iframe: { contentWindow: null } as HTMLIFrameElement,
        loaded: Promise.resolve(),
        cleanup: vi.fn(),
      }),
    ).rejects.toThrow('Printable PDF iframe window is unavailable.');
  });
});

function createFetchResponse(body: string, contentType: string): Response {
  // Keep the fetch mock independent of the jsdom Blob implementation; older
  // constrained runners expose Blob objects that undici Response cannot stream.
  return new Response(body, { status: 200, headers: { 'content-type': contentType } });
}
