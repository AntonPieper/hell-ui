import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideHellLabels } from '@hell-ui/angular/core';
import {
  HellSkeleton,
  type HellSkeletonUi,
  HellSpinner,
  type HellSpinnerUi,
} from './skeleton';

@Component({
  imports: [HellSpinner],
  providers: [provideHellLabels({ loading: 'Wird geladen' })],
  template: `
    <span id="localized" hellSpinner></span>
    <span id="explicit" hellSpinner aria-label="Please wait"></span>
  `,
})
class SpinnerHost {}

@Component({
  imports: [HellSkeleton, HellSpinner],
  providers: [provideHellLabels({ loading: 'Loading from contract' })],
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
    <span id="spinner-string" hellSpinner variant="dots" size="lg" ui="block text-hell-danger"></span>
    <span id="spinner-map" hellSpinner variant="bars" size="sm" [ui]="spinnerUi"></span>
  `,
})
class SkeletonPartStyleHost {
  readonly skeletonUi = {
    root: 'min-h-hell-8 bg-hell-info-soft',
  } satisfies HellSkeletonUi;

  readonly spinnerUi = {
    root: 'text-hell-info',
  } satisfies HellSpinnerUi;
}

describe('HellSpinner', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpinnerHost, SkeletonPartStyleHost],
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

  it('applies Skeleton string shorthand to the root part and preserves host attributes', () => {
    const fixture = TestBed.createComponent(SkeletonPartStyleHost);
    fixture.detectChanges();

    const skeleton = spinner(fixture.nativeElement, 'skeleton-string');
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

  it('applies object maps to Skeleton and Spinner roots', () => {
    const fixture = TestBed.createComponent(SkeletonPartStyleHost);
    fixture.detectChanges();

    const skeleton = spinner(fixture.nativeElement, 'skeleton-map');
    const spinnerMap = spinner(fixture.nativeElement, 'spinner-map');

    expect(skeleton.getAttribute('data-slot')).toBe('root');
    expect(skeleton.className).toContain('min-h-hell-8');
    expect(skeleton.className).toContain('bg-hell-info-soft');

    expect(spinnerMap.getAttribute('data-slot')).toBe('root');
    expect(spinnerMap.getAttribute('role')).toBe('status');
    expect(spinnerMap.getAttribute('aria-label')).toBe('Loading from contract');
    expect(spinnerMap.getAttribute('data-variant')).toBe('bars');
    expect(spinnerMap.getAttribute('data-size')).toBe('sm');
    expect(spinnerMap.className).toContain('text-hell-info');
  });

  it('applies Spinner string shorthand through hellTwMerge without dropping label behavior', () => {
    const fixture = TestBed.createComponent(SkeletonPartStyleHost);
    fixture.detectChanges();

    const spinnerString = spinner(fixture.nativeElement, 'spinner-string');
    const classes = spinnerString.className.split(/\s+/);

    expect(spinnerString.getAttribute('data-slot')).toBe('root');
    expect(spinnerString.getAttribute('role')).toBe('status');
    expect(spinnerString.getAttribute('aria-label')).toBe('Loading from contract');
    expect(spinnerString.getAttribute('data-variant')).toBe('dots');
    expect(spinnerString.getAttribute('data-size')).toBe('lg');
    expect(classes).toContain('block');
    expect(classes).toContain('text-hell-danger');
    expect(classes).not.toContain('inline-block');
    expect(classes).not.toContain('text-current');
    expect(spinnerString.classList.contains('hell-spinner')).toBe(false);
  });
});

function spinner(root: HTMLElement, id: string): HTMLElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element;
}
