import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_SEARCH_IMPORTS, HellInput } from './input';
import { expectUiRouting, sortClasses } from '../spec-helpers';

/**
 * Search specs assert behavior and state attributes. Part-Class Pipeline
 * merge semantics are owned centrally by `internal/core/part-class-pipeline.spec.ts`;
 * ui routing asserts that consumer classes reach each part and that nothing
 * outside the default render and the consumer's ui appears, instead of
 * asserting individual recipe classes. Part Recipes stay package-private per
 * ADR 0002, so the recipe snapshot below pins the rendered class surface per
 * part.
 */

@Component({
  imports: [HellInput, ...HELL_SEARCH_IMPORTS],
  template: `
    <div id="search-string" hellSearch ui="grid gap-hell-4">
      <input id="search-string-input" hellInput type="search" value="Ada" />
      <button id="clear-string" hellSearchClear ui="flex text-hell-danger">Clear</button>
    </div>

    <div id="search-map" hellSearch [ui]="searchUi">
      <input id="search-map-input" hellInput type="search" />
      <button id="clear-map" hellSearchClear [ui]="clearUi">Clear</button>
    </div>

    <div id="search-default" hellSearch>
      <input id="search-default-input" hellInput type="search" />
      <button id="clear-default" hellSearchClear>Clear</button>
    </div>
  `,
})
class SearchPartStyleHost {
  readonly searchUi = {
    root: 'grid gap-hell-3',
  };

  readonly clearUi = {
    root: 'flex text-hell-info',
  };
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

    expectPartStyleRoot(search);
    expectPartStyleRoot(clear);
    expectUiRouting(
      byId(fixture.nativeElement, 'search-default').className,
      search.className,
      'grid gap-hell-4',
    );
    expectUiRouting(
      byId(fixture.nativeElement, 'clear-default').className,
      clear.className,
      'flex text-hell-danger',
    );
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

    expectPartStyleRoot(search);
    expectPartStyleRoot(clear);
    expectUiRouting(
      byId(fixture.nativeElement, 'search-default').className,
      search.className,
      'grid gap-hell-3',
    );
    expectUiRouting(
      byId(fixture.nativeElement, 'clear-default').className,
      clear.className,
      'flex text-hell-info',
    );
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(SearchPartStyleHost);
      fixture.detectChanges();

      expect({
        search: sortClasses(byId(fixture.nativeElement, 'search-default').className),
        clear: sortClasses(byId(fixture.nativeElement, 'clear-default').className),
      }).toMatchSnapshot('search');
    });
  });
});

function byId<T extends HTMLElement>(root: HTMLElement, id: string): T {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element as T;
}

function expectPartStyleRoot(element: HTMLElement): void {
  expect(element.getAttribute('data-slot')).toBe('root');
}

