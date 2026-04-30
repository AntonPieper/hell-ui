import type { HellPdfSource } from './pdf-viewer.runtime';
import {
  createHiddenPdfPrintHandle,
  printPdfInHiddenIframe,
  type HiddenPdfPrintHandle,
} from './pdf-viewer.print';

/** Browser/pdf.js objects owned together by one runtime bootstrap. */
export interface HellPdfRuntimeBundle {
  readonly pdfjs: any;
  readonly viewer: any;
  readonly linkService: any;
  readonly findController: any;
  readonly eventBus: any;
  destroy(): void;
}

/**
 * Adapter seam around pdf.js, downloads, and printing. Tests and future pdf.js
 * upgrades can replace browser-heavy work without changing `HellPdfRuntime`.
 */
export interface HellPdfRuntimeAdapter {
  createViewer(container: HTMLDivElement): Promise<HellPdfRuntimeBundle>;
  getDocument(bundle: HellPdfRuntimeBundle, source: HellPdfSource): any;
  download(
    source: HellPdfSource,
    fileName?: string | null,
    ownerDocument?: Document,
  ): Promise<void>;
  createPrintSession(source: HellPdfSource, ownerDocument?: Document): Promise<HellPdfPrintSession>;
}

/** Hidden print lifecycle handle; callers must cleanup after print or failure. */
export interface HellPdfPrintSession {
  cleanup(): void;
  print(): Promise<void>;
}

export class HellPdfJsRuntimeAdapter implements HellPdfRuntimeAdapter {
  async createViewer(container: HTMLDivElement): Promise<HellPdfRuntimeBundle> {
    const pdfjs = await import('pdfjs-dist');
    // pdf_viewer.mjs reads globalThis.pdfjsLib at module evaluation time.
    // Import core first so viewer init cannot race that global assignment.
    (globalThis as typeof globalThis & { pdfjsLib?: typeof pdfjs }).pdfjsLib = pdfjs;

    const workerPort = new Worker(new URL('./pdf.worker.ts', import.meta.url), { type: 'module' });
    const pdfWorker = new pdfjs.PDFWorker({ port: workerPort as any });
    const viewerMod = await import('pdfjs-dist/web/pdf_viewer.mjs');
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

    return {
      pdfjs,
      viewer,
      linkService,
      findController,
      eventBus,
      destroy() {
        pdfWorker?.destroy?.();
        workerPort.terminate();
      },
      pdfWorker,
    } as HellPdfRuntimeBundle & { readonly pdfWorker: any };
  }

  getDocument(bundle: HellPdfRuntimeBundle, source: HellPdfSource): any {
    const pdfWorker = (bundle as HellPdfRuntimeBundle & { readonly pdfWorker: any }).pdfWorker;
    return bundle.pdfjs.getDocument(
      typeof source === 'string' || source instanceof URL
        ? { url: source.toString(), worker: pdfWorker }
        : { data: source, worker: pdfWorker },
    );
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
  ): Promise<HellPdfPrintSession> {
    const handle = await createHiddenPdfPrintHandle(source, ownerDocument);
    return new HellPdfIframePrintSession(handle);
  }
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
