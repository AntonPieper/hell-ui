import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HellBadge,
  type HellBadgeUi,
  HellKbd,
  type HellKbdUi,
  HellTag,
  type HellTagUi,
} from './tag';

@Component({
  imports: [HellTag, HellBadge, HellKbd],
  template: `
    <span
      id="tag-string"
      hellTag
      variant="success"
      ui="bg-hell-danger px-hell-4 text-hell-foreground-inverse"
    >
      Ready
    </span>
    <span id="tag-map" hellTag [ui]="tagUi">Queued</span>
    <span id="badge-string" hellBadge ui="min-w-hell-8 bg-hell-info">3</span>
    <kbd id="kbd-map" hellKbd [ui]="kbdUi">K</kbd>
  `,
})
class TagPartStyleHost {
  readonly tagUi = {
    root: 'rounded-hell-md bg-hell-warning-soft text-hell-warning-strong',
  } satisfies HellTagUi;

  readonly kbdUi = {
    root: 'h-hell-6 border-hell-primary text-hell-primary',
  } satisfies HellKbdUi;

  readonly badgeUi = {
    root: 'bg-hell-info',
  } satisfies HellBadgeUi;
}

describe('Tag, Badge, and Kbd Part Style Maps', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TagPartStyleHost] }).compileComponents();
  });

  it('applies string shorthand to the root part and preserves tag state attributes', () => {
    const fixture = TestBed.createComponent(TagPartStyleHost);
    fixture.detectChanges();

    const tag = byId(fixture.nativeElement, 'tag-string');
    const classes = tag.className.split(/\s+/);

    expect(tag.getAttribute('data-slot')).toBe('root');
    expect(tag.getAttribute('data-variant')).toBe('success');
    expect(classes).toContain('bg-hell-danger');
    expect(classes).toContain('px-hell-4');
    expect(classes).toContain('text-hell-foreground-inverse');
    expect(classes).not.toContain('bg-[var(--_hell-tag-bg)]');
    expect(classes).not.toContain('px-hell-2');
    expect(classes).not.toContain('text-[var(--_hell-tag-fg)]');
  });

  it('applies object maps to the root part', () => {
    const fixture = TestBed.createComponent(TagPartStyleHost);
    fixture.detectChanges();

    const tag = byId(fixture.nativeElement, 'tag-map');
    const kbd = byId(fixture.nativeElement, 'kbd-map');

    expect(tag.getAttribute('data-slot')).toBe('root');
    expect(tag.className).toContain('rounded-hell-md');
    expect(tag.className).toContain('bg-hell-warning-soft');
    expect(tag.className).toContain('text-hell-warning-strong');

    expect(kbd.getAttribute('data-slot')).toBe('root');
    expect(kbd.className).toContain('h-hell-6');
    expect(kbd.className).toContain('border-hell-primary');
    expect(kbd.className).toContain('text-hell-primary');
  });

  it('merges conflicting Badge root classes through hellTwMerge', () => {
    const fixture = TestBed.createComponent(TagPartStyleHost);
    fixture.detectChanges();

    const badge = byId(fixture.nativeElement, 'badge-string');
    const classes = badge.className.split(/\s+/);

    expect(badge.getAttribute('data-slot')).toBe('root');
    expect(classes).toContain('min-w-hell-8');
    expect(classes).toContain('bg-hell-info');
    expect(classes).not.toContain('min-w-hell-4');
    expect(classes).not.toContain('bg-hell-danger');
  });
});

function byId(root: HTMLElement, id: string): HTMLElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element;
}
