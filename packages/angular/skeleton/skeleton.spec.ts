import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellSkeleton } from './skeleton';

/**
 * Skeleton specs assert behavior and state attributes. Part-Class Pipeline merge
 * semantics are owned centrally by `core/part-class-pipeline.spec.ts`;
 * ui routing asserts that consumer classes reach each part and that nothing
 * outside the default render and the consumer's ui appears, instead of
 * asserting individual recipe classes. Part Recipes stay package-private per
 * ADR 0002, so the recipe snapshot below pins the rendered class surface per
 * part.
 */

@Component({
  imports: [HellSkeleton],
  template: `<div id="skeleton-class-hook" hellSkeleton class="h-5 w-3/5"></div>`,
})
class SkeletonClassHookHost {}

@Component({
  imports: [HellSkeleton],
  template: `
    <div
      id="skeleton-string"
      hellSkeleton
      shape="rect"
      width="12rem"
      height="2rem"
      ui="rounded-full bg-hell-danger"
    ></div>
    <div id="skeleton-map" hellSkeleton [ui]="skeletonUi"></div>
    <div id="skeleton-default" hellSkeleton></div>
  `,
})
class SkeletonPartStyleHost {
  readonly skeletonUi = {
    root: 'min-h-hell-8 bg-hell-info-soft',
  };
}

describe('HellSkeleton', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonPartStyleHost, SkeletonClassHookHost],
    }).compileComponents();
  });

  it('applies Skeleton string shorthand to the root part and preserves host attributes', () => {
    const fixture = TestBed.createComponent(SkeletonPartStyleHost);
    fixture.detectChanges();

    const skeleton = element(fixture.nativeElement, 'skeleton-string');

    expect(skeleton.getAttribute('data-slot')).toBe('root');
    expect(skeleton.getAttribute('data-shape')).toBe('rect');
    expect(skeleton.getAttribute('aria-hidden')).toBe('true');
    expect(skeleton.style.getPropertyValue('--_hell-skeleton-width')).toBe('12rem');
    expect(skeleton.style.getPropertyValue('--_hell-skeleton-height')).toBe('2rem');
    expectUiRouting(
      element(fixture.nativeElement, 'skeleton-default').className,
      skeleton.className,
      'rounded-full bg-hell-danger',
    );
  });

  it('leaves sizing to consumer utility classes instead of recipe width/height utilities', () => {
    const fixture = TestBed.createComponent(SkeletonClassHookHost);
    fixture.detectChanges();

    const skeleton = element(fixture.nativeElement, 'skeleton-class-hook');
    const classes = skeleton.className.split(/\s+/);

    // Consumer layout hooks must win: the recipe may not re-introduce
    // width/height utilities that outrank `class="h-5 w-3/5"` by stylesheet
    // order. Sizing defaults live in the entrypoint stylesheet instead.
    expect(classes).toContain('h-5');
    expect(classes).toContain('w-3/5');
    expect(skeleton.className).not.toMatch(/h-\[var\(--_hell-skeleton-height/);
    expect(skeleton.className).not.toMatch(/w-\[var\(--_hell-skeleton-width/);
    expect(skeleton.className).not.toContain('min-h-hell-3');

    // The stylesheet defaults still receive their inputs through host vars.
    expect(skeleton.style.getPropertyValue('--_hell-skeleton-width')).toBe('100%');
    expect(skeleton.style.getPropertyValue('--_hell-skeleton-height')).toBe('14px');
  });

  it('applies object maps to the Skeleton root', () => {
    const fixture = TestBed.createComponent(SkeletonPartStyleHost);
    fixture.detectChanges();

    const skeleton = element(fixture.nativeElement, 'skeleton-map');

    expect(skeleton.getAttribute('data-slot')).toBe('root');
    expectUiRouting(
      element(fixture.nativeElement, 'skeleton-default').className,
      skeleton.className,
      'min-h-hell-8 bg-hell-info-soft',
    );
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(SkeletonPartStyleHost);
      fixture.detectChanges();

      expect({
        root: sortClasses(element(fixture.nativeElement, 'skeleton-default').className),
      }).toMatchSnapshot('skeleton');
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

function element(root: HTMLElement, id: string): HTMLElement {
  const el = root.querySelector(`#${id}`);
  if (!(el instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return el;
}
