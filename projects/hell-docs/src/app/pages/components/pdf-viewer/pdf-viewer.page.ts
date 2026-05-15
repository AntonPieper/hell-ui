import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
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
  encapsulation: ViewEncapsulation.None,
  styles: [`@import '@hell-ui/angular/styles/features/pdf-viewer';`],
  imports: [ExampleTabs, PdfViewerLazyLoadingExample, PdfViewerLiveDemoExample],
  template: `
    <article class="hd-prose">
      <h1>PDF viewer</h1>
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
        Install <code>pdfjs-dist</code> plus the light UI stack
        (<code>@angular/forms ng-primitives @angular/cdk @angular/router @floating-ui/dom @ng-icons/core @ng-icons/font-awesome rxjs tailwindcss</code>).
        The docs page loads the pdf.js viewer stylesheet on demand, so lazy routes keep it out of
        the docs app's initial bundle.
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
        <li>
          <code>printFetchOptions</code>: optional <code>RequestInit</code> for authenticated or
          credentialed print fetches when <code>src</code> is a URL.
        </li>
        <li>
          Outputs: <code>pageChange</code>, <code>zoomChange</code>, <code>loaded</code>,
          <code>error</code>
        </li>
      </ul>

      <h2>Do</h2>
      <ul>
        <li>Lazy-load the viewer route or feature area.</li>
        <li>Provide <code>fileName</code> so downloads and print jobs are recognizable.</li>
        <li>Handle <code>error</code> and offer a fallback download.</li>
      </ul>

      <h2>Don't</h2>
      <ul>
        <li>Don't bundle PDF viewer into the initial shell.</li>
        <li>Don't assume every PDF allows fast text search or thumbnails.</li>
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
