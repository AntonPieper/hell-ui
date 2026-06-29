import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellInput } from '@hell-ui/angular/input';
import {
  HELL_SEARCH_DIRECTIVES,
  type HellSearchClearUi,
  type HellSearchUi,
} from './search';

@Component({
  imports: [HellInput, ...HELL_SEARCH_DIRECTIVES],
  template: `
    <div id="search-string" hellSearch ui="grid gap-hell-4">
      <input id="search-string-input" hellInput type="search" value="Ada" />
      <button id="clear-string" hellSearchClear ui="flex text-hell-danger">Clear</button>
    </div>

    <div id="search-map" hellSearch [ui]="searchUi">
      <input id="search-map-input" hellInput type="search" />
      <button id="clear-map" hellSearchClear [ui]="clearUi">Clear</button>
    </div>
  `,
})
class SearchPartStyleHost {
  readonly searchUi = {
    root: 'grid gap-hell-3',
  } satisfies HellSearchUi;

  readonly clearUi = {
    root: 'flex text-hell-info',
  } satisfies HellSearchClearUi;
}

describe('HellSearch Part Style Map', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SearchPartStyleHost] }).compileComponents();
  });

  it('applies string shorthand to Search and SearchClear roots while preserving clear behavior', () => {
    const fixture = TestBed.createComponent(SearchPartStyleHost);
    fixture.detectChanges();

    const search = byId(fixture.nativeElement, 'search-string');
    const input = byId<HTMLInputElement>(fixture.nativeElement, 'search-string-input');
    const clear = byId<HTMLButtonElement>(fixture.nativeElement, 'clear-string');

    input.value = 'Ada';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expectPartStyleRoot(search, 'hell-search');
    expectPartStyleRoot(clear, 'hell-search-clear');
    expectClasses(search, ['grid', 'gap-hell-4']);
    expectClasses(clear, ['flex', 'text-hell-danger']);
    expect(search.hasAttribute('data-empty')).toBe(false);
    expect(clear.hasAttribute('data-empty')).toBe(false);
    expect(clear.getAttribute('type')).toBe('button');
    expect(clear.getAttribute('tabindex')).toBe('-1');

    clear.click();
    fixture.detectChanges();

    expect(input.value).toBe('');
    expect(search.getAttribute('data-empty')).toBe('');
    expect(clear.getAttribute('data-empty')).toBe('');
  });

  it('applies object maps to Search and SearchClear roots', () => {
    const fixture = TestBed.createComponent(SearchPartStyleHost);
    fixture.detectChanges();

    const search = byId(fixture.nativeElement, 'search-map');
    const clear = byId(fixture.nativeElement, 'clear-map');

    expectPartStyleRoot(search, 'hell-search');
    expectPartStyleRoot(clear, 'hell-search-clear');
    expectClasses(search, ['grid', 'gap-hell-3']);
    expectClasses(clear, ['flex', 'text-hell-info']);
  });
});

function byId<T extends HTMLElement>(root: HTMLElement, id: string): T {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element as T;
}

function expectPartStyleRoot(element: HTMLElement, legacyClass: string): void {
  expect(element.getAttribute('data-slot')).toBe('root');
  expect(element.classList.contains(legacyClass)).toBe(false);
}

function expectClasses(element: HTMLElement, present: string[]): void {
  const classes = element.className.split(/\s+/);
  for (const className of present) expect(classes).toContain(className);
}
