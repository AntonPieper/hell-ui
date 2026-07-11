import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HELL_EMPTY_STATE_DIRECTIVES,
  provideHellEmptyStateLabels,
  type HellEmptyStateHeadingLevel,
  type HellEmptyStatePreset,
  type HellEmptyStateUi,
} from './empty-state';

@Component({
  imports: [...HELL_EMPTY_STATE_DIRECTIVES],
  template: `
    <hell-empty-state
      id="preset"
      [preset]="preset()"
      [headingLevel]="headingLevel()"
      [ui]="ui()"
    />

    <hell-empty-state id="projected" preset="noResults" [headingLevel]="3">
      <span hellEmptyStateMedia id="custom-media">glyph</span>
      <h2 hellEmptyStateTitle id="custom-title">Custom title</h2>
      <p hellEmptyStateDescription id="custom-description">Custom description</p>
      <button hellEmptyStateActions id="custom-action" type="button">Clear filters</button>
    </hell-empty-state>
  `,
})
class EmptyStateHost {
  readonly preset = signal<HellEmptyStatePreset | null>('noData');
  readonly headingLevel = signal<HellEmptyStateHeadingLevel | null>(null);
  readonly ui = signal<HellEmptyStateUi | undefined>(undefined);
}

describe('HellEmptyState', () => {
  function setup(providers: unknown[] = []) {
    TestBed.configureTestingModule({
      imports: [EmptyStateHost],
      providers: providers as never[],
    });
    const fixture = TestBed.createComponent(EmptyStateHost);
    fixture.detectChanges();
    return fixture;
  }

  it('maps each preset to its default glyph and Label Contract copy', () => {
    const fixture = setup();
    const host = fixture.nativeElement as HTMLElement;
    const preset = query(host, '#preset');

    const cases: Record<HellEmptyStatePreset, { title: string; description: string }> = {
      noData: { title: 'Nothing here yet', description: 'There is no data to show.' },
      noResults: { title: 'No matches', description: 'No results match your current filters.' },
      error: { title: 'Something went wrong', description: 'We could not load this content.' },
      forbidden: {
        title: 'Access restricted',
        description: 'You do not have permission to view this.',
      },
    };

    for (const [name, copy] of Object.entries(cases) as [
      HellEmptyStatePreset,
      { title: string; description: string },
    ][]) {
      fixture.componentInstance.preset.set(name);
      fixture.detectChanges();

      expect(preset.getAttribute('data-preset')).toBe(name);
      expect(preset.querySelector('[data-slot="media"] svg')).not.toBeNull();
      expect(text(query(preset, '[data-slot="title"]'))).toBe(copy.title);
      expect(text(query(preset, '[data-slot="description"]'))).toBe(copy.description);
    }
  });

  it('renders projected content over the preset defaults and keeps the actions reachable', () => {
    const fixture = setup();
    const host = fixture.nativeElement as HTMLElement;
    const projected = query(host, '#projected');

    // Projected media wins: no default glyph is rendered alongside it.
    expect(query(projected, '#custom-media')).not.toBeNull();
    expect(projected.querySelector('[data-slot="media"] svg')).toBeNull();

    expect(text(query(projected, '[data-slot="title"]'))).toBe('Custom title');
    expect(text(query(projected, '[data-slot="title"]'))).not.toContain('No matches');
    expect(text(query(projected, '[data-slot="description"]'))).toBe('Custom description');

    const action = query(projected, '[data-slot="actions"] #custom-action');
    expect(action).not.toBeNull();
    expect(action.tabIndex).toBeGreaterThanOrEqual(0);
  });

  it('promotes the title to a heading level while defaulting to non-semantic emphasis', () => {
    const fixture = setup();
    const host = fixture.nativeElement as HTMLElement;
    const title = query(host, '#preset [data-slot="title"]');

    expect(title.getAttribute('role')).toBeNull();
    expect(title.getAttribute('aria-level')).toBeNull();

    fixture.componentInstance.headingLevel.set(3);
    fixture.detectChanges();

    expect(title.getAttribute('role')).toBe('heading');
    expect(title.getAttribute('aria-level')).toBe('3');
  });

  it('does not add heading semantics to the wrapper when a title is projected', () => {
    const fixture = setup();
    const host = fixture.nativeElement as HTMLElement;
    // The projected instance sets headingLevel AND projects a real <h2>. The
    // wrapper must stay semantically inert so the outline gets one heading, not
    // two nested heading roles.
    const title = query(host, '#projected [data-slot="title"]');
    expect(title.getAttribute('role')).toBeNull();
    expect(title.getAttribute('aria-level')).toBeNull();
    expect(title.querySelector('#custom-title')?.tagName).toBe('H2');
  });

  it('lets the Label Contract override preset copy for a scope', () => {
    const fixture = setup([
      provideHellEmptyStateLabels({
        noDataTitle: 'No invoices yet',
        noDataDescription: 'Create your first invoice to get started.',
      }),
    ]);
    const host = fixture.nativeElement as HTMLElement;
    const preset = query(host, '#preset');

    expect(text(query(preset, '[data-slot="title"]'))).toBe('No invoices yet');
    expect(text(query(preset, '[data-slot="description"]'))).toBe(
      'Create your first invoice to get started.',
    );
  });

  it('exposes the root Part Style Map while preserving state attributes', () => {
    const fixture = setup();
    fixture.componentInstance.ui.set({ root: 'bg-hell-surface-muted p-hell-2' });
    fixture.detectChanges();
    const preset = query(fixture.nativeElement as HTMLElement, '#preset');

    expect(preset.getAttribute('data-slot')).toBe('root');
    expect(preset.classList.contains('bg-hell-surface-muted')).toBe(true);
    expect(preset.classList.contains('p-hell-2')).toBe(true);
    expect(preset.classList.contains('p-hell-8')).toBe(false);
  });
});

function query(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element;
}

function text(element: HTMLElement): string {
  return element.textContent?.trim() ?? '';
}
