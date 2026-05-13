import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { RouterOutlet, type Routes } from '@angular/router';

const PDF_VIEWER_STYLESHEET_ID = 'hd-pdfjs-viewer-styles';
const PDF_VIEWER_STYLESHEET_PATH = 'pdfjs/pdf_viewer.css';

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
      Put the route above in your feature router, then load the pdf.js viewer stylesheet only while the route is active.
    </p>
    <router-outlet />
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
