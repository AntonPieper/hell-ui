import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_LISTBOX_IMPORTS } from './listbox';

/**
 * Listbox specs assert behavior and state attributes. Part-Class Pipeline
 * merge semantics are owned centrally by `core/part-class-pipeline.spec.ts`;
 * ui routing asserts that consumer classes reach each part and that nothing
 * outside the default render and the consumer's ui appears, instead of
 * asserting individual recipe classes. Part Recipes stay package-private per
 * ADR 0002, so the recipe snapshot below pins the rendered class surface per
 * part.
 */

@Component({
  imports: [...HELL_LISTBOX_IMPORTS],
  template: `
    <div
      hellListbox
      aria-label="Choose a reviewer"
      ui="rounded-hell-pill bg-hell-surface-muted"
      [value]="value()"
      (valueChange)="value.set($any($event))"
    >
      <div hellListboxHeader ui="text-hell-danger">Reviewers</div>
      <div hellListboxOption value="ada" [ui]="{ root: 'rounded-hell-pill px-hell-8' }">
        Ada
      </div>
      <div hellListboxOption value="grace" disabled>Grace</div>
    </div>
  `,
})
class ListboxUiHost {
  readonly value = signal<string[]>(['ada']);
}

@Component({
  imports: [...HELL_LISTBOX_IMPORTS],
  template: `
    <div hellListbox aria-label="Plain listbox" [value]="value()">
      <div hellListboxHeader>Plain header</div>
      <div hellListboxOption value="ada">Ada</div>
      <div hellListboxOption value="grace">Grace</div>
    </div>
  `,
})
class ListboxDefaultHost {
  readonly value = signal<string[]>(['ada']);
}

describe('HellListbox Part Style Map', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListboxUiHost, ListboxDefaultHost],
    }).compileComponents();
  });

  it('merges local root part styles while preserving selected and disabled state', () => {
    const fixture = TestBed.createComponent(ListboxUiHost);
    fixture.detectChanges();

    const listbox = query<HTMLElement>(fixture.nativeElement, '[hellListbox]');
    const header = query<HTMLElement>(fixture.nativeElement, '[hellListboxHeader]');
    const selected = query<HTMLElement>(fixture.nativeElement, '[hellListboxOption][value="ada"]');
    const disabled = query<HTMLElement>(fixture.nativeElement, '[hellListboxOption][value="grace"]');

    const defaults = TestBed.createComponent(ListboxDefaultHost);
    defaults.detectChanges();
    const defaultListbox = query<HTMLElement>(defaults.nativeElement, '[hellListbox]');
    const defaultHeader = query<HTMLElement>(defaults.nativeElement, '[hellListboxHeader]');
    const defaultOption = query<HTMLElement>(
      defaults.nativeElement,
      '[hellListboxOption][value="ada"]',
    );

    expect(listbox.getAttribute('data-slot')).toBe('root');
    expectUiRouting(defaultListbox.className, listbox.className, 'rounded-hell-pill bg-hell-surface-muted');

    expect(header.getAttribute('data-slot')).toBe('root');
    expectUiRouting(defaultHeader.className, header.className, 'text-hell-danger');

    expect(selected.getAttribute('data-slot')).toBe('root');
    expect(selected.getAttribute('aria-selected')).toBe('true');
    expectUiRouting(defaultOption.className, selected.className, 'rounded-hell-pill px-hell-8');

    expect(disabled.getAttribute('data-slot')).toBe('root');
    expect(disabled.getAttribute('aria-disabled')).toBe('true');
    expect(disabled.getAttribute('aria-selected')).toBe('false');
  });

  describe('recipes', () => {
    // The container owns the outline; options must not look like outlined
    // buttons. The snapshot pins that division of styling responsibility.
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(ListboxDefaultHost);
      fixture.detectChanges();

      expect({
        listbox: sortClasses(query<HTMLElement>(fixture.nativeElement, '[hellListbox]').className),
        header: sortClasses(
          query<HTMLElement>(fixture.nativeElement, '[hellListboxHeader]').className,
        ),
        option: sortClasses(
          query<HTMLElement>(fixture.nativeElement, '[hellListboxOption][value="ada"]').className,
        ),
      }).toMatchSnapshot('listbox');
    });
  });
});

/**
 * Proves consumer ui classes reach the part through the Part-Class Pipeline:
 * every ui class renders, and nothing outside the default render plus the
 * consumer's ui appears. Merge conflict semantics are owned centrally by
 * `core/part-class-pipeline.spec.ts`.
 */
function expectUiRouting(defaultClassName: string, customClassName: string, ui: string): void {
  const custom = sortClasses(customClassName);
  const ownUi = sortClasses(ui);
  const allowed = new Set([...sortClasses(defaultClassName), ...ownUi]);

  expect(custom).toEqual(expect.arrayContaining(ownUi));
  expect(custom.filter((candidate) => !allowed.has(candidate))).toEqual([]);
}

function sortClasses(value: string): string[] {
  return value.split(/\s+/).filter(Boolean).sort();
}

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
