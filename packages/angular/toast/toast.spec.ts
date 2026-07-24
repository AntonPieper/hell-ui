import { Component, inject, signal, viewChild, type TemplateRef } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';

import type { HellUiInput } from 'hell-ui/core';
import {
  HellToastService,
  HellToaster,
  type HellToasterPart,
  type HellToasterUi,
  type HellToastRef,
} from './toast';
import {
  hellToastFrontDistance,
  hellToastOffsetPx,
  hellToastOverflow,
  hellToastScrollEdgeOpacity,
  hellToastScrollEdgeProgress,
  hellToastSnapshotExits,
  hellToastStackHeightValuePx,
} from './toast-stack.runtime';

const liveAnnounce = vi.fn();

const announcementService = {
  announce: liveAnnounce,
};

@Component({
  imports: [HellToaster],
  template: `<hell-toaster position="top-center" [maxVisible]="2" [ui]="ui()" />`,
})
class ToasterPartStyleHost {
  readonly objectUi = {
    root: 'w-[420px]',
    toast: 'rounded-none border-hell-danger',
    action: 'bg-hell-danger text-hell-foreground-inverse',
    close: 'text-hell-danger',
    dismissAll: 'bg-hell-danger text-hell-foreground-inverse',
  } satisfies HellToasterUi;

  readonly ui = signal<HellUiInput<HellToasterPart>>('static');
}

@Component({
  imports: [HellToaster],
  providers: [HellToastService],
  template: `
    <button data-test-show-template type="button" (click)="show()">Show template</button>
    <button data-test-complete-template type="button" (click)="complete()">Complete template</button>
    <ng-template #body let-toast>
      <button data-test-template-dismiss type="button" (click)="toast.dismiss()">
        Dismiss template
      </button>
    </ng-template>
    <hell-toaster />
  `,
})
class ToastTemplateHost {
  private readonly template = viewChild.required<TemplateRef<{ $implicit: HellToastRef }>>('body');
  private readonly toast = inject(HellToastService);
  private ref: HellToastRef | null = null;

  show(): void {
    this.ref = this.toast.show({
      template: this.template(),
      announcement: 'Template notification',
      duration: 0,
    });
  }

  complete(): void {
    this.ref?.update({
      template: null,
      title: 'Template complete',
      variant: 'success',
      duration: 1000,
    });
  }
}

function renderedToasts(fixture: ComponentFixture<unknown>): NodeListOf<HTMLElement> {
  return (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
    '[data-slot="toast"]',
  );
}

describe('Toast Stack', () => {
  it('computes front distance, offset, overflow, and exit snapshots from stack data', () => {
    const list = [
      { id: 1, removing: false },
      { id: 2, removing: true },
      { id: 3, removing: false },
      { id: 4, removing: false },
    ];
    const heights = new Map([
      [3, 80],
      [4, 70],
    ]);

    expect(hellToastFrontDistance(list, list[0])).toBe(2);
    expect(hellToastOffsetPx(list, list[0], heights)).toBe('174px');
    expect(hellToastOverflow(list, list[0], 2)).toBe(1);

    const snapshot = hellToastSnapshotExits(list, heights, new Map());

    expect(snapshot.get(2)).toEqual({ front: 2, offset: '174px' });
    expect(hellToastFrontDistance(list, list[1], snapshot)).toBe(2);
    expect(hellToastOffsetPx(list, list[1], heights, snapshot)).toBe('174px');
  });

  it('computes full scroll height and smooth edge progress for both viewport edges', () => {
    const list = [
      { id: 1, removing: false },
      { id: 2, removing: false },
      { id: 3, removing: false },
      { id: 4, removing: false },
    ];
    const heights = new Map(list.map((item) => [item.id, 64]));
    const stackHeight = hellToastStackHeightValuePx(list, heights);

    expect(stackHeight).toBe(292);
    expect(hellToastOffsetPx(list, list[0], heights)).toBe('228px');

    const newestAtTopScroll = hellToastScrollEdgeProgress(list, list[3], heights, {
      anchor: 'bottom',
      scrollTop: 0,
      viewportHeight: 140,
      stackHeight,
    });
    const oldestAtBottomScroll = hellToastScrollEdgeProgress(list, list[0], heights, {
      anchor: 'bottom',
      scrollTop: stackHeight - 140,
      viewportHeight: 140,
      stackHeight,
    });

    expect(newestAtTopScroll).toBe(3);
    expect(oldestAtBottomScroll).toBe(3);
    expect(hellToastScrollEdgeOpacity(0)).toBe(1);
    expect(hellToastScrollEdgeOpacity(3)).toBe(0);
  });
});

describe('HellToastService', () => {
  beforeEach(async () => {
    liveAnnounce.mockClear();
    await TestBed.configureTestingModule({
      imports: [HellToaster, ToastTemplateHost],
      providers: [{ provide: LiveAnnouncer, useValue: announcementService }],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns an immutable reference from show and every variant shortcut', () => {
    const svc = TestBed.inject(HellToastService);

    const refs = [
      svc.show({ title: 'Shown', duration: 0 }),
      svc.message('Message', { duration: 0 }),
      svc.success('Success', { duration: 0 }),
      svc.info('Info', { duration: 0 }),
      svc.warning('Warning', { duration: 0 }),
      svc.error('Error', { duration: 0 }),
    ];

    for (const ref of refs) {
      expect(Object.isFrozen(ref)).toBe(true);
      expect(ref).toEqual({ update: expect.any(Function), dismiss: expect.any(Function) });
      expect(ref).not.toHaveProperty('id');
    }
  });

  it('patches content and variant in place and clears nullable fields', () => {
    const fixture = TestBed.createComponent(HellToaster);
    const svc = TestBed.inject(HellToastService);
    fixture.detectChanges();

    const ref = svc.show({
      title: 'Saving',
      description: 'Report is processing',
      variant: 'info',
      duration: 0,
    });
    fixture.detectChanges();
    const original = renderedToasts(fixture)[0];

    ref.update({
      title: 'Saved',
      description: null,
      variant: 'success',
    });
    fixture.detectChanges();

    const updated = renderedToasts(fixture)[0];
    expect(renderedToasts(fixture)).toHaveLength(1);
    expect(updated).toBe(original);
    expect(updated.getAttribute('data-variant')).toBe('success');
    expect(updated.textContent).toContain('Saved');
    expect(updated.textContent).not.toContain('Report is processing');
  });

  it('announces new toast text via LiveAnnouncer', () => {
    const svc = TestBed.inject(HellToastService);

    svc.show({ title: 'Saved', description: 'Report generated', duration: 0 });

    expect(liveAnnounce).toHaveBeenCalledWith('Saved. Report generated', 'polite');
  });

  it('lets explicit announcement override normal toast text', () => {
    const svc = TestBed.inject(HellToastService);

    svc.show({
      title: 'Upload started',
      description: 'Preparing payload',
      announcement: 'Upload complete',
      duration: 0,
    });

    expect(liveAnnounce).toHaveBeenCalledWith('Upload complete', 'polite');
  });

  it('uses explicit announcement text for custom-template toasts', () => {
    const svc = TestBed.inject(HellToastService);

    svc.show({
      template: {} as TemplateRef<{ $implicit: HellToastRef }>,
      announcement: 'Upload complete',
      duration: 0,
    });

    expect(liveAnnounce).toHaveBeenCalledWith('Upload complete', 'polite');
  });

  it('falls back to a generic announcement for template-only toasts', () => {
    const svc = TestBed.inject(HellToastService);

    svc.show({
      template: {} as TemplateRef<{ $implicit: HellToastRef }>,
      duration: 0,
    });

    expect(liveAnnounce).toHaveBeenCalledWith('Notification', 'polite');
  });

  it('does not re-announce reference updates', () => {
    const svc = TestBed.inject(HellToastService);
    const ref = svc.show({ title: 'Saving', duration: 0 });

    ref.update({ title: 'Saved', description: 'Done', variant: 'success' });

    expect(liveAnnounce).toHaveBeenCalledTimes(1);
  });

  it('makes update and dismiss idempotent no-ops after dismissal begins', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(HellToaster);
    const svc = TestBed.inject(HellToastService);
    fixture.detectChanges();

    const ref = svc.show({ title: 'Saving', duration: 0 });
    fixture.detectChanges();
    ref.dismiss();
    ref.dismiss();
    ref.update({ title: 'Saved', variant: 'success', duration: 0 });
    fixture.detectChanges();

    expect(renderedToasts(fixture)).toHaveLength(1);
    expect(renderedToasts(fixture)[0].getAttribute('data-state')).toBe('closed');
    expect(renderedToasts(fixture)[0].textContent).toContain('Saving');
    expect(renderedToasts(fixture)[0].textContent).not.toContain('Saved');

    vi.advanceTimersByTime(220);
    fixture.detectChanges();
    ref.update({ title: 'Revived' });
    ref.dismiss();
    fixture.detectChanges();

    expect(renderedToasts(fixture)).toHaveLength(0);
  });

  it('auto-dismisses after the configured duration and exit animation', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(HellToaster);
    const svc = TestBed.inject(HellToastService);
    fixture.detectChanges();

    svc.show({ title: 'Saved', duration: 100 });
    fixture.detectChanges();
    vi.advanceTimersByTime(100);
    fixture.detectChanges();

    expect(renderedToasts(fixture)[0].getAttribute('data-state')).toBe('closed');

    vi.advanceTimersByTime(220);
    fixture.detectChanges();

    expect(renderedToasts(fixture)).toHaveLength(0);
  });

  it('only restarts the countdown when duration is explicitly patched', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(HellToaster);
    const svc = TestBed.inject(HellToastService);
    fixture.detectChanges();

    const original = svc.show({ title: 'Saving', duration: 1000 });
    fixture.detectChanges();
    vi.advanceTimersByTime(400);
    original.update({ title: 'Still saving' });
    fixture.detectChanges();
    vi.advanceTimersByTime(599);
    fixture.detectChanges();

    expect(renderedToasts(fixture)[0].getAttribute('data-state')).toBe('open');

    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(renderedToasts(fixture)[0].getAttribute('data-state')).toBe('closed');

    vi.advanceTimersByTime(220);
    const rescheduled = svc.show({ title: 'Uploading', duration: 1000 });
    fixture.detectChanges();
    vi.advanceTimersByTime(400);
    rescheduled.update({ duration: 800 });
    vi.advanceTimersByTime(799);
    fixture.detectChanges();

    expect(renderedToasts(fixture)[0].getAttribute('data-state')).toBe('open');

    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(renderedToasts(fixture)[0].getAttribute('data-state')).toBe('closed');
  });

  it('keeps duration patches paused while the stack is hovered and resumes on leave', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(HellToaster);
    const svc = TestBed.inject(HellToastService);
    fixture.detectChanges();

    const ref = svc.show({ title: 'Uploading', duration: 1000 });
    fixture.detectChanges();
    vi.advanceTimersByTime(400);
    const region = fixture.nativeElement.querySelector('[data-slot="region"]') as HTMLElement;
    region.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    ref.update({ duration: 500 });
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();

    expect(renderedToasts(fixture)[0].getAttribute('data-state')).toBe('open');

    region.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    vi.advanceTimersByTime(320);
    vi.advanceTimersByTime(499);
    fixture.detectChanges();
    expect(renderedToasts(fixture)[0].getAttribute('data-state')).toBe('open');

    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(renderedToasts(fixture)[0].getAttribute('data-state')).toBe('closed');
  });

  it('dismisses every mounted toast with the exit animation', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(HellToaster);
    const svc = TestBed.inject(HellToastService);
    fixture.detectChanges();

    svc.success('Saved', { duration: 0 });
    svc.info('Queued', { duration: 0 });
    fixture.detectChanges();

    svc.dismissAll();
    fixture.detectChanges();

    expect(renderedToasts(fixture)).toHaveLength(2);
    expect([...renderedToasts(fixture)].every((toast) => toast.dataset['state'] === 'closed')).toBe(
      true,
    );

    vi.advanceTimersByTime(220);
    fixture.detectChanges();

    expect(renderedToasts(fixture)).toHaveLength(0);
  });

  it('provides the same small reference to custom templates for dismissal', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(ToastTemplateHost);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-test-show-template]')
      ?.click();
    fixture.detectChanges();

    const dismiss = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-test-template-dismiss]',
    );
    expect(dismiss?.textContent).toContain('Dismiss template');
    dismiss?.click();
    fixture.detectChanges();

    expect(renderedToasts(fixture)[0].getAttribute('data-state')).toBe('closed');
  });

  it('can replace template content with title content through a nullable patch', () => {
    const fixture = TestBed.createComponent(ToastTemplateHost);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector<HTMLButtonElement>('[data-test-show-template]')?.click();
    fixture.detectChanges();
    expect(host.querySelector('[data-test-template-dismiss]')).not.toBeNull();

    host.querySelector<HTMLButtonElement>('[data-test-complete-template]')?.click();
    fixture.detectChanges();

    expect(renderedToasts(fixture)).toHaveLength(1);
    expect(renderedToasts(fixture)[0].getAttribute('data-variant')).toBe('success');
    expect(renderedToasts(fixture)[0].textContent).toContain('Template complete');
    expect(host.querySelector('[data-test-template-dismiss]')).toBeNull();
  });
});

describe('HellToaster', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HellToaster, ToasterPartStyleHost],
      providers: [{ provide: LiveAnnouncer, useValue: announcementService }],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('does not render an empty hit area before any toasts exist', () => {
    const fixture = TestBed.createComponent(HellToaster);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-slot="list"]')).toBeNull();
  });

  it('renders the toast hit area when toasts are mounted', () => {
    const fixture = TestBed.createComponent(HellToaster);
    const svc = TestBed.inject(HellToastService);
    fixture.detectChanges();

    svc.success('Saved', { duration: 0 });
    fixture.detectChanges();

    const region = fixture.nativeElement.querySelector('[data-slot="region"]') as HTMLElement;
    const list = fixture.nativeElement.querySelector('[data-slot="list"]') as HTMLOListElement;
    expect(region).not.toBeNull();
    expect(region.getAttribute('aria-live')).toBeNull();
    expect(region.getAttribute('aria-atomic')).toBeNull();
    expect(list).toBeInstanceOf(HTMLOListElement);
    expect(list.querySelectorAll('[data-slot="toast"]')).toHaveLength(1);
    expect(list.getAttribute('style')).toBeNull();
  });

  it('keeps renderer ids out of DOM while tracking toast heights with ResizeObserver', async () => {
    const originalResizeObserver = globalThis.ResizeObserver;
    TestToastResizeObserver.instances = [];
    globalThis.ResizeObserver = TestToastResizeObserver as unknown as typeof ResizeObserver;

    const fixture = TestBed.createComponent(HellToaster);
    try {
      const svc = TestBed.inject(HellToastService);
      fixture.detectChanges();

      svc.success('Measured', { duration: 0 });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const toast = renderedToasts(fixture)[0];
      expect(toast.hasAttribute('data-toast-id')).toBe(false);

      Object.defineProperty(toast, 'offsetHeight', {
        configurable: true,
        value: 91,
      });
      const observer = TestToastResizeObserver.instances.find((instance) =>
        instance.observed.has(toast),
      );
      if (!observer) throw new Error('Expected ResizeObserver to track the toast.');

      observer.trigger(toast);
      fixture.detectChanges();

      expect(toast.style.getPropertyValue('--hell-toast-h')).toBe('91px');
      expect(toast.hasAttribute('data-toast-id')).toBe(false);
    } finally {
      fixture.destroy();
      globalThis.ResizeObserver = originalResizeObserver;
    }
  });

  it('renders a toaster-owned dismiss-all control and focusable scroll viewport for stacks', () => {
    const fixture = TestBed.createComponent(HellToaster);
    const svc = TestBed.inject(HellToastService);
    fixture.detectChanges();

    svc.success('One', { duration: 0 });
    svc.success('Two', { duration: 0 });
    svc.success('Three', { duration: 0 });
    svc.success('Four', { duration: 0 });
    fixture.detectChanges();

    const region = fixture.nativeElement.querySelector('[data-slot="region"]') as HTMLElement;
    const viewport = fixture.nativeElement.querySelector('[data-slot="viewport"]') as HTMLElement;
    const dismissAll = fixture.nativeElement.querySelector(
      '[data-slot="dismissAll"]',
    ) as HTMLButtonElement;

    expect(viewport.getAttribute('aria-label')).toBe('Notification stack');
    expect(viewport.getAttribute('tabindex')).toBe('0');
    expect(dismissAll.textContent?.trim()).toContain('Dismiss all');
    expect(dismissAll.getAttribute('aria-label')).toBe('Dismiss all');
    expect(dismissAll.getAttribute('tabindex')).toBe('-1');

    region.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.getAttribute('data-expanded')).toBe('true');
    expect(dismissAll.getAttribute('tabindex')).toBeNull();
  });

  it('passes a toast-scoped dismiss callback to actions', () => {
    const fixture = TestBed.createComponent(HellToaster);
    const svc = TestBed.inject(HellToastService);
    const acted = vi.fn();
    fixture.detectChanges();

    svc.message('Moved to trash', {
      duration: 0,
      action: {
        label: 'Undo',
        onClick: (dismiss) => {
          acted();
          dismiss();
        },
      },
    });
    fixture.detectChanges();

    const action = fixture.nativeElement.querySelector('[data-slot="action"]') as HTMLButtonElement;
    action.click();
    fixture.detectChanges();

    expect(acted).toHaveBeenCalledOnce();
    expect(renderedToasts(fixture)[0].getAttribute('data-state')).toBe('closed');
  });

  it('applies Part Style Map shorthand and object classes to owned stack parts', () => {
    const fixture = TestBed.createComponent(ToasterPartStyleHost);
    const host = fixture.componentInstance;
    const svc = TestBed.inject(HellToastService);
    const onAction = vi.fn();
    fixture.detectChanges();

    svc.success('One', { duration: 0 });
    fixture.detectChanges();

    // The consumer ui classes are the test's own contract fixtures; recipe
    // conflict resolution is owned centrally by the Part-Class Pipeline spec.
    const root = fixture.nativeElement.querySelector('hell-toaster') as HTMLElement;
    expect(root.getAttribute('data-slot')).toBe('root');
    expect(root.className).toContain('static');

    host.ui.set(host.objectUi);
    svc.info('Two', {
      duration: 0,
      action: { label: 'Undo', onClick: onAction },
    });
    fixture.detectChanges();

    const toast = fixture.nativeElement.querySelector('[data-slot="toast"]') as HTMLElement;
    const action = fixture.nativeElement.querySelector('[data-slot="action"]') as HTMLButtonElement;
    const close = fixture.nativeElement.querySelector('[data-slot="close"]') as HTMLButtonElement;
    const dismissAll = fixture.nativeElement.querySelector(
      '[data-slot="dismissAll"]',
    ) as HTMLButtonElement;

    expect(root.className).toContain('w-[420px]');
    expect(toast.className).toContain('rounded-none');
    expect(toast.className).toContain('border-hell-danger');
    expect(action.className).toContain('bg-hell-danger');
    expect(close.className).toContain('text-hell-danger');
    expect(dismissAll.className).toContain('bg-hell-danger');
  });

  describe('recipes', () => {
    // Part-Class Pipeline merge semantics are owned centrally by
    // `internal/core/part-class-pipeline.spec.ts`; the snapshot pins the default part
    // classes without asserting individual utilities elsewhere.
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(HellToaster);
      const svc = TestBed.inject(HellToastService);
      fixture.detectChanges();

      svc.success('One', { duration: 0, action: { label: 'Undo', onClick: () => void 0 } });
      svc.success('Two', { duration: 0 });
      fixture.detectChanges();

      const root = fixture.nativeElement as HTMLElement;
      const partClasses = (slot: string): string[] => {
        const element = root.matches(`[data-slot="${slot}"]`)
          ? root
          : root.querySelector(`[data-slot="${slot}"]`);
        return (element?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean).sort();
      };

      expect({
        root: partClasses('root'),
        region: partClasses('region'),
        viewport: partClasses('viewport'),
        toast: partClasses('toast'),
        action: partClasses('action'),
        close: partClasses('close'),
        dismissAll: partClasses('dismissAll'),
      }).toMatchSnapshot('toast');
    });
  });

  it('keeps collapsed overflow toast controls out of the tab order until expansion', () => {
    const fixture = TestBed.createComponent(HellToaster);
    const svc = TestBed.inject(HellToastService);
    fixture.detectChanges();

    svc.success('One', { duration: 0 });
    svc.success('Two', { duration: 0 });
    svc.success('Three', { duration: 0 });
    svc.success('Four', { duration: 0 });
    fixture.detectChanges();

    const region = fixture.nativeElement.querySelector('[data-slot="region"]') as HTMLElement;
    const overflowToast = fixture.nativeElement.querySelector(
      '[data-slot="toast"][data-visible="false"]',
    ) as HTMLLIElement;
    const close = overflowToast.querySelector('[data-slot="close"]') as HTMLButtonElement;

    expect(overflowToast.getAttribute('aria-hidden')).toBe('true');
    expect(close.getAttribute('tabindex')).toBe('-1');

    region.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();

    expect(overflowToast.getAttribute('aria-hidden')).toBeNull();
    expect(close.getAttribute('tabindex')).toBeNull();
  });

  it('waits for viewport height transition before resetting collapsed scroll', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(HellToaster);
    const svc = TestBed.inject(HellToastService);
    fixture.detectChanges();

    svc.success('One', { duration: 0 });
    svc.success('Two', { duration: 0 });
    svc.success('Three', { duration: 0 });
    svc.success('Four', { duration: 0 });
    fixture.detectChanges();

    const region = fixture.nativeElement.querySelector('[data-slot="region"]') as HTMLElement;
    const viewport = fixture.nativeElement.querySelector('[data-slot="viewport"]') as HTMLElement;
    const win = viewport.ownerDocument.defaultView;
    if (!win) throw new Error('Expected window');
    vi.spyOn(win, 'getComputedStyle').mockImplementation((element) => {
      if (element !== viewport) return {} as CSSStyleDeclaration;
      return {
        transitionProperty: 'height',
        transitionDuration: '1s',
        transitionDelay: '0s',
      } as CSSStyleDeclaration;
    });
    let scrollTop = 0;
    Object.defineProperty(viewport, 'scrollTop', {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = value;
      },
    });

    region.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();
    vi.advanceTimersByTime(0);
    expect(fixture.nativeElement.getAttribute('data-expanded')).toBe('true');
    viewport.scrollTop = 72;

    region.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    vi.advanceTimersByTime(320);
    fixture.detectChanges();

    expect(fixture.nativeElement.getAttribute('data-expanded')).toBeNull();
    vi.advanceTimersByTime(999);
    expect(scrollTop).toBe(72);

    const toast = fixture.nativeElement.querySelector('[data-slot="toast"]') as HTMLElement;
    const childTransitionEnd = new Event('transitionend', { bubbles: true }) as TransitionEvent;
    Object.defineProperty(childTransitionEnd, 'propertyName', { value: 'transform' });
    toast.dispatchEvent(childTransitionEnd);
    expect(scrollTop).toBe(72);

    const transitionEnd = new Event('transitionend', { bubbles: true }) as TransitionEvent;
    Object.defineProperty(transitionEnd, 'propertyName', { value: 'height' });
    viewport.dispatchEvent(transitionEnd);

    expect(scrollTop).toBe(0);
  });

  it('resets collapsed scroll on a timer when height has no transition duration', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(HellToaster);
    const svc = TestBed.inject(HellToastService);
    fixture.detectChanges();

    svc.success('One', { duration: 0 });
    svc.success('Two', { duration: 0 });
    svc.success('Three', { duration: 0 });
    svc.success('Four', { duration: 0 });
    fixture.detectChanges();

    const region = fixture.nativeElement.querySelector('[data-slot="region"]') as HTMLElement;
    const viewport = fixture.nativeElement.querySelector('[data-slot="viewport"]') as HTMLElement;
    const win = viewport.ownerDocument.defaultView;
    if (!win) throw new Error('Expected window');
    vi.spyOn(win, 'getComputedStyle').mockImplementation((element) => {
      if (element !== viewport) return {} as CSSStyleDeclaration;
      return {
        transitionProperty: 'height',
        transitionDuration: '0s',
        transitionDelay: '0s',
      } as CSSStyleDeclaration;
    });
    let scrollTop = 0;
    Object.defineProperty(viewport, 'scrollTop', {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = value;
      },
    });

    region.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();
    vi.advanceTimersByTime(0);
    viewport.scrollTop = 72;

    region.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    vi.advanceTimersByTime(320);
    fixture.detectChanges();

    expect(fixture.nativeElement.getAttribute('data-expanded')).toBeNull();
    vi.advanceTimersByTime(49);
    expect(scrollTop).toBe(72);

    vi.advanceTimersByTime(1);
    expect(scrollTop).toBe(0);
  });
});

class TestToastResizeObserver {
  static instances: TestToastResizeObserver[] = [];
  readonly observed = new Set<Element>();

  constructor(private readonly callback: ResizeObserverCallback) {
    TestToastResizeObserver.instances.push(this);
  }

  observe(element: Element): void {
    this.observed.add(element);
  }

  disconnect(): void {
    this.observed.clear();
  }

  trigger(element: Element): void {
    const entry = { target: element } as ResizeObserverEntry;
    this.callback([entry], this as unknown as ResizeObserver);
  }
}
