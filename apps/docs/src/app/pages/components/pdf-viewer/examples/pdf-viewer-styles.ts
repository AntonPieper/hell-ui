import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject } from '@angular/core';

/**
 * The two stylesheets the PDF viewer needs at runtime, both served as
 * app-owned assets by the docs build. `pdf-viewer.css` is the Hell chrome
 * (toolbar, sidebar, page frame); `pdf_viewer.css` is pdf.js's own page
 * layer. Neither ships in the docs shell bundle — they load on demand so the
 * lazy route stays cheap.
 */
const PDF_VIEWER_STYLESHEETS = [
  { id: 'hd-hell-pdf-viewer-styles', href: 'hell-ui/pdf-viewer/styles/styles.css' },
  { id: 'hd-pdfjs-viewer-styles', href: 'pdfjs/pdf_viewer.css' },
] as const;

/**
 * Appends the PDF stylesheets to `<head>` for the lifetime of the calling
 * component and removes any it added on destroy. Call once from a viewer
 * example's constructor injection context.
 */
export function usePdfViewerStyles(): void {
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

/** Sample PDF served by the pdf.js project; safe to load cross-origin in the docs. */
export const SAMPLE_PDF_URL =
  'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

/** Worker copied into the docs assets from `pdfjs-dist` by the docs build. */
export const PDF_WORKER_URL = '/assets/pdf.worker.mjs';
