import { provideHellLabels } from '@hell-ui/angular/core';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_PAGE_HEADER_IMPORTS, HELL_PAGE_HEADER_LABELS, type HellPageHeaderLevel, type HellPageHeaderUi } from './page-header';

@Component({
  imports: [...HELL_PAGE_HEADER_IMPORTS],
  template: `
    <hell-page-header [level]="level()" [ui]="ui()">
      @if (showBack()) {
        <hell-page-header-back (back)="log('back')" />
      }
      @if (showBreadcrumbs()) {
        <nav hellPageHeaderLeading aria-label="Breadcrumb">Team / Ada</nav>
      }
      <span hellPageHeaderTitle>Ada Lovelace</span>
      @if (showMeta()) {
        <span hellPageHeaderMeta>Active</span>
      }
      @if (showDescription()) {
        <p hellPageHeaderDescription>Senior engineer since 1843.</p>
      }
      @if (showToolbar()) {
        <div hellPageHeaderToolbar>
          <button type="button" (click)="log('edit')">Edit</button>
        </div>
      }
    </hell-page-header>
  `,
})
class PageHeaderHost {
  readonly level = signal<HellPageHeaderLevel>(1);
  readonly ui = signal<HellPageHeaderUi | undefined>(undefined);
  readonly showBack = signal(false);
  readonly showBreadcrumbs = signal(false);
  readonly showMeta = signal(false);
  readonly showDescription = signal(false);
  readonly showToolbar = signal(false);
  readonly events: string[] = [];

  log(event: string): void {
    this.events.push(event);
  }
}

describe('HellPageHeader', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PageHeaderHost] }).compileComponents();
  });

  it('renders the root and exposes the projected title as the level-1 main heading by default', () => {
    const fixture = TestBed.createComponent(PageHeaderHost);
    fixture.detectChanges();

    const root = query(fixture.nativeElement, 'hell-page-header');
    expect(root.getAttribute('data-slot')).toBe('root');

    const heading = query(fixture.nativeElement, '[data-slot="title"]');
    expect(heading.getAttribute('role')).toBe('heading');
    expect(heading.getAttribute('aria-level')).toBe('1');
    expect(heading.textContent?.trim()).toBe('Ada Lovelace');
  });

  it('renders the title at the configured heading level', () => {
    const fixture = TestBed.createComponent(PageHeaderHost);
    fixture.componentInstance.level.set(3);
    fixture.detectChanges();

    const heading = query(fixture.nativeElement, '[data-slot="title"]');
    expect(heading.getAttribute('role')).toBe('heading');
    expect(heading.getAttribute('aria-level')).toBe('3');
    expect(heading.textContent?.trim()).toBe('Ada Lovelace');
  });

  it('omits the optional regions until their slots receive projected content', () => {
    const fixture = TestBed.createComponent(PageHeaderHost);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('[data-slot="leading"]')).toBeNull();
    expect(host.querySelector('[data-slot="meta"]')).toBeNull();
    expect(host.querySelector('[data-slot="description"]')).toBeNull();
    expect(host.querySelector('[data-slot="toolbar"]')).toBeNull();
  });

  it('renders each optional region once its slot is populated', () => {
    const fixture = TestBed.createComponent(PageHeaderHost);
    const instance = fixture.componentInstance;
    instance.showBreadcrumbs.set(true);
    instance.showMeta.set(true);
    instance.showDescription.set(true);
    instance.showToolbar.set(true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(query(host, '[data-slot="leading"]').textContent).toContain('Team / Ada');
    expect(query(host, '[data-slot="meta"]').textContent).toContain('Active');
    expect(query(host, '[data-slot="description"]').textContent).toContain('Senior engineer');
    expect(query(host, '[data-slot="toolbar"]').textContent).toContain('Edit');
  });

  it('shows the leading region when only a back affordance is projected', () => {
    const fixture = TestBed.createComponent(PageHeaderHost);
    fixture.componentInstance.showBack.set(true);
    fixture.detectChanges();

    const leading = query(fixture.nativeElement, '[data-slot="leading"]');
    expect(leading.querySelector('hell-page-header-back')).toBeInstanceOf(HTMLElement);
  });

  it('applies Part Style Map refinements to the named parts', () => {
    const fixture = TestBed.createComponent(PageHeaderHost);
    const instance = fixture.componentInstance;
    instance.showToolbar.set(true);
    instance.ui.set({ root: 'bg-hell-surface-muted', title: 'text-3xl', toolbar: 'gap-hell-4' });
    fixture.detectChanges();

    expect(query(fixture.nativeElement, 'hell-page-header').className).toContain(
      'bg-hell-surface-muted',
    );
    expect(query(fixture.nativeElement, '[data-slot="title"]').className).toContain('text-3xl');
    expect(query(fixture.nativeElement, '[data-slot="toolbar"]').className).toContain('gap-hell-4');
  });
});

describe('HellPageHeaderBack', () => {
  it('emits back on activation without navigating, and names itself from the Label Contract', () => {
    TestBed.configureTestingModule({ imports: [PageHeaderHost] });
    const fixture = TestBed.createComponent(PageHeaderHost);
    fixture.componentInstance.showBack.set(true);
    fixture.detectChanges();

    const button = query<HTMLButtonElement>(fixture.nativeElement, 'hell-page-header-back button');
    expect(button.getAttribute('aria-label')).toBe('Go back');

    button.click();
    expect(fixture.componentInstance.events).toEqual(['back']);
  });

  it('honors a per-instance aria-label override', () => {
    @Component({
      imports: [...HELL_PAGE_HEADER_IMPORTS],
      template: `<hell-page-header-back aria-label="Return to list" />`,
    })
    class OverrideHost {}

    TestBed.configureTestingModule({ imports: [OverrideHost] });
    const fixture = TestBed.createComponent(OverrideHost);
    fixture.detectChanges();

    const button = query<HTMLButtonElement>(fixture.nativeElement, 'hell-page-header-back button');
    expect(button.getAttribute('aria-label')).toBe('Return to list');
  });

  it('resolves its default name from HELL_PAGE_HEADER_LABELS', () => {
    @Component({
      imports: [...HELL_PAGE_HEADER_IMPORTS],
      template: `<hell-page-header-back />`,
    })
    class LocalizedHost {}

    TestBed.configureTestingModule({
      imports: [LocalizedHost],
      providers: [provideHellLabels(HELL_PAGE_HEADER_LABELS, { back: 'Zurück' })],
    });
    const fixture = TestBed.createComponent(LocalizedHost);
    fixture.detectChanges();

    const button = query<HTMLButtonElement>(fixture.nativeElement, 'hell-page-header-back button');
    expect(button.getAttribute('aria-label')).toBe('Zurück');
  });
});

function query<T extends HTMLElement = HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element as T;
}
