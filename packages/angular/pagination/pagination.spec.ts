import { Component, computed, signal } from '@angular/core';
import { provideHellLabels } from '@hell-ui/angular/core';
import { HellNativeSelect } from '@hell-ui/angular/select';
import { TestBed } from '@angular/core/testing';

import { HellPageLink, HellPagination, HellPaginationStrip, type HellPaginationStripUi, HELL_PAGINATION_LABELS } from './pagination';

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
  imports: [HellPagination, HellPageLink, HellNativeSelect],
  template: `
    <nav
      id="compact-recipe"
      hellPagination
      [page]="page()"
      [pageCount]="pageCount()"
      [disabled]="disabled()"
      (pageChange)="pageEvents.push($event)"
      aria-label="Pagination"
    >
      <button hellPageLink="previous" type="button" aria-label="Previous page">&lsaquo;</button>
      <span aria-live="polite">Page {{ page() }} of {{ pageCount() }}</span>
      <button hellPageLink="next" type="button" aria-label="Next page">&rsaquo;</button>
    </nav>

    <nav
      id="jump-recipe"
      hellPagination
      [page]="page()"
      [pageCount]="pageCount()"
      [disabled]="disabled()"
      (pageChange)="pageEvents.push($event)"
      aria-label="Pagination"
    >
      <button hellPageLink="previous" type="button" aria-label="Previous page">&lsaquo;</button>
      <label>
        Page
        <select
          hellNativeSelect
          size="sm"
          aria-label="Page"
          [value]="page()"
          [disabled]="disabled() || pageCount() < 2"
          (change)="jumpTo($event)"
        >
          @for (p of pageOptions(); track p) {
            <option [value]="p" [selected]="p === page()">{{ p }}</option>
          }
        </select>
        of {{ pageCount() }}
      </label>
      <button hellPageLink="next" type="button" aria-label="Next page">&rsaquo;</button>
    </nav>
  `,
})
class PaginationRecipesHost {
  readonly page = signal(1);
  readonly pageCount = signal(5);
  readonly disabled = signal(false);
  readonly pageEvents: number[] = [];
  readonly pageOptions = computed(() =>
    Array.from({ length: this.pageCount() }, (_, i) => i + 1),
  );

  jumpTo(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const page = Number.parseInt(target.value, 10);
    if (Number.isFinite(page)) this.pageEvents.push(page);
  }
}

@Component({
  imports: [HellPagination, HellPageLink],
  template: `
    <nav
      hellPagination
      [page]="page()"
      [pageCount]="pageCount()"
      [disabled]="disabled()"
      (pageChange)="pageEvents.push($event)"
    >
      <button id="first" hellPageLink="first" type="button" aria-label="First page">First</button>
      <button id="previous" hellPageLink="previous" type="button" aria-label="Previous page">
        Prev
      </button>
      <button id="page-2" [hellPageLink]="2" type="button" aria-label="Page 2">2</button>
      <button id="page-3" [hellPageLink]="3" type="button" aria-label="Page 3">3</button>
      <button id="next" hellPageLink="next" type="button" aria-label="Next page">Next</button>
      <button id="last" hellPageLink="last" type="button" aria-label="Last page">Last</button>
    </nav>
  `,
})
class PaginationRolesHost {
  readonly page = signal(3);
  readonly pageCount = signal(5);
  readonly disabled = signal(false);
  readonly pageEvents: number[] = [];
}

@Component({
  imports: [HellPagination, HellPageLink],
  template: `
    <nav hellPagination [page]="page()" [pageCount]="pageCount()">
      <a hellPageLink="first" href="#first">First</a>
    </nav>
  `,
})
class PaginationAnchorHost {
  readonly page = signal(1);
  readonly pageCount = signal(3);
}

@Component({
  imports: [HellPagination, HellPageLink],
  template: `
    <nav hellPagination [page]="2" [pageCount]="3">
      <button id="disabled-next-button" hellPageLink="next" type="button" disabled>Next</button>
      <a id="disabled-next-anchor" hellPageLink="next" href="#next" disabled>Next</a>
    </nav>
  `,
})
class PaginationExplicitDisabledHost {}

@Component({
  imports: [HellPaginationStrip],
  providers: [
    provideHellLabels(HELL_PAGINATION_LABELS, {
      navigation: 'Seiten',
      nextPage: 'Nächste Seite',
      page: (page) => `Seite ${page}`,
    }),
  ],
  template: `<hell-pagination [page]="1" [pageCount]="3" />`,
})
class LocalizedPaginationHost {}

@Component({
  imports: [HellPagination, HellPageLink, HellPaginationStrip],
  template: `
    <nav
      id="ui-root"
      hellPagination
      ui="gap-hell-4 bg-hell-surface-muted"
      [page]="page()"
      [pageCount]="pageCount()"
      (pageChange)="pageEvents.push($event)"
    >
      <button id="ui-first" hellPageLink="first" type="button" [ui]="firstUi">First</button>
      <button id="ui-prev" hellPageLink="previous" type="button" [ui]="prevUi">Prev</button>
      <button id="ui-page" [hellPageLink]="2" type="button" [ui]="buttonUi">2</button>
      <button id="ui-next" hellPageLink="next" type="button" [ui]="nextUi">Next</button>
      <button id="ui-last" hellPageLink="last" type="button" [ui]="lastUi">Last</button>
    </nav>

    <hell-pagination
      id="ui-strip"
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
  protected readonly firstUi = 'bg-hell-danger px-hell-7';
  protected readonly prevUi = {
    root: 'bg-hell-surface-muted px-hell-6',
  };
  protected readonly buttonUi = {
    root: 'rounded-hell-pill bg-hell-primary px-hell-8',
  };
  protected readonly nextUi = {
    root: 'border-hell-danger px-hell-5',
  };
  protected readonly lastUi = {
    root: 'bg-hell-danger px-hell-7',
  };
  protected readonly stripUi = {
    root: 'gap-hell-4 bg-hell-surface-muted',
    control: 'rounded-hell-pill px-hell-9',
    controlGlyph: 'text-hell-danger text-lg',
  } satisfies HellPaginationStripUi;
}

describe('HellPageLink', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PaginationHost,
        PaginationRecipesHost,
        PaginationRolesHost,
        PaginationAnchorHost,
        PaginationExplicitDisabledHost,
        LocalizedPaginationHost,
        PaginationUiHost,
      ],
    }).compileComponents();
  });

  it('renders every role with the shared control contract', () => {
    const fixture = TestBed.createComponent(PaginationRolesHost);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    for (const id of ['first', 'previous', 'page-2', 'page-3', 'next', 'last']) {
      const control = query(root, `#${id}`);
      expect(control.getAttribute('data-slot')).toBe('root');
      expect(control.getAttribute('data-variant')).toBe('ghost');
      expect(control.getAttribute('data-icon-only')).toBe('');
      expect(control.getAttribute('type')).toBe('button');
    }
  });

  it('disables boundary controls at the matching range edge', () => {
    const fixture = TestBed.createComponent(PaginationRolesHost);
    const host = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;

    // Page 3 of 5 sits away from both edges: every control is reachable.
    fixture.detectChanges();
    for (const id of ['first', 'previous', 'next', 'last']) {
      expect(pageButton(root, id).disabled).toBe(false);
    }

    host.page.set(1);
    fixture.detectChanges();
    for (const id of ['first', 'previous']) {
      const control = pageButton(root, id);
      expect(control.disabled).toBe(true);
      expect(control.getAttribute('data-disabled')).toBe('');
      expect(control.getAttribute('tabindex')).toBe('-1');
    }
    expect(pageButton(root, 'next').disabled).toBe(false);
    expect(pageButton(root, 'last').disabled).toBe(false);

    host.page.set(5);
    fixture.detectChanges();
    expect(pageButton(root, 'first').disabled).toBe(false);
    expect(pageButton(root, 'previous').disabled).toBe(false);
    expect(pageButton(root, 'next').disabled).toBe(true);
    expect(pageButton(root, 'last').disabled).toBe(true);

    host.disabled.set(true);
    fixture.detectChanges();
    for (const id of ['first', 'previous', 'page-2', 'next', 'last']) {
      expect(pageButton(root, id).disabled).toBe(true);
    }
  });

  it('marks the numbered control that equals the current page', () => {
    const fixture = TestBed.createComponent(PaginationRolesHost);
    const root = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();

    const current = pageButton(root, 'page-3');
    const other = pageButton(root, 'page-2');
    expect(current.getAttribute('aria-current')).toBe('true');
    expect(current.getAttribute('data-selected')).toBe('');
    expect(other.getAttribute('aria-current')).toBe('false');
    expect(other.getAttribute('data-selected')).toBeNull();

    // Boundary controls never expose the numbered selected contract.
    expect(pageButton(root, 'next').getAttribute('aria-current')).toBeNull();
    expect(pageButton(root, 'next').getAttribute('data-selected')).toBeNull();

    fixture.componentInstance.page.set(2);
    fixture.detectChanges();
    expect(pageButton(root, 'page-2').getAttribute('aria-current')).toBe('true');
    expect(pageButton(root, 'page-3').getAttribute('aria-current')).toBe('false');
  });

  it('navigates from each role on click', () => {
    const fixture = TestBed.createComponent(PaginationRolesHost);
    const host = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();

    pageButton(root, 'next').click();
    pageButton(root, 'previous').click();
    pageButton(root, 'page-2').click();
    pageButton(root, 'first').click();
    pageButton(root, 'last').click();

    expect(host.pageEvents).toEqual([4, 2, 2, 1, 5]);
  });

  it('activates each role with Enter and Space', () => {
    const fixture = TestBed.createComponent(PaginationRolesHost);
    const host = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();

    dispatchKey(pageButton(root, 'next'), 'Enter');
    dispatchKey(pageButton(root, 'first'), ' ');

    expect(host.pageEvents).toEqual([4, 1]);
  });

  it('guards disabled anchor pagination controls', () => {
    const fixture = TestBed.createComponent(PaginationAnchorHost);
    fixture.detectChanges();

    const first = fixture.nativeElement.querySelector('a[hellPageLink]') as HTMLAnchorElement;
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

  it('merges pagination ui classes through local roots', () => {
    const fixture = TestBed.createComponent(PaginationUiHost);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const pagination = query(root, '#ui-root');
    const first = query(root, '#ui-first');
    const prev = query(root, '#ui-prev');
    const numbered = query(root, '#ui-page');
    const next = query(root, '#ui-next');
    const last = query(root, '#ui-last');

    expect(pagination.getAttribute('data-slot')).toBe('root');
    expect(pagination.className).toContain('gap-hell-4');
    expect(pagination.className).not.toContain('gap-hell-1');

    for (const control of [first, prev, numbered, next, last]) {
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
  });
});

describe('HellPaginationStrip', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PaginationHost,
        PaginationRecipesHost,
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

  it('composes the compact previous/next recipe with boundary disabled state', () => {
    const fixture = TestBed.createComponent(PaginationRecipesHost);
    fixture.detectChanges();

    const root = (fixture.nativeElement as HTMLElement).querySelector(
      '#compact-recipe',
    ) as HTMLElement;

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

  it('composes the page-jump recipe through a native select', () => {
    const fixture = TestBed.createComponent(PaginationRecipesHost);
    fixture.componentInstance.page.set(2);
    fixture.detectChanges();

    const root = (fixture.nativeElement as HTMLElement).querySelector(
      '#jump-recipe',
    ) as HTMLElement;
    const select = root.querySelector('select[hellNativeSelect]') as HTMLSelectElement;

    expect(buttonLabels(root)).toEqual(['Previous page', 'Next page']);
    expect(select.getAttribute('aria-label')).toBe('Page');
    expect(select.classList.contains('appearance-none')).toBe(true);
    expect(select.value).toBe('2');
    expect(root.textContent).toContain('of 5');

    select.value = '4';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(fixture.componentInstance.pageEvents).toEqual([4]);

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(select.disabled).toBe(true);
  });

  it('supports keyboard activation for numbered and navigation controls', () => {
    const fixture = TestBed.createComponent(PaginationHost);
    fixture.detectChanges();

    dispatchKey(button(fixture.nativeElement, 'Page 8'), ' ');
    dispatchKey(button(fixture.nativeElement, 'Next page'), 'Enter');

    expect(fixture.componentInstance.pageEvents).toEqual([8, 7]);
  });

  it('merges pagination ui classes through strip anatomy parts', () => {
    const fixture = TestBed.createComponent(PaginationUiHost);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const strip = query(root, '#ui-strip');
    const stripGlyph = query(strip, '[data-slot="controlGlyph"]');
    const stripPrev = strip.querySelector('[hellPageLink="previous"]') as HTMLButtonElement;
    const stripNext = strip.querySelector('[hellPageLink="next"]') as HTMLButtonElement;

    expect(strip.getAttribute('data-slot')).toBe('root');
    expect(strip.className).toContain('gap-hell-4');
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

function pageButton(root: HTMLElement, id: string): HTMLButtonElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLButtonElement)) throw new Error(`Expected #${id} button.`);
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
