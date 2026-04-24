import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { HellPdfViewer } from 'hell';

const PDF_VIEWER_STYLESHEET_ID = 'hd-pdfjs-viewer-styles';
const PDF_VIEWER_STYLESHEET_PATH = 'pdfjs/pdf_viewer.css';

@Component({
  selector: 'hd-pdf-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPdfViewer],
  template: `
    <article class="hd-prose">
      <h1>PDF viewer</h1>
      <p>Wraps <a href="https://mozilla.github.io/pdf.js/" target="_blank" rel="noreferrer">PDF.js</a>
        with a thin Angular surface. Supports paging, zoom, and a printable
        canvas mode. The component is heavy &mdash; load it lazily.</p>
      <p>The docs page loads the pdf.js viewer stylesheet on demand, so lazy routes
        keep it out of the docs app's initial bundle.</p>

      <h2>Lazy loading</h2>
      <pre><code>&#123; path: 'invoice/:id',
  loadComponent: () =&gt; import('hell').then((m) =&gt; m.HellPdfViewer) &#125;</code></pre>

      <h2>Live demo</h2>
      <div class="hd-example hd-example-flush">
        <hell-pdf-viewer
          src="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"
          [initialPage]="1"
          class="h-120"></hell-pdf-viewer>
      </div>

      <h2>API</h2>
      <ul>
        <li><code>src</code>: <code>string | URL | ArrayBuffer</code></li>
        <li><code>initialPage</code> (default <code>1</code>)</li>
        <li><code>initialZoom</code> (default <code>'auto'</code>)</li>
        <li>Outputs: <code>pageChange</code>, <code>zoomChange</code>,
          <code>loaded</code>, <code>error</code></li>
      </ul>
    </article>
  `,
})
export class PdfViewerPage {
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
