import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet, type Routes } from '@angular/router';
import { HellPdfViewer } from '@hell-ui/pdf-viewer';
import { PDF_WORKER_URL, SAMPLE_PDF_URL, usePdfViewerStyles } from './pdf-viewer-styles';

@Component({
  selector: 'app-pdf-viewer-lazy-route-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    <p class="m-0 mb-2 text-sm text-hell-foreground-muted">
      Register <code>PDF_FEATURE_ROUTES</code> in your feature router. The viewer and pdf.js load
      only after navigation, and the route target loads its stylesheets on demand.
    </p>
    <router-outlet />
  `,
})
export class PdfViewerLazyRouteExample {}

// A feature route that pulls in @hell-ui/pdf-viewer and pdfjs-dist only when the
// user navigates to it. Put a route like this in your feature router so the
// heavy PDF stack never lands in your app's initial bundle.
export const PDF_FEATURE_ROUTES: Routes = [
  {
    path: 'invoice',
    loadComponent: () =>
      import('./lazy-route.example').then((m) => m.PdfViewerInvoiceRoute),
  },
];

/** The lazily loaded route target: owns its own stylesheet loading and inputs. */
@Component({
  selector: 'app-pdf-viewer-invoice-route',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPdfViewer],
  template: `<hell-pdf-viewer class="h-96" [src]="src" [worker]="worker" fileName="invoice.pdf" />`,
})
export class PdfViewerInvoiceRoute {
  protected readonly src = SAMPLE_PDF_URL;
  protected readonly worker = PDF_WORKER_URL;

  constructor() {
    usePdfViewerStyles();
  }
}
