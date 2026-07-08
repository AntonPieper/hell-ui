import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellSpinner, type HellSpinnerUi, provideHellSpinnerLabels } from './spinner';

@Component({
  imports: [HellSpinner],
  providers: [provideHellSpinnerLabels({ loading: 'Wird geladen' })],
  template: `
    <span id="localized" hellSpinner></span>
    <span id="explicit" hellSpinner aria-label="Please wait"></span>
  `,
})
class SpinnerHost {}

@Component({
  imports: [HellSpinner],
  providers: [provideHellSpinnerLabels({ loading: 'Loading from contract' })],
  template: `
    <span id="spinner-string" hellSpinner variant="dots" size="lg" ui="block text-hell-danger"></span>
    <span id="spinner-map" hellSpinner variant="bars" size="sm" [ui]="spinnerUi"></span>
  `,
})
class SpinnerPartStyleHost {
  readonly spinnerUi = {
    root: 'text-hell-info',
  } satisfies HellSpinnerUi;
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
    expect(spinnerMap.className).toContain('text-hell-info');
  });

  it('applies Spinner string shorthand through hellTwMerge without dropping label behavior', () => {
    const fixture = TestBed.createComponent(SpinnerPartStyleHost);
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
  });
});

function spinner(root: HTMLElement, id: string): HTMLElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element;
}
