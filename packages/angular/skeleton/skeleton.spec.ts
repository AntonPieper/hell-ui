import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellSkeleton, type HellSkeletonUi } from './skeleton';

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
  `,
})
class SkeletonPartStyleHost {
  readonly skeletonUi = {
    root: 'min-h-hell-8 bg-hell-info-soft',
  } satisfies HellSkeletonUi;
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
    const classes = skeleton.className.split(/\s+/);

    expect(skeleton.getAttribute('data-slot')).toBe('root');
    expect(skeleton.getAttribute('data-shape')).toBe('rect');
    expect(skeleton.getAttribute('aria-hidden')).toBe('true');
    expect(skeleton.style.getPropertyValue('--_hell-skeleton-width')).toBe('12rem');
    expect(skeleton.style.getPropertyValue('--_hell-skeleton-height')).toBe('2rem');
    expect(classes).toContain('rounded-full');
    expect(classes).toContain('bg-hell-danger');
    expect(classes).not.toContain('rounded-sm');
    expect(classes).not.toContain('bg-hell-surface-muted');
    expect(skeleton.classList.contains('hell-skeleton')).toBe(false);
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
    expect(skeleton.className).toContain('min-h-hell-8');
    expect(skeleton.className).toContain('bg-hell-info-soft');
  });
});

function element(root: HTMLElement, id: string): HTMLElement {
  const el = root.querySelector(`#${id}`);
  if (!(el instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return el;
}
