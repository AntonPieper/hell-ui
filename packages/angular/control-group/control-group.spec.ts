import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HellControlGroup,
  HellControlGroupAction,
  HellControlGroupPrefix,
  HellControlGroupSuffix,
} from './control-group';
import { expectUiRouting, sortClasses } from '../spec-helpers';

/**
 * Control-group specs assert behavior and state attributes. Part-Class
 * Pipeline merge semantics are owned centrally by
 * `internal/core/part-class-pipeline.spec.ts`; ui routing asserts that consumer
 * classes reach each part and that nothing outside the default render and the
 * consumer's ui appears, instead of asserting individual recipe classes. Part
 * Recipes stay package-private per ADR 0002, so the recipe snapshot below
 * pins the rendered class surface per part.
 */

@Component({
  imports: [
    HellControlGroup,
    HellControlGroupPrefix,
    HellControlGroupSuffix,
    HellControlGroupAction,
  ],
  template: `
    <div
      id="group"
      hellControlGroup
      size="lg"
      invalid
      aria-label="Website control"
      ui="rounded-hell-pill border-hell-info"
    >
      <span id="prefix" hellControlGroupPrefix ui="text-hell-info">https://</span>
      <input id="control" aria-label="Website address" />
      <span id="suffix" hellControlGroupSuffix ui="font-semibold">.example</span>
      <button id="action" hellControlGroupAction ui="text-hell-info">Copy</button>
    </div>
    <button id="outside" type="button">Outside</button>
  `,
})
class CompositionHost {}

@Component({
  imports: [
    HellControlGroup,
    HellControlGroupPrefix,
    HellControlGroupSuffix,
    HellControlGroupAction,
  ],
  template: `
    <div
      id="state-group"
      hellControlGroup
      aria-label="Amount control"
      [size]="size()"
      [invalid]="invalid()"
      [disabled]="disabled()"
    >
      <span id="state-prefix" hellControlGroupPrefix>$</span>
      <input
        id="state-control"
        aria-label="Amount in US dollars"
        [disabled]="disabled()"
        [attr.aria-invalid]="invalid() ? 'true' : null"
      />
      <span id="state-suffix" hellControlGroupSuffix>USD</span>
      <button id="state-action" hellControlGroupAction [disabled]="actionDisabled()">
        Reset
      </button>
    </div>
  `,
})
class StateHost {
  readonly size = signal<'sm' | 'md' | 'lg'>('sm');
  readonly invalid = signal(false);
  readonly disabled = signal(false);
  readonly actionDisabled = signal(false);
}

describe('HellControlGroup', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CompositionHost, StateHost] }).compileComponents();
  });

  it('renders four locally styleable composition surfaces with shared state attributes', () => {
    const fixture = TestBed.createComponent(CompositionHost);
    fixture.detectChanges();

    const group = query(fixture.nativeElement, '#group');
    const prefix = query(fixture.nativeElement, '#prefix');
    const suffix = query(fixture.nativeElement, '#suffix');
    const action = query<HTMLButtonElement>(fixture.nativeElement, '#action');

    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('data-slot')).toBe('root');
    expect(group.getAttribute('data-size')).toBe('lg');
    expect(group.getAttribute('data-invalid')).toBe('true');
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(group.getAttribute('data-disabled')).toBeNull();
    expect(group.getAttribute('aria-disabled')).toBeNull();

    expect(Array.from(group.children, (child) => child.id)).toEqual([
      'prefix',
      'control',
      'suffix',
      'action',
    ]);
    expect(prefix.textContent?.trim()).toBe('https://');
    expect(suffix.textContent?.trim()).toBe('.example');
    expect(action.textContent?.trim()).toBe('Copy');

    for (const surface of [prefix, suffix, action]) {
      expect(surface.getAttribute('data-slot')).toBe('root');
      expect(surface.getAttribute('data-size')).toBe('lg');
      expect(surface.getAttribute('data-invalid')).toBe('true');
      expect(surface.getAttribute('data-disabled')).toBeNull();
    }
    expect(action.type).toBe('button');
  });

  it('routes ui shorthand and part maps through the shared Part-Class Pipeline per part', () => {
    const fixture = TestBed.createComponent(CompositionHost);
    const defaults = TestBed.createComponent(StateHost);
    fixture.detectChanges();
    defaults.detectChanges();

    expectUiRouting(
      className(defaults, '#state-group'),
      className(fixture, '#group'),
      'rounded-hell-pill border-hell-info',
    );
    expectUiRouting(className(defaults, '#state-prefix'), className(fixture, '#prefix'), 'text-hell-info');
    expectUiRouting(className(defaults, '#state-suffix'), className(fixture, '#suffix'), 'font-semibold');
    expectUiRouting(className(defaults, '#state-action'), className(fixture, '#action'), 'text-hell-info');
  });

  it('keeps data-focus-within while focus moves inside and clears it on exit', () => {
    const fixture = TestBed.createComponent(CompositionHost);
    fixture.detectChanges();

    const group = query(fixture.nativeElement, '#group');
    const control = query<HTMLInputElement>(fixture.nativeElement, '#control');
    const action = query<HTMLButtonElement>(fixture.nativeElement, '#action');
    const outside = query<HTMLButtonElement>(fixture.nativeElement, '#outside');

    expect(group.getAttribute('data-focus-within')).toBeNull();

    control.focus();
    fixture.detectChanges();
    expect(group.getAttribute('data-focus-within')).toBe('true');

    action.focus();
    fixture.detectChanges();
    expect(group.getAttribute('data-focus-within')).toBe('true');

    outside.focus();
    fixture.detectChanges();
    expect(group.getAttribute('data-focus-within')).toBeNull();
  });

  it('updates shared size, invalid, and disabled state without replacing native semantics', () => {
    const fixture = TestBed.createComponent(StateHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const group = query(fixture.nativeElement, '#state-group');
    const control = query<HTMLInputElement>(fixture.nativeElement, '#state-control');
    const prefix = query(fixture.nativeElement, '#state-prefix');
    const suffix = query(fixture.nativeElement, '#state-suffix');
    const action = query<HTMLButtonElement>(fixture.nativeElement, '#state-action');

    expect(group.getAttribute('data-size')).toBe('sm');
    expect(group.getAttribute('data-invalid')).toBeNull();
    expect(group.getAttribute('aria-invalid')).toBeNull();
    expect(group.getAttribute('data-disabled')).toBeNull();
    expect(group.getAttribute('aria-disabled')).toBeNull();
    expect(control.disabled).toBe(false);
    expect(action.disabled).toBe(false);

    host.size.set('lg');
    host.invalid.set(true);
    host.disabled.set(true);
    fixture.detectChanges();

    expect(group.getAttribute('data-size')).toBe('lg');
    expect(group.getAttribute('data-invalid')).toBe('true');
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(group.getAttribute('data-disabled')).toBe('true');
    expect(group.getAttribute('aria-disabled')).toBe('true');
    expect(control.disabled).toBe(true);
    expect(control.getAttribute('aria-invalid')).toBe('true');
    expect(action.disabled).toBe(true);

    for (const surface of [prefix, suffix, action]) {
      expect(surface.getAttribute('data-size')).toBe('lg');
      expect(surface.getAttribute('data-invalid')).toBe('true');
      expect(surface.getAttribute('data-disabled')).toBe('true');
    }

    host.disabled.set(false);
    host.actionDisabled.set(true);
    fixture.detectChanges();

    expect(group.getAttribute('data-disabled')).toBeNull();
    expect(control.disabled).toBe(false);
    expect(action.disabled).toBe(true);
    expect(action.getAttribute('data-disabled')).toBe('true');
    expect(prefix.getAttribute('data-disabled')).toBeNull();
    expect(suffix.getAttribute('data-disabled')).toBeNull();
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(StateHost);
      fixture.detectChanges();

      expect({
        group: sortClasses(className(fixture, '#state-group')),
        prefix: sortClasses(className(fixture, '#state-prefix')),
        suffix: sortClasses(className(fixture, '#state-suffix')),
        action: sortClasses(className(fixture, '#state-action')),
      }).toMatchSnapshot('controlGroup');
    });
  });
});

function className(fixture: { nativeElement: HTMLElement }, selector: string): string {
  return query(fixture.nativeElement, selector).className;
}

function query<T extends HTMLElement = HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element as T;
}
