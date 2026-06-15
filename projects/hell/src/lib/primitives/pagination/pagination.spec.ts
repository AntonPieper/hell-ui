import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideHellLabels } from '../../core/labels';
import {
  HellPagination,
  HellPaginationFirst,
  HellPaginationNext,
  HellPaginationStrip,
  type HellPaginationMode,
} from './pagination';

@Component({
  imports: [HellPaginationStrip],
  template: `
    <hell-pagination
      [page]="page()"
      [pageCount]="pageCount()"
      [siblingCount]="siblingCount()"
      (pageChange)="pageEvents.push($event)"
    />
  `,
})
class PaginationHost {
  readonly page = signal(6);
  readonly pageCount = signal(10);
  readonly siblingCount = signal(2);
  readonly pageEvents: number[] = [];
}

@Component({
  imports: [HellPaginationStrip],
  template: `
    <hell-pagination
      [mode]="mode()"
      [page]="page()"
      [pageCount]="pageCount()"
      [disabled]="disabled()"
      (pageChange)="pageEvents.push($event)"
    />
  `,
})
class PaginationModeHost {
  readonly mode = signal<HellPaginationMode>('previous-next');
  readonly page = signal(1);
  readonly pageCount = signal(5);
  readonly disabled = signal(false);
  readonly pageEvents: number[] = [];
}

@Component({
  imports: [HellPagination, HellPaginationFirst],
  template: `
    <nav hellPagination [page]="page()" [pageCount]="pageCount()">
      <a hellPaginationFirst href="#first">First</a>
    </nav>
  `,
})
class PaginationAnchorHost {
  readonly page = signal(1);
  readonly pageCount = signal(3);
}

@Component({
  imports: [HellPagination, HellPaginationNext],
  template: `
    <nav hellPagination [page]="2" [pageCount]="3">
      <button id="disabled-next-button" hellPaginationNext type="button" disabled>Next</button>
      <a id="disabled-next-anchor" hellPaginationNext href="#next" disabled>Next</a>
    </nav>
  `,
})
class PaginationExplicitDisabledHost {}

@Component({
  imports: [HellPaginationStrip],
  providers: [
    provideHellLabels({
      pagination: {
        navigation: 'Seiten',
        nextPage: 'Nächste Seite',
        page: (page) => `Seite ${page}`,
      },
    }),
  ],
  template: `<hell-pagination [page]="1" [pageCount]="3" />`,
})
class LocalizedPaginationHost {}

describe('HellPaginationStrip', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PaginationHost,
        PaginationModeHost,
        PaginationAnchorHost,
        PaginationExplicitDisabledHost,
        LocalizedPaginationHost,
      ],
    }).compileComponents();
  });

  it('renders a clamped sibling window around the current page', () => {
    const fixture = TestBed.createComponent(PaginationHost);
    fixture.detectChanges();

    expect(pageButtonLabels(fixture.nativeElement)).toEqual(['4', '5', '6', '7', '8']);

    fixture.componentInstance.page.set(1);
    fixture.detectChanges();

    expect(pageButtonLabels(fixture.nativeElement)).toEqual(['1', '2', '3', '4', '5']);

    fixture.componentInstance.page.set(10);
    fixture.detectChanges();

    expect(pageButtonLabels(fixture.nativeElement)).toEqual(['6', '7', '8', '9', '10']);
  });

  it('guards disabled anchor pagination controls', () => {
    const fixture = TestBed.createComponent(PaginationAnchorHost);
    fixture.detectChanges();

    const first = fixture.nativeElement.querySelector(
      'a[hellPaginationFirst]',
    ) as HTMLAnchorElement;
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    expect(first.getAttribute('aria-disabled')).toBe('true');
    expect(first.getAttribute('tabindex')).toBe('-1');
    expect(first.dispatchEvent(click)).toBe(false);
    expect(click.defaultPrevented).toBe(true);
  });

  it('forwards explicit disabled state to navigation controls', () => {
    const fixture = TestBed.createComponent(PaginationExplicitDisabledHost);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '#disabled-next-button',
    ) as HTMLButtonElement;
    const anchor = fixture.nativeElement.querySelector(
      '#disabled-next-anchor',
    ) as HTMLAnchorElement;
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    expect(button.disabled).toBe(true);
    expect(anchor.getAttribute('aria-disabled')).toBe('true');
    expect(anchor.getAttribute('tabindex')).toBe('-1');
    expect(anchor.dispatchEvent(click)).toBe(false);
    expect(click.defaultPrevented).toBe(true);
  });

  it('uses injected labels for the ready-made strip', () => {
    const fixture = TestBed.createComponent(LocalizedPaginationHost);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('hell-pagination') as HTMLElement;
    expect(nav.getAttribute('aria-label')).toBe('Seiten');
    expect(button(fixture.nativeElement, 'First page')).toBeInstanceOf(HTMLButtonElement);
    expect(button(fixture.nativeElement, 'Seite 2').textContent?.trim()).toBe('2');
    expect(button(fixture.nativeElement, 'Nächste Seite')).toBeInstanceOf(HTMLButtonElement);
  });

  it('emits page changes from numbered and navigation buttons', () => {
    const fixture = TestBed.createComponent(PaginationHost);
    fixture.detectChanges();

    button(fixture.nativeElement, 'Page 8').click();
    button(fixture.nativeElement, 'Next page').click();
    button(fixture.nativeElement, 'Previous page').click();
    button(fixture.nativeElement, 'First page').click();
    button(fixture.nativeElement, 'Last page').click();

    expect(fixture.componentInstance.pageEvents).toEqual([8, 7, 5, 1, 10]);
  });

  it('renders explicit previous-next mode with boundary disabled state', () => {
    const fixture = TestBed.createComponent(PaginationModeHost);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const nav = root.querySelector('hell-pagination') as HTMLElement;

    expect(nav.getAttribute('data-mode')).toBe('previous-next');
    expect(buttonLabels(root)).toEqual(['Previous page', 'Next page']);
    expect(root.textContent).toContain('Page 1 of 5');
    expect(button(root, 'Previous page').disabled).toBe(true);

    button(root, 'Previous page').click();
    button(root, 'Next page').click();
    expect(fixture.componentInstance.pageEvents).toEqual([2]);

    fixture.componentInstance.page.set(5);
    fixture.detectChanges();

    expect(button(root, 'Next page').disabled).toBe(true);
  });

  it('renders jump mode as previous/select/next and emits selected pages', () => {
    const fixture = TestBed.createComponent(PaginationModeHost);
    fixture.componentInstance.mode.set('jump');
    fixture.componentInstance.page.set(2);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const select = root.querySelector('select[hellNativeSelect]') as HTMLSelectElement;

    expect(buttonLabels(root)).toEqual(['Previous page', 'Next page']);
    expect(select.getAttribute('aria-label')).toBe('Page');
    expect(select.value).toBe('2');
    expect(root.textContent).toContain('of 5');

    select.value = '4';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(fixture.componentInstance.pageEvents).toEqual([4]);

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(select.disabled).toBe(true);
    select.value = '5';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(fixture.componentInstance.pageEvents).toEqual([4]);
  });

  it('supports keyboard activation for numbered and navigation controls', () => {
    const fixture = TestBed.createComponent(PaginationHost);
    fixture.detectChanges();

    dispatchKey(button(fixture.nativeElement, 'Page 8'), ' ');
    dispatchKey(button(fixture.nativeElement, 'Next page'), 'Enter');

    expect(fixture.componentInstance.pageEvents).toEqual([8, 7]);
  });
});

function pageButtonLabels(root: HTMLElement): string[] {
  return Array.from(root.querySelectorAll<HTMLButtonElement>('button[aria-label^="Page "]')).map(
    (button) => button.textContent?.trim() ?? '',
  );
}

function button(root: HTMLElement, ariaLabel: string): HTMLButtonElement {
  const element = root.querySelector(`button[aria-label="${ariaLabel}"]`);
  if (!(element instanceof HTMLButtonElement)) throw new Error(`Expected ${ariaLabel} button.`);
  return element;
}

function buttonLabels(root: HTMLElement): string[] {
  return Array.from(root.querySelectorAll<HTMLButtonElement>('button')).map(
    (element) => element.getAttribute('aria-label') ?? '',
  );
}

function dispatchKey(element: HTMLElement, key: string): void {
  element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}
