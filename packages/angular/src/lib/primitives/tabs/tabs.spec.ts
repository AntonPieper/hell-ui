import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_TABS_DIRECTIVES } from './tabs';

@Component({
  imports: [...HELL_TABS_DIRECTIVES],
  template: `
    <div hellTabset [value]="value()" orientation="vertical" (valueChange)="events.push($any($event))">
      <div hellTabList>
        <button hellTab type="button" value="general">General</button>
        <button hellTab type="button" value="security">Security</button>
      </div>
      <div hellTabPanel value="general">General panel</div>
      <div hellTabPanel value="security">Security panel</div>
    </div>
  `,
})
class TabsHost {
  readonly value = signal('general');
  readonly events: string[] = [];
}

describe('HellTabs', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TabsHost] }).compileComponents();
  });

  it('forwards tab roles, orientation and value changes', () => {
    const fixture = TestBed.createComponent(TabsHost);
    fixture.detectChanges();

    const tabset = query<HTMLElement>(fixture.nativeElement, '[hellTabset]');
    const list = query<HTMLElement>(fixture.nativeElement, '[hellTabList]');
    const tabs = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      'button[hellTab]',
    );
    const panels = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
      '[hellTabPanel]',
    );

    expect(tabset.classList.contains('hell-tabs')).toBe(true);
    expect(tabset.getAttribute('data-orientation')).toBe('vertical');
    expect(list.getAttribute('role')).toBe('tablist');
    expect(list.getAttribute('aria-orientation')).toBe('vertical');
    expect(tabs[0].type).toBe('button');
    expect(tabs[0].getAttribute('role')).toBe('tab');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
    expect(panels[0].getAttribute('role')).toBe('tabpanel');
    expect(panels[0].classList.contains('hell-tab-panel')).toBe(true);

    tabs[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.events.at(-1)).toBe('security');
  });
});

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
