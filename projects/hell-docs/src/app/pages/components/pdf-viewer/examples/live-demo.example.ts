import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { HellPdfViewer } from '@hell-ui/angular/features/pdf-viewer';

const PDF_VIEWER_STYLESHEET_ID = 'hd-pdfjs-viewer-styles';
const PDF_VIEWER_STYLESHEET_PATH = 'pdfjs/pdf_viewer.css';
@Component({
  selector: 'app-pdf-viewer-live-demo-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPdfViewer],
  template: `
    <hell-pdf-viewer
      src="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"
      [worker]="worker"
      [initialPage]="1"
      class="h-120"
    ></hell-pdf-viewer>
  `,
})
export class PdfViewerLiveDemoExample {
  protected readonly worker = '/assets/pdf.worker.mjs';

  constructor() {
    const document = inject(DOCUMENT);
    const destroyRef = inject(DestroyRef);

    let addedLink: HTMLLinkElement | null = null;
    const existingLink = document.getElementById(PDF_VIEWER_STYLESHEET_ID);

    if (!existingLink) {
      addedLink = document.createElement('link');
      addedLink.id = PDF_VIEWER_STYLESHEET_ID;
      addedLink.rel = 'stylesheet';
      addedLink.href = new URL(PDF_VIEWER_STYLESHEET_PATH, document.baseURI).toString();
      document.head.append(addedLink);
    }

    destroyRef.onDestroy(() => {
      addedLink?.remove();
    });
  }
}
