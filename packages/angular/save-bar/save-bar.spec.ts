import { Component, signal } from '@angular/core';
import { provideHellLabels } from '@hell-ui/angular/core';
import { TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';

import { HellSaveBar, HELL_SAVE_BAR_LABELS, type HellSaveBarMode, type HellSaveBarSaveType, type HellSaveBarUi } from './save-bar';
import type { HellSize } from '@hell-ui/angular/core';

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
      [message]="message()"
      [saveType]="saveType()"
      [size]="size()"
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
  readonly message = signal<string | undefined>(undefined);
  readonly saveType = signal<HellSaveBarSaveType>('button');
  readonly size = signal<HellSize>('sm');
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
      // Pristine + persistent renders no empty message paragraph.
      expect(host.querySelector('[data-slot="message"]')).toBeNull();

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

    it('defaults both actions to plain buttons, so Save emits saved without submitting a form', () => {
      const fixture = setup();
      fixture.componentInstance.dirty.set(true);
      fixture.detectChanges();
      const host = bar(fixture);

      // Both default to type="button"; the default Save cannot submit an
      // enclosing form (the no-double-fire path is asserted end-to-end in e2e).
      expect(query(host, '[data-slot="save"]').getAttribute('type')).toBe('button');
      expect(query(host, '[data-slot="discard"]').getAttribute('type')).toBe('button');

      query(host, '[data-slot="save"]').click();
      expect(fixture.componentInstance.savedCount).toBe(1);
    });

    it('opts the Save action into native form submission with saveType="submit"', () => {
      const fixture = setup();
      fixture.componentInstance.dirty.set(true);
      fixture.componentInstance.saveType.set('submit');
      fixture.detectChanges();
      const host = bar(fixture);

      expect(query(host, '[data-slot="save"]').getAttribute('type')).toBe('submit');
      expect(query(host, '[data-slot="discard"]').getAttribute('type')).toBe('button');
    });
  });

  describe('size', () => {
    it('forwards its size to both built-in buttons, defaulting to sm', () => {
      const fixture = setup();
      fixture.componentInstance.dirty.set(true);
      fixture.detectChanges();
      const host = bar(fixture);

      expect(query(host, '[data-slot="save"]').getAttribute('data-size')).toBe('sm');
      expect(query(host, '[data-slot="discard"]').getAttribute('data-size')).toBe('sm');

      fixture.componentInstance.size.set('md');
      fixture.detectChanges();
      expect(query(host, '[data-slot="save"]').getAttribute('data-size')).toBe('md');
      expect(query(host, '[data-slot="discard"]').getAttribute('data-size')).toBe('md');
    });
  });

  describe('label contract', () => {
    it('lets the Label Contract override the message and action labels for a scope', () => {
      const fixture = setup([
        provideHellLabels(HELL_SAVE_BAR_LABELS, {
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
    it('politely announces the message once when the contextual bar appears', () => {
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
    });

    it('does not re-announce when dirty flaps false→true within the settle interval', () => {
      vi.useFakeTimers();
      try {
        const fixture = setup();
        fixture.componentInstance.dirty.set(true);
        fixture.detectChanges();
        expect(liveAnnounce).toHaveBeenCalledTimes(1);

        // Flap pristine→dirty before the settle interval elapses: same session,
        // no second announcement.
        fixture.componentInstance.dirty.set(false);
        fixture.detectChanges();
        fixture.componentInstance.dirty.set(true);
        fixture.detectChanges();
        expect(liveAnnounce).toHaveBeenCalledTimes(1);
      } finally {
        vi.useRealTimers();
      }
    });

    it('re-announces once dirty has settled false past the settle interval', () => {
      vi.useFakeTimers();
      try {
        const fixture = setup();
        fixture.componentInstance.dirty.set(true);
        fixture.detectChanges();
        expect(liveAnnounce).toHaveBeenCalledTimes(1);

        fixture.componentInstance.dirty.set(false);
        fixture.detectChanges();
        // Stays pristine past the settle window, so the next dirty is a new session.
        vi.advanceTimersByTime(100);
        fixture.componentInstance.dirty.set(true);
        fixture.detectChanges();
        expect(liveAnnounce).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it('renders and announces the per-instance message, overriding the Label Contract', () => {
      const fixture = setup([provideHellLabels(HELL_SAVE_BAR_LABELS, { message: 'You have unsaved changes' })]);
      fixture.componentInstance.message.set('Unsent fax');
      fixture.componentInstance.dirty.set(true);
      fixture.detectChanges();

      expect(text(query(bar(fixture), '[data-slot="message"]'))).toBe('Unsent fax');
      expect(liveAnnounce).toHaveBeenCalledWith('Unsent fax', 'polite');
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
      fixture.detectChanges();
      const host = bar(fixture);
      const defaults = {
        root: host.className,
        save: query(host, '[data-slot="save"]').className,
      };

      fixture.componentInstance.ui.set({ root: 'bg-hell-surface px-hell-2', save: 'min-w-32' });
      fixture.detectChanges();

      expect(host.getAttribute('data-slot')).toBe('root');
      expectUiRouting(defaults.root, host.className, 'bg-hell-surface px-hell-2');
      // The bar stays sticky in normal flow; refinements do not remove positioning.
      expect(host.classList.contains('sticky')).toBe(true);
      expectUiRouting(defaults.save, query(host, '[data-slot="save"]').className, 'min-w-32');
    });
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      const fixture = setup();
      fixture.componentInstance.dirty.set(true);
      fixture.detectChanges();
      const host = bar(fixture);

      expect({
        root: sortClasses(host.className),
        actions: sortClasses(query(host, '[data-slot="actions"]').className),
        save: sortClasses(query(host, '[data-slot="save"]').className),
        discard: sortClasses(query(host, '[data-slot="discard"]').className),
      }).toMatchSnapshot('saveBar');
    });
  });
});

/**
 * Proves consumer ui classes reach the part through the Part-Class Pipeline:
 * every ui class renders, and nothing outside the default render plus the
 * consumer's ui appears. Merge conflict semantics are owned centrally by
 * `core/part-class-pipeline.spec.ts`.
 */
function expectUiRouting(defaultClassName: string, customClassName: string, ui: string): void {
  const custom = sortClasses(customClassName);
  const ownUi = sortClasses(ui);
  const allowed = new Set([...sortClasses(defaultClassName), ...ownUi]);

  expect(custom).toEqual(expect.arrayContaining(ownUi));
  expect(custom.filter((candidate) => !allowed.has(candidate))).toEqual([]);
}

function sortClasses(value: string): string[] {
  return value.split(/\s+/).filter(Boolean).sort();
}

function query<T extends HTMLElement = HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element as T;
}

function text(element: HTMLElement): string {
  return element.textContent?.trim() ?? '';
}
