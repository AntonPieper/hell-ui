import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HellPopover, HellPopoverTrigger } from 'hell-ui/popover';

import {
  HELL_FILTER_BUILDER_IMPORTS,
  HellFilterBuilder,
  type HellFilter,
  type HellFilterBuilderEditorContext,
  type HellFilterFieldDescriptor,
} from './filter-builder';
import { sortClasses } from '../../spec-helpers';

interface IdentifiedFilter<
  TField extends string,
  TOperator extends string,
  TValue,
> extends HellFilter<TField, TOperator, TValue> {
  readonly id: string;
}

type NameFilter = IdentifiedFilter<'name', 'contains' | 'startsWith', string>;
type StatusFilter = IdentifiedFilter<'status', 'is' | 'isNot', 'active' | 'paused'>;
type CreatedFilter = IdentifiedFilter<
  'created',
  'between',
  { readonly from: string | null; readonly to: string | null }
>;
type TestFilter = NameFilter | StatusFilter | CreatedFilter;

@Component({
  imports: [
    ...HELL_FILTER_BUILDER_IMPORTS,
    HellPopover,
    HellPopoverTrigger,
  ],
  template: `
    <div tabindex="-1" (keydown.escape)="outerEscapes += 1">
      <hell-filter-builder
        aria-label="People filters"
        [fields]="fields()"
        [value]="value()"
        [identify]="identify"
        [ui]="ui()"
        (valueChange)="onValueChange($event)"
      >
        @if (showNameEditor()) {
          <ng-template [hellFilterBuilderEditor]="nameField" let-editor>
            <label>
              Name value
              <input
                #nameInput
                data-test-name-input
                [value]="editor.filter?.value ?? ''"
              />
            </label>
            <button
              type="button"
              data-test-name-invalid
              (click)="invalidAccepted = editor.commit(nameCandidate(editor, ''))"
            >
              Invalid
            </button>
            <button type="button" data-test-name-context (click)="probeContext(editor)">
              Probe context
            </button>
            <button type="button" data-test-name-cancel (click)="editor.cancel()">
              Cancel name
            </button>
            <button
              type="button"
              data-test-name-commit
              (click)="editor.commit(nameCandidate(editor, nameInput.value))"
            >
              Apply name
            </button>
          </ng-template>
        }

        <ng-template [hellFilterBuilderEditor]="statusField" let-editor>
          <button
            type="button"
            data-test-status-active
            (click)="editor.commit(statusCandidate(editor, 'active'))"
          >
            Active
          </button>
          <button
            type="button"
            data-test-status-paused
            (click)="editor.commit(statusCandidate(editor, 'paused'))"
          >
            Paused
          </button>
          <button type="button" data-test-status-cancel (click)="editor.cancel()">
            Cancel
          </button>
        </ng-template>

        <ng-template [hellFilterBuilderEditor]="createdField" let-editor>
          <button
            type="button"
            data-test-date-layer-trigger
            [hellPopoverTrigger]="dateLayer"
          >
            Open date layer
          </button>
          <ng-template #dateLayer>
            <div hellPopover>
              <button type="button" data-test-date-layer-action>Nested date action</button>
            </div>
          </ng-template>
          <button
            type="button"
            data-test-date-commit
            (click)="editor.commit(createdCandidate(editor))"
          >
            Apply range
          </button>
        </ng-template>
      </hell-filter-builder>
    </div>
    <button type="button" data-test-outside>Outside</button>
  `,
})
class HostComponent {
  readonly nameField: HellFilterFieldDescriptor<NameFilter> = {
    field: 'name',
    label: 'Name',
    multiple: true,
    display: (filter) => `Name ${filter.operator}: ${filter.value}`,
    validate: (filter) => filter.value.trim().length > 0,
  };
  readonly statusField: HellFilterFieldDescriptor<StatusFilter> = {
    field: 'status',
    label: 'Status',
    display: (filter) => `Status ${filter.operator === 'isNot' ? 'is not' : 'is'}: ${filter.value}`,
    validate: (filter) => filter.value === 'active' || filter.value === 'paused',
  };
  readonly createdField: HellFilterFieldDescriptor<CreatedFilter> = {
    field: 'created',
    label: 'Created',
    display: (filter) => `Created: ${filter.value.from ?? 'Any'}–${filter.value.to ?? 'Any'}`,
    validate: (filter) => Boolean(filter.value.from || filter.value.to),
  };
  readonly fields = signal<readonly HellFilterFieldDescriptor<TestFilter>[]>([
    this.nameField,
    this.statusField,
    this.createdField,
  ]);
  readonly showNameEditor = signal(true);
  readonly value = signal<readonly TestFilter[]>([
    { id: 'status-1', field: 'status', operator: 'is', value: 'active' },
  ]);
  readonly identify = (filter: TestFilter) => filter.id;
  readonly ui = signal<
    | string
    | {
        readonly root: string;
        readonly editor: string;
      }
  >({
    root: 'filter-builder-root-refinement gap-hell-6',
    editor: 'filter-builder-editor-refinement',
  });
  readonly changes: (readonly TestFilter[])[] = [];
  invalidAccepted: boolean | null = null;
  contextDisplay = '';
  contextValid: boolean | null = null;
  outerEscapes = 0;

  onValueChange(value: readonly TestFilter[]): void {
    this.changes.push(value);
    this.value.set(value);
  }

  nameCandidate(
    editor: HellFilterBuilderEditorContext<NameFilter>,
    value: string,
  ): NameFilter {
    return {
      id: editor.filter?.id ?? 'name-created',
      field: 'name',
      operator: editor.filter?.operator ?? 'contains',
      value,
    };
  }

  probeContext(editor: HellFilterBuilderEditorContext<NameFilter>): void {
    const candidate = this.nameCandidate(editor, 'Ada');
    this.contextDisplay = editor.display(candidate);
    this.contextValid = editor.validate(candidate);
  }

  statusCandidate(
    editor: HellFilterBuilderEditorContext<StatusFilter>,
    value: StatusFilter['value'],
  ): StatusFilter {
    return {
      id: editor.filter?.id ?? 'status-created',
      field: 'status',
      operator: editor.filter?.operator ?? 'is',
      value,
    };
  }

  createdCandidate(editor: HellFilterBuilderEditorContext<CreatedFilter>): CreatedFilter {
    return {
      id: editor.filter?.id ?? 'created-created',
      field: 'created',
      operator: 'between',
      value: { from: '2026-07-01', to: '2026-07-31' },
    };
  }
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

describe('HellFilterBuilder', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  afterEach(() => {
    for (const element of document.body.querySelectorAll('[hellPopover]')) element.remove();
  });

  it('renders application display copy and does not emit or mutate on first render', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const original = fixture.componentInstance.value();
    await settle(fixture);

    expect(fixture.componentInstance.changes).toEqual([]);
    expect(fixture.componentInstance.value()).toBe(original);
    expect(query<HTMLElement>(fixture.nativeElement, '[data-slot="tokenLabel"]').textContent?.trim())
      .toBe('Status is: active');
    expect(query<HTMLInputElement>(fixture.nativeElement, '[data-hell-filter-builder-input]')
      .getAttribute('aria-label')).toBe('People filters');
    expect(query<HTMLElement>(fixture.nativeElement, '[data-slot="root"]').classList)
      .toContain('filter-builder-root-refinement');
    expect(query<HTMLElement>(fixture.nativeElement, 'hell-filter-builder').classList)
      .toContain('contents');

    fixture.componentInstance.ui.set('filter-builder-root-shorthand gap-hell-5');
    fixture.detectChanges();
    expect(query<HTMLElement>(fixture.nativeElement, '[data-slot="root"]').classList)
      .toContain('filter-builder-root-shorthand');
  });

  describe('recipes', () => {
    // Part-Class Pipeline merge semantics are owned centrally by
    // `core/part-class-pipeline.spec.ts`; the snapshot pins the default part
    // classes (empty-string ui yields the pure recipes) without asserting
    // individual utilities elsewhere.
    it('keeps the default part classes stable', async () => {
      const fixture = TestBed.createComponent(HostComponent);
      fixture.componentInstance.ui.set('');
      await settle(fixture);

      const host = fixture.nativeElement as HTMLElement;
      const partClasses = (slot: string): string[] =>
        sortClasses(host.querySelector(`[data-slot="${slot}"]`)?.getAttribute('class') ?? '');

      expect({
        host: sortClasses(query<HTMLElement>(host, 'hell-filter-builder').className),
        root: partClasses('root'),
        tokens: partClasses('tokens'),
        token: partClasses('token'),
        tokenLabel: partClasses('tokenLabel'),
        control: partClasses('control'),
        clear: partClasses('clear'),
        live: partClasses('live'),
      }).toMatchSnapshot('filterBuilder');
    });
  });

  it('allows Tab to leave an open picker when no enabled option is active', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await settle(fixture);
    const picker = query<HTMLInputElement>(
      fixture.nativeElement,
      '[data-hell-filter-builder-input]',
    );

    picker.focus();
    inputValue(picker, 'Name');
    key(picker, 'ArrowDown');
    await settle(fixture);
    await nextTask();
    await settle(fixture);
    expect(picker.getAttribute('aria-expanded')).toBe('true');

    inputValue(picker, 'No matching field');
    await settle(fixture);
    expect(picker.getAttribute('aria-expanded')).toBe('true');
    expect(picker.getAttribute('aria-activedescendant')).toBeNull();

    const tab = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    picker.dispatchEvent(tab);

    expect(tab.defaultPrevented).toBe(false);
  });

  it('uses one typed projected editor for create, rejects invalid commits, and announces add', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.value.set([]);
    await settle(fixture);

    await openCreateEditor(fixture, 'Name');
    let editor = query<HTMLElement>(fixture.nativeElement, '[data-slot="editor"]');
    expect(editor.dataset['mode']).toBe('create');
    expect(editor.dataset['field']).toBe('name');
    expect(editor.classList).toContain('filter-builder-editor-refinement');

    query<HTMLButtonElement>(editor, '[data-test-name-invalid]').click();
    await settle(fixture);
    expect(fixture.componentInstance.invalidAccepted).toBe(false);
    expect(fixture.componentInstance.changes).toEqual([]);
    expect(fixture.nativeElement.querySelector('[data-slot="editor"]')).not.toBeNull();

    query<HTMLButtonElement>(editor, '[data-test-name-context]').click();
    expect(fixture.componentInstance.contextDisplay).toBe('Name contains: Ada');
    expect(fixture.componentInstance.contextValid).toBe(true);

    query<HTMLButtonElement>(editor, '[data-test-name-cancel]').click();
    await settle(fixture);
    await nextTask();
    await settle(fixture);
    expect(fixture.nativeElement.querySelector('[data-slot="editor"]')).toBeNull();
    expect(fixture.componentInstance.changes).toEqual([]);

    await openCreateEditor(fixture, 'Name');
    editor = query<HTMLElement>(fixture.nativeElement, '[data-slot="editor"]');

    const input = query<HTMLInputElement>(editor, '[data-test-name-input]');
    inputValue(input, 'Ada');
    query<HTMLButtonElement>(editor, '[data-test-name-commit]').click();
    await settle(fixture);
    await nextTask();
    await settle(fixture);

    expect(fixture.componentInstance.value()).toEqual([
      {
        id: 'name-created',
        field: 'name',
        operator: 'contains',
        value: 'Ada',
      },
    ]);
    expect(query<HTMLElement>(fixture.nativeElement, '[data-slot="tokenLabel"]').textContent?.trim())
      .toBe('Name contains: Ada');
    expect(query<HTMLElement>(fixture.nativeElement, '[data-slot="live"]').textContent?.trim())
      .toBe('Name contains: Ada added');
    expect(document.activeElement).toBe(
      query<HTMLInputElement>(fixture.nativeElement, '[data-hell-filter-builder-input]'),
    );
  });

  it('cancels create without emitting when controlled fields remove its descriptor', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.value.set([]);
    await settle(fixture);
    const original = fixture.componentInstance.value();

    await openCreateEditor(fixture, 'Name');
    fixture.componentInstance.fields.set([
      fixture.componentInstance.statusField,
      fixture.componentInstance.createdField,
    ]);
    await settle(fixture);
    await nextTask();
    await settle(fixture);

    expect(fixture.nativeElement.querySelector('[data-slot="editor"]')).toBeNull();
    const picker = query<HTMLInputElement>(
      fixture.nativeElement,
      '[data-hell-filter-builder-input]',
    );
    expect(document.activeElement).toBe(picker);
    expect(fixture.componentInstance.value()).toBe(original);
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('cancels create without emitting when its projected template is destroyed', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.value.set([]);
    await settle(fixture);
    const original = fixture.componentInstance.value();

    await openCreateEditor(fixture, 'Name');
    fixture.componentInstance.showNameEditor.set(false);
    await settle(fixture);
    await nextTask();
    await settle(fixture);

    expect(fixture.nativeElement.querySelector('[data-slot="editor"]')).toBeNull();
    const picker = query<HTMLInputElement>(
      fixture.nativeElement,
      '[data-hell-filter-builder-input]',
    );
    expect(document.activeElement).toBe(picker);
    expect(fixture.componentInstance.value()).toBe(original);
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('cancels edit on Escape, emits nothing, and restores focus to the stable token', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.value.set([
      { id: 'status-"]\\1', field: 'status', operator: 'is', value: 'active' },
    ]);
    await settle(fixture);
    const original = fixture.componentInstance.value();
    const token = query<HTMLElement>(fixture.nativeElement, '[data-slot="token"]');

    token.focus();
    key(token, 'Enter');
    const editor = await waitFor<HTMLElement>(fixture, document.body, '[data-slot="editor"][data-mode="edit"]');
    expect(query<HTMLElement>(editor, '[data-test-status-active]').closest('[data-slot="editor"]'))
      .toBe(editor);

    key(query<HTMLButtonElement>(editor, '[data-test-status-active]'), 'Escape');
    await waitForMissing(fixture, document.body, '[data-slot="editor"][data-mode="edit"]');
    await nextTask();
    await settle(fixture);

    expect(fixture.componentInstance.value()).toBe(original);
    expect(fixture.componentInstance.changes).toEqual([]);
    expect(fixture.componentInstance.outerEscapes).toBe(0);
    expect(document.activeElement).toBe(token);
  });

  it('cancels edit without emitting when controlled fields remove its descriptor', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await settle(fixture);
    const original = fixture.componentInstance.value();
    const token = query<HTMLElement>(fixture.nativeElement, '[data-slot="token"]');

    token.focus();
    key(token, 'Enter');
    await waitFor<HTMLElement>(
      fixture,
      document.body,
      '[data-slot="editor"][data-mode="edit"]',
    );

    fixture.componentInstance.fields.set([
      fixture.componentInstance.nameField,
      fixture.componentInstance.createdField,
    ]);
    await waitForMissing(fixture, document.body, '[data-slot="editor"][data-mode="edit"]');
    await nextTask();
    await settle(fixture);

    expect(fixture.componentInstance.value()).toBe(original);
    expect(fixture.componentInstance.changes).toEqual([]);
    expect(document.activeElement).toBe(token);
  });

  it('edits the same identity after controlled object recreation and reorder', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.value.set([
      { id: 'name-1', field: 'name', operator: 'contains', value: 'Ada' },
      { id: 'name-2', field: 'name', operator: 'startsWith', value: 'Linus' },
    ]);
    await settle(fixture);

    const firstToken = queryAll<HTMLElement>(fixture.nativeElement, '[data-slot="token"]')[0]!;
    firstToken.focus();
    key(firstToken, 'Enter');
    await waitFor<HTMLElement>(fixture, document.body, '[data-slot="editor"][data-mode="edit"]');

    fixture.componentInstance.value.set([
      { id: 'name-2', field: 'name', operator: 'startsWith', value: 'Linus' },
      { id: 'name-1', field: 'name', operator: 'contains', value: 'Ada recreated' },
    ]);
    await settle(fixture);
    const editor = query<HTMLElement>(document.body, '[data-slot="editor"][data-mode="edit"]');
    const input = query<HTMLInputElement>(editor, '[data-test-name-input]');
    expect(input.value).toBe('Ada recreated');
    inputValue(input, 'Grace');
    query<HTMLButtonElement>(editor, '[data-test-name-commit]').click();
    await settle(fixture);
    await nextTask();
    await settle(fixture);

    expect(fixture.componentInstance.value()).toEqual([
      { id: 'name-2', field: 'name', operator: 'startsWith', value: 'Linus' },
      { id: 'name-1', field: 'name', operator: 'contains', value: 'Grace' },
    ]);
    const focused = query<HTMLElement>(
      fixture.nativeElement,
      '[data-hell-filter-builder-id="string:name-1"]',
    );
    expect(document.activeElement).toBe(focused);
    expect(query<HTMLElement>(fixture.nativeElement, '[data-slot="live"]').textContent?.trim())
      .toBe('Name contains: Grace updated');
  });

  it('keeps a nested floating layer inside create editing and consumes Escape one layer at a time', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.value.set([]);
    await settle(fixture);
    await openCreateEditor(fixture, 'Created');
    const editor = query<HTMLElement>(fixture.nativeElement, '[data-slot="editor"]');
    const trigger = query<HTMLButtonElement>(editor, '[data-test-date-layer-trigger]');

    trigger.click();
    const nestedAction = await waitFor<HTMLButtonElement>(
      fixture,
      document.body,
      '[data-test-date-layer-action]',
    );
    nestedAction.focus();
    await nextTask();
    await settle(fixture);
    expect(fixture.nativeElement.querySelector('[data-slot="editor"]')).not.toBeNull();

    key(nestedAction, 'Escape');
    await waitForMissing(fixture, document.body, '[data-test-date-layer-action]');
    expect(fixture.nativeElement.querySelector('[data-slot="editor"]')).not.toBeNull();

    trigger.focus();
    key(trigger, 'Escape');
    await waitForMissing(fixture, fixture.nativeElement, '[data-slot="editor"]');
    await nextTask();
    await settle(fixture);
    expect(document.activeElement).toBe(
      query<HTMLInputElement>(fixture.nativeElement, '[data-hell-filter-builder-input]'),
    );
  });

  it('delegates token removal and focus continuity to Chip Set/Input and announces clear', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.value.set([
      { id: 'name-1', field: 'name', operator: 'contains', value: 'Ada' },
      { id: 'name-2', field: 'name', operator: 'startsWith', value: 'Grace' },
    ]);
    await settle(fixture);
    let tokens = queryAll<HTMLElement>(fixture.nativeElement, '[data-slot="token"]');

    tokens[0]!.focus();
    key(tokens[0]!, 'Delete');
    await settle(fixture);
    await nextTask();
    await settle(fixture);
    tokens = queryAll<HTMLElement>(fixture.nativeElement, '[data-slot="token"]');
    expect(tokens).toHaveLength(1);
    expect(document.activeElement).toBe(tokens[0]);
    expect(query<HTMLElement>(fixture.nativeElement, '[data-slot="live"]').textContent?.trim())
      .toBe('Name contains: Ada removed');

    const picker = query<HTMLInputElement>(fixture.nativeElement, '[data-hell-filter-builder-input]');
    picker.focus();
    key(picker, 'Backspace');
    expect(document.activeElement).toBe(tokens[0]);
    key(tokens[0]!, 'Backspace');
    await settle(fixture);
    await nextTask();
    await settle(fixture);
    expect(queryAll(fixture.nativeElement, '[data-slot="token"]')).toHaveLength(0);
    expect(document.activeElement).toBe(picker);

    fixture.componentInstance.value.set([
      { id: 'status-2', field: 'status', operator: 'isNot', value: 'paused' },
    ]);
    await settle(fixture);
    query<HTMLButtonElement>(fixture.nativeElement, '[data-slot="clear"]').click();
    await settle(fixture);
    expect(fixture.componentInstance.value()).toEqual([]);
    expect(query<HTMLElement>(fixture.nativeElement, '[data-slot="live"]').textContent?.trim())
      .toBe('All filters cleared');
  });

  it('exposes the required stable identity callback', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await settle(fixture);
    const builder = fixture.debugElement.children[0]!.children[0]!.componentInstance as
      HellFilterBuilder<TestFilter>;

    expect(builder.identify()(fixture.componentInstance.value()[0]!)).toBe('status-1');
  });
});

async function openCreateEditor(
  fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>,
  field: string,
): Promise<void> {
  const picker = query<HTMLInputElement>(fixture.nativeElement, '[data-hell-filter-builder-input]');
  inputValue(picker, field);
  const option = await waitFor<HTMLElement>(
    fixture,
    document.body,
    `[data-slot="fieldOption"]`,
  );
  option.click();
  await waitFor<HTMLElement>(fixture, fixture.nativeElement, '[data-slot="editor"][data-mode="create"]');
}

function inputValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function key(element: HTMLElement, keyValue: string): void {
  element.dispatchEvent(
    new KeyboardEvent('keydown', { key: keyValue, bubbles: true, cancelable: true }),
  );
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
    await nextTask();
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
    await nextTask();
  }
  throw new Error(`Expected ${selector} to disappear.`);
}

function query<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}

function queryAll<T extends HTMLElement>(root: ParentNode, selector: string): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}
