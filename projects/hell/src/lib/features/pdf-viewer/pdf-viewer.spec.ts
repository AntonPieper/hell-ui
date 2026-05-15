import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

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
  loadedSource: HellPdfSource | null = null;
  printedWith: RequestInit | undefined;
  cleanedUp = false;
  private handlers: HellPdfRuntimeHandlers | null = null;

  async bootstrap(container: HTMLDivElement, handlers: HellPdfRuntimeHandlers): Promise<void> {
    this.bootstrappedWith = container;
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
    />
  `,
})
class PdfViewerHost {
  src: HellPdfSource = 'document.pdf';
  globalShortcuts = false;
  printFetchOptions: RequestInit | null = null;
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

  it('passes print fetch options from the Angular surface to the runtime', async () => {
    const fixture = TestBed.createComponent(PdfViewerHost);
    fixture.componentInstance.printFetchOptions = {
      credentials: 'include',
      headers: { Authorization: 'Bearer test' },
    };

    await settle(fixture);

    const button = fixture.nativeElement.querySelector('button[aria-label="Print"]') as HTMLButtonElement;
    button.click();
    await settle(fixture);

    expect(runtime.printedWith).toEqual(fixture.componentInstance.printFetchOptions);
  });

  it('announces PDF find status updates through a live region', async () => {
    const fixture = TestBed.createComponent(PdfViewerHost);
    await settle(fixture);

    const findButton = fixture.nativeElement.querySelector('button[aria-label="Find in document (Ctrl/Cmd+F)"]');
    expect(findButton).toBeInstanceOf(HTMLButtonElement);
    findButton!.click();
    await settle(fixture);

    const findInput = fixture.nativeElement.querySelector('.hell-pdf-find-input') as HTMLInputElement;
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
