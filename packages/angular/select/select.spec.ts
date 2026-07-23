import { Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';

import { NgpSelect } from 'ng-primitives/select';

import { HellSelect, HELL_SELECT_IMPORTS } from './select';
import type { HellPickValue } from '@hell-ui/angular/core';
import { expectUiRouting, sortClasses } from '../spec-helpers';

interface Region {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
}

const REGIONS: readonly Region[] = [
  { id: 'eu-central-1', label: 'EU (Frankfurt)' },
  { id: 'eu-west-1', label: 'EU (Ireland)' },
  { id: 'us-east-1', label: 'US East (N. Virginia)', disabled: true },
];

@Component({
  imports: [ReactiveFormsModule, ...HELL_SELECT_IMPORTS],
  template: `
    <button
      hellSelect
      type="button"
      [formControl]="control"
      (openChange)="openStates.push($event)"
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
  readonly openStates: boolean[] = [];
}

@Component({
  imports: [ReactiveFormsModule, ...HELL_SELECT_IMPORTS],
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
  readonly values: Array<HellPickValue<string>> = [];
}

@Component({
  imports: [ReactiveFormsModule, ...HELL_SELECT_IMPORTS, ...HELL_FIELD_IMPORTS],
  template: `
    <div hellField>
      <label hellFieldLabel for="deployment-region">Deployment region</label>
      <button
        id="deployment-region"
        hellSelect
        type="button"
        [formControl]="control"
        [compareWith]="compareById"
        (valueChange)="values.push($any($event))"
      >
        @if (selected(); as current) {
          <span hellSelectValue>{{ current.label }}</span>
        } @else {
          <span hellSelectPlaceholder>Pick a region</span>
        }
        <ng-template hellSelectPortal>
          <div hellSelectDropdown>
            @for (region of regions; track region.id) {
              <div hellSelectOption [value]="region" [disabled]="region.disabled ?? false">
                {{ region.label }}
              </div>
            }
          </div>
        </ng-template>
      </button>
      <div hellFieldDescription>Data stays inside the selected region.</div>
    </div>
  `,
})
class SelectProjectedFormHost {
  readonly regions = REGIONS;
  readonly control = new FormControl<Region | null>(null);
  readonly selected = toSignal(this.control.valueChanges, { initialValue: this.control.value });
  readonly values: Array<Region | null> = [];
  readonly compareById = (a: Region, b: Region): boolean => a.id === b.id;
}

@Component({
  imports: [...HELL_SELECT_IMPORTS],
  template: `
    <button hellSelect type="button" ui="rounded-hell-pill bg-hell-primary">
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

/**
 * Select specs assert behavior, forms integration, and ARIA relationships.
 * Part-Class Pipeline merge semantics are owned centrally by
 * `core/part-class-pipeline.spec.ts`; ui routing asserts that consumer
 * classes reach each part and that nothing outside the default render and the
 * consumer's ui appears, instead of asserting individual recipe classes. Part
 * Recipes stay package-private per ADR 0002, so the recipe snapshot below
 * pins the rendered class surface per part.
 */
async function defaultSelectClasses(): Promise<
  Record<'select' | 'value' | 'dropdown' | 'option', string>
> {
  const fixture = TestBed.createComponent(SelectFormHost);
  fixture.detectChanges();

  const select = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSelect]');
  const value = query<HTMLElement>(fixture.nativeElement, '[hellSelectValue]');
  const dropdown = await openSelectDropdown(fixture, select);
  const option = query<HTMLElement>(dropdown, '[hellSelectOption][value="low"]');
  const defaults = {
    select: select.className,
    value: value.className,
    dropdown: dropdown.className,
    option: option.className,
  };

  select.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
  );
  await waitForDropdownRemoval(fixture);

  return defaults;
}

describe('HellSelect', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectFormHost, SelectMultipleFormHost, SelectProjectedFormHost, SelectUiHost],
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

  it('preserves open state and the trigger-to-dropdown aria relationship', async () => {
    const fixture = TestBed.createComponent(SelectFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const select = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSelect]');
    const dropdown = await openSelectDropdown(fixture, select);

    expect(host.openStates).toEqual([true]);
    expect(select.getAttribute('aria-expanded')).toBe('true');
    expect(select.getAttribute('aria-controls')).toBe(dropdown.id);
    expect(dropdown.getAttribute('role')).toBe('listbox');

    select.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await waitForDropdownRemoval(fixture);

    expect(host.openStates).toEqual([true, false]);
    expect(select.getAttribute('aria-expanded')).toBe('false');
    expect(select.hasAttribute('aria-controls')).toBe(false);
  });

  it('merges select, value, dropdown and option root part styles through the portal', async () => {
    const defaults = await defaultSelectClasses();
    const fixture = TestBed.createComponent(SelectUiHost);
    fixture.detectChanges();

    const select = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSelect]');
    const value = query<HTMLElement>(fixture.nativeElement, '[hellSelectValue]');
    const dropdown = await openSelectDropdown(fixture, select);
    const option = query<HTMLElement>(dropdown, '[hellSelectOption][value="low"]');
    const disabled = query<HTMLElement>(dropdown, '[hellSelectOption][value="high"]');

    expect(select.getAttribute('data-slot')).toBe('root');
    expectUiRouting(defaults.select, select.className, 'rounded-hell-pill bg-hell-primary');

    expect(value.getAttribute('data-slot')).toBe('root');
    expectUiRouting(defaults.value, value.className, 'text-hell-danger');

    expect(dropdown.getAttribute('data-slot')).toBe('root');
    expectUiRouting(defaults.dropdown, dropdown.className, 'rounded-hell-pill');

    expect(option.getAttribute('data-slot')).toBe('root');
    expectUiRouting(defaults.option, option.className, 'px-hell-8 bg-hell-primary-soft');
    expect(disabled.getAttribute('data-slot')).toBe('root');
    expect(disabled.getAttribute('aria-disabled')).toBe('true');
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', async () => {
      const defaults = await defaultSelectClasses();

      expect({
        select: sortClasses(defaults.select),
        value: sortClasses(defaults.value),
        dropdown: sortClasses(defaults.dropdown),
        option: sortClasses(defaults.option),
      }).toMatchSnapshot('select');
    });
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
    let emitted: HellPickValue<readonly string[]> | undefined;

    select.registerOnChange((value) => (emitted = value));
    ngpSelect.valueChange.emit(arrayValue);

    expect(emitted).toBe(arrayValue);
  });

  it('projects domain options through a form field with stable label and description relationships', () => {
    const fixture = TestBed.createComponent(SelectProjectedFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const select = query<HTMLButtonElement>(root, 'button[hellSelect]');
    const label = query<HTMLLabelElement>(root, '[hellFieldLabel]');
    const description = query<HTMLElement>(root, '[hellFieldDescription]');

    expect(select.textContent?.trim()).toContain('Pick a region');
    expect(label.id).not.toBe('');
    expect(description.id).not.toBe('');
    expect(select.getAttribute('aria-labelledby')).toBe(label.id);
    expect(select.getAttribute('aria-describedby')).toBe(description.id);
    expect(accessibleName(root, select)).toBe('Deployment region');

    host.control.setValue({ id: 'eu-west-1', label: 'Current Ireland' });
    fixture.detectChanges();

    expect(select.textContent?.trim()).toContain('Current Ireland');
    expect(accessibleName(root, select)).toBe('Deployment region');
    expect(select.getAttribute('aria-describedby')).toBe(description.id);
    expect(host.values).toEqual([]);

    host.control.disable();
    fixture.detectChanges();
    expect(select.getAttribute('data-disabled')).toBe('');
  });

  it('uses comparison for projected object values and preserves projected labels and disabled state', async () => {
    const fixture = TestBed.createComponent(SelectProjectedFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const select = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSelect]');
    host.control.setValue({ id: 'eu-west-1', label: 'Current Ireland' });
    fixture.detectChanges();

    const dropdown = await openSelectDropdown(fixture, select);
    const options = Array.from(dropdown.querySelectorAll<HTMLElement>('[hellSelectOption]'));

    expect(options.map((option) => option.textContent?.trim())).toEqual([
      'EU (Frankfurt)',
      'EU (Ireland)',
      'US East (N. Virginia)',
    ]);
    expect(options[0]?.getAttribute('aria-selected')).not.toBe('true');
    expect(options[1]?.getAttribute('aria-selected')).toBe('true');
    expect(options[2]?.getAttribute('aria-disabled')).toBe('true');
  });

  it('updates a projected select form and output once for a user selection', async () => {
    const fixture = TestBed.createComponent(SelectProjectedFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const select = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSelect]');
    const debug = fixture.debugElement.query(By.directive(HellSelect));
    const ngpSelect = debug.injector.get(NgpSelect);

    host.control.setValue(REGIONS[0] ?? null);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.values).toEqual([]);
    expect(select.textContent?.trim()).toContain('EU (Frankfurt)');

    ngpSelect.valueChange.emit(REGIONS[1]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.control.value).toBe(REGIONS[1]);
    expect(host.values).toEqual([REGIONS[1]]);
    expect(select.textContent?.trim()).toContain('EU (Ireland)');
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
