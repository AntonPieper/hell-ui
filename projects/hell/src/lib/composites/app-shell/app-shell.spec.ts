import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BreakpointObserver, type BreakpointState } from '@angular/cdk/layout';
import { ReplaySubject } from 'rxjs';

import { provideHellLabels } from '../../core/labels';
import { HELL_APP_SHELL_DIRECTIVES, HELL_APP_SHELL_MOBILE_MEDIA } from './app-shell';

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
        <button hellSecondaryToggle appearance="rail" type="button"></button>
        <div hellAppSecondaryBody>
          <button hellSecondaryToggle appearance="header" type="button">Title</button>
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

@Component({
  imports: [...HELL_APP_SHELL_DIRECTIVES],
  providers: [
    provideHellLabels({
      appShell: {
        expandSidebar: 'Open local navigation',
        collapseSidebar: 'Close local navigation',
        showSecondaryPanel: 'Show local secondary panel',
        hideSecondaryPanel: 'Hide local secondary panel',
      },
    }),
  ],
  template: `
    <div hellAppShell>
      <header hellAppTopbar>
        <button id="localized-sidenav-toggle" hellSidenavToggle type="button"></button>
      </header>
      <nav id="localized-sidenav" hellAppSidenav>Navigation</nav>
      <main hellAppContent>Content</main>
      <aside id="localized-secondary" hellAppSecondary>
        <button id="localized-secondary-toggle" hellSecondaryToggle type="button"></button>
        <div hellAppSecondaryBody>Secondary</div>
      </aside>
    </div>
  `,
})
class LocalizedShellHost {}

@Component({
  imports: [...HELL_APP_SHELL_DIRECTIVES],
  template: `
    <div
      hellAppShell
      [sidenavCollapsed]="sidenavCollapsed()"
      (sidenavCollapsedChange)="sidenavEvents.push($event)"
      [secondaryHidden]="secondaryHidden()"
      (secondaryHiddenChange)="secondaryEvents.push($event)"
    >
      <header hellAppTopbar>
        <button id="controlled-sidenav-toggle" hellSidenavToggle type="button"></button>
      </header>
      <nav id="controlled-sidenav" hellAppSidenav>Navigation</nav>
      <main hellAppContent>Content</main>
      <aside id="controlled-secondary" hellAppSecondary>
        <button id="controlled-secondary-toggle" hellSecondaryToggle type="button"></button>
        <div hellAppSecondaryBody>Secondary</div>
      </aside>
    </div>
  `,
})
class ControlledShellHost {
  readonly sidenavCollapsed = signal(false);
  readonly secondaryHidden = signal(false);
  readonly sidenavEvents: boolean[] = [];
  readonly secondaryEvents: boolean[] = [];
}

@Component({
  imports: [...HELL_APP_SHELL_DIRECTIVES],
  template: `
    <div id="unstyled-shell" hellAppShell unstyled>
      <header hellAppTopbar unstyled>
        <button id="unstyled-sidenav-toggle" hellSidenavToggle type="button"></button>
      </header>
      <nav id="unstyled-sidenav" hellAppSidenav unstyled>Navigation</nav>
      <main id="unstyled-content" hellAppContent unstyled>Content</main>
      <aside id="unstyled-secondary" hellAppSecondary unstyled>
        <button id="unstyled-secondary-toggle" hellSecondaryToggle type="button"></button>
        <div id="unstyled-secondary-body" hellAppSecondaryBody unstyled>Secondary</div>
      </aside>
    </div>
  `,
})
class UnstyledShellHost {}

@Component({
  imports: [...HELL_APP_SHELL_DIRECTIVES],
  template: `
    <div id="focus-shell" hellAppShell>
      <header hellAppTopbar>
        <button id="focus-sidenav-toggle" hellSidenavToggle type="button"></button>
      </header>
      <nav id="focus-sidenav" hellAppSidenav>
        <button id="focus-sidenav-disabled" type="button" disabled>Disabled</button>
        <button id="focus-sidenav-item" type="button">Item</button>
      </nav>
      <main id="focus-content" hellAppContent>Content</main>
      <aside hellAppSecondary>
        <button id="focus-secondary-toggle" hellSecondaryToggle type="button"></button>
        <div hellAppSecondaryBody>
          <button>Action</button>
        </div>
      </aside>
    </div>
  `,
})
class FocusShellHost {}

@Component({
  imports: [...HELL_APP_SHELL_DIRECTIVES],
  template: `
    <div id="fallback-shell" hellAppShell>
      <header hellAppTopbar>
        <button id="fallback-sidenav-toggle" hellSidenavToggle type="button"></button>
      </header>
      <nav id="fallback-sidenav" hellAppSidenav>
        <div>No focusable controls</div>
      </nav>
      <main id="fallback-content" hellAppContent>Content</main>
      <aside hellAppSecondary>
        <button id="fallback-secondary-toggle" hellSecondaryToggle type="button"></button>
        <div id="fallback-secondary-body" hellAppSecondaryBody>
          <div>Details</div>
        </div>
      </aside>
    </div>
  `,
})
class FallbackShellHost {}

let mediaController: ReturnType<typeof createMobileLayoutController>;

describe('HellAppShell secondary panel', () => {
  beforeEach(async () => {
    mediaController = createMobileLayoutController(false);
    await TestBed.configureTestingModule({
      imports: [
        TestHost,
        LocalizedShellHost,
        ControlledShellHost,
        UnstyledShellHost,
        FocusShellHost,
        FallbackShellHost,
      ],
      providers: [{ provide: BreakpointObserver, useValue: mediaController }],
    }).compileComponents();
  });

  it('owns sidenav toggle labels in the default case', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    const toggle = query<HTMLButtonElement>(fixture.nativeElement, '#sidenav-toggle');
    const sidenav = query(fixture.nativeElement, 'nav');

    expect(toggle.getAttribute('aria-label')).toBe('Collapse sidebar');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-controls')).toBe(sidenav.getAttribute('id'));

    toggle.click();
    fixture.detectChanges();

    expect(sidenav.getAttribute('data-collapsed')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Expand sidebar');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('uses injected label contract text for shell toggles', () => {
    const fixture = TestBed.createComponent(LocalizedShellHost);
    fixture.detectChanges();

    const sidenavToggle = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#localized-sidenav-toggle',
    );
    const secondaryToggle = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#localized-secondary-toggle',
    );

    expect(sidenavToggle.getAttribute('aria-label')).toBe('Close local navigation');
    sidenavToggle.click();
    fixture.detectChanges();
    expect(sidenavToggle.getAttribute('aria-label')).toBe('Open local navigation');

    expect(secondaryToggle.getAttribute('aria-label')).toBe('Hide local secondary panel');
    secondaryToggle.click();
    fixture.detectChanges();
    expect(secondaryToggle.getAttribute('aria-label')).toBe('Show local secondary panel');
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

  it('treats explicit shell inputs as the source of truth', () => {
    const fixture = TestBed.createComponent(ControlledShellHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const sidenav = query(fixture.nativeElement, '#controlled-sidenav');
    const secondary = query(fixture.nativeElement, '#controlled-secondary');
    const sidenavToggle = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#controlled-sidenav-toggle',
    );
    const secondaryToggle = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#controlled-secondary-toggle',
    );

    expect(sidenav.getAttribute('data-collapsed')).toBeNull();
    expect(secondary.getAttribute('data-hidden')).toBeNull();

    sidenavToggle.click();
    secondaryToggle.click();
    fixture.detectChanges();

    expect(host.sidenavEvents).toEqual([true]);
    expect(host.secondaryEvents).toEqual([true]);
    expect(sidenav.getAttribute('data-collapsed')).toBeNull();
    expect(secondary.getAttribute('data-hidden')).toBeNull();

    host.sidenavCollapsed.set(true);
    host.secondaryHidden.set(true);
    fixture.detectChanges();

    expect(sidenav.getAttribute('data-collapsed')).toBe('true');
    expect(secondary.getAttribute('data-hidden')).toBe('true');
  });

  it('keeps behavior sentinels when shell parts opt out of styling', () => {
    const fixture = TestBed.createComponent(UnstyledShellHost);
    fixture.detectChanges();

    const shell = query(fixture.nativeElement, '#unstyled-shell');
    const sidenav = query(fixture.nativeElement, '#unstyled-sidenav');
    const secondary = query(fixture.nativeElement, '#unstyled-secondary');
    const sidenavToggle = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#unstyled-sidenav-toggle',
    );
    const secondaryToggle = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#unstyled-secondary-toggle',
    );

    expect(shell.classList.contains('hell-shell')).toBe(false);
    expect(sidenav.classList.contains('hell-sidenav')).toBe(false);
    expect(secondary.classList.contains('hell-secondary')).toBe(false);
    expect(sidenav.getAttribute('data-hell-app-shell-panel')).toBe('sidenav');
    expect(secondary.getAttribute('data-hell-app-shell-panel')).toBe('secondary');
    expect(sidenavToggle.getAttribute('data-hell-app-shell-toggle')).toBe('sidenav');
    expect(secondaryToggle.getAttribute('data-hell-app-shell-toggle')).toBe('secondary');
  });

  it('clears mobile panel state when media query switches back to desktop', () => {
    const mobile = mockMobileLayoutController(true);
    const fixture = TestBed.createComponent(UnstyledShellHost);
    fixture.detectChanges();

    const shell = query(fixture.nativeElement, '#unstyled-shell');
    const sidenav = query(fixture.nativeElement, '#unstyled-sidenav');
    const sidenavToggle = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#unstyled-sidenav-toggle',
    );

    sidenavToggle.click();
    fixture.detectChanges();

    expect(shell.getAttribute('data-mobile-sidenav-open')).toBe('true');
    expect(sidenav.getAttribute('data-mobile-hidden')).toBeNull();

    mobile.setMatches(false);
    fixture.detectChanges();

    expect(shell.getAttribute('data-mobile-layout')).toBeNull();
    expect(shell.getAttribute('data-mobile-sidenav-open')).toBeNull();

    mobile.setMatches(true);
    fixture.detectChanges();

    expect(shell.getAttribute('data-mobile-sidenav-open')).toBeNull();
    expect(sidenav.getAttribute('data-mobile-hidden')).toBe('true');
  });

  it('uses behavior sentinels, not style classes, when dismissing mobile panels', () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(UnstyledShellHost);
    fixture.detectChanges();

    const shell = query(fixture.nativeElement, '#unstyled-shell');
    const sidenav = query(fixture.nativeElement, '#unstyled-sidenav');
    const content = query(fixture.nativeElement, '#unstyled-content');
    const sidenavToggle = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#unstyled-sidenav-toggle',
    );

    sidenavToggle.click();
    fixture.detectChanges();
    expect(shell.getAttribute('data-mobile-sidenav-open')).toBe('true');

    pointerDown(sidenav);
    fixture.detectChanges();
    expect(shell.getAttribute('data-mobile-sidenav-open')).toBe('true');

    pointerDown(content);
    fixture.detectChanges();
    expect(shell.getAttribute('data-mobile-sidenav-open')).toBeNull();
  });

  it('uses CDK tabbability when focusing mobile panels and restores trigger focus', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(FocusShellHost);
    const toggle = query<HTMLButtonElement>(fixture.nativeElement, '#focus-sidenav-toggle');
    const panelItem = query<HTMLButtonElement>(fixture.nativeElement, '#focus-sidenav-item');
    const content = query<HTMLElement>(fixture.nativeElement, '#focus-content');

    toggle.focus();
    await settle(fixture);
    expect(document.activeElement).toBe(toggle);

    toggle.click();
    await settle(fixture);
    expect(document.activeElement).toBe(panelItem);

    pointerDown(content);
    await settle(fixture);
    expect(document.activeElement).toBe(toggle);
  });

  it('falls back focus to the panel when there are no tabbables', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(FallbackShellHost);
    const toggle = query<HTMLButtonElement>(fixture.nativeElement, '#fallback-sidenav-toggle');
    const panel = query<HTMLElement>(fixture.nativeElement, '#fallback-sidenav');
    const content = query<HTMLElement>(fixture.nativeElement, '#fallback-content');

    toggle.focus();
    await settle(fixture);
    expect(document.activeElement).toBe(toggle);

    toggle.click();
    await settle(fixture);
    expect(document.activeElement).toBe(panel);

    pointerDown(content);
    await settle(fixture);
    expect(document.activeElement).toBe(toggle);
  });

  it('closes mobile panels when Escape is pressed', () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(UnstyledShellHost);
    fixture.detectChanges();

    const shell = query(fixture.nativeElement, '#unstyled-shell');
    const secondaryToggle = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#unstyled-secondary-toggle',
    );
    const content = query(fixture.nativeElement, '#unstyled-content');

    secondaryToggle.click();
    fixture.detectChanges();
    expect(shell.getAttribute('data-mobile-secondary-open')).toBe('true');

    keyDownEscape(content);
    fixture.detectChanges();
    expect(shell.getAttribute('data-mobile-secondary-open')).toBeNull();
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
    expect(headerToggle.getAttribute('aria-expanded')).toBe('true');
    expect(headerToggle.getAttribute('aria-controls')).toBe(aside.getAttribute('id'));
    expect(headerToggle.getAttribute('aria-label')).toBe('Hide secondary panel');

    // Header toggle collapses the panel.
    headerToggle.click();
    fixture.detectChanges();
    expect(aside.getAttribute('data-hidden')).toBe('true');
    expect(aside.getAttribute('aria-hidden')).toBeNull();
    expect(body.getAttribute('aria-hidden')).toBe('true');
    expect(body.hasAttribute('inert')).toBe(true);
    expect(rail.getAttribute('aria-expanded')).toBe('false');
    expect(rail.getAttribute('aria-controls')).toBe(aside.getAttribute('id'));
    expect(rail.getAttribute('aria-label')).toBe('Show secondary panel');

    // Rail toggle re-expands.
    rail.click();
    fixture.detectChanges();
    expect(aside.getAttribute('data-hidden')).toBeNull();
    expect(body.getAttribute('aria-hidden')).toBeNull();
    expect(body.hasAttribute('inert')).toBe(false);
  });
});

function mockMobileLayout(matches: boolean): void {
  mediaController.setMatches(matches);
}

function mockMobileLayoutController(matches: boolean) {
  mediaController.setMatches(matches);
  return mediaController;
}

function createMobileLayoutController(matches: boolean) {
  const state = new ReplaySubject<BreakpointState>(1);

  const toState = (value: boolean): BreakpointState => ({
    matches: value,
    breakpoints: {
      [HELL_APP_SHELL_MOBILE_MEDIA]: value,
    },
  });

  const setMatches = (next: boolean): void => state.next(toState(next));

  setMatches(matches);

  return {
    observe: vi.fn(() => state.asObservable()),
    setMatches,
  };
}

function pointerDown(element: HTMLElement): void {
  element.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
}

function keyDownEscape(element: HTMLElement): void {
  element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
}

async function settle(fixture: {
  detectChanges(): void;
  whenStable(): Promise<unknown>;
}): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function query<T extends HTMLElement = HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element as T;
}
