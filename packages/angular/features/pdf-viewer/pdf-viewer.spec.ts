import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_PDF_RUNTIME_FACTORY, HellPdfViewer, type HellPdfViewerUi } from './pdf-viewer';
import type {
  HellPdfFindRequest,
  HellPdfLoadOptions,
  HellPdfRuntimeHandlers,
  HellPdfRuntimePort,
  HellPdfSource,
} from './pdf-viewer.runtime';
import {
  PDF_OVERVIEW_ESTIMATED_ITEM_SIZE,
  PDF_OVERVIEW_UNMEASURED_PAGES,
} from './pdf-viewer.utils';
import { sortClasses } from '../../spec-helpers';

class FakePdfRuntime implements HellPdfRuntimePort {
  hasDocument = false;
  currentScale = 1;
  pageCount = 3;
  bootstrappedWith: HTMLDivElement | null = null;
  bootstrapOptions: { readonly worker?: unknown } | undefined;
  loadedSource: HellPdfSource | null = null;
  printedWith: RequestInit | undefined;
  cleanedUp = false;
  private handlers: HellPdfRuntimeHandlers | null = null;

  async bootstrap(
    container: HTMLDivElement,
    handlers: HellPdfRuntimeHandlers,
    options?: { readonly worker?: unknown },
  ): Promise<void> {
    this.bootstrappedWith = container;
    this.bootstrapOptions = options;
    this.handlers = handlers;
    handlers.onPagesReady();
  }

  async loadDocument(src: HellPdfSource, options: HellPdfLoadOptions): Promise<void> {
    this.loadedSource = src;
    options.onLoaded(this.pageCount);
    this.handlers?.onPagesReady();
  }

  cleanup(): void {
    this.cleanedUp = true;
  }

  goTo(page: number): void {
    this.handlers?.onPageChange(page);
  }
  zoomIn(): void {}
  zoomOut(): void {}
  setZoomValue(): void {}
  dispatchFind(_request: HellPdfFindRequest): void {}
  closeFind(): void {}
  async download(): Promise<void> {}
  async print(
    _source: HellPdfSource,
    _ownerDocument?: Document,
    options?: { fetch?: RequestInit } | number,
  ): Promise<void> {
    this.printedWith = typeof options === 'object' ? options.fetch : undefined;
  }
  private readonly renderedThumbs = new Set<number>();

  async renderThumbs(canvases: readonly HTMLCanvasElement[]): Promise<void> {
    for (const canvas of canvases) this.renderedThumbs.add(Number(canvas.dataset['page']));
  }

  renderedThumbPages(): readonly number[] {
    return [...this.renderedThumbs];
  }
}

@Component({
  imports: [HellPdfViewer],
  template: `
    <hell-pdf-viewer
      [src]="src"
      [globalShortcuts]="globalShortcuts"
      [printFetchOptions]="printFetchOptions"
      [worker]="worker"
      [ui]="ui"
    />
  `,
})
class PdfViewerHost {
  src: HellPdfSource = 'document.pdf';
  globalShortcuts = false;
  printFetchOptions: RequestInit | null = null;
  worker: string | null = null;
  ui: HellPdfViewerUi | string | undefined = undefined;
}

describe('HellPdfViewer', () => {
  let runtime: FakePdfRuntime;

  beforeEach(async () => {
    runtime = new FakePdfRuntime();
    await TestBed.configureTestingModule({
      imports: [PdfViewerHost],
      providers: [{ provide: HELL_PDF_RUNTIME_FACTORY, useValue: () => runtime }],
    }).compileComponents();
  });

  it('uses the injected PDF Runtime seam and cleans it up', async () => {
    const fixture = TestBed.createComponent(PdfViewerHost);

    await settle(fixture);

    expect(runtime.bootstrappedWith).toBeInstanceOf(HTMLDivElement);
    expect(runtime.loadedSource).toBe('document.pdf');

    fixture.destroy();

    expect(runtime.cleanedUp).toBe(true);
  });

  it('keeps document-level shortcuts opt-in while host shortcuts keep working', async () => {
    const fixture = TestBed.createComponent(PdfViewerHost);
    await settle(fixture);

    const viewer = fixture.nativeElement.querySelector('hell-pdf-viewer') as HTMLElement;
    const findInput = () =>
      fixture.nativeElement.querySelector('[data-slot="findInput"]') as HTMLInputElement | null;

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, cancelable: true }),
    );
    await settle(fixture);
    expect(findInput()).toBeNull();

    viewer.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, cancelable: true }),
    );
    await settle(fixture);
    expect(findInput()).toBeInstanceOf(HTMLInputElement);
  });

  it('supports opt-in document-level shortcuts after viewer interaction', async () => {
    const fixture = TestBed.createComponent(PdfViewerHost);
    fixture.componentInstance.globalShortcuts = true;
    await settle(fixture);

    const viewer = fixture.nativeElement.querySelector('hell-pdf-viewer') as HTMLElement;
    viewer.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, cancelable: true }),
    );
    await settle(fixture);

    expect(fixture.nativeElement.querySelector('[data-slot="findInput"]')).toBeInstanceOf(
      HTMLInputElement,
    );
  });

  it('passes the worker input from the Angular surface to runtime bootstrap', async () => {
    const fixture = TestBed.createComponent(PdfViewerHost);
    fixture.componentInstance.worker = '/assets/pdf.worker.mjs';

    await settle(fixture);

    expect(runtime.bootstrapOptions).toEqual({ worker: '/assets/pdf.worker.mjs' });
  });

  it('passes print fetch options from the Angular surface to the runtime', async () => {
    const fixture = TestBed.createComponent(PdfViewerHost);
    fixture.componentInstance.printFetchOptions = {
      credentials: 'include',
      headers: { Authorization: 'Bearer test' },
    };

    await settle(fixture);

    const button = fixture.nativeElement.querySelector(
      'button[aria-label="Print"]',
    ) as HTMLButtonElement;
    button.click();
    await settle(fixture);

    expect(runtime.printedWith).toEqual(fixture.componentInstance.printFetchOptions);
  });

  it('drives page navigation through the Hell pagination primitives', async () => {
    const fixture = TestBed.createComponent(PdfViewerHost);
    await settle(fixture);

    const root = fixture.nativeElement as HTMLElement;
    const nav = root.querySelector<HTMLElement>('nav[hellPagination]');
    if (!nav) throw new Error('Expected the toolbar pagination nav.');

    const prev = nav.querySelector<HTMLButtonElement>('button[hellPageLink="previous"]');
    const next = nav.querySelector<HTMLButtonElement>('button[hellPageLink="next"]');
    const pageInput = nav.querySelector<HTMLInputElement>('[data-slot="pageInput"]');
    if (!prev || !next || !pageInput) throw new Error('Expected pagination controls.');

    expect(pageInput.value).toBe('1');
    expect(prev.disabled).toBe(true);

    next.click();
    await settle(fixture);

    expect(pageInput.value).toBe('2');
    expect(prev.disabled).toBe(false);
  });

  it('snaps a typed page number back to the page the viewer navigated to', async () => {
    const fixture = TestBed.createComponent(PdfViewerHost);
    await settle(fixture);

    const root = fixture.nativeElement as HTMLElement;
    const pageInput = root.querySelector<HTMLInputElement>('[data-slot="pageInput"]');
    if (!pageInput) throw new Error('Expected the toolbar page input.');

    const commit = async (value: string) => {
      pageInput.value = value;
      pageInput.dispatchEvent(new Event('change', { bubbles: true }));
      await settle(fixture);
    };

    // The fake document has 3 pages; out-of-range entries clamp, and the input
    // must not keep showing a page the viewer never navigated to.
    await commit('9999');
    expect(pageInput.value).toBe('3');

    await commit('0');
    expect(pageInput.value).toBe('1');

    await commit('2');
    expect(pageInput.value).toBe('2');

    // A cleared field means "no page number", not page zero: it restores the
    // page the viewer is on rather than navigating to the first one. Asserted
    // from page 2 so navigating to page 1 would be visible.
    await commit('');
    expect(pageInput.value).toBe('2');

    // `type="number"` sanitizes unparseable text to an empty string, so this
    // takes the same path.
    await commit('not a page');
    expect(pageInput.value).toBe('2');
  });

  it('composes page overview thumbnails with the Hell button primitive', async () => {
    const fixture = TestBed.createComponent(PdfViewerHost);
    await settle(fixture);

    const overviewButton = fixture.nativeElement.querySelector(
      'button[aria-label="Toggle page overview"]',
    ) as HTMLButtonElement;
    overviewButton.click();
    await settle(fixture);

    const thumbnail = fixture.nativeElement.querySelector('[data-slot="thumb"]') as HTMLButtonElement;
    expect(thumbnail).toBeInstanceOf(HTMLButtonElement);
    expect(thumbnail.hasAttribute('hellbutton')).toBe(true);
    expect(thumbnail.getAttribute('data-variant')).toBe('ghost');
    expect(thumbnail.getAttribute('data-size')).toBe('sm');
    expect(thumbnail.getAttribute('data-block')).toBe('');
    expect(thumbnail.getAttribute('aria-current')).toBe('page');
  });

  describe('page overview virtualization', () => {
    // The workspace vitest config sets `restoreMocks`, so the prototype spies
    // below are already reverted between tests; this is the same explicit
    // restore the sibling PDF specs keep, so a config change cannot quietly
    // leak a stubbed `clientHeight` into every test that follows.
    afterEach(() => {
      vi.restoreAllMocks();
    });

    /** Pretend the rail has a real box: jsdom has no layout to measure. */
    function stubRailLayout(): void {
      vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600);
      vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(200);
    }

    async function openOverview(fixture: {
      nativeElement: HTMLElement;
      detectChanges(): void;
      whenStable(): Promise<unknown>;
    }): Promise<HTMLElement> {
      (
        fixture.nativeElement.querySelector(
          'button[aria-label="Toggle page overview"]',
        ) as HTMLButtonElement
      ).click();
      await settle(fixture);
      return fixture.nativeElement.querySelector('aside[data-slot="sidebar"]') as HTMLElement;
    }

    function mountedPages(rail: HTMLElement): number[] {
      return [...rail.querySelectorAll('[role="listitem"]')].map((cell) =>
        Number(cell.getAttribute('data-page')),
      );
    }

    function scrollRailTo(rail: HTMLElement, scrollTop: number): void {
      Object.defineProperty(rail, 'scrollTop', {
        value: scrollTop,
        writable: true,
        configurable: true,
      });
      rail.dispatchEvent(new Event('scroll'));
    }

    it('mounts a window rather than one button per page on a long document', async () => {
      runtime.pageCount = 400;
      const fixture = TestBed.createComponent(PdfViewerHost);
      await settle(fixture);

      const rail = await openOverview(fixture);
      const pages = mountedPages(rail);

      expect(pages).toHaveLength(PDF_OVERVIEW_UNMEASURED_PAGES);
      expect(pages.length).toBeLessThan(400);
      expect(pages[0]).toBe(1);

      // The track still claims the whole document's height, so the scrollbar
      // describes four hundred pages even though six are mounted.
      const track = rail.querySelector('[role="list"]') as HTMLElement;
      expect(track.style.height).toBe(`${400 * PDF_OVERVIEW_ESTIMATED_ITEM_SIZE}px`);

      // …and each mounted cell says where it sits, because the DOM no longer
      // does that on its own.
      const first = rail.querySelector('[role="listitem"]') as HTMLElement;
      expect(first.getAttribute('aria-posinset')).toBe('1');
      expect(first.getAttribute('aria-setsize')).toBe('400');
    });

    it('follows the rail scroll offset and keeps the current page mounted', async () => {
      stubRailLayout();
      runtime.pageCount = 400;
      const fixture = TestBed.createComponent(PdfViewerHost);
      await settle(fixture);

      const rail = await openOverview(fixture);
      expect(mountedPages(rail)).toEqual([1, 2, 3, 4, 5, 6]);

      scrollRailTo(rail, 20_000);
      await settle(fixture);

      const scrolled = mountedPages(rail);
      expect(scrolled).toContain(100);
      expect(scrolled.length).toBeLessThan(20);
      // The current page is pinned wherever the window sits, so its
      // `aria-current` never leaves the accessibility tree.
      expect(scrolled).toContain(1);
      expect(rail.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe(
        'Go to page 1',
      );
    });

    it('keeps a focused page button mounted after the rail scrolls away from it', async () => {
      stubRailLayout();
      runtime.pageCount = 400;
      const fixture = TestBed.createComponent(PdfViewerHost);
      await settle(fixture);

      const rail = await openOverview(fixture);
      const third = rail.querySelectorAll<HTMLButtonElement>('[data-slot="thumb"]')[2];
      third.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await settle(fixture);

      scrollRailTo(rail, 20_000);
      await settle(fixture);

      // Unmounting the focused button would drop focus to the document body.
      expect(mountedPages(rail)).toContain(3);
    });

    it('scrolls the rail to a page the viewer jumped to', async () => {
      stubRailLayout();
      runtime.pageCount = 400;
      const fixture = TestBed.createComponent(PdfViewerHost);
      await settle(fixture);

      const rail = await openOverview(fixture);
      Object.defineProperty(rail, 'scrollTop', { value: 0, writable: true, configurable: true });

      const pageInput = fixture.nativeElement.querySelector(
        '[data-slot="pageInput"]',
      ) as HTMLInputElement;
      pageInput.value = '300';
      pageInput.dispatchEvent(new Event('change', { bubbles: true }));
      await settle(fixture);

      // Page 300 ends at 60000px; the shortest scroll that shows it fully in a
      // 600px rail leaves its bottom edge on the bottom edge of the rail.
      expect(rail.scrollTop).toBe(59_400);
      expect(mountedPages(rail)).toContain(300);
      expect(rail.querySelector('[aria-current="page"]')?.getAttribute('aria-label')).toBe(
        'Go to page 300',
      );
    });

    it('mounts no list at all before a document has loaded', async () => {
      runtime.pageCount = 0;
      const fixture = TestBed.createComponent(PdfViewerHost);
      await settle(fixture);

      const rail = await openOverview(fixture);

      // The toggle works before a document loads, and an empty `role="list"`
      // would be a list claiming to contain nothing.
      expect(rail).toBeInstanceOf(HTMLElement);
      expect(rail.querySelector('[role="list"]')).toBeNull();
      expect(mountedPages(rail)).toEqual([]);
    });

    it('leaves a user-chosen rail scroll position alone when the rail is resized', async () => {
      stubRailLayout();
      const resizes = stubResizeObserver();
      runtime.pageCount = 400;

      try {
        const fixture = TestBed.createComponent(PdfViewerHost);
        await settle(fixture);

        const rail = await openOverview(fixture);
        expect(resizes.observed()).toContain(rail);

        scrollRailTo(rail, 20_000);
        await settle(fixture);
        expect(mountedPages(rail)).toContain(100);

        // A resize remeasures the rail, which re-runs the effect that scrolls to
        // the current page. The page has not moved, so the rail has to stay
        // where the user left it rather than snapping back to page 1.
        resizes.trigger(rail);
        await settle(fixture);

        expect(rail.scrollTop).toBe(20_000);
        expect(mountedPages(rail)).toContain(100);
      } finally {
        resizes.restore();
      }
    });

    it('renders thumbnails for the pages a scroll brought into the window', async () => {
      stubRailLayout();
      runtime.pageCount = 400;
      const fixture = TestBed.createComponent(PdfViewerHost);
      runtime.hasDocument = true;
      await settle(fixture);

      const rail = await openOverview(fixture);
      await settle(fixture);
      expect(runtime.renderedThumbPages()).toContain(1);

      scrollRailTo(rail, 20_000);
      await settle(fixture);

      expect(runtime.renderedThumbPages()).toContain(100);
    });
  });

  it('announces PDF find status updates through a live region', async () => {
    const fixture = TestBed.createComponent(PdfViewerHost);
    await settle(fixture);

    const findButton = fixture.nativeElement.querySelector(
      'button[aria-label="Find in document (Ctrl/Cmd+F)"]',
    );
    expect(findButton).toBeInstanceOf(HTMLButtonElement);
    findButton!.click();
    await settle(fixture);

    const findInput = fixture.nativeElement.querySelector(
      '[data-slot="findInput"]',
    ) as HTMLInputElement;
    const status = fixture.nativeElement.querySelector('[data-slot="findCount"]') as HTMLElement;
    expect(status?.getAttribute('role')).toBe('status');
    expect(status?.getAttribute('aria-live')).toBe('polite');
    expect(status?.getAttribute('aria-atomic')).toBe('true');

    runtime['handlers']?.onFindState({ status: 'pending' });
    await settle(fixture);
    expect(status.textContent?.trim()).toBe('Searching…');

    findInput.value = 'test';
    findInput.dispatchEvent(new Event('input'));
    await settle(fixture);
    runtime['handlers']?.onFindState({ status: 'not-found', current: 0, total: 0 });
    await settle(fixture);
    expect(status.textContent?.trim()).toBe('Not found');

    runtime['handlers']?.onFindState({ status: 'found', current: 2, total: 3 });
    await settle(fixture);
    expect(status.textContent?.trim()).toBe('2 / 3');
  });

  it('exposes a data-slot for every public part', async () => {
    const fixture = TestBed.createComponent(PdfViewerHost);
    await settle(fixture);

    const viewer = fixture.nativeElement.querySelector('hell-pdf-viewer') as HTMLElement;

    // Open the find bar and page overview so all conditional parts are present.
    (
      fixture.nativeElement.querySelector(
        'button[aria-label="Find in document (Ctrl/Cmd+F)"]',
      ) as HTMLButtonElement
    ).click();
    (
      fixture.nativeElement.querySelector(
        'button[aria-label="Toggle page overview"]',
      ) as HTMLButtonElement
    ).click();
    await settle(fixture);

    expect(viewer.getAttribute('data-slot')).toBe('root');
    for (const part of [
      'toolbar',
      'toolbarGroup',
      'divider',
      'pageInput',
      'toolbarText',
      'zoomSelect',
      'findBar',
      'findInput',
      'findCount',
      'viewport',
      'sidebar',
      'thumb',
      'thumbLabel',
      'pageArea',
    ]) {
      expect(viewer.querySelector(`[data-slot="${part}"]`)).not.toBeNull();
    }
  });

  it('merges ui shorthand onto the root part and lets it win over defaults', async () => {
    const fixture = TestBed.createComponent(PdfViewerHost);
    fixture.componentInstance.ui = 'ring-2 ring-custom';
    await settle(fixture);

    const viewer = fixture.nativeElement.querySelector('hell-pdf-viewer') as HTMLElement;
    expect(viewer.getAttribute('data-slot')).toBe('root');
    // The consumer ui classes are the test's own contract fixtures; recipe
    // conflict resolution is owned centrally by the Part-Class Pipeline spec.
    expect(viewer.classList.contains('ring-2')).toBe(true);
    expect(viewer.classList.contains('ring-custom')).toBe(true);
  });

  describe('recipes', () => {
    // Part-Class Pipeline merge semantics are owned centrally by
    // `internal/core/part-class-pipeline.spec.ts`; the snapshot pins the default part
    // classes without asserting individual utilities elsewhere.
    it('keeps the default part classes stable', async () => {
      const fixture = TestBed.createComponent(PdfViewerHost);
      await settle(fixture);

      const viewer = fixture.nativeElement.querySelector('hell-pdf-viewer') as HTMLElement;
      const partClasses = (slot: string): string[] =>
        sortClasses(viewer.querySelector(`[data-slot="${slot}"]`)?.getAttribute('class') ?? '');

      expect(
        Object.fromEntries(
          [
            'toolbar',
            'toolbarGroup',
            'divider',
            'pageInput',
            'toolbarText',
            'zoomSelect',
            'viewport',
            'sidebar',
            'thumb',
            'thumbLabel',
            'pageArea',
          ].map((slot) => [slot, partClasses(slot)]),
        ),
      ).toMatchSnapshot('pdfViewer');
    });
  });

  it('merges part-map classes onto their parts and wins over defaults', async () => {
    const fixture = TestBed.createComponent(PdfViewerHost);
    fixture.componentInstance.ui = {
      toolbar: 'custom-toolbar',
      findBar: 'custom-findbar',
      viewport: 'custom-viewport',
    } satisfies HellPdfViewerUi;
    await settle(fixture);

    (
      fixture.nativeElement.querySelector(
        'button[aria-label="Find in document (Ctrl/Cmd+F)"]',
      ) as HTMLButtonElement
    ).click();
    await settle(fixture);

    const viewer = fixture.nativeElement.querySelector('hell-pdf-viewer') as HTMLElement;
    const toolbar = viewer.querySelector('[data-slot="toolbar"]') as HTMLElement;
    const findBar = viewer.querySelector('[data-slot="findBar"]') as HTMLElement;
    const viewport = viewer.querySelector('[data-slot="viewport"]') as HTMLElement;

    expect(toolbar.classList.contains('custom-toolbar')).toBe(true);
    expect(findBar.classList.contains('custom-findbar')).toBe(true);
    expect(viewport.classList.contains('custom-viewport')).toBe(true);

    // Shorthand only styles the root part, so it does not leak onto other parts.
    expect(viewer.classList.contains('custom-toolbar')).toBe(false);
  });
});

/** jsdom has no ResizeObserver; the rail uses one to know when to remeasure. */
function stubResizeObserver() {
  const view = window as unknown as { ResizeObserver?: typeof ResizeObserver };
  const previous = Object.getOwnPropertyDescriptor(view, 'ResizeObserver');
  const instances: {
    targets: Set<Element>;
    notify: (entries: ResizeObserverEntry[]) => void;
  }[] = [];

  class TestResizeObserver {
    private readonly targets = new Set<Element>();

    constructor(notify: ResizeObserverCallback) {
      instances.push({ targets: this.targets, notify: (entries) => notify(entries, this as never) });
    }

    observe(target: Element): void {
      this.targets.add(target);
    }

    unobserve(target: Element): void {
      this.targets.delete(target);
    }

    disconnect(): void {
      this.targets.clear();
    }
  }

  view.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;

  return {
    observed: () => instances.flatMap((entry) => [...entry.targets]),
    // Only the observer watching this element: ng-primitives installs its own,
    // and notifying that one with a synthetic entry list is not this test's
    // business.
    trigger: (target: Element) => {
      for (const entry of instances) {
        if (entry.targets.has(target)) entry.notify([{ target } as ResizeObserverEntry]);
      }
    },
    restore: () => {
      if (previous) Object.defineProperty(view, 'ResizeObserver', previous);
      else delete view.ResizeObserver;
    },
  };
}

async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
}
