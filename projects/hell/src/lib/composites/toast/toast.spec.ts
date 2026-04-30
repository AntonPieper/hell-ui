import { TestBed } from '@angular/core/testing';

import { HellToastService, HellToaster } from './toast';

describe('HellToastService', () => {
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
});

describe('HellToaster', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HellToaster],
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

    const list = fixture.nativeElement.querySelector('[data-slot="list"]') as HTMLOListElement;
    expect(list).not.toBeNull();
    expect(list.querySelectorAll('[data-slot="toast"]')).toHaveLength(1);
  });
});
