import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideHellLabels } from '@hell-ui/angular/core';
import { HELL_RESIZABLE_DIRECTIVES } from './resizable';

@Component({
  imports: [...HELL_RESIZABLE_DIRECTIVES],
  template: `
    <div id="group" hellResizable>
      <section id="pane-a" hellResizablePane [minSize]="40">A</section>
      <div id="handle-a" hellResizableHandle [aria-controls]="[' pane-a ', ' ', 'pane-b']"></div>
      <section id="pane-b" hellResizablePane [minSize]="40">B</section>
      <div id="handle-b" hellResizableHandle aria-label="Custom resize handle"></div>
      <section id="pane-c" hellResizablePane [minSize]="40">C</section>
    </div>
  `,
})
class ResizableHost {}

@Component({
  imports: [...HELL_RESIZABLE_DIRECTIVES],
  providers: [provideHellLabels({ resizable: { resizePanels: 'Contract resize handle' } })],
  template: `
    <div id="contract-group" hellResizable>
      <section hellResizablePane [minSize]="40">A</section>
      <div id="contract-handle" hellResizableHandle [aria-controls]="[' id-a ', ' ', 'id-b']"></div>
      <section hellResizablePane [minSize]="40">B</section>
    </div>
  `,
})
class ResizableLabelContractHost {}

describe('HellResizable', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResizableHost, ResizableLabelContractHost],
    }).compileComponents();
  });

  it('resizes only the panes adjacent to the active handle', () => {
    const fixture = TestBed.createComponent(ResizableHost);
    fixture.detectChanges();

    const group = byId(fixture.nativeElement, 'group');
    const paneA = byId(fixture.nativeElement, 'pane-a');
    const paneB = byId(fixture.nativeElement, 'pane-b');
    const paneC = byId(fixture.nativeElement, 'pane-c');
    mockElementSize(group, 300);
    mockElementSize(paneA, 100);
    mockElementSize(paneB, 100);
    mockElementSize(paneC, 100);

    const key = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    expect(byId(fixture.nativeElement, 'handle-a').getAttribute('aria-valuenow')).toBe('50');
    byId(fixture.nativeElement, 'handle-a').dispatchEvent(key);

    expect(key.defaultPrevented).toBe(true);
    expect(byId(fixture.nativeElement, 'handle-a').getAttribute('aria-label')).toBe('Resize panels');
    expect(byId(fixture.nativeElement, 'handle-a').getAttribute('aria-controls')).toBe('pane-a pane-b');
    expect(byId(fixture.nativeElement, 'handle-a').getAttribute('aria-valuemin')).toBe('0');
    expect(byId(fixture.nativeElement, 'handle-a').getAttribute('aria-valuemax')).toBe('100');
    expect(byId(fixture.nativeElement, 'handle-b').getAttribute('aria-controls')).toBe(null);
    expect(paneFlex(paneA)).toBe('0 0 116px');
    expect(paneFlex(paneB)).toBe('0 0 84px');
    expect(paneFlex(paneC)).toBe('0 0 100px');
  });

  it('respects explicit aria-label override on handle', () => {
    const fixture = TestBed.createComponent(ResizableHost);
    fixture.detectChanges();

    expect(byId(fixture.nativeElement, 'handle-b').getAttribute('aria-label')).toBe('Custom resize handle');
  });

  it('supports label contract override for resize handle text', () => {
    const fixture = TestBed.createComponent(ResizableLabelContractHost);
    fixture.detectChanges();

    expect(byId(fixture.nativeElement, 'contract-handle').getAttribute('aria-label')).toBe('Contract resize handle');
  });

  it('seeds aria-valuenow from measured asymmetric pane sizes before interaction', () => {
    const fixture = TestBed.createComponent(ResizableHost);
    const group = byId(fixture.nativeElement, 'group');
    const paneA = byId(fixture.nativeElement, 'pane-a');
    const paneB = byId(fixture.nativeElement, 'pane-b');
    mockElementSize(group, 300);
    mockElementSize(paneA, 120);
    mockElementSize(paneB, 80);
    mockElementSize(byId(fixture.nativeElement, 'pane-c'), 100);

    fixture.detectChanges();

    expect(byId(fixture.nativeElement, 'handle-a').getAttribute('aria-valuenow')).toBe('60');
  });

  it('uses RTL-aware horizontal arrow semantics', () => {
    const fixture = TestBed.createComponent(ResizableHost);
    fixture.detectChanges();

    const group = byId(fixture.nativeElement, 'group');
    const paneA = byId(fixture.nativeElement, 'pane-a');
    const paneB = byId(fixture.nativeElement, 'pane-b');
    const paneC = byId(fixture.nativeElement, 'pane-c');
    const handle = byId(fixture.nativeElement, 'handle-a');
    handle.setAttribute('dir', 'rtl');
    mockElementSize(group, 300);
    mockElementSize(paneA, 100);
    mockElementSize(paneB, 100);
    mockElementSize(paneC, 100);

    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    expect(paneFlex(paneA)).toBe('0 0 84px');
    expect(paneFlex(paneB)).toBe('0 0 116px');
  });

  it('marks a fully constrained group as disabled for handle interaction', () => {
    const fixture = TestBed.createComponent(ResizableHost);
    fixture.detectChanges();

    const group = byId(fixture.nativeElement, 'group');
    mockElementSize(group, 80);
    mockElementSize(byId(fixture.nativeElement, 'pane-a'), 100);
    mockElementSize(byId(fixture.nativeElement, 'pane-b'), 100);
    mockElementSize(byId(fixture.nativeElement, 'pane-c'), 100);

    const handle = byId(fixture.nativeElement, 'handle-a');
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();

    expect(handle.getAttribute('aria-disabled')).toBe('true');
    expect(handle.getAttribute('tabindex')).toBe('-1');
  });
});

function byId(root: HTMLElement, id: string): HTMLElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element;
}

function mockElementSize(element: HTMLElement, size: number): void {
  vi.spyOn(element, 'clientWidth', 'get').mockReturnValue(size);
  vi.spyOn(element, 'offsetWidth', 'get').mockReturnValue(size);
}

function paneFlex(pane: HTMLElement): string {
  return pane.style.getPropertyValue('--_hell-resizable-pane-flex');
}
