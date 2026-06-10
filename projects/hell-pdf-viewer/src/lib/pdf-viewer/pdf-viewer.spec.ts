import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHellLabels } from '@hell-ui/angular/core';

import { HELL_PDF_RUNTIME_FACTORY, HellPdfViewer } from './pdf-viewer';
import type {
  HellPdfFindRequest,
  HellPdfLoadOptions,
  HellPdfRuntimeHandlers,
  HellPdfRuntimePort,
  HellPdfSource,
} from './pdf-viewer.runtime';

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

  goTo(): void {}
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
    />
  `,
})
class PdfViewerHost {
  src: HellPdfSource = 'document.pdf';
  globalShortcuts = false;
  printFetchOptions: RequestInit | null = null;
  worker: string | null = null;
}

@Component({
  imports: [HellPdfViewer],
  providers: [
    provideHellLabels({
      pdfViewer: {
        togglePageOverview: 'Toggle local overview',
        findInDocument: 'Search local document',
        print: 'Print local document',
        zoomLevel: 'Local zoom level',
        findPlaceholder: 'Find local text',
        findQuery: 'Local find query',
        searching: 'Searching locally',
        notFound: 'No local result',
        pageOverview: 'Local page overview',
        goToPage: (page) => `Open local page ${page}`,
      },
    }),
  ],
  template: `<hell-pdf-viewer [src]="src" />`,
})
class PdfViewerLocalizedLabelsHost {
  src: HellPdfSource = 'document.pdf';
}

describe('HellPdfViewer', () => {
  let runtime: FakePdfRuntime;

  beforeEach(async () => {
    runtime = new FakePdfRuntime();
    await TestBed.configureTestingModule({
      imports: [PdfViewerHost, PdfViewerLocalizedLabelsHost],
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
      fixture.nativeElement.querySelector('.hell-pdf-find-input') as HTMLInputElement | null;

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

    expect(fixture.nativeElement.querySelector('.hell-pdf-find-input')).toBeInstanceOf(
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

  it('composes page overview thumbnails with the Hell button primitive', async () => {
    const fixture = TestBed.createComponent(PdfViewerHost);
    await settle(fixture);

    const overviewButton = fixture.nativeElement.querySelector(
      'button[aria-label="Toggle page overview"]',
    ) as HTMLButtonElement;
    overviewButton.click();
    await settle(fixture);

    const thumbnail = fixture.nativeElement.querySelector('.hell-pdf-thumb') as HTMLButtonElement;
    expect(thumbnail).toBeInstanceOf(HTMLButtonElement);
    expect(thumbnail.classList.contains('hell-button')).toBe(true);
    expect(thumbnail.getAttribute('data-variant')).toBe('ghost');
    expect(thumbnail.getAttribute('data-size')).toBe('sm');
    expect(thumbnail.getAttribute('data-block')).toBe('');
    expect(thumbnail.getAttribute('aria-current')).toBe('page');
  });

  it('uses injected label contract text for toolbar and find controls', async () => {
    const fixture = TestBed.createComponent(PdfViewerLocalizedLabelsHost);
    await settle(fixture);

    const findButton = fixture.nativeElement.querySelector(
      'button[aria-label="Search local document"]',
    ) as HTMLButtonElement;
    expect(findButton).toBeInstanceOf(HTMLButtonElement);
    expect(
      fixture.nativeElement.querySelector('button[aria-label="Print local document"]'),
    ).toBeInstanceOf(HTMLButtonElement);
    expect(
      fixture.nativeElement.querySelector('select[aria-label="Local zoom level"]'),
    ).toBeInstanceOf(HTMLSelectElement);

    findButton.click();
    await settle(fixture);

    const findInput = fixture.nativeElement.querySelector(
      '.hell-pdf-find-input',
    ) as HTMLInputElement;
    const status = fixture.nativeElement.querySelector('.hell-pdf-find-count') as HTMLElement;
    expect(findInput.getAttribute('aria-label')).toBe('Local find query');
    expect(findInput.getAttribute('placeholder')).toBe('Find local text');

    runtime['handlers']?.onFindState({ status: 'pending' });
    await settle(fixture);
    expect(status.textContent?.trim()).toBe('Searching locally');

    findInput.value = 'missing';
    findInput.dispatchEvent(new Event('input'));
    runtime['handlers']?.onFindState({ status: 'not-found', current: 0, total: 0 });
    await settle(fixture);
    expect(status.textContent?.trim()).toBe('No local result');
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
      '.hell-pdf-find-input',
    ) as HTMLInputElement;
    const status = fixture.nativeElement.querySelector('.hell-pdf-find-count') as HTMLElement;
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
});

async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
}
