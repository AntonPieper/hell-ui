import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import {
  HellTimeInput,
  hellParseTimeInputText,
  provideHellTimeInputAdapter,
  type HellTimeValue,
} from './time-input';
import { HELL_FIELD_DIRECTIVES } from '../../primitives/field/field';

@Component({
  imports: [HellTimeInput],
  template: `
    <hell-time-input
      [value]="value()"
      [seconds]="seconds()"
      [placeholder]="placeholder"
      [inputId]="inputId"
      [name]="name"
      [aria-label]="ariaLabel"
      [aria-describedby]="ariaDescribedby"
      [aria-labelledby]="ariaLabelledby"
      (valueChange)="values.push($event)"
    />
  `,
})
class TimeInputHost {
  readonly value = signal<HellTimeValue | null>(null);
  readonly seconds = signal(false);
  placeholder: string | null = null;
  inputId = 'start-time-input';
  name = 'startTime';
  ariaLabel = 'Start time';
  ariaDescribedby = 'start-time-help start-time-error';
  ariaLabelledby = 'start-time-label';
  values: Array<HellTimeValue | null> = [];
}

@Component({
  imports: [HellTimeInput, ...HELL_FIELD_DIRECTIVES],
  template: `
    <div hellField>
      <label hellFieldLabel for="start-field-control">Start time</label>
      <hell-time-input inputId="start-field-control" aria-label="Start time" />
      <div hellFieldDescription>Use the local timezone.</div>
    </div>
  `,
})
class TimeInputFieldHost {}

@Component({
  imports: [ReactiveFormsModule, HellTimeInput],
  template: `
    <hell-time-input
      [formControl]="control"
      aria-label="Form time"
      (valueChange)="values.push($event)"
    />
  `,
})
class TimeInputFormHost {
  readonly control = new FormControl<HellTimeValue | null>({ hour: 8, minute: 30, second: 0 });
  values: Array<HellTimeValue | null> = [];
}

@Component({
  imports: [ReactiveFormsModule, HellTimeInput],
  template: ` <hell-time-input [formControl]="control" aria-label="Blur form time" /> `,
})
class TimeInputBlurFormHost {
  readonly control = new FormControl<HellTimeValue | null>(
    { hour: 8, minute: 30, second: 0 },
    {
      updateOn: 'blur',
    },
  );
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
      isSameValue: (a, b) =>
        a?.hour === b?.hour && a?.minute === b?.minute && a?.second === b?.second,
    }),
  ],
  template: `<hell-time-input
    [value]="value()"
    aria-label="Custom time"
    (valueChange)="values.push($event)"
  />`,
})
class TimeInputCustomAdapterHost {
  readonly value = signal<HellTimeValue | null>({ hour: 8, minute: 30, second: 0 });
  values: Array<HellTimeValue | null> = [];
}

@Component({
  imports: [ReactiveFormsModule, HellTimeInput],
  template: `<hell-time-input
    [formControl]="control"
    aria-label="Validated time"
    (valueChange)="values.push($event)"
  />`,
})
class TimeInputValidationHost {
  readonly control = new FormControl<HellTimeValue | null>({ hour: 9, minute: 15, second: 0 });
  values: Array<HellTimeValue | null> = [];
}

@Component({
  imports: [ReactiveFormsModule, HellTimeInput],
  providers: [
    provideHellTimeInputAdapter({
      parseText: (text) =>
        text.trim().toLowerCase() === 'noon'
          ? { valid: true, value: { hour: 12, minute: 0, second: 0 } }
          : text.trim() === ''
            ? { valid: true, value: null }
            : { valid: false },
      format: (value) => `${value.hour}h${value.minute.toString().padStart(2, '0')}`,
      normalize: (value) => value ?? null,
      isSameValue: (a, b) =>
        a?.hour === b?.hour && a?.minute === b?.minute && a?.second === b?.second,
    }),
  ],
  template: `<hell-time-input [formControl]="control" aria-label="Custom validated time" />`,
})
class TimeInputCustomValidationHost {
  readonly control = new FormControl<HellTimeValue | null>({ hour: 9, minute: 15, second: 0 });
}

describe('HellTimeInput', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TimeInputHost,
        TimeInputFieldHost,
        TimeInputFormHost,
        TimeInputBlurFormHost,
        TimeInputCustomAdapterHost,
        TimeInputValidationHost,
        TimeInputCustomValidationHost,
      ],
    }).compileComponents();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('forwards label and form attributes to the internal text field only', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    const trigger = triggerButton(fixture.nativeElement);

    expect(input.id).toBe('start-time-input');
    expect(input.getAttribute('name')).toBe('startTime');
    expect(input.getAttribute('aria-label')).toBe('Start time');
    expect(input.getAttribute('aria-describedby')).toBe('start-time-help start-time-error');
    expect(input.getAttribute('aria-labelledby')).toBe('start-time-label');
    expect(input.getAttribute('data-slot')).toBe('field');
    expect(input.classList.contains('hell-input')).toBe(false);
    expect(input.classList.contains('inline-flex')).toBe(true);
    expect(trigger.getAttribute('aria-label')).toBe('Choose time for Start time');
    expect(trigger.getAttribute('aria-describedby')).toBeNull();
    expect(trigger.getAttribute('aria-labelledby')).toBeNull();
  });

  it('inherits hellField label and description wiring for the internal text field', () => {
    const fixture = TestBed.createComponent(TimeInputFieldHost);
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

  it('uses a native time field for default keyboard entry', async () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    document.body.append(fixture.nativeElement);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    expect(input.type).toBe('time');
    expect(input.getAttribute('inputmode')).toBeNull();
    expect(input.getAttribute('min')).toBe('00:00');
    expect(input.getAttribute('max')).toBe('23:59');
    expect(input.getAttribute('step')).toBe('60');

    input.value = '09:05';
    let selectCalls = 0;
    Object.defineProperty(input, 'select', {
      configurable: true,
      value: () => {
        selectCalls += 1;
      },
    });
    input.focus();
    await Promise.resolve();
    expect(selectCalls).toBe(1);

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.values).toEqual([{ hour: 9, minute: 5, second: 0 }]);
    expect(input.value).toBe('09:05');
  });

  it('keeps default parser support for text adapters and direct parser consumers', () => {
    expect(hellParseTimeInputText('9:05 pm', { seconds: false })).toEqual({
      valid: true,
      value: { hour: 21, minute: 5, second: 0 },
    });
    expect(hellParseTimeInputText('930', { seconds: false })).toEqual({
      valid: true,
      value: { hour: 9, minute: 30, second: 0 },
    });
    expect(hellParseTimeInputText('17', { seconds: false })).toEqual({
      valid: true,
      value: { hour: 17, minute: 0, second: 0 },
    });
    expect(hellParseTimeInputText('9p', { seconds: false })).toEqual({
      valid: true,
      value: { hour: 21, minute: 0, second: 0 },
    });
  });

  it('updates native time constraints when seconds mode is enabled', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.componentInstance.seconds.set(true);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    expect(input.type).toBe('time');
    expect(input.getAttribute('max')).toBe('23:59:59');
    expect(input.getAttribute('step')).toBe('1');

    input.value = '01:02:03';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.values).toEqual([{ hour: 1, minute: 2, second: 3 }]);
    expect(input.value).toBe('01:02:03');
  });

  it('keeps illegal native time strings out of the default field value', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);

    input.value = '25:99';
    expect(input.value).toBe('');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.values).toEqual([null]);
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('uses HH:mm and HH:mm:ss placeholders by default', () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.detectChanges();
    expect(textInput(fixture.nativeElement).placeholder).toBe('HH:mm');

    fixture.componentInstance.seconds.set(true);
    fixture.detectChanges();
    expect(textInput(fixture.nativeElement).placeholder).toBe('HH:mm:ss');
  });

  it('syncs picker spinbutton values with parsed minutes/seconds', async () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '10:07';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    triggerButton(fixture.nativeElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const hour = await waitForPickerSpinbutton(fixture, 'hour');
    const minute = await waitForPickerSpinbutton(fixture, 'minute');
    expect(hour.getAttribute('aria-valuenow')).toBe('10');
    expect(minute.getAttribute('aria-valuenow')).toBe('7');

    fixture.componentInstance.seconds.set(true);
    fixture.detectChanges();

    input.value = '11:12:13';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    const second = await waitForPickerSpinbutton(fixture, 'second');
    expect(second.getAttribute('aria-valuenow')).toBe('13');
  });

  it('keeps invalid custom-adapter text visible without emitting', () => {
    const fixture = TestBed.createComponent(TimeInputCustomAdapterHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    expect(input.type).toBe('text');
    expect(input.getAttribute('inputmode')).toBe('text');

    input.value = 'later';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(input.value).toBe('later');

    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.values).toEqual([]);
    expect(input.value).toBe('later');
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

  it('renders a compact segmented picker with named spinbuttons and minute presets', async () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.componentInstance.value.set({ hour: 8, minute: 30, second: 0 });
    fixture.componentInstance.seconds.set(true);
    fixture.detectChanges();

    triggerButton(fixture.nativeElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const hour = await waitForPickerSpinbutton(fixture, 'hour');
    const minute = await waitForPickerSpinbutton(fixture, 'minute');
    const second = await waitForPickerSpinbutton(fixture, 'second');
    const picker = document.querySelector<HTMLElement>('[data-slot="picker"]');
    const presets = document.querySelectorAll<HTMLButtonElement>('[data-slot="minute-preset"]');

    expect(picker?.querySelectorAll('[role="spinbutton"]').length).toBe(3);
    expect(picker?.querySelector('[role="grid"]')).toBeNull();
    expect(
      picker
        ?.querySelector('[data-slot="picker-unit-control"]')
        ?.firstElementChild?.getAttribute('role'),
    ).toBe('spinbutton');
    expect(hour.getAttribute('aria-valuemin')).toBe('0');
    expect(hour.getAttribute('aria-valuemax')).toBe('23');
    expect(hour.getAttribute('aria-valuenow')).toBe('8');
    expect(hour.getAttribute('aria-valuetext')).toBe('08 hours');
    expect(hour.getAttribute('aria-labelledby')).toBe('start-time-input-hour-label');
    expect(minute.getAttribute('aria-valuenow')).toBe('30');
    expect(second.getAttribute('aria-valuenow')).toBe('0');
    expect(presets.length).toBe(4);
    expect(presets[2]?.getAttribute('aria-pressed')).toBe('true');
    expect(presets[2]?.textContent?.trim()).toBe('30');
  });

  it('supports spinbutton keyboard changes and quick minute presets', async () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.componentInstance.value.set({ hour: 8, minute: 30, second: 0 });
    fixture.detectChanges();

    triggerButton(fixture.nativeElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const hour = await waitForPickerSpinbutton(fixture, 'hour');
    const minute = await waitForPickerSpinbutton(fixture, 'minute');

    dispatchPickerKey(hour, 'ArrowUp');
    fixture.detectChanges();
    expect(textInput(fixture.nativeElement).value).toBe('09:30');
    expect(hour.getAttribute('aria-valuenow')).toBe('9');

    dispatchPickerKey(hour, 'Home');
    fixture.detectChanges();
    expect(textInput(fixture.nativeElement).value).toBe('00:30');

    dispatchPickerKey(hour, 'End');
    fixture.detectChanges();
    expect(textInput(fixture.nativeElement).value).toBe('23:30');

    dispatchPickerKey(minute, 'PageDown');
    fixture.detectChanges();
    expect(textInput(fixture.nativeElement).value).toBe('23:25');

    minutePreset(45).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(textInput(fixture.nativeElement).value).toBe('23:45');
    expect(fixture.componentInstance.values.at(-1)).toEqual({ hour: 23, minute: 45, second: 0 });
  });

  it('keeps unsupported spinbutton keys from changing the value', async () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.componentInstance.value.set({ hour: 8, minute: 30, second: 0 });
    fixture.detectChanges();

    triggerButton(fixture.nativeElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const hour = await waitForPickerSpinbutton(fixture, 'hour');

    dispatchPickerKey(hour, 'x');
    fixture.detectChanges();

    expect(textInput(fixture.nativeElement).value).toBe('08:30');
    expect(hour.getAttribute('aria-valuenow')).toBe('8');
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
    expect(input.type).toBe('text');
    expect(input.value).toBe('');

    input.value = 'noon';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.values).toEqual([{ hour: 12, minute: 0, second: 0 }]);
    expect(input.value).toBe('12h00');
  });

  it('exposes validator errors for invalid custom-adapter drafts', () => {
    const fixture = TestBed.createComponent(TimeInputCustomValidationHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = textInput(fixture.nativeElement);
    input.value = 'later';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.errors).toEqual({ invalidTimeInputDraft: true });
    expect(timeInputHost(fixture.nativeElement).getAttribute('data-invalid')).toBe('true');
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
    expect(timeInputHost(fixture.nativeElement).getAttribute('data-disabled')).toBe('true');
  });
});

function textInput(root: HTMLElement): HTMLInputElement {
  const input = root.querySelector('input');
  if (!(input instanceof HTMLInputElement)) throw new Error('Expected time input.');
  return input;
}

type HellTimeUnit = 'hour' | 'minute' | 'second';

function dispatchPickerKey(spinbutton: HTMLElement, key: string): void {
  spinbutton.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

function minutePreset(minute: number): HTMLButtonElement {
  const preset = Array.from(
    document.querySelectorAll<HTMLButtonElement>('[data-slot="minute-preset"]'),
  ).find((button) => button.textContent?.trim() === minute.toString().padStart(2, '0'));
  if (!preset) throw new Error(`Expected minute preset ${minute}.`);
  return preset;
}

function triggerButton(root: HTMLElement): HTMLButtonElement {
  const trigger = root.querySelector('button[data-slot="trigger"]');
  if (!(trigger instanceof HTMLButtonElement)) throw new Error('Expected time trigger.');
  return trigger;
}

function timeInputHost(root: HTMLElement): HTMLElement {
  const host = root.querySelector('hell-time-input');
  if (!(host instanceof HTMLElement)) throw new Error('Expected time input host.');
  return host;
}

async function waitForPickerSpinbutton(
  fixture: ComponentFixture<unknown>,
  unit: HellTimeUnit,
): Promise<HTMLElement> {
  const selector = `[data-slot="picker-unit"][data-unit="${unit}"] [role="spinbutton"]`;
  const timeout = Date.now() + 1000;

  while (Date.now() < timeout) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const spinbutton = document.querySelector<HTMLElement>(selector);
    if (spinbutton) return spinbutton;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  throw new Error(`Expected ${selector}.`);
}
