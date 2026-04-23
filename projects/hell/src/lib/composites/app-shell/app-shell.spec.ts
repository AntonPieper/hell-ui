import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_APP_SHELL_DIRECTIVES } from './app-shell';

@Component({
  imports: [...HELL_APP_SHELL_DIRECTIVES],
  template: `
    <div hellAppShell #shell="hellAppShell">
      <main hellAppContent>Content</main>
      <aside hellAppSecondary>
        <button
          hellSecondaryToggle
          type="button"
          class="hell-secondary-rail"
        ></button>
        <div hellAppSecondaryBody>
          <header>
            <button
              hellSecondaryToggle
              type="button"
              class="hell-secondary-header-toggle"
            ></button>
            Title
          </header>
          <p>Body</p>
        </div>
      </aside>
    </div>
  `,
})
class TestHost {}

describe('HellAppShell secondary panel', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();
  });

  it('roundtrips state via header toggle and rail toggle', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    const aside = fixture.nativeElement.querySelector('aside') as HTMLElement;
    const body = aside.querySelector('.hell-secondary-body') as HTMLElement;
    const headerToggle = aside.querySelector(
      'button.hell-secondary-header-toggle',
    ) as HTMLButtonElement;
    const rail = aside.querySelector(
      'button.hell-secondary-rail',
    ) as HTMLButtonElement;

    // Both toggles always present; consumer is responsible for placement.
    expect(body).not.toBeNull();
    expect(headerToggle).not.toBeNull();
    expect(rail).not.toBeNull();

    // Expanded.
    expect(aside.getAttribute('data-hidden')).toBeNull();
    expect(aside.getAttribute('aria-hidden')).toBeNull();
    expect(body.getAttribute('aria-hidden')).toBeNull();
    expect(headerToggle.getAttribute('aria-label')).toBe('Hide secondary panel');

    // Header toggle collapses the panel.
    headerToggle.click();
    fixture.detectChanges();
    expect(aside.getAttribute('data-hidden')).toBe('true');
    expect(aside.getAttribute('aria-hidden')).toBeNull();
    expect(body.getAttribute('aria-hidden')).toBe('true');
    expect(body.hasAttribute('inert')).toBe(true);
    expect(rail.getAttribute('aria-label')).toBe('Show secondary panel');

    // Rail toggle re-expands.
    rail.click();
    fixture.detectChanges();
    expect(aside.getAttribute('data-hidden')).toBeNull();
    expect(body.getAttribute('aria-hidden')).toBeNull();
    expect(body.hasAttribute('inert')).toBe(false);
  });
});
