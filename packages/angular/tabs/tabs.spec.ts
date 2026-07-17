import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_TABS_IMPORTS } from './tabs';

@Component({
  imports: [...HELL_TABS_IMPORTS],
  template: `
    <div
      hellTabset
      [value]="value()"
      orientation="vertical"
      [ui]="tabsetUi"
      (valueChange)="events.push($any($event))"
    >
      <div hellTabList ui="gap-hell-6">
        <button hellTab type="button" value="general" ui="px-hell-6">General</button>
        <button hellTab type="button" value="security" [ui]="tabUi">Security</button>
      </div>
      <div hellTabPanel value="general" [ui]="panelUi">General panel</div>
      <div hellTabPanel value="security">Security panel</div>
    </div>
  `,
})
class TabsHost {
  readonly value = signal('general');
  readonly events: string[] = [];
  protected readonly tabsetUi = {
    root: 'gap-hell-8',
  };
  protected readonly tabUi = {
    root: 'px-hell-6 text-hell-danger',
  };
  protected readonly panelUi = {
    root: 'py-hell-2',
  };
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

    expect(tabset.getAttribute('data-slot')).toBe('root');
    expect(tabset.getAttribute('data-orientation')).toBe('vertical');
    expect(tabset.classList.contains('gap-hell-8')).toBe(true);
    expect(tabset.classList.contains('gap-hell-4')).toBe(false);
    expect(list.getAttribute('data-slot')).toBe('root');
    expect(list.classList.contains('gap-hell-6')).toBe(true);
    expect(list.classList.contains('gap-0.5')).toBe(false);
    expect(list.getAttribute('role')).toBe('tablist');
    expect(list.getAttribute('aria-orientation')).toBe('vertical');
    expect(tabs[0].getAttribute('data-slot')).toBe('root');
    expect(tabs[0].type).toBe('button');
    expect(tabs[0].getAttribute('role')).toBe('tab');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].classList.contains('px-hell-6')).toBe(true);
    expect(tabs[0].classList.contains('px-hell-4')).toBe(false);
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
    expect(tabs[1].classList.contains('text-hell-danger')).toBe(true);
    expect(tabs[1].classList.contains('text-hell-foreground-muted')).toBe(false);
    expect(panels[0].getAttribute('role')).toBe('tabpanel');
    expect(panels[0].getAttribute('data-slot')).toBe('root');
    expect(panels[0].classList.contains('py-hell-2')).toBe(true);
    expect(panels[0].classList.contains('py-hell-6')).toBe(false);

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
