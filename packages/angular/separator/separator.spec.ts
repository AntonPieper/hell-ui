import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { hellTwMerge } from 'hell-ui/core';

import { HELL_SEPARATOR_RECIPE, HellSeparator } from './separator';
import { sortClasses } from '../spec-helpers';

/**
 * Separator specs assert behavior and state attributes. Part-Class Pipeline
 * merge semantics are owned centrally by `core/part-class-pipeline.spec.ts`;
 * rendered classes are compared against the shared pipeline output for the
 * exported recipe instead of asserting individual utility classes, and the
 * recipe snapshot below pins the default classes without bootstrapping.
 */
const SEPARATOR_UI_SHORTHAND = 'bg-hell-danger';

@Component({
  imports: [HellSeparator],
  template: `
    <hr id="separator-default" hellSeparator />
    <hr id="separator-string" hellSeparator [ui]="separatorUiShorthand" />
    <div
      id="separator-map"
      hellSeparator
      orientation="vertical"
      spacing="sm"
      [ui]="separatorUi"
    ></div>
  `,
})
class SeparatorHost {
  protected readonly separatorUiShorthand = SEPARATOR_UI_SHORTHAND;

  protected readonly separatorUi = {
    root: 'bg-hell-info w-hell-2',
  };
}

describe('HellSeparator', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SeparatorHost] }).compileComponents();
  });

  it('exposes separator semantics and defaults through state attributes', () => {
    const fixture = TestBed.createComponent(SeparatorHost);
    fixture.detectChanges();

    const separator = byId(fixture.nativeElement, 'separator-default');

    expect(separator.getAttribute('data-slot')).toBe('root');
    expect(separator.getAttribute('role')).toBe('separator');
    expect(separator.getAttribute('data-orientation')).toBe('horizontal');
    expect(separator.getAttribute('data-spacing')).toBe('md');
  });

  it('reflects orientation and spacing inputs through state attributes', () => {
    const fixture = TestBed.createComponent(SeparatorHost);
    fixture.detectChanges();

    const separator = byId(fixture.nativeElement, 'separator-map');

    expect(separator.getAttribute('role')).toBe('separator');
    expect(separator.getAttribute('aria-orientation')).toBe('vertical');
    expect(separator.getAttribute('data-orientation')).toBe('vertical');
    expect(separator.getAttribute('data-spacing')).toBe('sm');
  });

  it('renders the pure default recipe when no ui is provided', () => {
    const fixture = TestBed.createComponent(SeparatorHost);
    fixture.detectChanges();

    expect(renderedClasses(fixture, 'separator-default')).toEqual(
      sortClasses(HELL_SEPARATOR_RECIPE.root),
    );
  });

  it('routes ui string shorthand through the shared Part-Class Pipeline', () => {
    const fixture = TestBed.createComponent(SeparatorHost);
    fixture.detectChanges();

    expect(renderedClasses(fixture, 'separator-string')).toEqual(
      sortClasses(hellTwMerge(HELL_SEPARATOR_RECIPE.root, SEPARATOR_UI_SHORTHAND)),
    );
  });

  it('routes ui part maps through the shared Part-Class Pipeline', () => {
    const fixture = TestBed.createComponent(SeparatorHost);
    fixture.detectChanges();

    expect(renderedClasses(fixture, 'separator-map')).toEqual(
      sortClasses(hellTwMerge(HELL_SEPARATOR_RECIPE.root, 'bg-hell-info w-hell-2')),
    );
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      expect(classesByPart(HELL_SEPARATOR_RECIPE)).toMatchSnapshot('separator');
    });
  });
});

function classesByPart(recipe: Readonly<Record<string, string>>): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(recipe).map(([part, classes]) => [part, classes.split(/\s+/)]),
  );
}

/** Rendered classes as a sorted list; class attribute order carries no styling meaning. */
function renderedClasses(fixture: { nativeElement: HTMLElement }, id: string): string[] {
  return sortClasses(byId(fixture.nativeElement, id).className);
}

function byId(root: HTMLElement, id: string): HTMLElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element;
}
