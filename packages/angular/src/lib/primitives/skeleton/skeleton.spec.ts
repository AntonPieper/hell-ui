import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideHellLabels } from '../../core/labels';
import { HellSpinner } from './skeleton';

@Component({
  imports: [HellSpinner],
  providers: [provideHellLabels({ loading: 'Wird geladen' })],
  template: `
    <span id="localized" hellSpinner></span>
    <span id="explicit" hellSpinner aria-label="Please wait"></span>
  `,
})
class SpinnerHost {}

describe('HellSpinner', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SpinnerHost] }).compileComponents();
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
});

function spinner(root: HTMLElement, id: string): HTMLElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element;
}
