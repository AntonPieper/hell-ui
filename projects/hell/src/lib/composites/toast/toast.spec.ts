import type { TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';

import { HellToastService, HellToaster } from './toast';
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
  beforeEach(() => {
    liveAnnounce.mockClear();
    TestBed.configureTestingModule({
      providers: [{ provide: LiveAnnouncer, useValue: announcementService }],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates an existing toast in place when callers reuse an id', () => {
    const svc = TestBed.inject(HellToastService);

    const id = svc.show({ title: 'Saving', duration: 0 });
    const updated = svc.show({
      id,
      title: 'Saved',
      description: 'Report is ready',
      variant: 'success',
      duration: 0,
    });

    expect(updated).toBe(id);
    expect(svc.toasts()).toHaveLength(1);
    expect(svc.toasts()[0]).toMatchObject({
      id,
      title: 'Saved',
      description: 'Report is ready',
      variant: 'success',
    });
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
      template: {} as TemplateRef<{ $implicit: { id: number; dismiss: () => void } }>,
      announcement: 'Upload complete',
      duration: 0,
    });

    expect(liveAnnounce).toHaveBeenCalledWith('Upload complete', 'polite');
  });

  it('falls back to a generic announcement for template-only toasts', () => {
    const svc = TestBed.inject(HellToastService);

    svc.show({
      template: {} as TemplateRef<{ $implicit: { id: number; dismiss: () => void } }>,
      duration: 0,
    });

    expect(liveAnnounce).toHaveBeenCalledWith('Notification', 'polite');
  });

  it('does not re-announce when updating by existing toast id', () => {
    const svc = TestBed.inject(HellToastService);
    const sharedId = svc.show({ title: 'Saving', duration: 0 });

    svc.show({ id: sharedId, title: 'Saved', description: 'Done', duration: 0 });

    expect(liveAnnounce).toHaveBeenCalledTimes(1);
  });

  it('does not let a stale exit timer remove a revived toast id', () => {
    vi.useFakeTimers();
    const svc = TestBed.inject(HellToastService);

    const id = svc.show({ title: 'Saving', duration: 0 });
    svc.dismiss(id);
    vi.advanceTimersByTime(100);
    svc.show({ id, title: 'Saved', duration: 0 });
    vi.advanceTimersByTime(120);

    expect(svc.toasts()).toMatchObject([{ id, title: 'Saved', removing: false }]);
  });

  it('auto-dismisses after the configured duration and exit animation', () => {
    vi.useFakeTimers();
    const svc = TestBed.inject(HellToastService);

    const id = svc.show({ title: 'Saved', duration: 100 });
    vi.advanceTimersByTime(100);

    expect(svc.toasts()).toMatchObject([{ id, removing: true }]);

    vi.advanceTimersByTime(220);

    expect(svc.toasts()).toEqual([]);
  });

  it('pauses and resumes auto-dismiss with the remaining duration', () => {
    vi.useFakeTimers();
    const svc = TestBed.inject(HellToastService);

    const id = svc.show({ title: 'Uploading', duration: 1000 });
    vi.advanceTimersByTime(400);
    svc.pauseAll();
    vi.advanceTimersByTime(1000);

    expect(svc.toasts()).toMatchObject([{ id, removing: false }]);

    svc.resumeAll();
    vi.advanceTimersByTime(599);
    expect(svc.toasts()).toMatchObject([{ id, removing: false }]);

    vi.advanceTimersByTime(1);
    expect(svc.toasts()).toMatchObject([{ id, removing: true }]);
  });

  it('keeps pause and resume idempotent', () => {
    vi.useFakeTimers();
    const svc = TestBed.inject(HellToastService);

    const id = svc.show({ title: 'Uploading', duration: 1000 });
    vi.advanceTimersByTime(400);
    svc.pauseAll();
    svc.pauseAll();
    vi.advanceTimersByTime(1000);

    expect(svc.toasts()).toMatchObject([{ id, removing: false }]);

    svc.resumeAll();
    svc.resumeAll();
    vi.advanceTimersByTime(599);
    expect(svc.toasts()).toMatchObject([{ id, removing: false }]);

    vi.advanceTimersByTime(1);
    expect(svc.toasts()).toMatchObject([{ id, removing: true }]);
  });

  it('dismisses every mounted toast with the exit animation', () => {
    vi.useFakeTimers();
    const svc = TestBed.inject(HellToastService);

    svc.success('Saved', { duration: 0 });
    svc.info('Queued', { duration: 0 });

    svc.dismissAll();

    expect(svc.toasts()).toHaveLength(2);
    expect(svc.toasts().every((toast) => toast.removing)).toBe(true);

    vi.advanceTimersByTime(220);

    expect(svc.toasts()).toEqual([]);
  });
});

describe('HellToaster', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HellToaster],
      providers: [{ provide: LiveAnnouncer, useValue: announcementService }],
    }).compileComponents();
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
      '[data-slot="dismiss-all"]',
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
});
