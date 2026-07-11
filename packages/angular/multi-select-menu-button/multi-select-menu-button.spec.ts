import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import {
  HellMultiSelectMenuButton,
  provideHellMultiSelectMenuButtonLabels,
  type HellMultiSelectOption,
} from './multi-select-menu-button';

const COLUMN_OPTIONS: readonly HellMultiSelectOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'role', label: 'Role' },
  { value: 'status', label: 'Status', disabled: true },
  { value: 'team', label: 'Team' },
];

@Component({
  imports: [HellMultiSelectMenuButton],
  template: `
    <hell-multi-select-menu-button
      label="Columns"
      [options]="options"
      [selected]="selected()"
      [minSelected]="minSelected()"
      [resettable]="resettable()"
      (selectedChange)="onSelectedChange($event)"
      (reset)="onReset()"
    />
  `,
})
class HostComponent {
  readonly options = COLUMN_OPTIONS;
  readonly selected = signal<string[]>(['name', 'role']);
  readonly minSelected = signal(0);
  readonly resettable = signal(false);
  readonly changes: string[][] = [];
  resets = 0;

  onSelectedChange(next: string[]): void {
    this.changes.push(next);
    this.selected.set(next);
  }

  onReset(): void {
    this.resets += 1;
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

describe('HellMultiSelectMenuButton', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  afterEach(() => {
    cleanupPortaledTestElements('[hellMenu]');
  });

  it('emits nothing on first render and reflects the selection count on the trigger', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await settle(fixture);

    expect(fixture.componentInstance.changes).toEqual([]);

    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '[data-slot="trigger"]');
    expect(trigger.getAttribute('data-selection-count')).toBe('2');
    expect(trigger.getAttribute('data-has-selection')).toBe('');
    expect(query<HTMLElement>(trigger, '[data-slot="count"]').textContent?.trim()).toBe('2');
  });

  it('hides the count badge and clears data-has-selection when nothing is selected', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.selected.set([]);
    await settle(fixture);

    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '[data-slot="trigger"]');
    expect(trigger.getAttribute('data-selection-count')).toBe('0');
    expect(trigger.getAttribute('data-has-selection')).toBeNull();
    expect(trigger.querySelector('[data-slot="count"]')).toBeNull();
  });

  it('exposes each option as a menuitemcheckbox with its checked state and keeps the menu open on toggle', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await settle(fixture);

    await openMenu(fixture);
    const checkboxes = menuCheckboxes();
    expect(checkboxes.map((box) => box.getAttribute('aria-checked'))).toEqual([
      'true',
      'true',
      'false',
      'false',
    ]);

    // Toggle an unselected option on: emits the whole next array, menu stays open.
    checkboxes[3].click();
    await settle(fixture);

    expect(fixture.componentInstance.changes).toEqual([['name', 'role', 'team']]);
    expect(document.body.querySelector('[role="menu"]')).toBeTruthy();
    expect(menuCheckboxes()[3].getAttribute('aria-checked')).toBe('true');
  });

  it('round-trips controlled state and emits the whole selection when toggling off', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await settle(fixture);

    await openMenu(fixture);
    // Toggle "role" off.
    menuCheckboxes()[1].click();
    await settle(fixture);

    expect(fixture.componentInstance.changes).toEqual([['name']]);
    expect(fixture.componentInstance.selected()).toEqual(['name']);
    expect(menuCheckboxes()[1].getAttribute('aria-checked')).toBe('false');
    const trigger = query<HTMLButtonElement>(fixture.nativeElement, '[data-slot="trigger"]');
    expect(trigger.getAttribute('data-selection-count')).toBe('1');
  });

  it('never mutates the consumer-owned selected array', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    const initial = ['name', 'role'];
    fixture.componentInstance.selected.set(initial);
    await settle(fixture);

    await openMenu(fixture);
    menuCheckboxes()[3].click();
    await settle(fixture);

    expect(initial).toEqual(['name', 'role']);
  });

  it('does not emit for a disabled option', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await settle(fixture);

    await openMenu(fixture);
    const status = menuCheckboxes()[2];
    expect(status.disabled).toBe(true);

    status.click();
    await settle(fixture);
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('blocks deselection at the minSelected floor while allowing additions', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.minSelected.set(2);
    await settle(fixture);

    await openMenu(fixture);
    const checkboxes = menuCheckboxes();

    // At the floor (2 selected, minSelected 2): the two selected options are
    // disabled so the selection can never drop below the floor.
    expect(checkboxes[0].disabled).toBe(true);
    expect(checkboxes[1].disabled).toBe(true);
    checkboxes[0].click();
    await settle(fixture);
    expect(fixture.componentInstance.changes).toEqual([]);

    // Adding an option is still allowed; once above the floor, deselection reopens.
    menuCheckboxes()[3].click();
    await settle(fixture);
    expect(fixture.componentInstance.changes).toEqual([['name', 'role', 'team']]);
    expect(menuCheckboxes()[0].disabled).toBe(false);
  });

  it('emits a distinct reset event without emitting a selection change', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.resettable.set(true);
    await settle(fixture);

    await openMenu(fixture);
    const reset = query<HTMLButtonElement>(document.body, '[hellMenu] button[hellMenuItem]');
    expect(reset.textContent?.trim()).toBe('Reset to default');

    reset.click();
    await settle(fixture);

    expect(fixture.componentInstance.resets).toBe(1);
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('renders the reset item label from the Label Contract override', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideHellMultiSelectMenuButtonLabels({ reset: 'Standardansicht' })],
    }).compileComponents();

    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.resettable.set(true);
    await settle(fixture);

    await openMenu(fixture);
    const reset = query<HTMLButtonElement>(document.body, '[hellMenu] button[hellMenuItem]');
    expect(reset.textContent?.trim()).toBe('Standardansicht');
  });
});

async function openMenu(fixture: {
  detectChanges(): void;
  whenStable(): Promise<unknown>;
  nativeElement: HTMLElement;
}): Promise<void> {
  const trigger = query<HTMLButtonElement>(fixture.nativeElement, '[data-slot="trigger"]');
  trigger.click();
  await waitForOverlayElement(fixture, document.body, '[role="menuitemcheckbox"]');
}

function menuCheckboxes(): HTMLButtonElement[] {
  return Array.from(document.body.querySelectorAll<HTMLButtonElement>('[role="menuitemcheckbox"]'));
}

async function settle(fixture: { detectChanges(): void; whenStable(): Promise<unknown> }) {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
}

async function waitForOverlayElement<T extends HTMLElement>(
  fixture: { detectChanges(): void; whenStable(): Promise<unknown> },
  root: ParentNode,
  selector: string,
): Promise<T> {
  const timeout = Date.now() + 10_000;
  while (Date.now() < timeout) {
    fixture.detectChanges();
    const element = root.querySelector<T>(selector);
    if (element) return element;
    await nextFrame();
    fixture.detectChanges();
  }

  throw new Error(`Expected ${selector}.`);
}

async function nextFrame(): Promise<void> {
  if (typeof requestAnimationFrame === 'function') {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    return;
  }

  await Promise.resolve();
}

function query<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}

function cleanupPortaledTestElements(selector: string): void {
  for (const element of Array.from(document.body.querySelectorAll(selector))) {
    element.remove();
  }
}
