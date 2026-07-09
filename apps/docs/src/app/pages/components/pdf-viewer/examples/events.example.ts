import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellPdfViewer } from '@hell-ui/angular/features/pdf-viewer';
import { HellButton } from '@hell-ui/angular/button';
import { PDF_WORKER_URL, SAMPLE_PDF_URL, usePdfViewerStyles } from './pdf-viewer-styles';

@Component({
  selector: 'app-pdf-viewer-events-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellPdfViewer, HellButton],
  template: `
    <div class="grid gap-3">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-hell-foreground-muted">
        <span>Page <strong class="text-hell-foreground">{{ page() }}</strong> / {{ totalPages() || '—' }}</span>
        <span>Zoom <strong class="text-hell-foreground">{{ zoom() }}</strong></span>
      </div>

      @if (loadError()) {
        <div
          class="flex items-center justify-between gap-3 rounded-hell-md border border-hell-danger bg-hell-danger-soft px-hell-4 py-hell-3 text-sm text-hell-danger-strong"
          role="alert"
        >
          <span>The document could not be loaded in this viewer.</span>
          <a hellButton size="sm" variant="soft" [href]="src" target="_blank" rel="noreferrer">
            Open in a new tab
          </a>
        </div>
      }

      <hell-pdf-viewer
        class="h-120"
        [src]="src"
        [worker]="worker"
        fileName="tracemonkey.pdf"
        (loaded)="totalPages.set($event.totalPages)"
        (pageChange)="page.set($event)"
        (zoomChange)="zoom.set(formatZoom($event))"
        (error)="loadError.set(true)"
      />
    </div>
  `,
})
export class PdfViewerEventsExample {
  protected readonly src = SAMPLE_PDF_URL;
  protected readonly worker = PDF_WORKER_URL;

  protected readonly page = signal(1);
  protected readonly totalPages = signal(0);
  protected readonly zoom = signal('auto');
  protected readonly loadError = signal(false);

  constructor() {
    usePdfViewerStyles();
  }

  protected formatZoom(value: number | string): string {
    return typeof value === 'number' ? `${Math.round(value * 100)}%` : value;
  }
}
