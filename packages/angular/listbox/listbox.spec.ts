import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_LISTBOX_DIRECTIVES } from './listbox';

@Component({
  imports: [...HELL_LISTBOX_DIRECTIVES],
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

describe('HellListbox Part Style Map', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ListboxUiHost] }).compileComponents();
  });

  it('merges local root part styles while preserving selected and disabled state', () => {
    const fixture = TestBed.createComponent(ListboxUiHost);
    fixture.detectChanges();

    const listbox = query<HTMLElement>(fixture.nativeElement, '[hellListbox]');
    const header = query<HTMLElement>(fixture.nativeElement, '[hellListboxHeader]');
    const selected = query<HTMLElement>(fixture.nativeElement, '[hellListboxOption][value="ada"]');
    const disabled = query<HTMLElement>(fixture.nativeElement, '[hellListboxOption][value="grace"]');

    expect(listbox.getAttribute('data-slot')).toBe('root');
    expect(listbox.className).toContain('rounded-hell-pill');
    expect(listbox.className).toContain('bg-hell-surface-muted');

    expect(header.getAttribute('data-slot')).toBe('root');
    expect(header.className).toContain('text-hell-danger');

    expect(selected.getAttribute('data-slot')).toBe('root');
    expect(selected.getAttribute('aria-selected')).toBe('true');
    expect(selected.className).toContain('rounded-hell-pill');
    expect(selected.className).not.toContain('rounded-hell-md');
    expect(selected.className).toContain('px-hell-8');

    expect(disabled.getAttribute('data-slot')).toBe('root');
    expect(disabled.getAttribute('aria-disabled')).toBe('true');
    expect(disabled.getAttribute('aria-selected')).toBe('false');
  });
});

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
