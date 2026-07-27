import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ExampleTabs } from '../../../shared/example-tabs';
import { PageHeader } from '../../../shared/page-header';
import { PdfViewerBasicExample } from './examples/basic.example';
import pdfViewerBasicExampleCodeRaw from './examples/basic.example.ts?raw' with {
  loader: 'text',
};
import { PdfViewerInitialViewExample } from './examples/initial-view.example';
import pdfViewerInitialViewExampleCodeRaw from './examples/initial-view.example.ts?raw' with {
  loader: 'text',
};
import { PdfViewerEventsExample } from './examples/events.example';
import pdfViewerEventsExampleCodeRaw from './examples/events.example.ts?raw' with {
  loader: 'text',
};
import { PdfViewerLazyRouteExample } from './examples/lazy-route.example';
import pdfViewerLazyRouteExampleCodeRaw from './examples/lazy-route.example.ts?raw' with {
  loader: 'text',
};
import { PdfViewerDocumentReviewExample } from './examples/document-review.example';
import pdfViewerDocumentReviewExampleCodeRaw from './examples/document-review.example.ts?raw' with {
  loader: 'text',
};
import { PdfViewerStylingExample } from './examples/styling.example';
import pdfViewerStylingExampleCodeRaw from './examples/styling.example.ts?raw' with {
  loader: 'text',
};

@Component({
  selector: 'hd-pdf-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExampleTabs,
    PageHeader,
    PdfViewerBasicExample,
    PdfViewerInitialViewExample,
    PdfViewerEventsExample,
    PdfViewerLazyRouteExample,
    PdfViewerDocumentReviewExample,
    PdfViewerStylingExample,
  ],
  template: `
    <article class="hd-prose">
      <hd-page-header
        title="PDF viewer"
        icon="faSolidFilePdf"
        category="Feature"
        status="Experimental"
        importPath="hell-ui/features/pdf-viewer"
        stylesPath="hell-ui/features/pdf-viewer/styles.css"
      >
        An in-app pdf.js document viewer with paging, zoom, find, thumbnails, download, and print —
        kept behind an optional feature entry point so pdf.js never travels with core imports.
      </hd-page-header>

      <p>
        <code>hell-pdf-viewer</code> is a full viewer component that wraps the
        <a href="https://mozilla.github.io/pdf.js/" target="_blank" rel="noreferrer">pdf.js</a>
        viewer behind Hell's <em>PDF Runtime</em> and <em>PDF Adapter</em> seams. Point
        <code>src</code> at a URL, <code>URL</code>, or <code>ArrayBuffer</code> and it renders a
        toolbar (page navigation, zoom, find, download, print), an optional thumbnail rail, and the
        scrolling page area. Because pdf.js is heavy and browser-only, it lives behind the
        <code>hell-ui/features/pdf-viewer</code> feature entry point and is
        <strong>not SSR-safe</strong> — keep it behind a lazy route.
      </p>
      <p>
        Reach for it when a dense business app needs to preview a document inline — invoices,
        contracts, generated reports — without punting the user to a browser tab.
        <strong>PDF viewer is experimental</strong>: it wraps pdf.js viewer internals and may change
        as the PDF Runtime seam is hardened, so keep it behind a lazy feature route and treat it as
        an app-surface preview recipe, not a stable primitive.
      </p>
      <p>
        Your app owns the pdf.js compatibility decisions. You must pass a pdf.js
        <code>worker</code> source through the <code>worker</code> input; the package does not copy
        a worker into its tarball, so wire one from your app assets or a bundler-emitted worker
        URL. Install the exact supported <code>pdfjs-dist&#64;5.6.205</code> optional peer alongside
        <code>hell-ui</code>, <code>&#64;ng-icons/font-awesome</code>, and — when you
        import Hell's CSS — style-only <code>tailwindcss</code>. Load both <code>hell-ui/features/pdf-viewer/styles.css</code> and pdf.js's
        own <code>pdf_viewer.css</code> for the route, and pdf.js renders the page layer itself.
      </p>

      <h2>Basic</h2>
      <p>
        The smallest realistic viewer: a <code>src</code> URL, an app-owned <code>worker</code>, and
        a height on the host. Everything else — toolbar, keyboard shortcuts, download, print —
        comes for free. Give the host an explicit height; the viewport fills whatever box you give
        it.
      </p>
      <hd-example-tabs [code]="basicCode" flush>
        <app-pdf-viewer-basic-example />
      </hd-example-tabs>

      <h2>Initial view</h2>
      <p>
        <code>initialPage</code> and <code>initialZoom</code> set the view state applied once the
        document's pages are ready. <code>initialZoom</code> takes a numeric scale or one of the
        pdf.js presets <code>'auto'</code>, <code>'page-actual'</code>, <code>'page-fit'</code>, or
        <code>'page-width'</code>. Both are read per document load, so changing <code>src</code>
        re-applies them.
      </p>
      <hd-example-tabs [code]="initialViewCode" flush>
        <app-pdf-viewer-initial-view-example />
      </hd-example-tabs>

      <h2>Events and error handling</h2>
      <p>
        The viewer emits <code>loaded</code> (<code>&#123; totalPages &#125;</code>),
        <code>pageChange</code>, <code>zoomChange</code>, and <code>error</code>. Mirror them into
        your own chrome, and treat <code>error</code> as the signal to offer a fallback — the
        underlying document may be corrupt, blocked by CORS, or simply too large to render in the
        browser.
      </p>
      <hd-example-tabs [code]="eventsCode" flush>
        <app-pdf-viewer-events-example />
      </hd-example-tabs>

      <h2>Lazy loading</h2>
      <p>
        pdf.js and the viewer are large. Load them behind a feature route so they never land in your
        initial bundle, and append the two stylesheets only while that route is active. The route
        target owns its own <code>src</code>/<code>worker</code> inputs and stylesheet lifecycle.
      </p>
      <hd-example-tabs [code]="lazyRouteCode" previewClass="grid gap-2">
        <app-pdf-viewer-lazy-route-example />
      </hd-example-tabs>

      <h2>With Master Detail and Card</h2>
      <p>
        A document-review workflow built from narrow Hell entry points: a
        <code>hellMasterDetail</code> controller coordinates consumer-owned review and document
        panes, while <code>hellCard</code> owns the selected document's visual frame, metadata, and
        approve / request-changes actions. The viewer's <code>root</code> part is refined to drop its
        own border and radius so it sits flush inside the card body. On narrow containers the
        controller exposes one live pane at a time and the consumer-rendered Back action restores
        focus to the selected queue item.
      </p>
      <hd-example-tabs [code]="documentReviewCode" flush>
        <app-pdf-viewer-document-review-example />
      </hd-example-tabs>

      <h2>Touch and small screens</h2>
      <p>
        The viewer arbitrates the four gestures that compete inside a document surface. One finger
        pans, and the browser keeps that gesture so the pan holds its native momentum and rubber
        banding. A second finger is a pinch: the viewer takes the gesture over and zooms around the
        point between the fingers. A double tap magnifies to twice the fitted scale, anchored on the
        tap, and a double tap while zoomed in restores the fitted zoom <em>preset</em> itself — so
        <code>auto</code>, <code>page-fit</code>, and <code>page-width</code> keep re-fitting after a
        rotation instead of freezing at the scale they last produced. A long press still selects
        text in the pdf.js text layer.
      </p>
      <p>
        Double tap is a zoom-to-fit gesture, not a symmetric undo, and it is worth being precise
        about what that means. It measures against the last <em>preset</em> the viewer settled on,
        so it always returns to that fit rather than to whatever zoom you last chose: pick 300% from
        the zoom select and one double tap takes you back to the fit, not to 300%. A document zoomed
        <em>below</em> its fit magnifies to twice the fit rather than returning to it. This matches
        what phone document and photo viewers do; reach for the zoom stepper or the preset select
        when you want an exact level back.
      </p>
      <p>
        The page area declares <code>touch-action: pan-x pan-y</code>, so the browser never
        pinch-zooms or double-tap-zooms the whole page on top of the viewer's own zoom, and
        <code>overscroll-behavior: contain</code> keeps a pan at the end of the document from
        scrolling the page behind it. Toolbar and find-bar controls declare
        <code>touch-action: manipulation</code> so they answer the first tap. On coarse pointers
        every control grows to a finger-sized target, and on phone-sized viewports the page
        overview floats over the document rather than dividing an already narrow viewport — the
        toolbar toggle stays in view, so dismissing it is one tap.
      </p>
      <p>Four caveats worth knowing.</p>
      <ul>
        <li>
          A pinch that starts <em>during</em> an in-flight one-finger pan arrives after the browser
          already owns the gesture, so the zoom applies while the pan is still settling; lift and
          pinch for a clean zoom.
        </li>
        <li>
          Because gesture zoom coalesces through <code>requestAnimationFrame</code>, a pinch does
          not apply while the document is backgrounded or otherwise has rAF throttled. Double tap,
          the toolbar, and the keyboard apply immediately and are unaffected.
        </li>
        <li>
          Taking the two-finger gesture from the browser needs a blocking <code>touchstart</code>
          listener, which means the browser must reach the main thread and back before it may start
          any scroll — including a one-finger pan the viewer does not handle. That handshake is
          cheap only while the main thread is free, and rendering a page is exactly when it is not,
          so scrolling can feel slower to start on a busy document. There is no cheaper way to
          suppress a two-finger pan; <code>touch-action</code> cannot express it.
        </li>
        <li>
          A double tap that lands on a link annotation both follows the link and zooms, because each
          tap is a real click on the pdf.js annotation layer. The pdf.js reference viewer behaves
          the same way. Double-tap on empty page area to zoom without following anything.
        </li>
      </ul>

      <h2>Styling</h2>
      <p>
        <code>HellPdfViewer</code> exposes a multi-part Part Style Map. Pass <code>ui="..."</code> as
        a shorthand string to refine the default <code>root</code> part, or
        <code>[ui]="&#123; ... &#125;"</code> as a <code>HellPdfViewerUi</code> map to refine any
        named part. Refinements merge on top of the module's defaults through Hell's Tailwind merge.
      </p>
      <p>
        Unlike most Hell modules, this entry point ships hand-written CSS keyed on
        <code>data-slot</code> (<code>hell-ui/features/pdf-viewer/styles.css</code>)
        rather than a scanned Tailwind recipe, because <code>tailwindcss</code> is an optional peer
        here — so the co-located stylesheet carries the default visuals while your <code>ui</code>
        classes still merge onto each part.
      </p>
      <table class="hd-doc-table">
        <thead>
          <tr>
            <th>Part</th>
            <th>Styles</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>root</code></td><td>The viewer host — surface, border, radius, focus ring.</td></tr>
          <tr><td><code>toolbar</code></td><td>The top control bar holding the toolbar groups.</td></tr>
          <tr><td><code>toolbarGroup</code></td><td>A cluster of related toolbar controls (overview, pagination, zoom, actions).</td></tr>
          <tr><td><code>divider</code></td><td>The vertical rule separating toolbar groups.</td></tr>
          <tr><td><code>pageInput</code></td><td>The current-page number input in the pagination group.</td></tr>
          <tr><td><code>toolbarText</code></td><td>The <code>/ total</code> page-count text beside the page input.</td></tr>
          <tr><td><code>zoomSelect</code></td><td>The zoom-level <code>&lt;select&gt;</code> in the zoom group.</td></tr>
          <tr><td><code>findBar</code></td><td>The find bar revealed by the find toggle (or Ctrl/Cmd+F).</td></tr>
          <tr><td><code>findInput</code></td><td>The search input inside the find bar.</td></tr>
          <tr><td><code>findCount</code></td><td>The live match-count / status region inside the find bar.</td></tr>
          <tr><td><code>viewport</code></td><td>The area below the toolbar wrapping the sidebar and page area.</td></tr>
          <tr><td><code>sidebar</code></td><td>The thumbnail rail revealed by the page-overview toggle.</td></tr>
          <tr><td><code>thumb</code></td><td>A single page thumbnail button in the sidebar.</td></tr>
          <tr><td><code>thumbLabel</code></td><td>The page-number label under each thumbnail.</td></tr>
          <tr><td><code>pageArea</code></td><td>The scrolling container that hosts the pdf.js page layer.</td></tr>
        </tbody>
      </table>
      <hd-example-tabs [code]="stylingCode" flush>
        <app-pdf-viewer-styling-example />
      </hd-example-tabs>

      <h2>API</h2>
      <ul>
        <li><code>src</code>: <code>string | URL | ArrayBuffer</code> — required. The document source; loading starts once the runtime bootstraps.</li>
        <li><code>worker</code>: <code>HellPdfWorkerSource | null</code> — app-owned pdf.js worker. Accepts a URL string, <code>URL</code>, a pre-created <code>Worker</code>, <code>&#123; workerUrl, workerOptions? &#125;</code>, or <code>&#123; port &#125;</code>. Default <code>null</code>; the default adapter throws if it is missing.</li>
        <li><code>initialPage</code>: <code>number</code> — page shown on load. Default <code>1</code>.</li>
        <li><code>initialZoom</code>: <code>number | 'auto' | 'page-actual' | 'page-fit' | 'page-width'</code>. Default <code>'auto'</code>.</li>
        <li><code>fileName</code>: <code>string | null</code> — suggested name for download and print jobs. Default <code>null</code>.</li>
        <li><code>globalShortcuts</code>: <code>boolean</code> — opt into document-level Ctrl/Cmd+F, Ctrl/Cmd+P, and +/-/0 while the viewer is active. Host shortcuts work regardless. Default <code>false</code>.</li>
        <li><code>printFetchOptions</code>: <code>RequestInit | null</code> — fetch options used by the print path for URL/string sources (e.g. credentials for an authenticated document). Default <code>null</code>.</li>
        <li><code>ui</code>: <code>HellUiInput&lt;HellPdfViewerPart&gt;</code> — a shorthand class string for the <code>root</code> part or a <code>HellPdfViewerUi</code> map from part names to class strings.</li>
      </ul>
      <ul>
        <li><code>pageChange</code>: <code>number</code> — the current page after navigation.</li>
        <li><code>zoomChange</code>: <code>number | string</code> — the active zoom preset or numeric scale.</li>
        <li><code>loaded</code>: <code>&#123; totalPages: number &#125;</code> — emitted after a document loads.</li>
        <li><code>error</code>: <code>unknown</code> — emitted when bootstrap, load, download, or print fails.</li>
      </ul>
      <ul>
        <li>Exported types: <code>HellPdfViewerPart</code>, <code>HellPdfViewerUi</code> (<code>HellUi&lt;HellPdfViewerPart&gt;</code>), <code>HellPdfWorkerSource</code>, <code>HellPdfRuntimeFactory</code>.</li>
        <li>Runtime seam: <code>HELL_PDF_RUNTIME_FACTORY</code> injection token swaps the pdf.js/browser runtime (used by tests or app-specific hosts).</li>
        <li>Labels: <code>provideHellLabels(HELL_PDF_VIEWER_LABELS, overrides)</code> and the <code>HellPdfViewerLabels</code> interface override the built-in accessibility strings for an injector scope.</li>
      </ul>

      <h2>Accessibility</h2>
      <ul>
        <li>Every toolbar and find-bar control is a labeled icon button or input; labels come from the <code>HellPdfViewerLabels</code> Label Contract, so you translate or reword them via <code>HELL_PDF_VIEWER_LABELS</code> rather than forking the component.</li>
        <li>The page-overview and find toggles reflect their open state with <code>aria-pressed</code>; the find match-count region is a <code>role="status"</code> live region (<code>aria-live="polite"</code>) that announces the current/total match count.</li>
        <li>In the thumbnail rail, each thumbnail is a button labeled "Go to page N"; the current page carries <code>aria-current="page"</code>.</li>
        <li>The host is focusable (<code>tabindex="0"</code>). Focused, it handles Ctrl/Cmd+F (find), Ctrl/Cmd+P (print), +/=/-/_/0 (zoom in/out/reset), PageUp/PageDown (previous/next page), and Home/End (first/last page). Shortcuts are skipped while focus is inside an editable field.</li>
        <li>With <code>globalShortcuts</code>, the command shortcuts (Ctrl/Cmd+F, Ctrl/Cmd+P, +/-/0) also fire from document level while pointer or focus activity is scoped to the viewer, and never override keydowns your app already prevented.</li>
        <li>The rendered page layer is pdf.js output; provide a document title and surrounding context in your own page so screen-reader users know what they are viewing.</li>
        <li>Every touch gesture has a control equivalent: the zoom stepper and preset select cover pinch and double tap, so zooming never requires a multi-finger gesture. On coarse pointers the toolbar and find-bar controls grow to a finger-sized target.</li>
        <li>Where the page overview floats over the document, it is a panel rather than a dialog: it takes no focus trap, and Tab continues from the rail into the page behind it. Link annotations under the rail therefore stay focusable while visually covered — close the overview before working through the document by keyboard.</li>
      </ul>

      <h2>Do</h2>
      <ul class="hd-do">
        <li>Lazy-load the viewer route or feature area so pdf.js stays out of the initial bundle.</li>
        <li>Pass <code>worker</code> from an app-owned or bundler-emitted pdf.js worker URL.</li>
        <li>Set <code>fileName</code> so downloads and print jobs are recognizable.</li>
        <li>Handle <code>error</code> and offer a download or open-in-new-tab fallback.</li>
        <li>Give the host an explicit height; refine parts through <code>ui</code>, not private descendants.</li>
        <li>Give the viewer as much width as you can on a phone; the toolbar wraps by control group rather than orphaning single buttons.</li>
      </ul>

      <h2>Don't</h2>
      <ul class="hd-dont">
        <li>Don't bundle the viewer into your initial app shell or render it during SSR.</li>
        <li>Don't assume every PDF supports fast text search or thumbnails.</li>
        <li>Don't enable <code>globalShortcuts</code> without an app-level keyboard policy.</li>
        <li>Don't treat this experimental wrapper as a complete PDF application — it is an inline preview surface.</li>
        <li>Don't override <code>touch-action</code> on the <code>pageArea</code> part; the pan, pinch, and double-tap arbitration is built on the value it declares.</li>
      </ul>
    </article>
  `,
})
export class PdfViewerPage {
  protected readonly basicCode = pdfViewerBasicExampleCodeRaw;
  protected readonly initialViewCode = pdfViewerInitialViewExampleCodeRaw;
  protected readonly eventsCode = pdfViewerEventsExampleCodeRaw;
  protected readonly lazyRouteCode = pdfViewerLazyRouteExampleCodeRaw;
  protected readonly documentReviewCode = pdfViewerDocumentReviewExampleCodeRaw;
  protected readonly stylingCode = pdfViewerStylingExampleCodeRaw;
}
