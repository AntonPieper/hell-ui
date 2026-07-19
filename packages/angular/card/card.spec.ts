import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { hellTwMerge } from '@hell-ui/angular/core';

import {
  HELL_CARD_BODY_RECIPE,
  HELL_CARD_FOOTER_RECIPE,
  HELL_CARD_HEADER_RECIPE,
  HELL_CARD_IMPORTS,
  HELL_CARD_RECIPE,
} from './card';

/**
 * Card specs assert behavior and state attributes. Part-Class Pipeline merge
 * semantics are owned centrally by `core/part-class-pipeline.spec.ts`;
 * rendered classes are compared against the shared pipeline output for the
 * exported recipes instead of asserting individual utility classes, and the
 * recipe snapshots below pin the default classes without bootstrapping.
 */
const CARD_UI_SHORTHAND = 'rounded-hell-pill shadow-none p-hell-4';

@Component({
  imports: [...HELL_CARD_IMPORTS],
  template: `
    <div id="default-card" hellCard>
      <div id="default-header" hellCardHeader>Header</div>
      <div id="default-body" hellCardBody>Body</div>
      <div id="default-footer" hellCardFooter>Footer</div>
    </div>

    <div id="custom-card" hellCard [elevation]="3" [ui]="cardUiShorthand">
      <div id="plain-header" hellCardHeader>Plain header</div>
    </div>

    <div id="mapped-card" hellCard [ui]="cardUi">
      <div id="mapped-header" hellCardHeader [ui]="headerUi">Mapped header</div>
      <div id="mapped-body" hellCardBody [ui]="bodyUi">Mapped body</div>
      <div id="mapped-footer" hellCardFooter [ui]="footerUi">Mapped footer</div>
    </div>
  `,
})
class CardHost {
  protected readonly cardUiShorthand = CARD_UI_SHORTHAND;

  protected readonly cardUi = {
    root: 'rounded-hell-pill shadow-hell-lg',
  };

  protected readonly headerUi = {
    root: 'px-hell-2 text-hell-danger',
  };

  protected readonly bodyUi = {
    root: 'p-hell-2',
  };

  protected readonly footerUi = {
    root: 'justify-start border-t-0',
  };
}

describe('HellCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CardHost] }).compileComponents();
  });

  it('marks every card part with its public data-slot', () => {
    const fixture = TestBed.createComponent(CardHost);
    fixture.detectChanges();

    for (const id of ['default-card', 'default-header', 'default-body', 'default-footer']) {
      expect(query(fixture.nativeElement, `#${id}`).getAttribute('data-slot')).toBe('root');
    }
  });

  it('reflects elevation through the data-elevation state attribute', () => {
    const fixture = TestBed.createComponent(CardHost);
    fixture.detectChanges();

    expect(query(fixture.nativeElement, '#default-card').getAttribute('data-elevation')).toBe('1');
    expect(query(fixture.nativeElement, '#custom-card').getAttribute('data-elevation')).toBe('3');
  });

  it('renders the pure default recipes when no ui is provided', () => {
    const fixture = TestBed.createComponent(CardHost);
    fixture.detectChanges();

    expect(renderedClasses(fixture, '#default-card')).toEqual(sortClasses(HELL_CARD_RECIPE.root));
    expect(renderedClasses(fixture, '#default-header')).toEqual(
      sortClasses(HELL_CARD_HEADER_RECIPE.root),
    );
    expect(renderedClasses(fixture, '#default-body')).toEqual(
      sortClasses(HELL_CARD_BODY_RECIPE.root),
    );
    expect(renderedClasses(fixture, '#default-footer')).toEqual(
      sortClasses(HELL_CARD_FOOTER_RECIPE.root),
    );
  });

  it('routes ui string shorthand through the shared Part-Class Pipeline', () => {
    const fixture = TestBed.createComponent(CardHost);
    fixture.detectChanges();

    expect(renderedClasses(fixture, '#custom-card')).toEqual(
      sortClasses(hellTwMerge(HELL_CARD_RECIPE.root, CARD_UI_SHORTHAND)),
    );
  });

  it('routes ui part maps through the shared Part-Class Pipeline per directive', () => {
    const fixture = TestBed.createComponent(CardHost);
    fixture.detectChanges();

    expect(renderedClasses(fixture, '#mapped-card')).toEqual(
      sortClasses(hellTwMerge(HELL_CARD_RECIPE.root, 'rounded-hell-pill shadow-hell-lg')),
    );
    expect(renderedClasses(fixture, '#mapped-header')).toEqual(
      sortClasses(hellTwMerge(HELL_CARD_HEADER_RECIPE.root, 'px-hell-2 text-hell-danger')),
    );
    expect(renderedClasses(fixture, '#mapped-body')).toEqual(
      sortClasses(hellTwMerge(HELL_CARD_BODY_RECIPE.root, 'p-hell-2')),
    );
    expect(renderedClasses(fixture, '#mapped-footer')).toEqual(
      sortClasses(hellTwMerge(HELL_CARD_FOOTER_RECIPE.root, 'justify-start border-t-0')),
    );
  });

  it('does not style projected child directives from a parent ui', () => {
    const fixture = TestBed.createComponent(CardHost);
    fixture.detectChanges();

    expect(renderedClasses(fixture, '#plain-header')).toEqual(
      sortClasses(HELL_CARD_HEADER_RECIPE.root),
    );
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      expect(classesByPart(HELL_CARD_RECIPE)).toMatchSnapshot('card');
      expect(classesByPart(HELL_CARD_HEADER_RECIPE)).toMatchSnapshot('cardHeader');
      expect(classesByPart(HELL_CARD_BODY_RECIPE)).toMatchSnapshot('cardBody');
      expect(classesByPart(HELL_CARD_FOOTER_RECIPE)).toMatchSnapshot('cardFooter');
    });
  });
});

function classesByPart(recipe: Readonly<Record<string, string>>): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(recipe).map(([part, classes]) => [part, classes.split(/\s+/)]),
  );
}

/** Rendered classes as a sorted list; class attribute order carries no styling meaning. */
function renderedClasses(fixture: { nativeElement: HTMLElement }, selector: string): string[] {
  return sortClasses(query(fixture.nativeElement, selector).className);
}

function sortClasses(value: string): string[] {
  return value.split(/\s+/).filter(Boolean).sort();
}

function query(root: HTMLElement, selector: string): HTMLElement {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element;
}
