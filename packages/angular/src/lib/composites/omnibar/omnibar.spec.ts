import { Component, signal } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';

import { provideHellLabels } from '../../core/labels';
import { type HellSearchSource } from '../../core/search';
import { HellGlobalKeydownService, matchHotkey } from '../../core/hotkeys';
import { HELL_MENU_DIRECTIVES } from '../../primitives/menu/menu';
import { HELL_OMNIBAR_DIRECTIVES, type HellOmnibarSubmitEvent } from './omnibar';

@Component({
  imports: [...HELL_OMNIBAR_DIRECTIVES, ...HELL_MENU_DIRECTIVES],
  template: `
    <hell-omnibar
      [value]="value()"
      [openOnFocus]="openOnFocus()"
      [searchDebounce]="0"
      (valueChange)="value.set($event)"
      (openChange)="openEvents.push($event)"
      (submit)="submitEvents.push($event)"
    >
      <ng-template #filtersMenu>
        <div hellMenu>
          <button hellMenuItem data-testid="filters-menu-item" type="button">Filters</button>
        </div>
      </ng-template>
      <span hellOmnibarLeading hellOmnibarChip>
        Token
        <button hellOmnibarChipRemove type="button" aria-label="Remove token"></button>
      </span>
      <div hellOmnibarActions aria-label="Filters">
        <button hellOmnibarAction type="button" [hellMenuTrigger]="filtersMenu">Filters</button>
      </div>
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
    <button data-testid="outside-focus" type="button">Outside focus</button>
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
  template: `
    <hell-omnibar [openOnFocus]="true" (submit)="submitEvents.push($event)">
      <button hellOmnibarItem value="disabled" disabled (select)="selectEvents.push($event)">
        Disabled
      </button>
      <button hellOmnibarItem value="enabled" (select)="selectEvents.push($event)">Enabled</button>
    </hell-omnibar>
  `,
})
class OmnibarDisabledItemHost {
  readonly selectEvents: unknown[] = [];
  readonly submitEvents: HellOmnibarSubmitEvent[] = [];
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
  readonly hotkey = signal<string | null>('ctrl+k');
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
      imports: [OmnibarHost, OmnibarDisabledItemHost],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(OverlayContainer).ngOnDestroy();
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

    expect(query(overlayRoot(), '[data-contract="custom-loading"]').textContent).toContain(
      'Custom loading 2',
    );
    expect(overlayRoot().querySelector('[data-slot="skeleton-row"]')).toBeNull();
  });

  it('moves active results with the keyboard and submits without closing when requested', () => {
    const fixture = TestBed.createComponent(OmnibarHost);
    const host = fixture.componentInstance;
    host.value.set('be');
    host.closeOnSelect.set(false);
    fixture.detectChanges();

    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');
    input.focus();
    fixture.detectChanges();

    const listbox = query<HTMLElement>(overlayRoot(), '[role="listbox"]');
    const options = Array.from(overlayRoot().querySelectorAll('[role="option"]')) as HTMLElement[];
    expect(listbox.getAttribute('tabindex')).toBeNull();
    expect(options).toHaveLength(2);
    expect(options.map((option) => option.tabIndex)).toEqual([-1, -1]);
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id);

    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(options[1].getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(input);
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
    expect(document.activeElement).toBe(input);
    expect(fixture.nativeElement.querySelector('hell-omnibar').getAttribute('data-open')).toBe(
      'true',
    );
  });

  it('removes the active descendant when the panel closes', () => {
    const fixture = TestBed.createComponent(OmnibarHost);
    const host = fixture.componentInstance;
    host.value.set('be');
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector('hell-omnibar') as HTMLElement;
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');
    input.focus();
    fixture.detectChanges();

    const options = Array.from(overlayRoot().querySelectorAll('[role="option"]')) as HTMLElement[];
    expect(options).toHaveLength(2);
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id);

    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(root.getAttribute('data-open')).toBeNull();
    expect(input.getAttribute('aria-activedescendant')).toBeNull();
  });

  it('keeps the open omnibar tab order anchored on the input', () => {
    const fixture = TestBed.createComponent(OmnibarHost);
    const host = fixture.componentInstance;
    host.value.set('be');
    fixture.detectChanges();

    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');
    input.focus();
    fixture.detectChanges();

    const clear = query<HTMLButtonElement>(fixture.nativeElement, '[data-slot="clear"]');
    const chipRemove = query<HTMLButtonElement>(fixture.nativeElement, '[hellOmnibarChipRemove]');
    const action = query<HTMLButtonElement>(overlayRoot(), '[hellOmnibarAction]');
    const tab = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(tab);
    fixture.detectChanges();

    expect(clear.tabIndex).toBe(-1);
    expect(chipRemove.tabIndex).toBe(-1);
    expect(action.tabIndex).toBe(-1);
    expect(openOmnibarTabStops(fixture.nativeElement, overlayRoot())).toEqual([input]);
    expect(tab.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it('lets F6 reach popup actions without making them Tab stops', () => {
    const fixture = TestBed.createComponent(OmnibarHost);
    fixture.componentInstance.value.set('be');
    fixture.detectChanges();

    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');
    input.focus();
    fixture.detectChanges();

    const action = query<HTMLButtonElement>(overlayRoot(), '[hellOmnibarAction]');
    const enterActions = new KeyboardEvent('keydown', {
      key: 'F6',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(enterActions);
    fixture.detectChanges();

    expect(enterActions.defaultPrevented).toBe(true);
    expect(action.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(action);

    const leaveActions = new KeyboardEvent('keydown', {
      key: 'F6',
      bubbles: true,
      cancelable: true,
    });
    action.dispatchEvent(leaveActions);
    fixture.detectChanges();

    expect(leaveActions.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input);
  });

  it('keeps focus inside registered nested floating surfaces before true outside focus closes', async () => {
    const fixture = TestBed.createComponent(OmnibarHost);
    const host = fixture.componentInstance;
    host.value.set('be');
    fixture.detectChanges();

    const root = query<HTMLElement>(fixture.nativeElement, 'hell-omnibar');
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');
    const outsideFocus = query<HTMLButtonElement>(
      fixture.nativeElement,
      '[data-testid="outside-focus"]',
    );
    input.focus();
    fixture.detectChanges();
    await fixture.whenStable();

    const action = query<HTMLButtonElement>(overlayRoot(), '[hellOmnibarAction]');
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'F6', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(document.activeElement).toBe(action);
    expect(root.getAttribute('data-open')).toBe('true');

    action.click();
    const menuItem = await waitForElement<HTMLButtonElement>(
      fixture,
      document.body,
      '[data-testid="filters-menu-item"]',
    );

    menuItem.focus();
    await Promise.resolve();
    fixture.detectChanges();

    expect(document.activeElement).toBe(menuItem);
    expect(root.getAttribute('data-open')).toBe('true');
    expect(host.openEvents).toEqual([true]);

    outsideFocus.dispatchEvent(
      new FocusEvent('focusin', { bubbles: true, relatedTarget: menuItem }),
    );
    fixture.detectChanges();

    expect(root.getAttribute('data-open')).toBeNull();
    expect(host.openEvents).toEqual([true, false]);
  });

  it('closes and clears from Escape without moving focus to an option', () => {
    const fixture = TestBed.createComponent(OmnibarHost);
    const host = fixture.componentInstance;
    host.value.set('be');
    fixture.detectChanges();

    const root = query<HTMLElement>(fixture.nativeElement, 'hell-omnibar');
    const clear = query<HTMLButtonElement>(fixture.nativeElement, '[data-slot="clear"]');
    const chipRemove = query<HTMLButtonElement>(fixture.nativeElement, '[hellOmnibarChipRemove]');
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');
    input.focus();
    fixture.detectChanges();

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(root.getAttribute('data-open')).toBeNull();
    expect(host.value()).toBe('be');
    expect(clear.tabIndex).toBe(0);
    expect(chipRemove.tabIndex).toBe(0);
    expect(document.activeElement).toBe(input);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(host.value()).toBe('');
    expect(document.activeElement).toBe(input);
  });

  it('skips disabled items for keyboard and mouse activation', () => {
    const fixture = TestBed.createComponent(OmnibarDisabledItemHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');
    input.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();

    const options = Array.from(overlayRoot().querySelectorAll('[role="option"]')) as HTMLElement[];
    expect(options).toHaveLength(2);
    expect(options[0].getAttribute('disabled')).toBe('');
    expect(options[0].getAttribute('aria-disabled')).toBe('true');
    expect(options[0].getAttribute('data-disabled')).toBe('true');
    expect(options[0].getAttribute('aria-selected')).toBe('false');
    expect(options[1].getAttribute('aria-selected')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe(options[1].id);

    options[0].click();
    fixture.detectChanges();
    expect(host.selectEvents).toEqual([]);
    expect(host.submitEvents).toEqual([]);

    const enter = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(enter);
    fixture.detectChanges();

    expect(enter.defaultPrevented).toBe(true);
    expect(host.selectEvents).toEqual(['enabled']);
    expect(host.submitEvents).toEqual([{ value: '', item: 'enabled', source: 'keyboard' }]);
  });

  it('renders its panel through CDK overlay while preserving scoped CSS variables', async () => {
    const fixture = TestBed.createComponent(OmnibarHost);
    fixture.detectChanges();

    const root = query<HTMLElement>(fixture.nativeElement, 'hell-omnibar');
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');
    root.style.setProperty('--hell-omnibar-panel-max-height', '123px');

    input.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    await fixture.whenStable();

    const panel = query(overlayRoot(), '[data-slot="panel"]');
    expect(fixture.nativeElement.contains(panel)).toBe(false);
    expect(panel.classList).toContain('hell-omnibar-panel-surface');
    expect(panel.style.getPropertyValue('--hell-omnibar-panel-max-height')).toBe('123px');
  });

  it('treats the portaled CDK panel as inside while CDK owns outside overlay clicks', async () => {
    const fixture = TestBed.createComponent(OmnibarHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');
    input.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    await fixture.whenStable();

    const panel = query<HTMLElement>(overlayRoot(), '[data-slot="panel"]');
    panel.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    panel.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(host.openEvents).toEqual([true]);

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(host.openEvents).toEqual([true, false]);
    expect(
      fixture.nativeElement.querySelector('hell-omnibar').getAttribute('data-open'),
    ).toBeNull();
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

    expect(
      query<HTMLButtonElement>(fixture.nativeElement, '[data-slot="clear"]').getAttribute(
        'aria-label',
      ),
    ).toBe('Suche löschen');
  });
});

describe('HellOmnibar hotkey listener opt-in', () => {
  let fakeGlobalKeydown: FakeGlobalKeydownService;

  beforeEach(async () => {
    fakeGlobalKeydown = new FakeGlobalKeydownService();
    await TestBed.configureTestingModule({
      imports: [OmnibarHotkeyHost],
      providers: [{ provide: HellGlobalKeydownService, useValue: fakeGlobalKeydown }],
    }).compileComponents();
  });

  it('registers document listeners only while a hotkey is configured', async () => {
    const fixture = TestBed.createComponent(OmnibarHotkeyHost);
    const host = fixture.componentInstance;
    host.hotkey.set(null);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fakeGlobalKeydown.register).not.toHaveBeenCalled();

    host.hotkey.set('ctrl+k');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fakeGlobalKeydown.register).toHaveBeenCalledOnce();

    host.hotkey.set(null);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fakeGlobalKeydown.unregisters[0]).toHaveBeenCalledOnce();
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
      matchHotkey(
        new KeyboardEvent('keydown', { key: 'K', shiftKey: true, ctrlKey: true }),
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

  it('does not open when an app shortcut already prevented the event', () => {
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
    event.preventDefault();
    document.dispatchEvent(event);
    fixture.detectChanges();

    expect(root.getAttribute('data-open')).toBeNull();
    expect(document.activeElement).not.toBe(input);
    expect(host.openEvents).toEqual([]);
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

class FakeGlobalKeydownService {
  readonly unregisters: Array<ReturnType<typeof vi.fn>> = [];
  readonly register = vi.fn(() => {
    const unregister = vi.fn();
    this.unregisters.push(unregister);
    return unregister;
  });
}

function overlayRoot(): HTMLElement {
  return TestBed.inject(OverlayContainer).getContainerElement();
}

async function waitForElement<T extends HTMLElement>(
  fixture: { detectChanges(): void; whenStable(): Promise<unknown> },
  root: ParentNode,
  selector: string,
): Promise<T> {
  const timeout = Date.now() + 1000;
  while (Date.now() < timeout) {
    fixture.detectChanges();
    await fixture.whenStable();
    await Promise.resolve();
    fixture.detectChanges();

    const element = root.querySelector<T>(selector);
    if (element instanceof HTMLElement) return element as T;

    if (typeof requestAnimationFrame === 'function') {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    } else {
      await Promise.resolve();
    }
  }

  throw new Error(`Expected ${selector}.`);
}

function openOmnibarTabStops(hostRoot: HTMLElement, panelRoot: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]',
    'button',
    'input',
    'select',
    'textarea',
    '[tabindex]',
    '[contenteditable="true"]',
  ];
  const selector = selectors.join(', ');
  const hostSelector = selectors.map((part) => `hell-omnibar ${part}`).join(', ');

  return [
    ...hostRoot.querySelectorAll<HTMLElement>(hostSelector),
    ...panelRoot.querySelectorAll<HTMLElement>(selector),
  ].filter((element) => !element.hasAttribute('disabled') && element.tabIndex >= 0);
}

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element as T;
}
