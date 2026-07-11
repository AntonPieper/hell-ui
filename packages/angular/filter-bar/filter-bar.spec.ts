import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import {
  HELL_FILTER_TEXT_KEY,
  HellFilterBar,
  type HellFilterField,
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
    await TestBed.configureTestingModule({ imports: [HostComponent, StaticInputHost] })
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
