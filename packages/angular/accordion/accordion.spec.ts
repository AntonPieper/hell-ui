import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HELL_ACCORDION_IMPORTS } from './accordion';

/**
 * Accordion specs assert behavior and state attributes. Part-Class Pipeline
 * merge semantics are owned centrally by `core/part-class-pipeline.spec.ts`;
 * ui routing asserts that consumer classes reach each part and that nothing
 * outside the default render and the consumer's ui appears, instead of
 * asserting individual recipe classes. Part Recipes stay package-private per
 * ADR 0002, so the recipe snapshot below pins the rendered class surface per
 * part.
 */
const ACCORDION_UI_SHORTHAND = 'rounded-hell-lg border-hell-danger';

@Component({
  imports: [...HELL_ACCORDION_IMPORTS],
  template: `
    <div id="plain-accordion" hellAccordion type="single"></div>

    <div
      id="accordion"
      hellAccordion
      type="single"
      collapsible
      [value]="value()"
      ui="rounded-hell-lg border-hell-danger"
      (valueChange)="value.set($any($event))"
    >
      <div data-accordion="install-item" hellAccordionItem value="install" [ui]="itemUi">
        <button data-accordion="install-trigger" hellAccordionTrigger [ui]="triggerUi">
          Installation
        </button>
        <div data-accordion="install-content" hellAccordionContent [ui]="contentUi">
          <div>Install with pnpm.</div>
        </div>
      </div>

      <div data-accordion="theming-item" hellAccordionItem value="theming">
        <button data-accordion="theming-trigger" hellAccordionTrigger>Theming</button>
        <div data-accordion="theming-content" hellAccordionContent>
          <div>Override semantic tokens.</div>
        </div>
      </div>
    </div>
  `,
})
class AccordionHost {
  readonly value = signal<string | null>('install');

  protected readonly itemUi = {
    root: 'border-b-0',
  };

  protected readonly triggerUi = {
    root: 'px-hell-7 text-hell-danger',
  };

  protected readonly contentUi = {
    root: 'text-hell-foreground',
  };
}

describe('HellAccordion', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AccordionHost] }).compileComponents();
  });

  it('marks every accordion part with its public data-slot', () => {
    const fixture = TestBed.createComponent(AccordionHost);
    fixture.detectChanges();

    for (const selector of [
      '#accordion',
      '[data-accordion="install-item"]',
      '[data-accordion="install-trigger"]',
      '[data-accordion="install-content"]',
    ]) {
      expect(query(fixture.nativeElement, selector).getAttribute('data-slot')).toBe('root');
    }
  });

  it('reflects open state and content interactivity through state attributes', () => {
    const fixture = TestBed.createComponent(AccordionHost);
    fixture.detectChanges();

    const installItem = query(fixture.nativeElement, '[data-accordion="install-item"]');
    const installTrigger = query<HTMLButtonElement>(
      fixture.nativeElement,
      '[data-accordion="install-trigger"]',
    );
    const installContent = query(fixture.nativeElement, '[data-accordion="install-content"]');
    const themingContent = query(fixture.nativeElement, '[data-accordion="theming-content"]');

    expect(installTrigger.type).toBe('button');
    expect(installItem.getAttribute('data-open')).toBe('');
    expect(installTrigger.getAttribute('data-open')).toBe('');
    expect(installContent.getAttribute('data-open')).toBe('');
    expect(installContent.getAttribute('aria-hidden')).toBeNull();
    expect(installContent.getAttribute('inert')).toBeNull();

    expect(themingContent.getAttribute('aria-hidden')).toBe('true');
    expect(themingContent.getAttribute('inert')).toBe('');
  });

  it('moves the open panel through trigger activation', () => {
    const fixture = TestBed.createComponent(AccordionHost);
    fixture.detectChanges();

    const installContent = query(fixture.nativeElement, '[data-accordion="install-content"]');
    const themingTrigger = query<HTMLButtonElement>(
      fixture.nativeElement,
      '[data-accordion="theming-trigger"]',
    );
    const themingContent = query(fixture.nativeElement, '[data-accordion="theming-content"]');

    themingTrigger.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('theming');
    expect(installContent.getAttribute('aria-hidden')).toBe('true');
    expect(installContent.getAttribute('inert')).toBe('');
    expect(themingTrigger.getAttribute('data-open')).toBe('');
    expect(themingContent.getAttribute('aria-hidden')).toBeNull();
    expect(themingContent.getAttribute('inert')).toBeNull();
  });

  it('routes ui shorthand and part maps through the shared Part-Class Pipeline', () => {
    const fixture = TestBed.createComponent(AccordionHost);
    fixture.detectChanges();

    expectUiRouting(
      className(fixture, '#plain-accordion'),
      className(fixture, '#accordion'),
      ACCORDION_UI_SHORTHAND,
    );
    expectUiRouting(
      className(fixture, '[data-accordion="theming-item"]'),
      className(fixture, '[data-accordion="install-item"]'),
      'border-b-0',
    );
    expectUiRouting(
      className(fixture, '[data-accordion="theming-trigger"]'),
      className(fixture, '[data-accordion="install-trigger"]'),
      'px-hell-7 text-hell-danger',
    );
    expectUiRouting(
      className(fixture, '[data-accordion="theming-content"]'),
      className(fixture, '[data-accordion="install-content"]'),
      'text-hell-foreground',
    );
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(AccordionHost);
      fixture.detectChanges();

      expect({
        accordion: renderedClasses(fixture, '#plain-accordion'),
        item: renderedClasses(fixture, '[data-accordion="theming-item"]'),
        trigger: renderedClasses(fixture, '[data-accordion="theming-trigger"]'),
        content: renderedClasses(fixture, '[data-accordion="theming-content"]'),
      }).toMatchSnapshot('accordion');
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

function className(fixture: { nativeElement: HTMLElement }, selector: string): string {
  return query(fixture.nativeElement, selector).className;
}

/** Rendered classes as a sorted list; class attribute order carries no styling meaning. */
function renderedClasses(fixture: { nativeElement: HTMLElement }, selector: string): string[] {
  return sortClasses(className(fixture, selector));
}

function sortClasses(value: string): string[] {
  return value.split(/\s+/).filter(Boolean).sort();
}

function query<T extends HTMLElement = HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element as T;
}
