import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  HELL_DEFAULT_DATE_INPUT_ADAPTER,
  provideHellDateInputAdapter,
} from '@hell-ui/angular/date-input';

import {
  HELL_FILTER_TEXT_KEY,
  HellFilterBar,
  type HellFilterEntityOption,
  type HellFilterField,
  type HellFilterEntitySearchError,
  type HellFilterToken,
} from './filter-bar';

const FIELDS: readonly HellFilterField[] = [
  { key: 'name', label: 'Name', kind: 'text' },
  {
    key: 'status',
    label: 'Status',
    kind: 'options',
    options: [
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
    ],
  },
  {
    key: 'tag',
    label: 'Tag',
    kind: 'options',
    multiple: true,
    options: [
      { value: 'blocked', label: 'Blocked', disabled: true },
      { value: 'urgent', label: 'Urgent' },
      { value: 'review', label: 'Needs review' },
      { value: 'approved', label: 'Approved' },
      { value: '', label: 'Any tag' },
    ],
  },
];

@Component({
  imports: [HellFilterBar],
  template: `
    <div tabindex="-1" (keydown.escape)="escapes += 1">
      <hell-filter-bar
        aria-label="People filters"
        [fields]="fields"
        [value]="value()"
        [ui]="ui"
        [freeTextDebounceMs]="debounceMs()"
        (valueChange)="onValueChange($event)"
      />
    </div>
    <button type="button" data-test-outside>Outside</button>
  `,
})
class HostComponent {
  readonly fields = FIELDS;
  readonly value = signal<readonly HellFilterToken[]>([
    { key: 'status', operator: 'eq', value: 'open' },
  ]);
  readonly debounceMs = signal<number | null>(null);
  readonly ui = {
    root: 'filter-root-refinement gap-hell-8',
    input: 'filter-input-refinement text-lg',
  } as const;
  readonly changes: (readonly HellFilterToken[])[] = [];
  escapes = 0;

  onValueChange(next: readonly HellFilterToken[]): void {
    this.changes.push(next);
    this.value.set(next);
  }
}

@Component({
  imports: [HellFilterBar],
  template: `<hell-filter-bar disabled freeTextDebounceMs="25" [fields]="fields" />`,
})
class StaticInputHost {
  readonly fields = FIELDS;
}

interface EntitySearchCall {
  readonly query: string;
  readonly signal: AbortSignal | undefined;
  readonly resolve: (items: readonly HellFilterEntityOption[]) => void;
  readonly reject: (error: unknown) => void;
}

@Component({
  imports: [HellFilterBar],
  template: `
    <hell-filter-bar
      aria-label="Advanced filters"
      [fields]="fields"
      [value]="value()"
      entityDebounceMs="0"
      (valueChange)="value.set($event)"
      (searchError)="errors.push($event)"
    />
  `,
})
class AdvancedHostComponent {
  readonly value = signal<readonly HellFilterToken[]>([]);
  readonly calls: EntitySearchCall[] = [];
  readonly errors: HellFilterEntitySearchError[] = [];
  readonly fields: readonly HellFilterField[] = [
    {
      key: 'owner',
      label: 'Owner',
      kind: 'entity',
      debounceMs: 0,
      search: ({ query, signal }) => new Promise<readonly HellFilterEntityOption[]>(
        (resolve, reject) => this.calls.push({ query, signal, resolve, reject }),
      ),
    },
    {
      key: 'created',
      label: 'Created',
      kind: 'dateRange',
      min: '2026-07-01',
      max: '2026-07-31',
    },
  ];
}

@Component({
  imports: [HellFilterBar],
  providers: [
    provideHellDateInputAdapter({
      parseText: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return { valid: true, value: null };
        const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed);
        if (!match) return { valid: false };
        const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
        return date.getFullYear() === Number(match[3]) &&
          date.getMonth() === Number(match[2]) - 1 &&
          date.getDate() === Number(match[1])
          ? { valid: true, value: date }
          : { valid: false };
      },
      format: (date) => date
        ? `${date.getDate().toString().padStart(2, '0')}.` +
          `${(date.getMonth() + 1).toString().padStart(2, '0')}.` +
          date.getFullYear().toString()
        : '',
      coerce: (date) => date && date.getDate() >= 3 ? date : null,
      isWithinBounds: HELL_DEFAULT_DATE_INPUT_ADAPTER.isWithinBounds,
    }),
  ],
  template: `
    <hell-filter-bar
      aria-label="Localized filters"
      [fields]="fields"
      [value]="value()"
      (valueChange)="value.set($event)"
    />
  `,
})
class LocalizedDateHostComponent {
  readonly value = signal<readonly HellFilterToken[]>([]);
  readonly fields: readonly HellFilterField[] = [
    {
      key: 'created',
      label: 'Created',
      kind: 'dateRange',
      min: '2026-07-01',
      max: '2026-07-31',
    },
  ];
}

const nativeGetAnimations = HTMLElement.prototype.getAnimations;

beforeAll(() => {
  if (!nativeGetAnimations) {
    Object.defineProperty(HTMLElement.prototype, 'getAnimations', {
      configurable: true,
      value: () => [],
    });
  }
});

afterAll(() => {
  if (!nativeGetAnimations) delete (HTMLElement.prototype as Partial<HTMLElement>).getAnimations;
});

describe('HellFilterBar', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HostComponent,
        StaticInputHost,
        AdvancedHostComponent,
        LocalizedDateHostComponent,
      ],
    })
      .compileComponents();
  });

  afterEach(() => {
    for (const element of document.body.querySelectorAll('[hellPopover]')) element.remove();
  });

  it('round-trips controlled tokens without emitting on first render', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await settle(fixture);

    expect(fixture.componentInstance.changes).toEqual([]);
    expect(queryAll(fixture.nativeElement, '[data-slot="token"]')).toHaveLength(1);
    expect(query<HTMLElement>(fixture.nativeElement, '[data-slot="tokenLabel"]').textContent?.trim())
      .toBe('Status: Open');
    expect(query<HTMLInputElement>(fixture.nativeElement, 'input').getAttribute('aria-label'))
      .toBe('People filters');
    expect(query<HTMLElement>(fixture.nativeElement, 'hell-filter-bar').classList)
      .toContain('filter-root-refinement');
    const root = query<HTMLElement>(fixture.nativeElement, 'hell-filter-bar');
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');
    expect(root.classList).toContain('gap-hell-8');
    expect(root.classList).not.toContain('gap-hell-2');
    expect(input.classList).toContain('filter-input-refinement');
    expect(input.classList).toContain('text-lg');
    expect(input.classList).not.toContain('text-[13px]');
  });

  it('opens the highlighted field instead of silently committing its name as free text', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await settle(fixture);
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');

    key(input, 't');
    inputValue(input, 'tag');
    await settle(fixture);
    expect((await waitForActiveOption(fixture, input)).textContent?.trim()).toBe('Tag');

    key(input, 'Tab');
    await settle(fixture);
    expect(fixture.componentInstance.changes).toEqual([]);
    expect(query<HTMLElement>(fixture.nativeElement, '[data-slot="editor"]')
      .getAttribute('data-field')).toBe('tag');

    const editorInput = query<HTMLInputElement>(fixture.nativeElement, '[data-hell-filter-editor-input]');
    key(editorInput, 'u');
    inputValue(editorInput, 'urg');
    await waitForActiveOption(fixture, editorInput);
    key(editorInput, ' ');
    await settle(fixture);

    expect(fixture.componentInstance.value()).toEqual([
      { key: 'status', operator: 'eq', value: 'open' },
      { key: 'tag', operator: 'eq', value: 'urgent' },
    ]);
    // A multi-use options field keeps the same editor open for a successive token.
    expect(query<HTMLElement>(fixture.nativeElement, '[data-slot="editor"]')).toBeTruthy();

    key(editorInput, 'r');
    inputValue(editorInput, 'rev');
    expect((await waitForActiveOption(fixture, editorInput)).textContent?.trim())
      .toBe('Needs review');
    key(editorInput, 'Enter');
    await settle(fixture);
    expect(fixture.componentInstance.value()).toEqual([
      { key: 'status', operator: 'eq', value: 'open' },
      { key: 'tag', operator: 'eq', value: 'urgent' },
      { key: 'tag', operator: 'eq', value: 'review' },
    ]);
  });

  it('commits the visible free-text row as a first-class token', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await settle(fixture);
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');

    key(input, 'u');
    inputValue(input, 'urgent incident');
    await settle(fixture);
    expect((await waitForActiveOption(fixture, input)).textContent?.trim()).toContain('urgent incident');
    key(input, 'Enter');
    await settle(fixture);

    expect(fixture.componentInstance.value().at(-1)).toEqual({
      key: HELL_FILTER_TEXT_KEY,
      operator: 'eq',
      value: 'urgent incident',
    });
  });

  it('optionally emits debounced live free text through the whole controlled value', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.value.set([]);
    fixture.componentInstance.debounceMs.set(0);
    await settle(fixture);
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');

    inputValue(input, 'live query');
    await nextTask();
    await settle(fixture);
    expect(fixture.componentInstance.value()).toEqual([
      { key: HELL_FILTER_TEXT_KEY, operator: 'eq', value: 'live query' },
    ]);

    inputValue(input, '');
    await nextTask();
    await settle(fixture);
    expect(fixture.componentInstance.value()).toEqual([]);
  });

  it('removes the last token on Backspace-on-empty and exposes clear all', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.value.set([
      { key: 'status', operator: 'eq', value: 'open' },
      { key: HELL_FILTER_TEXT_KEY, operator: 'eq', value: 'urgent' },
    ]);
    await settle(fixture);
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input');

    key(input, 'Backspace');
    await settle(fixture);
    expect(fixture.componentInstance.value()).toEqual([
      { key: 'status', operator: 'eq', value: 'open' },
    ]);

    query<HTMLButtonElement>(fixture.nativeElement, '[data-slot="clear"]').click();
    await settle(fixture);
    expect(fixture.componentInstance.value()).toEqual([]);
  });

  it('uses the shared editor for edit-in-place and discards one Escape layer', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await settle(fixture);
    const edit = query<HTMLButtonElement>(fixture.nativeElement, '[data-hell-filter-token-edit]');

    edit.click();
    await waitFor(fixture, document.body, '[hellPopover] [data-slot="editor"]');
    const editor = query<HTMLElement>(document.body, '[hellPopover] [data-slot="editor"]');
    expect(editor.getAttribute('data-mode')).toBe('edit');
    const editorInput = query<HTMLInputElement>(editor, '[data-hell-filter-editor-input]');
    inputValue(editorInput, 'closed');
    key(editorInput, 'Escape');
    await waitForMissing(fixture, document.body, '[hellPopover]');

    expect(fixture.componentInstance.changes).toEqual([]);
    expect(document.body.querySelector('[hellPopover]')).toBeNull();
    expect(fixture.componentInstance.value()[0].value).toBe('open');
  });

  it('dismisses the whole text editor when Escape starts from its Apply button', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.value.set([
      { key: 'name', operator: 'eq', value: 'Grace' },
    ]);
    await settle(fixture);

    query<HTMLButtonElement>(fixture.nativeElement, '[data-hell-filter-token-edit]').click();
    const editor = await waitFor<HTMLElement>(
      fixture,
      document.body,
      '[hellPopover] [data-slot="editor"][data-field="name"]',
    );
    const apply = query<HTMLButtonElement>(editor, 'button');
    apply.focus();
    key(apply, 'Escape');
    await waitForMissing(fixture, document.body, '[hellPopover]');

    expect(fixture.componentInstance.value()).toEqual([
      { key: 'name', operator: 'eq', value: 'Grace' },
    ]);
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('skips disabled options when the delegated options editor opens', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await settle(fixture);
    const picker = query<HTMLInputElement>(fixture.nativeElement, 'input');

    key(picker, 't');
    inputValue(picker, 'tag');
    await waitForActiveOption(fixture, picker);
    key(picker, 'Enter');
    await settle(fixture);

    const editorInput = query<HTMLInputElement>(fixture.nativeElement, '[data-hell-filter-editor-input]');
    key(editorInput, 'ArrowDown');
    const active = await waitForActiveOption(fixture, editorInput);
    expect(active.textContent?.trim()).toBe('Urgent');
    expect(query<HTMLElement>(document.body, '[role="option"][aria-disabled="true"]')
      .textContent?.trim()).toBe('Blocked');
  });

  it('preserves edit identity across controlled reorder and restores focus to the edited token', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.value.set([
      { key: 'tag', operator: 'eq', value: 'urgent' },
      { key: 'status', operator: 'eq', value: 'open' },
      { key: 'tag', operator: 'eq', value: 'review' },
    ]);
    await settle(fixture);

    queryAll<HTMLButtonElement>(fixture.nativeElement, '[data-hell-filter-token-edit]')[0]!.click();
    await waitFor(fixture, document.body, '[hellPopover] [data-slot="editor"]');
    fixture.componentInstance.value.set([
      { key: 'status', operator: 'eq', value: 'open' },
      { key: 'tag', operator: 'eq', value: 'review' },
      { key: 'tag', operator: 'eq', value: 'urgent' },
    ]);
    await settle(fixture);

    const editorInput = query<HTMLInputElement>(document.body, '[data-hell-filter-editor-input]');
    key(editorInput, 'a');
    inputValue(editorInput, 'appro');
    await waitForActiveOption(fixture, editorInput);
    key(editorInput, 'Enter');
    await waitForMissing(fixture, document.body, '[hellPopover]');

    expect(fixture.componentInstance.value()).toEqual([
      { key: 'status', operator: 'eq', value: 'open' },
      { key: 'tag', operator: 'eq', value: 'review' },
      { key: 'tag', operator: 'eq', value: 'approved' },
    ]);
    const edited = queryAll<HTMLElement>(fixture.nativeElement, '[data-slot="token"]')[2];
    expect(document.activeElement).toBe(edited);
  });

  it('moves between the picker and token zone and lets no-layer Escape bubble', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.value.set([
      { key: 'status', operator: 'eq', value: 'open' },
      { key: HELL_FILTER_TEXT_KEY, operator: 'eq', value: 'incident' },
    ]);
    await settle(fixture);
    const picker = query<HTMLInputElement>(fixture.nativeElement, 'input');
    const tokens = queryAll<HTMLElement>(fixture.nativeElement, '[data-slot="token"]');

    picker.focus();
    key(picker, 'ArrowLeft');
    await settle(fixture);
    expect(document.activeElement).toBe(tokens[1]);

    key(tokens[1]!, 'ArrowRight');
    await settle(fixture);
    expect(document.activeElement).toBe(picker);

    tokens[0]!.focus();
    key(tokens[0]!, 'x');
    await settle(fixture);
    expect(document.activeElement).toBe(picker);
    expect(picker.value).toBe('x');

    inputValue(picker, '');
    key(picker, 'Escape');
    await settle(fixture);
    expect(fixture.componentInstance.escapes).toBe(1);
  });

  it('uses separate Escape presses for the delegated picker layer and input text', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await settle(fixture);
    const picker = query<HTMLInputElement>(fixture.nativeElement, 'input');

    inputValue(picker, 'sta');
    await waitForActiveOption(fixture, picker);
    expect(picker.getAttribute('aria-expanded')).toBe('true');

    key(picker, 'Escape');
    await waitForAttribute(fixture, picker, 'aria-expanded', 'false');
    expect(picker.value).toBe('sta');

    key(picker, 'Escape');
    await settle(fixture);
    expect(picker.value).toBe('');
  });

  it('completes an options colon accelerator without another input event', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.value.set([]);
    await settle(fixture);
    const picker = query<HTMLInputElement>(fixture.nativeElement, 'input');

    inputValue(picker, 'status:clo');
    const editor = await waitFor<HTMLElement>(
      fixture,
      fixture.nativeElement,
      '[data-slot="editor"][data-field="status"]',
    );
    const editorInput = query<HTMLInputElement>(editor, '[data-hell-filter-editor-input]');
    expect((await waitForActiveOption(fixture, editorInput)).textContent?.trim()).toBe('Closed');
    key(editorInput, 'Enter');
    await settle(fixture);

    expect(fixture.componentInstance.value()).toEqual([
      { key: 'status', operator: 'eq', value: 'closed' },
    ]);
  });

  it('dismisses create editors when focus moves outside before commit', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.value.set([]);
    await settle(fixture);
    const outside = query<HTMLButtonElement>(fixture.nativeElement, '[data-test-outside]');
    let picker = query<HTMLInputElement>(fixture.nativeElement, 'input');

    inputValue(picker, 'name:draft');
    await waitFor(fixture, fixture.nativeElement, '[data-slot="editor"][data-field="name"]');
    outside.focus();
    await waitForMissing(fixture, fixture.nativeElement, '[data-slot="editor"]');

    picker = query<HTMLInputElement>(fixture.nativeElement, 'input');
    inputValue(picker, 'status:');
    await waitFor(fixture, fixture.nativeElement, '[data-slot="editor"][data-field="status"]');
    outside.focus();
    await waitForMissing(fixture, fixture.nativeElement, '[data-slot="editor"]');
  });

  it('commits an explicitly declared empty-string option', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.value.set([]);
    await settle(fixture);
    const picker = query<HTMLInputElement>(fixture.nativeElement, 'input');

    inputValue(picker, 'tag');
    await waitForActiveOption(fixture, picker);
    key(picker, 'Enter');
    await settle(fixture);
    const editorInput = query<HTMLInputElement>(fixture.nativeElement, '[data-hell-filter-editor-input]');
    inputValue(editorInput, 'Any');
    expect((await waitForActiveOption(fixture, editorInput)).textContent?.trim()).toBe('Any tag');
    key(editorInput, 'Enter');
    await settle(fixture);

    expect(fixture.componentInstance.value()).toEqual([
      { key: 'tag', operator: 'eq', value: '' },
    ]);
    expect(query<HTMLElement>(fixture.nativeElement, '[data-slot="tokenLabel"]')
      .textContent?.trim()).toBe('Tag: Any tag');
  });

  it('searches and commits a selected entity as a stable serializable value', async () => {
    const fixture = TestBed.createComponent(AdvancedHostComponent);
    await settle(fixture);
    const picker = query<HTMLInputElement>(fixture.nativeElement, 'input');

    inputValue(picker, 'owner:ad');
    await nextTask();
    await settle(fixture);

    expect(fixture.componentInstance.calls).toHaveLength(1);
    expect(fixture.componentInstance.calls[0]?.query).toBe('ad');
    const entityInput = query<HTMLInputElement>(
      fixture.nativeElement,
      '[data-field="owner"] [data-hell-filter-editor-input]',
    );
    expect(entityInput.getAttribute('aria-busy')).toBe('true');
    const loading = await waitFor<HTMLElement>(
      fixture,
      document.body,
      '[data-slot="status"][data-state="loading"]',
    );
    expect(loading.textContent?.trim()).toBe('Loading Owner');

    fixture.componentInstance.calls[0]!.resolve([
      { id: 'person-1', label: 'Ada Lovelace' },
      { id: 'person-2', label: 'Grace Hopper', disabled: true },
    ]);
    const active = await waitForActiveOption(fixture, entityInput);
    expect(active.textContent?.trim()).toBe('Ada Lovelace');
    expect(entityInput.getAttribute('aria-busy')).toBeNull();

    key(entityInput, 'Enter');
    await nextTask();
    await settle(fixture);

    expect(fixture.componentInstance.value()).toEqual([
      {
        key: 'owner',
        operator: 'eq',
        value: { kind: 'entity', id: 'person-1', label: 'Ada Lovelace' },
      },
    ]);
    expect(query<HTMLElement>(fixture.nativeElement, '[data-slot="tokenLabel"]')
      .textContent?.trim()).toBe('Owner: Ada Lovelace');
    expect(document.activeElement).toBe(query<HTMLInputElement>(fixture.nativeElement, 'input'));
  });

  it('emits a refreshed label when an entity keeps the same stable id', async () => {
    const fixture = TestBed.createComponent(AdvancedHostComponent);
    fixture.componentInstance.value.set([
      {
        key: 'owner',
        operator: 'eq',
        value: { kind: 'entity', id: 'person-1', label: 'Ada Lovelace' },
      },
    ]);
    await settle(fixture);

    query<HTMLButtonElement>(fixture.nativeElement, '[data-hell-filter-token-edit]').click();
    const entityInput = await waitFor<HTMLInputElement>(
      fixture,
      document.body,
      '[data-field="owner"] [data-hell-filter-editor-input]',
    );
    await nextTask();
    await settle(fixture);
    inputValue(entityInput, 'Ada');
    await nextTask();
    await settle(fixture);
    fixture.componentInstance.calls.at(-1)!.resolve([
      { id: 'person-1', label: 'Ada Byron' },
    ]);
    expect((await waitForActiveOption(fixture, entityInput)).textContent?.trim()).toBe('Ada Byron');
    key(entityInput, 'Enter');
    await waitForMissing(fixture, document.body, '[hellPopover] [data-slot="editor"]');

    expect(fixture.componentInstance.value()).toEqual([
      {
        key: 'owner',
        operator: 'eq',
        value: { kind: 'entity', id: 'person-1', label: 'Ada Byron' },
      },
    ]);
    expect(query<HTMLElement>(fixture.nativeElement, '[data-slot="tokenLabel"]')
      .textContent?.trim()).toBe('Owner: Ada Byron');
  });

  it('aborts superseded entity searches and discards their stale rejection', async () => {
    const fixture = TestBed.createComponent(AdvancedHostComponent);
    await settle(fixture);
    const picker = query<HTMLInputElement>(fixture.nativeElement, 'input');

    inputValue(picker, 'owner:a');
    await nextTask();
    await settle(fixture);
    const entityInput = query<HTMLInputElement>(
      fixture.nativeElement,
      '[data-field="owner"] [data-hell-filter-editor-input]',
    );
    inputValue(entityInput, 'ab');
    inputValue(entityInput, 'abc');

    // Both replacement drafts are debounced into one dispatch.
    expect(fixture.componentInstance.calls).toHaveLength(1);
    await nextTask();
    await settle(fixture);
    expect(fixture.componentInstance.calls).toHaveLength(2);
    expect(fixture.componentInstance.calls[0]?.signal?.aborted).toBe(true);
    expect(fixture.componentInstance.calls[1]?.query).toBe('abc');

    fixture.componentInstance.calls[0]!.reject(new Error('stale failure'));
    fixture.componentInstance.calls[1]!.resolve([]);
    const empty = await waitFor<HTMLElement>(
      fixture,
      document.body,
      '[data-slot="status"][data-state="empty"]',
    );
    expect(empty.textContent?.trim()).toBe('No owner found');
    expect(fixture.componentInstance.errors).toEqual([]);

    inputValue(entityInput, 'broken');
    await nextTask();
    await settle(fixture);
    const failure = new Error('current failure');
    fixture.componentInstance.calls.at(-1)!.reject(failure);
    const error = await waitFor<HTMLElement>(
      fixture,
      document.body,
      '[data-slot="status"][data-state="error"]',
    );
    expect(error.textContent?.trim()).toBe('Could not load owner');
    expect(fixture.componentInstance.errors).toEqual([
      expect.objectContaining({ field: fixture.componentInstance.fields[0], query: 'broken', error: failure }),
    ]);

  });

  it('discards a stale successful entity response after newer results render', async () => {
    const fixture = TestBed.createComponent(AdvancedHostComponent);
    await settle(fixture);
    inputValue(query<HTMLInputElement>(fixture.nativeElement, 'input'), 'owner:a');
    await nextTask();
    await settle(fixture);
    const entityInput = query<HTMLInputElement>(
      fixture.nativeElement,
      '[data-field="owner"] [data-hell-filter-editor-input]',
    );

    inputValue(entityInput, 'new');
    await nextTask();
    await settle(fixture);
    expect(fixture.componentInstance.calls).toHaveLength(2);
    fixture.componentInstance.calls[1]!.resolve([{ id: 'new', label: 'New owner' }]);
    expect((await waitForActiveOption(fixture, entityInput)).textContent?.trim()).toBe('New owner');

    fixture.componentInstance.calls[0]!.resolve([{ id: 'old', label: 'Old owner' }]);
    await nextTask();
    await settle(fixture);
    expect(document.body.textContent).not.toContain('Old owner');
    expect((await waitForActiveOption(fixture, entityInput)).textContent?.trim()).toBe('New owner');
  });

  it('serializes open date ranges and reuses the same editor for controlled edits', async () => {
    const fixture = TestBed.createComponent(AdvancedHostComponent);
    await settle(fixture);
    const picker = query<HTMLInputElement>(fixture.nativeElement, 'input');

    inputValue(picker, 'created:');
    const editor = await waitFor<HTMLElement>(
      fixture,
      fixture.nativeElement,
      '[data-slot="editor"][data-field="created"]',
    );
    const from = query<HTMLInputElement>(editor, 'input[aria-label="Created from"]');
    const to = query<HTMLInputElement>(editor, 'input[aria-label="Created to"]');
    await nextTask();
    await settle(fixture);
    expect(document.activeElement).toBe(from);
    expect(from.value).toBe('');
    expect(to.value).toBe('');
    expect(applyButton(editor).disabled).toBe(true);

    inputValue(from, '2026-07-04');
    key(from, 'Enter');
    await settle(fixture);

    expect(fixture.componentInstance.value()).toEqual([
      {
        key: 'created',
        operator: 'eq',
        value: { kind: 'dateRange', from: '2026-07-04', to: null },
      },
    ]);
    expect(query<HTMLElement>(fixture.nativeElement, '[data-slot="tokenLabel"]')
      .textContent?.trim()).toBe('Created: From 2026-07-04');

    query<HTMLButtonElement>(fixture.nativeElement, '[data-hell-filter-token-edit]').click();
    const editEditor = await waitFor<HTMLElement>(
      fixture,
      document.body,
      '[hellPopover] [data-slot="editor"][data-field="created"]',
    );
    const editTo = query<HTMLInputElement>(editEditor, 'input[aria-label="Created to"]');
    inputValue(editTo, '2026-07-20');
    editTo.dispatchEvent(new Event('blur', { bubbles: true }));
    await settle(fixture);
    applyButton(editEditor).click();
    await waitForMissing(fixture, document.body, '[hellPopover] [data-slot="editor"]');

    expect(fixture.componentInstance.value()).toEqual([
      {
        key: 'created',
        operator: 'eq',
        value: { kind: 'dateRange', from: '2026-07-04', to: '2026-07-20' },
      },
    ]);

    query<HTMLButtonElement>(fixture.nativeElement, '[data-hell-filter-token-edit]').click();
    const draftEditor = await waitFor<HTMLElement>(
      fixture,
      document.body,
      '[hellPopover] [data-slot="editor"][data-field="created"]',
    );
    const draftFrom = query<HTMLInputElement>(draftEditor, 'input[aria-label="Created from"]');
    const draftTo = query<HTMLInputElement>(draftEditor, 'input[aria-label="Created to"]');
    inputValue(draftTo, 'not-a-date');
    await settle(fixture);
    expect(applyButton(draftEditor).disabled).toBe(true);
    key(draftTo, 'Enter');
    await settle(fixture);
    expect(document.body.contains(draftEditor)).toBe(true);
    expect(fixture.componentInstance.value()).toEqual([
      {
        key: 'created',
        operator: 'eq',
        value: { kind: 'dateRange', from: '2026-07-04', to: '2026-07-20' },
      },
    ]);

    // Both visible drafts are resolved together, so changing the second bound
    // can make a first bound that was invalid against the old value committable.
    inputValue(draftFrom, '2026-07-25');
    inputValue(draftTo, '2026-07-30');
    await settle(fixture);
    expect(applyButton(draftEditor).disabled).toBe(false);
    applyButton(draftEditor).click();
    await waitForMissing(fixture, document.body, '[hellPopover] [data-slot="editor"]');
    expect(fixture.componentInstance.value()).toEqual([
      {
        key: 'created',
        operator: 'eq',
        value: { kind: 'dateRange', from: '2026-07-25', to: '2026-07-30' },
      },
    ]);
  });

  it('uses the composed Date Input adapter while keeping token dates ISO serialized', async () => {
    const fixture = TestBed.createComponent(LocalizedDateHostComponent);
    fixture.componentInstance.value.set([
      {
        key: 'created',
        operator: 'eq',
        value: { kind: 'dateRange', from: '2026-07-02', to: null },
      },
    ]);
    await settle(fixture);
    query<HTMLButtonElement>(fixture.nativeElement, '[data-hell-filter-token-edit]').click();
    const editor = await waitFor<HTMLElement>(
      fixture,
      document.body,
      '[hellPopover] [data-slot="editor"][data-field="created"]',
    );
    const from = query<HTMLInputElement>(editor, 'input[aria-label="Created from"]');

    // The same adapter coercion used by Date Input also owns Filter Bar's
    // hidden draft, so a rejected controlled date cannot be stale-committed.
    expect(from.value).toBe('');
    expect(applyButton(editor).disabled).toBe(true);

    inputValue(from, '30.06.2026');
    await settle(fixture);
    expect(applyButton(editor).disabled).toBe(true);
    key(from, 'Enter');
    await settle(fixture);
    expect(document.body.contains(editor)).toBe(true);

    inputValue(from, '04.07.2026');
    key(from, 'Enter');
    await settle(fixture);
    expect(fixture.componentInstance.value()).toEqual([
      {
        key: 'created',
        operator: 'eq',
        value: { kind: 'dateRange', from: '2026-07-04', to: null },
      },
    ]);
    expect(query<HTMLElement>(fixture.nativeElement, '[data-slot="tokenLabel"]')
      .textContent?.trim()).toBe('Created: From 2026-07-04');
  });

  it('keeps a nested date calendar as the first Escape and focus-dismissal layer', async () => {
    const fixture = TestBed.createComponent(AdvancedHostComponent);
    await settle(fixture);
    inputValue(query<HTMLInputElement>(fixture.nativeElement, 'input'), 'created:');
    const editor = await waitFor<HTMLElement>(
      fixture,
      fixture.nativeElement,
      '[data-slot="editor"][data-field="created"]',
    );
    const from = query<HTMLInputElement>(editor, 'input[aria-label="Created from"]');
    query<HTMLButtonElement>(editor, 'hell-date-input [data-slot="trigger"]').click();
    const calendar = await waitFor<HTMLElement>(
      fixture,
      document.body,
      '[data-slot="pickerPanel"] hell-date-picker',
    );
    query<HTMLButtonElement>(calendar, 'button').focus();
    await nextTask();
    await settle(fixture);
    expect(fixture.nativeElement.querySelector('[data-field="created"]')).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await waitForMissing(fixture, document.body, '[data-slot="pickerPanel"]');
    expect(fixture.nativeElement.querySelector('[data-field="created"]')).not.toBeNull();

    from.focus();
    key(from, 'Escape');
    await nextTask();
    await waitForMissing(fixture, fixture.nativeElement, '[data-field="created"]');
    expect(document.activeElement).toBe(query<HTMLInputElement>(fixture.nativeElement, 'input'));
  });

  it('coerces static boolean and nullable numeric inputs', async () => {
    const fixture = TestBed.createComponent(StaticInputHost);
    await settle(fixture);
    const bar = fixture.debugElement.query(By.directive(HellFilterBar)).componentInstance as HellFilterBar;

    expect(bar.disabled()).toBe(true);
    expect(bar.freeTextDebounceMs()).toBe(25);
  });
});

function inputValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function key(element: HTMLElement, keyValue: string): void {
  element.dispatchEvent(new KeyboardEvent('keydown', { key: keyValue, bubbles: true }));
}

async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
}

async function nextTask(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function waitFor<T extends HTMLElement>(
  fixture: { detectChanges(): void; whenStable(): Promise<unknown> },
  root: ParentNode,
  selector: string,
): Promise<T> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    await settle(fixture);
    const element = root.querySelector<T>(selector);
    if (element) return element;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error(`Expected ${selector}.`);
}

async function waitForMissing(
  fixture: { detectChanges(): void; whenStable(): Promise<unknown> },
  root: ParentNode,
  selector: string,
): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    await settle(fixture);
    if (!root.querySelector(selector)) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error(`Expected ${selector} to disappear.`);
}

async function waitForAttribute(
  fixture: { detectChanges(): void; whenStable(): Promise<unknown> },
  element: HTMLElement,
  name: string,
  value: string,
): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    await settle(fixture);
    if (element.getAttribute(name) === value) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error(`Expected ${name}=${value}; received ${element.getAttribute(name)}.`);
}

function query<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}

async function waitForActiveOption(
  fixture: { detectChanges(): void; whenStable(): Promise<unknown> },
  input: HTMLInputElement,
): Promise<HTMLElement> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    await settle(fixture);
    const id = input.getAttribute('aria-activedescendant');
    const option = id ? input.ownerDocument.getElementById(id) : null;
    if (option) return option;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error(`Expected an active combobox descendant; input was ${input.outerHTML}`);
}

function queryAll<T extends HTMLElement>(root: ParentNode, selector: string): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

function applyButton(root: ParentNode): HTMLButtonElement {
  const button = queryAll<HTMLButtonElement>(root, 'button')
    .find((candidate) => candidate.textContent?.trim() === 'Apply filter');
  if (!button) throw new Error('Expected Apply filter button.');
  return button;
}
