import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellSeparator, type HellSeparatorUi } from './separator';

@Component({
  imports: [HellSeparator],
  template: `
    <hr
      id="separator-string"
      hellSeparator
      orientation="horizontal"
      spacing="md"
      ui="bg-hell-danger"
    />
    <div
      id="separator-map"
      hellSeparator
      orientation="vertical"
      spacing="sm"
      [ui]="separatorUi"
    ></div>
  `,
})
class SeparatorPartStyleHost {
  readonly separatorUi = {
    root: 'bg-hell-info w-hell-2',
  } satisfies HellSeparatorUi;
}

describe('HellSeparator Part Style Map', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SeparatorPartStyleHost] }).compileComponents();
  });

  it('applies string shorthand to the root part and preserves separator state', () => {
    const fixture = TestBed.createComponent(SeparatorPartStyleHost);
    fixture.detectChanges();

    const separator = byId(fixture.nativeElement, 'separator-string');
    const classes = separator.className.split(/\s+/);

    expect(separator.getAttribute('data-slot')).toBe('root');
    expect(separator.getAttribute('role')).toBe('separator');
    expect(separator.getAttribute('data-orientation')).toBe('horizontal');
    expect(separator.getAttribute('data-spacing')).toBe('md');
    expect(classes).toContain('bg-hell-danger');
    expect(classes).not.toContain('bg-hell-border');
    expect(separator.classList.contains('hell-separator')).toBe(false);
  });

  it('applies object maps to the root part with deterministic class merging', () => {
    const fixture = TestBed.createComponent(SeparatorPartStyleHost);
    fixture.detectChanges();

    const separator = byId(fixture.nativeElement, 'separator-map');
    const classes = separator.className.split(/\s+/);

    expect(separator.getAttribute('data-slot')).toBe('root');
    expect(separator.getAttribute('role')).toBe('separator');
    expect(separator.getAttribute('data-orientation')).toBe('vertical');
    expect(separator.getAttribute('data-spacing')).toBe('sm');
    expect(classes).toContain('bg-hell-info');
    expect(classes).toContain('w-hell-2');
    expect(classes).not.toContain('bg-hell-border');
  });
});

function byId(root: HTMLElement, id: string): HTMLElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element;
}
