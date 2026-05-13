import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideHellLabels } from '../../core/labels';
import { type HellSearchSource } from '../../core/search';
import { HELL_OMNIBAR_DIRECTIVES, matchHotkey, type HellOmnibarSubmitEvent } from './omnibar';

@Component({
  imports: [...HELL_OMNIBAR_DIRECTIVES],
  template: `
    <hell-omnibar
      [value]="value()"
      [openOnFocus]="openOnFocus()"
      [searchDebounce]="0"
      (valueChange)="value.set($event)"
      (openChange)="openEvents.push($event)"
      (submit)="submitEvents.push($event)"
    >
      <button hellOmnibarItem value="alpha" (select)="selectEvents.push($event)">Alpha</button>
      <button
        hellOmnibarItem
        [value]="beta"
        [closeOnSelect]="closeOnSelect()"
        (select)="selectEvents.push($event)"
      >
        Beta
      </button>
    </hell-omnibar>
  `,
})
class OmnibarHost {
  readonly value = signal('');
  readonly openOnFocus = signal(true);
  readonly closeOnSelect = signal(true);
  readonly beta = { id: 'beta' };

  readonly openEvents: boolean[] = [];
  readonly selectEvents: unknown[] = [];
  readonly submitEvents: HellOmnibarSubmitEvent[] = [];
}

@Component({
  imports: [...HELL_OMNIBAR_DIRECTIVES],
  template: `
    <ng-template #loading let-rows="rows">
      <div data-contract="custom-loading">Custom loading {{ rows }}</div>
    </ng-template>

    <hell-omnibar
      [searchSource]="searchSource"
      [searchDebounce]="0"
      [loadingRows]="2"
      [loadingTemplate]="loading"
    />
  `,
})
class OmnibarLoadingTemplateHost {
  readonly searchSource: HellSearchSource<unknown> = () => new Promise(() => undefined);
}

@Component({
  imports: [...HELL_OMNIBAR_DIRECTIVES],
  providers: [
    provideHellLabels({
      omnibar: {
        clearSearch: 'Suche löschen',
      },
    }),
  ],
  template: `<hell-omnibar />`,
})
class OmnibarLocalizedHost {}

@Component({
  imports: [...HELL_OMNIBAR_DIRECTIVES],
  template: `
    <hell-omnibar
      [hotkey]="hotkey()"
      [openOnFocus]="openOnFocus()"
      [disabled]="disabled()"
      (openChange)="openEvents.push($event)"
    />
  `,
})
class OmnibarHotkeyHost {
  readonly hotkey = signal('ctrl+k');
  readonly openOnFocus = signal(false);
  readonly disabled = signal(false);

  readonly openEvents: boolean[] = [];
}

@Component({
  imports: [...HELL_OMNIBAR_DIRECTIVES],
  template: `
    <input data-slot="outside-input" />
    <hell-omnibar [hotkey]="hotkey()" [openOnFocus]="false" />
  `,
})
class OmnibarOutsideEditableHost {
  readonly hotkey = signal('/');
}

describe('HellOmnibar interactions', () => {
  let scrollIntoViewDescriptor: PropertyDescriptor | undefined;

  beforeEach(async () => {
    scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollIntoView',
    );
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });

    await TestBed.configureTestingModule({
      imports: [OmnibarHost],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (scrollIntoViewDescriptor) {
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', scrollIntoViewDescriptor);
    } else {
      delete (HTMLElement.prototype as { scrollIntoView?: () => void }).scrollIntoView;
    }
  });

  it('opens from focus, updates the query, and clears back to the focused input', async () => {
    const fixture = TestBed.createComponent(OmnibarHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('hell-omnibar') as HTMLElement;
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');

    input.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();

    expect(root.getAttribute('data-open')).toBe('true');
    expect(host.openEvents).toEqual([true]);

    input.value = 'alp';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(host.value()).toBe('alp');

    query<HTMLButtonElement>(fixture.nativeElement, '[data-slot="clear"]').click();
    await Promise.resolve();
    fixture.detectChanges();

    expect(host.value()).toBe('');
    expect(document.activeElement).toBe(input);
    expect(root.getAttribute('data-open')).toBe('true');
  });

  it('renders custom loading template instead of built-in skeleton rows', async () => {
    const fixture = TestBed.createComponent(OmnibarLoadingTemplateHost);
    fixture.detectChanges();

    query<HTMLInputElement>(fixture.nativeElement, 'input').dispatchEvent(new FocusEvent('focus'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(query(fixture.nativeElement, '[data-contract="custom-loading"]').textContent).toContain(
      'Custom loading 2',
    );
    expect(fixture.nativeElement.querySelector('[data-slot="skeleton-row"]')).toBeNull();
  });

  it('moves active results with the keyboard and submits without closing when requested', () => {
    const fixture = TestBed.createComponent(OmnibarHost);
    const host = fixture.componentInstance;
    host.value.set('be');
    host.closeOnSelect.set(false);
    fixture.detectChanges();

    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');
    input.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();

    const options = Array.from(
      fixture.nativeElement.querySelectorAll('[role="option"]'),
    ) as HTMLElement[];
    expect(options).toHaveLength(2);
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id);

    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(options[1].getAttribute('aria-selected')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[1].id);

    const enter = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(enter);
    fixture.detectChanges();

    expect(enter.defaultPrevented).toBe(true);
    expect(host.selectEvents).toEqual([host.beta]);
    expect(host.submitEvents).toEqual([{ value: 'be', item: host.beta, source: 'keyboard' }]);
    expect(fixture.nativeElement.querySelector('hell-omnibar').getAttribute('data-open')).toBe(
      'true',
    );
  });
});

describe('HellOmnibar labels', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OmnibarLocalizedHost],
    }).compileComponents();
  });

  it('uses an overridable clear-search label', () => {
    const fixture = TestBed.createComponent(OmnibarLocalizedHost);
    fixture.detectChanges();

    expect(query<HTMLButtonElement>(fixture.nativeElement, '[data-slot="clear"]').getAttribute('aria-label')).toBe(
      'Suche löschen',
    );
  });
});

describe('HellOmnibar hotkey matching', () => {
  it('matches requested modifiers and rejects extra strict modifiers', () => {
    expect(matchHotkey(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }), 'ctrl+k')).toBe(
      true,
    );
    expect(
      matchHotkey(
        new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, altKey: true }),
        'ctrl+k',
      ),
    ).toBe(false);
  });

  it('matches aliases and produced literal keys', () => {
    expect(matchHotkey(new KeyboardEvent('keydown', { key: 'k', metaKey: true }), 'cmd+k')).toBe(
      true,
    );
    expect(matchHotkey(new KeyboardEvent('keydown', { key: '?' }), '?')).toBe(true);
  });

  it('rejects extra shift when combo does not request it', () => {
    expect(
      matchHotkey(new KeyboardEvent('keydown', { key: 'K', shiftKey: true, ctrlKey: true }),
        'ctrl+k',
      ),
    ).toBe(false);
  });
});

describe('HellOmnibar hotkey activation', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OmnibarHotkeyHost, OmnibarOutsideEditableHost],
    }).compileComponents();
  });

  it('opens and focuses when a configured global hotkey matches', () => {
    const fixture = TestBed.createComponent(OmnibarHotkeyHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const root = query<HTMLElement>(fixture.nativeElement, 'hell-omnibar');
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'view', { value: document.defaultView });
    document.dispatchEvent(event);
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(true);
    expect(root.getAttribute('data-open')).toBe('true');
    expect(document.activeElement).toBe(input);
    expect(host.openEvents).toEqual([true]);
  });

  it('does not open when disabled', () => {
    const fixture = TestBed.createComponent(OmnibarHotkeyHost);
    const host = fixture.componentInstance;
    host.disabled.set(true);
    fixture.detectChanges();

    const root = query<HTMLElement>(fixture.nativeElement, 'hell-omnibar');
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'view', { value: document.defaultView });
    document.dispatchEvent(event);

    expect(root.getAttribute('data-open')).toBeNull();
    expect(document.activeElement).not.toBe(input);
    expect(host.openEvents).toEqual([]);
  });

  it('does not hijack bare slash typed inside another editable field', () => {
    const fixture = TestBed.createComponent(OmnibarOutsideEditableHost);
    fixture.detectChanges();

    const root = query<HTMLElement>(fixture.nativeElement, 'hell-omnibar');
    const editable = query<HTMLInputElement>(fixture.nativeElement, '[data-slot="outside-input"]');

    editable.focus();

    const event = new KeyboardEvent('keydown', {
      key: '/',
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'view', { value: document.defaultView });
    editable.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(root.getAttribute('data-open')).toBeNull();
    expect(document.activeElement).toBe(editable);
  });
});

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element as T;
}
