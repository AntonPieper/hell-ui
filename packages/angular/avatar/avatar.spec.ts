import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellAvatar, type HellAvatarUi } from './avatar';

@Component({
  imports: [HellAvatar],
  template: `
    <hell-avatar
      id="avatar-string"
      image="/ada.png"
      fallback="AP"
      alt="Ada Picture"
      size="lg"
      shape="square"
      ui="bg-hell-danger border-hell-danger h-hell-10 w-hell-10"
    />
    <hell-avatar id="avatar-map" fallback="MP" [ui]="avatarUi" />
  `,
})
class AvatarPartStyleHost {
  readonly avatarUi = {
    root: 'rounded-hell-md bg-hell-info-soft text-hell-info-strong',
  } satisfies HellAvatarUi;
}

describe('HellAvatar Part Style Map', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AvatarPartStyleHost] }).compileComponents();
  });

  it('applies string shorthand to the root and preserves image/fallback attributes', () => {
    const fixture = TestBed.createComponent(AvatarPartStyleHost);
    fixture.detectChanges();

    const avatar = byId(fixture.nativeElement, 'avatar-string');
    const image = avatar.querySelector('img');
    const classes = avatar.className.split(/\s+/);

    expect(avatar.getAttribute('data-slot')).toBe('root');
    expect(avatar.getAttribute('data-size')).toBe('lg');
    expect(avatar.getAttribute('data-shape')).toBe('square');
    expect(image?.getAttribute('src')).toBe('/ada.png');
    expect(image?.getAttribute('alt')).toBe('Ada Picture');
    expect(avatar.textContent?.trim()).toBe('AP');
    expect(classes).toContain('bg-hell-danger');
    expect(classes).toContain('border-hell-danger');
    expect(classes).toContain('h-hell-10');
    expect(classes).toContain('w-hell-10');
    expect(classes).not.toContain('bg-hell-primary-soft');
    expect(classes).not.toContain(
      'border-[color:var(--_hell-avatar-border,var(--color-hell-surface-elevated))]',
    );
    expect(classes).not.toContain('h-[var(--_hell-av-size)]');
    expect(classes).not.toContain('w-[var(--_hell-av-size)]');
    expect(avatar.classList.contains('hell-avatar')).toBe(false);
  });

  it('applies object maps to the root part', () => {
    const fixture = TestBed.createComponent(AvatarPartStyleHost);
    fixture.detectChanges();

    const avatar = byId(fixture.nativeElement, 'avatar-map');

    expect(avatar.getAttribute('data-slot')).toBe('root');
    expect(avatar.className).toContain('rounded-hell-md');
    expect(avatar.className).toContain('bg-hell-info-soft');
    expect(avatar.className).toContain('text-hell-info-strong');
    expect(avatar.className.split(/\s+/)).not.toContain('rounded-full');
  });
});

function byId(root: HTMLElement, id: string): HTMLElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element;
}
