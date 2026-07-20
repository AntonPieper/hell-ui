import { provideHellLabels } from '@hell-ui/angular/core';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellSpinner, HELL_SPINNER_LABELS } from './spinner';

/**
 * Spinner specs assert behavior, labels, and state attributes. Part-Class Pipeline
 * merge semantics are owned centrally by `core/part-class-pipeline.spec.ts`;
 * ui routing asserts that consumer classes reach the part and that nothing
 * outside the default render and the consumer's ui appears, instead of
 * asserting individual recipe classes. Part Recipes stay package-private per
 * ADR 0002, so the recipe snapshot below pins the rendered class surface.
 */

@Component({
  imports: [HellSpinner],
  providers: [provideHellLabels(HELL_SPINNER_LABELS, { loading: 'Wird geladen' })],
  template: `
    <span id="localized" hellSpinner></span>
    <span id="explicit" hellSpinner aria-label="Please wait"></span>
  `,
})
class SpinnerHost {}

@Component({
  imports: [HellSpinner],
  providers: [provideHellLabels(HELL_SPINNER_LABELS, { loading: 'Loading from contract' })],
  template: `
    <span id="spinner-default" hellSpinner></span>
    <span id="spinner-string" hellSpinner variant="dots" size="lg" ui="block text-hell-danger"></span>
    <span id="spinner-map" hellSpinner variant="bars" size="sm" [ui]="spinnerUi"></span>
  `,
})
class SpinnerPartStyleHost {
  readonly spinnerUi = {
    root: 'text-hell-info',
  };
}

describe('HellSpinner', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpinnerHost, SpinnerPartStyleHost],
    }).compileComponents();
  });

  it('uses the label contract unless aria-label is explicit', () => {
    const fixture = TestBed.createComponent(SpinnerHost);
    fixture.detectChanges();

    expect(spinner(fixture.nativeElement, 'localized').getAttribute('aria-label')).toBe(
      'Wird geladen',
    );
    expect(spinner(fixture.nativeElement, 'explicit').getAttribute('aria-label')).toBe(
      'Please wait',
    );
  });

  it('applies object maps to the Spinner root', () => {
    const fixture = TestBed.createComponent(SpinnerPartStyleHost);
    fixture.detectChanges();

    const spinnerMap = spinner(fixture.nativeElement, 'spinner-map');

    expect(spinnerMap.getAttribute('data-slot')).toBe('root');
    expect(spinnerMap.getAttribute('role')).toBe('status');
    expect(spinnerMap.getAttribute('aria-label')).toBe('Loading from contract');
    expect(spinnerMap.getAttribute('data-variant')).toBe('bars');
    expect(spinnerMap.getAttribute('data-size')).toBe('sm');
    expectUiRouting(
      spinner(fixture.nativeElement, 'spinner-default').className,
      spinnerMap.className,
      'text-hell-info',
    );
  });

  it('applies Spinner string shorthand through hellTwMerge without dropping label behavior', () => {
    const fixture = TestBed.createComponent(SpinnerPartStyleHost);
    fixture.detectChanges();

    const spinnerString = spinner(fixture.nativeElement, 'spinner-string');

    expect(spinnerString.getAttribute('data-slot')).toBe('root');
    expect(spinnerString.getAttribute('role')).toBe('status');
    expect(spinnerString.getAttribute('aria-label')).toBe('Loading from contract');
    expect(spinnerString.getAttribute('data-variant')).toBe('dots');
    expect(spinnerString.getAttribute('data-size')).toBe('lg');
    expectUiRouting(
      spinner(fixture.nativeElement, 'spinner-default').className,
      spinnerString.className,
      'block text-hell-danger',
    );
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(SpinnerPartStyleHost);
      fixture.detectChanges();

      expect({
        root: sortClasses(spinner(fixture.nativeElement, 'spinner-default').className),
      }).toMatchSnapshot('spinner');
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

function spinner(root: HTMLElement, id: string): HTMLElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element;
}
