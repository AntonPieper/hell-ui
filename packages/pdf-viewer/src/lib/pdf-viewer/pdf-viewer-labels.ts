import type { InjectionToken, Provider } from '@angular/core';
import { hellCreateLabels } from '@hell-ui/angular/core';

/** Built-in accessibility labels owned by the `@hell-ui/pdf-viewer` package. */
export interface HellPdfViewerLabels {
  readonly togglePageOverview: string;
  readonly previousPage: string;
  readonly nextPage: string;
  readonly page: string;
  readonly findInDocument: string;
  readonly download: string;
  readonly print: string;
  readonly zoomOut: string;
  readonly zoomIn: string;
  readonly zoomLevel: string;
  readonly automaticZoom: string;
  readonly actualSize: string;
  readonly pageFit: string;
  readonly pageWidth: string;
  readonly findPlaceholder: string;
  readonly findQuery: string;
  readonly searching: string;
  readonly notFound: string;
  readonly previousMatch: string;
  readonly nextMatch: string;
  readonly closeFindBar: string;
  readonly pageOverview: string;
  readonly goToPage: (page: number) => string;
}

const HELL_PDF_VIEWER_LABELS_CONTRACT = hellCreateLabels<HellPdfViewerLabels>(
  'HELL_PDF_VIEWER_LABELS',
  {
    togglePageOverview: 'Toggle page overview',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    page: 'Page',
    findInDocument: 'Find in document (Ctrl/Cmd+F)',
    download: 'Download',
    print: 'Print',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    zoomLevel: 'Zoom level',
    automaticZoom: 'Automatic',
    actualSize: 'Actual size',
    pageFit: 'Page fit',
    pageWidth: 'Page width',
    findPlaceholder: 'Find in document…',
    findQuery: 'Find query',
    searching: 'Searching…',
    notFound: 'Not found',
    previousMatch: 'Previous match',
    nextMatch: 'Next match',
    closeFindBar: 'Close find bar (Esc)',
    pageOverview: 'Page overview',
    goToPage: (page) => `Go to page ${page}`,
  },
);

/** Injection token resolving to the effective PDF viewer labels. */
export const HELL_PDF_VIEWER_LABELS: InjectionToken<HellPdfViewerLabels> = HELL_PDF_VIEWER_LABELS_CONTRACT.token;

/** Override any subset of the PDF viewer labels for an injector scope. */
export function provideHellPdfViewerLabels(overrides: Partial<HellPdfViewerLabels>): Provider {
  return HELL_PDF_VIEWER_LABELS_CONTRACT.provide(overrides);
}
