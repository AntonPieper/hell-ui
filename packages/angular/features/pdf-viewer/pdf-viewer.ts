import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  InjectionToken,
  NO_ERRORS_SCHEMA,
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
import { HellButton } from '@hell-ui/angular/button';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellInput, HellNativeSelect } from '@hell-ui/angular/input';
import { HellPageLink, HellPagination } from '@hell-ui/angular/pagination';
import {
  hellPartStyler,
  type HellRecipe,
  type HellUi,
  type HellUiInput,
} from '@hell-ui/angular/core';
import { HELL_PDF_VIEWER_LABELS, type HellPdfViewerLabels } from './pdf-viewer-labels';
import {
  HellGlobalKeydownService,
  HellGlobalPointerdownService,
} from '@hell-ui/angular/internal/hotkeys';
import {
  HellPdfRuntime,
  HellPdfViewerInteractionScope,
  type HellPdfRuntimePort,
} from './pdf-viewer.runtime';
import {
  PDF_ZOOM_OPTIONS,
  PDF_ZOOM_VALUES,
  getZoomLabel,
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

const HELL_PDF_THUMBNAIL_INITIAL_BATCH = 12;

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
 * Document-level shortcuts are opt-in via `globalShortcuts`.
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
  // build restores real template checking (same pattern as split-view).
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
  protected readonly pageList = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1),
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
  private thumbRenderObserver: IntersectionObserver | null = null;
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
      this.disconnectThumbObserver();
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

    // When overview opens (or pages list changes), render visible thumbs.
    effect(() => {
      if (!this.overviewOpen()) {
        this.disconnectThumbObserver();
        return;
      }

      const canvases = this.thumbCanvases();
      const overview = this.overviewRef()?.nativeElement;
      if (!this.runtime.hasDocument || canvases.length === 0 || !overview) return;

      queueMicrotask(() =>
        this.renderThumbnailCanvases(
          canvases.map((canvasRef) => canvasRef.nativeElement),
          overview,
        ),
      );
    });
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

  private renderThumbnailCanvases(canvases: readonly HTMLCanvasElement[], overview: HTMLElement): void {
    this.disconnectThumbObserver();

    const firstBatch = canvases.slice(0, HELL_PDF_THUMBNAIL_INITIAL_BATCH);
    void this.runtime.renderThumbs(firstBatch, () => this.overviewOpen());

    if (!this.runtime.hasDocument || canvases.length <= firstBatch.length) return;

    const IntersectionObserverCtor = overview.ownerDocument.defaultView?.IntersectionObserver;
    if (!IntersectionObserverCtor) {
      queueMicrotask(() => {
        void this.runtime.renderThumbs(canvases, () => this.overviewOpen());
      });
      return;
    }

    const observer = new IntersectionObserverCtor(
      (entries: IntersectionObserverEntry[]) => {
        if (!this.overviewOpen()) return;

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target as HTMLCanvasElement);

        if (visible.length > 0) {
          void this.runtime.renderThumbs(visible, () => this.overviewOpen());
        }
      },
      {
        root: overview,
        rootMargin: '0px 0px 256px 0px',
        threshold: 0.1,
      },
    );

    this.thumbRenderObserver = observer;
    for (const canvas of canvases) {
      observer.observe(canvas);
    }
  }

  private disconnectThumbObserver(): void {
    this.thumbRenderObserver?.disconnect();
    this.thumbRenderObserver = null;
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
