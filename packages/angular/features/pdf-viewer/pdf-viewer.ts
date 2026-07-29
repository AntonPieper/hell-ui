import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  InjectionToken,
  NO_ERRORS_SCHEMA,
  afterNextRender,
  afterRenderEffect,
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
import { HellButton } from 'hell-ui/button';
import { HellIcon } from 'hell-ui/icon';
import { HellInput } from 'hell-ui/input';
import { HellNativeSelect } from 'hell-ui/select';
import { HellPageLink, HellPagination } from 'hell-ui/pagination';
import type {
  HellUi,
  HellUiInput,
} from 'hell-ui/core';
import {
  hellPartStyler,
  isElementLike,
  type HellRecipe,
} from 'hell-ui/internal/core';
import { HELL_PDF_VIEWER_LABELS, type HellPdfViewerLabels } from './pdf-viewer-labels';
import {
  HellGlobalKeydownService,
  HellGlobalPointerdownService,
} from 'hell-ui/internal/hotkeys';
import {
  HellPdfRuntime,
  HellPdfViewerInteractionScope,
  type HellPdfRuntimePort,
} from './pdf-viewer.runtime';
import {
  PDF_OVERVIEW_ESTIMATED_ITEM_SIZE,
  PDF_ZOOM_OPTIONS,
  PDF_ZOOM_VALUES,
  getPdfOverviewWindow,
  getZoomLabel,
  isSamePdfOverviewWindow,
  normalizeZoomValue,
} from './pdf-viewer.utils';
import type { HellPdfWorkerSource } from './pdf-viewer.adapter';

/**
 * Factory hook for replacing the browser/pdf.js runtime in tests or app-specific hosts.
 *
 * @experimental Runtime seam for the experimental PDF viewer feature entry point.
 */
export type HellPdfRuntimeFactory = () => HellPdfRuntimePort;

/**
 * Injection token for the PDF viewer runtime factory.
 *
 * @experimental Runtime seam for the experimental PDF viewer feature entry point.
 */
export const HELL_PDF_RUNTIME_FACTORY = new InjectionToken<HellPdfRuntimeFactory>(
  'HELL_PDF_RUNTIME_FACTORY',
);

/** Public parts of the HellPdfViewer module, styleable through its Part Style Map. */
export type HellPdfViewerPart =
  | 'root'
  | 'toolbar'
  | 'toolbarGroup'
  | 'divider'
  | 'pageInput'
  | 'toolbarText'
  | 'zoomSelect'
  | 'findBar'
  | 'findInput'
  | 'findCount'
  | 'viewport'
  | 'sidebar'
  | 'thumb'
  | 'thumbLabel'
  | 'pageArea';

/** Part Style Map accepted by the HellPdfViewer `ui` input. */
export type HellPdfViewerUi = HellUi<HellPdfViewerPart>;

/**
 * Component-owned default classes for the PDF viewer's public parts.
 *
 * This package ships hand-written CSS keyed on `data-slot` (see
 * `pdf-viewer.css`) rather than a scanned Tailwind recipe: `tailwindcss` is an
 * optional peer dependency and nothing scans this file's class strings. Recipe
 * entries stay empty so the co-located stylesheet carries the default visuals,
 * while consumers can still merge their own classes through the `ui` Part Style
 * Map on any public part.
 */
const HELL_PDF_VIEWER_RECIPE = {
  root: '',
  toolbar: '',
  toolbarGroup: '',
  divider: '',
  pageInput: '',
  toolbarText: '',
  zoomSelect: '',
  findBar: '',
  findInput: '',
  findCount: '',
  viewport: '',
  sidebar: '',
  thumb: '',
  thumbLabel: '',
  pageArea: '',
} satisfies HellRecipe<HellPdfViewerPart>;

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

/**
 * Full PDF viewer backed by pdf.js. `src` accepts a URL string, `URL`, or
 * `ArrayBuffer`; loading starts after the viewer runtime bootstraps. Emits
 * page, zoom, loaded, and error events. Pass an app-owned pdf.js `worker`
 * source; Hell does not bundle one in the package tarball. Host keyboard
 * shortcuts support Ctrl/Cmd+F, Ctrl/Cmd+P, +/-/0, PageUp/PageDown, Home, End.
 * Document-level shortcuts are opt-in via `globalShortcuts`. On touch, one
 * finger pans, two fingers pinch-zoom, and a double tap toggles between the
 * fitted zoom preset and a magnified view anchored on the tap.
 *
 * @experimental This feature wraps pdf.js viewer internals and may change as
 * the PDF Runtime seam is hardened.
 */
@Component({
  selector: 'hell-pdf-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellButton,
    HellIcon,
    HellInput,
    HellNativeSelect,
    HellPageLink,
    HellPagination,
  ],
  providers: [provideIcons(HELL_PDF_VIEWER_ICONS)],
  // Sibling-entrypoint directives (pagination, icon, input) are not matched by
  // ng-packagr's per-entrypoint template checker; the docs app full-program
  // build restores real template checking across narrow entry points.
  schemas: [NO_ERRORS_SCHEMA],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '(keydown)': 'onKey($event)',
    tabindex: '0',
  },
  templateUrl: './pdf-viewer.html',
})
export class HellPdfViewer {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellPdfViewerPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellPdfViewerPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_PDF_VIEWER_RECIPE,
  });

  readonly src = input.required<string | URL | ArrayBuffer>();
  readonly initialPage = input(1, { transform: numberAttribute });
  readonly initialZoom = input<number | 'auto' | 'page-actual' | 'page-fit' | 'page-width'>('auto');
  readonly fileName = input<string | null>(null);
  /**
   * Opt into document-level shortcuts while focus/pointer activity is inside this viewer.
   * Host-level shortcuts continue to work without this global listener path.
   */
  readonly globalShortcuts = input(false, { transform: booleanAttribute });
  /** Fetch options used by the print path when printing URL/string sources. */
  readonly printFetchOptions = input<RequestInit | null>(null);
  /** Required pdf.js worker source for the default runtime adapter. */
  readonly worker = input<HellPdfWorkerSource | null>(null);

  readonly pageChange = output<number>();
  readonly zoomChange = output<number | string>();
  readonly loaded = output<{ totalPages: number }>();
  readonly error = output<unknown>();

  private readonly containerRef = viewChild.required<ElementRef<HTMLDivElement>>('container');
  private readonly overviewRef = viewChild<ElementRef<HTMLElement>>('overview');
  private readonly overviewTrackRef = viewChild<ElementRef<HTMLElement>>('overviewTrack');
  private readonly findInputRef = viewChild<ElementRef<HTMLInputElement>>('findInput');
  private readonly thumbCanvases = viewChildren<ElementRef<HTMLCanvasElement>>('thumbCanvas');
  private readonly runtime = (
    inject(HELL_PDF_RUNTIME_FACTORY, { optional: true }) ?? (() => new HellPdfRuntime())
  )();

  protected readonly page = signal(1);
  protected readonly totalPages = signal(0);
  protected readonly zoomValue = signal<string | null>(null);
  protected readonly ready = signal(false);
  protected readonly findOpen = signal(false);
  protected readonly findQuery = signal('');
  protected readonly findStatus = signal<'idle' | 'pending' | 'found' | 'not-found' | 'wrapped'>(
    'idle',
  );
  protected readonly findCurrent = signal(0);
  protected readonly findTotal = signal(0);
  protected readonly overviewOpen = signal(false);

  /** Scroll offset of the rail, relative to the top of its scroll track. */
  private readonly railScrollTop = signal(0);
  /** Visible height of the rail; `0` until it has been measured. */
  private readonly railViewportHeight = signal(0);
  /** Measured height of one page button plus its row gap. */
  private readonly railItemSize = signal(PDF_OVERVIEW_ESTIMATED_ITEM_SIZE);
  /** Page whose button currently holds focus, so scrolling cannot unmount it. */
  private readonly railFocusedPage = signal<number | null>(null);
  /** Bumped by the rail's ResizeObserver to ask for a fresh measurement. */
  private readonly railMeasureGeneration = signal(0);
  /** Distance from the rail's scroll origin to the top of the track. */
  private railTrackOffset = 0;
  /** Page the rail has already scrolled to; see the reveal effect. */
  private revealedPage: number | null = null;

  /**
   * The page buttons the rail mounts right now. A four-hundred-page document
   * used to mount four hundred buttons the moment the overview opened; it now
   * mounts the visible window, the current page, and whatever holds focus.
   */
  protected readonly overviewWindow = computed(
    () =>
      getPdfOverviewWindow({
        totalPages: this.totalPages(),
        scrollTop: this.railScrollTop(),
        viewportHeight: this.railViewportHeight(),
        itemSize: this.railItemSize(),
        pinnedPages: [this.page(), this.railFocusedPage()],
      }),
    { equal: isSamePdfOverviewWindow },
  );
  protected readonly effectiveZoomValue = computed(
    () => this.zoomValue() ?? normalizeZoomValue(this.initialZoom()),
  );
  protected readonly zoomOptions = PDF_ZOOM_OPTIONS;
  protected readonly showCustomZoom = computed(() => {
    const v = this.effectiveZoomValue();
    return !PDF_ZOOM_VALUES.includes(v as never) && !this.zoomOptions.some((o) => o.value === v);
  });
  protected readonly customZoomLabel = computed(() => getZoomLabel(this.effectiveZoomValue()));
  protected readonly labels: HellPdfViewerLabels = inject(HELL_PDF_VIEWER_LABELS);

  private readonly globalKeydown = inject(HellGlobalKeydownService);
  private readonly globalPointerdown = inject(HellGlobalPointerdownService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly bootstrapped = signal(false);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly interactionScope = new HellPdfViewerInteractionScope(
    () => this.host.nativeElement,
  );

  constructor() {
    effect((onCleanup) => {
      if (!this.globalShortcuts()) return;

      const unregisterPointer = this.globalPointerdown.register(
        (event) => this.onGlobalPointerDown(event),
        this.destroyRef,
      );
      const unregisterKey = this.globalKeydown.register(
        (event) => this.onGlobalKey(event),
        this.destroyRef,
      );

      onCleanup(() => {
        unregisterPointer();
        unregisterKey();
      });
    });

    this.destroyRef.onDestroy(() => {
      this.runtime.cleanup();
    });

    afterNextRender(() => {
      void this.bootstrapRuntime();
    });

    // Single source of truth for loading: re-runs whenever `src` changes
    // OR when bootstrap finishes (whichever comes second).
    effect(() => {
      const src = this.src();
      if (!this.bootstrapped() || !src) return;
      void this.loadSource(src);
    });

    // Only the visible window is mounted, so every mounted canvas is one the
    // user can see or is about to: paint them all rather than filtering the
    // rail's own children through an IntersectionObserver a second time.
    effect(() => {
      if (!this.overviewOpen()) return;

      const canvases = this.thumbCanvases();
      if (!this.runtime.hasDocument || canvases.length === 0) return;

      queueMicrotask(() => {
        void this.runtime.renderThumbs(
          canvases.map((canvasRef) => canvasRef.nativeElement),
          () => this.overviewOpen(),
        );
      });
    });

    // The rail measures itself instead of trusting a constant: the page button
    // is sized from the thumbnail box, the label's line height, and spacing
    // tokens, all of which a skin may change.
    effect((onCleanup) => {
      if (!this.overviewOpen()) {
        this.railScrollTop.set(0);
        this.railFocusedPage.set(null);
        // A reopened rail scrolls to the current page again, even when the
        // document never left it.
        this.revealedPage = null;
        return;
      }

      const rail = this.overviewRef()?.nativeElement;
      const ResizeObserverCtor = rail?.ownerDocument.defaultView?.ResizeObserver;
      if (!rail || !ResizeObserverCtor) return;

      const observer = new ResizeObserverCtor(() =>
        this.railMeasureGeneration.update((generation) => generation + 1),
      );
      observer.observe(rail);
      onCleanup(() => observer.disconnect());
    });

    afterRenderEffect(() => {
      if (!this.overviewOpen()) return;
      // Re-runs when the rail opens, when a loaded document changes the track's
      // height, and when the ResizeObserver reports a new box — never merely
      // because some other render happened.
      this.totalPages();
      this.railMeasureGeneration();
      this.measureRail();
    });

    // Follow the document: a rail that mounts a window has to scroll to the
    // current page, because jumping to page 350 no longer leaves its button
    // sitting off-screen in the DOM waiting to be scrolled to.
    afterRenderEffect(() => {
      if (!this.overviewOpen()) return;
      const page = this.page();
      const itemSize = this.railItemSize();
      // Read so the reveal retries once the first measurement lands: a rail that
      // opens on page 350 cannot scroll to it before it knows its own box.
      this.railViewportHeight();

      // Only when the page itself moved. This effect also re-runs on a
      // remeasure, and a window resize must not yank the rail back from
      // wherever the user scrolled it to.
      if (page === this.revealedPage) return;
      if (this.revealPageInRail(page, itemSize)) this.revealedPage = page;
    });
  }

  /**
   * Read the rail's box, the scroll origin of its track, and the height of one
   * mounted page button. Everything the window is derived from comes from here,
   * so a rail that has not rendered yet reports nothing and the window falls
   * back to its unmeasured batch.
   */
  private measureRail(): void {
    const rail = this.overviewRef()?.nativeElement;
    const track = this.overviewTrackRef()?.nativeElement;
    if (!rail || !track) return;

    this.railViewportHeight.set(rail.clientHeight);

    // The rail's border and padding sit between its scroll origin and the top
    // of the track, so item offsets and scroll offsets would otherwise be in
    // different frames. Read straight off the box rather than from the distance
    // between two rects: that difference moves with the scroll position, so a
    // remeasure taken while the rail is scrolled would fold the scroll offset
    // into the answer and snap the window back to the first page.
    this.railTrackOffset = rail.clientTop + readPixels(rail, 'paddingTop');
    this.railScrollTop.set(Math.max(rail.scrollTop - this.railTrackOffset, 0));

    const cell = track.firstElementChild;
    const itemSize = cell instanceof HTMLElement ? cell.offsetHeight : 0;
    if (itemSize > 0) this.railItemSize.set(itemSize);
  }

  /**
   * Scroll the rail the shortest distance that brings a page fully into view.
   * Returns whether the rail was measured enough to place the page at all, so
   * an attempt made before the first measurement is retried rather than spent.
   */
  private revealPageInRail(page: number, itemSize: number): boolean {
    const rail = this.overviewRef()?.nativeElement;
    if (!rail || itemSize <= 0) return false;

    const viewport = rail.clientHeight;
    if (viewport <= 0) return false;

    const top = this.railTrackOffset + (page - 1) * itemSize;
    const bottom = top + itemSize;
    if (top < rail.scrollTop) rail.scrollTop = top;
    else if (bottom > rail.scrollTop + viewport) rail.scrollTop = bottom - viewport;
    return true;
  }

  protected onOverviewScroll(): void {
    const rail = this.overviewRef()?.nativeElement;
    if (!rail) return;
    this.railScrollTop.set(Math.max(rail.scrollTop - this.railTrackOffset, 0));
  }

  protected onOverviewFocusIn(event: FocusEvent): void {
    this.railFocusedPage.set(readOverviewPage(event.target));
  }

  protected onOverviewFocusOut(event: FocusEvent): void {
    // Moving between two buttons inside the rail is not focus leaving it.
    const rail = this.overviewRef()?.nativeElement;
    const next = event.relatedTarget;
    if (rail && next instanceof Node && rail.contains(next)) return;
    this.railFocusedPage.set(null);
  }

  private async bootstrapRuntime(): Promise<void> {
    const worker = this.worker();

    try {
      await this.runtime.bootstrap(
        this.containerRef().nativeElement,
        {
          onPageChange: (page) => {
            this.page.set(page);
            this.pageChange.emit(page);
          },
          onZoomChange: (displayValue, emittedValue) => {
            this.zoomValue.set(displayValue);
            this.zoomChange.emit(emittedValue);
          },
          onPagesReady: () => this.ready.set(true),
          onFindState: (state) => {
            if (state.current != null) this.findCurrent.set(state.current);
            if (state.total != null) this.findTotal.set(state.total);
            if (state.status) this.findStatus.set(state.status);
          },
        },
        worker ? { worker } : undefined,
      );
      this.bootstrapped.set(true);
    } catch (error) {
      this.runtime.cleanup();
      this.error.emit(error);
    }
  }

  private async loadSource(src: string | URL | ArrayBuffer): Promise<void> {
    try {
      this.ready.set(false);
      this.zoomValue.set(null);
      this.totalPages.set(0);
      // A new document's rail has to scroll to its own current page, even when
      // that page number happens to match the one the outgoing document was on.
      this.revealedPage = null;
      await this.runtime.loadDocument(src, {
        initialPage: this.initialPage(),
        initialZoom: this.initialZoom(),
        onLoaded: (totalPages) => {
          this.totalPages.set(totalPages);
          this.loaded.emit({ totalPages });
        },
      });
    } catch (error) {
      this.error.emit(error);
    }
  }

  protected next() {
    this.goTo(this.page() + 1);
  }
  protected prev() {
    this.goTo(this.page() - 1);
  }
  protected goTo(n: number) {
    this.runtime.goTo(n);
  }

  /**
   * Commit a typed page number. The input is bound to `page()`, so an
   * out-of-range entry that clamps to the page the viewer is already on would
   * otherwise leave the typed text sitting in the box: the binding value never
   * changes, so Angular never rewrites the DOM value. Write the resolved page
   * back explicitly instead.
   */
  protected commitPageInput(input: HTMLInputElement) {
    // `type="number"` sanitizes anything unparseable to an empty string, so a
    // blank field is how "not a page number" arrives here. Restore the current
    // page rather than reading `Number('')` as page 0 and navigating away.
    const raw = input.value.trim();
    const parsed = raw === '' ? Number.NaN : Number(raw);
    if (!Number.isFinite(parsed)) {
      input.value = String(this.page());
      return;
    }

    const total = this.totalPages() || 1;
    const target = Math.min(Math.max(Math.trunc(parsed), 1), total);

    this.goTo(target);
    input.value = String(this.page());
  }

  protected zoomIn() {
    this.runtime.zoomIn();
  }
  protected zoomOut() {
    this.runtime.zoomOut();
  }
  protected onZoomSelect(value: string) {
    this.runtime.setZoomValue(value);
  }

  protected async download() {
    try {
      await this.runtime.download(this.src(), this.fileName());
    } catch (e) {
      this.error.emit(e);
    }
  }

  protected async print() {
    try {
      await this.runtime.print(this.src(), undefined, {
        fetch: this.printFetchOptions() ?? undefined,
      });
    } catch (e) {
      this.error.emit(e);
    }
  }

  protected toggleOverview() {
    this.overviewOpen.update((v) => !v);
  }

  protected openFind() {
    this.findOpen.set(true);
    const view = this.host.nativeElement.ownerDocument.defaultView;
    if (!view) return;
    // Wait two frames so Angular's CD has materialized the find input.
    view.requestAnimationFrame(() =>
      view.requestAnimationFrame(() => {
        const input = this.findInputRef()?.nativeElement;
        input?.focus();
        input?.select();
      }),
    );
  }
  protected closeFind() {
    this.findOpen.set(false);
    this.findQuery.set('');
    this.findStatus.set('idle');
    this.findCurrent.set(0);
    this.findTotal.set(0);
    this.runtime.closeFind(this);
    // Return focus to the viewer so subsequent keyboard shortcuts work.
    this.host.nativeElement.ownerDocument.defaultView?.requestAnimationFrame(() =>
      this.host.nativeElement.focus(),
    );
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
  protected findNext() {
    this.dispatchFind('again', false);
  }
  protected findPrev() {
    this.dispatchFind('again', true);
  }

  private dispatchFind(type: 'again' | '', findPrevious = false) {
    this.runtime.dispatchFind({
      source: this,
      type,
      query: this.findQuery(),
      findPrevious,
    });
  }

  private onGlobalPointerDown(e: PointerEvent) {
    this.interactionScope.recordPointerTarget(e.target);
  }

  private onGlobalKey(e: KeyboardEvent) {
    if (!this.globalShortcuts()) return;
    this.interactionScope.handleGlobalShortcut(e, {
      openFind: () => this.openFind(),
      print: () => void this.print(),
      zoomIn: () => this.zoomIn(),
      zoomOut: () => this.zoomOut(),
      resetZoom: () => this.onZoomSelect('auto'),
    });
  }

  protected onKey(e: KeyboardEvent) {
    this.interactionScope.handleViewerKey(e, {
      openFind: () => this.openFind(),
      print: () => void this.print(),
      zoomIn: () => this.zoomIn(),
      zoomOut: () => this.zoomOut(),
      resetZoom: () => this.onZoomSelect('auto'),
      nextPage: () => this.next(),
      previousPage: () => this.prev(),
      firstPage: () => this.goTo(1),
      lastPage: () => this.goTo(this.totalPages()),
    });
  }
}

/** One resolved length off an element's computed style, or `0` if it has none. */
function readPixels(element: HTMLElement, property: 'paddingTop'): number {
  const value = Number.parseFloat(
    element.ownerDocument.defaultView?.getComputedStyle(element)[property] ?? '',
  );
  return Number.isFinite(value) ? value : 0;
}

/** Page number of the rail cell an event target sits in, if any. */
function readOverviewPage(target: EventTarget | null): number | null {
  if (!isElementLike(target)) return null;
  const cell = target.closest('[data-page]');
  const page = Number(cell?.getAttribute('data-page'));
  return Number.isInteger(page) && page >= 1 ? page : null;
}
