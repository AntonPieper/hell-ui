import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellPdfViewer } from '@hell-ui/angular/features/pdf-viewer';
import { PDF_WORKER_URL, SAMPLE_PDF_URL, usePdfViewerStyles } from './pdf-viewer-styles';

@Component({
  selector: 'app-pdf-viewer-initial-view-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPdfViewer],
  template: `
    <hell-pdf-viewer
      class="h-120"
      [src]="src"
      [worker]="worker"
      [initialPage]="3"
      initialZoom="page-width"
      fileName="tracemonkey.pdf"
    />
  `,
})
export class PdfViewerInitialViewExample {
  protected readonly src = SAMPLE_PDF_URL;
  protected readonly worker = PDF_WORKER_URL;

  constructor() {
    usePdfViewerStyles();
  }
}
