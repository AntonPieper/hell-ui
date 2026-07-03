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

@Component({
  imports: [...HELL_LISTBOX_DIRECTIVES],
  template: `
    <div hellListbox aria-label="Plain listbox" [value]="value()">
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

  it('renders a bordered panel with flat borderless option rows by default', () => {
    const fixture = TestBed.createComponent(ListboxDefaultHost);
    fixture.detectChanges();

    const listbox = query<HTMLElement>(fixture.nativeElement, '[hellListbox]');
    const option = query<HTMLElement>(fixture.nativeElement, '[hellListboxOption][value="ada"]');

    // The container owns the outline; options must not look like outlined buttons.
    expect(listbox.className).toContain('border-hell-border');
    expect(listbox.className).toContain('bg-hell-surface-elevated');
    expect(option.className).toContain('border-0');
    expect(option.className).not.toContain('border-transparent');
    expect(option.className).not.toContain('data-selected:border-hell-border-focus');
  });
});

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
