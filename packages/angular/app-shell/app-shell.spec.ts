import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BreakpointObserver, type BreakpointState } from '@angular/cdk/layout';
import { ReplaySubject } from 'rxjs';

import { HELL_APP_SHELL_IMPORTS, HELL_APP_SHELL_MOBILE_MEDIA } from './app-shell';

@Component({
  imports: [...HELL_APP_SHELL_IMPORTS],
  template: `
    <div hellAppShell #shell="hellAppShell">
      <header hellAppTopbar>
        <button id="sidenav-toggle" hellSidenavToggle type="button"></button>
      </header>
      <nav hellAppSidenav>
        <a href="#">Preferences</a>
        <a href="#">API keys</a>
      </nav>
      <main hellAppContent>Content</main>
      <aside hellAppSecondary>
        <button hellSecondaryToggle type="button"></button>
        <div hellAppSecondaryBody>
          <button hellSecondaryToggle type="button">Title</button>
          <p>Body</p>
        </div>
      </aside>
    </div>
  `,
})
class TestHost {}

@Component({
  imports: [...HELL_APP_SHELL_IMPORTS],
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
  imports: [...HELL_APP_SHELL_IMPORTS],
  template: `
    <div
      hellAppShell
      [sidenavCollapsed]="sidenavCollapsed()"
      (sidenavCollapsedChange)="handleSidenavChange($event)"
    >
      <header hellAppTopbar>
        <button id="rejected-sidenav-action" hellSidenavToggle type="button"></button>
      </header>
      <nav id="rejected-sidenav" hellAppSidenav>
        <button id="rejected-sidenav-item" type="button">Navigation item</button>
      </nav>
      <main hellAppContent>Content</main>
    </div>
    <button id="rejected-current-action" type="button">Current action</button>
  `,
})
class RejectedControlledActionHost {
  readonly sidenavCollapsed = signal(true);
  readonly sidenavEvents: boolean[] = [];
  acceptSidenavChanges = false;

  handleSidenavChange(next: boolean): void {
    this.sidenavEvents.push(next);
    if (this.acceptSidenavChanges) this.sidenavCollapsed.set(next);
  }
}

@Component({
  imports: [...HELL_APP_SHELL_IMPORTS],
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
  imports: [...HELL_APP_SHELL_IMPORTS],
  template: `
    <button id="focus-outside-action" type="button">Outside action</button>
    <div id="focus-shell" hellAppShell #shell="hellAppShell">
      <header hellAppTopbar>
        <button id="focus-sidenav-toggle" hellSidenavToggle type="button"></button>
      </header>
      <nav id="focus-sidenav" hellAppSidenav>
        <button id="focus-sidenav-disabled" type="button" disabled>Disabled</button>
        <button id="focus-sidenav-item" type="button" (click)="shell.closeMobilePanels()">
          Item
        </button>
      </nav>
      <main id="focus-content" hellAppContent>
        <button id="focus-content-action" type="button">Content action</button>
      </main>
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
  imports: [...HELL_APP_SHELL_IMPORTS],
  template: `
    <div id="public-action-shell" hellAppShell #shell="hellAppShell">
      <header hellAppTopbar>
        <button
          id="public-inline-sidenav-action"
          type="button"
          (click)="shell.toggleSidenav()"
        >
          Toggle navigation
        </button>
      </header>
      <nav id="public-action-sidenav" hellAppSidenav>
        <button id="public-action-sidenav-item" type="button">Navigation item</button>
      </nav>
      <main hellAppContent>Content</main>
    </div>
    <button
      id="public-sidenav-action"
      type="button"
      [hidden]="hideAction()"
      (click)="shell.toggleSidenav()"
    >
      Open navigation
    </button>
    <button id="public-close-sidenav-action" type="button" (click)="shell.toggleSidenav()">
      Close navigation
    </button>
  `,
})
class PublicActionShellHost {
  readonly hideAction = signal(false);
}

@Component({
  imports: [...HELL_APP_SHELL_IMPORTS],
  template: `
    <div
      id="controlled-public-action-shell"
      hellAppShell
      #shell="hellAppShell"
      [sidenavCollapsed]="sidenavCollapsed()"
      (sidenavCollapsedChange)="handleSidenavChange($event)"
    >
      <header hellAppTopbar>
        <button
          id="controlled-public-inline-action"
          type="button"
          (click)="shell.toggleSidenav()"
        >
          Toggle navigation
        </button>
      </header>
      <nav hellAppSidenav>
        <button id="controlled-public-panel-item" type="button">Navigation item</button>
      </nav>
      <main hellAppContent>
        <button id="controlled-public-content-action" type="button">Content action</button>
      </main>
    </div>
    <button id="controlled-public-open-action" type="button" (click)="shell.toggleSidenav()">
      Open navigation
    </button>
  `,
})
class ControlledPublicActionShellHost {
  readonly sidenavCollapsed = signal(true);
  acceptSidenavChanges = true;

  handleSidenavChange(next: boolean): void {
    if (this.acceptSidenavChanges) this.sidenavCollapsed.set(next);
  }
}

@Component({
  imports: [...HELL_APP_SHELL_IMPORTS],
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
  imports: [...HELL_APP_SHELL_IMPORTS],
  template: `
    <div hellAppShell>
      <header hellAppTopbar>
        <button id="dynamic-sidenav-toggle" hellSidenavToggle type="button"></button>
      </header>
      @if (showSidenav()) {
        @if (useReplacement()) {
          <nav id="replacement-sidenav" hellAppSidenav>
            <button id="replacement-sidenav-item" type="button">Replacement item</button>
          </nav>
        } @else {
          <nav id="dynamic-sidenav" hellAppSidenav>
            <button id="dynamic-sidenav-item" type="button">Item</button>
          </nav>
        }
      }
      <main hellAppContent>Content</main>
    </div>
  `,
})
class DynamicPanelHost {
  readonly showSidenav = signal(true);
  readonly useReplacement = signal(false);
}

@Component({
  imports: [...HELL_APP_SHELL_IMPORTS],
  template: `
    <div
      id="controlled-dynamic-shell"
      hellAppShell
      [sidenavCollapsed]="sidenavCollapsed()"
      (sidenavCollapsedChange)="sidenavEvents.push($event)"
    >
      <header hellAppTopbar>
        <button id="controlled-dynamic-toggle" hellSidenavToggle type="button"></button>
      </header>
      @if (showSidenav()) {
        <nav id="controlled-dynamic-sidenav" hellAppSidenav>
          <button type="button">Navigation item</button>
        </nav>
      }
      <main hellAppContent>Content</main>
    </div>
  `,
})
class ControlledDynamicPanelHost {
  readonly sidenavCollapsed = signal(false);
  readonly showSidenav = signal(true);
  readonly sidenavEvents: boolean[] = [];
}

@Component({
  imports: [...HELL_APP_SHELL_IMPORTS],
  template: `
    <div id="ui-shell" hellAppShell ui="bg-hell-surface-muted text-hell-primary">
      <header id="ui-topbar" hellAppTopbar [ui]="topbarUi">
        <button id="ui-sidenav-toggle" hellSidenavToggle [ui]="sidenavToggleUi">
          Toggle
        </button>
      </header>
      <nav id="ui-sidenav" hellAppSidenav [ui]="sidenavUi">
        <a href="#">Preferences</a>
      </nav>
      <main id="ui-content" hellAppContent [ui]="contentUi">Content</main>
      <aside id="ui-secondary" hellAppSecondary [ui]="secondaryUi">
        <button id="ui-secondary-rail" hellSecondaryToggle [ui]="secondaryToggleUi"></button>
        <div hellAppSecondaryBody>
          <button id="ui-secondary-toggle" hellSecondaryToggle [ui]="secondaryToggleUi">
            Details
          </button>
        </div>
      </aside>
    </div>
  `,
})
class UiShellHost {
  readonly topbarUi = { root: 'bg-hell-danger border-hell-danger' };
  readonly sidenavUi = { root: 'bg-hell-surface-muted border-hell-danger' };
  readonly sidenavToggleUi = { root: 'text-hell-danger' };
  readonly contentUi = {
    root: 'bg-hell-surface-muted p-hell-2 [--hell-app-content-max-width:960px]',
  };
  readonly secondaryUi = { root: 'bg-hell-surface-muted border-hell-danger' };
  readonly secondaryToggleUi = { root: 'text-hell-danger' };
}

let mediaController: ReturnType<typeof createMobileLayoutController>;

describe('HellAppShell secondary panel', () => {
  beforeEach(async () => {
    mediaController = createMobileLayoutController(false);
    await TestBed.configureTestingModule({
      imports: [
        TestHost,
        ControlledShellHost,
        RejectedControlledActionHost,
        SentinelShellHost,
        FocusShellHost,
        PublicActionShellHost,
        ControlledPublicActionShellHost,
        FallbackShellHost,
        DynamicPanelHost,
        ControlledDynamicPanelHost,
        UiShellHost,
      ],
      providers: [{ provide: BreakpointObserver, useValue: mediaController }],
    }).compileComponents();
  });

  it('merges app shell ui classes through local root parts', () => {
    const fixture = TestBed.createComponent(UiShellHost);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const shell = query(root, '#ui-shell');
    const topbar = query(root, '#ui-topbar');
    const sidenav = query(root, '#ui-sidenav');
    const sidenavToggle = query(root, '#ui-sidenav-toggle');
    const content = query(root, '#ui-content');
    const secondary = query(root, '#ui-secondary');
    const secondaryToggle = query(root, '#ui-secondary-toggle');

    for (const part of [
      shell,
      topbar,
      sidenav,
      sidenavToggle,
      content,
      secondary,
      secondaryToggle,
    ]) {
      expect(part.getAttribute('data-slot')).toBe('root');
    }

    // The consumer ui classes are the test's own contract fixtures; recipe
    // conflict resolution is owned centrally by the Part-Class Pipeline spec.
    expect(shell.className).toContain('bg-hell-surface-muted');
    expect(topbar.className).toContain('bg-hell-danger');
    expect(sidenav.className).toContain('border-hell-danger');
    expect(sidenavToggle.className).toContain('text-hell-danger');
    expect(content.className).toContain('p-hell-2');
    expect(content.className).toContain('[--hell-app-content-max-width:960px]');
    expect(secondary.className).toContain('border-hell-danger');
    expect(secondaryToggle.className).toContain('text-hell-danger');
  });

  describe('recipes', () => {
    // Part-Class Pipeline merge semantics are owned centrally by
    // `core/part-class-pipeline.spec.ts`; the snapshot pins the default part
    // classes without asserting individual utilities elsewhere.
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      const sortClasses = (value: string): string[] =>
        value.split(/\s+/).filter(Boolean).sort();
      const partClasses = (selector: string): string[] =>
        sortClasses(root.querySelector(selector)?.getAttribute('class') ?? '');

      expect({
        shell: partClasses('[hellAppShell]'),
        topbar: partClasses('[hellAppTopbar]'),
        sidenav: partClasses('[hellAppSidenav]'),
        sidenavToggle: partClasses('#sidenav-toggle'),
        content: partClasses('[hellAppContent]'),
        secondary: partClasses('[hellAppSecondary]'),
        secondaryToggle: partClasses('[hellAppSecondaryBody] [hellSecondaryToggle]'),
      }).toMatchSnapshot('appShell');
    });
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

  it('coordinates projected panels without public renderer sentinels', () => {
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

    expect(shell.getAttribute('data-slot')).toBe('root');
    expect(sidenav.getAttribute('data-slot')).toBe('root');
    expect(secondary.getAttribute('data-slot')).toBe('root');
    expect(sidenav.getAttribute('data-hell-app-shell-panel')).toBeNull();
    expect(secondary.getAttribute('data-hell-app-shell-panel')).toBeNull();
    expect(sidenavToggle.getAttribute('data-hell-app-shell-toggle')).toBeNull();
    expect(secondaryToggle.getAttribute('data-hell-app-shell-toggle')).toBeNull();
    expect(sidenav.id).toBe('sentinel-sidenav');
    expect(secondary.id).toBe('sentinel-secondary');
    expect(sidenavToggle.getAttribute('aria-controls')).toBe(sidenav.id);
    expect(secondaryToggle.getAttribute('aria-controls')).toBe(secondary.id);
  });

  it('generates unique internal panel ids when native ids are not authored', () => {
    const first = TestBed.createComponent(TestHost);
    const second = TestBed.createComponent(TestHost);
    first.detectChanges();
    second.detectChanges();

    const firstSidenav = query(first.nativeElement, 'nav[hellAppSidenav]');
    const firstSecondary = query(first.nativeElement, 'aside[hellAppSecondary]');
    const secondSidenav = query(second.nativeElement, 'nav[hellAppSidenav]');
    const secondSecondary = query(second.nativeElement, 'aside[hellAppSecondary]');

    expect(firstSidenav.id).toMatch(/^hell-app-shell-\d+-sidenav$/);
    expect(firstSecondary.id).toMatch(/^hell-app-shell-\d+-secondary$/);
    expect(secondSidenav.id).not.toBe(firstSidenav.id);
    expect(secondSecondary.id).not.toBe(firstSecondary.id);
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

  it('uses private panel registration, not style classes, when dismissing mobile panels', () => {
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

  it('cancels delayed restoration when a sibling action starts new pointer intent', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(FocusShellHost);
    const toggle = query<HTMLButtonElement>(fixture.nativeElement, '#focus-sidenav-toggle');
    const panelItem = query<HTMLButtonElement>(fixture.nativeElement, '#focus-sidenav-item');
    const outsideAction = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#focus-outside-action',
    );
    mockRenderedBox(panelItem);

    toggle.click();
    await settle(fixture);
    expect(document.activeElement).toBe(panelItem);

    keyDownEscape(panelItem);
    fixture.detectChanges();
    expect(document.activeElement).toBe(toggle);

    outsideAction.addEventListener('pointerdown', (event) => event.stopPropagation());
    pointerDown(outsideAction);
    outsideAction.focus();
    await delay(200);

    expect(document.activeElement).toBe(outsideAction);
  });

  it('dismisses onto a focusable content action even when click propagation stops', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(FocusShellHost);
    const shell = query<HTMLElement>(fixture.nativeElement, '#focus-shell');
    const toggle = query<HTMLButtonElement>(fixture.nativeElement, '#focus-sidenav-toggle');
    const panelItem = query<HTMLButtonElement>(fixture.nativeElement, '#focus-sidenav-item');
    const contentAction = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#focus-content-action',
    );
    mockRenderedBox(panelItem);

    toggle.click();
    await settle(fixture);
    expect(document.activeElement).toBe(panelItem);

    contentAction.addEventListener('click', (event) => event.stopPropagation());
    pointerDown(contentAction);
    contentAction.focus();
    contentAction.click();
    fixture.detectChanges();
    await delay(200);

    expect(shell.getAttribute('data-mobile-sidenav-open')).toBeNull();
    expect(document.activeElement).toBe(contentAction);
  });

  it('restores focus for a consumer-authored button that calls the public shell action', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(PublicActionShellHost);
    const action = query<HTMLButtonElement>(fixture.nativeElement, '#public-sidenav-action');
    const panelItem = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#public-action-sidenav-item',
    );
    mockRenderedBox(panelItem);

    action.click();
    await settle(fixture);
    expect(document.activeElement).toBe(panelItem);

    keyDownEscape(panelItem);
    await settle(fixture);
    expect(document.activeElement).toBe(action);
  });

  it('keeps the original opener when an action inside the panel closes it', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(FocusShellHost);
    const toggle = query<HTMLButtonElement>(fixture.nativeElement, '#focus-sidenav-toggle');
    const panelItem = query<HTMLButtonElement>(fixture.nativeElement, '#focus-sidenav-item');
    mockRenderedBox(panelItem);

    toggle.click();
    await settle(fixture);
    expect(document.activeElement).toBe(panelItem);

    panelItem.click();
    await settle(fixture);

    expect(document.activeElement).toBe(toggle);
  });

  it('lets an in-shell consumer-authored public action close an open panel', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(PublicActionShellHost);
    const shell = query<HTMLElement>(fixture.nativeElement, '#public-action-shell');
    const externalAction = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#public-sidenav-action',
    );
    const inlineAction = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#public-inline-sidenav-action',
    );
    const panelItem = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#public-action-sidenav-item',
    );
    mockRenderedBox(panelItem);

    externalAction.click();
    await settle(fixture);
    expect(shell.getAttribute('data-mobile-sidenav-open')).toBe('true');

    pointerDown(inlineAction);
    inlineAction.click();
    await settle(fixture);

    expect(shell.getAttribute('data-mobile-sidenav-open')).toBeNull();
    expect(document.activeElement).toBe(inlineAction);
  });

  it('restores an accepted controlled close onto the action that requested it', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(ControlledPublicActionShellHost);
    const shell = query<HTMLElement>(fixture.nativeElement, '#controlled-public-action-shell');
    const openAction = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#controlled-public-open-action',
    );
    const closeAction = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#controlled-public-inline-action',
    );
    const panelItem = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#controlled-public-panel-item',
    );
    mockRenderedBox(panelItem);

    openAction.click();
    await settle(fixture);
    expect(shell.getAttribute('data-mobile-sidenav-open')).toBe('true');
    expect(document.activeElement).toBe(panelItem);

    closeAction.click();
    await settle(fixture);

    expect(shell.getAttribute('data-mobile-sidenav-open')).toBeNull();
    expect(document.activeElement).toBe(closeAction);
  });

  it('restores an external public close onto the action that requested it', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(PublicActionShellHost);
    const shell = query<HTMLElement>(fixture.nativeElement, '#public-action-shell');
    const openAction = query<HTMLButtonElement>(fixture.nativeElement, '#public-sidenav-action');
    const closeAction = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#public-close-sidenav-action',
    );
    const panelItem = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#public-action-sidenav-item',
    );
    mockRenderedBox(panelItem);

    openAction.click();
    await settle(fixture);
    expect(shell.getAttribute('data-mobile-sidenav-open')).toBe('true');

    closeAction.click();
    await settle(fixture);

    expect(shell.getAttribute('data-mobile-sidenav-open')).toBeNull();
    expect(document.activeElement).toBe(closeAction);
  });

  it('retains focus ownership and the original opener when a controlled close is rejected', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(ControlledPublicActionShellHost);
    const host = fixture.componentInstance;
    const shell = query<HTMLElement>(fixture.nativeElement, '#controlled-public-action-shell');
    const openAction = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#controlled-public-open-action',
    );
    const rejectedCloseAction = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#controlled-public-content-action',
    );
    const panelItem = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#controlled-public-panel-item',
    );
    mockRenderedBox(panelItem);

    openAction.click();
    await settle(fixture);
    expect(document.activeElement).toBe(panelItem);

    host.acceptSidenavChanges = false;
    rejectedCloseAction.addEventListener('click', () => rejectedCloseAction.focus());
    rejectedCloseAction.click();
    fixture.detectChanges();
    await delay(20);

    expect(shell.getAttribute('data-mobile-sidenav-open')).toBe('true');
    expect(document.activeElement).toBe(panelItem);

    host.sidenavCollapsed.set(true);
    await settle(fixture);

    expect(shell.getAttribute('data-mobile-sidenav-open')).toBeNull();
    expect(document.activeElement).toBe(openAction);
  });

  it('cancels delayed restoration when click-only intent moves focus', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(FocusShellHost);
    const toggle = query<HTMLButtonElement>(fixture.nativeElement, '#focus-sidenav-toggle');
    const panelItem = query<HTMLButtonElement>(fixture.nativeElement, '#focus-sidenav-item');
    const outsideAction = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#focus-outside-action',
    );
    mockRenderedBox(panelItem);

    toggle.click();
    await settle(fixture);
    keyDownEscape(panelItem);
    fixture.detectChanges();
    expect(document.activeElement).toBe(toggle);

    outsideAction.addEventListener('click', () => outsideAction.focus());
    outsideAction.click();
    await delay(200);

    expect(document.activeElement).toBe(outsideAction);
  });

  it('does not restore focus to a public action that becomes hidden', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(PublicActionShellHost);
    const host = fixture.componentInstance;
    const action = query<HTMLButtonElement>(fixture.nativeElement, '#public-sidenav-action');
    const panelItem = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#public-action-sidenav-item',
    );
    mockRenderedBox(panelItem);

    action.focus();
    action.click();
    await settle(fixture);
    expect(document.activeElement).toBe(panelItem);

    host.hideAction.set(true);
    fixture.detectChanges();
    keyDownEscape(panelItem);
    fixture.detectChanges();
    await delay(200);

    expect(document.activeElement).not.toBe(action);
  });

  it('expires a rejected controlled action before the same panel opens later', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(RejectedControlledActionHost);
    const host = fixture.componentInstance;
    const rejectedAction = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#rejected-sidenav-action',
    );
    const currentAction = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#rejected-current-action',
    );
    const panelItem = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#rejected-sidenav-item',
    );
    mockRenderedBox(panelItem);

    rejectedAction.click();
    fixture.detectChanges();
    expect(host.sidenavEvents).toEqual([false]);
    await delay(10);

    currentAction.focus();
    host.acceptSidenavChanges = true;
    host.sidenavCollapsed.set(false);
    await settle(fixture);
    expect(document.activeElement).toBe(panelItem);

    keyDownEscape(panelItem);
    await settle(fixture);
    expect(document.activeElement).toBe(currentAction);
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

  it('drops private panel registration and restores focus when an open panel is removed', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(DynamicPanelHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();
    const shell = query<HTMLElement>(fixture.nativeElement, '[hellAppShell]');
    const toggle = query<HTMLButtonElement>(fixture.nativeElement, '#dynamic-sidenav-toggle');
    const panelItem = query<HTMLButtonElement>(fixture.nativeElement, '#dynamic-sidenav-item');
    mockRenderedBox(panelItem);

    toggle.focus();
    toggle.click();
    await settle(fixture);
    expect(document.activeElement).toBe(panelItem);
    expect(toggle.getAttribute('aria-controls')).toBe('dynamic-sidenav');

    host.showSidenav.set(false);
    await settle(fixture);

    expect(toggle.getAttribute('aria-controls')).toBeNull();
    expect(shell.getAttribute('data-sidenav-collapsed')).toBe('true');
    expect(shell.getAttribute('data-mobile-sidenav-open')).toBeNull();
    expect(document.activeElement).toBe(toggle);
  });

  it('drops backdrop state when a controlled parent rejects removal cleanup', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(ControlledDynamicPanelHost);
    const host = fixture.componentInstance;
    const shell = query<HTMLElement>(fixture.nativeElement, '#controlled-dynamic-shell');

    await settle(fixture);
    expect(shell.getAttribute('data-mobile-sidenav-open')).toBe('true');

    host.showSidenav.set(false);
    await settle(fixture);

    expect(host.sidenavEvents).toEqual([true]);
    expect(shell.getAttribute('data-sidenav-collapsed')).toBeNull();
    expect(shell.getAttribute('data-mobile-sidenav-open')).toBeNull();
  });

  it('rebuilds the focus trap when an open panel is atomically replaced', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(DynamicPanelHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();
    const toggle = query<HTMLButtonElement>(fixture.nativeElement, '#dynamic-sidenav-toggle');
    const firstItem = query<HTMLButtonElement>(fixture.nativeElement, '#dynamic-sidenav-item');
    mockRenderedBox(firstItem);

    toggle.focus();
    toggle.click();
    await settle(fixture);
    expect(document.activeElement).toBe(firstItem);

    host.useReplacement.set(true);
    fixture.detectChanges();
    const replacement = query<HTMLElement>(fixture.nativeElement, '#replacement-sidenav');
    const replacementItem = query<HTMLButtonElement>(
      fixture.nativeElement,
      '#replacement-sidenav-item',
    );
    mockRenderedBox(replacementItem);
    await settle(fixture);

    expect(toggle.getAttribute('aria-controls')).toBe(replacement.id);
    expect(document.activeElement).toBe(replacementItem);

    keyDownEscape(replacementItem);
    await settle(fixture);
    expect(document.activeElement).toBe(toggle);
  });

  it('restores the mobile rail action even when a pointer click did not focus it', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const shell = query(fixture.nativeElement, '[hellAppShell]');
    const rail = query<HTMLButtonElement>(
      fixture.nativeElement,
      'aside[hellAppSecondary] > button[hellSecondaryToggle]',
    );
    const header = query<HTMLButtonElement>(
      fixture.nativeElement,
      '[hellAppSecondaryBody] > button[hellSecondaryToggle]',
    );
    mockRenderedBox(rail);
    mockRenderedBox(header);

    await settle(fixture);
    expect(document.activeElement).not.toBe(rail);

    rail.click();
    await settle(fixture);

    expect(shell.getAttribute('data-mobile-secondary-open')).toBe('true');
    expect(document.activeElement).toBe(header);

    keyDownEscape(header);
    await settle(fixture);
    expect(document.activeElement).toBe(rail);
  });

  it('switches from mobile sidenav to secondary without losing the secondary open request', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const shell = query(fixture.nativeElement, '[hellAppShell]');
    const sidenavToggle = query<HTMLButtonElement>(fixture.nativeElement, '#sidenav-toggle');
    const rail = query<HTMLButtonElement>(
      fixture.nativeElement,
      'aside[hellAppSecondary] > button[hellSecondaryToggle]',
    );
    const header = query<HTMLButtonElement>(
      fixture.nativeElement,
      '[hellAppSecondaryBody] > button[hellSecondaryToggle]',
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

  it('advances fallback focus when an opening panel finishes becoming renderable', async () => {
    mockMobileLayout(true);
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const shell = query<HTMLElement>(fixture.nativeElement, '[hellAppShell]');
    const sidenavToggle = query<HTMLButtonElement>(fixture.nativeElement, '#sidenav-toggle');
    const secondary = query<HTMLElement>(fixture.nativeElement, '[hellAppSecondary]');
    const secondaryBody = query<HTMLElement>(fixture.nativeElement, '[hellAppSecondaryBody]');
    const rail = query<HTMLButtonElement>(
      fixture.nativeElement,
      'aside[hellAppSecondary] > button[hellSecondaryToggle]',
    );
    const header = query<HTMLButtonElement>(
      fixture.nativeElement,
      '[hellAppSecondaryBody] > button[hellSecondaryToggle]',
    );
    mockRenderedBox(rail);

    sidenavToggle.click();
    await settle(fixture);
    expect(shell.getAttribute('data-mobile-sidenav-open')).toBe('true');

    rail.click();
    await settle(fixture);

    expect(shell.getAttribute('data-mobile-sidenav-open')).toBeNull();
    expect(shell.getAttribute('data-mobile-secondary-open')).toBe('true');
    expect(document.activeElement).toBe(secondary);

    mockRenderedBox(header);
    secondaryBody.dispatchEvent(new Event('transitionend', { bubbles: true }));

    expect(document.activeElement).toBe(header);

    keyDownEscape(header);
    await settle(fixture);
    expect(document.activeElement).toBe(rail);
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
      'aside[hellAppSecondary] > button[hellSecondaryToggle]',
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
      '[hellAppSecondaryBody] > button[hellSecondaryToggle]',
    ) as HTMLButtonElement;
    const rail = aside.querySelector(
      ':scope > button[hellSecondaryToggle]',
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

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
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
