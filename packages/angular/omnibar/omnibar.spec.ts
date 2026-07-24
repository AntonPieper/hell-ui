import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HellChip, HellChipRemove } from 'hell-ui/chip';
import { hellSearchResource, provideHellLabels, type HellUiInput } from 'hell-ui/core';
import { HellGlobalKeydownService } from 'hell-ui/internal/hotkeys';
import { HELL_MENU_IMPORTS } from 'hell-ui/menu';

import {
  HELL_OMNIBAR_IMPORTS,
  HELL_OMNIBAR_LABELS,
  type HellOmnibarPart,
  type HellOmnibarSubmitEvent,
  type HellOmnibarUi,
} from './omnibar';
import { sortClasses } from '../spec-helpers';

@Component({
  imports: [...HELL_OMNIBAR_IMPORTS, ...HELL_MENU_IMPORTS],
  template: `
    <hell-omnibar
      [query]="query()"
      [open]="open()"
      [openOnFocus]="openOnFocus()"
      (queryChange)="recordQuery($event)"
      (openChange)="recordOpen($event)"
      (submit)="submitEvents.push($event)"
    >
      <ng-template #filtersMenu>
        <div hellMenu>
          <button hellMenuItem data-testid="filters-menu-item" type="button">Filters</button>
        </div>
      </ng-template>
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
  readonly query = signal('');
  readonly open = signal(false);
  readonly openOnFocus = signal(true);
  readonly closeOnSelect = signal(true);
  readonly beta = { id: 'beta' };

  readonly queryEvents: string[] = [];
  readonly openEvents: boolean[] = [];
  readonly selectEvents: unknown[] = [];
  readonly submitEvents: HellOmnibarSubmitEvent[] = [];

  recordQuery(query: string): void {
    this.query.set(query);
    this.queryEvents.push(query);
  }

  recordOpen(open: boolean): void {
    this.open.set(open);
    this.openEvents.push(open);
  }
}

interface Command {
  readonly id: string;
  readonly label: string;
}

@Component({
  imports: [...HELL_OMNIBAR_IMPORTS],
  template: `
    <hell-omnibar
      [query]="query()"
      (queryChange)="query.set($event)"
      [open]="open()"
      (openChange)="open.set($event)"
    >
      @if (search.status() === 'loading') {
        <div data-contract="resource-loading" role="status">Searching commands</div>
      } @else if (search.status() === 'error') {
        <div data-contract="resource-error" role="alert">Search failed</div>
      } @else if (search.status() === 'success' && search.items().length === 0) {
        <div data-contract="resource-empty">No commands found</div>
      }
      @for (command of search.items(); track command.id) {
        <button hellOmnibarItem [value]="command">{{ command.label }}</button>
      }
    </hell-omnibar>
  `,
})
class OmnibarLocalResourceHost {
  readonly query = signal('');
  readonly open = signal(false);
  readonly commands: readonly Command[] = [
    { id: 'alpha', label: 'Alpha command' },
    { id: 'beta', label: 'Beta command' },
  ];
  readonly search = hellSearchResource({
    query: this.query,
    items: this.commands,
    fields: [{ name: 'label', weight: 1, get: (command) => command.label }],
  });
}

@Component({
  imports: [...HELL_OMNIBAR_IMPORTS],
  template: `
    <hell-omnibar [query]="query()" (queryChange)="query.set($event)">
      @if (search.status() === 'loading') {
        <div data-contract="resource-loading" role="status">Loading people</div>
      } @else if (search.status() === 'error') {
        <div data-contract="resource-error" role="alert">Could not load people</div>
      }
      @for (person of search.items(); track person.id) {
        <button hellOmnibarItem [value]="person">{{ person.label }}</button>
      }
    </hell-omnibar>
  `,
})
class OmnibarAsyncResourceHost {
  readonly query = signal('');
  readonly search = hellSearchResource<Command>({
    query: this.query,
    debounce: 0,
    source: ({ query }) => {
      if (query === 'pending') return new Promise(() => undefined);
      if (query === 'failure') return Promise.reject(new Error('Search failed'));
      return [{ id: 'alpha', label: 'Alpha person' }];
    },
  });
}

@Component({
  imports: [...HELL_OMNIBAR_IMPORTS, HellChip, HellChipRemove],
  template: `
    <hell-omnibar
      [query]="query()"
      (queryChange)="query.set($event)"
      ui="flex-nowrap gap-0"
    >
      @if (tokens().length) {
        <span hellOmnibarLeading hellChip label="People" (remove)="tokens.set([])">
          People<button hellChipRemove></button>
        </span>
      }
      <button hellOmnibarItem value="alpha">Alpha</button>
    </hell-omnibar>
  `,
})
class OmnibarChipCompositionHost {
  readonly query = signal('');
  readonly tokens = signal(['people']);
}

@Component({
  imports: [...HELL_OMNIBAR_IMPORTS],
  template: `
    <hell-omnibar [openOnFocus]="true" [ui]="ui()">
      <div hellOmnibarActions aria-label="Filters" [ui]="actionsStripUi">
        <button hellOmnibarAction type="button" [pressed]="true" [ui]="actionUi">Filters</button>
      </div>
      <div hellOmnibarGroup label="Results" [ui]="groupUi">
        <div hellOmnibarGroupLabel [ui]="groupLabelUi">Results</div>
        <button hellOmnibarItem value="alpha" [ui]="itemUi">
          <span class="inline-flex w-4 shrink-0 items-center justify-center" aria-hidden="true">A</span>
          <span class="flex min-w-0 flex-1 flex-col overflow-hidden">
            <span>Alpha</span>
            <span class="text-[11px] text-hell-foreground-muted">Project</span>
          </span>
          <span data-testid="item-trailing" class="ms-auto inline-flex items-center">Enter</span>
        </button>
      </div>
    </hell-omnibar>
  `,
})
class OmnibarPartStyleHost {
  readonly objectUi = {
    root: 'max-w-[500px] rounded-none',
    control: 'border-hell-danger',
    inputWrap: 'basis-[12rem]',
    input: 'text-hell-danger',
    clear: 'text-hell-danger',
    panel: 'rounded-none border-hell-danger',
    actions: 'bg-hell-surface',
    results: 'gap-hell-2',
  } satisfies HellOmnibarUi;
  readonly ui = signal<HellUiInput<HellOmnibarPart>>('max-w-[420px]');
  readonly actionsStripUi = { root: 'gap-hell-3' };
  readonly actionUi = { root: 'text-hell-danger' };
  readonly groupUi = { root: 'gap-hell-2' };
  readonly groupLabelUi = { root: 'text-hell-danger' };
  readonly itemUi = { root: 'rounded-none' };
}

@Component({
  imports: [...HELL_OMNIBAR_IMPORTS],
  template: `
    <hell-omnibar [openOnFocus]="true">
      <div hellOmnibarGroup label="Stale fallback" data-testid="labelled-group">
        <div hellOmnibarGroupLabel>Results</div>
        <button hellOmnibarItem value="alpha">Alpha</button>
      </div>
      <div hellOmnibarGroup label="Recent" data-testid="fallback-group">
        <button hellOmnibarItem value="beta">Beta</button>
      </div>
    </hell-omnibar>
  `,
})
class OmnibarGroupNamingHost {}

@Component({
  imports: [...HELL_OMNIBAR_IMPORTS],
  providers: [provideHellLabels(HELL_OMNIBAR_LABELS, { clearSearch: 'Suche löschen' })],
  template: `<hell-omnibar />`,
})
class OmnibarLocalizedHost {}

@Component({
  imports: [...HELL_OMNIBAR_IMPORTS],
  template: `
    <hell-omnibar
      [hotkey]="hotkey()"
      [openOnFocus]="false"
      [disabled]="disabled()"
      [open]="open()"
      (openChange)="recordOpen($event)"
    />
  `,
})
class OmnibarHotkeyHost {
  readonly hotkey = signal<string | null>('ctrl+k');
  readonly disabled = signal(false);
  readonly open = signal(false);
  readonly openEvents: boolean[] = [];

  recordOpen(open: boolean): void {
    this.open.set(open);
    this.openEvents.push(open);
  }
}

@Component({
  imports: [...HELL_OMNIBAR_IMPORTS],
  template: `
    <input data-slot="outside-input" />
    <hell-omnibar hotkey="/" [openOnFocus]="false" />
  `,
})
class OmnibarOutsideEditableHost {}

describe('HellOmnibar command interaction runtime', () => {
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
      imports: [
        OmnibarHost,
        OmnibarLocalResourceHost,
        OmnibarAsyncResourceHost,
        OmnibarChipCompositionHost,
        OmnibarPartStyleHost,
        OmnibarGroupNamingHost,
      ],
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

  it('controls query and open state without the obsolete value model', async () => {
    const fixture = TestBed.createComponent(OmnibarHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const root = query<HTMLElement>(fixture.nativeElement, 'hell-omnibar');
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');
    input.focus();
    fixture.detectChanges();

    expect(root.getAttribute('data-open')).toBe('true');
    expect(host.open()).toBe(true);
    expect(host.openEvents).toEqual([true]);

    input.value = 'alp';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(host.query()).toBe('alp');
    expect(host.queryEvents).toEqual(['alp']);

    host.open.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(root.getAttribute('data-open')).toBeNull();
  });

  it('renders local Search Resource results and consumer-owned empty chrome', async () => {
    const fixture = TestBed.createComponent(OmnibarLocalResourceHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');
    input.focus();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(overlayRoot().querySelectorAll('[hellOmnibarItem]')).toHaveLength(2);

    input.value = 'missing';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await settleSearchResource();
    fixture.detectChanges();

    expect(host.search.status()).toBe('success');
    expect(host.search.items()).toEqual([]);
    expect(query(overlayRoot(), '[data-contract="resource-empty"]').textContent).toContain(
      'No commands found',
    );
  });

  it('projects asynchronous Search Resource loading and error status', async () => {
    const fixture = TestBed.createComponent(OmnibarAsyncResourceHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');
    input.focus();
    input.value = 'pending';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(query(overlayRoot(), '[data-contract="resource-loading"]').getAttribute('role')).toBe(
      'status',
    );

    input.value = 'failure';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(query(overlayRoot(), '[data-contract="resource-error"]').getAttribute('role')).toBe(
      'alert',
    );
  });

  it('composes public Chip Set/Input focus and removal behavior', async () => {
    const fixture = TestBed.createComponent(OmnibarChipCompositionHost);
    fixture.detectChanges();

    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');
    const chip = query<HTMLElement>(fixture.nativeElement, '[hellChip]');

    input.focus();
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(document.activeElement).toBe(chip);

    chip.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.componentInstance.tokens()).toEqual([]);
    expect(document.activeElement).toBe(input);
  });

  it('navigates, scroll-anchors, activates, and preserves focus on the input', () => {
    const fixture = TestBed.createComponent(OmnibarHost);
    const host = fixture.componentInstance;
    host.query.set('be');
    host.closeOnSelect.set(false);
    fixture.detectChanges();

    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');
    input.focus();
    fixture.detectChanges();
    const options = Array.from(overlayRoot().querySelectorAll<HTMLElement>('[role="option"]'));

    expect(input.getAttribute('aria-activedescendant')).toBe(options[0]?.id);
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(options[1]?.getAttribute('aria-selected')).toBe('true');
    expect(options[1]?.scrollIntoView).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(input);

    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(host.selectEvents).toEqual([host.beta]);
    expect(host.selectEvents[0]).toBe(host.beta);
    expect(host.submitEvents).toEqual([
      { query: 'be', item: host.beta, source: 'keyboard' },
    ]);
    expect(host.submitEvents[0]?.item).toBe(host.beta);
    expect(host.open()).toBe(true);
  });

  it('hands focus to actions with F6 and returns it on F6 or Escape', () => {
    const fixture = TestBed.createComponent(OmnibarHost);
    fixture.detectChanges();

    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');
    input.focus();
    fixture.detectChanges();
    const action = query<HTMLButtonElement>(overlayRoot(), '[hellOmnibarAction]');

    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'F6', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(document.activeElement).toBe(action);
    expect(action.tabIndex).toBe(-1);

    action.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'F6', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(document.activeElement).toBe(input);

    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'F6', bubbles: true, cancelable: true }),
    );
    action.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(document.activeElement).toBe(input);
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('owns the Escape close, clear, and blur sequence without reopening', () => {
    const fixture = TestBed.createComponent(OmnibarHost);
    const host = fixture.componentInstance;
    host.query.set('be');
    host.open.set(true);
    fixture.detectChanges();

    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');
    input.focus();
    const close = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(close);
    fixture.detectChanges();

    expect(close.defaultPrevented).toBe(true);
    expect(host.open()).toBe(false);
    expect(host.query()).toBe('be');
    expect(document.activeElement).toBe(input);

    const clear = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(clear);
    fixture.detectChanges();

    expect(clear.defaultPrevented).toBe(true);
    expect(host.open()).toBe(false);
    expect(host.query()).toBe('');
    expect(document.activeElement).toBe(input);

    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).not.toBe(input);
  });

  it('keeps registered nested floating focus inside before true outside focus dismisses', async () => {
    const fixture = TestBed.createComponent(OmnibarHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');
    input.focus();
    fixture.detectChanges();
    const action = query<HTMLButtonElement>(overlayRoot(), '[hellOmnibarAction]');
    action.click();

    const menuItem = await waitForElement<HTMLButtonElement>(
      fixture,
      document.body,
      '[data-testid="filters-menu-item"]',
    );
    menuItem.focus();
    await Promise.resolve();
    fixture.detectChanges();

    expect(host.open()).toBe(true);
    expect(document.activeElement).toBe(menuItem);

    const outside = query<HTMLButtonElement>(fixture.nativeElement, '[data-testid="outside-focus"]');
    outside.focus();
    outside.dispatchEvent(
      new FocusEvent('focusin', { bubbles: true, relatedTarget: menuItem }),
    );
    fixture.detectChanges();

    expect(host.open()).toBe(false);
  });

  describe('recipes', () => {
    // Part-Class Pipeline merge semantics are owned centrally by
    // `internal/core/part-class-pipeline.spec.ts`; the snapshots pin the default part
    // classes — including the chip-composed host, whose omnibar recipe must
    // keep the control on one row (no wrap, no gap) — without asserting
    // individual utilities elsewhere.
    it('keeps the default part classes stable', async () => {
      const fixture = TestBed.createComponent(OmnibarHost);
      fixture.detectChanges();
      const root = query<HTMLElement>(fixture.nativeElement, 'hell-omnibar');

      query<HTMLInputElement>(root, 'input').focus();
      fixture.detectChanges();
      await fixture.whenStable();

      const chipFixture = TestBed.createComponent(OmnibarChipCompositionHost);
      chipFixture.detectChanges();

      const panel = query<HTMLElement>(overlayRoot(), '[data-slot="panel"]');

      expect({
        root: sortClasses(root.className),
        control: sortClasses(query<HTMLElement>(root, '[data-slot="control"]').className),
        panel: sortClasses(panel.className),
        action: sortClasses(query<HTMLElement>(panel, '[hellOmnibarAction]').className),
        item: sortClasses(query<HTMLElement>(panel, '[hellOmnibarItem]').className),
        chipComposedRoot: sortClasses(
          query<HTMLElement>(chipFixture.nativeElement, 'hell-omnibar').className,
        ),
      }).toMatchSnapshot('omnibar');
    });
  });

  it('applies Part Style Maps to the root, portaled panel, and projected directives', async () => {
    const fixture = TestBed.createComponent(OmnibarPartStyleHost);
    fixture.detectChanges();
    const root = query<HTMLElement>(fixture.nativeElement, 'hell-omnibar');
    fixture.componentInstance.ui.set(fixture.componentInstance.objectUi);
    fixture.detectChanges();

    // The consumer ui classes are the test's own contract fixtures; recipe
    // conflict resolution is owned centrally by the Part-Class Pipeline spec.
    expect(root.className).toContain('max-w-[500px]');
    expect(query<HTMLElement>(root, '[data-slot="control"]').className).toContain(
      'border-hell-danger',
    );

    query<HTMLInputElement>(root, 'input').focus();
    fixture.detectChanges();
    await fixture.whenStable();

    const panel = query<HTMLElement>(overlayRoot(), '[data-slot="panel"]');
    expect(panel.className).toContain('border-hell-danger');
    expect(query<HTMLElement>(panel, '[hellOmnibarAction]').className).toContain(
      'text-hell-danger',
    );
    expect(query<HTMLElement>(panel, '[hellOmnibarItem]').className).toContain('rounded-none');
    expect(query<HTMLElement>(panel, '[data-testid="item-trailing"]').className).toContain(
      'ms-auto',
    );
  });

  it('names a group from its visible label through aria-labelledby', async () => {
    const fixture = TestBed.createComponent(OmnibarGroupNamingHost);
    fixture.detectChanges();

    query<HTMLInputElement>(fixture.nativeElement, 'input').focus();
    fixture.detectChanges();
    await fixture.whenStable();

    const group = query<HTMLElement>(overlayRoot(), '[data-testid="labelled-group"]');
    const visibleLabel = query<HTMLElement>(group, '[hellOmnibarGroupLabel]');
    expect(visibleLabel.id).not.toBe('');
    expect(visibleLabel.getAttribute('role')).toBeNull();
    expect(group.getAttribute('aria-labelledby')).toBe(visibleLabel.id);
    expect(group.getAttribute('aria-label')).toBeNull();
  });

  it('falls back to the label input for a group without a visible label', async () => {
    const fixture = TestBed.createComponent(OmnibarGroupNamingHost);
    fixture.detectChanges();

    query<HTMLInputElement>(fixture.nativeElement, 'input').focus();
    fixture.detectChanges();
    await fixture.whenStable();

    const group = query<HTMLElement>(overlayRoot(), '[data-testid="fallback-group"]');
    expect(group.getAttribute('aria-labelledby')).toBeNull();
    expect(group.getAttribute('aria-label')).toBe('Recent');
  });
});

describe('HellOmnibar labels', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [OmnibarLocalizedHost] }).compileComponents();
  });

  it('uses an overridable clear-search label', () => {
    const fixture = TestBed.createComponent(OmnibarLocalizedHost);
    fixture.detectChanges();
    expect(query(fixture.nativeElement, '[data-slot="clear"]').getAttribute('aria-label')).toBe(
      'Suche löschen',
    );
  });
});

describe('HellOmnibar hotkey contract', () => {
  it('registers only while configured', async () => {
    const fakeGlobalKeydown = new FakeGlobalKeydownService();
    await TestBed.configureTestingModule({
      imports: [OmnibarHotkeyHost],
      providers: [{ provide: HellGlobalKeydownService, useValue: fakeGlobalKeydown }],
    }).compileComponents();
    const fixture = TestBed.createComponent(OmnibarHotkeyHost);
    fixture.componentInstance.hotkey.set(null);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fakeGlobalKeydown.register).not.toHaveBeenCalled();

    fixture.componentInstance.hotkey.set('ctrl+k');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fakeGlobalKeydown.register).toHaveBeenCalledOnce();

    fixture.componentInstance.hotkey.set(null);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fakeGlobalKeydown.unregisters[0]).toHaveBeenCalledOnce();
  });

  it('focuses and opens on a matching hotkey unless disabled', async () => {
    await TestBed.configureTestingModule({ imports: [OmnibarHotkeyHost] }).compileComponents();
    const fixture = TestBed.createComponent(OmnibarHotkeyHost);
    fixture.detectChanges();
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');

    dispatchDocumentKey({ key: 'k', ctrlKey: true });
    fixture.detectChanges();
    expect(document.activeElement).toBe(input);
    expect(fixture.componentInstance.open()).toBe(true);

    fixture.componentInstance.open.set(false);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    dispatchDocumentKey({ key: 'k', ctrlKey: true });
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('protects an outside editable target from a bare slash hotkey', async () => {
    await TestBed.configureTestingModule({ imports: [OmnibarOutsideEditableHost] }).compileComponents();
    const fixture = TestBed.createComponent(OmnibarOutsideEditableHost);
    fixture.detectChanges();
    const editable = query<HTMLInputElement>(fixture.nativeElement, '[data-slot="outside-input"]');
    editable.focus();
    const event = new KeyboardEvent('keydown', { key: '/', bubbles: true, cancelable: true });
    Object.defineProperty(event, 'view', { value: document.defaultView });
    editable.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(editable);
    expect(query(fixture.nativeElement, 'hell-omnibar').getAttribute('data-open')).toBeNull();
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

function dispatchDocumentKey(init: KeyboardEventInit): void {
  const event = new KeyboardEvent('keydown', { ...init, bubbles: true, cancelable: true });
  Object.defineProperty(event, 'view', { value: document.defaultView });
  document.dispatchEvent(event);
}

async function settleSearchResource(): Promise<void> {
  TestBed.tick();
  for (let index = 0; index < 6; index += 1) await Promise.resolve();
  TestBed.tick();
}

function overlayRoot(): HTMLElement {
  return TestBed.inject(OverlayContainer).getContainerElement();
}

async function waitForElement<T extends HTMLElement>(
  fixture: { detectChanges(): void },
  root: ParentNode,
  selector: string,
): Promise<T> {
  const timeout = Date.now() + 10_000;
  while (Date.now() < timeout) {
    fixture.detectChanges();
    const element = root.querySelector<T>(selector);
    if (element instanceof HTMLElement) return element as T;

    if (typeof requestAnimationFrame === 'function') {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    } else {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    fixture.detectChanges();
  }
  throw new Error(`Expected ${selector}.`);
}

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element as T;
}
