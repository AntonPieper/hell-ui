import { Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HELL_CHIP_IMPORTS } from '@hell-ui/angular/chip';
import { HellControlGroup } from '@hell-ui/angular/control-group';
import type { HellPickValue } from '@hell-ui/angular/core';
import { NgpCombobox } from 'ng-primitives/combobox';

import { HellCombobox, HELL_COMBOBOX_IMPORTS } from './combobox';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly disabled?: boolean;
}

const PEOPLE: readonly Person[] = [
  { id: 'ada', name: 'Ada Lovelace', role: 'Platform' },
  { id: 'grace', name: 'Grace Hopper', role: 'Compiler' },
  { id: 'margaret', name: 'Margaret Hamilton', role: 'Flight', disabled: true },
];

@Component({
  imports: [ReactiveFormsModule, ...HELL_COMBOBOX_IMPORTS],
  template: `
    <div
      hellCombobox
      [wrapNavigation]="false"
      [formControl]="control"
      (openChange)="openStates.push($event)"
      (valueChange)="values.push($any($event))"
    >
      <input hellComboboxInput aria-label="Assignee" />
      <button hellComboboxButton type="button" aria-label="Toggle assignees"></button>
      <div *hellComboboxPortal hellComboboxDropdown>
        <div hellComboboxOption id="atlas-single" value="atlas">Atlas</div>
        <div hellComboboxOption id="nova-single" value="nova">Nova</div>
      </div>
    </div>
  `,
})
class ComboboxFormHost {
  readonly control = new FormControl<string | null>(null);
  readonly values: Array<string | null> = [];
  readonly openStates: boolean[] = [];
}

@Component({
  imports: [ReactiveFormsModule, ...HELL_COMBOBOX_IMPORTS],
  template: `
    <div
      id="multi-combobox"
      hellCombobox
      multiple
      [formControl]="control"
      (valueChange)="values.push($any($event))"
    >
      <input hellComboboxInput aria-label="Assignees" />
      <button hellComboboxButton type="button" aria-label="Toggle assignees"></button>
      <div *hellComboboxPortal hellComboboxDropdown>
        <div hellComboboxOption value="atlas">Atlas</div>
        <div hellComboboxOption value="nova">Nova</div>
      </div>
    </div>
  `,
})
class ComboboxMultipleFormHost {
  readonly control = new FormControl<string[]>(['atlas'], { nonNullable: true });
  readonly values: Array<HellPickValue<string>> = [];
}

@Component({
  imports: [HellControlGroup, ...HELL_COMBOBOX_IMPORTS],
  template: `
    <div hellControlGroup aria-label="Reviewer control">
      <span hellControlGroupPrefix>{{ selected()?.name ?? 'Unassigned' }}</span>
      <div
        hellCombobox
        [value]="selected()"
        [compareWith]="compareById"
        [options]="filtered()"
        ui="h-auto min-h-0 flex-1 rounded-none border-0 bg-transparent ps-0 pe-0 shadow-none data-focus:border-transparent data-focus:shadow-none"
        (valueChange)="onValueChange($event)"
      >
        <input
          hellComboboxInput
          aria-label="Reviewer"
          placeholder="Search reviewers…"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
        />
        <button hellComboboxButton type="button" aria-label="Toggle reviewers"></button>
        <div *hellComboboxPortal hellComboboxDropdown>
          @for (person of filtered(); track person.id) {
            <div
              hellComboboxOption
              [value]="person"
              [disabled]="person.disabled ?? false"
            >
              <strong>{{ person.name }}</strong>
              <span> — {{ person.role }}</span>
            </div>
          } @empty {
            <div hellComboboxEmpty>No reviewers match</div>
          }
        </div>
      </div>
    </div>
  `,
})
class ComboboxProjectedHost {
  readonly query = signal('');
  readonly selected = signal<Person | null>({
    id: 'grace',
    name: 'Current Grace',
    role: 'Compiler',
  });
  readonly values: Array<Person | null> = [];
  readonly compareById = (a: Person, b: Person): boolean => a.id === b.id;
  readonly filtered = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    if (!query) return [...PEOPLE];
    return PEOPLE.filter((person) =>
      `${person.name} ${person.role}`.toLocaleLowerCase().includes(query),
    );
  });

  onValueChange(value: HellPickValue<Person>): void {
    if (value === null || Array.isArray(value)) return;
    const person = value as Person;
    this.selected.set(person);
    this.values.push(person);
  }
}

@Component({
  imports: [
    ReactiveFormsModule,
    HellControlGroup,
    ...HELL_CHIP_IMPORTS,
    ...HELL_COMBOBOX_IMPORTS,
  ],
  template: `
    <div hellControlGroup [disabled]="control.disabled" aria-label="Team control">
      <div
        hellCombobox
        multiple
        [formControl]="control"
        [compareWith]="compareById"
        [options]="filtered()"
        ui="h-auto min-h-hell-control-md flex-1 flex-wrap gap-hell-1 rounded-none border-0 bg-transparent py-hell-1 ps-hell-2 pe-0 shadow-none data-focus:border-transparent data-focus:shadow-none"
        (valueChange)="values.push($any($event))"
      >
        <div hellChipSet ui="contents" aria-label="Selected teammates">
          @for (person of selected(); track person.id) {
            <span
              hellChip
              size="sm"
              [disabled]="control.disabled"
              (remove)="remove(person)"
            >
              {{ person.name }}<button hellChipRemove></button>
            </span>
          }
          <input
            hellComboboxInput
            hellChipInput
            aria-label="Teammates"
            placeholder="Add teammate…"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
          />
          <button hellComboboxButton type="button" aria-label="Toggle teammates"></button>
          <div *hellComboboxPortal hellComboboxDropdown>
            @for (person of filtered(); track person.id) {
              <div hellComboboxOption [value]="person">{{ person.name }}</div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
class ComboboxChipInputHost {
  readonly control = new FormControl<Person[]>([PEOPLE[0]!, PEOPLE[1]!], {
    nonNullable: true,
  });
  readonly selected = toSignal(this.control.valueChanges, {
    initialValue: this.control.value,
  });
  readonly query = signal('');
  readonly values: Array<HellPickValue<Person>> = [];
  readonly compareById = (a: Person, b: Person): boolean => a.id === b.id;
  readonly filtered = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    return query
      ? PEOPLE.filter((person) => person.name.toLocaleLowerCase().includes(query))
      : [...PEOPLE];
  });

  remove(person: Person): void {
    this.control.setValue(
      this.control.value.filter((candidate) => !this.compareById(candidate, person)),
    );
  }
}

@Component({
  imports: [...HELL_COMBOBOX_IMPORTS],
  template: `
    <div hellCombobox ui="rounded-hell-pill bg-hell-primary-soft">
      <input hellComboboxInput aria-label="Assignee" ui="text-hell-danger" />
      <button
        hellComboboxButton
        type="button"
        aria-label="Toggle assignees"
        ui="text-hell-success-strong"
      ></button>
      <div *hellComboboxPortal hellComboboxDropdown ui="rounded-hell-pill">
        <div
          hellComboboxOption
          value="atlas"
          [ui]="{ root: 'px-hell-8 bg-hell-primary-soft' }"
        >
          Atlas
        </div>
        <div hellComboboxEmpty ui="text-hell-danger">No matches</div>
      </div>
    </div>
  `,
})
class ComboboxUiHost {}

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

describe('HellCombobox', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ComboboxFormHost,
        ComboboxMultipleFormHost,
        ComboboxProjectedHost,
        ComboboxChipInputHost,
        ComboboxUiHost,
      ],
    }).compileComponents();
  });

  afterEach(() => {
    cleanupPortaledTestElements('[hellComboboxDropdown], [data-hell-combobox-test-outside]');
  });

  it('integrates with reactive forms without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(ComboboxFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const combobox = query<HTMLElement>(fixture.nativeElement, '[hellCombobox]');

    host.control.setValue('nova');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.values).toEqual([]);

    combobox.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: combobox,
      }),
    );
    fixture.detectChanges();
    expect(host.control.touched).toBe(false);

    combobox.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: null,
      }),
    );
    fixture.detectChanges();

    expect(host.control.touched).toBe(true);

    host.control.disable();
    fixture.detectChanges();

    expect(combobox.getAttribute('data-disabled')).toBe('');
  });

  it('integrates with reactive forms in multiple mode without echoing array writes', async () => {
    const fixture = TestBed.createComponent(ComboboxMultipleFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    host.control.setValue(['nova']);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.values).toEqual([]);
    expect(host.control.value).toEqual(['nova']);

    query<HTMLElement>(fixture.nativeElement, '#multi-combobox').dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: null }),
    );
    fixture.detectChanges();

    expect(host.control.touched).toBe(true);
    expect(Array.isArray(host.control.value)).toBe(true);
  });

  it('preserves array-valued domain options in single mode', () => {
    const fixture = TestBed.createComponent(ComboboxFormHost);
    fixture.detectChanges();

    const debug = fixture.debugElement.query(By.directive(HellCombobox));
    const combobox = debug.injector.get(HellCombobox<readonly string[]>);
    const ngpCombobox = debug.injector.get(NgpCombobox);
    const arrayValue = ['north', 'south'] as const;
    let emitted: HellPickValue<readonly string[]> | undefined;

    combobox.registerOnChange((value) => (emitted = value));
    ngpCombobox.valueChange.emit(arrayValue);

    expect(emitted).toBe(arrayValue);
  });

  it('merges each directive root Part Style Map through the portal', async () => {
    const fixture = TestBed.createComponent(ComboboxUiHost);
    fixture.detectChanges();

    const root = query<HTMLElement>(fixture.nativeElement, '[hellCombobox]');
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input[hellComboboxInput]');
    const button = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellComboboxButton]');
    const dropdown = await openComboboxDropdown(fixture, input, button);
    const option = query<HTMLElement>(dropdown, '[hellComboboxOption]');
    const empty = query<HTMLElement>(dropdown, '[hellComboboxEmpty]');

    expect(root.getAttribute('data-slot')).toBe('root');
    expect(root.className).toContain('rounded-hell-pill');
    expect(root.className).not.toContain('rounded-hell-md');
    expect(root.className).toContain('bg-hell-primary-soft');
    expect(input.getAttribute('data-slot')).toBe('root');
    expect(input.className).toContain('text-hell-danger');
    expect(button.getAttribute('data-slot')).toBe('root');
    expect(button.className).toContain('text-hell-success-strong');
    expect(dropdown.getAttribute('data-slot')).toBe('root');
    expect(dropdown.className).toContain('rounded-hell-pill');
    expect(option.getAttribute('data-slot')).toBe('root');
    expect(option.className).toContain('px-hell-8');
    expect(option.className).toContain('bg-hell-primary-soft');
    expect(empty.getAttribute('data-slot')).toBe('root');
    expect(empty.className).toContain('text-hell-danger');
  });

  it('keeps the input as the active-descendant owner and links the opened listbox', async () => {
    const fixture = TestBed.createComponent(ComboboxFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input[hellComboboxInput]');
    const button = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellComboboxButton]');

    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-haspopup')).toBe('listbox');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(button.tabIndex).toBe(-1);

    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    const dropdown = await waitForDropdown(fixture);

    expect(host.openStates).toEqual([true]);
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(input.getAttribute('aria-controls')).toBe(dropdown.id);
    expect(button.getAttribute('aria-controls')).toBe(dropdown.id);
    expect(input.getAttribute('aria-activedescendant')).not.toBeNull();
    expect(dropdown.getAttribute('role')).toBe('listbox');
    expect(document.activeElement).toBe(input);

    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await waitForDropdownRemoval(fixture);

    expect(host.openStates[0]).toBe(true);
    expect(host.openStates.at(-1)).toBe(false);
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.hasAttribute('aria-controls')).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it('opens from the projected toggle button and restores focus to the input', async () => {
    const fixture = TestBed.createComponent(ComboboxFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input[hellComboboxInput]');
    const button = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellComboboxButton]');

    button.click();
    const dropdown = await waitForDropdown(fixture);

    expect(host.openStates).toEqual([true]);
    expect(dropdown.getAttribute('role')).toBe('listbox');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(input);
  });

  it('keeps the form untouched through a live portal and unregisters a stale dropdown', async () => {
    const fixture = TestBed.createComponent(ComboboxFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input[hellComboboxInput]');
    const button = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellComboboxButton]');
    const outside = document.createElement('button');
    outside.dataset['hellComboboxTestOutside'] = '';
    document.body.append(outside);

    input.focus();
    const dropdown = await openComboboxDropdown(fixture, input, button);
    const staleOption = query<HTMLElement>(dropdown, '[hellComboboxOption]');

    input.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: staleOption }),
    );
    fixture.detectChanges();
    expect(host.control.touched).toBe(false);

    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await waitForDropdownRemoval(fixture);

    const reopened = await openComboboxDropdown(fixture, input, button);
    const liveOption = query<HTMLElement>(reopened, '[hellComboboxOption]');
    input.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: liveOption }),
    );
    fixture.detectChanges();
    expect(host.control.touched).toBe(false);

    input.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: staleOption }),
    );
    fixture.detectChanges();
    expect(host.control.touched).toBe(true);
  });

  it('clamps delegated Arrow navigation only at enabled option boundaries', async () => {
    const fixture = TestBed.createComponent(ComboboxFormHost);
    fixture.detectChanges();
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input[hellComboboxInput]');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    const dropdown = await waitForDropdown(fixture);
    const options = Array.from(dropdown.querySelectorAll<HTMLElement>('[role="option"]'));
    const firstId = options[0]!.id;
    const lastId = options[1]!.id;
    expect(input.getAttribute('aria-activedescendant')).toBe(firstId);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBe(firstId);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBe(lastId);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBe(lastId);
  });

  it('projects domain objects with comparison, disabled state, and one user commit', async () => {
    const fixture = TestBed.createComponent(ComboboxProjectedHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input[hellComboboxInput]');
    const button = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellComboboxButton]');
    const dropdown = await openComboboxDropdown(fixture, input, button);
    const options = Array.from(dropdown.querySelectorAll<HTMLElement>('[hellComboboxOption]'));

    expect(options.map((option) => option.textContent?.trim().replace(/\s+/g, ' '))).toEqual([
      'Ada Lovelace — Platform',
      'Grace Hopper — Compiler',
      'Margaret Hamilton — Flight',
    ]);
    expect(options[0]?.getAttribute('aria-selected')).not.toBe('true');
    expect(options[1]?.getAttribute('aria-selected')).toBe('true');
    expect(options[2]?.getAttribute('aria-disabled')).toBe('true');

    options[0]?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.selected()).toBe(PEOPLE[0]);
    expect(host.values).toEqual([PEOPLE[0]]);
  });

  it('composes public Chip Set and Chip Input without a second selection state machine', async () => {
    const fixture = TestBed.createComponent(ComboboxChipInputHost);
    fixture.detectChanges();
    await settleChipLabels(fixture);

    const host = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const input = query<HTMLInputElement>(root, 'input[hellChipInput][hellComboboxInput]');
    let chips = Array.from(root.querySelectorAll<HTMLElement>('[hellChip]'));

    expect(chips.map((chip) => chip.textContent?.trim())).toEqual([
      'Ada Lovelace',
      'Grace Hopper',
    ]);
    expect(chips.map((chip) => chip.getAttribute('tabindex'))).toEqual(['0', '-1']);
    expect(root.querySelector('[hellComboboxChips]')).toBeNull();

    input.focus();
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(document.activeElement).toBe(chips[1]);
    expect(host.control.value).toEqual([PEOPLE[0], PEOPLE[1]]);

    chips[1]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
    fixture.detectChanges();
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    chips = Array.from(root.querySelectorAll<HTMLElement>('[hellChip]'));
    expect(chips.map((chip) => chip.textContent?.trim())).toEqual(['Ada Lovelace']);
    expect(host.control.value).toEqual([PEOPLE[0]]);
    expect(host.values).toEqual([]);
    expect(document.activeElement).toBe(input);

    const button = query<HTMLButtonElement>(root, 'button[hellComboboxButton]');
    const dropdown = await openComboboxDropdown(fixture, input, button);
    const options = Array.from(dropdown.querySelectorAll<HTMLElement>('[hellComboboxOption]'));
    expect(options[0]?.getAttribute('aria-selected')).toBe('true');
    expect(options[1]?.getAttribute('aria-selected')).not.toBe('true');
  });

  it('keeps composed chips and their remove actions disabled with the form control', async () => {
    const fixture = TestBed.createComponent(ComboboxChipInputHost);
    fixture.detectChanges();
    await settleChipLabels(fixture);

    const host = fixture.componentInstance;
    host.control.disable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const chips = Array.from(root.querySelectorAll<HTMLElement>('[hellChip]'));
    const remove = query<HTMLButtonElement>(root, 'button[hellChipRemove]');
    const input = query<HTMLInputElement>(root, 'input[hellComboboxInput]');

    expect(chips.every((chip) => chip.hasAttribute('data-disabled'))).toBe(true);
    expect(remove.disabled).toBe(true);
    expect(input.disabled).toBe(true);

    remove.click();
    fixture.detectChanges();
    expect(host.control.value).toEqual([PEOPLE[0], PEOPLE[1]]);
  });
});

async function settleChipLabels(fixture: {
  detectChanges: () => void;
  whenStable: () => Promise<unknown>;
}): Promise<void> {
  await fixture.whenStable();
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

async function waitForDropdown(fixture: {
  detectChanges: () => void;
  whenStable: () => Promise<unknown>;
}): Promise<HTMLElement> {
  const dropdown = await findDropdown(fixture, 3000);
  if (dropdown) return dropdown;
  throw new Error('Expected combobox dropdown.');
}

async function openComboboxDropdown(
  fixture: {
    detectChanges: () => void;
    whenStable: () => Promise<unknown>;
  },
  input: HTMLElement,
  button: HTMLElement,
): Promise<HTMLElement> {
  const attempts = [
    () => button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })),
    () =>
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
      ),
  ];

  for (const attempt of attempts) {
    attempt();
    const dropdown = await findDropdown(fixture, 250);
    if (dropdown) return dropdown;
  }

  return waitForDropdown(fixture);
}

async function findDropdown(
  fixture: {
    detectChanges: () => void;
    whenStable: () => Promise<unknown>;
  },
  timeoutMs: number,
): Promise<HTMLElement | null> {
  const timeout = Date.now() + timeoutMs;

  while (Date.now() < timeout) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const dropdown = document.querySelector<HTMLElement>('[hellComboboxDropdown]');
    if (dropdown) return dropdown;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return null;
}

async function waitForDropdownRemoval(fixture: {
  detectChanges: () => void;
  whenStable: () => Promise<unknown>;
}): Promise<void> {
  const timeout = Date.now() + 3000;

  while (Date.now() < timeout) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    if (!document.querySelector('[hellComboboxDropdown]')) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  throw new Error('Expected combobox dropdown to be removed.');
}

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}

function cleanupPortaledTestElements(selector: string): void {
  for (const element of document.querySelectorAll(selector)) element.remove();
}
