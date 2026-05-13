import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellDialpad } from './dialpad';
import { provideHellLabels } from '../../core/labels';

@Component({
  selector: 'app-dialpad-host',
  imports: [HellDialpad],
  template: `<hell-dialpad />`,
})
class DialpadHost {}

@Component({
  selector: 'app-localized-dialpad-host',
  imports: [HellDialpad],
  providers: [
    provideHellLabels({
      dialpad: {
        dialpad: 'Telefonwählschieber',
        backspace: 'Rücktaste',
        call: 'Anrufen',
      },
    }),
  ],
  template: `<hell-dialpad />`,
})
class LocalizedDialpadHost {}

describe('HellDialpad labels', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialpadHost, LocalizedDialpadHost],
    }).compileComponents();
  });

  it('uses default accessibility and action labels', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    fixture.detectChanges();

    const host = fixture.nativeElement;

    expect(query(host, 'hell-dialpad').getAttribute('aria-label')).toBe('Dial pad');
    expect(query(host, '[data-slot="back"]').getAttribute('aria-label')).toBe('Backspace');
    expect(query(host, '[data-slot="call"]').textContent?.trim()).toBe('Call');
  });

  it('supports label overrides via provideHellLabels', () => {
    const fixture = TestBed.createComponent(LocalizedDialpadHost);
    fixture.detectChanges();

    const host = fixture.nativeElement;

    expect(query(host, 'hell-dialpad').getAttribute('aria-label')).toBe('Telefonwählschieber');
    expect(query(host, '[data-slot="back"]').getAttribute('aria-label')).toBe('Rücktaste');
    expect(query(host, '[data-slot="call"]').textContent?.trim()).toBe('Anrufen');
  });
});

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Expected ${selector}.`);
  }
  return element as T;
}
