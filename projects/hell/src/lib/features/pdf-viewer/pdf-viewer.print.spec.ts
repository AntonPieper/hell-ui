import { createHiddenPdfPrintHandle } from './pdf-viewer.print';

describe('PDF print helpers', () => {
  const nativeFetch = globalThis.fetch;
  const nativeCreateObjectUrl = URL.createObjectURL;
  const nativeRevokeObjectUrl = URL.revokeObjectURL;

  afterEach(() => {
    globalThis.fetch = nativeFetch;
    URL.createObjectURL = nativeCreateObjectUrl;
    URL.revokeObjectURL = nativeRevokeObjectUrl;
    document.body.replaceChildren();
  });

  it('forwards caller fetch options when printing URL sources', async () => {
    const fetchOptions: RequestInit = {
      credentials: 'include',
      headers: { Authorization: 'Bearer test' },
    };
    globalThis.fetch = vi.fn(async () =>
      new Response(new Blob(['pdf'], { type: 'application/pdf' }), { status: 200 }),
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

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:hell-print');
    expect(document.body.contains(handle.iframe)).toBe(false);
  });
});
