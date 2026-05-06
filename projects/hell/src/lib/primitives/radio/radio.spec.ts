import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellRadio, HellRadioGroup } from './radio';

@Component({
  imports: [HellRadioGroup, HellRadio],
  template: `
    <div hellRadioGroup [value]="value()" orientation="horizontal" (valueChange)="events.push($any($event))">
      <button hellRadio type="button" value="a">A</button>
      <button hellRadio type="button" value="b">B</button>
    </div>
  `,
})
class RadioHost {
  readonly value = signal('a');
  readonly events: string[] = [];
}

describe('HellRadio', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RadioHost] }).compileComponents();
  });

  it('uses native button radio items and forwards group state', () => {
    const fixture = TestBed.createComponent(RadioHost);
    fixture.detectChanges();

    const group = query<HTMLElement>(fixture.nativeElement, '[hellRadioGroup]');
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      'button[hellRadio]',
    );

    expect(group.classList.contains('hell-radio-group')).toBe(true);
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(group.getAttribute('data-orientation')).toBe('horizontal');
    expect(items[0].type).toBe('button');
    expect(items[0].getAttribute('role')).toBe('radio');
    expect(items[0].getAttribute('aria-checked')).toBe('true');
    expect(items[1].getAttribute('aria-checked')).toBe('false');

    items[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.events.at(-1)).toBe('b');
  });
});

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
