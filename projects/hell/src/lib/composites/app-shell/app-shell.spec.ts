import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_APP_SHELL_DIRECTIVES } from './app-shell';

@Component({
  imports: [...HELL_APP_SHELL_DIRECTIVES],
  template: `
    <div hellAppShell #shell="hellAppShell">
      <header hellAppTopbar>
        <button id="sidenav-toggle" hellSidenavToggle type="button"></button>
      </header>
      <nav hellAppSidenav>
        <div id="nav-section" hellNavSection>
          <button id="nav-section-toggle" hellNavSectionToggle type="button">Settings</button>
          <div id="nav-section-items" hellNavSectionItems>
            <a hellNavItem href="#">Preferences</a>
          </div>
        </div>
        <div
          id="controlled-nav-section"
          hellNavSection
          [collapsed]="controlledNavSectionCollapsed()"
          (collapsedChange)="collapsedEvents.push($event)"
        >
          <button id="controlled-nav-section-toggle" hellNavSectionToggle type="button">
            Controlled
          </button>
          <div hellNavSectionItems>
            <a hellNavItem href="#">API keys</a>
          </div>
        </div>
      </nav>
      <main hellAppContent>Content</main>
      <aside hellAppSecondary>
        <button
          hellSecondaryToggle
          appearance="rail"
          type="button"
        ></button>
        <div hellAppSecondaryBody>
          <button
            hellSecondaryToggle
            appearance="header"
            type="button"
          >Title</button>
          <p>Body</p>
        </div>
      </aside>
    </div>
  `,
})
class TestHost {
  readonly controlledNavSectionCollapsed = signal(false);
  readonly collapsedEvents: boolean[] = [];
}

describe('HellAppShell secondary panel', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();
  });

  it('owns sidenav toggle labels in the default case', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    const toggle = query<HTMLButtonElement>(fixture.nativeElement, '#sidenav-toggle');
    const sidenav = query(fixture.nativeElement, 'nav');

    expect(toggle.getAttribute('aria-label')).toBe('Collapse sidebar');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    toggle.click();
    fixture.detectChanges();

    expect(sidenav.getAttribute('data-collapsed')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Expand sidebar');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
  });

  it('owns nav section classes and collapsed attributes', () => {
    const fixture = TestBed.createComponent(TestHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const section = query(fixture.nativeElement, '#nav-section');
    const toggle = query<HTMLButtonElement>(fixture.nativeElement, '#nav-section-toggle');
    const items = query(fixture.nativeElement, '#nav-section-items');

    expect(section.classList.contains('hell-nav-section')).toBe(true);
    expect(section.getAttribute('data-slot')).toBe('nav-section');
    expect(section.getAttribute('data-collapsed')).toBeNull();
    expect(toggle.classList.contains('hell-nav-section-toggle')).toBe(true);
    expect(toggle.getAttribute('data-slot')).toBe('nav-section-toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(items.classList.contains('hell-nav-section-items')).toBe(true);
    expect(items.getAttribute('data-slot')).toBe('nav-section-items');
    expect(items.getAttribute('aria-hidden')).toBeNull();
    expect(items.hasAttribute('inert')).toBe(false);

    toggle.click();
    fixture.detectChanges();

    expect(section.getAttribute('data-collapsed')).toBe('true');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(items.getAttribute('aria-hidden')).toBe('true');
    expect(items.hasAttribute('inert')).toBe(true);

    query<HTMLButtonElement>(fixture.nativeElement, '#sidenav-toggle').click();
    fixture.detectChanges();

    expect(items.getAttribute('aria-hidden')).toBeNull();
    expect(items.hasAttribute('inert')).toBe(false);

    query<HTMLButtonElement>(fixture.nativeElement, '#controlled-nav-section-toggle').click();
    fixture.detectChanges();
    expect(host.collapsedEvents).toEqual([true]);
  });

  it('roundtrips state via header toggle and rail toggle', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    const aside = fixture.nativeElement.querySelector('aside') as HTMLElement;
    const body = aside.querySelector('.hell-secondary-body') as HTMLElement;
    const headerToggle = aside.querySelector(
      'button[data-hell-secondary-toggle="header"]',
    ) as HTMLButtonElement;
    const rail = aside.querySelector(
      'button[data-hell-secondary-toggle="rail"]',
    ) as HTMLButtonElement;

    // Both toggles always present; consumer is responsible for placement.
    expect(body).not.toBeNull();
    expect(headerToggle).not.toBeNull();
    expect(rail).not.toBeNull();

    // Expanded.
    expect(aside.getAttribute('data-hidden')).toBeNull();
    expect(aside.getAttribute('aria-hidden')).toBeNull();
    expect(body.getAttribute('aria-hidden')).toBeNull();
    expect(headerToggle.getAttribute('aria-label')).toBe('Hide secondary panel');

    // Header toggle collapses the panel.
    headerToggle.click();
    fixture.detectChanges();
    expect(aside.getAttribute('data-hidden')).toBe('true');
    expect(aside.getAttribute('aria-hidden')).toBeNull();
    expect(body.getAttribute('aria-hidden')).toBe('true');
    expect(body.hasAttribute('inert')).toBe(true);
    expect(rail.getAttribute('aria-label')).toBe('Show secondary panel');

    // Rail toggle re-expands.
    rail.click();
    fixture.detectChanges();
    expect(aside.getAttribute('data-hidden')).toBeNull();
    expect(body.getAttribute('aria-hidden')).toBeNull();
    expect(body.hasAttribute('inert')).toBe(false);
  });
});

function query<T extends HTMLElement = HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element as T;
}
