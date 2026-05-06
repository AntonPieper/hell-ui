import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellSwitch } from './switch';

@Component({
  imports: [HellSwitch],
  template: `
    <button
      hellSwitch
      [checked]="checked()"
      [disabled]="disabled()"
      (checkedChange)="checkedEvents.push($event)"
    ></button>
  `,
})
class SwitchHost {
  readonly checked = signal(false);
  readonly disabled = signal(false);
  readonly checkedEvents: boolean[] = [];
}

describe('HellSwitch', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SwitchHost] }).compileComponents();
  });

  it('uses a native button host and forwards switch state', () => {
    const fixture = TestBed.createComponent(SwitchHost);
    fixture.detectChanges();

    const sw = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSwitch]');

    expect(sw.type).toBe('button');
    expect(sw.classList.contains('hell-switch')).toBe(true);
    expect(sw.getAttribute('role')).toBe('switch');
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(sw.querySelector('[ngpswitchthumb]')).not.toBeNull();

    sw.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.checkedEvents).toEqual([true]);

    fixture.componentInstance.checked.set(true);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(sw.disabled).toBe(true);
  });
});

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
