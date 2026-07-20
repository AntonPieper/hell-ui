import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellProgress, HellProgressBar } from './progress';

/**
 * Progress specs assert behavior and state attributes. Part-Class Pipeline merge
 * semantics are owned centrally by `core/part-class-pipeline.spec.ts`;
 * ui routing asserts that consumer classes reach each part and that nothing
 * outside the default render and the consumer's ui appears, instead of
 * asserting individual recipe classes. Part Recipes stay package-private per
 * ADR 0002, so the recipe snapshot below pins the rendered class surface per
 * part.
 */

@Component({
  imports: [HellProgress, HellProgressBar],
  template: `
    <div data-test="progress-default" hellProgress value="10">
      <div id="bar-default" hellProgressBar></div>
    </div>

    <div data-test="progress-string" hellProgress value="40" max="80" ui="h-hell-4 bg-hell-danger">
      <div id="bar-string" hellProgressBar ui="bg-hell-success-strong transition-none"></div>
    </div>

    <div data-test="progress-map" hellProgress value="20" max="100" [ui]="progressUi">
      <div id="bar-map" hellProgressBar [ui]="barUi"></div>
    </div>
  `,
})
class ProgressPartStyleHost {
  readonly progressUi = {
    root: 'h-hell-3 rounded-hell-md bg-hell-info-soft',
  };

  readonly barUi = {
    root: 'bg-hell-info transition-none',
  };
}

describe('HellProgress Part Style Maps', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProgressPartStyleHost] }).compileComponents();
  });

  it('applies string shorthand to progress and bar root parts', () => {
    const fixture = TestBed.createComponent(ProgressPartStyleHost);
    fixture.detectChanges();

    const progress = byTest(fixture.nativeElement, 'progress-string');
    const bar = byId(fixture.nativeElement, 'bar-string');

    expect(progress.getAttribute('data-slot')).toBe('root');
    expect(bar.getAttribute('data-slot')).toBe('root');
    expectUiRouting(
      byTest(fixture.nativeElement, 'progress-default').className,
      progress.className,
      'h-hell-4 bg-hell-danger',
    );
    expectUiRouting(
      byId(fixture.nativeElement, 'bar-default').className,
      bar.className,
      'bg-hell-success-strong transition-none',
    );
  });

  it('applies object maps and preserves progress accessibility attributes', () => {
    const fixture = TestBed.createComponent(ProgressPartStyleHost);
    fixture.detectChanges();

    const progress = byTest(fixture.nativeElement, 'progress-map');
    const bar = byId(fixture.nativeElement, 'bar-map');

    expect(progress.getAttribute('data-slot')).toBe('root');
    expect(progress.getAttribute('role')).toBe('progressbar');
    expect(progress.getAttribute('aria-valuenow')).toBe('20');
    expect(progress.getAttribute('aria-valuemax')).toBe('100');
    expectUiRouting(
      byTest(fixture.nativeElement, 'progress-default').className,
      progress.className,
      'h-hell-3 rounded-hell-md bg-hell-info-soft',
    );

    expect(bar.getAttribute('data-slot')).toBe('root');
    expectUiRouting(
      byId(fixture.nativeElement, 'bar-default').className,
      bar.className,
      'bg-hell-info transition-none',
    );
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(ProgressPartStyleHost);
      fixture.detectChanges();

      expect({
        progress: sortClasses(byTest(fixture.nativeElement, 'progress-default').className),
        bar: sortClasses(byId(fixture.nativeElement, 'bar-default').className),
      }).toMatchSnapshot('progress');
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

function byId(root: HTMLElement, id: string): HTMLElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element;
}

function byTest(root: HTMLElement, testId: string): HTMLElement {
  const element = root.querySelector(`[data-test="${testId}"]`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected [data-test="${testId}"].`);
  return element;
}
