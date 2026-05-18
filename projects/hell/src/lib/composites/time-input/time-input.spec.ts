import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { HellTimeInput, provideHellTimeInputAdapter, type HellTimeValue } from './time-input';

@Component({
  imports: [HellTimeInput],
  template: `
    <hell-time-input
      [value]="value()"
      [seconds]="seconds()"
      [placeholder]="placeholder"
      [aria-label]="ariaLabel"
      (valueChange)="values.push($event)"
    />
  `,
})
class TimeInputHost {
  readonly value = signal<HellTimeValue | null>(null);
  readonly seconds = signal(false);
  placeholder: string | null = null;
  ariaLabel = 'Start time';
  values: Array<HellTimeValue | null> = [];
}

@Component({
  imports: [ReactiveFormsModule, HellTimeInput],
  template: `
    <hell-time-input [formControl]="control" aria-label="Form time" (valueChange)="values.push($event)" />
  `,
})
class TimeInputFormHost {
  readonly control = new FormControl<HellTimeValue | null>({ hour: 8, minute: 30, second: 0 });
  values: Array<HellTimeValue | null> = [];
}

@Component({
  imports: [ReactiveFormsModule, HellTimeInput],
  template: `
    <hell-time-input [formControl]="control" aria-label="Blur form time" />
  `,
})
class TimeInputBlurFormHost {
  readonly control = new FormControl<HellTimeValue | null>({ hour: 8, minute: 30, second: 0 }, {
    updateOn: 'blur',
  });
}

@Component({
  imports: [HellTimeInput],
  providers: [
    provideHellTimeInputAdapter({
      parseText: (text) =>
        text.trim().toLowerCase() === 'noon'
          ? { valid: true, value: { hour: 12, minute: 0, second: 0 } }
          : { valid: false },
      format: (value) => `${value.hour}h${value.minute.toString().padStart(2, '0')}`,
      normalize: (value) => (value && value.hour >= 12 ? value : null),
      isSameValue: (a, b) => a?.hour === b?.hour && a?.minute === b?.minute && a?.second === b?.second,
    }),
  ],
  template: `<hell-time-input [value]="value()" aria-label="Custom time" (valueChange)="values.push($event)" />`,
})
class TimeInputCustomAdapterHost {
  readonly value = signal<HellTimeValue | null>({ hour: 8, minute: 30, second: 0 });
  values: Array<HellTimeValue | null> = [];
}

@Component({
  imports: [ReactiveFormsModule, HellTimeInput],
  template: `<hell-time-input [formControl]="control" aria-label="Validated time" (valueChange)="values.push($event)" />`,
})
class TimeInputValidationHost {
  readonly control = new FormControl<HellTimeValue | null>({ hour: 9, minute: 15, second: 0 });
  values: Array<HellTimeValue | null> = [];
}

describe('HellTimeInput', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TimeInputHost,
        TimeInputFormHost,
        TimeInputBlurFormHost,
        TimeInputCustomAdapterHost,
        TimeInputValidationHost,
      ],
    }).compileComponents();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('parses common 12-hour text and emits structured time values', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '9:05 pm';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.values).toEqual([{ hour: 21, minute: 5, second: 0 }]);
  });

  it('includes seconds in display when seconds mode is enabled', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.componentInstance.seconds.set(true);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '1:02:03 am';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.values).toEqual([{ hour: 1, minute: 2, second: 3 }]);
    expect(input.value).toBe('01:02:03');
  });

  it('rejects seconds when seconds mode is disabled', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    expect(input.getAttribute('inputmode')).toBe('text');

    input.value = '1:02:03 am';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.values).toEqual([]);
    expect(input.value).toBe('1:02:03 am');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('uses HH:mm and HH:mm:ss placeholders by default', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.detectChanges();
    expect(textInput(fixture.nativeElement).placeholder).toBe('HH:mm');

    fixture.componentInstance.seconds.set(true);
    fixture.detectChanges();
    expect(textInput(fixture.nativeElement).placeholder).toBe('HH:mm:ss');
  });

  it('focuses picker units that match parsed minutes/seconds', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '10:07';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    const picker = timeInputInstance(fixture);
    expect(tabStopIndex(picker, 'hour', 24)).toBe(10);
    expect(tabStopIndex(picker, 'minute', 60)).toBe(7);

    fixture.componentInstance.seconds.set(true);
    fixture.detectChanges();

    input.value = '11:12:13';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(tabStopIndex(picker, 'second', 60)).toBe(13);
  });

  it('keeps invalid typed text visible without emitting', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    const host = fixture.componentInstance;
    host.value.set({ hour: 8, minute: 30, second: 0 });
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '25:99';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(input.value).toBe('25:99');

    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.values).toEqual([]);
    expect(input.value).toBe('25:99');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('emits null when empty text is committed', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    const host = fixture.componentInstance;
    host.value.set({ hour: 8, minute: 30, second: 0 });
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.values).toEqual([null]);
    expect(input.value).toBe('');
  });

  it('keeps the clock trigger in the keyboard tab order', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.detectChanges();

    const trigger = triggerButton(fixture.nativeElement);
    expect(trigger.tabIndex).toBe(0);
    expect(trigger.getAttribute('aria-label')).toBe('Choose time for Start time');
  });

  it('uses a single tab stop per picker section', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.detectChanges();

    const picker = timeInputInstance(fixture);

    expect(tabStopCount(picker, 'hour', 24)).toBe(1);
    expect(tabStopCount(picker, 'minute', 60)).toBe(1);
  });

  it('renders picker sections with grid rows, gridcells, and selected semantics', async () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.componentInstance.value.set({ hour: 8, minute: 30, second: 0 });
    fixture.componentInstance.seconds.set(true);
    fixture.detectChanges();

    triggerButton(fixture.nativeElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const hourGrid = await waitForPickerGrid(fixture, 'hours');
    const minuteGrid = document.querySelector<HTMLElement>('[data-slot="picker-grid"][data-unit="minutes"]');
    const secondGrid = document.querySelector<HTMLElement>('[data-slot="picker-grid"][data-unit="seconds"]');

    expect(hourGrid?.getAttribute('role')).toBe('grid');
    expect(hourGrid?.getAttribute('aria-label')).toBe('Hours');
    expect(hourGrid?.querySelectorAll('[role="row"]').length).toBe(4);
    expect(hourGrid?.querySelectorAll('[role="gridcell"]').length).toBe(24);
    expect(hourGrid?.querySelector('[role="gridcell"][aria-selected="true"]')?.textContent?.trim()).toBe('08');
    expect(rovingDomTabStopCount(hourGrid)).toBe(1);

    expect(minuteGrid?.getAttribute('role')).toBe('grid');
    expect(minuteGrid?.querySelector('[role="gridcell"][aria-selected="true"]')?.textContent?.trim()).toBe('30');
    expect(rovingDomTabStopCount(minuteGrid)).toBe(1);

    expect(secondGrid?.getAttribute('role')).toBe('grid');
    expect(secondGrid?.querySelector('[role="gridcell"][aria-selected="true"]')?.textContent?.trim()).toBe('00');
    expect(rovingDomTabStopCount(secondGrid)).toBe(1);
  });

  it('supports Arrow/Home/End navigation in picker sections', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.detectChanges();

    const picker = timeInputInstance(fixture);

    picker.onPickerCellKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }), 'hour', 0);
    expect(tabStopIndex(picker, 'hour', 24)).toBe(1);

    picker.onPickerCellKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }), 'hour', 1);
    expect(tabStopIndex(picker, 'hour', 24)).toBe(0);

    picker.onPickerCellKeydown(new KeyboardEvent('keydown', { key: 'End' }), 'hour', 0);
    expect(tabStopIndex(picker, 'hour', 24)).toBe(23);

    picker.onPickerCellKeydown(new KeyboardEvent('keydown', { key: 'Home' }), 'hour', 23);
    expect(tabStopIndex(picker, 'hour', 24)).toBe(0);

    picker.onPickerCellKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }), 'minute', 0);
    expect(tabStopIndex(picker, 'minute', 60)).toBe(4);

    picker.onPickerCellKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp' }), 'minute', 4);
    expect(tabStopIndex(picker, 'minute', 60)).toBe(0);
  });

  it('keeps roving tab stop stable for non-navigation keys', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.detectChanges();

    const picker = timeInputInstance(fixture);

    picker.onPickerCellKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }), 'hour', 0);
    expect(tabStopIndex(picker, 'hour', 24)).toBe(1);

    picker.onPickerCellKeydown(new KeyboardEvent('keydown', { key: 'PageDown' }), 'hour', 1);
    expect(tabStopIndex(picker, 'hour', 24)).toBe(1);
  });

  it('drops in-progress typing when the bound value changes externally', async () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    const host = fixture.componentInstance;
    host.value.set({ hour: 8, minute: 30, second: 0 });
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = 'draft';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    host.value.set({ hour: 12, minute: 45, second: 0 });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(input.value).toBe('12:45');
  });

  it('uses injected parse and format adapters', () => {
    const fixture = TestBed.createComponent(TimeInputCustomAdapterHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    expect(input.value).toBe('');

    input.value = 'noon';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.values).toEqual([{ hour: 12, minute: 0, second: 0 }]);
    expect(input.value).toBe('12h00');
  });

  it('exposes validator errors for invalid time drafts', () => {
    const fixture = TestBed.createComponent(TimeInputValidationHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = textInput(fixture.nativeElement);
    input.value = '25:99';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.errors).toEqual({ invalidTimeInputDraft: true });
  });

  it('clears time draft validator errors after a valid commit', () => {
    const fixture = TestBed.createComponent(TimeInputValidationHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = textInput(fixture.nativeElement);
    input.value = '10:15';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.errors).toBeNull();
    expect(host.control.value).toEqual({ hour: 10, minute: 15, second: 0 });
  });

  it('integrates with reactive forms without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(TimeInputFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = textInput(fixture.nativeElement);
    expect(input.value).toBe('08:30');

    host.control.setValue({ hour: 9, minute: 45, second: 0 });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(input.value).toBe('09:45');
    expect(host.values).toEqual([]);

    input.value = '10:15';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.value).toEqual({ hour: 10, minute: 15, second: 0 });
    expect(host.control.touched).toBe(true);
    expect(host.values).toEqual([{ hour: 10, minute: 15, second: 0 }]);
  });

  it('flushes reactive-form changes before touched state on blur', () => {
    const fixture = TestBed.createComponent(TimeInputBlurFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = textInput(fixture.nativeElement);
    input.value = '10:15';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.value).toEqual({ hour: 8, minute: 30, second: 0 });

    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.value).toEqual({ hour: 10, minute: 15, second: 0 });
    expect(host.control.touched).toBe(true);
  });

  it('does not revive stale local state after a form write returns to an old base', async () => {
    const fixture = TestBed.createComponent(TimeInputFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = textInput(fixture.nativeElement);

    host.control.setValue(null);
    await fixture.whenStable();
    fixture.detectChanges();

    input.value = '11:20';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(input.value).toBe('11:20');

    host.control.setValue(null);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(input.value).toBe('');
  });

  it('uses reactive-form disabled state', () => {
    const fixture = TestBed.createComponent(TimeInputFormHost);
    fixture.detectChanges();

    fixture.componentInstance.control.disable();
    fixture.detectChanges();

    expect(textInput(fixture.nativeElement).disabled).toBe(true);
    expect(triggerButton(fixture.nativeElement).disabled).toBe(true);
  });
});

function textInput(root: HTMLElement): HTMLInputElement {
  const input = root.querySelector('input');
  if (!(input instanceof HTMLInputElement)) throw new Error('Expected time input.');
  return input;
}

function timeInputInstance(fixture: ComponentFixture<unknown>): { onPickerCellKeydown: (event: KeyboardEvent, unit: HellTimeUnit, index: number) => void; pickerCellTabIndex: (unit: HellTimeUnit, index: number) => string } {
  const host = fixture.debugElement.query(By.directive(HellTimeInput));
  if (!host) throw new Error('Expected HellTimeInput instance.');
  return host.componentInstance as {
    onPickerCellKeydown: (event: KeyboardEvent, unit: HellTimeUnit, index: number) => void;
    pickerCellTabIndex: (unit: HellTimeUnit, index: number) => string;
  };
}

type HellTimeUnit = 'hour' | 'minute' | 'second';

function rovingDomTabStopCount(grid: HTMLElement | null): number {
  return Array.from(grid?.querySelectorAll<HTMLElement>('[role="gridcell"]') ?? []).filter(
    (cell) => cell.tabIndex === 0,
  ).length;
}

function tabStopCount(picker: { pickerCellTabIndex: (unit: HellTimeUnit, index: number) => string }, unit: HellTimeUnit, count: number): number {
  return Array.from({ length: count }, (_, index) => index).filter((index) =>
    picker.pickerCellTabIndex(unit, index) === '0',
  ).length;
}

function tabStopIndex(
  picker: { pickerCellTabIndex: (unit: HellTimeUnit, index: number) => string },
  unit: HellTimeUnit,
  count: number,
): number {
  return Array.from({ length: count }, (_, index) => index).findIndex(
    (index) => picker.pickerCellTabIndex(unit, index) === '0',
  );
}

function triggerButton(root: HTMLElement): HTMLButtonElement {
  const trigger = root.querySelector('button[data-slot="trigger"]');
  if (!(trigger instanceof HTMLButtonElement)) throw new Error('Expected time trigger.');
  return trigger;
}

async function waitForPickerGrid(
  fixture: ComponentFixture<unknown>,
  unit: 'hours' | 'minutes' | 'seconds',
): Promise<HTMLElement> {
  const selector = `[data-slot="picker-grid"][data-unit="${unit}"]`;
  const timeout = Date.now() + 1000;

  while (Date.now() < timeout) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const grid = document.querySelector<HTMLElement>(selector);
    if (grid) return grid;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  throw new Error(`Expected ${selector}.`);
}
