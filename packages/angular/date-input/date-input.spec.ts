import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import {
  HellDateInput,
  HELL_DEFAULT_DATE_INPUT_ADAPTER,
  provideHellDateInputAdapter,
  type HellDateInputPart,
  type HellDateInputUi,
} from './date-input';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';

{
  const elementPrototype = HTMLElement.prototype as HTMLElement & {
    getAnimations?: () => readonly Animation[];
  };
  if (typeof elementPrototype.getAnimations !== 'function') {
    elementPrototype.getAnimations = () => [];
  }
}

@Component({
  imports: [HellDateInput],
  template: `
    <hell-date-input
      [date]="date()"
      [min]="min()"
      [max]="max()"
      [placeholder]="placeholder"
      [inputId]="inputId"
      [name]="name"
      [aria-label]="ariaLabel"
      [aria-describedby]="ariaDescribedby"
      [aria-labelledby]="ariaLabelledby"
      (dateChange)="dates.push($event)"
    />
  `,
})
class DateInputHost {
  readonly date = signal<Date | null>(null);
  readonly min = signal<Date | null>(null);
  readonly max = signal<Date | null>(null);
  placeholder = 'YYYY-MM-DD';
  inputId = 'report-date-input';
  name = 'reportDate';
  ariaLabel = 'Report date';
  ariaDescribedby = 'report-date-help report-date-error';
  ariaLabelledby = 'report-date-label';
  dates: Array<Date | null> = [];
}

@Component({
  imports: [HellDateInput],
  template: `<hell-date-input [ui]="ui()" aria-label="Styled date" />`,
})
class DateInputPartStyleHost {
  readonly ui = signal<string | HellDateInputUi>('max-w-[20rem] border-hell-danger');
}

@Component({
  imports: [HellDateInput, ...HELL_FIELD_DIRECTIVES],
  template: `
    <div hellField>
      <label hellFieldLabel for="report-field-control">Report date</label>
      <hell-date-input inputId="report-field-control" aria-label="Report date" />
      <div hellFieldDescription>Use the report timezone.</div>
    </div>
  `,
})
class DateInputFieldHost {}

@Component({
  imports: [ReactiveFormsModule, HellDateInput],
  template: `
    <hell-date-input
      [formControl]="control"
      aria-label="Form date"
      (dateChange)="dates.push($event)"
    />
  `,
})
class DateInputFormHost {
  readonly control = new FormControl<Date | null>(new Date(2026, 3, 22));
  dates: Array<Date | null> = [];
}

@Component({
  imports: [ReactiveFormsModule, HellDateInput],
  template: ` <hell-date-input [formControl]="control" aria-label="Blur form date" /> `,
})
class DateInputBlurFormHost {
  readonly control = new FormControl<Date | null>(new Date(2026, 3, 22), {
    updateOn: 'blur',
  });
}

@Component({
  imports: [HellDateInput],
  providers: [
    provideHellDateInputAdapter({
      parseText: (text) =>
        text.trim().toLowerCase() === 'today'
          ? { valid: true, value: new Date(2026, 0, 2) }
          : { valid: false },
      format: (value) => (value ? `custom:${value.getFullYear()}` : ''),
      normalize: (value) => (value instanceof Date && value.getFullYear() >= 2026 ? value : null),
      isSameValue: (a, b) => a?.getTime() === b?.getTime(),
    }),
  ],
  template: `<hell-date-input
    [date]="date()"
    aria-label="Custom date"
    (dateChange)="dates.push($event)"
  />`,
})
class DateInputCustomAdapterHost {
  readonly date = signal<Date | null>(new Date(2025, 0, 1));
  dates: Array<Date | null> = [];
}

@Component({
  imports: [ReactiveFormsModule, HellDateInput],
  template: `
    <hell-date-input
      [formControl]="control"
      [min]="min()"
      [max]="max()"
      aria-label="Validated date"
      (dateChange)="dates.push($event)"
    />
  `,
})
class DateInputValidationHost {
  readonly control = new FormControl<Date | null>(new Date(2026, 3, 15));
  readonly min = signal<Date | null>(new Date(2026, 3, 1));
  readonly max = signal<Date | null>(new Date(2026, 3, 30));
  dates: Array<Date | null> = [];
}

describe('HellDateInput', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DateInputHost,
        DateInputPartStyleHost,
        DateInputFieldHost,
        DateInputFormHost,
        DateInputBlurFormHost,
        DateInputCustomAdapterHost,
        DateInputValidationHost,
      ],
    }).compileComponents();
  });

  it('forwards label and form attributes to the internal text field only', () => {
    const fixture = TestBed.createComponent(DateInputHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    const trigger = triggerButton(fixture.nativeElement);

    expect(input.id).toBe('report-date-input');
    expect(input.getAttribute('name')).toBe('reportDate');
    expect(input.getAttribute('aria-label')).toBe('Report date');
    expect(input.getAttribute('aria-describedby')).toBe('report-date-help report-date-error');
    expect(input.getAttribute('aria-labelledby')).toBe('report-date-label');
    expect(input.getAttribute('data-slot')).toBe('input');
    expect(input.classList.contains('flex-1')).toBe(true);
    expect(trigger.getAttribute('aria-label')).toBe('Choose date for Report date');
    expect(trigger.getAttribute('aria-describedby')).toBeNull();
    expect(trigger.getAttribute('aria-labelledby')).toBeNull();
  });

  it('merges ui shorthand classes into the root public part only', () => {
    const fixture = TestBed.createComponent(DateInputPartStyleHost);
    fixture.detectChanges();

    const root = dateInputHost(fixture.nativeElement);
    const input = textInput(fixture.nativeElement);
    const trigger = triggerButton(fixture.nativeElement);

    expect(root.getAttribute('data-slot')).toBe('root');
    expect(root.classList.contains('max-w-[20rem]')).toBe(true);
    expect(root.classList.contains('border-hell-danger')).toBe(true);
    expect(root.classList.contains('border-hell-border')).toBe(false);
    expect(input.getAttribute('data-slot')).toBe('input');
    expect(input.classList.contains('max-w-[20rem]')).toBe(false);
    expect(trigger.getAttribute('data-slot')).toBe('trigger');
    expect(trigger.classList.contains('max-w-[20rem]')).toBe(false);
  });

  it('merges ui object classes into owned input and trigger parts', () => {
    const fixture = TestBed.createComponent(DateInputPartStyleHost);
    fixture.componentInstance.ui.set({
      input: 'px-hell-6 text-lg',
      trigger: 'bg-hell-surface-subtle text-hell-danger',
    });
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    const trigger = triggerButton(fixture.nativeElement);

    expect(input.classList.contains('px-hell-6')).toBe(true);
    expect(input.classList.contains('px-hell-3')).toBe(false);
    expect(input.classList.contains('text-lg')).toBe(true);
    expect(trigger.classList.contains('bg-hell-surface-subtle')).toBe(true);
    expect(trigger.classList.contains('text-hell-danger')).toBe(true);
  });

  it('merges ui object classes into the portaled picker panel part', () => {
    const fixture = TestBed.createComponent(DateInputPartStyleHost);
    fixture.componentInstance.ui.set({
      pickerPanel: 'border-hell-danger p-hell-6',
    });
    fixture.detectChanges();

    const panelClass = dateInputPartClass(dateInputComponent(fixture), 'pickerPanel');

    expect(panelClass).toContain('border-hell-danger');
    expect(panelClass).toContain('p-hell-6');
    expect(panelClass).not.toContain('p-0');
  });

  it('neutralizes the popover chrome around the embedded date picker', async () => {
    const fixture = TestBed.createComponent(DateInputHost);
    fixture.detectChanges();

    triggerButton(fixture.nativeElement).click();
    const panel = await waitForElement(fixture, document.body, '[data-slot="pickerPanel"]');

    // The picker panel classes flow through the popover's Part Style Map, so
    // the popover recipe's border/background/padding merge away instead of
    // stacking a second outline and a padding ring around the date picker.
    // A plain `[class]` binding would leave both class sets on the element.
    expect(panel.className).toContain('border-0');
    expect(panel.className).toContain('p-0');
    expect(panel.className).toContain('bg-transparent');
    expect(panel.className).not.toContain('p-hell-4');
    expect(panel.className).not.toContain('bg-hell-surface-elevated');
    expect(panel.querySelector('hell-date-picker')).not.toBeNull();

    fixture.destroy();
    for (const leftover of Array.from(document.body.querySelectorAll('[hellPopover]'))) {
      leftover.remove();
    }
  });

  it('inherits hellField label and description wiring for the internal text field', () => {
    const fixture = TestBed.createComponent(DateInputFieldHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    const label = fixture.nativeElement.querySelector('label[hellFieldLabel]');
    const description = fixture.nativeElement.querySelector('[hellFieldDescription]');
    if (!(label instanceof HTMLLabelElement)) throw new Error('Expected field label.');
    if (!(description instanceof HTMLElement)) throw new Error('Expected field description.');

    expect(input.getAttribute('aria-labelledby')).toBe(label.id);
    expect(input.getAttribute('aria-describedby')).toBe(description.id);
    expect(label.getAttribute('for')).toBe(input.id);
  });

  it('emits parsed ISO dates from the text field', () => {
    const fixture = TestBed.createComponent(DateInputHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '2026-04-30';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    const emitted = fixture.componentInstance.dates[0];
    expect(emitted).toBeInstanceOf(Date);
    if (!(emitted instanceof Date)) throw new Error('Expected emitted date.');
    expect(emitted.getFullYear()).toBe(2026);
    expect(emitted.getMonth()).toBe(3);
    expect(emitted.getDate()).toBe(30);
  });

  it('rejects ambiguous free-form dates instead of using Date.parse', () => {
    const fixture = TestBed.createComponent(DateInputHost);
    const host = fixture.componentInstance;
    host.date.set(new Date(2026, 0, 15));
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '04/05/2026';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.dates).toEqual([]);
    expect(input.value).toBe('04/05/2026');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('rejects impossible ISO dates instead of rolling them forward', () => {
    const fixture = TestBed.createComponent(DateInputHost);
    const host = fixture.componentInstance;
    host.date.set(new Date(2026, 1, 15));
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '2026-02-31';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.dates).toEqual([]);
    expect(input.value).toBe('2026-02-31');
  });

  it('rejects one-digit month/day ISO fields', () => {
    const fixture = TestBed.createComponent(DateInputHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '2026-4-3';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.dates).toEqual([]);
    expect(input.value).toBe('2026-4-3');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('keeps invalid typed text visible without emitting', () => {
    const fixture = TestBed.createComponent(DateInputHost);
    const host = fixture.componentInstance;
    host.date.set(new Date(2026, 0, 15));
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = 'not a date';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(input.value).toBe('not a date');

    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.dates).toEqual([]);
    expect(input.value).toBe('not a date');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('surfaces invalid date drafts as Angular validator errors', () => {
    const fixture = TestBed.createComponent(DateInputValidationHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = 'not a date';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.errors).toEqual({ invalidDateInputDraft: true });
    expect(dateInputHost(fixture.nativeElement).getAttribute('data-invalid')).toBe('true');
  });

  it('clears date draft validator errors after a valid commit', () => {
    const fixture = TestBed.createComponent(DateInputValidationHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = 'not a date';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.errors).toEqual({ invalidDateInputDraft: true });

    input.value = '2026-04-20';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.errors).toBeNull();
    expect(formatDate(host.control.value)).toBe('2026-04-20');
    expect(input.value).toBe('2026-04-20');
  });

  it('surfaces out-of-range bound dates as Angular validator errors', () => {
    const fixture = TestBed.createComponent(DateInputValidationHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    host.control.setValue(new Date(2026, 2, 15));
    fixture.detectChanges();

    expect(host.control.errors).toEqual({ outOfRangeDate: true });
  });

  it('emits null when empty text is committed', () => {
    const fixture = TestBed.createComponent(DateInputHost);
    const host = fixture.componentInstance;
    host.date.set(new Date(2026, 0, 15));
    host.min.set(new Date(2026, 3, 1));
    host.max.set(new Date(2026, 3, 30));
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.dates).toEqual([null]);
    expect(input.value).toBe('');
  });

  it('rejects typed dates outside min and max without clamping', () => {
    const fixture = TestBed.createComponent(DateInputHost);
    const host = fixture.componentInstance;
    host.min.set(new Date(2026, 3, 1));
    host.max.set(new Date(2026, 3, 30));
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '2026-03-31';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    input.value = '2026-05-01';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.dates).toEqual([]);
    expect(input.value).toBe('2026-05-01');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('accepts typed dates on min and max boundaries', () => {
    const fixture = TestBed.createComponent(DateInputHost);
    const host = fixture.componentInstance;
    host.min.set(new Date(2026, 3, 1));
    host.max.set(new Date(2026, 3, 30));
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '2026-04-01';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    input.value = '2026-04-30';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(formatDate(host.dates[0])).toBe('2026-04-01');
    expect(formatDate(host.dates[1])).toBe('2026-04-30');
  });

  it('clamps the picker focused date to min when the preset value is before the bounds', async () => {
    const fixture = TestBed.createComponent(DateInputHost);
    const host = fixture.componentInstance;
    host.min.set(new Date(2026, 3, 1));
    host.max.set(new Date(2026, 3, 30));
    host.date.set(new Date(2026, 2, 28));
    fixture.detectChanges();

    triggerButton(fixture.nativeElement).click();
    const panel = await waitForElement(fixture, document.body, '[data-slot="pickerPanel"]');

    expect(panel.querySelector('h2')?.textContent?.trim()).toBe('April 2026');

    fixture.destroy();
    for (const leftover of Array.from(document.body.querySelectorAll('[hellPopover]'))) {
      leftover.remove();
    }
  });

  it('clamps the picker focused date to max when the preset value is after the bounds', async () => {
    const fixture = TestBed.createComponent(DateInputHost);
    const host = fixture.componentInstance;
    host.min.set(new Date(2026, 3, 1));
    host.max.set(new Date(2026, 3, 30));
    host.date.set(new Date(2026, 4, 2));
    fixture.detectChanges();

    triggerButton(fixture.nativeElement).click();
    const panel = await waitForElement(fixture, document.body, '[data-slot="pickerPanel"]');

    expect(panel.querySelector('h2')?.textContent?.trim()).toBe('April 2026');

    fixture.destroy();
    for (const leftover of Array.from(document.body.querySelectorAll('[hellPopover]'))) {
      leftover.remove();
    }
  });

  it('compares default dates by local day instead of exact timestamp', () => {
    expect(
      HELL_DEFAULT_DATE_INPUT_ADAPTER.isSameValue!(
        new Date(2026, 3, 22),
        new Date(2026, 3, 22, 23, 59, 59),
      ),
    ).toBe(true);
    expect(
      HELL_DEFAULT_DATE_INPUT_ADAPTER.isSameValue!(new Date(2026, 3, 22), new Date(2026, 3, 23)),
    ).toBe(false);
  });

  it('coerces external Date values to local midnight', () => {
    const coerced = HELL_DEFAULT_DATE_INPUT_ADAPTER.normalize!(new Date(2026, 3, 22, 16, 45, 30, 12));

    expect(formatDate(coerced)).toBe('2026-04-22');
    expect(coerced?.getHours()).toBe(0);
    expect(coerced?.getMinutes()).toBe(0);
    expect(coerced?.getSeconds()).toBe(0);
    expect(coerced?.getMilliseconds()).toBe(0);
  });

  it('keeps the calendar trigger in the keyboard tab order', () => {
    const fixture = TestBed.createComponent(DateInputHost);
    fixture.detectChanges();

    const trigger = triggerButton(fixture.nativeElement);
    expect(trigger.tabIndex).toBe(0);
    expect(trigger.getAttribute('aria-label')).toBe('Choose date for Report date');
  });

  it('drops in-progress typing when the bound date changes externally', async () => {
    const fixture = TestBed.createComponent(DateInputHost);
    const host = fixture.componentInstance;
    host.date.set(new Date(2026, 0, 15));
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = 'draft';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    host.date.set(new Date(2026, 6, 4));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(input.value).toBe(formatDate(host.date()));
  });

  it('does not emit stale typed text after the bound date changes externally', async () => {
    const fixture = TestBed.createComponent(DateInputHost);
    const host = fixture.componentInstance;
    host.date.set(new Date(2026, 0, 15));
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '2026-08-01';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    host.date.set(new Date(2026, 6, 4));
    await fixture.whenStable();
    fixture.detectChanges();

    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.dates).toEqual([]);
    expect(input.value).toBe(formatDate(host.date()));
  });

  it('uses injected parse and format adapters', () => {
    const fixture = TestBed.createComponent(DateInputCustomAdapterHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    expect(input.value).toBe('');

    input.value = 'today';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(formatDate(fixture.componentInstance.dates[0])).toBe('2026-01-02');
    expect(input.value).toBe('custom:2026');
  });

  it('integrates with reactive forms without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(DateInputFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = textInput(fixture.nativeElement);
    expect(input.value).toBe('2026-04-22');

    host.control.setValue(new Date(2026, 4, 5));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(input.value).toBe('2026-05-05');
    expect(host.dates).toEqual([]);

    input.value = '2026-06-06';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(formatDate(host.control.value)).toBe('2026-06-06');
    expect(host.control.touched).toBe(true);
    expect(formatDate(host.dates[0])).toBe('2026-06-06');
  });

  it('flushes reactive-form changes before touched state on blur', () => {
    const fixture = TestBed.createComponent(DateInputBlurFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = textInput(fixture.nativeElement);
    input.value = '2026-06-06';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(formatDate(host.control.value)).toBe('2026-04-22');

    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(formatDate(host.control.value)).toBe('2026-06-06');
    expect(host.control.touched).toBe(true);
  });

  it('does not revive stale local state after a form write returns to an old base', async () => {
    const fixture = TestBed.createComponent(DateInputFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = textInput(fixture.nativeElement);

    host.control.setValue(null);
    await fixture.whenStable();
    fixture.detectChanges();

    input.value = '2026-07-07';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(input.value).toBe('2026-07-07');

    host.control.setValue(null);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(input.value).toBe('');
  });

  it('uses reactive-form disabled state', () => {
    const fixture = TestBed.createComponent(DateInputFormHost);
    fixture.detectChanges();

    fixture.componentInstance.control.disable();
    fixture.detectChanges();

    expect(textInput(fixture.nativeElement).disabled).toBe(true);
    expect(triggerButton(fixture.nativeElement).disabled).toBe(true);
    expect(dateInputHost(fixture.nativeElement).getAttribute('data-disabled')).toBe('true');
  });
});

function textInput(root: HTMLElement): HTMLInputElement {
  const input = root.querySelector('input');
  if (!(input instanceof HTMLInputElement)) throw new Error('Expected date input.');
  return input;
}

function triggerButton(root: HTMLElement): HTMLButtonElement {
  const trigger = root.querySelector('button[data-slot="trigger"]');
  if (!(trigger instanceof HTMLButtonElement)) throw new Error('Expected date trigger.');
  return trigger;
}

function dateInputHost(root: HTMLElement): HTMLElement {
  const host = root.querySelector('hell-date-input');
  if (!(host instanceof HTMLElement)) throw new Error('Expected date input host.');
  return host;
}

function dateInputComponent(fixture: ComponentFixture<unknown>): HellDateInput {
  const debugElement = fixture.debugElement.query(By.directive(HellDateInput));
  if (!debugElement) throw new Error('Expected HellDateInput component.');
  return debugElement.componentInstance as HellDateInput;
}

function dateInputPartClass(component: HellDateInput, part: HellDateInputPart): string {
  return (component as unknown as { part(part: HellDateInputPart): string }).part(part);
}

async function waitForElement<T extends HTMLElement>(
  fixture: ComponentFixture<unknown>,
  root: ParentNode,
  selector: string,
): Promise<T> {
  const timeout = Date.now() + 10_000;
  while (Date.now() < timeout) {
    fixture.detectChanges();
    const element = root.querySelector<T>(selector);
    if (element) return element;
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }

  throw new Error(`Expected ${selector}.`);
}

function formatDate(date: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear().toString().padStart(4, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
