import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { HellButton } from '../../primitives/button/button';
import { HellIcon } from '../../primitives/icon/icon';

const ZOOM_VALUES = ['auto', 'page-actual', 'page-fit', 'page-width'] as const;
const ZOOM_STEPS = [
  0.25, 0.33, 0.5, 0.67, 0.75, 0.85, 1, 1.15, 1.33, 1.5, 1.75, 2, 2.5, 3, 4,
] as const;

@Component({
  selector: 'hell-pdf-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellIcon],
  host: {
    '[class.hell-pdf]': '!unstyled()',
    tabindex: '0',
  },
  template: `
    <div class="hell-pdf-toolbar">
      <button
        hellButton variant="ghost" size="sm" iconOnly type="button"
        (click)="toggleOverview()" [attr.aria-pressed]="overviewOpen()"
        aria-label="Toggle page overview"
      ><hell-icon name="faSolidTableColumns" /></button>

      <span class="hell-pdf-divider" aria-hidden="true"></span>

      <button
        hellButton variant="ghost" size="sm" iconOnly type="button"
        (click)="prev()" [disabled]="page() <= 1" aria-label="Previous page"
      ><hell-icon name="faSolidChevronLeft" /></button>

      <input
        class="hell-input hell-pdf-page-input"
        type="number" min="1" [max]="totalPages() || 1" [value]="page()"
        (change)="goTo(+$any($event.target).value)"
        aria-label="Page"
      />
      <span class="hell-pdf-toolbar-text">/ {{ totalPages() || '…' }}</span>

      <button
        hellButton variant="ghost" size="sm" iconOnly type="button"
        (click)="next()" [disabled]="page() >= totalPages()" aria-label="Next page"
      ><hell-icon name="faSolidChevronRight" /></button>

      <span class="hell-pdf-spacer"></span>

      <button
        hellButton variant="ghost" size="sm" iconOnly type="button"
        (click)="openFind()" [attr.aria-pressed]="findOpen()" aria-label="Find in document (Ctrl/Cmd+F)"
      ><hell-icon name="faSolidMagnifyingGlass" /></button>

      <button
        hellButton variant="ghost" size="sm" iconOnly type="button"
        (click)="download()" [disabled]="!ready()" aria-label="Download"
      ><hell-icon name="faSolidDownload" /></button>

      <button
        hellButton variant="ghost" size="sm" iconOnly type="button"
        (click)="print()" [disabled]="!ready()" aria-label="Print"
      ><hell-icon name="faSolidPrint" /></button>

      <span class="hell-pdf-divider" aria-hidden="true"></span>

      <button
        hellButton variant="ghost" size="sm" iconOnly type="button"
        (click)="zoomOut()" aria-label="Zoom out"
      ><hell-icon name="faSolidMinus" /></button>

      <select
        class="hell-pdf-zoom-select"
        [value]="zoomDisplay()"
        (change)="onZoomSelect($any($event.target).value)"
        aria-label="Zoom level"
      >
        <option value="auto">Automatic</option>
        <option value="page-actual">Actual size</option>
        <option value="page-fit">Page fit</option>
        <option value="page-width">Page width</option>
        @for (z of zoomOptions; track z.value) {
          <option [value]="z.value">{{ z.label }}</option>
        }
        @if (showCustomZoom()) {
          <option [value]="zoomDisplay()">{{ zoomDisplay() }}</option>
        }
      </select>

      <button
        hellButton variant="ghost" size="sm" iconOnly type="button"
        (click)="zoomIn()" aria-label="Zoom in"
      ><hell-icon name="faSolidPlus" /></button>
    </div>

    @if (findOpen()) {
      <div class="hell-pdf-findbar">
        <input
          #findInput
          class="hell-input hell-pdf-find-input"
          type="search"
          placeholder="Find in document…"
          [value]="findQuery()"
          (input)="onFindInput($any($event.target).value)"
          (keydown.enter)="findAgain($event)"
          (keydown.escape)="onFindEscape($event)"
          aria-label="Find query"
        />
        <span class="hell-pdf-find-count">
          @if (findStatus() === 'pending') { Searching… }
          @else if (findStatus() === 'not-found' && findQuery()) { Not found }
          @else if (findTotal() > 0) { {{ findCurrent() }} / {{ findTotal() }} }
          @else { &nbsp; }
        </span>
        <button
          hellButton variant="ghost" size="sm" iconOnly type="button"
          (click)="findPrev()" [disabled]="!findTotal()" aria-label="Previous match"
        ><hell-icon name="faSolidChevronUp" /></button>
        <button
          hellButton variant="ghost" size="sm" iconOnly type="button"
          (click)="findNext()" [disabled]="!findTotal()" aria-label="Next match"
        ><hell-icon name="faSolidChevronDown" /></button>
        <button
          hellButton variant="ghost" size="sm" iconOnly type="button"
          (click)="closeFind()" aria-label="Close find bar (Esc)"
        ><hell-icon name="faSolidXmark" /></button>
      </div>
    }

    <!--
      pdf.js's PDFViewer requires the container element it scrolls in to be
      absolutely positioned. We achieve that with a relative wrapper plus an
      absolutely-positioned inner #container which becomes the actual
      PDFViewer scroll container. The optional thumbnail rail sits beside it.
    -->
    <div class="hell-pdf-host">
      @if (overviewOpen()) {
        <aside class="hell-pdf-overview" aria-label="Page overview">
          @for (n of pageList(); track n) {
            <button
              type="button"
              class="hell-pdf-thumb"
              [attr.data-active]="page() === n ? 'true' : null"
              (click)="goTo(n)"
              [attr.aria-label]="'Go to page ' + n"
              [attr.aria-current]="page() === n ? 'page' : null"
            >
              <span class="hell-pdf-thumb-canvas-wrap">
                <canvas
                  #thumbCanvas
                  [attr.data-page]="n"
                  width="120" height="160"
                ></canvas>
              </span>
              <span class="hell-pdf-thumb-label">{{ n }}</span>
            </button>
          }
        </aside>
      }
      <div #container class="hell-pdf-scroll pdfViewerContainer">
        <div class="pdfViewer"></div>
      </div>
    </div>
  `,
})
export class HellPdfViewer {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly src = input.required<string | URL | ArrayBuffer>();
  readonly initialPage = input(1, { transform: numberAttribute });
  readonly initialZoom = input<number | 'auto' | 'page-actual' | 'page-fit' | 'page-width'>('auto');
  readonly fileName = input<string | null>(null);

  readonly pageChange = output<number>();
  readonly zoomChange = output<number | string>();
  readonly loaded = output<{ totalPages: number }>();
  readonly error = output<unknown>();

  private readonly containerRef = viewChild.required<ElementRef<HTMLDivElement>>('container');
  private readonly findInputRef = viewChild<ElementRef<HTMLInputElement>>('findInput');
  private readonly thumbCanvases = viewChildren<ElementRef<HTMLCanvasElement>>('thumbCanvas');

  protected readonly page = signal(1);
  protected readonly totalPages = signal(0);
  protected readonly zoomDisplay = signal<string>('auto');
  protected readonly ready = signal(false);
  protected readonly findOpen = signal(false);
  protected readonly findQuery = signal('');
  protected readonly findStatus = signal<'idle' | 'pending' | 'found' | 'not-found' | 'wrapped'>('idle');
  protected readonly findCurrent = signal(0);
  protected readonly findTotal = signal(0);
  protected readonly overviewOpen = signal(false);
  protected readonly pageList = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
  );
  protected readonly zoomOptions = [
    { value: '0.5', label: '50%' },
    { value: '0.75', label: '75%' },
    { value: '1', label: '100%' },
    { value: '1.25', label: '125%' },
    { value: '1.5', label: '150%' },
    { value: '2', label: '200%' },
    { value: '3', label: '300%' },
  ];
  protected readonly showCustomZoom = computed(() => {
    const v = this.zoomDisplay();
    return !ZOOM_VALUES.includes(v as never)
      && !this.zoomOptions.some((o) => o.value === v);
  });

  private pdfjs: any = null;
  private viewer: any = null;
  private linkService: any = null;
  private findController: any = null;
  private eventBus: any = null;
  private doc: any = null;
  private readonly renderedThumbs = new Set<number>();
  private readonly bootstrapped = signal(false);
  private loadToken = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.viewer?.cleanup?.();
      this.doc?.destroy?.();
    });

    afterNextRender(async () => {
      try {
        await this.bootstrap();
        this.bootstrapped.set(true);
      } catch (e) {
        this.error.emit(e);
      }
    });

    // Single source of truth for loading: re-runs whenever `src` changes
    // OR when bootstrap finishes (whichever comes second).
    effect(async () => {
      const src = this.src();
      if (!this.bootstrapped() || !src) return;
      try {
        await this.loadDocument(src);
      } catch (e) {
        this.error.emit(e);
      }
    });

    // When overview opens (or pages list changes), render visible thumbs.
    effect(() => {
      if (!this.overviewOpen()) return;
      // Track canvases so this re-runs when they appear.
      const canvases = this.thumbCanvases();
      if (!this.doc || canvases.length === 0) return;
      queueMicrotask(() => this.renderAllThumbs());
    });
  }

  private async bootstrap() {
    const [pdfjs, viewerMod] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/web/pdf_viewer.mjs'),
    ]);
    this.pdfjs = pdfjs;
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();
    }
    const container = this.containerRef().nativeElement;
    const eventBus = new viewerMod.EventBus();
    const linkService = new viewerMod.PDFLinkService({ eventBus });
    const findController = new viewerMod.PDFFindController({ eventBus, linkService });
    const pdfViewer = new viewerMod.PDFViewer({
      container,
      eventBus,
      linkService,
      findController,
      textLayerMode: 2,
      annotationMode: 2,
      annotationEditorMode: -1,
    });
    linkService.setViewer(pdfViewer);

    eventBus.on('pagechanging', (e: any) => {
      this.page.set(e.pageNumber);
      this.pageChange.emit(e.pageNumber);
    });
    eventBus.on('scalechanging', (e: any) => {
      const n = typeof e.scale === 'number' ? e.scale : 1;
      const display = e.presetValue ?? `${Math.round(n * 100)}%`;
      this.zoomDisplay.set(String(display));
      this.zoomChange.emit(e.presetValue ?? n);
    });
    eventBus.on('pagesinit', () => {
      const init = this.initialZoom();
      pdfViewer.currentScaleValue = String(init);
      const p = this.initialPage();
      if (p > 1) pdfViewer.currentPageNumber = p;
      this.ready.set(true);
    });
    eventBus.on('updatefindcontrolstate', (e: any) => this.applyFindState(e));
    eventBus.on('updatefindmatchescount', (e: any) => {
      this.findCurrent.set(e.matchesCount?.current ?? 0);
      this.findTotal.set(e.matchesCount?.total ?? 0);
    });

    this.viewer = pdfViewer;
    this.linkService = linkService;
    this.findController = findController;
    this.eventBus = eventBus;
  }

  private async loadDocument(src: string | URL | ArrayBuffer) {
    // Guard against overlapping loads (e.g. rapid src() changes): only the
    // most recent token gets to commit its document to the viewer.
    const token = ++this.loadToken;
    this.ready.set(false);
    this.viewer.setDocument(null);
    this.linkService.setDocument(null);
    this.findController.setDocument(null);
    if (this.doc) {
      try { this.doc.destroy(); } catch { /* ignore */ }
      this.doc = null;
    }
    this.renderedThumbs.clear();
    const loadingTask = this.pdfjs.getDocument(src);
    const doc = await loadingTask.promise;
    if (token !== this.loadToken) {
      try { doc.destroy(); } catch { /* ignore */ }
      return;
    }
    this.doc = doc;
    this.totalPages.set(doc.numPages);
    this.loaded.emit({ totalPages: doc.numPages });
    this.viewer.setDocument(doc);
    this.linkService.setDocument(doc, null);
    this.findController.setDocument(doc);
  }

  protected next() { this.goTo(this.page() + 1); }
  protected prev() { this.goTo(this.page() - 1); }
  protected goTo(n: number) {
    if (!this.viewer) return;
    const target = Math.min(Math.max(n, 1), this.totalPages());
    this.viewer.currentPageNumber = target;
  }

  protected zoomIn() {
    if (!this.viewer) return;
    const cur = this.viewer.currentScale ?? 1;
    const next = ZOOM_STEPS.find((s) => s > cur + 0.001) ?? cur;
    this.viewer.currentScaleValue = String(next);
  }
  protected zoomOut() {
    if (!this.viewer) return;
    const cur = this.viewer.currentScale ?? 1;
    const next = [...ZOOM_STEPS].reverse().find((s) => s < cur - 0.001) ?? cur;
    this.viewer.currentScaleValue = String(next);
  }
  protected onZoomSelect(value: string) {
    if (!this.viewer) return;
    this.viewer.currentScaleValue = value;
  }

  protected async download() {
    const src = this.src();
    let url: string;
    let suggestedName: string;
    let revoke = false;
    if (typeof src === 'string') {
      url = src;
      suggestedName = this.fileName() ?? src.split('/').pop()?.split('?')[0] ?? 'document.pdf';
    } else if (src instanceof URL) {
      url = src.toString();
      suggestedName = this.fileName() ?? src.pathname.split('/').pop() ?? 'document.pdf';
    } else {
      const blob = new Blob([src as ArrayBuffer], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);
      suggestedName = this.fileName() ?? 'document.pdf';
      revoke = true;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName;
    a.rel = 'noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (revoke) setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  protected async print() {
    const src = this.src();
    let url: string;
    let revoke = false;
    if (typeof src === 'string') {
      url = src;
    } else if (src instanceof URL) {
      url = src.toString();
    } else {
      const blob = new Blob([src as ArrayBuffer], { type: 'application/pdf' });
      url = URL.createObjectURL(blob);
      revoke = true;
    }
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = url;
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        this.error.emit(e);
      }
    };
    document.body.appendChild(iframe);
    setTimeout(() => {
      iframe.remove();
      if (revoke) URL.revokeObjectURL(url);
    }, 60_000);
  }

  protected toggleOverview() { this.overviewOpen.update((v) => !v); }

  private async renderAllThumbs() {
    if (!this.doc) return;
    const canvases = this.thumbCanvases();
    for (const ref of canvases) {
      const canvas = ref.nativeElement;
      const n = Number(canvas.dataset['page']);
      if (!Number.isFinite(n) || this.renderedThumbs.has(n)) continue;
      this.renderedThumbs.add(n);
      try {
        const page = await this.doc.getPage(n);
        const baseViewport = page.getViewport({ scale: 1 });
        const targetW = 120;
        const scale = targetW / baseViewport.width;
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * dpr });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
        canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch {
        this.renderedThumbs.delete(n);
      }
    }
  }

  protected openFind() {
    this.findOpen.set(true);
    // Wait two frames so Angular's CD has materialized the find input.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const input = this.findInputRef()?.nativeElement;
      input?.focus();
      input?.select();
    }));
  }
  protected closeFind() {
    this.findOpen.set(false);
    this.findQuery.set('');
    this.findStatus.set('idle');
    this.findCurrent.set(0);
    this.findTotal.set(0);
    this.eventBus?.dispatch('findbarclose', { source: this });
    // Return focus to the viewer so subsequent keyboard shortcuts work.
    requestAnimationFrame(() => this.host.nativeElement.focus());
  }
  protected onFindEscape(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.closeFind();
  }
  protected onFindInput(value: string) {
    this.findQuery.set(value);
    this.dispatchFind('');
  }
  protected findAgain(e: Event) {
    e.preventDefault();
    this.dispatchFind('again');
  }
  protected findNext() { this.dispatchFind('again', false); }
  protected findPrev() { this.dispatchFind('again', true); }

  private dispatchFind(type: 'again' | '', findPrevious = false) {
    this.eventBus?.dispatch('find', {
      source: this,
      type,
      query: this.findQuery(),
      caseSensitive: false,
      entireWord: false,
      highlightAll: true,
      findPrevious,
      matchDiacritics: false,
    });
  }

  private applyFindState(e: { state: number }) {
    const FindState = (this.findController?.constructor as any)?.FindState
      ?? { FOUND: 0, NOT_FOUND: 1, WRAPPED: 2, PENDING: 3 };
    switch (e.state) {
      case FindState.FOUND: this.findStatus.set('found'); break;
      case FindState.NOT_FOUND: this.findStatus.set('not-found'); break;
      case FindState.WRAPPED: this.findStatus.set('wrapped'); break;
      case FindState.PENDING: this.findStatus.set('pending'); break;
    }
  }

  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  @HostListener('keydown', ['$event'])
  protected onKey(e: KeyboardEvent) {
    // Ctrl/Cmd+F always opens & focuses the find bar — never closes it.
    if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault();
      this.openFind();
      return;
    }
    const target = e.target as HTMLElement;
    const inField = target?.matches?.('input,textarea,select');
    if (inField) return;
    switch (e.key) {
      case 'PageDown': this.next(); break;
      case 'PageUp': this.prev(); break;
      case 'Home': this.goTo(1); break;
      case 'End': this.goTo(this.totalPages()); break;
      case '+': case '=': this.zoomIn(); break;
      case '-': case '_': this.zoomOut(); break;
      case '0': this.onZoomSelect('page-width'); break;
      default: return;
    }
    e.preventDefault();
  }
}
