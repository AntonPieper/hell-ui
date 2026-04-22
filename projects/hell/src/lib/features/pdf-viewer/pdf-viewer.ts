import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { HellButton } from '../../primitives/button/button';

/**
 * Lazy-loaded PDF viewer wrapping pdfjs-dist. Renders one page at a time to a
 * canvas. The pdfjs library is dynamically imported the first time a `src` is
 * provided so it can be code-split out of the initial bundle.
 *
 * NOTE: Consumers should lazy-load this feature themselves (e.g. via a
 * route-level `loadComponent`) to keep pdfjs out of the critical path.
 */
@Component({
  selector: 'hell-pdf-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, DecimalPipe],
  host: {
    '[class.hell-pdf]': '!unstyled()',
  },
  template: `
    <div class="hell-pdf-toolbar">
      <button hellButton variant="ghost" size="sm" (click)="prev()" [disabled]="page() <= 1">
        Prev
      </button>
      <span>Page {{ page() }} / {{ totalPages() || '…' }}</span>
      <button
        hellButton
        variant="ghost"
        size="sm"
        (click)="next()"
        [disabled]="page() >= totalPages()"
      >
        Next
      </button>
      <span style="flex:1"></span>
      <button hellButton variant="ghost" size="sm" (click)="zoomOut()">−</button>
      <span>{{ (zoom() * 100) | number: '1.0-0' }}%</span>
      <button hellButton variant="ghost" size="sm" (click)="zoomIn()">+</button>
    </div>
    <div class="hell-pdf-canvas-wrap">
      <canvas #canvas></canvas>
    </div>
  `,
})
export class HellPdfViewer {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly src = input.required<string | URL | ArrayBuffer>();
  readonly initialPage = input<number>(1);
  readonly initialZoom = input<number>(1);

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  protected readonly page = signal(1);
  protected readonly zoom = signal(1);
  protected readonly totalPages = signal(0);

  private doc: any = null;

  constructor() {
    // Initialize from inputs
    effect(() => {
      this.page.set(this.initialPage());
      this.zoom.set(this.initialZoom());
    });

    // Load document when src changes
    effect(async () => {
      const src = this.src();
      if (!src) return;
      const pdfjs: any = await import('pdfjs-dist');
      // Use the worker shipped alongside pdfjs.
      // Consumers should ensure the worker is served from their assets — see docs.
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();
      }
      const task = pdfjs.getDocument(src);
      this.doc = await task.promise;
      this.totalPages.set(this.doc.numPages);
      await this.render();
    });

    // Re-render on page/zoom change
    effect(async () => {
      this.page();
      this.zoom();
      if (this.doc) await this.render();
    });
  }

  protected next() {
    this.page.update((p) => Math.min(p + 1, this.totalPages()));
  }
  protected prev() {
    this.page.update((p) => Math.max(p - 1, 1));
  }
  protected zoomIn() {
    this.zoom.update((z) => Math.min(z + 0.25, 4));
  }
  protected zoomOut() {
    this.zoom.update((z) => Math.max(z - 0.25, 0.25));
  }

  private async render() {
    const page = await this.doc.getPage(this.page());
    const viewport = page.getViewport({ scale: this.zoom() });
    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;
  }
}
