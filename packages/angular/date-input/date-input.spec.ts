import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormsModule,
  NgModel,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  FormField,
  disabled as disabledSchema,
  form,
  maxDate,
  minDate,
} from '@angular/forms/signals';

import { HELL_FIELD_IMPORTS } from 'hell-ui/field';
import {
  HELL_DEFAULT_DATE_INPUT_ADAPTER,
  HELL_DEFAULT_DATE_INPUT_FORMAT,
  HellDateInput,
  provideHellDateInputAdapter,
  provideHellDateInputFormat,
} from './date-input';

const ISO_CONTEXT = { format: HELL_DEFAULT_DATE_INPUT_FORMAT };

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
  imports: [HellDateInput],
  template: `
    <input
      hellDateInput
      aria-label="Two-way date"
      [(value)]="value"
      (valueChange)="values.push($event)"
    />
  `,
})
class TwoWayHost {
  readonly value = signal<Date | null>(new Date(2026, 3, 22));
  readonly values: Array<Date | null> = [];
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
  imports: [FormsModule, HellDateInput],
  template: `
    <input
      hellDateInput
      aria-label="Model date"
      [(ngModel)]="value"
      (valueChange)="values.push($event)"
    />
  `,
})
class NgModelHost {
  readonly value = signal<Date | null>(new Date(2026, 3, 22));
  readonly model = viewChild.required(NgModel);
  readonly values: Array<Date | null> = [];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, HellDateInput],
  template: `
    <input
      id="signal-date"
      hellDateInput
      aria-label="Signal date"
      [formField]="deliveryForm.date"
      (valueChange)="values.push($event)"
    />
  `,
})
class SignalFormsHost {
  readonly formDisabled = signal(false);
  readonly model = signal<{ date: Date | null }>({ date: new Date(2026, 3, 22) });
  readonly deliveryForm = form(this.model, (path) => {
    disabledSchema(path.date, () => this.formDisabled());
    minDate(path.date, new Date(2026, 3, 1));
    maxDate(path.date, new Date(2026, 3, 30));
  });
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
      aria-label="Validated date"
      [min]="min()"
      [max]="max()"
      [formControl]="control"
    />
  `,
})
class ValidationHost {
  readonly control = new FormControl<Date | null>(null, {
    validators: [Validators.required],
  });
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

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput],
  providers: [provideHellDateInputFormat('DD.MM.YYYY')],
  template: `
    <input
      hellDateInput
      aria-label="Scoped format date"
      [value]="value()"
      [min]="min"
      [max]="max"
      [format]="format()"
      (valueChange)="values.push($event)"
    />
    <input
      hellDateInput
      aria-label="Overridden format date"
      format="MM/DD/YYYY"
      [value]="value()"
      (valueChange)="overriddenValues.push($event)"
    />
    <input
      hellDateInput
      aria-label="Authored placeholder date"
      placeholder="Invoice date"
      [value]="value()"
    />
    <input
      hellDateInput
      aria-label="Opted out date"
      placeholder=""
      [value]="value()"
    />
    <input hellDateInput data-unlabelled [value]="value()" />
    <input hellDateInput data-blank-label aria-label="   " [value]="value()" />
  `,
})
class ScopedFormatHost {
  readonly value = signal<Date | null>(new Date(2026, 3, 22));
  readonly format = signal<string | undefined>(undefined);
  readonly min = new Date(2026, 3, 1);
  readonly max = new Date(2026, 3, 30);
  readonly values: Array<Date | null> = [];
  readonly overriddenValues: Array<Date | null> = [];
}

/** No format provider: only the local input can configure one. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput],
  template: `
    <input
      hellDateInput
      aria-label="Local format date"
      [value]="value()"
      [format]="format()"
    />
  `,
})
class LocalFormatOnlyHost {
  readonly value = signal<Date | null>(new Date(2026, 3, 22));
  readonly format = signal<string | undefined>(undefined);
}

/** A configured format plus an adapter that accepts text the format cannot describe. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput],
  providers: [
    provideHellDateInputFormat('DD.MM.YYYY'),
    provideHellDateInputAdapter({
      parseText: (text) =>
        text.trim().toLowerCase() === 'today'
          ? { valid: true, value: new Date(2026, 0, 2) }
          : text.trim()
            ? { valid: false }
            : { valid: true, value: null },
      format: (value) => (value ? `custom:${value.getFullYear()}` : ''),
    }),
  ],
  template: `<input hellDateInput aria-label="Silent adapter date" />`,
})
class SilentAdapterFormatHost {}

/** A configured format plus an adapter that supplies its own hint. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput],
  providers: [
    provideHellDateInputFormat('DD.MM.YYYY'),
    provideHellDateInputAdapter({
      parseText: (text) =>
        text.trim().toLowerCase() === 'today'
          ? { valid: true, value: new Date(2026, 0, 2) }
          : text.trim()
            ? { valid: false }
            : { valid: true, value: null },
      format: (value) => (value ? `custom:${value.getFullYear()}` : ''),
      placeholderHint: () => 'today',
    }),
  ],
  template: `<input hellDateInput aria-label="Hinting adapter date" />`,
})
class HintingAdapterFormatHost {}

/**
 * A configured format whose inputs carry no `aria-label`: the Field supplies
 * `aria-labelledby`, and the plain `<label for>` supplies `host.labels`. Both
 * author an explicit `id`, because a Field-composed Date Input without one
 * currently ends up with NgpInput's generated id on the element while the label
 * targets the id `setFormControl` registered, leaving `for` dangling.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellDateInput, ...HELL_FIELD_IMPORTS],
  providers: [provideHellDateInputFormat('DD.MM.YYYY')],
  template: `
    <div hellField>
      <label hellFieldLabel for="field-labelled-date">Field labelled date</label>
      <input id="field-labelled-date" hellDateInput [value]="value()" />
    </div>
    <label for="native-labelled-date">Native labelled date</label>
    <input id="native-labelled-date" hellDateInput [value]="value()" />
    <span id="referenced-date-label">Referenced date</span>
    <input
      id="referenced-labelled-date"
      hellDateInput
      aria-labelledby="referenced-date-label"
      [value]="value()"
    />
  `,
})
class LabelledFormatHost {
  readonly value = signal<Date | null>(new Date(2026, 3, 22));
}

describe('HellDateInput', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ControlledHost,
        TwoWayHost,
        FormHost,
        NgModelHost,
        SignalFormsHost,
        NativeFormHost,
        ValidationHost,
        FieldHost,
        InvalidFieldHost,
        CustomAdapterHost,
        ScopedFormatHost,
        LocalFormatOnlyHost,
        SilentAdapterFormatHost,
        HintingAdapterFormatHost,
        LabelledFormatHost,
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
    // semantics are owned centrally by `internal/core/part-class-pipeline.spec.ts`.
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

  it('synchronizes two-way binding through one value authority without duplicate commits', async () => {
    const fixture = TestBed.createComponent(TwoWayHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = dateInput(fixture.nativeElement);
    expect(input.value).toBe('2026-04-22');

    // External parent write flows in without echoing a change event.
    host.value.set(new Date(2026, 4, 6));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('2026-05-06');
    expect(host.values).toEqual([]);

    // One user commit updates parent state and emits exactly one event.
    typeText(input, '2026-06-07');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(formatDate(host.value())).toBe('2026-06-07');
    expect(host.values.length).toBe(1);
    expect(formatDate(host.values[0])).toBe('2026-06-07');
    expect(input.value).toBe('2026-06-07');
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

  it('integrates with Reactive Forms without echoing programmatic writes', async () => {
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
    expect(host.values.length).toBe(1);
    expect(host.control.touched).toBe(true);
  });

  it('preserves a form draft across an equivalent form write but replaces it on change', async () => {
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

  it('propagates disabled state from Angular forms to the native input', async () => {
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = dateInput(fixture.nativeElement);

    host.control.disable();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
    expect(input.hasAttribute('data-disabled')).toBe(true);
  });

  it('integrates with template-driven forms through ngModel', async () => {
    const fixture = TestBed.createComponent(NgModelHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = dateInput(fixture.nativeElement);
    expect(input.value).toBe('2026-04-22');
    expect(host.values).toEqual([]);

    // Enter commits without touching; blur marks the model touched.
    typeText(input, '2026-05-06');
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(formatDate(host.value())).toBe('2026-05-06');
    expect(host.values.length).toBe(1);
    expect(host.model().touched).toBe(false);

    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(host.model().touched).toBe(true);

    host.value.set(new Date(2026, 8, 12));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('2026-09-12');
    expect(host.values.length).toBe(1);
  });

  it('participates in Signal Forms as a FormValueControl through formField', async () => {
    const fixture = TestBed.createComponent(SignalFormsHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = dateInput(fixture.nativeElement);
    expect(input.value).toBe('2026-04-22');
    // The field's minDate()/maxDate() validator metadata drives the input's
    // own bounds, including the stable native attributes.
    expect(input.getAttribute('min')).toBe('2026-04-01');
    expect(input.getAttribute('max')).toBe('2026-04-30');

    // Form-driven writes flow in without echoing an interaction commit.
    host.deliveryForm.date().value.set(new Date(2026, 3, 25));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('2026-04-25');
    expect(host.values).toEqual([]);
    expect(host.deliveryForm.date().dirty()).toBe(false);

    // One user commit updates the field and the model exactly once.
    typeText(input, '2026-04-28');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(formatDate(host.deliveryForm.date().value())).toBe('2026-04-28');
    expect(formatDate(host.model().date)).toBe('2026-04-28');
    expect(host.values.length).toBe(1);
    expect(host.deliveryForm.date().dirty()).toBe(true);
    expect(host.deliveryForm.date().touched()).toBe(true);
  });

  it('reports parse failures to the Signal Forms field through transformedValue', async () => {
    const fixture = TestBed.createComponent(SignalFormsHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = dateInput(fixture.nativeElement);

    // A malformed committed draft stays editable and never becomes a value.
    typeText(input, '2026-02-31');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('2026-02-31');
    expect(formatDate(host.deliveryForm.date().value())).toBe('2026-04-22');
    expect(host.values).toEqual([]);
    expect(errorKinds(host)).toContain('invalidDateInputDraft');
    expect(input.getAttribute('aria-invalid')).toBe('true');

    // Out-of-range typed text is also an invalid draft, not a commit.
    typeText(input, '2026-05-15');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('2026-05-15');
    expect(formatDate(host.deliveryForm.date().value())).toBe('2026-04-22');
    expect(errorKinds(host)).toContain('invalidDateInputDraft');

    // A corrected commit clears the parse error and commits once.
    typeText(input, '2026-04-29');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(formatDate(host.deliveryForm.date().value())).toBe('2026-04-29');
    expect(host.values.length).toBe(1);
    expect(errorKinds(host)).not.toContain('invalidDateInputDraft');
    expect(input.getAttribute('aria-invalid')).toBeNull();

    // An empty commit is a nullable clear through the same authority.
    typeText(input, '');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.deliveryForm.date().value()).toBeNull();
    expect(host.model().date).toBeNull();
    expect(host.values).toEqual([expect.anything(), null]);

    // Field-driven disabled state reaches the native input.
    host.formDisabled.set(true);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
    expect(input.hasAttribute('data-disabled')).toBe(true);
  });

  it('keeps classic validation form-owned while drafts stay visual-only invalid state', async () => {
    const fixture = TestBed.createComponent(ValidationHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = dateInput(fixture.nativeElement);

    // The control's own required validator drives errors and the reserved
    // required input, so the missing value is visible on the native host.
    expect(host.control.errors).toEqual({ required: true });
    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');

    // Out-of-range external writes keep the visual invalid contract.
    host.control.setValue(new Date(2026, 2, 15));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.control.hasError('required')).toBe(false);
    expect(input.getAttribute('aria-invalid')).toBe('true');

    host.control.setValue(new Date(2026, 3, 15));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.control.errors).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBeNull();

    // A malformed committed draft never commits and stays a visual invalid
    // state; classic controls receive no directive-owned error for it.
    typeText(input, '2026-02-31');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.control.errors).toBeNull();
    expect(formatDate(host.control.value)).toBe('2026-04-15');
    expect(input.value).toBe('2026-02-31');
    expect(input.getAttribute('aria-invalid')).toBe('true');

    typeText(input, '2026-04-30');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.control.errors).toBeNull();
    expect(formatDate(host.control.value)).toBe('2026-04-30');
    expect(input.getAttribute('aria-invalid')).toBeNull();
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
      ISO_CONTEXT,
    );
    expect(formatDate(normalized)).toBe('2026-04-22');
    expect(normalized?.getHours()).toBe(0);
    expect(normalized?.getMinutes()).toBe(0);
    expect(normalized?.getSeconds()).toBe(0);
    expect(normalized?.getMilliseconds()).toBe(0);
  });

  it('parses, displays, bounds, and hints the placeholder in the provided format', async () => {
    const fixture = TestBed.createComponent(ScopedFormatHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = dateInputLabelled(fixture.nativeElement, 'Scoped format date');

    expect(input.value).toBe('22.04.2026');
    expect(input.placeholder).toBe('DD.MM.YYYY');
    expect(input.getAttribute('min')).toBe('01.04.2026');
    expect(input.getAttribute('max')).toBe('30.04.2026');

    // Text in the configured format commits the same `Date | null` contract.
    typeText(input, '06.04.2026');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(formatDate(host.values[0])).toBe('2026-04-06');
    expect(input.value).toBe('06.04.2026');

    // The configured bounds still reject an out-of-range day.
    typeText(input, '06.05.2026');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(host.values.length).toBe(1);
    expect(input.getAttribute('aria-invalid')).toBe('true');

    // Text in the default ISO format no longer parses under this format.
    typeText(input, '2026-04-07');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(host.values.length).toBe(1);
    expect(input.value).toBe('2026-04-07');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('lets a local format input win over the provider and follow later changes', async () => {
    const fixture = TestBed.createComponent(ScopedFormatHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const scoped = dateInputLabelled(fixture.nativeElement, 'Scoped format date');
    const overridden = dateInputLabelled(fixture.nativeElement, 'Overridden format date');

    expect(overridden.value).toBe('04/22/2026');
    expect(overridden.placeholder).toBe('MM/DD/YYYY');

    typeText(overridden, '05/06/2026');
    overridden.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(formatDate(host.overriddenValues[0])).toBe('2026-05-06');

    // A format change re-renders the committed value and the hint.
    host.format.set('YYYY/MM/DD');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(scoped.value).toBe('2026/04/22');
    expect(scoped.placeholder).toBe('YYYY/MM/DD');
    expect(scoped.getAttribute('min')).toBe('2026/04/01');
  });

  it('never replaces a consumer-authored placeholder', async () => {
    const fixture = TestBed.createComponent(ScopedFormatHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = dateInputLabelled(fixture.nativeElement, 'Authored placeholder date');
    expect(input.placeholder).toBe('Invoice date');
    expect(input.value).toBe('22.04.2026');
  });

  it('treats an authored empty placeholder as the documented opt-out', async () => {
    const fixture = TestBed.createComponent(ScopedFormatHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // The attribute is present but empty: emptiness, not absence, is what the
    // opt-out rests on, so the hint must not fill it in.
    const input = dateInputLabelled(fixture.nativeElement, 'Opted out date');
    expect(input.getAttribute('placeholder')).toBe('');
    expect(input.value).toBe('22.04.2026');
  });

  it('writes the hint for a Field-labelled input that has no aria-label', async () => {
    const fixture = TestBed.createComponent(LabelledFormatHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // The Field's label ids reach the input through `aria-labelledby`, which is
    // the naming markup the gate must accept — this is the documented Field
    // composition, so withholding the hint here would be the real regression.
    const input = dateInputById(fixture.nativeElement, 'field-labelled-date');
    expect(input.getAttribute('aria-label')).toBeNull();
    expect(input.getAttribute('aria-labelledby')).toBeTruthy();
    expect(input.placeholder).toBe('DD.MM.YYYY');
  });

  it('writes the hint for an input named by a plain associated label', async () => {
    const fixture = TestBed.createComponent(LabelledFormatHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // No `aria-label` and no Field: only the associated `<label for>` can
    // satisfy the gate here.
    const input = dateInputById(fixture.nativeElement, 'native-labelled-date');
    expect(input.getAttribute('aria-label')).toBeNull();
    expect(input.getAttribute('aria-labelledby')).toBeNull();
    expect(input.labels?.length).toBe(1);
    expect(input.placeholder).toBe('DD.MM.YYYY');
  });

  it('writes the hint for an input named only by aria-labelledby', async () => {
    const fixture = TestBed.createComponent(LabelledFormatHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // No `aria-label` and no `<label>` element at all, so the merged
    // `aria-labelledby` — the same channel an enclosing Field writes through —
    // is the only clause that can satisfy the gate.
    const input = dateInputById(fixture.nativeElement, 'referenced-labelled-date');
    expect(input.getAttribute('aria-label')).toBeNull();
    expect(input.labels?.length ?? 0).toBe(0);
    expect(input.getAttribute('aria-labelledby')).toBe('referenced-date-label');
    expect(input.placeholder).toBe('DD.MM.YYYY');
  });

  it('writes no placeholder onto an input that authors no naming markup', async () => {
    const fixture = TestBed.createComponent(ScopedFormatHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // A hint would become this input's accessible name and hide the missing
    // label from tooling, so a configured format is not enough to write one.
    const input = fixture.nativeElement.querySelector('input[data-unlabelled]');
    if (!(input instanceof HTMLInputElement)) throw new Error('Expected unlabelled date input.');
    expect(input.value).toBe('22.04.2026');
    expect(input.hasAttribute('placeholder')).toBe(false);

    // A whitespace-only `aria-label` names nothing, so it is not naming markup.
    const blank = fixture.nativeElement.querySelector('input[data-blank-label]');
    if (!(blank instanceof HTMLInputElement)) throw new Error('Expected blank-label date input.');
    expect(blank.getAttribute('aria-label')).toBe('   ');
    expect(blank.hasAttribute('placeholder')).toBe(false);
  });

  it('rejects a provided format that is not built from YYYY, MM, and DD', () => {
    expect(() => provideHellDateInputFormat('DD.MM')).toThrow(/Unsupported hell date input format/);
    expect(() => provideHellDateInputFormat('DD.MM.YY')).toThrow(
      /Unsupported hell date input format/,
    );
    // Leftover token letters would be formatted and typed literally.
    expect(() => provideHellDateInputFormat('YYYYY-MM-DD')).toThrow(
      /Unsupported hell date input format/,
    );
    expect(() => provideHellDateInputFormat('YYYY-MM-DDD')).toThrow(
      /Unsupported hell date input format/,
    );
    // Edge whitespace cannot round-trip, because parsing trims first.
    expect(() => provideHellDateInputFormat(' YYYY-MM-DD ')).toThrow(
      /Unsupported hell date input format/,
    );
  });

  it('rejects an unsupported local format at the binding, not during rendering', async () => {
    const fixture = TestBed.createComponent(LocalFormatOnlyHost);
    const host = fixture.componentInstance;
    // An empty value with no bounds is the case where nothing renders through
    // the format: display, min, and max all short-circuit before compiling, so
    // only validating the binding itself can reject the pattern at all.
    host.value.set(null);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(dateInputLabelled(fixture.nativeElement, 'Local format date').value).toBe('');

    host.format.set('DD.MM');
    expect(() => fixture.detectChanges()).toThrow(/Unsupported hell date input format/);
  });

  it('treats an empty local format as unset and falls through to the provider', async () => {
    const fixture = TestBed.createComponent(ScopedFormatHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = dateInputLabelled(fixture.nativeElement, 'Scoped format date');

    host.format.set('YYYY/MM/DD');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('2026/04/22');

    host.format.set('');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('22.04.2026');
    expect(input.placeholder).toBe('DD.MM.YYYY');
  });

  it('writes no placeholder until a format is configured', async () => {
    const fixture = TestBed.createComponent(TwoWayHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = dateInput(fixture.nativeElement);
    expect(input.value).toBe('2026-04-22');
    expect(input.hasAttribute('placeholder')).toBe(false);
  });

  it('adds and removes its own placeholder as a local format comes and goes', async () => {
    const fixture = TestBed.createComponent(LocalFormatOnlyHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = dateInputLabelled(fixture.nativeElement, 'Local format date');
    expect(input.value).toBe('2026-04-22');
    expect(input.hasAttribute('placeholder')).toBe(false);

    host.format.set('DD.MM.YYYY');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('22.04.2026');
    expect(input.placeholder).toBe('DD.MM.YYYY');

    // Back to the unconfigured default: the hint would no longer be true.
    host.format.set(undefined);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('2026-04-22');
    expect(input.hasAttribute('placeholder')).toBe(false);
  });

  it('writes no placeholder when the adapter supplies no hint', async () => {
    const fixture = TestBed.createComponent(SilentAdapterFormatHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // The adapter accepts only `today`, so the field must not advertise a
    // format pattern it would reject.
    const input = dateInputLabelled(fixture.nativeElement, 'Silent adapter date');
    expect(input.hasAttribute('placeholder')).toBe(false);
  });

  it('writes the adapter placeholder hint instead of the raw format', async () => {
    const fixture = TestBed.createComponent(HintingAdapterFormatHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const input = dateInputLabelled(fixture.nativeElement, 'Hinting adapter date');
    expect(input.placeholder).toBe('today');
  });

  it('hints the default adapter with the context format', () => {
    expect(HELL_DEFAULT_DATE_INPUT_ADAPTER.placeholderHint!({ format: 'DD.MM.YYYY' })).toBe(
      'DD.MM.YYYY',
    );
    expect(HELL_DEFAULT_DATE_INPUT_ADAPTER.placeholderHint!(ISO_CONTEXT)).toBe('YYYY-MM-DD');
  });
});

function dateInput(root: HTMLElement): HTMLInputElement {
  const input = root.querySelector('input[hellDateInput]');
  if (!(input instanceof HTMLInputElement)) throw new Error('Expected input[hellDateInput].');
  return input;
}

function dateInputById(root: HTMLElement, id: string): HTMLInputElement {
  const input = root.querySelector(`input[hellDateInput]#${id}`);
  if (!(input instanceof HTMLInputElement)) throw new Error(`Expected date input #${id}.`);
  return input;
}

function dateInputLabelled(root: HTMLElement, label: string): HTMLInputElement {
  const input = root.querySelector(`input[hellDateInput][aria-label="${label}"]`);
  if (!(input instanceof HTMLInputElement)) throw new Error(`Expected date input "${label}".`);
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

function errorKinds(host: SignalFormsHost): string[] {
  return host.deliveryForm
    .date()
    .errors()
    .map((error) => error.kind);
}
