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
      [printFetchOptions]="printFetchOptions"
    />
  `,
})
class PdfViewerHost {
  src: HellPdfSource = 'document.pdf';
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
});

async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
}
