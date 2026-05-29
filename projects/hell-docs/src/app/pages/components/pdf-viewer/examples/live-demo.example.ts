import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { HellPdfViewer } from '@hell-ui/angular/features/pdf-viewer';

// Copy these stylesheets as app-owned assets, then append them only while the lazy route is active.
const PDF_VIEWER_STYLESHEETS = [
  {
    id: 'hd-hell-pdf-viewer-styles',
    href: 'hell-ui/styles/features/pdf-viewer.css',
  },
  {
    id: 'hd-pdfjs-viewer-styles',
    href: 'pdfjs/pdf_viewer.css',
  },
] as const;

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

    const addedLinks: HTMLLinkElement[] = [];

    for (const stylesheet of PDF_VIEWER_STYLESHEETS) {
      if (document.getElementById(stylesheet.id)) continue;

      const link = document.createElement('link');
      link.id = stylesheet.id;
      link.rel = 'stylesheet';
      link.href = new URL(stylesheet.href, document.baseURI).toString();
      document.head.append(link);
      addedLinks.push(link);
    }

    destroyRef.onDestroy(() => {
      for (const link of addedLinks) link.remove();
    });
  }
}
