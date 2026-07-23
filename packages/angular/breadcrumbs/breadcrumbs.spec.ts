import { provideHellLabels } from '@hell-ui/angular/core';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_BREADCRUMBS_IMPORTS, HELL_BREADCRUMBS_LABELS } from './breadcrumbs';
import { expectUiRouting, sortClasses } from '../spec-helpers';

/**
 * Breadcrumb specs assert behavior, roles, and ARIA. Part-Class Pipeline
 * merge semantics are owned centrally by `core/part-class-pipeline.spec.ts`;
 * ui routing asserts that consumer classes reach each part and that nothing
 * outside the default render and the consumer's ui appears, instead of
 * asserting individual recipe classes. Part Recipes stay package-private per
 * ADR 0002, so the recipe snapshot below pins the rendered class surface per
 * part.
 */
@Component({
  imports: [...HELL_BREADCRUMBS_IMPORTS],
  template: `
    <nav id="breadcrumbs-default" hellBreadcrumbs>
      <ol id="list-default" hellBreadcrumbList>
        <li id="item-default" hellBreadcrumbItem>
          <button id="link-default" hellBreadcrumbLink>Home</button>
        </li>
        <li id="separator-default" hellBreadcrumbSeparator></li>
        <li>
          <span id="page-default" hellBreadcrumbPage>Current</span>
        </li>
        <li>
          <button id="ellipsis-default" hellBreadcrumbEllipsis></button>
        </li>
      </ol>
    </nav>
  `,
})
class BreadcrumbDefaultHost {}

@Component({
  imports: [...HELL_BREADCRUMBS_IMPORTS],
  template: `
    <nav hellBreadcrumbs>
      <ol hellBreadcrumbList>
        <li>
          <button id="default-ellipsis" hellBreadcrumbEllipsis></button>
          <button id="override-ellipsis" hellBreadcrumbEllipsis aria-label="Custom breadcrumb menu"></button>
          <span id="decorative-ellipsis" hellBreadcrumbEllipsis></span>
        </li>
      </ol>
    </nav>
  `,
})
class BreadcrumbEllipsisHost {}

@Component({
  imports: [...HELL_BREADCRUMBS_IMPORTS],
  providers: [provideHellLabels(HELL_BREADCRUMBS_LABELS, { showHiddenNavigation: 'Contract breadcrumbs' })],
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
  imports: [...HELL_BREADCRUMBS_IMPORTS],
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
  imports: [...HELL_BREADCRUMBS_IMPORTS],
  providers: [provideHellLabels(HELL_BREADCRUMBS_LABELS, { showHiddenNavigation: 'Map breadcrumbs' })],
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
  };

  readonly listUi = {
    root: 'grid gap-hell-3',
  };

  readonly itemUi = {
    root: 'grid gap-hell-2',
  };

  readonly linkUi = {
    root: 'flex text-hell-info',
  };

  readonly pageUi = {
    root: 'block text-hell-info-strong',
  };

  readonly separatorUi = {
    root: 'grid text-hell-info',
  };

  readonly ellipsisUi = {
    root: 'grid bg-hell-info-soft text-hell-info-strong',
  };
}

describe('HellBreadcrumbEllipsis', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BreadcrumbDefaultHost,
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

  it('keeps interactive button ellipses visible to assistive technology', () => {
    const fixture = TestBed.createComponent(BreadcrumbEllipsisHost);
    fixture.detectChanges();

    const buttonEllipsis = byId<HTMLButtonElement>(fixture.nativeElement, 'default-ellipsis');
    expect(buttonEllipsis.getAttribute('aria-hidden')).toBeNull();
    expect(buttonEllipsis.getAttribute('role')).toBeNull();
    expect(buttonEllipsis.getAttribute('type')).toBe('button');
  });

  it('keeps decorative span ellipses hidden from assistive technology', () => {
    const fixture = TestBed.createComponent(BreadcrumbEllipsisHost);
    fixture.detectChanges();

    const spanEllipsis = byId<HTMLSpanElement>(fixture.nativeElement, 'decorative-ellipsis');
    expect(spanEllipsis.getAttribute('aria-hidden')).toBe('true');
    expect(spanEllipsis.getAttribute('role')).toBe('presentation');
    expect(spanEllipsis.getAttribute('aria-label')).toBeNull();
    expect(spanEllipsis.getAttribute('type')).toBeNull();
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

    expectPartStyleRoot(breadcrumbs);
    expectPartStyleRoot(list);
    expectPartStyleRoot(item);
    expectPartStyleRoot(link);
    expectPartStyleRoot(separator);
    expectPartStyleRoot(page);
    expectPartStyleRoot(ellipsis);

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

    const defaults = defaultBreadcrumbClasses();

    expectUiRouting(defaults.breadcrumbs, breadcrumbs.className, 'flex text-hell-danger');
    expectUiRouting(defaults.list, list.className, 'grid gap-hell-4');
    expectUiRouting(defaults.item, item.className, 'grid gap-hell-4');
    expectUiRouting(defaults.link, link.className, 'flex text-hell-danger');
    expectUiRouting(defaults.separator, separator.className, 'grid text-hell-danger');
    expectUiRouting(defaults.page, page.className, 'block text-hell-danger');
    expectUiRouting(defaults.ellipsis, ellipsis.className, 'grid bg-hell-danger text-hell-foreground-inverse');
  });

  it('applies object maps to every breadcrumb root', () => {
    const fixture = TestBed.createComponent(BreadcrumbPartStyleMapHost);
    fixture.detectChanges();

    const defaults = defaultBreadcrumbClasses();

    expectUiRouting(
      defaults.breadcrumbs,
      byId(fixture.nativeElement, 'breadcrumbs-map').className,
      'flex text-hell-info',
    );
    expectUiRouting(defaults.list, byId(fixture.nativeElement, 'list-map').className, 'grid gap-hell-3');
    expectUiRouting(defaults.item, byId(fixture.nativeElement, 'item-map').className, 'grid gap-hell-2');
    expectUiRouting(defaults.link, byId(fixture.nativeElement, 'link-map').className, 'flex text-hell-info');
    expectUiRouting(
      defaults.separator,
      byId(fixture.nativeElement, 'separator-map').className,
      'grid text-hell-info',
    );
    expectUiRouting(
      defaults.page,
      byId(fixture.nativeElement, 'page-map').className,
      'block text-hell-info-strong',
    );

    const ellipsis = byId<HTMLButtonElement>(fixture.nativeElement, 'ellipsis-map');
    expectUiRouting(defaults.ellipsis, ellipsis.className, 'grid bg-hell-info-soft text-hell-info-strong');
    expect(ellipsis.getAttribute('aria-label')).toBe('Map breadcrumbs');
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      const defaults = defaultBreadcrumbClasses();

      expect({
        breadcrumbs: sortClasses(defaults.breadcrumbs),
        list: sortClasses(defaults.list),
        item: sortClasses(defaults.item),
        link: sortClasses(defaults.link),
        separator: sortClasses(defaults.separator),
        page: sortClasses(defaults.page),
        ellipsis: sortClasses(defaults.ellipsis),
      }).toMatchSnapshot('breadcrumbs');
    });
  });
});

function defaultBreadcrumbClasses(): Record<
  'breadcrumbs' | 'list' | 'item' | 'link' | 'separator' | 'page' | 'ellipsis',
  string
> {
  const fixture = TestBed.createComponent(BreadcrumbDefaultHost);
  fixture.detectChanges();

  return {
    breadcrumbs: byId(fixture.nativeElement, 'breadcrumbs-default').className,
    list: byId(fixture.nativeElement, 'list-default').className,
    item: byId(fixture.nativeElement, 'item-default').className,
    link: byId(fixture.nativeElement, 'link-default').className,
    separator: byId(fixture.nativeElement, 'separator-default').className,
    page: byId(fixture.nativeElement, 'page-default').className,
    ellipsis: byId(fixture.nativeElement, 'ellipsis-default').className,
  };
}

function byId<T extends HTMLElement>(root: HTMLElement, id: string): T {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element as T;
}

function expectPartStyleRoot(element: HTMLElement): void {
  expect(element.getAttribute('data-slot')).toBe('root');
}

