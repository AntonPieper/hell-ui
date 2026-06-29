import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { NgpSelect } from 'ng-primitives/select';

import { HellSelect, HellSelectBasic, HellSelectFormValue, HELL_SELECT_DIRECTIVES } from './select';

@Component({
  imports: [ReactiveFormsModule, ...HELL_SELECT_DIRECTIVES],
  template: `
    <button
      hellSelect
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
      hellSelect
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
  imports: [ReactiveFormsModule, HellSelectBasic],
  template: `
    <p id="priority-help">Used to route incoming work.</p>
    <hell-select-basic
      aria-label="Priority"
      [aria-describedby]="'priority-help'"
      [options]="options"
      [formControl]="control"
      (valueChange)="values.push($any($event))"
    />
  `,
})
class SelectBasicFormHost {
  readonly options = ['Low', 'High'];
  readonly control = new FormControl<string | null>(null);
  readonly values: Array<string | null> = [];
}

@Component({
  imports: [HellSelectBasic],
  template: `
    <span id="priority-label">Priority</span>
    <p id="priority-description">Used to route incoming work.</p>
    <hell-select-basic
      [aria-labelledby]="'priority-label'"
      [aria-describedby]="'priority-description'"
      [options]="options"
      [value]="value()"
    />
  `,
})
class SelectBasicLabelledHost {
  readonly options = ['Low', 'High'];
  readonly value = signal<string | null>(null);
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

describe('HellSelect', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SelectFormHost,
        SelectMultipleFormHost,
        SelectBasicFormHost,
        SelectBasicLabelledHost,
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
    const select = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSelect]');

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

  it('keeps the form untouched while focus moves through a real portaled dropdown', async () => {
    const fixture = TestBed.createComponent(SelectFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const select = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSelect]');
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
    const select = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSelect]');

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
    const select = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSelect]');

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

    const debug = fixture.debugElement.query(By.directive(HellSelect));
    const select = debug.injector.get(HellSelect<readonly string[]>);
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
    const preset = query<HTMLElement>(fixture.nativeElement, 'hell-select-basic');
    const trigger = query<HTMLButtonElement>(
      fixture.nativeElement,
      'hell-select-basic button[hellSelect]',
    );

    expect(preset.classList.contains('hell-select-basic')).toBe(true);
    expect(preset.classList.contains('hell-select')).toBe(false);
    expect(trigger.textContent?.trim()).toContain('Select');
    expect(trigger.getAttribute('aria-label')).toBe('Priority');
    expect(trigger.getAttribute('aria-describedby')).toBe('priority-help');

    host.control.setValue('High');
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
      'hell-select-basic button[hellSelect]',
    );
    const debug = fixture.debugElement.query(By.directive(HellSelect));
    const ngpSelect = debug.injector.get(NgpSelect);

    host.control.setValue('Low');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.values).toEqual([]);
    expect(trigger.textContent?.trim()).toContain('Low');

    ngpSelect.valueChange.emit('High');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.control.value).toBe('High');
    expect(host.values).toEqual(['High']);

    host.control.disable();
    fixture.detectChanges();

    expect(trigger.getAttribute('data-disabled')).toBe('');
  });

  it('keeps the basic select accessible name stable before and after selection', () => {
    const fixture = TestBed.createComponent(SelectBasicLabelledHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const trigger = query<HTMLButtonElement>(root, 'hell-select-basic button[hellSelect]');

    expect(trigger.textContent?.trim()).toContain('Select');
    expect(trigger.getAttribute('aria-labelledby')).toBe('priority-label');
    expect(trigger.getAttribute('aria-describedby')).toBe('priority-description');
    expect(accessibleName(root, trigger)).toBe('Priority');

    host.value.set('High');
    fixture.detectChanges();

    expect(trigger.textContent?.trim()).toContain('High');
    expect(accessibleName(root, trigger)).toBe('Priority');
    expect(trigger.getAttribute('aria-describedby')).toBe('priority-description');
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
