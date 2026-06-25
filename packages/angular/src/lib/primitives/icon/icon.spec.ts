import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';
import { faSolidCircleInfo } from '@ng-icons/font-awesome/solid';

import { HellIcon } from './icon';

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
