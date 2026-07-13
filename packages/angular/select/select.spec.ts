import { Component, signal } from '@angular/core';
import type { HellOption } from '@hell-ui/angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { NgpSelect } from 'ng-primitives/select';

import { HellSelectTrigger, HellSelect, HellSelectFormValue, HELL_SELECT_DIRECTIVES, type HellSelectUi } from './select';

@Component({
  imports: [ReactiveFormsModule, ...HELL_SELECT_DIRECTIVES],
  template: `
    <button
      hellSelectTrigger
      type="button"
      [formControl]="control"
      (valueChange)="values.push($any($event))"
    >
      <span hellSelectValue>Selection</span>
      <div *hellSelectPortal hellSelectDropdown>
        <div hellSelectOption value="low">Low</div>
        <div hellSelectOption value="high">High</div>
      </div>
    </button>
  `,
})
class SelectFormHost {
  readonly control = new FormControl<string | null>(null);
  readonly values: Array<string | null> = [];
}

@Component({
  imports: [ReactiveFormsModule, ...HELL_SELECT_DIRECTIVES],
  template: `
    <button
      id="multi-select"
      hellSelectTrigger
      multiple
      type="button"
      [formControl]="control"
      (valueChange)="values.push($any($event))"
    >
      <span hellSelectValue>Selection</span>
      <div *hellSelectPortal hellSelectDropdown>
        <div hellSelectOption id="low-multiple" value="low">Low</div>
        <div hellSelectOption id="high-multiple" value="high">High</div>
      </div>
    </button>
  `,
})
class SelectMultipleFormHost {
  readonly control = new FormControl<string[]>(['low'], { nonNullable: true });
  readonly values: Array<HellSelectFormValue<string>> = [];
}

@Component({
  imports: [ReactiveFormsModule, HellSelect],
  template: `
    <p id="priority-help">Used to route incoming work.</p>
    <hell-select
      aria-label="Priority"
      [aria-describedby]="'priority-help'"
      [options]="options"
      [formControl]="control"
      (valueChange)="values.push($any($event))"
    />
  `,
})
class SelectBasicFormHost {
  readonly options: readonly HellOption<string>[] = [
    { value: 'low', label: 'Low' },
    { value: 'high', label: 'High' },
  ];
  readonly control = new FormControl<string | null>(null);
  readonly values: Array<string | null> = [];
}

@Component({
  imports: [HellSelect],
  template: `
    <span id="priority-label">Priority</span>
    <p id="priority-description">Used to route incoming work.</p>
    <hell-select
      [aria-labelledby]="'priority-label'"
      [aria-describedby]="'priority-description'"
      [options]="options"
      [value]="value()"
    />
  `,
})
class SelectBasicLabelledHost {
  readonly options: readonly HellOption<string>[] = [
    { value: 'low', label: 'Low' },
    { value: 'high', label: 'High' },
  ];
  readonly value = signal<string | null>(null);
}

@Component({
  imports: [HellSelect],
  template: `<hell-select [ui]="selectUi" [options]="[{ value: 'low', label: 'Low' }]" />`,
})
class SelectBasicUiHost {
  protected readonly selectUi = {
    root: 'block p-hell-8',
    trigger: 'rounded-hell-pill bg-hell-primary-soft',
    placeholder: 'text-hell-danger',
    dropdown: 'rounded-hell-pill',
    option: 'px-hell-8 bg-hell-primary-soft',
  } satisfies HellSelectUi;
}

@Component({
  imports: [HellSelect],
  template: `
    <hell-select
      aria-label="Priority"
      [options]="options"
      [displayWith]="displayWith()"
      [value]="'high'"
    />
  `,
})
class SelectBasicOptionHost {
  readonly options: readonly HellOption<string>[] = [
    { value: 'low', label: 'Low' },
    { value: 'high', label: 'High', disabled: true },
  ];
  readonly displayWith = signal<((value: string) => string) | null>(null);
}

@Component({
  imports: [...HELL_SELECT_DIRECTIVES],
  template: `
    <button hellSelectTrigger type="button" ui="rounded-hell-pill bg-hell-primary">
      <span hellSelectValue ui="text-hell-danger">Selection</span>
      <div *hellSelectPortal hellSelectDropdown ui="rounded-hell-pill">
        <div hellSelectOption value="low" [ui]="{ root: 'px-hell-8 bg-hell-primary-soft' }">
          Low
        </div>
        <div hellSelectOption value="high" disabled>High</div>
      </div>
    </button>
  `,
})
class SelectUiHost {}

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

describe('HellSelectTrigger', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SelectFormHost,
        SelectMultipleFormHost,
        SelectBasicFormHost,
        SelectBasicLabelledHost,
        SelectBasicUiHost,
        SelectUiHost,
      ],
    }).compileComponents();
  });

  afterEach(() => {
    cleanupPortaledTestElements('[hellSelectDropdown], [data-hell-select-test-outside]');
  });

  it('integrates with reactive forms without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(SelectFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const select = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSelectTrigger]');

    host.control.setValue('high');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.values).toEqual([]);

    select.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: select,
      }),
    );
    fixture.detectChanges();
    expect(host.control.touched).toBe(false);

    select.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: null,
      }),
    );
    fixture.detectChanges();

    expect(host.control.touched).toBe(true);

    host.control.disable();
    fixture.detectChanges();

    expect(select.getAttribute('data-disabled')).toBe('');
    expect(select.tabIndex).toBe(-1);
  });

  it('merges trigger, value, dropdown and option root part styles through the portal', async () => {
    const fixture = TestBed.createComponent(SelectUiHost);
    fixture.detectChanges();

    const select = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSelectTrigger]');
    const value = query<HTMLElement>(fixture.nativeElement, '[hellSelectValue]');
    const dropdown = await openSelectDropdown(fixture, select);
    const option = query<HTMLElement>(dropdown, '[hellSelectOption][value="low"]');
    const disabled = query<HTMLElement>(dropdown, '[hellSelectOption][value="high"]');

    expect(select.getAttribute('data-slot')).toBe('root');
    expect(select.className).toContain('rounded-hell-pill');
    expect(select.className).not.toContain('rounded-hell-md');
    expect(select.className).toContain('bg-hell-primary');

    expect(value.getAttribute('data-slot')).toBe('root');
    expect(value.className).toContain('text-hell-danger');

    expect(dropdown.getAttribute('data-slot')).toBe('root');
    expect(dropdown.className).toContain('rounded-hell-pill');
    expect(dropdown.className).not.toContain('rounded-hell-md');

    expect(option.getAttribute('data-slot')).toBe('root');
    expect(option.className).toContain('px-hell-8');
    expect(option.className).toContain('bg-hell-primary-soft');
    expect(disabled.getAttribute('data-slot')).toBe('root');
    expect(disabled.getAttribute('aria-disabled')).toBe('true');
  });

  it('keeps the form untouched while focus moves through a real portaled dropdown', async () => {
    const fixture = TestBed.createComponent(SelectFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const select = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSelectTrigger]');
    const outside = document.createElement('button');
    outside.dataset['hellSelectTestOutside'] = '';
    document.body.append(outside);

    select.focus();
    const dropdown = await openSelectDropdown(fixture, select);
    const option = query<HTMLElement>(dropdown, '[hellSelectOption]');

    option.focus();
    select.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: option,
      }),
    );
    fixture.detectChanges();

    expect(host.control.touched).toBe(false);

    outside.focus();
    option.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: outside,
      }),
    );
    fixture.detectChanges();

    expect(host.control.touched).toBe(true);
  });

  it('treats a stale portaled dropdown as outside after reopening', async () => {
    const fixture = TestBed.createComponent(SelectFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const select = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSelectTrigger]');

    select.focus();
    const dropdown = await openSelectDropdown(fixture, select);
    const staleOption = query<HTMLElement>(dropdown, '[hellSelectOption]');

    select.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await waitForDropdownRemoval(fixture);

    const reopenedDropdown = await openSelectDropdown(fixture, select);
    const liveOption = query<HTMLElement>(reopenedDropdown, '[hellSelectOption]');

    select.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: liveOption,
      }),
    );
    fixture.detectChanges();

    expect(host.control.touched).toBe(false);

    select.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: staleOption,
      }),
    );
    fixture.detectChanges();

    expect(host.control.touched).toBe(true);
  });

  it('integrates with reactive forms in multiple mode without echoing programmatic array writes', async () => {
    const fixture = TestBed.createComponent(SelectMultipleFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const select = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSelectTrigger]');

    host.control.setValue(['high']);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.values).toEqual([]);
    expect(host.control.value).toEqual(['high']);

    select.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    fixture.detectChanges();

    expect(host.control.touched).toBe(true);
    expect(Array.isArray(host.control.value)).toBe(true);
  });

  it('preserves array-valued options in single mode', () => {
    const fixture = TestBed.createComponent(SelectFormHost);
    fixture.detectChanges();

    const debug = fixture.debugElement.query(By.directive(HellSelectTrigger));
    const select = debug.injector.get(HellSelectTrigger<readonly string[]>);
    const ngpSelect = debug.injector.get(NgpSelect);
    const arrayValue = ['north', 'south'] as const;
    let emitted: HellSelectFormValue<readonly string[]> | undefined;

    select.registerOnChange((value) => (emitted = value));
    ngpSelect.valueChange.emit(arrayValue);

    expect(emitted).toBe(arrayValue);
  });

  it('provides a basic select preset with form value display and disabled state', () => {
    const fixture = TestBed.createComponent(SelectBasicFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const preset = query<HTMLElement>(fixture.nativeElement, 'hell-select');
    const trigger = query<HTMLButtonElement>(
      fixture.nativeElement,
      'hell-select button[hellSelectTrigger]',
    );

    expect(preset.getAttribute('data-slot')).toBe('root');
    expect(trigger.textContent?.trim()).toContain('Select');
    expect(trigger.getAttribute('aria-label')).toBe('Priority');
    expect(trigger.getAttribute('aria-describedby')).toBe('priority-help');

    host.control.setValue('high');
    fixture.detectChanges();

    expect(trigger.textContent?.trim()).toContain('High');
    expect(trigger.getAttribute('aria-label')).toBe('Priority');
    expect(trigger.getAttribute('aria-describedby')).toBe('priority-help');
    expect(host.values).toEqual([]);

    trigger.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: trigger }));
    fixture.detectChanges();
    expect(host.control.touched).toBe(false);

    trigger.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    fixture.detectChanges();
    expect(host.control.touched).toBe(true);

    host.control.disable();
    fixture.detectChanges();

    expect(trigger.getAttribute('data-disabled')).toBe('');
  });

  it('updates the basic select reactive form and output once for a user selection', async () => {
    const fixture = TestBed.createComponent(SelectBasicFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const trigger = query<HTMLButtonElement>(
      fixture.nativeElement,
      'hell-select button[hellSelectTrigger]',
    );
    const debug = fixture.debugElement.query(By.directive(HellSelectTrigger));
    const ngpSelect = debug.injector.get(NgpSelect);

    host.control.setValue('low');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.values).toEqual([]);
    expect(trigger.textContent?.trim()).toContain('Low');

    ngpSelect.valueChange.emit('high');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.control.value).toBe('high');
    expect(host.values).toEqual(['high']);

    host.control.disable();
    fixture.detectChanges();

    expect(trigger.getAttribute('data-disabled')).toBe('');
  });

  it('keeps the basic select accessible name stable before and after selection', () => {
    const fixture = TestBed.createComponent(SelectBasicLabelledHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const trigger = query<HTMLButtonElement>(root, 'hell-select button[hellSelectTrigger]');

    expect(trigger.textContent?.trim()).toContain('Select');
    expect(trigger.getAttribute('aria-labelledby')).toBe('priority-label');
    expect(trigger.getAttribute('aria-describedby')).toBe('priority-description');
    expect(accessibleName(root, trigger)).toBe('Priority');

    host.value.set('high');
    fixture.detectChanges();

    expect(trigger.textContent?.trim()).toContain('High');
    expect(accessibleName(root, trigger)).toBe('Priority');
    expect(trigger.getAttribute('aria-describedby')).toBe('priority-description');
  });

  it('exposes flat owned parts on the basic select host and its portaled dropdown', async () => {
    const fixture = TestBed.createComponent(SelectBasicUiHost);
    fixture.detectChanges();

    const preset = query<HTMLElement>(fixture.nativeElement, 'hell-select');
    const trigger = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSelectTrigger]');
    const placeholder = query<HTMLElement>(fixture.nativeElement, '[hellSelectPlaceholder]');

    expect(preset.getAttribute('data-slot')).toBe('root');
    expect(preset.className).toContain('block');
    expect(preset.className).toContain('p-hell-8');
    expect(trigger.getAttribute('data-slot')).toBe('trigger');
    expect(trigger.className).toContain('rounded-hell-pill');
    expect(trigger.className).toContain('bg-hell-primary-soft');
    expect(placeholder.getAttribute('data-slot')).toBe('placeholder');
    expect(placeholder.className).toContain('text-hell-danger');

    const dropdown = await openSelectDropdown(fixture, trigger);
    const option = query<HTMLElement>(dropdown, '[hellSelectOption]');

    expect(dropdown.getAttribute('data-slot')).toBe('dropdown');
    expect(dropdown.className).toContain('rounded-hell-pill');
    expect(option.getAttribute('data-slot')).toBe('option');
    expect(option.className).toContain('px-hell-8');
    expect(option.className).toContain('bg-hell-primary-soft');
  });

  it('labels the basic select from HellOption entries, honors displayWith overrides, and disables options', async () => {
    const fixture = TestBed.createComponent(SelectBasicOptionHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const trigger = query<HTMLButtonElement>(
      fixture.nativeElement,
      'hell-select button[hellSelectTrigger]',
    );

    expect(trigger.textContent?.trim()).toContain('High');

    host.displayWith.set((value) => value.toUpperCase());
    fixture.detectChanges();
    expect(trigger.textContent?.trim()).toContain('HIGH');

    host.displayWith.set(null);
    fixture.detectChanges();

    const dropdown = await openSelectDropdown(fixture, trigger);
    const options = Array.from(dropdown.querySelectorAll<HTMLElement>('[hellSelectOption]'));

    expect(options.map((option) => option.textContent?.trim())).toEqual(['Low', 'High']);
    expect(options[0]?.getAttribute('aria-disabled')).toBeNull();
    expect(options[1]?.getAttribute('aria-disabled')).toBe('true');
  });
});

function accessibleName(root: HTMLElement, element: HTMLElement): string {
  const labelledby = element.getAttribute('aria-labelledby');
  if (labelledby) {
    return labelledby
      .trim()
      .split(/\s+/)
      .map((id) => root.querySelector<HTMLElement>(`[id="${id}"]`)?.textContent?.trim() ?? '')
      .filter(Boolean)
      .join(' ');
  }

  return element.getAttribute('aria-label') ?? element.textContent?.trim() ?? '';
}

async function waitForDropdown(fixture: {
  detectChanges: () => void;
  whenStable: () => Promise<unknown>;
}): Promise<HTMLElement> {
  const dropdown = await findDropdown(fixture, 1000);
  if (dropdown) return dropdown;

  throw new Error('Expected select dropdown.');
}

async function openSelectDropdown(
  fixture: {
    detectChanges: () => void;
    whenStable: () => Promise<unknown>;
  },
  trigger: HTMLElement,
): Promise<HTMLElement> {
  const attempts = [
    () => trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })),
    () =>
      trigger.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
      ),
    () =>
      trigger.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      ),
    () =>
      trigger.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: ' ',
          code: 'Space',
          bubbles: true,
          cancelable: true,
        }),
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
    const dropdown = document.querySelector<HTMLElement>('[hellSelectDropdown]');
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
    if (!document.querySelector('[hellSelectDropdown]')) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  throw new Error('Expected select dropdown to be removed.');
}

function cleanupPortaledTestElements(selector: string): void {
  for (const element of document.querySelectorAll(selector)) {
    element.remove();
  }
}

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
