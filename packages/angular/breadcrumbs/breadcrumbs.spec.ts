import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HELL_BREADCRUMBS_DIRECTIVES,
  type HellBreadcrumbEllipsisUi,
  type HellBreadcrumbItemUi,
  type HellBreadcrumbLinkUi,
  type HellBreadcrumbListUi,
  type HellBreadcrumbPageUi,
  type HellBreadcrumbSeparatorUi,
  type HellBreadcrumbsUi,
  provideHellBreadcrumbsLabels,
} from './breadcrumbs';

@Component({
  imports: [...HELL_BREADCRUMBS_DIRECTIVES],
  template: `
    <nav hellBreadcrumbs>
      <ol hellBreadcrumbList>
        <li>
          <button id="default-ellipsis" hellBreadcrumbEllipsis></button>
          <button id="override-ellipsis" hellBreadcrumbEllipsis aria-label="Custom breadcrumb menu"></button>
        </li>
      </ol>
    </nav>
  `,
})
class BreadcrumbEllipsisHost {}

@Component({
  imports: [...HELL_BREADCRUMBS_DIRECTIVES],
  providers: [provideHellBreadcrumbsLabels({ showHiddenNavigation: 'Contract breadcrumbs' })],
  template: `
    <nav hellBreadcrumbs>
      <ol hellBreadcrumbList>
        <li>
          <button id="contract-ellipsis" hellBreadcrumbEllipsis></button>
        </li>
      </ol>
    </nav>
  `,
})
class BreadcrumbLabelContractHost {}

@Component({
  imports: [...HELL_BREADCRUMBS_DIRECTIVES],
  template: `
    <nav id="breadcrumbs-string" hellBreadcrumbs aria-label="Styled breadcrumb" ui="flex text-hell-danger">
      <ol id="list-string" hellBreadcrumbList ui="grid gap-hell-4">
        <li id="item-string" hellBreadcrumbItem ui="grid gap-hell-4">
          <button id="link-string" hellBreadcrumbLink ui="flex text-hell-danger">Home</button>
        </li>
        <li id="separator-string" hellBreadcrumbSeparator ui="grid text-hell-danger"></li>
        <li id="page-item-string" hellBreadcrumbItem>
          <span id="page-string" hellBreadcrumbPage ui="block text-hell-danger">Current</span>
        </li>
        <li>
          <button
            id="ellipsis-string"
            hellBreadcrumbEllipsis
            ui="grid bg-hell-danger text-hell-foreground-inverse"
          ></button>
        </li>
      </ol>
    </nav>
  `,
})
class BreadcrumbPartStyleStringHost {}

@Component({
  imports: [...HELL_BREADCRUMBS_DIRECTIVES],
  providers: [provideHellBreadcrumbsLabels({ showHiddenNavigation: 'Map breadcrumbs' })],
  template: `
    <nav id="breadcrumbs-map" hellBreadcrumbs [ui]="breadcrumbsUi">
      <ol id="list-map" hellBreadcrumbList [ui]="listUi">
        <li id="item-map" hellBreadcrumbItem [ui]="itemUi">
          <a id="link-map" hellBreadcrumbLink href="#" [ui]="linkUi">Home</a>
        </li>
        <li id="separator-map" hellBreadcrumbSeparator [ui]="separatorUi"></li>
        <li>
          <span id="page-map" hellBreadcrumbPage [ui]="pageUi">Current</span>
        </li>
        <li>
          <button id="ellipsis-map" hellBreadcrumbEllipsis [ui]="ellipsisUi"></button>
        </li>
      </ol>
    </nav>
  `,
})
class BreadcrumbPartStyleMapHost {
  readonly breadcrumbsUi = {
    root: 'flex text-hell-info',
  } satisfies HellBreadcrumbsUi;

  readonly listUi = {
    root: 'grid gap-hell-3',
  } satisfies HellBreadcrumbListUi;

  readonly itemUi = {
    root: 'grid gap-hell-2',
  } satisfies HellBreadcrumbItemUi;

  readonly linkUi = {
    root: 'flex text-hell-info',
  } satisfies HellBreadcrumbLinkUi;

  readonly pageUi = {
    root: 'block text-hell-info-strong',
  } satisfies HellBreadcrumbPageUi;

  readonly separatorUi = {
    root: 'grid text-hell-info',
  } satisfies HellBreadcrumbSeparatorUi;

  readonly ellipsisUi = {
    root: 'grid bg-hell-info-soft text-hell-info-strong',
  } satisfies HellBreadcrumbEllipsisUi;
}

describe('HellBreadcrumbEllipsis', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BreadcrumbEllipsisHost,
        BreadcrumbLabelContractHost,
        BreadcrumbPartStyleStringHost,
        BreadcrumbPartStyleMapHost,
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses label contract default and respects explicit aria-label override', () => {
    const fixture = TestBed.createComponent(BreadcrumbEllipsisHost);
    fixture.detectChanges();

    const defaultEllipsis = byId<HTMLButtonElement>(fixture.nativeElement, 'default-ellipsis');
    const overrideEllipsis = byId<HTMLButtonElement>(fixture.nativeElement, 'override-ellipsis');

    expect(defaultEllipsis.getAttribute('aria-label')).toBe('Show hidden navigation');
    expect(overrideEllipsis.getAttribute('aria-label')).toBe('Custom breadcrumb menu');
  });

  it('supports contract override for breadcrumb ellipsis label', () => {
    const fixture = TestBed.createComponent(BreadcrumbLabelContractHost);
    fixture.detectChanges();

    const contractEllipsis = byId<HTMLButtonElement>(fixture.nativeElement, 'contract-ellipsis');
    expect(contractEllipsis.getAttribute('aria-label')).toBe('Contract breadcrumbs');
  });

  it('applies string shorthand to every breadcrumb root while preserving roles and aria', () => {
    const fixture = TestBed.createComponent(BreadcrumbPartStyleStringHost);
    fixture.detectChanges();

    const breadcrumbs = byId<HTMLElement>(fixture.nativeElement, 'breadcrumbs-string');
    const list = byId<HTMLElement>(fixture.nativeElement, 'list-string');
    const item = byId<HTMLElement>(fixture.nativeElement, 'item-string');
    const link = byId<HTMLButtonElement>(fixture.nativeElement, 'link-string');
    const separator = byId<HTMLElement>(fixture.nativeElement, 'separator-string');
    const page = byId<HTMLElement>(fixture.nativeElement, 'page-string');
    const ellipsis = byId<HTMLButtonElement>(fixture.nativeElement, 'ellipsis-string');

    expectPartStyleRoot(breadcrumbs, 'hell-breadcrumbs');
    expectPartStyleRoot(list, 'hell-breadcrumb-list');
    expectPartStyleRoot(item, 'hell-breadcrumbs-item');
    expectPartStyleRoot(link, 'hell-breadcrumbs-link');
    expectPartStyleRoot(separator, 'hell-breadcrumbs-separator');
    expectPartStyleRoot(page, 'hell-breadcrumbs-page');
    expectPartStyleRoot(ellipsis, 'hell-breadcrumbs-ellipsis');

    expect(breadcrumbs.getAttribute('role')).toBe('navigation');
    expect(breadcrumbs.getAttribute('aria-label')).toBe('Styled breadcrumb');
    expect(list.getAttribute('role')).toBe('list');
    expect(item.getAttribute('role')).toBe('listitem');
    expect(link.getAttribute('type')).toBe('button');
    expect(separator.getAttribute('role')).toBe('presentation');
    expect(separator.getAttribute('aria-hidden')).toBe('true');
    expect(page.getAttribute('aria-current')).toBe('page');
    expect(ellipsis.getAttribute('type')).toBe('button');
    expect(ellipsis.getAttribute('aria-label')).toBe('Show hidden navigation');

    expectClasses(breadcrumbs, ['flex', 'text-hell-danger'], ['inline-flex']);
    expectClasses(list, ['grid', 'gap-hell-4'], ['inline-flex', 'gap-1.5']);
    expectClasses(item, ['grid', 'gap-hell-4'], ['inline-flex', 'gap-hell-1']);
    expectClasses(link, ['flex', 'text-hell-danger'], ['inline-flex', 'text-inherit']);
    expectClasses(separator, ['grid', 'text-hell-danger'], ['inline-flex', 'text-hell-foreground-subtle']);
    expectClasses(page, ['block', 'text-hell-danger'], ['inline-flex', 'text-hell-foreground']);
    expectClasses(ellipsis, ['grid', 'bg-hell-danger'], ['inline-flex', 'bg-transparent']);
  });

  it('applies object maps to every breadcrumb root', () => {
    const fixture = TestBed.createComponent(BreadcrumbPartStyleMapHost);
    fixture.detectChanges();

    expectClasses(byId(fixture.nativeElement, 'breadcrumbs-map'), ['flex', 'text-hell-info']);
    expectClasses(byId(fixture.nativeElement, 'list-map'), ['grid', 'gap-hell-3']);
    expectClasses(byId(fixture.nativeElement, 'item-map'), ['grid', 'gap-hell-2']);
    expectClasses(byId(fixture.nativeElement, 'link-map'), ['flex', 'text-hell-info']);
    expectClasses(byId(fixture.nativeElement, 'separator-map'), ['grid', 'text-hell-info']);
    expectClasses(byId(fixture.nativeElement, 'page-map'), ['block', 'text-hell-info-strong']);

    const ellipsis = byId<HTMLButtonElement>(fixture.nativeElement, 'ellipsis-map');
    expectClasses(ellipsis, ['grid', 'bg-hell-info-soft', 'text-hell-info-strong']);
    expect(ellipsis.getAttribute('aria-label')).toBe('Map breadcrumbs');
  });
});

function byId<T extends HTMLElement>(root: HTMLElement, id: string): T {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element as T;
}

function expectPartStyleRoot(element: HTMLElement, legacyClass: string): void {
  expect(element.getAttribute('data-slot')).toBe('root');
  expect(element.classList.contains(legacyClass)).toBe(false);
}

function expectClasses(element: HTMLElement, present: string[], absent: string[] = []): void {
  const classes = element.className.split(/\s+/);
  for (const className of present) expect(classes).toContain(className);
  for (const className of absent) expect(classes).not.toContain(className);
}
