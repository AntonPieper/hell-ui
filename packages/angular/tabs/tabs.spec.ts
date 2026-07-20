import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_TABS_IMPORTS } from './tabs';

/**
 * Tabs specs assert behavior, roles, and state attributes. Part-Class
 * Pipeline merge semantics are owned centrally by
 * `core/part-class-pipeline.spec.ts`; ui routing asserts that consumer
 * classes reach each part and that nothing outside the default render and the
 * consumer's ui appears, instead of asserting individual recipe classes. Part
 * Recipes stay package-private per ADR 0002, so the recipe snapshot below
 * pins the rendered class surface per part.
 */
@Component({
  imports: [...HELL_TABS_IMPORTS],
  template: `
    <div hellTabset value="general">
      <div hellTabList>
        <button hellTab type="button" value="general">General</button>
      </div>
      <div hellTabPanel value="general">General panel</div>
    </div>
  `,
})
class DefaultTabsHost {}

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
    await TestBed.configureTestingModule({
      imports: [TabsHost, DefaultTabsHost],
    }).compileComponents();
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

    const defaults = defaultTabClasses();

    expect(tabset.getAttribute('data-slot')).toBe('root');
    expect(tabset.getAttribute('data-orientation')).toBe('vertical');
    expectUiRouting(defaults.tabset, tabset.className, 'gap-hell-8');
    expect(list.getAttribute('data-slot')).toBe('root');
    expectUiRouting(defaults.list, list.className, 'gap-hell-6');
    expect(list.getAttribute('role')).toBe('tablist');
    expect(list.getAttribute('aria-orientation')).toBe('vertical');
    expect(tabs[0].getAttribute('data-slot')).toBe('root');
    expect(tabs[0].type).toBe('button');
    expect(tabs[0].getAttribute('role')).toBe('tab');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expectUiRouting(defaults.tab, tabs[0].className, 'px-hell-6');
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
    expectUiRouting(defaults.tab, tabs[1].className, 'px-hell-6 text-hell-danger');
    expect(panels[0].getAttribute('role')).toBe('tabpanel');
    expect(panels[0].getAttribute('data-slot')).toBe('root');
    expectUiRouting(defaults.panel, panels[0].className, 'py-hell-2');

    tabs[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.events.at(-1)).toBe('security');
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      const defaults = defaultTabClasses();

      expect({
        tabset: sortClasses(defaults.tabset),
        list: sortClasses(defaults.list),
        tab: sortClasses(defaults.tab),
        panel: sortClasses(defaults.panel),
      }).toMatchSnapshot('tabs');
    });
  });
});

function defaultTabClasses(): Record<'tabset' | 'list' | 'tab' | 'panel', string> {
  const fixture = TestBed.createComponent(DefaultTabsHost);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;

  return {
    tabset: query<HTMLElement>(root, '[hellTabset]').className,
    list: query<HTMLElement>(root, '[hellTabList]').className,
    tab: query<HTMLElement>(root, 'button[hellTab]').className,
    panel: query<HTMLElement>(root, '[hellTabPanel]').className,
  };
}

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

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
