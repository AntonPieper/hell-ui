import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HellPdfViewer, type HellPdfViewerUi } from 'hell-ui/features/pdf-viewer';
import { PDF_WORKER_URL, SAMPLE_PDF_URL, usePdfViewerStyles } from './pdf-viewer-styles';

@Component({
  selector: 'app-pdf-viewer-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPdfViewer],
  template: `
    <div class="grid gap-2">
      <p class="m-0 text-sm text-hell-foreground-muted">
        Open the find bar (magnifying glass) and the page overview (columns icon) to see the
        <code>findBar</code>, <code>sidebar</code>, and <code>thumb</code> refinements.
      </p>
      <hell-pdf-viewer class="h-120" [src]="src" [worker]="worker" [ui]="viewerUi" />
    </div>
  `,
})
export class PdfViewerStylingExample {
  protected readonly src = SAMPLE_PDF_URL;
  protected readonly worker = PDF_WORKER_URL;

  // A single [ui] map refines every public part of the viewer's Part Style Map.
  protected readonly viewerUi = {
    root: 'rounded-hell-xl border-hell-primary',
    toolbar: 'bg-hell-primary-soft',
    toolbarGroup: 'gap-hell-2',
    divider: 'bg-hell-primary',
    pageInput: 'border-hell-primary text-hell-primary',
    toolbarText: 'text-hell-primary font-semibold',
    zoomSelect: 'border-hell-primary',
    findBar: 'bg-hell-primary-soft',
    findInput: 'border-hell-primary',
    findCount: 'text-hell-primary font-semibold',
    viewport: 'bg-hell-surface-subtle',
    sidebar: 'bg-hell-primary-soft border-hell-primary',
    thumb: 'rounded-hell-md',
    thumbLabel: 'text-hell-primary font-semibold',
    pageArea: 'px-hell-4',
  } satisfies HellPdfViewerUi;

  constructor() {
    usePdfViewerStyles();
  }
}
