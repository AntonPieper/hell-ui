import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellPdfViewer } from '@hell-ui/pdf-viewer';
import { PDF_WORKER_URL, SAMPLE_PDF_URL, usePdfViewerStyles } from './pdf-viewer-styles';

@Component({
  selector: 'app-pdf-viewer-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPdfViewer],
  template: `
    <hell-pdf-viewer class="h-120" [src]="src" [worker]="worker" fileName="tracemonkey.pdf" />
  `,
})
export class PdfViewerBasicExample {
  protected readonly src = SAMPLE_PDF_URL;
  protected readonly worker = PDF_WORKER_URL;

  constructor() {
    usePdfViewerStyles();
  }
}
