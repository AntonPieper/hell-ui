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
import { HellInput, HellNativeSelect } from '../../primitives/input/input';
import { HellStyleable } from '../../core/styleable';
import { HellPdfRuntime } from './pdf-viewer.runtime';
import {
  PDF_ZOOM_OPTIONS,
  PDF_ZOOM_VALUES,
  getZoomLabel,
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
  imports: [HellButton, HellIcon, HellInput, HellNativeSelect],
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
export class HellPdfViewer extends HellStyleable {
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

  private readonly runtime = new HellPdfRuntime();
  private printCleanup: (() => void) | null = null;
  private viewerActive = false;
  private readonly bootstrapped = signal(false);

  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => {
      this.printCleanup?.();
      this.runtime.cleanup();
    });

    afterNextRender(async () => {
      try {
        await this.runtime.bootstrap(this.containerRef().nativeElement, {
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
        });
        this.bootstrapped.set(true);
      } catch (e) {
        this.runtime.cleanup();
        this.error.emit(e);
      }
    });

    // Single source of truth for loading: re-runs whenever `src` changes
    // OR when bootstrap finishes (whichever comes second).
    effect(async () => {
      const src = this.src();
      if (!this.bootstrapped() || !src) return;
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
      } catch (e) {
        this.error.emit(e);
      }
    });

    // When overview opens (or pages list changes), render visible thumbs.
    effect(() => {
      if (!this.overviewOpen()) return;
      // Track canvases so this re-runs when they appear.
      const canvases = this.thumbCanvases();
      if (!this.runtime.hasDocument || canvases.length === 0) return;
      queueMicrotask(() => this.renderAllThumbs());
    });
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
    this.printCleanup?.();

    try {
      const session = await this.runtime.createPrintSession(this.src());
      this.printCleanup = () => session.cleanup();
      await session.print();
      window.setTimeout(() => session.cleanup(), 30_000);
    } catch (e) {
      this.printCleanup?.();
      this.printCleanup = null;
      this.error.emit(e);
    }
  }

  protected toggleOverview() {
    this.overviewOpen.update((v) => !v);
  }

  private async renderAllThumbs() {
    await this.runtime.renderThumbs(
      this.thumbCanvases().map((ref) => ref.nativeElement),
      () => this.overviewOpen(),
    );
  }

  protected openFind() {
    this.findOpen.set(true);
    // Wait two frames so Angular's CD has materialized the find input.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
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

    return (
      this.viewerActive ||
      (activeElement instanceof Node && host.contains(activeElement)) ||
      (target instanceof Node && host.contains(target)) ||
      !!(
        selection &&
        ((selection.anchorNode && host.contains(selection.anchorNode)) ||
          (selection.focusNode && host.contains(selection.focusNode)))
      )
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
      case 'PageDown':
        this.next();
        break;
      case 'PageUp':
        this.prev();
        break;
      case 'Home':
        this.goTo(1);
        break;
      case 'End':
        this.goTo(this.totalPages());
        break;
      case '+':
      case '=':
        this.zoomIn();
        break;
      case '-':
      case '_':
        this.zoomOut();
        break;
      case '0':
        this.onZoomSelect('auto');
        break;
      default:
        return;
    }
    e.preventDefault();
  }
}
