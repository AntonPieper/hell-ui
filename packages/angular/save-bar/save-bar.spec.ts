import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';

import {
  HellSaveBar,
  provideHellSaveBarLabels,
  type HellSaveBarMode,
  type HellSaveBarUi,
} from './save-bar';

const liveAnnounce = vi.fn(() => Promise.resolve());

const announcementService = {
  announce: liveAnnounce,
};

@Component({
  imports: [HellSaveBar],
  template: `
    <input id="field" type="text" />
    <hell-save-bar
      [mode]="mode()"
      [dirty]="dirty()"
      [busy]="busy()"
      [disabled]="disabled()"
      [ui]="ui()"
      (saved)="savedCount = savedCount + 1"
      (discarded)="discardedCount = discardedCount + 1"
    >
      <button id="extra" type="button">Reset</button>
    </hell-save-bar>
  `,
})
class SaveBarHost {
  readonly mode = signal<HellSaveBarMode>('contextual');
  readonly dirty = signal(false);
  readonly busy = signal(false);
  readonly disabled = signal(false);
  readonly ui = signal<HellSaveBarUi | undefined>(undefined);
  savedCount = 0;
  discardedCount = 0;
}

describe('HellSaveBar', () => {
  beforeEach(() => {
    liveAnnounce.mockClear();
  });

  function setup(providers: unknown[] = []) {
    TestBed.configureTestingModule({
      imports: [SaveBarHost],
      providers: [{ provide: LiveAnnouncer, useValue: announcementService }, ...providers] as never[],
    });
    const fixture = TestBed.createComponent(SaveBarHost);
    fixture.detectChanges();
    return fixture;
  }

  function bar(fixture: ReturnType<typeof setup>): HTMLElement {
    return query(fixture.nativeElement as HTMLElement, 'hell-save-bar');
  }

  describe('mode/visibility matrix', () => {
    it('stays hidden in contextual mode until dirty, then appears in normal flow', () => {
      const fixture = setup();
      const host = bar(fixture);

      expect(host.getAttribute('data-mode')).toBe('contextual');
      expect(host.style.display).toBe('none');

      fixture.componentInstance.dirty.set(true);
      fixture.detectChanges();

      expect(host.style.display).toBe('');
      expect(host.getAttribute('data-dirty')).toBe('');
      expect(text(query(host, '[data-slot="message"]'))).toBe('You have unsaved changes');

      fixture.componentInstance.dirty.set(false);
      fixture.detectChanges();
      expect(host.style.display).toBe('none');
    });

    it('stays visible in persistent mode regardless of dirtiness, showing the message only while dirty', () => {
      const fixture = setup();
      fixture.componentInstance.mode.set('persistent');
      fixture.detectChanges();
      const host = bar(fixture);

      expect(host.getAttribute('data-mode')).toBe('persistent');
      expect(host.style.display).toBe('');
      expect(text(query(host, '[data-slot="message"]'))).toBe('');

      fixture.componentInstance.dirty.set(true);
      fixture.detectChanges();
      expect(host.style.display).toBe('');
      expect(text(query(host, '[data-slot="message"]'))).toBe('You have unsaved changes');
    });
  });

  describe('busy/disabled gating', () => {
    it('busy gates both actions and reflects data-busy', () => {
      const fixture = setup();
      fixture.componentInstance.dirty.set(true);
      fixture.componentInstance.busy.set(true);
      fixture.detectChanges();
      const host = bar(fixture);

      expect(host.getAttribute('data-busy')).toBe('');
      expect(query<HTMLButtonElement>(host, '[data-slot="save"]').disabled).toBe(true);
      expect(query<HTMLButtonElement>(host, '[data-slot="discard"]').disabled).toBe(true);
      // Busy renders a decorative progress glyph inside the save action.
      expect(host.querySelector('[data-slot="save"] svg')).not.toBeNull();
    });

    it('disabled gates Save only, leaving Discard operable', () => {
      const fixture = setup();
      fixture.componentInstance.dirty.set(true);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      const host = bar(fixture);

      expect(query<HTMLButtonElement>(host, '[data-slot="save"]').disabled).toBe(true);
      expect(query<HTMLButtonElement>(host, '[data-slot="discard"]').disabled).toBe(false);
      expect(host.querySelector('[data-slot="save"] svg')).toBeNull();
    });
  });

  describe('outputs', () => {
    it('emits saved and discarded when the built-in actions are activated', () => {
      const fixture = setup();
      fixture.componentInstance.dirty.set(true);
      fixture.detectChanges();
      const host = bar(fixture);

      query(host, '[data-slot="save"]').click();
      expect(fixture.componentInstance.savedCount).toBe(1);
      expect(fixture.componentInstance.discardedCount).toBe(0);

      query(host, '[data-slot="discard"]').click();
      expect(fixture.componentInstance.savedCount).toBe(1);
      expect(fixture.componentInstance.discardedCount).toBe(1);
    });

    it('emits nothing while busy', () => {
      const fixture = setup();
      fixture.componentInstance.dirty.set(true);
      fixture.componentInstance.busy.set(true);
      fixture.detectChanges();
      const host = bar(fixture);

      query(host, '[data-slot="save"]').click();
      query(host, '[data-slot="discard"]').click();

      expect(fixture.componentInstance.savedCount).toBe(0);
      expect(fixture.componentInstance.discardedCount).toBe(0);
    });

    it('renders the save action as a submit-triggering button and discard as a plain button', () => {
      const fixture = setup();
      fixture.componentInstance.dirty.set(true);
      fixture.detectChanges();
      const host = bar(fixture);

      expect(query(host, '[data-slot="save"]').getAttribute('type')).toBe('submit');
      expect(query(host, '[data-slot="discard"]').getAttribute('type')).toBe('button');
    });
  });

  describe('label contract', () => {
    it('lets the Label Contract override the message and action labels for a scope', () => {
      const fixture = setup([
        provideHellSaveBarLabels({
          message: 'Draft not published',
          save: 'Publish',
          discard: 'Revert',
        }),
      ]);
      fixture.componentInstance.dirty.set(true);
      fixture.detectChanges();
      const host = bar(fixture);

      expect(text(query(host, '[data-slot="message"]'))).toBe('Draft not published');
      expect(text(query(host, '[data-slot="save"]'))).toBe('Publish');
      expect(text(query(host, '[data-slot="discard"]'))).toBe('Revert');
    });
  });

  describe('announcement wiring', () => {
    it('politely announces the message each time the contextual bar appears', () => {
      const fixture = setup();
      expect(liveAnnounce).not.toHaveBeenCalled();

      fixture.componentInstance.dirty.set(true);
      fixture.detectChanges();
      expect(liveAnnounce).toHaveBeenCalledTimes(1);
      expect(liveAnnounce).toHaveBeenCalledWith('You have unsaved changes', 'polite');

      // Staying dirty does not re-announce.
      fixture.componentInstance.busy.set(true);
      fixture.detectChanges();
      expect(liveAnnounce).toHaveBeenCalledTimes(1);

      // Re-appearing announces again.
      fixture.componentInstance.busy.set(false);
      fixture.componentInstance.dirty.set(false);
      fixture.detectChanges();
      fixture.componentInstance.dirty.set(true);
      fixture.detectChanges();
      expect(liveAnnounce).toHaveBeenCalledTimes(2);
    });

    it('does not announce in persistent mode', () => {
      const fixture = setup();
      fixture.componentInstance.mode.set('persistent');
      fixture.detectChanges();

      fixture.componentInstance.dirty.set(true);
      fixture.detectChanges();

      expect(liveAnnounce).not.toHaveBeenCalled();
    });
  });

  describe('appearance behavior', () => {
    it('does not steal focus when the contextual bar appears', () => {
      const fixture = setup();
      const field = query<HTMLInputElement>(fixture.nativeElement as HTMLElement, '#field');
      field.focus();
      expect(document.activeElement).toBe(field);

      fixture.componentInstance.dirty.set(true);
      fixture.detectChanges();

      expect(document.activeElement).toBe(field);
    });

    it('keeps projected extra actions in the actions part, before the built-in buttons', () => {
      const fixture = setup();
      fixture.componentInstance.dirty.set(true);
      fixture.detectChanges();
      const actions = query(bar(fixture), '[data-slot="actions"]');

      const controls = [...actions.querySelectorAll('button')];
      expect(controls.map((control) => control.id || control.getAttribute('data-slot'))).toEqual([
        'extra',
        'discard',
        'save',
      ]);
    });
  });

  describe('part style map', () => {
    it('merges consumer refinements over the root and save recipes', () => {
      const fixture = setup();
      fixture.componentInstance.dirty.set(true);
      fixture.componentInstance.ui.set({ root: 'bg-hell-surface px-hell-2', save: 'min-w-32' });
      fixture.detectChanges();
      const host = bar(fixture);

      expect(host.getAttribute('data-slot')).toBe('root');
      expect(host.classList.contains('bg-hell-surface')).toBe(true);
      expect(host.classList.contains('bg-hell-surface-elevated')).toBe(false);
      expect(host.classList.contains('px-hell-2')).toBe(true);
      expect(host.classList.contains('px-hell-5')).toBe(false);
      // The bar stays sticky in normal flow; refinements do not remove positioning.
      expect(host.classList.contains('sticky')).toBe(true);

      expect(query(host, '[data-slot="save"]').classList.contains('min-w-32')).toBe(true);
    });
  });
});

function query<T extends HTMLElement = HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element as T;
}

function text(element: HTMLElement): string {
  return element.textContent?.trim() ?? '';
}
