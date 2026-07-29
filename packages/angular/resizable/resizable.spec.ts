import { provideHellLabels } from 'hell-ui/core';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_RESIZABLE_IMPORTS, type HellResizableHandleUi, HELL_RESIZABLE_LABELS } from './resizable';
import { expectUiRouting, sortClasses } from '../spec-helpers';

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

/** Two panes with Master Detail's pane minimums, the shape that surfaced #424. */
@Component({
  imports: [...HELL_RESIZABLE_IMPORTS],
  template: `
    <div id="pair-group" hellResizable>
      <section id="pair-primary" hellResizablePane [minSize]="220">A</section>
      <div id="pair-handle" hellResizableHandle></div>
      <section id="pair-detail" hellResizablePane [minSize]="260">B</section>
    </div>
  `,
})
class ResizablePairHost {}

/** A group whose last pane can leave the DOM, so registration teardown is observable. */
@Component({
  imports: [...HELL_RESIZABLE_IMPORTS],
  template: `
    <div id="toggle-group" hellResizable>
      <section id="toggle-a" hellResizablePane [minSize]="40">A</section>
      <div id="toggle-handle-a" hellResizableHandle></div>
      <section id="toggle-b" hellResizablePane [minSize]="40">B</section>
      @if (thirdPane()) {
        <div id="toggle-handle-b" hellResizableHandle></div>
        <section id="toggle-c" hellResizablePane [minSize]="40">C</section>
      }
    </div>
  `,
})
class ResizableToggleHost {
  readonly thirdPane = signal(true);
}

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
      imports: [
        ResizableHost,
        ResizableLabelContractHost,
        ResizablePairHost,
        ResizableToggleHost,
        ResizableUiHost,
      ],
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

  it('gives the whole group to the panes still in layout when an outer module hides one', () => {
    const scheduled = stubResizeFrames();
    const fixture = TestBed.createComponent(ResizableHost);
    fixture.detectChanges();

    const group = byId(fixture.nativeElement, 'group');
    const paneA = byId(fixture.nativeElement, 'pane-a');
    const paneB = byId(fixture.nativeElement, 'pane-b');
    const paneC = byId(fixture.nativeElement, 'pane-c');
    vi.spyOn(group, 'clientWidth', 'get').mockReturnValue(300);
    mockElementSize(paneA, 100);
    mockElementSize(paneB, 100);
    mockElementSize(paneC, 100);

    byId(fixture.nativeElement, 'handle-a').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    expect(panePixelSize(paneC)).toBe(100);

    hidePane(paneC);
    const observer = resizeObserverFor(group);
    expect(observer.targets.has(paneC)).toBe(true);
    observer.trigger();
    flushFrames(scheduled);

    // The hidden pane keeps no width of its own, and the two that are still
    // rendered share the group instead of leaving its last third empty.
    expect(paneFlex(paneC)).toBe('1 1 0');
    expect(panePixelSize(paneA) + panePixelSize(paneB)).toBeCloseTo(300, 5);
    expect(panePixelSize(paneA) / panePixelSize(paneB)).toBeCloseTo(116 / 84, 5);
  });

  it('parks the split while a pane is out of layout and restores it when the pane returns', () => {
    const scheduled = stubResizeFrames();
    const fixture = TestBed.createComponent(ResizablePairHost);
    fixture.detectChanges();

    const group = byId(fixture.nativeElement, 'pair-group');
    const primary = byId(fixture.nativeElement, 'pair-primary');
    const detail = byId(fixture.nativeElement, 'pair-detail');
    const handle = byId(fixture.nativeElement, 'pair-handle');
    const groupWidth = vi.spyOn(group, 'clientWidth', 'get').mockReturnValue(900);
    mockElementSize(primary, 540);
    mockElementSize(detail, 360);

    handle.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    expect(paneFlex(primary)).toBe('0 0 556px');
    expect(paneFlex(detail)).toBe('0 0 344px');

    // The compact frame: one pane left in layout, far narrower than the pixels
    // the pair committed to in the wide one.
    hidePane(detail);
    groupWidth.mockReturnValue(310);
    resizeObserverFor(group).trigger();
    flushFrames(scheduled);

    expect(paneFlex(primary)).toBe('1 1 0');
    expect(paneMinSize(primary)).toBe('310px');
    expect(paneFlex(detail)).toBe('1 1 0');

    // A handle whose partner is out of layout has no pair to move, so it stops
    // offering itself as one: it leaves the tab order and reports disabled
    // rather than swallowing arrow keys that now do nothing.
    fixture.detectChanges();
    expect(handle.getAttribute('aria-disabled')).toBe('true');
    expect(handle.getAttribute('tabindex')).toBe('-1');
    const arrow = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    });
    handle.dispatchEvent(arrow);
    expect(arrow.defaultPrevented).toBe(false);
    expect(paneFlex(primary)).toBe('1 1 0');

    showPane(detail, 344);
    groupWidth.mockReturnValue(900);
    resizeObserverFor(group).trigger();
    flushFrames(scheduled);
    fixture.detectChanges();

    expect(paneFlex(primary)).toBe('0 0 556px');
    expect(paneFlex(detail)).toBe('0 0 344px');
    expect(handle.getAttribute('aria-disabled')).toBe(null);
    expect(handle.getAttribute('tabindex')).toBe('0');
  });

  it('stops observing a removed pane and refits the group without it', async () => {
    // A pane leaving the DOM refits on a microtask rather than a frame, so no
    // scheduled frame has to be flushed here.
    stubResizeFrames();
    const fixture = TestBed.createComponent(ResizableToggleHost);
    fixture.detectChanges();

    const group = byId(fixture.nativeElement, 'toggle-group');
    const paneA = byId(fixture.nativeElement, 'toggle-a');
    const paneB = byId(fixture.nativeElement, 'toggle-b');
    const paneC = byId(fixture.nativeElement, 'toggle-c');
    vi.spyOn(group, 'clientWidth', 'get').mockReturnValue(300);
    mockElementSize(paneA, 100);
    mockElementSize(paneB, 100);
    mockElementSize(paneC, 100);

    byId(fixture.nativeElement, 'toggle-handle-a').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    const observer = resizeObserverFor(group);
    expect(observer.targets.has(paneC)).toBe(true);

    fixture.componentInstance.thirdPane.set(false);
    fixture.detectChanges();
    await Promise.resolve();

    expect(observer.targets.has(paneC)).toBe(false);
    expect(panePixelSize(paneA) + panePixelSize(paneB)).toBeCloseTo(300, 5);

    fixture.componentInstance.thirdPane.set(true);
    fixture.detectChanges();
    const restored = byId(fixture.nativeElement, 'toggle-c');
    mockElementSize(restored, 0);
    await Promise.resolve();

    expect(observer.targets.has(restored)).toBe(true);
    expect(
      panePixelSize(paneA) + panePixelSize(paneB) + panePixelSize(restored),
    ).toBeCloseTo(300, 5);
  });

  it('keeps a single laid-out pane inside a frame narrower than its own minimum', () => {
    const scheduled = stubResizeFrames();
    const fixture = TestBed.createComponent(ResizablePairHost);
    fixture.detectChanges();

    const group = byId(fixture.nativeElement, 'pair-group');
    const primary = byId(fixture.nativeElement, 'pair-primary');
    const detail = byId(fixture.nativeElement, 'pair-detail');
    const groupWidth = vi.spyOn(group, 'clientWidth', 'get').mockReturnValue(900);
    mockElementSize(primary, 540);
    mockElementSize(detail, 360);

    hidePane(detail);
    groupWidth.mockReturnValue(180);
    resizeObserverFor(group).trigger();
    flushFrames(scheduled);

    expect(paneMinSize(primary)).toBe('180px');
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

function query(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element;
}

function mockElementSize(element: HTMLElement, size: number): void {
  vi.spyOn(element, 'clientWidth', 'get').mockReturnValue(size);
  vi.spyOn(element, 'offsetWidth', 'get').mockReturnValue(size);
}

/** Take a pane out of layout the way an outer module does: `display: none`. */
function hidePane(pane: HTMLElement): void {
  pane.hidden = true;
  mockElementSize(pane, 0);
}

function showPane(pane: HTMLElement, size: number): void {
  pane.hidden = false;
  mockElementSize(pane, size);
}

/** Capture the frames the controller schedules so a fit can be run on demand. */
function stubResizeFrames(): FrameRequestCallback[] {
  const scheduled: FrameRequestCallback[] = [];
  vi.stubGlobal('ResizeObserver', TestResizeObserver);
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(
    (callback: FrameRequestCallback) => scheduled.push(callback),
  );
  return scheduled;
}

function flushFrames(scheduled: FrameRequestCallback[]): void {
  for (const frame of scheduled.splice(0, scheduled.length)) frame(0);
}

function resizeObserverFor(host: HTMLElement): TestResizeObserver {
  const observer = TestResizeObserver.instances.find((candidate) => candidate.observed === host);
  if (!observer) throw new Error('Expected the resizable ResizeObserver.');
  return observer;
}

function paneFlex(pane: HTMLElement): string {
  return pane.style.getPropertyValue('--_hell-resizable-pane-flex');
}

function paneMinSize(pane: HTMLElement): string {
  return pane.style.getPropertyValue('--_hell-resizable-pane-min-size');
}

function panePixelSize(pane: HTMLElement): number {
  const match = /^0 0 ([\d.]+)px$/.exec(paneFlex(pane));
  if (!match) throw new Error('Expected an explicit pane pixel size.');
  return Number(match[1]);
}

class TestResizeObserver {
  static instances: TestResizeObserver[] = [];
  /** First observed element — the group host, which the controller observes first. */
  observed: Element | null = null;
  readonly targets = new Set<Element>();

  constructor(private readonly callback: ResizeObserverCallback) {
    TestResizeObserver.instances.push(this);
  }

  observe(element: Element): void {
    this.observed ??= element;
    this.targets.add(element);
  }

  unobserve(element: Element): void {
    this.targets.delete(element);
  }

  disconnect(): void {
    this.targets.clear();
  }

  trigger(): void {
    this.callback([], this as unknown as ResizeObserver);
  }
}
