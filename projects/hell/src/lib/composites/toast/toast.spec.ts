import type { TemplateRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';

import { HellToastService, HellToaster } from './toast';
import {
  hellToastFrontDistance,
  hellToastOffsetPx,
  hellToastOverflow,
  hellToastSnapshotExits,
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
    expect(hellToastOffsetPx(list, list[0], heights, 3)).toBe('174px');
    expect(hellToastOverflow(list, list[0], 2)).toBe(1);

    const snapshot = hellToastSnapshotExits(list, heights, 3, new Map());

    expect(snapshot.get(2)).toEqual({ front: 2, offset: '174px' });
    expect(hellToastFrontDistance(list, list[1], snapshot)).toBe(2);
    expect(hellToastOffsetPx(list, list[1], heights, 3, snapshot)).toBe('174px');
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
});
