import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { PdfViewerLazyLoadingExample } from './examples/lazy-loading.example';
import pdfViewerLazyLoadingExampleCodeRaw from './examples/lazy-loading.example.ts?raw' with {
  loader: 'text',
};
import { PdfViewerLiveDemoExample } from './examples/live-demo.example';
import pdfViewerLiveDemoExampleCodeRaw from './examples/live-demo.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-pdf-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ExampleTabs, PdfViewerLazyLoadingExample, PdfViewerLiveDemoExample, PageHeader],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="PDF viewer"
        icon="faSolidFilePdf"
        category="Feature"
        status="Experimental"
        importPath="@hell-ui/pdf-viewer"
        stylesPath="@hell-ui/pdf-viewer/styles"
      >
        An embedded pdf.js viewer with find, thumbnails, zoom, and printing — a separate package so pdf.js never travels with the core library.
      </hd-page-header>
      <p>
        Wraps
        <a href="https://mozilla.github.io/pdf.js/" target="_blank" rel="noreferrer">PDF.js</a> with
        a thin Angular surface. Supports paging, zoom, and a printable canvas mode. The component is
        heavy &mdash; load it lazily.
      </p>
      <p>
        Browser-only runtime: requires <code>window</code> / <code>document</code>, so this feature is
        not SSR-safe.
      </p>
      <p>
        PDF viewer is experimental: this is an app-surface recipe, not a stable primitive. It wraps pdf.js viewer
        internals for business-app document preview, while your app owns PDF.js/browser compatibility
        decisions (worker wiring, CSP, and browser support variance). Keep it behind a lazy feature
        route, handle <code>error</code>, and offer a download/open-in-new-tab fallback for critical
        workflows.
      </p>
      <p>
        Install <code>@hell-ui/pdf-viewer</code> with the exact supported
        <code>pdfjs-dist@5.6.205</code> peer plus the light <code>@hell-ui/angular</code> stack
        (<code>@angular/forms ng-primitives @angular/cdk @floating-ui/dom @ng-icons/core rxjs</code>),
        <code>@ng-icons/font-awesome</code> for icon-backed controls, and style-only
        <code>tailwindcss</code> when you import Hell's CSS.
        Your app must pass a pdf.js worker source through <code>worker</code>; the PDF package does not copy
        a worker into either package tarball. The docs app copies a matching sample worker from
        <code>node_modules/pdfjs-dist/build/pdf.worker.mjs</code> to <code>/assets/pdf.worker.mjs</code>.
        The docs examples load the PDF package stylesheet and the pdf.js viewer stylesheet on
        demand, so lazy routes keep both out of the docs app's initial bundle and
        component-style budget.
      </p>

      <h2>Lazy loading</h2>
      <hd-example-tabs [code]="pdfViewerLazyLoadingExampleCode" previewClass="grid gap-2">
        <app-pdf-viewer-lazy-loading-example />
      </hd-example-tabs>

      <h2>Live demo</h2>
      <hd-example-tabs [code]="pdfViewerLiveDemoExampleCode" flush>
        <app-pdf-viewer-live-demo-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>src</code>: <code>string | URL | ArrayBuffer</code></li>
        <li><code>initialPage</code> (default <code>1</code>)</li>
        <li><code>initialZoom</code> (default <code>'auto'</code>)</li>
        <li><code>fileName</code>: suggested download filename</li>
        <li><code>worker</code>: app-owned pdf.js worker URL, <code>Worker</code>, or worker config.</li>
        <li>
          <code>globalShortcuts</code>: opt into document-level Ctrl/Cmd+F, Ctrl/Cmd+P, +/-/0
          shortcuts while the viewer is active (default <code>false</code>). Host keyboard
          shortcuts still work without this, and already-prevented app shortcuts win.
        </li>
        <li>
          <code>printFetchOptions</code>: optional <code>RequestInit</code> for authenticated or
          credentialed print fetches when <code>src</code> is a URL.
        </li>
        <li>
          Outputs: <code>pageChange</code>, <code>zoomChange</code>, <code>loaded</code>,
          <code>error</code>
        </li>
      </ul>

      <h2>Global shortcuts and app shortcuts</h2>
      <p>
        <code>globalShortcuts</code> registers document shortcuts only when enabled. Handling is scoped
        to the active viewer and skips keydowns your app already prevented.
      </p>

      <h2>Accessibility</h2>
      <ul>
        <li>Toolbar controls are labeled buttons and inputs (Label Contract); find results announce match counts.</li>
        <li>The document canvas is pdf.js-rendered; provide document titles and surrounding context in your page.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Lazy-load the viewer route or feature area.</li>
        <li>Provide <code>worker</code> from your app assets or bundler-owned pdf.js worker URL.</li>
        <li>Provide <code>fileName</code> so downloads and print jobs are recognizable.</li>
        <li>Handle <code>error</code> and offer a fallback download.</li>
        <li>Enable <code>globalShortcuts</code> only where document shortcuts fit your app policy.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't bundle PDF viewer into the initial shell.</li>
        <li>Don't assume every PDF allows fast text search or thumbnails.</li>
        <li>Don't enable document-level shortcuts globally without an app-level keyboard policy.</li>
        <li>Don't rely on PDF globals to override app-reserved shortcuts.</li>
        <li>Don't treat this experimental wrapper as a complete PDF application; it is a preview
        recipe surface only.</li>
      </ul>
    </article>
  `,
})
export class PdfViewerPage {
  protected readonly pdfViewerLazyLoadingExampleCode = pdfViewerLazyLoadingExampleCodeRaw;
  protected readonly pdfViewerLiveDemoExampleCode = pdfViewerLiveDemoExampleCodeRaw;
}
