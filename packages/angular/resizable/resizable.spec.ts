import { provideHellLabels } from '@hell-ui/angular/core';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_RESIZABLE_IMPORTS, type HellResizableHandleUi, HELL_RESIZABLE_LABELS } from './resizable';

@Component({
  imports: [...HELL_RESIZABLE_IMPORTS],
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
  imports: [...HELL_RESIZABLE_IMPORTS],
  providers: [provideHellLabels(HELL_RESIZABLE_LABELS, { resizePanels: 'Contract resize handle' })],
  template: `
    <div id="contract-group" hellResizable>
      <section hellResizablePane [minSize]="40">A</section>
      <div id="contract-handle" hellResizableHandle [aria-controls]="[' id-a ', ' ', 'id-b']"></div>
      <section hellResizablePane [minSize]="40">B</section>
    </div>
  `,
})
class ResizableLabelContractHost {}

@Component({
  imports: [...HELL_RESIZABLE_IMPORTS],
  template: `
    <div id="ui-group" hellResizable orientation="vertical" ui="h-[360px] bg-hell-surface-muted">
      <section id="ui-pane-a" hellResizablePane [ui]="paneUi" [minSize]="40">A</section>
      <div id="ui-handle" hellResizableHandle appearance="grip" [ui]="handleUi"></div>
      <section id="ui-pane-b" hellResizablePane [ui]="paneUi" [minSize]="40">B</section>
      <div id="plain-handle" hellResizableHandle appearance="grip"></div>
      <section id="ui-pane-c" hellResizablePane [minSize]="40">C</section>
    </div>
  `,
})
class ResizableUiHost {
  readonly paneUi = { root: 'overflow-hidden bg-hell-danger' };
  readonly handleUi = {
    root: 'bg-hell-danger flex-none',
    grip: 'bg-hell-primary',
  } satisfies HellResizableHandleUi;
}

describe('HellResizable', () => {
  afterEach(() => {
    TestResizeObserver.instances = [];
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResizableHost, ResizableLabelContractHost, ResizableUiHost],
    }).compileComponents();
  });

  it('merges resizable ui classes through local root parts without changing state attributes', () => {
    const fixture = TestBed.createComponent(ResizableUiHost);
    const defaultsFixture = TestBed.createComponent(ResizableHost);
    fixture.detectChanges();
    defaultsFixture.detectChanges();

    const group = byId(fixture.nativeElement, 'ui-group');
    const pane = byId(fixture.nativeElement, 'ui-pane-a');
    const handle = byId(fixture.nativeElement, 'ui-handle');
    const grip = query(handle, '[data-slot="grip"]');
    const plainHandle = byId(fixture.nativeElement, 'plain-handle');
    const plainGrip = query(plainHandle, '[data-slot="grip"]');
    const defaultGroup = byId(defaultsFixture.nativeElement, 'group');
    const defaultPane = byId(defaultsFixture.nativeElement, 'pane-a');

    expect(group.getAttribute('data-slot')).toBe('root');
    expect(group.getAttribute('data-orientation')).toBe('vertical');
    expectUiRouting(defaultGroup.className, group.className, 'h-[360px] bg-hell-surface-muted');

    expect(pane.getAttribute('data-slot')).toBe('root');
    expect(pane.getAttribute('data-orientation')).toBe('vertical');
    expectUiRouting(defaultPane.className, pane.className, 'overflow-hidden bg-hell-danger');

    expect(handle.getAttribute('data-slot')).toBe('root');
    expect(handle.getAttribute('data-appearance')).toBe('grip');
    expect(handle.getAttribute('aria-orientation')).toBe('horizontal');
    expectUiRouting(plainHandle.className, handle.className, 'bg-hell-danger flex-none');
    expectUiRouting(plainGrip.className, grip.className, 'bg-hell-primary');
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(ResizableUiHost);
      const defaultsFixture = TestBed.createComponent(ResizableHost);
      fixture.detectChanges();
      defaultsFixture.detectChanges();

      const plainHandle = byId(fixture.nativeElement, 'plain-handle');

      expect({
        group: sortClasses(byId(defaultsFixture.nativeElement, 'group').className),
        pane: sortClasses(byId(defaultsFixture.nativeElement, 'pane-a').className),
        handle: sortClasses(byId(defaultsFixture.nativeElement, 'handle-a').className),
        gripHandle: sortClasses(plainHandle.className),
        grip: sortClasses(query(plainHandle, '[data-slot="grip"]').className),
      }).toMatchSnapshot('resizable');
    });
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

  it('commits pointer cancellation and removes the active resize listeners', () => {
    const fixture = TestBed.createComponent(ResizableHost);
    fixture.detectChanges();

    const group = byId(fixture.nativeElement, 'group');
    const paneA = byId(fixture.nativeElement, 'pane-a');
    const paneB = byId(fixture.nativeElement, 'pane-b');
    const paneC = byId(fixture.nativeElement, 'pane-c');
    const handle = byId(fixture.nativeElement, 'handle-a');
    mockElementSize(group, 300);
    mockElementSize(paneA, 100);
    mockElementSize(paneB, 100);
    mockElementSize(paneC, 100);

    const pointerDown = new PointerEvent('pointerdown', {
      button: 0,
      pointerId: 7,
      pointerType: 'mouse',
      clientX: 100,
      bubbles: true,
      cancelable: true,
    });
    handle.dispatchEvent(pointerDown);
    fixture.detectChanges();

    expect(pointerDown.defaultPrevented).toBe(true);
    expect(handle.getAttribute('data-active')).toBe('true');

    window.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerId: 7,
        clientX: 130,
        bubbles: true,
        cancelable: true,
      }),
    );
    const pointerCancel = new PointerEvent('pointercancel', {
      pointerId: 7,
      clientX: 130,
      bubbles: true,
      cancelable: true,
    });
    window.dispatchEvent(pointerCancel);
    fixture.detectChanges();

    expect(pointerCancel.defaultPrevented).toBe(true);
    expect(handle.getAttribute('data-active')).toBe(null);
    expect(paneFlex(paneA)).toBe('0 0 130px');
    expect(paneFlex(paneB)).toBe('0 0 70px');
    expect(paneFlex(paneC)).toBe('0 0 100px');

    window.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerId: 7,
        clientX: 180,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(paneFlex(paneA)).toBe('0 0 130px');
    expect(paneFlex(paneB)).toBe('0 0 70px');
  });

  it('rebalances user-sized panes after the observed container size changes', () => {
    vi.stubGlobal('ResizeObserver', TestResizeObserver);
    const scheduledFrames: FrameRequestCallback[] = [];
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback) => {
        scheduledFrames.push(callback);
        return 1;
      });

    const fixture = TestBed.createComponent(ResizableHost);
    fixture.detectChanges();

    const group = byId(fixture.nativeElement, 'group');
    const paneA = byId(fixture.nativeElement, 'pane-a');
    const paneB = byId(fixture.nativeElement, 'pane-b');
    const paneC = byId(fixture.nativeElement, 'pane-c');
    const groupWidth = vi.spyOn(group, 'clientWidth', 'get').mockReturnValue(300);
    mockElementSize(paneA, 100);
    mockElementSize(paneB, 100);
    mockElementSize(paneC, 100);

    byId(fixture.nativeElement, 'handle-a').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    const beforeResize = [panePixelSize(paneA), panePixelSize(paneB), panePixelSize(paneC)];

    groupWidth.mockReturnValue(360);
    const observer = TestResizeObserver.instances.find(
      (candidate) => candidate.observed === group,
    );
    if (!observer) throw new Error('Expected the resizable ResizeObserver.');
    requestFrame.mockClear();
    const scheduledFrameIndex = scheduledFrames.length;
    observer.trigger();

    expect(requestFrame).toHaveBeenCalledOnce();
    const scheduledFrame = scheduledFrames[scheduledFrameIndex];
    if (!scheduledFrame) throw new Error('Expected a scheduled resize frame.');
    scheduledFrame(0);

    const afterResize = [panePixelSize(paneA), panePixelSize(paneB), panePixelSize(paneC)];
    expect(afterResize.reduce((sum, size) => sum + size, 0)).toBeCloseTo(360, 5);
    expect(afterResize).not.toEqual(beforeResize);
    expect(afterResize[2]).toBeGreaterThan(beforeResize[2]);
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

/**
 * Proves consumer ui classes reach the part through the Part-Class Pipeline:
 * every ui class renders, and nothing outside the default render plus the
 * consumer's ui appears. Merge conflict semantics are owned centrally by
 * `core/part-class-pipeline.spec.ts`.
 */
function expectUiRouting(defaultClassName: string, customClassName: string, ui: string): void {
  const custom = sortClasses(customClassName);
  const ownUi = sortClasses(ui);
  const allowed = new Set([...sortClasses(defaultClassName), ...ownUi]);

  expect(custom).toEqual(expect.arrayContaining(ownUi));
  expect(custom.filter((candidate) => !allowed.has(candidate))).toEqual([]);
}

function sortClasses(value: string): string[] {
  return value.split(/\s+/).filter(Boolean).sort();
}

function byId(root: HTMLElement, id: string): HTMLElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element;
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element;
}

function mockElementSize(element: HTMLElement, size: number): void {
  vi.spyOn(element, 'clientWidth', 'get').mockReturnValue(size);
  vi.spyOn(element, 'offsetWidth', 'get').mockReturnValue(size);
}

function paneFlex(pane: HTMLElement): string {
  return pane.style.getPropertyValue('--_hell-resizable-pane-flex');
}

function panePixelSize(pane: HTMLElement): number {
  const match = /^0 0 ([\d.]+)px$/.exec(paneFlex(pane));
  if (!match) throw new Error('Expected an explicit pane pixel size.');
  return Number(match[1]);
}

class TestResizeObserver {
  static instances: TestResizeObserver[] = [];
  observed: Element | null = null;

  constructor(private readonly callback: ResizeObserverCallback) {
    TestResizeObserver.instances.push(this);
  }

  observe(element: Element): void {
    this.observed = element;
  }

  disconnect(): void {}

  trigger(): void {
    this.callback([], this as unknown as ResizeObserver);
  }
}
