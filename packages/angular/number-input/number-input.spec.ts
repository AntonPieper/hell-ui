import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import {
  HellNumberInput,
  hellFormatNumberInputValue,
  hellParseNumberInputText,
  provideHellNumberInputAdapter,
  provideHellNumberInputLabels,
  type HellNumberInputPart,
  type HellNumberInputUi,
} from './number-input';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';

@Component({
  imports: [HellNumberInput],
  template: `
    <hell-number-input
      [value]="value()"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [integer]="integer()"
      [steppers]="steppers()"
      [suffix]="suffix()"
      [required]="required()"
      [inputId]="inputId"
      [name]="name"
      [aria-label]="ariaLabel"
      [aria-describedby]="ariaDescribedby"
      [aria-labelledby]="ariaLabelledby"
      (valueChange)="onValue($event)"
    />
  `,
})
class NumberInputHost {
  readonly value = signal<number | null>(null);
  onValue(next: number | null): void {
    this.values.push(next);
    this.value.set(next);
  }
  readonly min = signal<number | null>(null);
  readonly max = signal<number | null>(null);
  readonly step = signal(1);
  readonly integer = signal(false);
  readonly steppers = signal(false);
  readonly suffix = signal<string | null>(null);
  readonly required = signal(false);
  inputId = 'report-port';
  name = 'port';
  ariaLabel = 'Listen port';
  ariaDescribedby = 'port-help port-error';
  ariaLabelledby = 'port-label';
  values: Array<number | null> = [];
}

@Component({
  imports: [HellNumberInput],
  template: `<hell-number-input [ui]="ui()" aria-label="Styled number" />`,
})
class NumberInputPartStyleHost {
  readonly ui = signal<string | HellNumberInputUi>('max-w-[20rem] border-hell-danger');
}

@Component({
  imports: [HellNumberInput, ...HELL_FIELD_DIRECTIVES],
  template: `
    <div hellField>
      <label hellFieldLabel for="port-field-control">Listen port</label>
      <hell-number-input inputId="port-field-control" aria-label="Listen port" />
      <div hellFieldDescription>TCP port between 1 and 65535.</div>
    </div>
  `,
})
class NumberInputFieldHost {}

@Component({
  imports: [ReactiveFormsModule, HellNumberInput],
  template: `
    <hell-number-input
      [formControl]="control"
      [min]="1"
      [max]="65535"
      aria-label="Form port"
      (valueChange)="values.push($event)"
    />
  `,
})
class NumberInputFormHost {
  readonly control = new FormControl<number | null>(8080);
  values: Array<number | null> = [];
}

@Component({
  imports: [ReactiveFormsModule, HellNumberInput],
  template: `
    <hell-number-input [formControl]="control" required aria-label="Required number" />
  `,
})
class NumberInputRequiredHost {
  readonly control = new FormControl<number | null>(null);
}

@Component({
  imports: [HellNumberInput],
  providers: [
    // Comma-decimal locale adapter.
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
    <hell-number-input [value]="value()" aria-label="Locale number" (valueChange)="values.push($event)" />
  `,
})
class NumberInputCustomAdapterHost {
  readonly value = signal<number | null>(1.5);
  values: Array<number | null> = [];
}

describe('HellNumberInput', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NumberInputHost,
        NumberInputPartStyleHost,
        NumberInputFieldHost,
        NumberInputFormHost,
        NumberInputRequiredHost,
        NumberInputCustomAdapterHost,
      ],
    }).compileComponents();
  });

  it('forwards label and form attributes to the internal text field', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    expect(input.id).toBe('report-port');
    expect(input.getAttribute('name')).toBe('port');
    expect(input.getAttribute('aria-label')).toBe('Listen port');
    expect(input.getAttribute('aria-describedby')).toBe('port-help port-error');
    expect(input.getAttribute('aria-labelledby')).toBe('port-label');
    expect(input.getAttribute('data-slot')).toBe('input');
    expect(input.getAttribute('inputmode')).toBe('decimal');
    expect(input.getAttribute('type')).toBe('text');
  });

  it('uses the numeric inputmode in integer mode', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    fixture.componentInstance.integer.set(true);
    fixture.detectChanges();

    expect(textInput(fixture.nativeElement).getAttribute('inputmode')).toBe('numeric');
  });

  it('merges ui shorthand classes into the root public part only', () => {
    const fixture = TestBed.createComponent(NumberInputPartStyleHost);
    fixture.detectChanges();

    const root = numberInputHost(fixture.nativeElement);
    const input = textInput(fixture.nativeElement);

    expect(root.getAttribute('data-slot')).toBe('root');
    expect(root.classList.contains('max-w-[20rem]')).toBe(true);
    expect(root.classList.contains('border-hell-danger')).toBe(true);
    expect(root.classList.contains('border-hell-border')).toBe(false);
    expect(input.getAttribute('data-slot')).toBe('input');
    expect(input.classList.contains('max-w-[20rem]')).toBe(false);
  });

  it('parses typed numbers and round-trips the formatted value', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '42.5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.values).toEqual([42.5]);
    expect(input.value).toBe('42.5');
  });

  it('keeps unparseable text visible as an invalid draft without emitting', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    const host = fixture.componentInstance;
    host.value.set(12);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '1.2.3';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.values).toEqual([]);
    expect(input.value).toBe('1.2.3');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('rejects exponent notation as malformed', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '1e3';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.values).toEqual([]);
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('rejects fractional typing in integer mode', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    const host = fixture.componentInstance;
    host.integer.set(true);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '3.5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.values).toEqual([]);
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('commits null when the field is cleared', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    const host = fixture.componentInstance;
    host.value.set(9);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.values).toEqual([null]);
    expect(input.value).toBe('');
  });

  it('commits out-of-range typed values but reports them invalid', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    const host = fixture.componentInstance;
    host.min.set(1);
    host.max.set(65535);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '70000';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.values).toEqual([70000]);
    expect(input.value).toBe('70000');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('reflects APG spinbutton semantics for the current value and bounds', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    const host = fixture.componentInstance;
    host.min.set(1);
    host.max.set(65535);
    host.value.set(8080);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    expect(input.getAttribute('role')).toBe('spinbutton');
    expect(input.getAttribute('aria-valuenow')).toBe('8080');
    expect(input.getAttribute('aria-valuemin')).toBe('1');
    expect(input.getAttribute('aria-valuemax')).toBe('65535');
  });

  it('drops the spinbutton role while the value is null', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    expect(input.getAttribute('role')).toBeNull();
    expect(input.getAttribute('aria-valuenow')).toBeNull();
  });

  it('exposes a unit suffix through aria-valuetext', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    const host = fixture.componentInstance;
    host.suffix.set('seconds');
    host.value.set(30);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    expect(input.getAttribute('aria-valuetext')).toBe('30 seconds');
    const suffix = fixture.nativeElement.querySelector('[data-slot="suffix"]');
    expect(suffix?.textContent?.trim()).toBe('seconds');
    expect(suffix?.getAttribute('aria-hidden')).toBe('true');
  });

  it('steps with ArrowUp/ArrowDown clamped to bounds', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    const host = fixture.componentInstance;
    host.min.set(1);
    host.max.set(10);
    host.value.set(9);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    expect(host.value()).toBe(10);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    // Clamped at max; no further change.
    expect(host.value()).toBe(10);
    expect(host.values.at(-1)).toBe(10);
  });

  it('applies the larger multiplier when Shift is held', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    const host = fixture.componentInstance;
    host.value.set(100);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true, bubbles: true }),
    );
    fixture.detectChanges();
    expect(host.value()).toBe(110);
  });

  it('jumps to min and max with Home and End when bounds exist', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    const host = fixture.componentInstance;
    host.min.set(1);
    host.max.set(65535);
    host.value.set(8080);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();
    expect(host.value()).toBe(1);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(host.value()).toBe(65535);
  });

  it('does not treat Home/End as jumps without bounds', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    const host = fixture.componentInstance;
    host.value.set(5);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    const event = new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true });
    input.dispatchEvent(event);
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(false);
    expect(host.values).toEqual([]);
  });

  it('avoids floating point drift when stepping decimals', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    const host = fixture.componentInstance;
    host.step.set(0.1);
    host.value.set(0.3);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    expect(host.value()).toBe(0.4);
  });

  it('seeds stepping from the lower bound when starting empty', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    const host = fixture.componentInstance;
    host.min.set(1);
    host.max.set(65535);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    expect(host.value()).toBe(1);
  });

  it('steps once per stepper button press', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    const host = fixture.componentInstance;
    host.steppers.set(true);
    host.value.set(5);
    fixture.detectChanges();

    const increment = stepperButton(fixture.nativeElement, 'increment');
    const decrement = stepperButton(fixture.nativeElement, 'decrement');
    expect(increment.getAttribute('aria-label')).toBe('Increase Listen port');
    expect(decrement.getAttribute('aria-label')).toBe('Decrease Listen port');

    increment.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    increment.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    fixture.detectChanges();
    expect(host.value()).toBe(6);

    decrement.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    decrement.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    fixture.detectChanges();
    expect(host.value()).toBe(5);
  });

  it('disables the steppers at the bounds', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    const host = fixture.componentInstance;
    host.steppers.set(true);
    host.min.set(1);
    host.max.set(10);
    host.value.set(10);
    fixture.detectChanges();

    expect(stepperButton(fixture.nativeElement, 'increment').disabled).toBe(true);
    expect(stepperButton(fixture.nativeElement, 'decrement').disabled).toBe(false);

    host.value.set(1);
    fixture.detectChanges();
    expect(stepperButton(fixture.nativeElement, 'increment').disabled).toBe(false);
    expect(stepperButton(fixture.nativeElement, 'decrement').disabled).toBe(true);
  });

  it('ignores wheel scrolling while the field is focused', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    const host = fixture.componentInstance;
    host.value.set(5);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.focus();
    const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 120 });
    input.dispatchEvent(event);
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(true);
    expect(host.value()).toBe(5);
    expect(host.values).toEqual([]);
  });

  it('inherits hellField label and description wiring for the internal text field', () => {
    const fixture = TestBed.createComponent(NumberInputFieldHost);
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

  it('surfaces malformed drafts as a distinct validator error', () => {
    const fixture = TestBed.createComponent(NumberInputFormHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = 'abc';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.errors).toEqual({ numberInputMalformed: true });
    expect(numberInputHost(fixture.nativeElement).getAttribute('data-invalid')).toBe('true');
  });

  it('reports below-min and above-max as distinct validator errors', () => {
    const fixture = TestBed.createComponent(NumberInputFormHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    host.control.setValue(0);
    fixture.detectChanges();
    expect(host.control.errors).toEqual({ min: { min: 1, actual: 0 } });

    host.control.setValue(70000);
    fixture.detectChanges();
    expect(host.control.errors).toEqual({ max: { max: 65535, actual: 70000 } });

    host.control.setValue(443);
    fixture.detectChanges();
    expect(host.control.errors).toBeNull();
  });

  it('reports a required error while empty', () => {
    const fixture = TestBed.createComponent(NumberInputRequiredHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    expect(host.control.errors).toEqual({ required: true });

    const input = textInput(fixture.nativeElement);
    input.value = '5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.errors).toBeNull();
  });

  it('integrates with reactive forms without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(NumberInputFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = textInput(fixture.nativeElement);
    expect(input.value).toBe('8080');

    host.control.setValue(443);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('443');
    expect(host.values).toEqual([]);

    input.value = '22';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.value).toBe(22);
    expect(host.control.touched).toBe(true);
    expect(host.values).toEqual([22]);
  });

  it('uses reactive-form disabled state', () => {
    const fixture = TestBed.createComponent(NumberInputFormHost);
    fixture.detectChanges();

    fixture.componentInstance.control.disable();
    fixture.detectChanges();

    expect(textInput(fixture.nativeElement).disabled).toBe(true);
    expect(numberInputHost(fixture.nativeElement).getAttribute('data-disabled')).toBe('true');
  });

  it('uses an injected locale parse and format adapter', () => {
    const fixture = TestBed.createComponent(NumberInputCustomAdapterHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    expect(input.value).toBe('1,5');

    input.value = '2,25';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.values).toEqual([2.25]);
    expect(input.value).toBe('2,25');
  });

  it('overrides stepper labels through the Label Contract', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NumberInputHost],
      providers: [provideHellNumberInputLabels({ increment: 'Bump up' })],
    });
    const fixture = TestBed.createComponent(NumberInputHost);
    fixture.componentInstance.steppers.set(true);
    fixture.componentInstance.ariaLabel = '';
    fixture.detectChanges();

    expect(stepperButton(fixture.nativeElement, 'increment').getAttribute('aria-label')).toBe(
      'Bump up',
    );
  });

  it('parses and formats through the default helpers', () => {
    expect(hellParseNumberInputText('  12 ', { integer: false })).toEqual({
      valid: true,
      value: 12,
    });
    expect(hellParseNumberInputText('', { integer: false })).toEqual({ valid: true, value: null });
    expect(hellParseNumberInputText('1e3', { integer: false })).toEqual({ valid: false });
    expect(hellParseNumberInputText('3.5', { integer: true })).toEqual({ valid: false });
    expect(hellFormatNumberInputValue(42, { integer: false })).toBe('42');
    expect(hellFormatNumberInputValue(null, { integer: false })).toBe('');
  });

  it('merges ui object classes into stepper and suffix parts', () => {
    const fixture = TestBed.createComponent(NumberInputHost);
    fixture.componentInstance.steppers.set(true);
    fixture.componentInstance.suffix.set('ms');
    fixture.detectChanges();

    const component = numberInputComponent(fixture);
    expect(numberInputPartClass(component, 'increment')).toContain('flex-1');
    expect(numberInputPartClass(component, 'decrement')).toContain('border-t');
    expect(numberInputPartClass(component, 'suffix')).toContain('flex-none');
  });
});

function textInput(root: HTMLElement): HTMLInputElement {
  const input = root.querySelector('input');
  if (!(input instanceof HTMLInputElement)) throw new Error('Expected number input.');
  return input;
}

function numberInputHost(root: HTMLElement): HTMLElement {
  const host = root.querySelector('hell-number-input');
  if (!(host instanceof HTMLElement)) throw new Error('Expected number input host.');
  return host;
}

function stepperButton(root: HTMLElement, slot: 'increment' | 'decrement'): HTMLButtonElement {
  const button = root.querySelector(`button[data-slot="${slot}"]`);
  if (!(button instanceof HTMLButtonElement)) throw new Error(`Expected ${slot} stepper.`);
  return button;
}

function numberInputComponent(fixture: ComponentFixture<unknown>): HellNumberInput {
  const debugElement = fixture.debugElement.query(By.directive(HellNumberInput));
  if (!debugElement) throw new Error('Expected HellNumberInput component.');
  return debugElement.componentInstance as HellNumberInput;
}

function numberInputPartClass(component: HellNumberInput, part: HellNumberInputPart): string {
  return (component as unknown as { part(part: HellNumberInputPart): string }).part(part);
}
