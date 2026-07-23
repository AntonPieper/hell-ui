import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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
  max as maxSchema,
  min as minSchema,
} from '@angular/forms/signals';
import { vi } from 'vitest';

import { provideHellLabels } from 'hell-ui/core';
import { HELL_FIELD_IMPORTS } from 'hell-ui/field';

import {
  HELL_DEFAULT_NUMBER_INPUT_ADAPTER,
  HELL_NUMBER_INPUT_IMPORTS,
  HELL_NUMBER_INPUT_LABELS,
  HellNumberInput,
  HellNumberStep,
  provideHellNumberInputAdapter,
} from './number-input';
import { expectUiRouting, sortClasses } from '../spec-helpers';

@Component({
  imports: [HellNumberInput, HellNumberStep],
  template: `
    <input
      #number="hellNumberInput"
      id="report-port"
      name="port"
      type="number"
      placeholder="Port"
      autocomplete="off"
      hellNumberInput
      aria-label="Listen port"
      aria-describedby="port-help port-error"
      aria-labelledby="port-label"
      [attr.aria-valuetext]="valueText()"
      [value]="value()"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [stepMultiplier]="stepMultiplier()"
      [integer]="integer()"
      [required]="required()"
      [disabled]="disabled()"
      [invalid]="invalid()"
      (valueChange)="onValue($event)"
    />
    <button
      data-testid="increment"
      hellNumberStep="increment"
      [hellNumberStepFor]="number"
    >+</button>
    <button
      data-testid="decrement"
      hellNumberStep="decrement"
      [hellNumberStepFor]="number"
    >−</button>
  `,
})
class NumberInputHost {
  readonly value = signal<number | null>(null);
  readonly min = signal<number | null>(null);
  readonly max = signal<number | null>(null);
  readonly step = signal(1);
  readonly stepMultiplier = signal(10);
  readonly integer = signal(false);
  readonly required = signal(false);
  readonly disabled = signal(false);
  readonly invalid = signal(false);
  readonly valueText = signal<string | null>(null);
  readonly values: Array<number | null> = [];

  onValue(value: number | null): void {
    this.values.push(value);
    this.value.set(value);
  }
}

@Component({
  imports: [HellNumberInput],
  template: `
    <input
      hellNumberInput
      aria-label="Two-way number"
      [(value)]="value"
      (valueChange)="values.push($event)"
    />
  `,
})
class NumberInputTwoWayHost {
  readonly value = signal<number | null>(10);
  readonly values: Array<number | null> = [];
}

@Component({
  imports: [FormsModule, HellNumberInput],
  template: `
    <input
      hellNumberInput
      aria-label="Model number"
      [(ngModel)]="value"
      (valueChange)="values.push($event)"
    />
  `,
})
class NumberInputNgModelHost {
  readonly value = signal<number | null>(10);
  readonly model = viewChild.required(NgModel);
  readonly values: Array<number | null> = [];
}

@Component({
  imports: [FormField, HellNumberInput, HellNumberStep],
  template: `
    <input
      #number="hellNumberInput"
      id="signal-number"
      hellNumberInput
      aria-label="Signal number"
      [formField]="portForm.port"
      (valueChange)="values.push($event)"
    />
    <button data-testid="signal-increment" hellNumberStep="increment" [hellNumberStepFor]="number">
      +
    </button>
  `,
})
class NumberInputSignalFormsHost {
  readonly formDisabled = signal(false);
  readonly model = signal<{ port: number | null }>({ port: 8080 });
  readonly portForm = form(this.model, (path) => {
    disabledSchema(path.port, () => this.formDisabled());
    minSchema(path.port, 1);
    maxSchema(path.port, 65535);
  });
  readonly values: Array<number | null> = [];
}

@Component({
  imports: [HellNumberInput, HellNumberStep],
  template: `
    <input
      #number="hellNumberInput"
      hellNumberInput
      aria-label="Styled number"
      ui="max-w-[20rem] border-hell-danger"
    />
    <button
      hellNumberStep="increment"
      [hellNumberStepFor]="number"
      ui="bg-hell-danger text-hell-danger-foreground"
    >+</button>

    <input #plain="hellNumberInput" hellNumberInput aria-label="Plain number" />
    <button id="plain-step" hellNumberStep="increment" [hellNumberStepFor]="plain">+</button>
  `,
})
class NumberInputStyleHost {}

@Component({
  imports: [HellNumberInput, HellNumberStep, ...HELL_FIELD_IMPORTS],
  template: `
    <div hellField>
      <label id="port-field-label" hellFieldLabel for="port-field-control">Listen port</label>
      <input
        #number="hellNumberInput"
        id="port-field-control"
        hellNumberInput
        aria-describedby="explicit-help"
      />
      <button hellNumberStep="increment" [hellNumberStepFor]="number">+</button>
      <div id="port-field-help" hellFieldDescription>TCP port between 1 and 65535.</div>
    </div>
  `,
})
class NumberInputFieldHost {}

@Component({
  imports: [HellNumberInput, HellNumberStep],
  template: `
    <label for="native-number">Retry count</label>
    <input #number="hellNumberInput" id="native-number" hellNumberInput />
    <button hellNumberStep="increment" [hellNumberStepFor]="number">+</button>
  `,
})
class NumberInputNativeLabelHost {}

@Component({
  imports: [HellNumberInput, HellNumberStep],
  template: `
    <label id="dynamic-number-label" for="dynamic-number">{{ label() }}</label>
    <input
      #number="hellNumberInput"
      id="dynamic-number"
      hellNumberInput
      aria-labelledby="dynamic-number-label"
      [attr.aria-label]="ariaLabel()"
      [attr.type]="type()"
    />
    <button hellNumberStep="increment" [hellNumberStepFor]="number">+</button>
  `,
})
class NumberInputDynamicNameHost {
  readonly label = signal('Retry count');
  readonly ariaLabel = signal('Fallback count');
  readonly type = signal('text');
}

@Component({
  imports: [ReactiveFormsModule, HellNumberInput],
  template: `
    <input
      hellNumberInput
      aria-label="Form port"
      [formControl]="control"
      [min]="1"
      [max]="65535"
      (valueChange)="values.push($event)"
    />
  `,
})
class NumberInputFormHost {
  readonly control = new FormControl<number | null>(8080);
  readonly values: Array<number | null> = [];
}

@Component({
  imports: [ReactiveFormsModule, HellNumberInput],
  template: `
    <input hellNumberInput aria-label="Required number" [formControl]="control" />
  `,
})
class NumberInputRequiredHost {
  readonly control = new FormControl<number | null>(null, {
    validators: [Validators.required],
  });
}

@Component({
  imports: [ReactiveFormsModule, HellNumberInput],
  template: `
    <input
      hellNumberInput
      aria-label="Validated number"
      [min]="1"
      [max]="10"
      [formControl]="control"
      (valueChange)="values.push($event)"
    />
  `,
})
class NumberInputValidationHost {
  readonly control = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(1), Validators.max(10)],
  });
  readonly values: Array<number | null> = [];
}

@Component({
  imports: [HellNumberInput],
  providers: [
    provideHellNumberInputAdapter({
      parseText: (text) => {
        const normalized = text.trim().replace(',', '.');
        if (!normalized) return { valid: true, value: null };
        return /^-?\d+(\.\d+)?$/.test(normalized)
          ? { valid: true, value: Number(normalized) }
          : { valid: false };
      },
      format: (value) => (value === null ? '' : String(value).replace('.', ',')),
    }),
  ],
  template: `
    <input
      hellNumberInput
      aria-label="Locale number"
      [value]="value()"
      (valueChange)="values.push($event)"
    />
  `,
})
class NumberInputCustomAdapterHost {
  readonly value = signal<number | null>(1.5);
  readonly values: Array<number | null> = [];
}

@Component({
  imports: [HellNumberInput],
  template: `
    <form (submit)="submit($event)">
      <input
        hellNumberInput
        name="amount"
        aria-label="Amount"
        [value]="value()"
        (valueChange)="value.set($event)"
      />
      <button type="submit">Submit</button>
    </form>
  `,
})
class NumberInputFormDataHost {
  readonly value = signal<number | null>(0);
  submitted: FormData | null = null;

  submit(event: SubmitEvent): void {
    event.preventDefault();
    this.submitted = new FormData(event.currentTarget as HTMLFormElement);
  }
}

@Component({
  imports: [HellNumberInput, HellNumberStep],
  providers: [
    provideHellLabels(HELL_NUMBER_INPUT_LABELS, {
      incrementFor: (label) => `Raise ${label}`,
      decrementFor: (label) => `Lower ${label}`,
    }),
  ],
  template: `
    <input #number="hellNumberInput" hellNumberInput aria-label="Volume" />
    <button hellNumberStep="increment" [hellNumberStepFor]="number">+</button>
    <button
      hellNumberStep="decrement"
      [hellNumberStepFor]="number"
      aria-label="Custom lower"
    >−</button>
  `,
})
class NumberInputLabelsHost {}

describe('HellNumberInput', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NumberInputHost,
        NumberInputTwoWayHost,
        NumberInputNgModelHost,
        NumberInputSignalFormsHost,
        NumberInputStyleHost,
        NumberInputFieldHost,
        NumberInputNativeLabelHost,
        NumberInputDynamicNameHost,
        NumberInputFormHost,
        NumberInputRequiredHost,
        NumberInputValidationHost,
        NumberInputCustomAdapterHost,
        NumberInputFormDataHost,
        NumberInputLabelsHost,
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('owns behavior on the authored native input and preserves native attributes', () => {
    const fixture = createHost();
    const field = numberField(fixture);

    expect(field.id).toBe('report-port');
    expect(field.name).toBe('port');
    expect(field.placeholder).toBe('Port');
    expect(field.autocomplete).toBe('off');
    expect(field.type).toBe('text');
    expect(field.getAttribute('role')).toBe('spinbutton');
    expect(field.getAttribute('data-slot')).toBe('root');
    expect(field.getAttribute('inputmode')).toBe('decimal');
    expect(field.getAttribute('aria-describedby')).toBe('port-help port-error');
    expect(field.getAttribute('aria-labelledby')).toBe('port-label');
  });

  it('uses numeric input-mode metadata in integer mode', () => {
    const fixture = createHost();
    fixture.componentInstance.integer.set(true);
    fixture.detectChanges();

    expect(numberField(fixture).getAttribute('inputmode')).toBe('numeric');
    expect(numberField(fixture).getAttribute('data-integer')).toBe('true');
  });

  it('uses the composed Input single-root Part Style Map', () => {
    const fixture = TestBed.createComponent(NumberInputStyleHost);
    fixture.detectChanges();
    const field = numberField(fixture);
    const plain = fixture.nativeElement.querySelector(
      'input[aria-label="Plain number"]',
    ) as HTMLInputElement;

    expectUiRouting(plain.className, field.className, 'max-w-[20rem] border-hell-danger');
  });

  describe('recipes', () => {
    // Part-Class Pipeline merge semantics are owned centrally by
    // `core/part-class-pipeline.spec.ts`; the snapshot pins the default part
    // classes without asserting individual utilities elsewhere.
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(NumberInputStyleHost);
      fixture.detectChanges();
      const plain = fixture.nativeElement.querySelector(
        'input[aria-label="Plain number"]',
      ) as HTMLInputElement;
      const step = fixture.nativeElement.querySelector('#plain-step') as HTMLButtonElement;

      expect({
        root: sortClasses(plain.className),
        step: sortClasses(step.className),
      }).toMatchSnapshot('numberInput');
    });
  });

  it('parses typed decimals and emits the canonical value', () => {
    const fixture = createHost();
    typeText(fixture, '12.50');
    blurField(fixture);

    expect(fixture.componentInstance.values).toEqual([12.5]);
    expect(numberField(fixture).value).toBe('12.5');
    expect(numberField(fixture).getAttribute('aria-valuenow')).toBe('12.5');
  });

  it('keeps malformed and exponent text as invalid drafts without emitting', () => {
    const fixture = createHost();

    typeText(fixture, '12x');
    blurField(fixture);
    expect(numberField(fixture).value).toBe('12x');
    expect(numberField(fixture).getAttribute('aria-invalid')).toBe('true');
    expect(fixture.componentInstance.values).toEqual([]);

    typeText(fixture, '1e3');
    blurField(fixture);
    expect(numberField(fixture).value).toBe('1e3');
    expect(fixture.componentInstance.values).toEqual([]);
  });

  it('rejects fractional drafts in integer mode', () => {
    const fixture = createHost();
    fixture.componentInstance.integer.set(true);
    fixture.detectChanges();

    typeText(fixture, '4.5');
    blurField(fixture);

    expect(numberField(fixture).value).toBe('4.5');
    expect(numberField(fixture).getAttribute('aria-invalid')).toBe('true');
    expect(fixture.componentInstance.values).toEqual([]);
  });

  it('commits a nullable clear', () => {
    const fixture = createHost();
    fixture.componentInstance.value.set(4);
    fixture.detectChanges();

    typeText(fixture, '');
    blurField(fixture);

    expect(fixture.componentInstance.values).toEqual([null]);
    expect(numberField(fixture).value).toBe('');
    expect(numberField(fixture).getAttribute('aria-valuenow')).toBeNull();
  });

  it('commits out-of-range typing without clamping and keeps the visual invalid state', () => {
    const fixture = createHost();
    fixture.componentInstance.min.set(1);
    fixture.componentInstance.max.set(10);
    fixture.detectChanges();

    typeText(fixture, '12');
    blurField(fixture);

    expect(fixture.componentInstance.values).toEqual([12]);
    expect(numberField(fixture).value).toBe('12');
    expect(numberField(fixture).getAttribute('aria-invalid')).toBe('true');
  });

  it('synchronizes two-way binding through one value authority without duplicate commits', async () => {
    const fixture = TestBed.createComponent(NumberInputTwoWayHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = numberField(fixture);
    expect(input.value).toBe('10');

    // External parent write flows in without echoing a change event.
    host.value.set(25);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('25');
    expect(host.values).toEqual([]);

    // One user commit updates parent state and emits exactly one event.
    typeText(fixture, '40');
    blurField(fixture);
    expect(host.value()).toBe(40);
    expect(host.values).toEqual([40]);
    expect(input.value).toBe('40');

    // One keyboard step also writes the same authority exactly once.
    pressKey(fixture, 'ArrowUp');
    expect(host.value()).toBe(41);
    expect(host.values).toEqual([40, 41]);
  });

  it('keeps a static spinbutton role and inclusive ARIA bounds while empty', () => {
    const fixture = createHost();
    fixture.componentInstance.min.set(-5);
    fixture.componentInstance.max.set(5);
    fixture.detectChanges();
    const field = numberField(fixture);

    expect(field.getAttribute('role')).toBe('spinbutton');
    expect(field.getAttribute('aria-valuenow')).toBeNull();
    expect(field.getAttribute('aria-valuemin')).toBe('-5');
    expect(field.getAttribute('aria-valuemax')).toBe('5');
  });

  it('preserves consumer-authored accessible value text for projected suffixes', () => {
    const fixture = createHost();
    fixture.componentInstance.value.set(30);
    fixture.componentInstance.valueText.set('30 seconds');
    fixture.detectChanges();

    expect(numberField(fixture).getAttribute('aria-valuetext')).toBe('30 seconds');
  });

  it('steps with arrows and clamps to inclusive bounds', () => {
    const fixture = createHost();
    fixture.componentInstance.value.set(2);
    fixture.componentInstance.min.set(1);
    fixture.componentInstance.max.set(3);
    fixture.detectChanges();

    pressKey(fixture, 'ArrowUp');
    pressKey(fixture, 'ArrowUp');
    pressKey(fixture, 'ArrowDown');

    expect(fixture.componentInstance.values).toEqual([3, 2]);
    expect(numberField(fixture).value).toBe('2');
  });

  it('uses the configured multiplier for Shift+Arrow and Page keys', () => {
    const fixture = createHost();
    fixture.componentInstance.value.set(5);
    fixture.componentInstance.step.set(2);
    fixture.componentInstance.stepMultiplier.set(4);
    fixture.detectChanges();

    pressKey(fixture, 'ArrowUp', { shiftKey: true });
    pressKey(fixture, 'PageDown');

    expect(fixture.componentInstance.values).toEqual([13, 5]);
  });

  it('commits a pending valid draft before keyboard stepping', () => {
    const fixture = createHost();
    fixture.componentInstance.value.set(4);
    fixture.detectChanges();

    typeText(fixture, '20');
    pressKey(fixture, 'ArrowUp');

    expect(fixture.componentInstance.values).toEqual([20, 21]);
    expect(numberField(fixture).value).toBe('21');
  });

  it('jumps to explicit bounds with Home and End', () => {
    const fixture = createHost();
    fixture.componentInstance.value.set(5);
    fixture.componentInstance.min.set(1);
    fixture.componentInstance.max.set(9);
    fixture.detectChanges();

    pressKey(fixture, 'Home');
    pressKey(fixture, 'End');

    expect(fixture.componentInstance.values).toEqual([1, 9]);
  });

  it('leaves Home and End native when the corresponding bound is absent', () => {
    const fixture = createHost();
    fixture.componentInstance.value.set(5);
    fixture.detectChanges();

    const home = pressKey(fixture, 'Home');
    const end = pressKey(fixture, 'End');

    expect(home.defaultPrevented).toBe(false);
    expect(end.defaultPrevented).toBe(false);
    expect(fixture.componentInstance.values).toEqual([]);
  });

  it('avoids floating-point drift and anchors empty stepping at min', () => {
    const fixture = createHost();
    fixture.componentInstance.value.set(0.2);
    fixture.componentInstance.step.set(0.1);
    fixture.detectChanges();
    pressKey(fixture, 'ArrowUp');
    expect(numberField(fixture).value).toBe('0.3');

    fixture.componentInstance.value.set(null);
    fixture.componentInstance.min.set(4);
    fixture.detectChanges();
    pressKey(fixture, 'ArrowUp');
    expect(numberField(fixture).value).toBe('4');
  });

  it('ignores wheel scrolling only while the authored input is focused', () => {
    const fixture = createHost();
    const field = numberField(fixture);
    field.focus();

    const focusedWheel = new WheelEvent('wheel', { bubbles: true, cancelable: true });
    field.dispatchEvent(focusedWheel);
    expect(focusedWheel.defaultPrevented).toBe(true);

    field.blur();
    const blurredWheel = new WheelEvent('wheel', { bubbles: true, cancelable: true });
    field.dispatchEvent(blurredWheel);
    expect(blurredWheel.defaultPrevented).toBe(false);
  });

  it('merges explicit and Field label/description ids on the native host', () => {
    const fixture = TestBed.createComponent(NumberInputFieldHost);
    fixture.detectChanges();
    fixture.detectChanges();
    const field = numberField(fixture);
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    const description = fixture.nativeElement.querySelector(
      '[hellfielddescription]',
    ) as HTMLElement;

    expect(field.id).toBe('port-field-control');
    expect(field.getAttribute('aria-labelledby')).toBe(label.id);
    expect(field.getAttribute('aria-describedby')?.split(' ').sort()).toEqual(
      ['explicit-help', description.id].sort(),
    );
    expect(stepButtons(fixture)[0].getAttribute('aria-label')).toBe('Increase Listen port');
  });

  it('derives Number Step labels from an authored native label', () => {
    const fixture = TestBed.createComponent(NumberInputNativeLabelHost);
    fixture.detectChanges();
    fixture.detectChanges();

    expect(stepButtons(fixture)[0].getAttribute('aria-label')).toBe('Increase Retry count');
  });

  it('keeps dynamic native type and accessible-name precedence synchronized', () => {
    const fixture = TestBed.createComponent(NumberInputDynamicNameHost);
    fixture.detectChanges();
    fixture.detectChanges();
    const field = numberField(fixture);
    const increment = stepButtons(fixture)[0];

    expect(increment.getAttribute('aria-label')).toBe('Increase Retry count');

    fixture.componentInstance.label.set('Updated retry count');
    fixture.componentInstance.type.set('number');
    fixture.detectChanges();
    fixture.detectChanges();
    expect(field.type).toBe('text');
    expect(increment.getAttribute('aria-label')).toBe('Increase Updated retry count');

    fixture.componentInstance.label.set('');
    fixture.componentInstance.ariaLabel.set('Fallback retries');
    fixture.detectChanges();
    fixture.detectChanges();
    expect(increment.getAttribute('aria-label')).toBe('Increase Fallback retries');
  });

  it('integrates with template-driven forms through ngModel', async () => {
    const fixture = TestBed.createComponent(NumberInputNgModelHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = numberField(fixture);
    expect(input.value).toBe('10');
    expect(host.values).toEqual([]);

    // Enter commits without touching; blur marks the model touched.
    typeText(fixture, '25');
    pressKey(fixture, 'Enter');
    expect(host.value()).toBe(25);
    expect(host.values).toEqual([25]);
    expect(host.model().touched).toBe(false);

    blurField(fixture);
    expect(host.model().touched).toBe(true);

    // External writes synchronize without echoing an interaction commit.
    host.value.set(90);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('90');
    expect(host.values).toEqual([25]);
  });

  it('participates in Signal Forms as a FormValueControl through formField', async () => {
    const fixture = TestBed.createComponent(NumberInputSignalFormsHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = numberField(fixture);
    expect(input.value).toBe('8080');
    // The field's min()/max() validator metadata drives the input's own
    // bounds, including the static spinbutton ARIA metadata.
    expect(input.getAttribute('aria-valuemin')).toBe('1');
    expect(input.getAttribute('aria-valuemax')).toBe('65535');

    // Form-driven writes flow in without echoing an interaction commit.
    host.portForm.port().value.set(9000);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('9000');
    expect(host.values).toEqual([]);
    expect(host.portForm.port().dirty()).toBe(false);

    // One user commit updates the field and the model exactly once.
    typeText(fixture, '443');
    blurField(fixture);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.portForm.port().value()).toBe(443);
    expect(host.model().port).toBe(443);
    expect(host.values).toEqual([443]);
    expect(host.portForm.port().dirty()).toBe(true);
    expect(host.portForm.port().touched()).toBe(true);

    // Metadata-driven bounds also clamp stepping: End jumps to the field max,
    // and the increment stepper disables at that bound.
    pressKey(fixture, 'End');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.portForm.port().value()).toBe(65535);
    expect(host.values).toEqual([443, 65535]);
    const increment = fixture.nativeElement.querySelector(
      '[data-testid="signal-increment"]',
    ) as HTMLButtonElement;
    expect(increment.disabled).toBe(true);
  });

  it('reports parse failures to the Signal Forms field through transformedValue', async () => {
    const fixture = TestBed.createComponent(NumberInputSignalFormsHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = numberField(fixture);

    // A malformed committed draft stays editable and never becomes a value.
    typeText(fixture, '80x');
    blurField(fixture);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('80x');
    expect(host.portForm.port().value()).toBe(8080);
    expect(host.values).toEqual([]);
    expect(errorKinds(host)).toContain('invalidNumberInputDraft');
    expect(input.getAttribute('aria-invalid')).toBe('true');

    // A corrected commit clears the parse error and commits once.
    typeText(fixture, '8443');
    blurField(fixture);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.portForm.port().value()).toBe(8443);
    expect(host.values).toEqual([8443]);
    expect(errorKinds(host)).not.toContain('invalidNumberInputDraft');
    expect(input.getAttribute('aria-invalid')).toBeNull();

    // A step commit replacing a reported malformed draft also clears the error.
    typeText(fixture, '80x');
    blurField(fixture);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(errorKinds(host)).toContain('invalidNumberInputDraft');
    pressKey(fixture, 'ArrowUp');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.portForm.port().value()).toBe(8444);
    expect(host.values).toEqual([8443, 8444]);
    expect(errorKinds(host)).not.toContain('invalidNumberInputDraft');

    // An empty commit is a nullable clear through the same authority.
    typeText(fixture, '');
    blurField(fixture);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.portForm.port().value()).toBeNull();
    expect(host.model().port).toBeNull();
    expect(host.values).toEqual([8443, 8444, null]);

    // Field-driven disabled state reaches the native input.
    host.formDisabled.set(true);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
    expect(input.hasAttribute('data-disabled')).toBe(true);
  });

  it('keeps classic validation form-owned while drafts stay visual-only invalid state', async () => {
    const fixture = TestBed.createComponent(NumberInputValidationHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = numberField(fixture);

    // The control's own required validator drives errors and the reserved
    // required input, so the missing value is visible on the native host.
    expect(host.control.errors).toEqual({ required: true });
    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');

    // Committed out-of-range values report the control's own range errors and
    // keep the visual invalid contract without clamping.
    typeText(fixture, '12');
    blurField(fixture);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.control.value).toBe(12);
    expect(host.control.errors).toEqual({ max: { max: 10, actual: 12 } });
    expect(input.getAttribute('aria-invalid')).toBe('true');

    typeText(fixture, '5');
    blurField(fixture);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.control.errors).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBeNull();

    // A malformed committed draft never commits and stays a visual invalid
    // state; classic controls receive no directive-owned error for it.
    typeText(fixture, '5x');
    blurField(fixture);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.control.errors).toBeNull();
    expect(host.control.value).toBe(5);
    expect(input.value).toBe('5x');
    expect(input.getAttribute('aria-invalid')).toBe('true');

    typeText(fixture, '7');
    blurField(fixture);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.control.errors).toBeNull();
    expect(host.control.value).toBe(7);
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('integrates with reactive forms without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(NumberInputFormHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(numberField(fixture).value).toBe('8080');
    expect(fixture.componentInstance.values).toEqual([]);

    fixture.componentInstance.control.setValue(9000);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(numberField(fixture).value).toBe('9000');
    expect(fixture.componentInstance.values).toEqual([]);

    typeText(fixture, '443');
    blurField(fixture);
    expect(fixture.componentInstance.control.value).toBe(443);
    expect(fixture.componentInstance.values).toEqual([443]);
    expect(fixture.componentInstance.control.touched).toBe(true);
  });

  it('reflects reactive-form disabled and required state on the real input', async () => {
    const formFixture = TestBed.createComponent(NumberInputFormHost);
    formFixture.detectChanges();
    formFixture.componentInstance.control.disable();
    await formFixture.whenStable();
    formFixture.detectChanges();
    expect(numberField(formFixture).disabled).toBe(true);
    expect(numberField(formFixture).hasAttribute('data-disabled')).toBe(true);

    const requiredFixture = TestBed.createComponent(NumberInputRequiredHost);
    requiredFixture.detectChanges();
    await requiredFixture.whenStable();
    requiredFixture.detectChanges();
    expect(numberField(requiredFixture).required).toBe(true);
    expect(requiredFixture.componentInstance.control.errors).toEqual({ required: true });
  });

  it('preserves drafts for equivalent external values and replaces them for changed values', () => {
    const fixture = createHost();
    fixture.componentInstance.value.set(5);
    fixture.detectChanges();
    typeText(fixture, '5.');

    fixture.componentInstance.value.set(5);
    fixture.detectChanges();
    expect(numberField(fixture).value).toBe('5.');

    fixture.componentInstance.value.set(6);
    fixture.detectChanges();
    expect(numberField(fixture).value).toBe('6');
    expect(numberField(fixture).getAttribute('aria-invalid')).toBeNull();
  });

  it('uses an injected adapter for parsing, formatting, and synchronization', () => {
    const fixture = TestBed.createComponent(NumberInputCustomAdapterHost);
    fixture.detectChanges();
    expect(numberField(fixture).value).toBe('1,5');

    typeText(fixture, '2,75');
    blurField(fixture);
    expect(fixture.componentInstance.values).toEqual([2.75]);
    expect(numberField(fixture).value).toBe('2,75');
  });

  it('normalizes the native value synchronously before form submission', () => {
    const fixture = TestBed.createComponent(NumberInputFormDataHost);
    fixture.detectChanges();
    typeText(fixture, '001.50');

    const enter = pressKey(fixture, 'Enter');
    expect(enter.defaultPrevented).toBe(false);
    expect(numberField(fixture).value).toBe('1.5');

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    expect(fixture.componentInstance.submitted?.get('amount')).toBe('1.5');
  });

  it('keeps the default adapter public and deterministic', () => {
    expect(HELL_DEFAULT_NUMBER_INPUT_ADAPTER.parseText(' +12.5 ', { integer: false })).toEqual({
      valid: true,
      value: 12.5,
    });
    expect(HELL_DEFAULT_NUMBER_INPUT_ADAPTER.parseText('12.5', { integer: true })).toEqual({
      valid: false,
    });
    expect(HELL_DEFAULT_NUMBER_INPUT_ADAPTER.format(null, { integer: false })).toBe('');
  });
});

describe('HellNumberStep', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NumberInputHost,
        NumberInputStyleHost,
        NumberInputFieldHost,
        NumberInputLabelsHost,
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses one explicit target/controller and steps once per programmatic click', () => {
    const fixture = createHost();
    fixture.componentInstance.value.set(2);
    fixture.detectChanges();

    const [increment, decrement] = stepButtons(fixture);
    increment.click();
    fixture.detectChanges();
    decrement.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.values).toEqual([3, 2]);
    expect(numberField(fixture)).toBe(document.activeElement);
  });

  it('commits a pending draft before a directional click', () => {
    const fixture = createHost();
    fixture.componentInstance.value.set(4);
    fixture.detectChanges();
    typeText(fixture, '20');

    stepButtons(fixture)[0].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.values).toEqual([20, 21]);
    expect(numberField(fixture).value).toBe('21');
  });

  it('derives bound disabling from a pending valid draft', () => {
    const fixture = createHost();
    fixture.componentInstance.value.set(10);
    fixture.componentInstance.min.set(0);
    fixture.componentInstance.max.set(10);
    fixture.detectChanges();
    const [increment] = stepButtons(fixture);
    expect(increment.disabled).toBe(true);

    typeText(fixture, '5');
    fixture.detectChanges();
    expect(increment.disabled).toBe(false);
    increment.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.values).toEqual([5, 6]);
    expect(numberField(fixture).value).toBe('6');

    typeText(fixture, '10');
    fixture.detectChanges();
    expect(increment.disabled).toBe(true);
  });

  it('applies the target multiplier from a modified activation', () => {
    const fixture = createHost();
    fixture.componentInstance.value.set(5);
    fixture.componentInstance.step.set(2);
    fixture.componentInstance.stepMultiplier.set(3);
    fixture.detectChanges();

    stepButtons(fixture)[0].dispatchEvent(
      new MouseEvent('click', { bubbles: true, detail: 0, shiftKey: true }),
    );
    fixture.detectChanges();

    expect(numberField(fixture).value).toBe('11');
  });

  it('steps immediately and repeats while a primary pointer is held', () => {
    vi.useFakeTimers();
    const fixture = createHost();
    fixture.componentInstance.value.set(1);
    fixture.detectChanges();
    const increment = stepButtons(fixture)[0];

    increment.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }),
    );
    fixture.detectChanges();
    expect(numberField(fixture).value).toBe('2');

    vi.advanceTimersByTime(580);
    fixture.detectChanges();
    expect(Number(numberField(fixture).value)).toBeGreaterThan(3);

    increment.dispatchEvent(new Event('pointerup', { bubbles: true }));
    const settled = numberField(fixture).value;
    vi.advanceTimersByTime(300);
    fixture.detectChanges();
    expect(numberField(fixture).value).toBe(settled);
  });

  it('disables each direction at its bound and follows target disabled state', () => {
    const fixture = createHost();
    fixture.componentInstance.value.set(10);
    fixture.componentInstance.min.set(0);
    fixture.componentInstance.max.set(10);
    fixture.detectChanges();
    const [increment, decrement] = stepButtons(fixture);

    expect(increment.disabled).toBe(true);
    expect(increment.getAttribute('data-disabled')).toBe('true');
    expect(decrement.disabled).toBe(false);

    fixture.componentInstance.value.set(0);
    fixture.detectChanges();
    expect(increment.disabled).toBe(false);
    expect(decrement.disabled).toBe(true);

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(increment.disabled).toBe(true);
    expect(decrement.disabled).toBe(true);
  });

  it('uses safe button metadata and a local single-root style contract', () => {
    const fixture = TestBed.createComponent(NumberInputStyleHost);
    fixture.detectChanges();
    const button = stepButtons(fixture)[0];

    expect(button.type).toBe('button');
    expect(button.tabIndex).toBe(-1);
    expect(button.getAttribute('data-slot')).toBe('root');
    expect(button.getAttribute('data-direction')).toBe('increment');
    expectUiRouting(
      (fixture.nativeElement.querySelector('#plain-step') as HTMLButtonElement).className,
      button.className,
      'bg-hell-danger text-hell-danger-foreground',
    );
  });

  it('uses target-aware labels, Label Contract overrides, and authored overrides', () => {
    const fixture = TestBed.createComponent(NumberInputLabelsHost);
    fixture.detectChanges();
    fixture.detectChanges();
    const [increment, decrement] = stepButtons(fixture);

    expect(increment.getAttribute('aria-label')).toBe('Raise Volume');
    expect(decrement.getAttribute('aria-label')).toBe('Custom lower');
  });

  it('exports the canonical entrypoint import tuple', () => {
    expect(HELL_NUMBER_INPUT_IMPORTS).toEqual([HellNumberInput, HellNumberStep]);
  });
});

function createHost(): ComponentFixture<NumberInputHost> {
  const fixture = TestBed.createComponent(NumberInputHost);
  fixture.detectChanges();
  return fixture;
}

function numberField(fixture: ComponentFixture<unknown>): HTMLInputElement {
  const field = fixture.nativeElement.querySelector('input[hellnumberinput]') as
    | HTMLInputElement
    | null;
  if (!field) throw new Error('Expected authored Number Input.');
  return field;
}

function errorKinds(host: NumberInputSignalFormsHost): string[] {
  return host.portForm
    .port()
    .errors()
    .map((error) => error.kind);
}

function stepButtons(fixture: ComponentFixture<unknown>): HTMLButtonElement[] {
  return Array.from(
    fixture.nativeElement.querySelectorAll('button[hellnumberstep]'),
  ) as HTMLButtonElement[];
}

function typeText(fixture: ComponentFixture<unknown>, value: string): void {
  const field = numberField(fixture);
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  fixture.detectChanges();
}

function blurField(fixture: ComponentFixture<unknown>): void {
  numberField(fixture).dispatchEvent(new FocusEvent('blur', { bubbles: true }));
  fixture.detectChanges();
}

function pressKey(
  fixture: ComponentFixture<unknown>,
  key: string,
  init: KeyboardEventInit = {},
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  numberField(fixture).dispatchEvent(event);
  fixture.detectChanges();
  return event;
}
