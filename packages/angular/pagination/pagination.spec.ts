import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HellPagination,
  HellPaginationButton,
  HellPaginationFirst,
  HellPaginationLast,
  HellPaginationNext,
  HellPaginationPrev,
  HellPaginationStrip,
  type HellPaginationButtonUi,
  type HellPaginationFirstUi,
  type HellPaginationLastUi,
  type HellPaginationMode,
  type HellPaginationNextUi,
  type HellPaginationPrevUi,
  type HellPaginationStripUi,
  provideHellPaginationLabels,
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
    provideHellPaginationLabels({
      navigation: 'Seiten',
      nextPage: 'Nächste Seite',
      page: (page) => `Seite ${page}`,
    }),
  ],
  template: `<hell-pagination [page]="1" [pageCount]="3" />`,
})
class LocalizedPaginationHost {}

@Component({
  imports: [
    HellPagination,
    HellPaginationFirst,
    HellPaginationPrev,
    HellPaginationButton,
    HellPaginationNext,
    HellPaginationLast,
    HellPaginationStrip,
  ],
  template: `
    <nav
      id="ui-root"
      hellPagination
      ui="gap-hell-4 bg-hell-surface-muted"
      [page]="page()"
      [pageCount]="pageCount()"
      (pageChange)="pageEvents.push($event)"
    >
      <button id="ui-first" hellPaginationFirst type="button" [ui]="firstUi">First</button>
      <button id="ui-prev" hellPaginationPrev type="button" [ui]="prevUi">Prev</button>
      <button id="ui-page" hellPaginationButton type="button" [page]="2" [ui]="buttonUi">
        2
      </button>
      <button id="ui-next" hellPaginationNext type="button" [ui]="nextUi">Next</button>
      <button id="ui-last" hellPaginationLast type="button" [ui]="lastUi">Last</button>
    </nav>

    <hell-pagination
      id="ui-strip"
      mode="jump"
      [page]="2"
      [pageCount]="pageCount()"
      [ui]="stripUi"
    />
  `,
})
class PaginationUiHost {
  readonly page = signal(2);
  readonly pageCount = signal(4);
  readonly pageEvents: number[] = [];
  protected readonly firstUi = 'bg-hell-danger px-hell-7' satisfies HellPaginationFirstUi['root'];
  protected readonly prevUi = {
    root: 'bg-hell-surface-muted px-hell-6',
  } satisfies HellPaginationPrevUi;
  protected readonly buttonUi = {
    root: 'rounded-hell-pill bg-hell-primary px-hell-8',
  } satisfies HellPaginationButtonUi;
  protected readonly nextUi = {
    root: 'border-hell-danger px-hell-5',
  } satisfies HellPaginationNextUi;
  protected readonly lastUi = {
    root: 'bg-hell-danger px-hell-7',
  } satisfies HellPaginationLastUi;
  protected readonly stripUi = {
    root: 'gap-hell-4 bg-hell-surface-muted',
    control: 'rounded-hell-pill px-hell-9',
    controlGlyph: 'text-hell-danger text-lg',
    jump: 'gap-hell-4 text-hell-danger',
    jumpSelect: 'min-w-[calc(var(--spacing)*24)]',
  } satisfies HellPaginationStripUi;
}

describe('HellPaginationStrip', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PaginationHost,
        PaginationModeHost,
        PaginationAnchorHost,
        PaginationExplicitDisabledHost,
        LocalizedPaginationHost,
        PaginationUiHost,
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
    expect(select.getAttribute('data-slot')).toBe('jumpSelect');
    expect(root.querySelector('[data-slot="jumpSelect"]')).toBeInstanceOf(HTMLElement);
    expect(select.classList.contains('appearance-none')).toBe(true);
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

  it('merges pagination ui classes through local roots and strip anatomy parts', () => {
    const fixture = TestBed.createComponent(PaginationUiHost);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const pagination = query(root, '#ui-root');
    const first = query(root, '#ui-first');
    const prev = query(root, '#ui-prev');
    const numbered = query(root, '#ui-page');
    const next = query(root, '#ui-next');
    const last = query(root, '#ui-last');
    const strip = query(root, '#ui-strip');
    const stripGlyph = query(strip, '[data-slot="controlGlyph"]');
    const jump = query(strip, '[data-slot="jump"]');
    const jumpSelect = query(strip, '[data-slot="jumpSelect"]') as HTMLSelectElement;
    const stripPrev = strip.querySelector('[hellPaginationPrev]') as HTMLButtonElement;
    const stripNext = strip.querySelector('[hellPaginationNext]') as HTMLButtonElement;

    expect(pagination.classList.contains('hell-pagination')).toBe(false);
    expect(pagination.getAttribute('data-slot')).toBe('root');
    expect(pagination.className).toContain('gap-hell-4');
    expect(pagination.className).not.toContain('gap-hell-1');

    for (const control of [first, prev, numbered, next, last]) {
      expect(control.classList.contains('hell-button')).toBe(false);
      expect(control.classList.contains('hell-pagination-item')).toBe(false);
      expect(control.getAttribute('data-slot')).toBe('root');
      expect(control.getAttribute('data-variant')).toBe('ghost');
      expect(control.getAttribute('data-icon-only')).toBe('');
    }

    expect(first.className).toContain('bg-hell-danger');
    expect(first.className).toContain('px-hell-7');
    expect(prev.className).toContain('bg-hell-surface-muted');
    expect(prev.className).toContain('px-hell-6');
    expect(numbered.className).toContain('rounded-hell-pill');
    expect(numbered.className).toContain('px-hell-8');
    expect(next.className).toContain('border-hell-danger');
    expect(next.className).toContain('px-hell-5');
    expect(last.className).toContain('bg-hell-danger');
    expect(last.className).toContain('px-hell-7');

    expect(strip.classList.contains('hell-pagination')).toBe(false);
    expect(strip.getAttribute('data-slot')).toBe('root');
    expect(strip.getAttribute('data-mode')).toBe('jump');
    expect(strip.className).toContain('gap-hell-4');
    expect(jump.className).toContain('text-hell-danger');
    expect(jump.className).toContain('gap-hell-4');
    expect(jumpSelect.tagName).toBe('SELECT');
    expect(jumpSelect.className).toContain('min-w-[calc(var(--spacing)*24)]');
    expect(jumpSelect.className).toContain('h-hell-control-sm');
    expect(stripGlyph.className).toContain('text-hell-danger');

    for (const control of [stripPrev, stripNext]) {
      expect(control.getAttribute('data-slot')).toBe('control');
      expect(control.className).toContain('rounded-hell-pill');
      expect(control.className).toContain('px-hell-9');
      expect(control.className).toContain('h-hell-control-sm');
    }
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

function query(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element;
}
