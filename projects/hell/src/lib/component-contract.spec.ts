import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellButton } from './primitives/button/button';
import { HELL_SELECT_DIRECTIVES } from './primitives/select/select';
import { HELL_APP_SHELL_DIRECTIVES } from './composites/app-shell/app-shell';

@Component({
  imports: [HellButton, ...HELL_SELECT_DIRECTIVES, ...HELL_APP_SHELL_DIRECTIVES],
  template: `
    <button id="styled-button" hellButton variant="primary" size="sm" iconOnly block type="button">
      Save
    </button>
    <button id="unstyled-button" hellButton unstyled variant="danger" size="lg" type="button">
      Delete
    </button>

    <button id="select" hellSelect type="button">
      <span hellSelectValue>Germany</span>
      <span hellSelectPlaceholder>Choose country</span>
    </button>

    <nav hellAppSidenav>
      <a id="nav-item" hellNavItem active href="#">
        <span hellNavItemIcon aria-hidden="true"></span>
        <span hellNavItemLabel>Dashboard</span>
        <span hellNavItemTrailing>3</span>
      </a>
      <a id="unstyled-nav-item" hellNavItem unstyled href="#">
        <span hellNavItemLabel unstyled>Raw</span>
      </a>
    </nav>
  `,
})
class ContractHost {}

describe('Hell Component Contract', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractHost],
    }).compileComponents();
  });

  it('keeps state attributes while Style Opt-Out removes default classes', () => {
    const fixture = TestBed.createComponent(ContractHost);
    fixture.detectChanges();

    const styled = fixture.nativeElement.querySelector('#styled-button') as HTMLButtonElement;
    const unstyled = fixture.nativeElement.querySelector('#unstyled-button') as HTMLButtonElement;

    expect(styled.classList.contains('hell-button')).toBe(true);
    expect(styled.getAttribute('data-variant')).toBe('primary');
    expect(styled.getAttribute('data-size')).toBe('sm');
    expect(styled.hasAttribute('data-icon-only')).toBe(true);
    expect(styled.hasAttribute('data-block')).toBe(true);

    expect(unstyled.classList.contains('hell-button')).toBe(false);
    expect(unstyled.getAttribute('data-variant')).toBe('danger');
    expect(unstyled.getAttribute('data-size')).toBe('lg');
  });

  it('exposes primitive parts through host classes without owning caller markup', () => {
    const fixture = TestBed.createComponent(ContractHost);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('.hell-select') as HTMLButtonElement;
    const value = select.querySelector('.hell-select-value') as HTMLElement;
    const placeholder = select.querySelector('.hell-select-placeholder') as HTMLElement;

    expect(select.classList.contains('hell-select')).toBe(true);
    expect(value.classList.contains('hell-select-value')).toBe(true);
    expect(placeholder.classList.contains('hell-select-placeholder')).toBe(true);
  });

  it('exposes app shell nav as explicit parts instead of raw descendant styling', () => {
    const fixture = TestBed.createComponent(ContractHost);
    fixture.detectChanges();

    const item = fixture.nativeElement.querySelector('#nav-item') as HTMLAnchorElement;
    const icon = item.querySelector('[hellNavItemIcon]') as HTMLElement;
    const label = item.querySelector('[hellNavItemLabel]') as HTMLElement;
    const trailing = item.querySelector('[hellNavItemTrailing]') as HTMLElement;
    const unstyled = fixture.nativeElement.querySelector('#unstyled-nav-item') as HTMLAnchorElement;

    expect(item.classList.contains('hell-nav-item')).toBe(true);
    expect(item.getAttribute('data-slot')).toBe('nav-item');
    expect(item.getAttribute('data-active')).toBe('true');
    expect(icon.classList.contains('hell-nav-icon')).toBe(true);
    expect(icon.getAttribute('data-slot')).toBe('nav-icon');
    expect(label.classList.contains('hell-nav-label')).toBe(true);
    expect(label.getAttribute('data-slot')).toBe('nav-label');
    expect(trailing.classList.contains('hell-nav-trailing')).toBe(true);
    expect(trailing.getAttribute('data-slot')).toBe('nav-trailing');
    expect(unstyled.classList.contains('hell-nav-item')).toBe(false);
  });
});
