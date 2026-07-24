import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellAvatar, type HellAvatarUi } from './avatar';
import { expectUiRouting, sortClasses } from '../spec-helpers';

/**
 * Avatar specs assert behavior and state attributes. Part-Class Pipeline merge
 * semantics are owned centrally by `internal/core/part-class-pipeline.spec.ts`;
 * ui routing asserts that consumer classes reach each part and that nothing
 * outside the default render and the consumer's ui appears, instead of
 * asserting individual recipe classes. Part Recipes stay package-private per
 * ADR 0002, so the recipe snapshot below pins the rendered class surface per
 * part.
 */
const AVATAR_UI_SHORTHAND = 'bg-hell-danger border-hell-danger h-hell-10 w-hell-10';

@Component({
  imports: [HellAvatar],
  template: `
    <hell-avatar id="avatar-default" image="/ada.png" fallback="AP" alt="Ada Picture" />
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
    <hell-avatar id="avatar-parts" image="/ada.png" fallback="AP" [ui]="avatarPartsUi" />
  `,
})
class AvatarPartStyleHost {
  readonly avatarUi = {
    root: 'rounded-hell-md bg-hell-info-soft text-hell-info-strong',
  } satisfies HellAvatarUi;

  readonly avatarPartsUi = {
    image: 'object-contain grayscale',
    fallback: 'tracking-normal text-hell-danger',
  } satisfies HellAvatarUi;
}

describe('HellAvatar Part Style Map', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AvatarPartStyleHost] }).compileComponents();
  });

  it('marks every avatar part with its public data-slot', () => {
    const fixture = TestBed.createComponent(AvatarPartStyleHost);
    fixture.detectChanges();

    const avatar = byId(fixture.nativeElement, 'avatar-default');

    expect(avatar.getAttribute('data-slot')).toBe('root');
    expect(avatar.querySelector('img')?.getAttribute('data-slot')).toBe('image');
    expect(avatar.querySelector('span')?.getAttribute('data-slot')).toBe('fallback');
  });

  it('applies string shorthand to the root and preserves image/fallback attributes', () => {
    const fixture = TestBed.createComponent(AvatarPartStyleHost);
    fixture.detectChanges();

    const avatar = byId(fixture.nativeElement, 'avatar-string');
    const image = avatar.querySelector('img');

    expect(avatar.getAttribute('data-size')).toBe('lg');
    expect(avatar.getAttribute('data-shape')).toBe('square');
    expect(image?.getAttribute('src')).toBe('/ada.png');
    expect(image?.getAttribute('alt')).toBe('Ada Picture');
    expect(avatar.textContent?.trim()).toBe('AP');

    expectUiRouting(
      byId(fixture.nativeElement, 'avatar-default').className,
      avatar.className,
      AVATAR_UI_SHORTHAND,
    );
  });

  it('applies object maps to the root part', () => {
    const fixture = TestBed.createComponent(AvatarPartStyleHost);
    fixture.detectChanges();

    expectUiRouting(
      byId(fixture.nativeElement, 'avatar-default').className,
      byId(fixture.nativeElement, 'avatar-map').className,
      'rounded-hell-md bg-hell-info-soft text-hell-info-strong',
    );
  });

  it('merges ui part-map classes for the image and fallback parts', () => {
    const fixture = TestBed.createComponent(AvatarPartStyleHost);
    fixture.detectChanges();

    const defaults = byId(fixture.nativeElement, 'avatar-default');
    const avatar = byId(fixture.nativeElement, 'avatar-parts');

    expectUiRouting(
      defaults.querySelector('img')?.className ?? '',
      avatar.querySelector('img')?.className ?? '',
      'object-contain grayscale',
    );
    expectUiRouting(
      defaults.querySelector('span')?.className ?? '',
      avatar.querySelector('span')?.className ?? '',
      'tracking-normal text-hell-danger',
    );
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(AvatarPartStyleHost);
      fixture.detectChanges();

      const avatar = byId(fixture.nativeElement, 'avatar-default');

      expect({
        root: sortClasses(avatar.className),
        image: sortClasses(avatar.querySelector('img')?.className ?? ''),
        fallback: sortClasses(avatar.querySelector('span')?.className ?? ''),
      }).toMatchSnapshot('avatar');
    });
  });
});

function byId(root: HTMLElement, id: string): HTMLElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element;
}
