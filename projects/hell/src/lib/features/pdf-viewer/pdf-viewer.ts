import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
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
import { provideIcons } from '@ng-icons/core';
import {
  faSolidChevronDown,
  faSolidChevronLeft,
  faSolidChevronRight,
  faSolidChevronUp,
  faSolidDownload,
  faSolidMagnifyingGlass,
  faSolidMinus,
  faSolidPlus,
  faSolidPrint,
  faSolidTableColumns,
  faSolidXmark,
} from '@ng-icons/font-awesome/solid';
import { HellButton } from '../../primitives/button/button';
import { HellIcon } from '../../primitives/icon/icon';
import { HellInput, HellSelect } from '../../primitives/input/input';
import { createHiddenPdfPrintHandle, printPdfInHiddenIframe } from './pdf-viewer.print';
import {
  PDF_ZOOM_OPTIONS,
  PDF_ZOOM_VALUES,
  clampZoomScale,
  getCtrlWheelScaleFactor,
  getZoomOrigin,
  getNextZoomStep,
  getPreviousZoomStep,
  getZoomLabel,
  normalizeZoomEventValue,
  normalizeZoomValue,
} from './pdf-viewer.utils';

const HELL_PDF_VIEWER_ICONS = {
  faSolidChevronDown,
  faSolidChevronLeft,
  faSolidChevronRight,
  faSolidChevronUp,
  faSolidDownload,
  faSolidMagnifyingGlass,
  faSolidMinus,
  faSolidPlus,
  faSolidPrint,
  faSolidTableColumns,
  faSolidXmark,
};

@Component({
  selector: 'hell-pdf-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellIcon, HellInput, HellSelect],
  providers: [provideIcons(HELL_PDF_VIEWER_ICONS)],
  host: {
    '[class.hell-pdf]': '!unstyled()',
    '(keydown)': 'onKey($event)',
    'window:keydown': 'onWindowKey($event)',
    'window:pointerdown': 'onWindowPointerDown($event)',
    tabindex: '0',
  },
  templateUrl: './pdf-viewer.html',
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
  protected readonly zoomValue = signal<string | null>(null);
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
  protected readonly effectiveZoomValue = computed(() =>
    this.zoomValue() ?? normalizeZoomValue(this.initialZoom()),
  );
  protected readonly zoomOptions = PDF_ZOOM_OPTIONS;
  protected readonly showCustomZoom = computed(() => {
    const v = this.effectiveZoomValue();
    return !PDF_ZOOM_VALUES.includes(v as never)
      && !this.zoomOptions.some((o) => o.value === v);
  });
  protected readonly customZoomLabel = computed(() =>
    getZoomLabel(this.effectiveZoomValue()),
  );

  private pdfjs: any = null;
  private viewer: any = null;
  private linkService: any = null;
  private findController: any = null;
  private eventBus: any = null;
  private doc: any = null;
  private containerEventCleanup: (() => void) | null = null;
  private printCleanup: (() => void) | null = null;
  private viewerActive = false;
  private readonly renderedThumbs = new Set<number>();
  private readonly bootstrapped = signal(false);
  private loadToken = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.containerEventCleanup?.();
      this.printCleanup?.();
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
    const pdfjs = await import('pdfjs-dist');
    // pdf_viewer.mjs reads globalThis.pdfjsLib at module evaluation time.
    // Import core first so viewer init cannot race that global assignment.
    (globalThis as typeof globalThis & { pdfjsLib?: typeof pdfjs }).pdfjsLib = pdfjs;
    const viewerMod = await import('pdfjs-dist/web/pdf_viewer.mjs');
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
    this.installContainerInteractions(container);
    eventBus.on('pagechanging', (e: any) => {
      this.page.set(e.pageNumber);
      this.pageChange.emit(e.pageNumber);
    });
    eventBus.on('scalechanging', (e: any) => {
      const n = typeof e.scale === 'number' ? e.scale : 1;
      const value = normalizeZoomEventValue(e.presetValue, n);
      this.zoomValue.set(value);
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

  private installContainerInteractions(container: HTMLDivElement) {
    this.containerEventCleanup?.();

    const onWheel = (event: WheelEvent) => this.onWheelZoom(event);

    container.addEventListener('wheel', onWheel, { passive: false });

    this.containerEventCleanup = () => {
      container.removeEventListener('wheel', onWheel);
    };
  }

  private onWheelZoom(event: WheelEvent) {
    if (!this.viewer || !event.ctrlKey) return;

    const container = this.containerRef().nativeElement;
    const scaleFactor = getCtrlWheelScaleFactor(event);
    if (!Number.isFinite(scaleFactor) || scaleFactor <= 0 || scaleFactor === 1) return;

    event.preventDefault();
    this.setNumericZoom(
      (this.viewer.currentScale ?? 1) * scaleFactor,
      getZoomOrigin(container, event),
    );
  }

  private setNumericZoom(scale: number, origin?: [number, number]) {
    if (!this.viewer) return;

    const container = this.containerRef().nativeElement;
    const currentScale = this.viewer.currentScale ?? 1;
    const targetScale = clampZoomScale(scale);
    if (Math.abs(targetScale - currentScale) < 0.0001) return;

    const localX = origin ? origin[0] - container.offsetLeft : container.clientWidth / 2;
    const localY = origin ? origin[1] - container.offsetTop : container.clientHeight / 2;
    const previousScrollLeft = container.scrollLeft;
    const previousScrollTop = container.scrollTop;
    const zoomRatio = targetScale / currentScale;

    this.viewer.currentScale = targetScale;
    container.scrollLeft = (previousScrollLeft + localX) * zoomRatio - localX;
    container.scrollTop = (previousScrollTop + localY) * zoomRatio - localY;
  }

  private async loadDocument(src: string | URL | ArrayBuffer) {
    // Guard against overlapping loads (e.g. rapid src() changes): only the
    // most recent token gets to commit its document to the viewer.
    const token = ++this.loadToken;
    this.ready.set(false);
    this.zoomValue.set(null);
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
    const next = getNextZoomStep(cur);
    this.setNumericZoom(next);
  }
  protected zoomOut() {
    if (!this.viewer) return;
    const cur = this.viewer.currentScale ?? 1;
    const next = getPreviousZoomStep(cur);
    this.setNumericZoom(next);
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
    this.printCleanup?.();

    try {
      const handle = await createHiddenPdfPrintHandle(this.src());
      this.printCleanup = handle.cleanup;
      await printPdfInHiddenIframe(handle);
      window.setTimeout(handle.cleanup, 30_000);
    } catch (e) {
      this.printCleanup?.();
      this.printCleanup = null;
      this.error.emit(e);
    }
  }

  protected toggleOverview() { this.overviewOpen.update((v) => !v); }

  private async renderAllThumbs() {
    if (!this.doc || !this.overviewOpen()) return;
    const canvases = this.thumbCanvases();
    for (const ref of canvases) {
      if (!this.overviewOpen()) return;
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
    const matchesCount = (e as { matchesCount?: { current?: number; total?: number } }).matchesCount;
    if (matchesCount) {
      this.findCurrent.set(matchesCount.current ?? 0);
      this.findTotal.set(matchesCount.total ?? 0);
    }
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

  protected onWindowPointerDown(e: PointerEvent) {
    this.viewerActive = this.host.nativeElement.contains(e.target as Node | null);
  }

  protected onWindowKey(e: KeyboardEvent) {
    if (!this.shouldHandleGlobalShortcut(e)) return;

    if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault();
      this.openFind();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault();
      this.print();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
      e.preventDefault();
      this.zoomIn();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
      e.preventDefault();
      this.zoomOut();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === '0') {
      e.preventDefault();
      this.onZoomSelect('auto');
    }
  }

  private shouldHandleGlobalShortcut(e: KeyboardEvent) {
    const host = this.host.nativeElement;
    const activeElement = document.activeElement;
    const target = e.target;
    const selection = window.getSelection();

    return this.viewerActive
      || (activeElement instanceof Node && host.contains(activeElement))
      || (target instanceof Node && host.contains(target))
      || !!(
        selection
        && ((selection.anchorNode && host.contains(selection.anchorNode))
          || (selection.focusNode && host.contains(selection.focusNode)))
      );
  }

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
      case '0': this.onZoomSelect('auto'); break;
      default: return;
    }
    e.preventDefault();
  }
}
