import type { HellPdfSource } from './pdf-viewer.runtime';

export interface HellPdfRuntimeBundle {
  readonly pdfjs: any;
  readonly viewer: any;
  readonly linkService: any;
  readonly findController: any;
  readonly eventBus: any;
  destroy(): void;
}

export interface HellPdfRuntimeAdapter {
  createViewer(container: HTMLDivElement): Promise<HellPdfRuntimeBundle>;
  getDocument(bundle: HellPdfRuntimeBundle, source: HellPdfSource): any;
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
}
