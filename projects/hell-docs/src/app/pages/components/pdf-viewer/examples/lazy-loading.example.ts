import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { RouterOutlet, type Routes } from '@angular/router';

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

export const PDF_VIEWER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@hell-ui/angular/features/pdf-viewer').then((m) => m.HellPdfViewer),
  },
];

@Component({
  selector: 'app-pdf-viewer-lazy-loading-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    <p class="m-0 text-sm text-hell-foreground-muted">
      Put the route above in your feature router, then load the Hell PDF viewer and pdf.js viewer stylesheets only while the route is active.
    </p>
    <router-outlet />
  `,
})
export class PdfViewerLazyLoadingExample {
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
