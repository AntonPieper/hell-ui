import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { faSolidCircleInfo } from '@ng-icons/font-awesome/solid';

import { HellIcon } from './icon';
import { expectUiRouting, sortClasses } from '../spec-helpers';

/**
 * Icon specs assert behavior, labels, and state attributes. Part-Class Pipeline
 * merge semantics are owned centrally by `core/part-class-pipeline.spec.ts`;
 * ui routing asserts that consumer classes reach the part and that nothing
 * outside the default render and the consumer's ui appears, instead of
 * asserting individual recipe classes. Part Recipes stay package-private per
 * ADR 0002, so the recipe snapshot below pins the rendered class surface.
 */

@Component({
  imports: [HellIcon],
  providers: [provideIcons({ faSolidCircleInfo })],
  template: `<hell-icon name="faSolidCircleInfo" />`,
})
class DecorativeIconHost {}

@Component({
  imports: [HellIcon],
  providers: [provideIcons({ faSolidCircleInfo })],
  template: `<hell-icon name="faSolidCircleInfo" decorative="false" aria-label="More information" />`,
})
class LabelledIconHost {}

@Component({
  imports: [HellIcon],
  providers: [provideIcons({ faSolidCircleInfo })],
  template: `
    <hell-icon
      id="icon-string"
      name="faSolidCircleInfo"
      decorative="false"
      aria-label="Info"
      size="20px"
      color="red"
      ui="flex text-hell-danger"
    />
    <hell-icon id="icon-map" name="faSolidCircleInfo" [ui]="iconUi" />
    <hell-icon id="icon-default" name="faSolidCircleInfo" />
  `,
})
class PartStyleIconHost {
  readonly iconUi = {
    root: 'text-hell-info',
  };
}

describe('HellIcon', () => {
  it('hides decorative icons from assistive technology by default', async () => {
    const fixture = TestBed.createComponent(DecorativeIconHost);
    await settle(fixture);

    const icon = query<HTMLElement>(fixture.nativeElement, 'hell-icon');
    const innerIcon = query<HTMLElement>(icon, 'ng-icon');

    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.getAttribute('role')).toBeNull();
    expect(icon.getAttribute('aria-label')).toBeNull();
    expect(innerIcon.getAttribute('aria-hidden')).toBe('true');
  });

  it('names non-decorative icons on the host and hides the inner glyph', async () => {
    const fixture = TestBed.createComponent(LabelledIconHost);
    await settle(fixture);

    const icon = query<HTMLElement>(fixture.nativeElement, 'hell-icon');
    const innerIcon = query<HTMLElement>(icon, 'ng-icon');

    expect(icon.getAttribute('aria-hidden')).toBeNull();
    expect(icon.getAttribute('role')).toBe('img');
    expect(icon.getAttribute('aria-label')).toBe('More information');
    expect(innerIcon.getAttribute('aria-hidden')).toBe('true');
  });

  it('applies string shorthand to the icon root while preserving image semantics', async () => {
    const fixture = TestBed.createComponent(PartStyleIconHost);
    await settle(fixture);

    const icon = query<HTMLElement>(fixture.nativeElement, '#icon-string');

    expect(icon.getAttribute('data-slot')).toBe('root');
    expect(icon.getAttribute('aria-hidden')).toBeNull();
    expect(icon.getAttribute('role')).toBe('img');
    expect(icon.getAttribute('aria-label')).toBe('Info');
    expect(icon.style.getPropertyValue('--ng-icon__size')).toBe('20px');
    expect(icon.style.getPropertyValue('--_hell-icon-color')).toBe('red');
    expectUiRouting(
      query<HTMLElement>(fixture.nativeElement, '#icon-default').className,
      icon.className,
      'flex text-hell-danger',
    );
  });

  it('applies object maps to the icon root', async () => {
    const fixture = TestBed.createComponent(PartStyleIconHost);
    await settle(fixture);

    const icon = query<HTMLElement>(fixture.nativeElement, '#icon-map');

    expect(icon.getAttribute('data-slot')).toBe('root');
    expectUiRouting(
      query<HTMLElement>(fixture.nativeElement, '#icon-default').className,
      icon.className,
      'text-hell-info',
    );
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', async () => {
      const fixture = TestBed.createComponent(PartStyleIconHost);
      await settle(fixture);

      expect({
        root: sortClasses(query<HTMLElement>(fixture.nativeElement, '#icon-default').className),
      }).toMatchSnapshot('icon');
    });
  });
});

async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function query<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
