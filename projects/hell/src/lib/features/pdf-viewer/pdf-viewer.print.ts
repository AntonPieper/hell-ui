export interface HiddenPdfPrintHandle {
  cleanup: () => void;
  iframe: HTMLIFrameElement;
  loaded: Promise<void>;
}

export interface HellPdfPrintOptions {
  /** Fetch options used only when print must fetch a URL/string source. */
  readonly fetch?: RequestInit;
  /** Runtime-owned hidden iframe cleanup delay after print succeeds. */
  readonly cleanupDelayMs?: number;
}

export async function createHiddenPdfPrintHandle(
  source: string | URL | ArrayBuffer,
  ownerDocument: Document = document,
  options: HellPdfPrintOptions = {},
) {
  const objectUrl = await createPrintableObjectUrl(source, options.fetch);
  const iframe = ownerDocument.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.tabIndex = -1;
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';

  const loaded = new Promise<void>((resolve, reject) => {
    iframe.addEventListener('load', () => resolve(), { once: true });
    iframe.addEventListener('error', () => reject(new Error('Failed to load printable PDF iframe.')), { once: true });
  });

  iframe.src = objectUrl.url;
  ownerDocument.body.append(iframe);

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    iframe.remove();
    objectUrl.cleanup();
  };

  return { cleanup, iframe, loaded } satisfies HiddenPdfPrintHandle;
}

export async function printPdfInHiddenIframe(handle: HiddenPdfPrintHandle) {
  await handle.loaded;

  const frameWindow = handle.iframe.contentWindow;
  if (!frameWindow) {
    throw new Error('Printable PDF iframe window is unavailable.');
  }

  await new Promise<void>((resolve) => frameWindow.requestAnimationFrame(() => resolve()));

  frameWindow.focus();
  frameWindow.print();
}

async function createPrintableObjectUrl(source: string | URL | ArrayBuffer, fetchOptions?: RequestInit) {
  if (source instanceof ArrayBuffer) {
    return createObjectUrl(new Blob([source], { type: 'application/pdf' }));
  }

  const response = await fetch(String(source), fetchOptions);
  if (!response.ok) {
    throw new Error(`Failed to fetch printable PDF: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();
  return createObjectUrl(blob.type === 'application/pdf'
    ? blob
    : new Blob([await blob.arrayBuffer()], { type: 'application/pdf' }));
}

function createObjectUrl(blob: Blob) {
  const url = URL.createObjectURL(blob);
  return {
    url,
    cleanup: () => URL.revokeObjectURL(url),
  };
}