import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';

const PDF_VIEWER_STYLESHEET_ID = 'hd-pdfjs-viewer-styles';
const PDF_VIEWER_STYLESHEET_PATH = 'pdfjs/pdf_viewer.css';
@Component({
  selector: 'app-pdf-viewer-lazy-loading-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <p class="m-0 text-sm text-hell-foreground-muted">
      Keep PDF.js out of your initial bundle by loading the viewer from a feature route.
    </p>
  `,
})
export class PdfViewerLazyLoadingExample {
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
