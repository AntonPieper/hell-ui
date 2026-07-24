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
import { sortClasses } from '../../spec-helpers';

class FakePdfRuntime implements HellPdfRuntimePort {
  hasDocument = false;
  currentScale = 1;
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
    options.onLoaded(3);
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
  async renderThumbs(): Promise<void> {}
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

async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
}
