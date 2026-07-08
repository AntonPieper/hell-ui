import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { faSolidCircleInfo } from '@ng-icons/font-awesome/solid';

import { HellIcon, type HellIconUi } from './icon';

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
  `,
})
class PartStyleIconHost {
  readonly iconUi = {
    root: 'text-hell-info',
  } satisfies HellIconUi;
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
    const classes = icon.className.split(/\s+/);

    expect(icon.getAttribute('data-slot')).toBe('root');
    expect(icon.getAttribute('aria-hidden')).toBeNull();
    expect(icon.getAttribute('role')).toBe('img');
    expect(icon.getAttribute('aria-label')).toBe('Info');
    expect(icon.style.getPropertyValue('--ng-icon__size')).toBe('20px');
    expect(icon.style.getPropertyValue('--_hell-icon-color')).toBe('red');
    expect(classes).toContain('flex');
    expect(classes).toContain('text-hell-danger');
    expect(classes).not.toContain('inline-flex');
    expect(classes).not.toContain('text-[var(--_hell-icon-color,currentColor)]');
  });

  it('applies object maps to the icon root', async () => {
    const fixture = TestBed.createComponent(PartStyleIconHost);
    await settle(fixture);

    const icon = query<HTMLElement>(fixture.nativeElement, '#icon-map');

    expect(icon.getAttribute('data-slot')).toBe('root');
    expect(icon.className).toContain('text-hell-info');
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
