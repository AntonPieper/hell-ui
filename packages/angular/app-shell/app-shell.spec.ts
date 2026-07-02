import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BreakpointObserver, type BreakpointState } from '@angular/cdk/layout';
import { ReplaySubject } from 'rxjs';

import {
  HELL_APP_SHELL_DIRECTIVES,
  HELL_APP_SHELL_MOBILE_MEDIA,
  type HellAppContentUi,
  type HellAppSecondaryUi,
  type HellAppSidenavUi,
  type HellAppTopbarUi,
  type HellNavItemIconUi,
  type HellNavItemLabelUi,
  type HellNavItemTrailingUi,
  type HellNavItemUi,
  type HellNavSectionItemsUi,
  type HellNavSectionToggleUi,
  type HellNavSectionUi,
  type HellSecondaryToggleUi,
  type HellSidenavToggleUi,
} from './app-shell';

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
    <div id="sentinel-shell" hellAppShell>
      <header hellAppTopbar>
        <button id="sentinel-sidenav-toggle" hellSidenavToggle type="button"></button>
      </header>
      <nav id="sentinel-sidenav" hellAppSidenav>Navigation</nav>
      <main id="sentinel-content" hellAppContent>Content</main>
      <aside id="sentinel-secondary" hellAppSecondary>
        <button id="sentinel-secondary-toggle" hellSecondaryToggle type="button"></button>
        <div id="sentinel-secondary-body" hellAppSecondaryBody>Secondary</div>
      </aside>
    </div>
  `,
})
class SentinelShellHost {}

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

@Component({
  imports: [...HELL_APP_SHELL_DIRECTIVES],
  template: `
    <div id="ui-shell" hellAppShell ui="bg-hell-surface-muted text-hell-primary">
      <header id="ui-topbar" hellAppTopbar [ui]="topbarUi">
        <button id="ui-sidenav-toggle" hellSidenavToggle appearance="shell" [ui]="sidenavToggleUi">
          Toggle
        </button>
      </header>
      <nav id="ui-sidenav" hellAppSidenav [ui]="sidenavUi">
        <div id="ui-nav-section" hellNavSection [ui]="navSectionUi">
          <button id="ui-nav-section-toggle" hellNavSectionToggle [ui]="navSectionToggleUi">
            Settings
          </button>
          <div id="ui-nav-section-items" hellNavSectionItems [ui]="navSectionItemsUi">
            <a id="ui-nav-item" hellNavItem active [ui]="navItemUi" href="#">
              <span id="ui-nav-icon" hellNavItemIcon [ui]="navIconUi">I</span>
              <span id="ui-nav-label" hellNavItemLabel [ui]="navLabelUi">Preferences</span>
              <span id="ui-nav-trailing" hellNavItemTrailing [ui]="navTrailingUi">2</span>
            </a>
          </div>
        </div>
      </nav>
      <main id="ui-content" hellAppContent [ui]="contentUi">Content</main>
      <aside id="ui-secondary" hellAppSecondary [ui]="secondaryUi">
        <button id="ui-secondary-toggle" hellSecondaryToggle appearance="header" [ui]="secondaryToggleUi">
          Details
        </button>
      </aside>
    </div>
  `,
})
class UiShellHost {
  readonly topbarUi = { root: 'bg-hell-danger border-hell-danger' } satisfies HellAppTopbarUi;
  readonly sidenavUi = { root: 'bg-hell-surface-muted border-hell-danger' } satisfies HellAppSidenavUi;
  readonly sidenavToggleUi = { root: 'text-hell-danger' } satisfies HellSidenavToggleUi;
  readonly navSectionUi = { root: 'gap-hell-2' } satisfies HellNavSectionUi;
  readonly navSectionToggleUi = { root: 'text-hell-danger' } satisfies HellNavSectionToggleUi;
  readonly navSectionItemsUi = { root: 'gap-hell-2' } satisfies HellNavSectionItemsUi;
  readonly navItemUi = {
    root: 'bg-hell-danger text-hell-foreground-inverse px-hell-7',
  } satisfies HellNavItemUi;
  readonly navIconUi = { root: 'text-hell-danger w-6' } satisfies HellNavItemIconUi;
  readonly navLabelUi = { root: 'text-clip' } satisfies HellNavItemLabelUi;
  readonly navTrailingUi = { root: 'text-hell-danger' } satisfies HellNavItemTrailingUi;
  readonly contentUi = { root: 'bg-hell-surface-muted p-hell-2' } satisfies HellAppContentUi;
  readonly secondaryUi = { root: 'bg-hell-surface-muted border-hell-danger' } satisfies HellAppSecondaryUi;
  readonly secondaryToggleUi = { root: 'text-hell-danger' } satisfies HellSecondaryToggleUi;
}

let mediaController: ReturnType<typeof createMobileLayoutController>;

describe('HellAppShell secondary panel', () => {
  beforeEach(async () => {
    mediaController = createMobileLayoutController(false);
    await TestBed.configureTestingModule({
      imports: [
        TestHost,
        ControlledShellHost,
        SentinelShellHost,
        FocusShellHost,
        FallbackShellHost,
        UiShellHost,
      ],
      providers: [{ provide: BreakpointObserver, useValue: mediaController }],
    }).compileComponents();
  });

  it('merges app shell and nav ui classes through local root parts', () => {
    const fixture = TestBed.createComponent(UiShellHost);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const shell = query(root, '#ui-shell');
    const topbar = query(root, '#ui-topbar');
    const sidenav = query(root, '#ui-sidenav');
    const sidenavToggle = query(root, '#ui-sidenav-toggle');
    const navSection = query(root, '#ui-nav-section');
    const navSectionToggle = query(root, '#ui-nav-section-toggle');
    const navSectionItems = query(root, '#ui-nav-section-items');
    const navItem = query(root, '#ui-nav-item');
    const navIcon = query(root, '#ui-nav-icon');
    const navLabel = query(root, '#ui-nav-label');
    const navTrailing = query(root, '#ui-nav-trailing');
    const content = query(root, '#ui-content');
    const secondary = query(root, '#ui-secondary');
    const secondaryToggle = query(root, '#ui-secondary-toggle');

    for (const part of [
      shell,
      topbar,
      sidenav,
      sidenavToggle,
      navSection,
      navSectionToggle,
      navSectionItems,
      navItem,
      navIcon,
      navLabel,
      navTrailing,
      content,
      secondary,
      secondaryToggle,
    ]) {
      expect(part.getAttribute('data-slot')).toBe('root');
    }

    expect(shell.className).toContain('bg-hell-surface-muted');
    expect(shell.className).not.toContain('bg-hell-surface ');
    expect(topbar.className).toContain('bg-hell-danger');
    expect(sidenav.className).toContain('border-hell-danger');
    expect(sidenavToggle.className).toContain('text-hell-danger');
    expect(navSection.className).toContain('gap-hell-2');
    expect(navSectionToggle.className).toContain('text-hell-danger');
    expect(navSectionItems.className).toContain('gap-hell-2');
    expect(navItem.className).toContain('bg-hell-danger');
    expect(navItem.className).toContain('px-hell-7');
    expect(navItem.className).not.toContain('px-3');
    expect(navItem.getAttribute('data-active')).toBe('true');
    expect(navIcon.className).toContain('w-6');
    expect(navLabel.className).toContain('text-clip');
    expect(navTrailing.className).toContain('text-hell-danger');
    expect(content.className).toContain('p-hell-2');
    expect(secondary.className).toContain('border-hell-danger');
    expect(secondaryToggle.className).toContain('text-hell-danger');
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

  it('owns nav section root parts and collapsed attributes', () => {
    const fixture = TestBed.createComponent(TestHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const section = query(fixture.nativeElement, '#nav-section');
    const toggle = query<HTMLButtonElement>(fixture.nativeElement, '#nav-section-toggle');
    const items = query(fixture.nativeElement, '#nav-section-items');

    expect(section.classList.contains('hell-nav-section')).toBe(false);
    expect(section.getAttribute('data-slot')).toBe('root');
    expect(section.getAttribute('data-collapsed')).toBeNull();
    expect(toggle.classList.contains('hell-nav-section-toggle')).toBe(false);
    expect(toggle.getAttribute('data-slot')).toBe('root');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(items.classList.contains('hell-nav-section-items')).toBe(false);
    expect(items.getAttribute('data-slot')).toBe('root');
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

  it('keeps behavior sentinels without legacy shell classes', () => {
    const fixture = TestBed.createComponent(SentinelShellHost);
    fixture.detectChanges();

    const shell = query(fixture.nativeElement, '#sentinel-shell');
    const sidenav = query(fixture.nativeElement, '#sentinel-sidenav');
    const secondary = query(fixture.nativeElement, '#sentinel-secondary');
    const sidenavToggle = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#sentinel-sidenav-toggle',
    );
    const secondaryToggle = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#sentinel-secondary-toggle',
    );

    expect(shell.classList.contains('hell-shell')).toBe(false);
    expect(sidenav.classList.contains('hell-sidenav')).toBe(false);
    expect(secondary.classList.contains('hell-secondary')).toBe(false);
    expect(shell.getAttribute('data-slot')).toBe('root');
    expect(sidenav.getAttribute('data-slot')).toBe('root');
    expect(secondary.getAttribute('data-slot')).toBe('root');
    expect(sidenav.getAttribute('data-hell-app-shell-panel')).toBe('sidenav');
    expect(secondary.getAttribute('data-hell-app-shell-panel')).toBe('secondary');
    expect(sidenavToggle.getAttribute('data-hell-app-shell-toggle')).toBe('sidenav');
    expect(secondaryToggle.getAttribute('data-hell-app-shell-toggle')).toBe('secondary');
  });

  it('clears mobile panel state when media query switches back to desktop', () => {
    const mobile = mockMobileLayoutController(true);
    const fixture = TestBed.createComponent(SentinelShellHost);
    fixture.detectChanges();

    const shell = query(fixture.nativeElement, '#sentinel-shell');
    const sidenav = query(fixture.nativeElement, '#sentinel-sidenav');
    const sidenavToggle = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#sentinel-sidenav-toggle',
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
    const fixture = TestBed.createComponent(SentinelShellHost);
    fixture.detectChanges();

    const shell = query(fixture.nativeElement, '#sentinel-shell');
    const sidenav = query(fixture.nativeElement, '#sentinel-sidenav');
    const content = query(fixture.nativeElement, '#sentinel-content');
    const sidenavToggle = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#sentinel-sidenav-toggle',
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
    mockRenderedBox(panelItem);

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

  it('moves mobile secondary focus from the rail opener to the header toggle', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const shell = query(fixture.nativeElement, '[hellAppShell]');
    const rail = query<HTMLButtonElement>(
      fixture.nativeElement,
      'button[data-hell-secondary-toggle="rail"]',
    );
    const header = query<HTMLButtonElement>(
      fixture.nativeElement,
      'button[data-hell-secondary-toggle="header"]',
    );
    mockRenderedBox(rail);
    mockRenderedBox(header);

    rail.focus();
    await settle(fixture);
    expect(document.activeElement).toBe(rail);

    rail.click();
    await settle(fixture);

    expect(shell.getAttribute('data-mobile-secondary-open')).toBe('true');
    expect(document.activeElement).toBe(header);
  });

  it('switches from mobile sidenav to secondary without losing the secondary open request', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const shell = query(fixture.nativeElement, '[hellAppShell]');
    const sidenavToggle = query<HTMLButtonElement>(fixture.nativeElement, '#sidenav-toggle');
    const rail = query<HTMLButtonElement>(
      fixture.nativeElement,
      'button[data-hell-secondary-toggle="rail"]',
    );
    const header = query<HTMLButtonElement>(
      fixture.nativeElement,
      'button[data-hell-secondary-toggle="header"]',
    );
    mockRenderedBox(rail);
    mockRenderedBox(header);

    sidenavToggle.click();
    await settle(fixture);
    expect(shell.getAttribute('data-mobile-sidenav-open')).toBe('true');

    rail.focus();
    rail.click();
    await settle(fixture);

    expect(shell.getAttribute('data-mobile-sidenav-open')).toBeNull();
    expect(shell.getAttribute('data-mobile-secondary-open')).toBe('true');
    expect(document.activeElement).toBe(header);
  });

  it('closes mobile panels when Escape is pressed', () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(SentinelShellHost);
    fixture.detectChanges();

    const shell = query(fixture.nativeElement, '#sentinel-shell');
    const secondaryToggle = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#sentinel-secondary-toggle',
    );
    const content = query(fixture.nativeElement, '#sentinel-content');

    secondaryToggle.click();
    fixture.detectChanges();
    expect(shell.getAttribute('data-mobile-secondary-open')).toBe('true');

    keyDownEscape(content);
    fixture.detectChanges();
    expect(shell.getAttribute('data-mobile-secondary-open')).toBeNull();
  });

  it('keeps the mobile secondary rail operable while hiding the secondary body', () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    const shell = query(fixture.nativeElement, '[hellAppShell]');
    const secondary = query(fixture.nativeElement, 'aside');
    const body = query(fixture.nativeElement, '[hellAppSecondaryBody]');
    const rail = query<HTMLButtonElement>(
      fixture.nativeElement,
      'button[data-hell-secondary-toggle="rail"]',
    );

    expect(shell.getAttribute('data-secondary-hidden')).toBe('true');
    expect(secondary.getAttribute('data-mobile-hidden')).toBe('true');
    expect(secondary.getAttribute('aria-hidden')).toBeNull();
    expect(secondary.hasAttribute('inert')).toBe(false);
    expect(body.getAttribute('aria-hidden')).toBe('true');
    expect(body.hasAttribute('inert')).toBe(true);
    expect(rail.getAttribute('aria-label')).toBe('Show secondary panel');

    rail.click();
    fixture.detectChanges();

    expect(shell.getAttribute('data-mobile-secondary-open')).toBe('true');
    expect(secondary.getAttribute('data-mobile-hidden')).toBeNull();
    expect(body.getAttribute('aria-hidden')).toBeNull();
    expect(body.hasAttribute('inert')).toBe(false);
    expect(rail.getAttribute('aria-label')).toBe('Hide secondary panel');
  });

  it('roundtrips state via header toggle and rail toggle', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    const aside = fixture.nativeElement.querySelector('aside') as HTMLElement;
    const body = aside.querySelector('[hellAppSecondaryBody]') as HTMLElement;
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

function mockRenderedBox(element: HTMLElement): void {
  const rect = {
    x: 0,
    y: 0,
    width: 40,
    height: 24,
    top: 0,
    right: 40,
    bottom: 24,
    left: 0,
    toJSON: () => ({}),
  } as DOMRect;
  const rects = {
    0: rect,
    length: 1,
    item: (index: number) => (index === 0 ? rect : null),
    [Symbol.iterator]: function* () {
      yield rect;
    },
  } as DOMRectList;

  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(rect);
  vi.spyOn(element, 'getClientRects').mockReturnValue(rects);
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
