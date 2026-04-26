import { TestBed } from '@angular/core/testing';

import { HellToastService, HellToaster } from './toast';

describe('HellToaster', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HellToaster],
    }).compileComponents();
  });

  it('does not render an empty hit area before any toasts exist', () => {
    const fixture = TestBed.createComponent(HellToaster);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.hell-toaster-list')).toBeNull();
  });

  it('renders the toast hit area when toasts are mounted', () => {
    const fixture = TestBed.createComponent(HellToaster);
    const svc = TestBed.inject(HellToastService);
    fixture.detectChanges();

    svc.success('Saved', { duration: 0 });
    fixture.detectChanges();

    const list = fixture.nativeElement.querySelector('.hell-toaster-list') as HTMLOListElement;
    expect(list).not.toBeNull();
    expect(list.querySelectorAll('.hell-toast')).toHaveLength(1);
  });
});
