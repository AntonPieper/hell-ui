import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideHellLabels } from '../../core/labels';
import { HELL_BREADCRUMBS_DIRECTIVES } from './breadcrumbs';

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
  providers: [provideHellLabels({ breadcrumbs: { showHiddenNavigation: 'Contract breadcrumbs' } })],
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

describe('HellBreadcrumbEllipsis', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbEllipsisHost, BreadcrumbLabelContractHost],
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
});

function byId<T extends HTMLElement>(root: HTMLElement, id: string): T {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element as T;
}
