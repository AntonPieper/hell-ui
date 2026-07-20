import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';
import {
  HELL_DEFAULT_DATE_INPUT_ADAPTER,
  HellDateInput,
  provideHellDateInputAdapter,
} from './date-input';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput],
  template: `
    <input
      id="report-date"
      hellDateInput
      type="text"
      name="reportDate"
      placeholder="YYYY-MM-DD"
      inputmode="numeric"
      autocomplete="off"
      size="sm"
      ui="max-w-64 font-mono"
      aria-label="Report date"
      aria-describedby="report-help external-help"
      aria-labelledby="report-label"
      [value]="value()"
      [min]="min()"
      [max]="max()"
      [required]="required()"
      [disabled]="disabled()"
      [invalid]="invalid()"
      (valueChange)="values.push($event)"
      (input)="inputEvents = inputEvents + 1"
      (change)="changeEvents = changeEvents + 1"
      (keydown)="keys.push($event.key)"
    />
  `,
})
class ControlledHost {
  readonly value = signal<Date | null>(new Date(2026, 3, 22));
  readonly min = signal<Date | null>(null);
  readonly max = signal<Date | null>(null);
  readonly required = signal(false);
  readonly disabled = signal(false);
  readonly invalid = signal(false);
  readonly values: Array<Date | null> = [];
  readonly keys: string[] = [];
  inputEvents = 0;
  changeEvents = 0;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, HellDateInput],
  template: `
    <input
      id="form-date"
      hellDateInput
      aria-label="Form date"
      [formControl]="control"
      (valueChange)="values.push($event)"
    />
  `,
})
class FormHost {
  readonly control = new FormControl<Date | null>(new Date(2026, 3, 22));
  readonly values: Array<Date | null> = [];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput],
  template: `
    <form>
      <input
        hellDateInput
        name="shipDate"
        aria-label="Serialized date"
        [value]="value()"
        (valueChange)="value.set($event)"
      />
    </form>
  `,
})
class NativeFormHost {
  readonly value = signal<Date | null>(new Date(2026, 3, 22));
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, HellDateInput],
  template: `
    <input
      id="validated-date"
      hellDateInput
      required
      aria-label="Validated date"
      [min]="min()"
      [max]="max()"
      [formControl]="control"
    />
  `,
})
class ValidationHost {
  readonly control = new FormControl<Date | null>(null);
  readonly min = signal<Date | null>(new Date(2026, 3, 1));
  readonly max = signal<Date | null>(new Date(2026, 3, 30));
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput, ...HELL_FIELD_IMPORTS],
  template: `
    <div hellField>
      <label hellFieldLabel for="field-date">Invoice date</label>
      <input
        id="field-date"
        hellDateInput
        aria-describedby="external-description"
        aria-labelledby="external-label"
      />
      <div hellFieldDescription>Use the invoice timezone.</div>
    </div>
  `,
})
class FieldHost {}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, HellDateInput, ...HELL_FIELD_IMPORTS],
  template: `
    <div hellField>
      <label hellFieldLabel for="invalid-field-date">Restricted date</label>
      <input id="invalid-field-date" hellDateInput [formControl]="control" />
      <div hellFieldError ngpErrorValidator="restrictedDate">Choose another date.</div>
    </div>
  `,
})
class InvalidFieldHost {
  readonly control = new FormControl<Date | null>(new Date(2026, 3, 22), {
    validators: () => ({ restrictedDate: true }),
  });
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput],
  providers: [
    provideHellDateInputAdapter({
      parseText: (text) =>
        text.trim().toLowerCase() === 'today'
          ? { valid: true, value: new Date(2026, 0, 2) }
          : text.trim()
            ? { valid: false }
            : { valid: true, value: null },
      format: (value) => (value ? `custom:${value.getFullYear()}` : ''),
      normalize: (value) =>
        value instanceof Date && value.getFullYear() >= 2026 ? value : null,
      isSameValue: (left, right) => left?.getTime() === right?.getTime(),
    }),
  ],
  template: `
    <form>
      <input
        hellDateInput
        name="customDate"
        aria-label="Custom date"
        [value]="value()"
        (valueChange)="values.push($event)"
      />
    </form>
  `,
})
class CustomAdapterHost {
  readonly value = signal<Date | null>(new Date(2025, 0, 1));
  readonly values: Array<Date | null> = [];
}

describe('HellDateInput', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ControlledHost,
        FormHost,
        NativeFormHost,
        ValidationHost,
        FieldHost,
        InvalidFieldHost,
        CustomAdapterHost,
      ],
    }).compileComponents();
  });

  it('puts the complete behavior and Input root style on the authored native input', () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.detectChanges();

    const input = dateInput(fixture.nativeElement);
    expect(fixture.nativeElement.querySelector('hell-date-input')).toBeNull();
    expect(input.parentElement).toBe(fixture.nativeElement);
    expect(input.getAttribute('data-slot')).toBe('root');
    expect(input.getAttribute('data-size')).toBe('sm');
    // The consumer ui classes are the test's own contract fixtures; merge
    // semantics are owned centrally by `core/part-class-pipeline.spec.ts`.
    expect(input.classList.contains('max-w-64')).toBe(true);
    expect(input.classList.contains('font-mono')).toBe(true);
  });

  it('preserves native attributes, focus, and input/change event propagation', () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = dateInput(fixture.nativeElement);

    expect(input.id).toBe('report-date');
    expect(input.type).toBe('text');
    expect(input.name).toBe('reportDate');
    expect(input.placeholder).toBe('YYYY-MM-DD');
    expect(input.inputMode).toBe('numeric');
    expect(input.autocomplete).toBe('off');
    expect(input.getAttribute('aria-label')).toBe('Report date');
    expect(input.getAttribute('aria-describedby')).toBe('report-help external-help');
    expect(input.getAttribute('aria-labelledby')).toBe('report-label');

    input.focus();
    expect(input.ownerDocument.activeElement).toBe(input);

    typeText(input, '2026-04-23');
    input.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(host.inputEvents).toBe(1);
    expect(host.changeEvents).toBe(1);
    expect(host.values).toEqual([]);
  });

  it('supports controlled value/valueChange and commits a valid draft on blur', () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = dateInput(fixture.nativeElement);
    expect(input.value).toBe('2026-04-22');

    typeText(input, '2026-05-06');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(formatDate(host.values[0])).toBe('2026-05-06');
    expect(input.value).toBe('2026-05-06');
  });

  it('keeps invalid partial drafts visible and clears invalid state after correction', () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = dateInput(fixture.nativeElement);

    typeText(input, '2026-0');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(host.values).toEqual([]);
    expect(input.value).toBe('2026-0');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('data-invalid')).toBe('true');

    typeText(input, '2026-09-08');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(formatDate(host.values[0])).toBe('2026-09-08');
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(input.getAttribute('data-invalid')).toBeNull();
  });

  it('commits an empty draft as a nullable clear', () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = dateInput(fixture.nativeElement);

    typeText(input, '');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.values).toEqual([null]);
    expect(input.value).toBe('');
  });

  it('commits only Enter without cancelling native keyboard or form behavior', () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = dateInput(fixture.nativeElement);
    typeText(input, '2026-10-09');

    const arrow = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(arrow);
    expect(arrow.defaultPrevented).toBe(false);
    expect(host.values).toEqual([]);

    const enter = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(enter);
    fixture.detectChanges();
    expect(enter.defaultPrevented).toBe(false);
    expect(formatDate(host.values[0])).toBe('2026-10-09');
    expect(host.keys).toEqual(['ArrowLeft', 'Enter']);
  });

  it('synchronously canonicalizes native form serialization after blur and Enter', () => {
    const fixture = TestBed.createComponent(NativeFormHost);
    fixture.detectChanges();
    const input = dateInput(fixture.nativeElement);
    const form = fixture.nativeElement.querySelector('form');
    if (!(form instanceof HTMLFormElement)) throw new Error('Expected native form.');

    expect(new FormData(form).get('shipDate')).toBe('2026-04-22');

    typeText(input, ' 2026-07-08 ');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    expect(input.value).toBe('2026-07-08');
    expect(new FormData(form).get('shipDate')).toBe('2026-07-08');

    typeText(input, ' 2026-08-09 ');
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    expect(input.value).toBe('2026-08-09');
    expect(new FormData(form).get('shipDate')).toBe('2026-08-09');
  });

  it('preserves an active draft across equivalent controlled writes', async () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = dateInput(fixture.nativeElement);

    typeText(input, '2026-04');
    host.value.set(new Date(2026, 3, 22, 23, 59));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(input.value).toBe('2026-04');
  });

  it('synchronizes a genuinely changed controlled value and rejects the stale draft', async () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = dateInput(fixture.nativeElement);

    typeText(input, '2026-08-01');
    host.value.set(new Date(2026, 6, 4));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('2026-07-04');

    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(host.values).toEqual([]);
    expect(input.value).toBe('2026-07-04');
  });

  it('does not resurrect a discarded draft when the external value later returns', async () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = dateInput(fixture.nativeElement);

    typeText(input, '2026-08-01');
    host.value.set(new Date(2026, 6, 4));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('2026-07-04');

    host.value.set(new Date(2026, 3, 22));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('2026-04-22');
  });

  it('reflects required, disabled, invalid, and date bounds on the native host', () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = dateInput(fixture.nativeElement);

    host.required.set(true);
    host.disabled.set(true);
    host.invalid.set(true);
    host.min.set(new Date(2026, 3, 1));
    host.max.set(new Date(2026, 3, 30));
    fixture.detectChanges();

    expect(input.required).toBe(true);
    expect(input.disabled).toBe(true);
    expect(input.getAttribute('min')).toBe('2026-04-01');
    expect(input.getAttribute('max')).toBe('2026-04-30');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.hasAttribute('data-disabled')).toBe(true);
    expect(input.getAttribute('data-required')).toBe('true');
  });

  it('integrates with CVA without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = dateInput(fixture.nativeElement);
    expect(input.value).toBe('2026-04-22');

    host.control.setValue(new Date(2026, 4, 5));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('2026-05-05');
    expect(host.values).toEqual([]);

    typeText(input, '2026-06-06');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(formatDate(host.control.value)).toBe('2026-06-06');
    expect(formatDate(host.values[0])).toBe('2026-06-06');
    expect(host.control.touched).toBe(true);
  });

  it('preserves a form draft across an equivalent CVA write but replaces it on change', async () => {
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = dateInput(fixture.nativeElement);

    typeText(input, '2026-04');
    host.control.setValue(new Date(2026, 3, 22, 18, 30));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('2026-04');

    host.control.setValue(new Date(2026, 8, 12));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('2026-09-12');
  });

  it('propagates disabled state from Angular forms to the native input', () => {
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = dateInput(fixture.nativeElement);

    host.control.disable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
    expect(input.hasAttribute('data-disabled')).toBe(true);
  });

  it('validates required, min, max, malformed drafts, and correction', () => {
    const fixture = TestBed.createComponent(ValidationHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = dateInput(fixture.nativeElement);

    expect(host.control.errors).toEqual({ required: true });
    expect(input.getAttribute('aria-invalid')).toBe('true');

    host.control.setValue(new Date(2026, 2, 31));
    fixture.detectChanges();
    expect(host.control.errors).toEqual({ outOfRangeDate: true });

    host.control.setValue(new Date(2026, 3, 15));
    fixture.detectChanges();
    expect(host.control.errors).toBeNull();

    typeText(input, '2026-02-31');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(host.control.errors).toEqual({ invalidDateInputDraft: true });
    expect(input.value).toBe('2026-02-31');

    typeText(input, '2026-04-30');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(host.control.errors).toBeNull();
    expect(formatDate(host.control.value)).toBe('2026-04-30');
  });

  it('wires Field label and description ids on the same native input', () => {
    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();
    const input = dateInput(fixture.nativeElement);
    const label = fixture.nativeElement.querySelector('label[hellFieldLabel]');
    const description = fixture.nativeElement.querySelector('[hellFieldDescription]');
    if (!(label instanceof HTMLLabelElement)) throw new Error('Expected Field label.');
    if (!(description instanceof HTMLElement)) throw new Error('Expected Field description.');

    expect(label.htmlFor).toBe(input.id);
    expect(new Set(input.getAttribute('aria-labelledby')?.split(' '))).toEqual(
      new Set(['external-label', label.id]),
    );
    expect(new Set(input.getAttribute('aria-describedby')?.split(' '))).toEqual(
      new Set(['external-description', description.id]),
    );
  });

  it('reflects enclosing Field validation and associates its active error', async () => {
    const fixture = TestBed.createComponent(InvalidFieldHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const input = dateInput(fixture.nativeElement);
    const error = fixture.nativeElement.querySelector('[hellFieldError]');
    if (!(error instanceof HTMLElement)) throw new Error('Expected Field error.');

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(error.id);
  });

  it('uses injected parse, format, normalize, and nullable-clear adapter behavior', () => {
    const fixture = TestBed.createComponent(CustomAdapterHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = dateInput(fixture.nativeElement);
    const form = fixture.nativeElement.querySelector('form');
    if (!(form instanceof HTMLFormElement)) throw new Error('Expected custom adapter form.');
    expect(input.value).toBe('');

    typeText(input, 'today');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    expect(formatDate(host.values[0])).toBe('2026-01-02');
    expect(input.value).toBe('custom:2026');
    expect(new FormData(form).get('customDate')).toBe('custom:2026');

    typeText(input, '');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    expect(host.values[1]).toBeNull();
    expect(input.value).toBe('');
    expect(new FormData(form).get('customDate')).toBe('');
  });

  it('compares and normalizes default dates by local calendar day', () => {
    expect(
      HELL_DEFAULT_DATE_INPUT_ADAPTER.isSameValue!(
        new Date(2026, 3, 22),
        new Date(2026, 3, 22, 23, 59, 59),
      ),
    ).toBe(true);
    expect(
      HELL_DEFAULT_DATE_INPUT_ADAPTER.isSameValue!(
        new Date(2026, 3, 22),
        new Date(2026, 3, 23),
      ),
    ).toBe(false);

    const normalized = HELL_DEFAULT_DATE_INPUT_ADAPTER.normalize!(
      new Date(2026, 3, 22, 16, 45, 30, 12),
    );
    expect(formatDate(normalized)).toBe('2026-04-22');
    expect(normalized?.getHours()).toBe(0);
    expect(normalized?.getMinutes()).toBe(0);
    expect(normalized?.getSeconds()).toBe(0);
    expect(normalized?.getMilliseconds()).toBe(0);
  });
});

function dateInput(root: HTMLElement): HTMLInputElement {
  const input = root.querySelector('input[hellDateInput]');
  if (!(input instanceof HTMLInputElement)) throw new Error('Expected input[hellDateInput].');
  return input;
}

function typeText(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  const year = date.getFullYear().toString().padStart(4, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
