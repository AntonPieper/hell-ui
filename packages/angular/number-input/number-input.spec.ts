import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';

import { provideHellLabels } from '@hell-ui/angular/core';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';

import {
  HELL_DEFAULT_NUMBER_INPUT_ADAPTER,
  HELL_NUMBER_INPUT_IMPORTS,
  HELL_NUMBER_INPUT_LABELS,
  HellNumberInput,
  HellNumberStep,
  provideHellNumberInputAdapter,
} from './number-input';

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
    <input hellNumberInput aria-label="Required number" required [formControl]="control" />
  `,
})
class NumberInputRequiredHost {
  readonly control = new FormControl<number | null>(null);
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
        NumberInputStyleHost,
        NumberInputFieldHost,
        NumberInputNativeLabelHost,
        NumberInputDynamicNameHost,
        NumberInputFormHost,
        NumberInputRequiredHost,
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

    expect(field.classList.contains('max-w-[20rem]')).toBe(true);
    expect(field.classList.contains('border-hell-danger')).toBe(true);
    expect(field.classList.contains('border-hell-border')).toBe(false);
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

  it('commits out-of-range typing without clamping and reports range errors', () => {
    const fixture = createHost();
    fixture.componentInstance.min.set(1);
    fixture.componentInstance.max.set(10);
    fixture.detectChanges();

    typeText(fixture, '12');
    blurField(fixture);

    expect(fixture.componentInstance.values).toEqual([12]);
    expect(numberField(fixture).value).toBe('12');
    expect(numberField(fixture).getAttribute('aria-invalid')).toBe('true');
    expect(numberDirective(fixture).validate(null)).toEqual({ max: { max: 10, actual: 12 } });
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

  it('reports malformed, required, below-min, and above-max validator errors', () => {
    const fixture = createHost();
    fixture.componentInstance.required.set(true);
    fixture.componentInstance.min.set(1);
    fixture.componentInstance.max.set(10);
    fixture.detectChanges();

    expect(numberDirective(fixture).validate(null)).toEqual({ required: true });

    typeText(fixture, 'bad');
    expect(numberDirective(fixture).validate(null)).toEqual({ numberInputMalformed: true });

    typeText(fixture, '-1');
    blurField(fixture);
    expect(numberDirective(fixture).validate(null)).toEqual({
      min: { min: 1, actual: -1 },
    });
  });

  it('integrates with reactive forms without echoing programmatic writes', () => {
    const fixture = TestBed.createComponent(NumberInputFormHost);
    fixture.detectChanges();
    expect(numberField(fixture).value).toBe('8080');
    expect(fixture.componentInstance.values).toEqual([]);

    fixture.componentInstance.control.setValue(9000);
    fixture.detectChanges();
    expect(numberField(fixture).value).toBe('9000');
    expect(fixture.componentInstance.values).toEqual([]);

    typeText(fixture, '443');
    blurField(fixture);
    expect(fixture.componentInstance.control.value).toBe(443);
    expect(fixture.componentInstance.values).toEqual([443]);
  });

  it('reflects reactive-form disabled and required state on the real input', () => {
    const formFixture = TestBed.createComponent(NumberInputFormHost);
    formFixture.detectChanges();
    formFixture.componentInstance.control.disable();
    formFixture.detectChanges();
    expect(numberField(formFixture).disabled).toBe(true);
    expect(numberField(formFixture).hasAttribute('data-disabled')).toBe(true);

    const requiredFixture = TestBed.createComponent(NumberInputRequiredHost);
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
    expect(button.classList.contains('bg-hell-danger')).toBe(true);
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

function numberDirective(fixture: ComponentFixture<unknown>): HellNumberInput {
  const debugElement = fixture.debugElement.query(By.directive(HellNumberInput));
  if (!debugElement) throw new Error('Expected Number Input directive.');
  return debugElement.injector.get(HellNumberInput);
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
