import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HellPdfViewer, type HellPdfWorkerSource } from 'hell-ui/features/pdf-viewer';

// PDF/browser feature boundary: the optional pdf.js feature entry compiles
// only with the exact pdf.js peer plus icon peers; the app owns the worker.
@Component({
  selector: 'app-root',
  imports: [HellPdfViewer],
  template: `<hell-pdf-viewer [src]="pdfSrc" [worker]="pdfWorker" />`,
})
class App {
  protected readonly pdfSrc = '/sample.pdf';
  protected readonly pdfWorker: HellPdfWorkerSource = '/assets/pdf.worker.mjs';
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
