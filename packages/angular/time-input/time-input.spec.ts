import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideHellLabels } from '@hell-ui/angular/core';

import {
  HellTimeInput,
  HELL_DEFAULT_TIME_INPUT_ADAPTER,
  HELL_TIME_INPUT_LABELS,
  provideHellTimeInputAdapter,
  type HellTimeInputAdapter,
  type HellTimeInputPart,
  type HellTimeInputUi,
  type HellTimeValue,
} from './time-input';
import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';

{
  const elementPrototype = HTMLElement.prototype as HTMLElement & {
    getAnimations?: () => readonly Animation[];
  };
  if (typeof elementPrototype.getAnimations !== 'function') {
    elementPrototype.getAnimations = () => [];
  }
}

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
  imports: [HellTimeInput],
  template: `<hell-time-input [ui]="ui()" aria-label="Styled time" />`,
})
class TimeInputPartStyleHost {
  readonly ui = signal<string | HellTimeInputUi>('max-w-[18rem] border-hell-danger');
}

@Component({
  imports: [HellTimeInput, ...HELL_FIELD_IMPORTS],
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
      format: (value) => (value ? `${value.hour}h${value.minute.toString().padStart(2, '0')}` : ''),
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

const TRANSFORMING_TIME_INPUT_ADAPTER = {
  parseText: () => ({ valid: false }) as const,
  format: (value) =>
    value ? `${value.hour}h${value.minute.toString().padStart(2, '0')}` : '',
  normalize: (value) => {
    if (!value) return null;
    if (value.minute === 15) return { ...value, minute: 20 };
    if (value.minute === 20) return { ...value, minute: 25 };
    return value;
  },
  isSameValue: (a, b) =>
    a?.hour === b?.hour && a?.minute === b?.minute && a?.second === b?.second,
} satisfies HellTimeInputAdapter;

@Component({
  imports: [ReactiveFormsModule, HellTimeInput],
  providers: [provideHellTimeInputAdapter(TRANSFORMING_TIME_INPUT_ADAPTER)],
  template: `<hell-time-input
    [formControl]="control"
    aria-label="Transforming time"
    (valueChange)="values.push($event)"
  />`,
})
class TimeInputTransformingAdapterHost {
  readonly control = new FormControl<HellTimeValue | null>({ hour: 12, minute: 0, second: 0 });
  values: Array<HellTimeValue | null> = [];
}

@Component({
  imports: [HellTimeInput],
  providers: [provideHellTimeInputAdapter(TRANSFORMING_TIME_INPUT_ADAPTER)],
  template: `<hell-time-input
    [value]="value()"
    aria-label="Signal transforming time"
    (valueChange)="onValueChange($event)"
  />`,
})
class TimeInputSignalTransformingAdapterHost {
  readonly value = signal<HellTimeValue | null>({ hour: 12, minute: 0, second: 0 });
  substituteWith: HellTimeValue | undefined;
  values: Array<HellTimeValue | null> = [];

  onValueChange(value: HellTimeValue | null): void {
    this.values.push(value);
    this.value.set(this.substituteWith ?? value);
  }
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
      format: (value) => (value ? `${value.hour}h${value.minute.toString().padStart(2, '0')}` : ''),
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

@Component({
  imports: [HellTimeInput],
  providers: [
    provideHellLabels(HELL_TIME_INPUT_LABELS, {
      hours: 'Stunden',
      minutes: 'Minuten',
      seconds: 'Sekunden',
      selectedTime: (time) => `Gewählte Zeit ${time}`,
      decreaseUnit: (unit) => `${unit} verringern`,
      increaseUnit: (unit) => `${unit} erhöhen`,
      minutePresets: 'Minutenvorgaben',
      minutePreset: (minute) => `Minute ${minute}`,
    }),
  ],
  template: `<hell-time-input aria-label="Lokalisierte Zeit" seconds [value]="value" />`,
})
class LocalizedTimeInputHost {
  readonly value: HellTimeValue = { hour: 8, minute: 15, second: 30 };
}

describe('HellTimeInput', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TimeInputHost,
        TimeInputPartStyleHost,
        TimeInputFieldHost,
        TimeInputFormHost,
        TimeInputBlurFormHost,
        TimeInputCustomAdapterHost,
        TimeInputTransformingAdapterHost,
        TimeInputSignalTransformingAdapterHost,
        TimeInputValidationHost,
        TimeInputCustomValidationHost,
        LocalizedTimeInputHost,
      ],
    }).compileComponents();
  });

  afterEach(async () => {
    if (document.body.querySelector('[data-slot="pickerPanel"]')) {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body) {
      active.blur();
    }
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
    expect(input.getAttribute('data-slot')).toBe('input');
    expect(input.classList.contains('flex-1')).toBe(true);
    expect(trigger.getAttribute('aria-label')).toBe('Choose time for Start time');
    expect(trigger.getAttribute('aria-describedby')).toBeNull();
    expect(trigger.getAttribute('aria-labelledby')).toBeNull();
  });

  it('merges ui shorthand classes into the root public part only', () => {
    const fixture = TestBed.createComponent(TimeInputPartStyleHost);
    fixture.detectChanges();

    const root = timeInputHost(fixture.nativeElement);
    const input = textInput(fixture.nativeElement);
    const trigger = triggerButton(fixture.nativeElement);

    expect(root.getAttribute('data-slot')).toBe('root');
    expect(root.classList.contains('max-w-[18rem]')).toBe(true);
    expect(root.classList.contains('border-hell-danger')).toBe(true);
    expect(root.classList.contains('border-hell-border')).toBe(false);
    expect(input.getAttribute('data-slot')).toBe('input');
    expect(input.classList.contains('max-w-[18rem]')).toBe(false);
    expect(trigger.getAttribute('data-slot')).toBe('trigger');
    expect(trigger.classList.contains('max-w-[18rem]')).toBe(false);
  });

  it('merges ui object classes into owned input and trigger parts', () => {
    const fixture = TestBed.createComponent(TimeInputPartStyleHost);
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

  it('maps legacy ui object classes into the composed portaled picker parts', async () => {
    const fixture = TestBed.createComponent(TimeInputPartStyleHost);
    fixture.componentInstance.ui.set({
      pickerPanel: 'border-hell-danger p-hell-6',
      minutePreset: 'rounded-hell-md text-lg',
    });
    fixture.detectChanges();

    triggerButton(fixture.nativeElement).click();
    const panel = await waitForElement<HTMLElement>(
      fixture,
      document.body,
      '[data-slot="pickerPanel"]',
    );
    const picker = panel.querySelector('hell-time-picker');
    const preset = panel.querySelector('[data-slot="minutePreset"]');
    if (!(picker instanceof HTMLElement)) throw new Error('Expected composed time picker.');
    if (!(preset instanceof HTMLElement)) throw new Error('Expected minute preset.');

    expect(panel.className).toContain('border-hell-danger');
    expect(panel.className).toContain('p-hell-6');
    expect(panel.className).not.toContain('p-hell-3');
    expect(picker.className).toContain('contents');
    expect(picker.className).not.toContain('border-hell-danger');
    expect(picker.className).not.toContain('p-hell-6');
    expect(preset.className).toContain('rounded-hell-md');
    expect(preset.className).toContain('text-lg');
    expect(preset.className).not.toContain('text-xs');
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
    expect(HELL_DEFAULT_TIME_INPUT_ADAPTER.parseText('9:05 pm', { seconds: false })).toEqual({
      valid: true,
      value: { hour: 21, minute: 5, second: 0 },
    });
    expect(HELL_DEFAULT_TIME_INPUT_ADAPTER.parseText('930', { seconds: false })).toEqual({
      valid: true,
      value: { hour: 9, minute: 30, second: 0 },
    });
    expect(HELL_DEFAULT_TIME_INPUT_ADAPTER.parseText('17', { seconds: false })).toEqual({
      valid: true,
      value: { hour: 17, minute: 0, second: 0 },
    });
    expect(HELL_DEFAULT_TIME_INPUT_ADAPTER.parseText('9p', { seconds: false })).toEqual({
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

  it('syncs the composed picker with parsed minutes and seconds', async () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    input.value = '10:07';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    const panel = await openTimePicker(fixture);
    expect(spinbutton(panel, 'Hours').getAttribute('aria-valuenow')).toBe('10');
    expect(spinbutton(panel, 'Minutes').getAttribute('aria-valuenow')).toBe('7');

    fixture.componentInstance.seconds.set(true);
    fixture.detectChanges();

    input.value = '11:12:13';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(spinbutton(panel, 'Seconds').getAttribute('aria-valuenow')).toBe('13');
    expect(panel.querySelector('[data-slot="pickerUnit"][data-unit="second"]')).not.toBeNull();
    expect(panel.querySelector('[data-slot="unit"]')).toBeNull();
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

  it('keeps the outer panel and exact legacy slots while suppressing canonical picker slots', async () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.componentInstance.value.set({ hour: 8, minute: 30, second: 0 });
    fixture.componentInstance.seconds.set(true);
    fixture.detectChanges();

    const component = timeInputComponent(fixture);
    const panel = await openTimePicker(fixture);
    const picker = panel.querySelector('hell-time-picker');
    if (!(picker instanceof HTMLElement)) throw new Error('Expected composed time picker.');
    const hours = spinbutton(panel, 'Hours');
    const labelId = hours.getAttribute('aria-labelledby');

    expect(panel.getAttribute('data-slot')).toBe('pickerPanel');
    expect(picker.getAttribute('data-slot')).toBeNull();
    expect(picker.className).toContain('contents');
    expect(hours.getAttribute('aria-valuemax')).toBe('23');
    expect(hours.getAttribute('aria-valuenow')).toBe('8');
    expect(spinbutton(panel, 'Minutes').getAttribute('aria-valuenow')).toBe('30');
    expect(spinbutton(panel, 'Seconds').getAttribute('aria-valuenow')).toBe('0');
    expect(hours.getAttribute('aria-valuetext')).toBe('08 hours');
    expect(labelId).not.toBeNull();
    expect(document.getElementById(labelId ?? '')?.textContent?.trim()).toBe('Hours');
    expect(panel.querySelector('[data-slot="pickerReadout"]')?.getAttribute('aria-label')).toBe(
      'Selected time 08:30:00',
    );
    expect(button(panel, 'Set minutes to 30')).not.toBeNull();
    expect(panel.className).toContain('grid');
    expect(panel.querySelector('[data-slot="minutePresets"]')?.className).toContain('grid-cols-4');
    expect(timeInputPartClass(component, 'pickerPanel')).toContain('grid');
    expect(timeInputPartClass(component, 'minutePresets')).toContain('grid-cols-4');

    const legacySlots = new Set(
      Array.from(panel.querySelectorAll<HTMLElement>('[data-slot]')).map((element) =>
        element.getAttribute('data-slot'),
      ),
    );
    expect(legacySlots).toEqual(
      new Set([
        'pickerHeader',
        'pickerReadout',
        'pickerUnits',
        'pickerUnit',
        'pickerUnitLabel',
        'pickerUnitControl',
        'pickerUnitValue',
        'pickerUnitStep',
        'minutePresets',
        'minutePreset',
      ]),
    );
    for (const canonicalSlot of [
      'root',
      'header',
      'readout',
      'units',
      'unit',
      'unitLabel',
      'unitControl',
      'unitValue',
      'unitStep',
    ]) {
      expect(panel.querySelector(`[data-slot="${canonicalSlot}"]`), canonicalSlot).toBeNull();
    }
  });

  it('supports composed picker keyboard changes and quick minute commits', async () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.componentInstance.value.set({ hour: 8, minute: 30, second: 0 });
    fixture.detectChanges();

    const panel = await openTimePicker(fixture);
    const hours = spinbutton(panel, 'Hours');
    const minutes = spinbutton(panel, 'Minutes');

    expect(dispatchKey(hours, 'ArrowUp').defaultPrevented).toBe(true);
    fixture.detectChanges();
    expect(textInput(fixture.nativeElement).value).toBe('09:30');
    expect(hours.getAttribute('aria-valuenow')).toBe('9');

    dispatchKey(hours, 'Home');
    fixture.detectChanges();
    expect(textInput(fixture.nativeElement).value).toBe('00:30');

    dispatchKey(hours, 'End');
    fixture.detectChanges();
    expect(textInput(fixture.nativeElement).value).toBe('23:30');

    dispatchKey(minutes, 'PageDown');
    fixture.detectChanges();
    expect(textInput(fixture.nativeElement).value).toBe('23:25');

    button(panel, 'Set minutes to 45').click();
    fixture.detectChanges();
    expect(textInput(fixture.nativeElement).value).toBe('23:45');
    expect(fixture.componentInstance.values.at(-1)).toEqual({ hour: 23, minute: 45, second: 0 });
  });

  it('keeps unsupported composed picker keys from changing the value', async () => {
    const fixture = TestBed.createComponent(TimeInputHost);
    fixture.componentInstance.value.set({ hour: 8, minute: 30, second: 0 });
    fixture.detectChanges();

    const panel = await openTimePicker(fixture);
    const hours = spinbutton(panel, 'Hours');

    const event = dispatchKey(hours, 'x');
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(false);
    expect(textInput(fixture.nativeElement).value).toBe('08:30');
    expect(hours.getAttribute('aria-valuenow')).toBe('8');
  });

  it('adapts legacy Time Input label overrides into the composed picker', async () => {
    const fixture = TestBed.createComponent(LocalizedTimeInputHost);
    fixture.detectChanges();

    const panel = await openTimePicker(fixture);
    expect(spinbutton(panel, 'Stunden').getAttribute('aria-valuetext')).toBe('08 stunden');
    expect(spinbutton(panel, 'Minuten')).not.toBeNull();
    expect(spinbutton(panel, 'Sekunden')).not.toBeNull();
    expect(panel.querySelector('[data-slot="pickerReadout"]')?.getAttribute('aria-label')).toBe(
      'Gewählte Zeit 08:15:30',
    );
    expect(button(panel, 'Stunden verringern')).not.toBeNull();
    expect(button(panel, 'Stunden erhöhen')).not.toBeNull();
    expect(panel.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe(
      'Minutenvorgaben',
    );
    expect(button(panel, 'Minute 30')).not.toBeNull();
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

  it('uses custom adapter formatting in the composed picker readout and announcement', async () => {
    const fixture = TestBed.createComponent(TimeInputCustomAdapterHost);
    fixture.componentInstance.value.set({ hour: 12, minute: 0, second: 0 });
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    const panel = await openTimePicker(fixture);
    const readout = panel.querySelector('[data-slot="pickerReadout"]');
    if (!(readout instanceof HTMLElement)) throw new Error('Expected picker readout.');

    expect(input.value).toBe('12h00');
    expect(readout.textContent?.trim()).toBe('12h00');
    expect(readout.getAttribute('aria-label')).toBe('Selected time 12h00');
    expect(fixture.componentInstance.values).toEqual([]);
  });

  it('restores the composed picker when a custom adapter rejects its candidate', async () => {
    const fixture = TestBed.createComponent(TimeInputCustomAdapterHost);
    const accepted = { hour: 12, minute: 0, second: 0 } as const;
    fixture.componentInstance.value.set(accepted);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    const panel = await openTimePicker(fixture);
    const hours = spinbutton(panel, 'Hours');
    const minutes = spinbutton(panel, 'Minutes');
    const readout = panel.querySelector('[data-slot="pickerReadout"]');
    if (!(readout instanceof HTMLElement)) throw new Error('Expected picker readout.');

    expect(dispatchKey(hours, 'ArrowDown').defaultPrevented).toBe(true);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(hours.getAttribute('aria-valuenow')).toBe('12');
    expect(minutes.getAttribute('aria-valuenow')).toBe('0');
    expect(readout.textContent?.trim()).toBe('12h00');
    expect(readout.getAttribute('aria-label')).toBe('Selected time 12h00');
    expect(input.value).toBe('12h00');
    expect(fixture.componentInstance.value()).toEqual(accepted);
    expect(fixture.componentInstance.values).toEqual([]);
  });

  it('commits a transformed custom-adapter picker candidate exactly once', async () => {
    const fixture = TestBed.createComponent(TimeInputTransformingAdapterHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    const panel = await openTimePicker(fixture);
    const minutes = spinbutton(panel, 'Minutes');
    const readout = panel.querySelector('[data-slot="pickerReadout"]');
    if (!(readout instanceof HTMLElement)) throw new Error('Expected picker readout.');

    button(panel, 'Set minutes to 15').click();
    await fixture.whenStable();
    fixture.detectChanges();

    const accepted = { hour: 12, minute: 20, second: 0 } as const;
    expect(minutes.getAttribute('aria-valuenow')).toBe('20');
    expect(readout.textContent?.trim()).toBe('12h20');
    expect(readout.getAttribute('aria-label')).toBe('Selected time 12h20');
    expect(input.value).toBe('12h20');
    expect(fixture.componentInstance.control.value).toEqual(accepted);
    expect(fixture.componentInstance.values).toEqual([accepted]);
  });

  it('recognizes a deferred signal-bound echo of an accepted picker candidate', async () => {
    const fixture = TestBed.createComponent(TimeInputSignalTransformingAdapterHost);
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    const panel = await openTimePicker(fixture);
    const minutes = spinbutton(panel, 'Minutes');
    const readout = panel.querySelector('[data-slot="pickerReadout"]');
    if (!(readout instanceof HTMLElement)) throw new Error('Expected picker readout.');

    button(panel, 'Set minutes to 15').click();
    await fixture.whenStable();
    fixture.detectChanges();

    const accepted = { hour: 12, minute: 20, second: 0 } as const;
    expect(fixture.componentInstance.value()).toEqual(accepted);
    expect(minutes.getAttribute('aria-valuenow')).toBe('20');
    expect(readout.textContent?.trim()).toBe('12h20');
    expect(readout.getAttribute('aria-label')).toBe('Selected time 12h20');
    expect(input.value).toBe('12h20');
    expect(fixture.componentInstance.values).toEqual([accepted]);
  });

  it('lets a signal-bound parent substitute a genuinely different picker value', async () => {
    const fixture = TestBed.createComponent(TimeInputSignalTransformingAdapterHost);
    const substituted = { hour: 18, minute: 40, second: 0 } as const;
    fixture.componentInstance.substituteWith = substituted;
    fixture.detectChanges();

    const input = textInput(fixture.nativeElement);
    const panel = await openTimePicker(fixture);
    const minutes = spinbutton(panel, 'Minutes');
    const readout = panel.querySelector('[data-slot="pickerReadout"]');
    if (!(readout instanceof HTMLElement)) throw new Error('Expected picker readout.');

    button(panel, 'Set minutes to 15').click();
    await fixture.whenStable();
    fixture.detectChanges();

    const emitted = { hour: 12, minute: 20, second: 0 } as const;
    expect(fixture.componentInstance.value()).toEqual(substituted);
    expect(minutes.getAttribute('aria-valuenow')).toBe('40');
    expect(readout.textContent?.trim()).toBe('18h40');
    expect(readout.getAttribute('aria-label')).toBe('Selected time 18h40');
    expect(input.value).toBe('18h40');
    expect(fixture.componentInstance.values).toEqual([emitted]);
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

function dispatchKey(target: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

function spinbutton(root: ParentNode, name: string): HTMLElement {
  const element = Array.from(root.querySelectorAll<HTMLElement>('[role="spinbutton"]')).find(
    (candidate) => {
      const labelledby = candidate.getAttribute('aria-labelledby');
      return labelledby ? document.getElementById(labelledby)?.textContent?.trim() === name : false;
    },
  );
  if (!element) throw new Error(`Expected ${name} spinbutton.`);
  return element;
}

function button(root: ParentNode, name: string): HTMLButtonElement {
  const element = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(
    (candidate) => candidate.getAttribute('aria-label') === name,
  );
  if (!element) throw new Error(`Expected ${name} button.`);
  return element;
}

function triggerButton(root: HTMLElement): HTMLButtonElement {
  const trigger = root.querySelector('button[data-slot="trigger"]');
  if (!(trigger instanceof HTMLButtonElement)) throw new Error('Expected time trigger.');
  return trigger;
}

function timeInputComponent(fixture: ComponentFixture<unknown>): HellTimeInput {
  const debugElement = fixture.debugElement.query(By.directive(HellTimeInput));
  if (!debugElement) throw new Error('Expected HellTimeInput component.');
  return debugElement.componentInstance as HellTimeInput;
}

function timeInputHost(root: HTMLElement): HTMLElement {
  const host = root.querySelector('hell-time-input');
  if (!(host instanceof HTMLElement)) throw new Error('Expected time input host.');
  return host;
}

function timeInputPartClass(component: HellTimeInput, part: HellTimeInputPart): string {
  return (component as unknown as { part(part: HellTimeInputPart): string }).part(part);
}

async function openTimePicker(fixture: ComponentFixture<unknown>): Promise<HTMLElement> {
  triggerButton(fixture.nativeElement).click();
  return waitForElement(fixture, document.body, '[data-slot="pickerPanel"]');
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
