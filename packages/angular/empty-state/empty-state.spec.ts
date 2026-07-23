import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HELL_EMPTY_STATE_COPY,
  HELL_EMPTY_STATE_IMPORTS,
  type HellEmptyStateGlyph,
  type HellEmptyStateHeadingLevel,
  type HellEmptyStateUi,
} from './empty-state';
import { expectUiRouting, sortClasses } from '../spec-helpers';

@Component({
  imports: [...HELL_EMPTY_STATE_IMPORTS],
  template: `
    <hell-empty-state
      id="inputs"
      [glyph]="glyph()"
      [title]="title()"
      [description]="description()"
      [headingLevel]="headingLevel()"
      [ui]="ui()"
    />

    <hell-empty-state
      id="projected"
      glyph="noResults"
      title="Input title"
      description="Input description"
      [headingLevel]="3"
    >
      <span hellEmptyStateMedia id="custom-media">glyph</span>
      <h2 hellEmptyStateTitle id="custom-title">Custom title</h2>
      <p hellEmptyStateDescription id="custom-description">Custom description</p>
      <button hellEmptyStateActions id="custom-action" type="button">Clear filters</button>
    </hell-empty-state>
  `,
})
class EmptyStateHost {
  readonly glyph = signal<HellEmptyStateGlyph | null>('noData');
  readonly title = signal<string | null>(HELL_EMPTY_STATE_COPY.noData.title);
  readonly description = signal<string | null>(HELL_EMPTY_STATE_COPY.noData.description);
  readonly headingLevel = signal<HellEmptyStateHeadingLevel | null>(null);
  readonly ui = signal<HellEmptyStateUi | undefined>(undefined);
}

describe('HellEmptyState', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [EmptyStateHost] });
    const fixture = TestBed.createComponent(EmptyStateHost);
    fixture.detectChanges();
    return fixture;
  }

  it('renders each glyph and the ready-made copy passed through the inputs', () => {
    const fixture = setup();
    const host = fixture.nativeElement as HTMLElement;
    const target = query(host, '#inputs');

    for (const glyph of Object.keys(HELL_EMPTY_STATE_COPY) as HellEmptyStateGlyph[]) {
      const copy = HELL_EMPTY_STATE_COPY[glyph];
      fixture.componentInstance.glyph.set(glyph);
      fixture.componentInstance.title.set(copy.title);
      fixture.componentInstance.description.set(copy.description);
      fixture.detectChanges();

      expect(target.getAttribute('data-glyph')).toBe(glyph);
      expect(target.querySelector('[data-slot="media"] svg')).not.toBeNull();
      expect(text(query(target, '[data-slot="title"]'))).toBe(copy.title);
      expect(text(query(target, '[data-slot="description"]'))).toBe(copy.description);
    }
  });

  it('renders nothing for regions without a glyph, copy, or projection', () => {
    const fixture = setup();
    fixture.componentInstance.glyph.set(null);
    fixture.componentInstance.title.set(null);
    fixture.componentInstance.description.set(null);
    fixture.detectChanges();
    const target = query(fixture.nativeElement as HTMLElement, '#inputs');

    expect(target.querySelector('[data-slot="media"]')).toBeNull();
    expect(target.querySelector('[data-slot="title"]')).toBeNull();
    expect(target.querySelector('[data-slot="description"]')).toBeNull();
  });

  it('renders projected content over the inputs and keeps the actions reachable', () => {
    const fixture = setup();
    const host = fixture.nativeElement as HTMLElement;
    const projected = query(host, '#projected');

    // Projected media wins: no glyph is rendered alongside it.
    expect(query(projected, '#custom-media')).not.toBeNull();
    expect(projected.querySelector('[data-slot="media"] svg')).toBeNull();

    expect(text(query(projected, '[data-slot="title"]'))).toBe('Custom title');
    expect(text(query(projected, '[data-slot="title"]'))).not.toContain('Input title');
    expect(text(query(projected, '[data-slot="description"]'))).toBe('Custom description');

    const action = query(projected, '[data-slot="actions"] #custom-action');
    expect(action).not.toBeNull();
    expect(action.tabIndex).toBeGreaterThanOrEqual(0);
  });

  it('promotes the title to a heading level while defaulting to non-semantic emphasis', () => {
    const fixture = setup();
    const host = fixture.nativeElement as HTMLElement;
    const title = query(host, '#inputs [data-slot="title"]');

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

  it('exposes the root Part Style Map while preserving state attributes', () => {
    const fixture = setup();
    const target = query(fixture.nativeElement as HTMLElement, '#inputs');
    const defaultClassName = target.className;

    fixture.componentInstance.ui.set({ root: 'bg-hell-surface-muted p-hell-2' });
    fixture.detectChanges();

    expect(target.getAttribute('data-slot')).toBe('root');
    expectUiRouting(defaultClassName, target.className, 'bg-hell-surface-muted p-hell-2');
  });

  describe('recipes', () => {
    // Part-Class Pipeline merge semantics are owned centrally by
    // `core/part-class-pipeline.spec.ts`; the snapshot pins the default part
    // classes without asserting individual utilities elsewhere.
    it('keeps the default part classes stable', () => {
      const fixture = setup();
      const target = query(fixture.nativeElement as HTMLElement, '#inputs');

      expect({
        root: sortClasses(target.className),
        media: sortClasses(query(target, '[data-slot="media"]').className),
        title: sortClasses(query(target, '[data-slot="title"]').className),
        description: sortClasses(query(target, '[data-slot="description"]').className),
      }).toMatchSnapshot('emptyState');
    });
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
