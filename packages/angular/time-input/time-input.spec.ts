import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormsModule,
  NgModel,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormField, disabled as disabledSchema, form, validate } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { NgpInput } from 'ng-primitives/input';

import { HELL_FIELD_IMPORTS } from '@hell-ui/angular/field';
import {
  HELL_DEFAULT_TIME_INPUT_ADAPTER,
  HellTimeInput,
  provideHellTimeInputAdapter,
  type HellTimeValue,
} from './time-input';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTimeInput],
  template: `
    <input
      id="start-time"
      hellTimeInput
      type="text"
      name="startTime"
      placeholder="HH:mm"
      inputmode="numeric"
      autocomplete="off"
      size="sm"
      ui="max-w-64 font-mono"
      aria-label="Start time"
      aria-describedby="start-help external-help"
      aria-labelledby="start-label"
      [value]="value()"
      [min]="min()"
      [max]="max()"
      [seconds]="seconds()"
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
  readonly value = signal<HellTimeValue | null>(time(8, 30));
  readonly min = signal<HellTimeValue | null>(null);
  readonly max = signal<HellTimeValue | null>(null);
  readonly seconds = signal(false);
  readonly required = signal(false);
  readonly disabled = signal(false);
  readonly invalid = signal(false);
  readonly values: Array<HellTimeValue | null> = [];
  readonly keys: string[] = [];
  inputEvents = 0;
  changeEvents = 0;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTimeInput],
  template: `
    <input
      hellTimeInput
      aria-label="Two-way time"
      [(value)]="value"
      (valueChange)="values.push($event)"
    />
  `,
})
class TwoWayHost {
  readonly value = signal<HellTimeValue | null>(time(8, 30));
  readonly values: Array<HellTimeValue | null> = [];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, HellTimeInput],
  template: `
    <input
      id="form-time"
      hellTimeInput
      aria-label="Form time"
      [formControl]="control"
      (valueChange)="values.push($event)"
    />
  `,
})
class FormHost {
  readonly control = new FormControl<HellTimeValue | null>(time(8, 30));
  readonly values: Array<HellTimeValue | null> = [];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, HellTimeInput],
  template: `<input hellTimeInput aria-label="Blur time" [formControl]="control" />`,
})
class BlurFormHost {
  readonly control = new FormControl<HellTimeValue | null>(time(8, 30), {
    updateOn: 'blur',
  });
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, HellTimeInput],
  template: `
    <input
      hellTimeInput
      aria-label="Model time"
      [(ngModel)]="value"
      (valueChange)="values.push($event)"
    />
  `,
})
class NgModelHost {
  readonly value = signal<HellTimeValue | null>(time(8, 30));
  readonly model = viewChild.required(NgModel);
  readonly values: Array<HellTimeValue | null> = [];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, HellTimeInput],
  template: `
    <input
      id="signal-time"
      hellTimeInput
      aria-label="Signal time"
      [formField]="scheduleForm.time"
      (valueChange)="values.push($event)"
    />
  `,
})
class SignalFormsHost {
  readonly formDisabled = signal(false);
  readonly model = signal<{ time: HellTimeValue | null }>({ time: time(8, 30) });
  readonly scheduleForm = form(this.model, (path) => {
    disabledSchema(path.time, () => this.formDisabled());
    // Structured times have no built-in min()/max() metadata rule, so range
    // policy is a form-owned schema rule rather than a reserved-input write.
    validate(path.time, ({ value }) => {
      const committed = value();
      if (!committed) return undefined;
      return committed.hour >= 8 && committed.hour < 18
        ? undefined
        : { kind: 'outOfRangeTime' };
    });
  });
  readonly values: Array<HellTimeValue | null> = [];
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTimeInput],
  template: `<input hellTimeInput disabled aria-label="Static disabled time" />`,
})
class StaticDisabledHost {}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTimeInput],
  template: `
    <form>
      <input
        hellTimeInput
        name="shipTime"
        aria-label="Serialized time"
        [value]="value()"
        (valueChange)="value.set($event)"
      />
    </form>
  `,
})
class NativeFormHost {
  readonly value = signal<HellTimeValue | null>(time(8, 30));
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, HellTimeInput],
  template: `
    <input
      id="validated-time"
      hellTimeInput
      aria-label="Validated time"
      [min]="min()"
      [max]="max()"
      [formControl]="control"
    />
  `,
})
class ValidationHost {
  readonly control = new FormControl<HellTimeValue | null>(null, {
    validators: [Validators.required],
  });
  readonly min = signal<HellTimeValue | null>(time(8));
  readonly max = signal<HellTimeValue | null>(time(18));
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTimeInput, ...HELL_FIELD_IMPORTS],
  template: `
    <div hellField>
      <label hellFieldLabel for="field-time">Start time</label>
      <input
        id="field-time"
        hellTimeInput
        aria-describedby="external-description"
        aria-labelledby="external-label"
      />
      <div hellFieldDescription>Use the local timezone.</div>
    </div>
  `,
})
class FieldHost {}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, HellTimeInput, ...HELL_FIELD_IMPORTS],
  template: `
    <div hellField>
      <label hellFieldLabel for="invalid-field-time">Restricted time</label>
      <input id="invalid-field-time" hellTimeInput [formControl]="control" />
      <div hellFieldError ngpErrorValidator="restrictedTime">Choose another time.</div>
    </div>
  `,
})
class InvalidFieldHost {
  readonly control = new FormControl<HellTimeValue | null>(time(8, 30), {
    validators: () => ({ restrictedTime: true }),
  });
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellTimeInput],
  providers: [
    provideHellTimeInputAdapter({
      parseText: (text, context) =>
        text.trim().toLowerCase() === 'noon'
          ? { valid: true, value: context.seconds ? time(12, 0, 45) : time(12) }
          : text.trim()
            ? { valid: false }
            : { valid: true, value: null },
      format: (value, context) =>
        value ? `custom:${value.hour}:${context.seconds ? value.second : value.minute}` : '',
      normalize: (value, context) =>
        value && value.hour >= 12
          ? { ...value, second: context.seconds ? value.second : 0 }
          : null,
      isSameValue: (left, right) =>
        left?.hour === right?.hour &&
        left?.minute === right?.minute &&
        left?.second === right?.second,
      isWithinBounds: (value, min, max) =>
        !value || ((!min || value.hour >= min.hour) && (!max || value.hour <= max.hour)),
    }),
  ],
  template: `
    <form>
      <input
        hellTimeInput
        name="customTime"
        aria-label="Custom time"
        seconds
        [value]="value()"
        [min]="min"
        (valueChange)="values.push($event)"
      />
    </form>
  `,
})
class CustomAdapterHost {
  readonly value = signal<HellTimeValue | null>(time(8, 30));
  readonly min = time(12);
  readonly values: Array<HellTimeValue | null> = [];
}

describe('HellTimeInput', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ControlledHost,
        TwoWayHost,
        FormHost,
        BlurFormHost,
        NgModelHost,
        SignalFormsHost,
        StaticDisabledHost,
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

    const input = timeInput(fixture.nativeElement);
    expect(fixture.nativeElement.querySelector('hell-time-input')).toBeNull();
    expect(input.parentElement).toBe(fixture.nativeElement);
    expect(input.getAttribute('data-slot')).toBe('root');
    expect(input.getAttribute('data-size')).toBe('sm');
    // The consumer ui classes are the test's own contract fixtures; merge
    // semantics are owned centrally by `core/part-class-pipeline.spec.ts`.
    expect(input.classList.contains('max-w-64')).toBe(true);
    expect(input.classList.contains('font-mono')).toBe(true);
  });

  it('preserves native attributes, focus, and input/change event propagation', async () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = timeInput(fixture.nativeElement);

    expect(input.id).toBe('start-time');
    expect(input.type).toBe('text');
    expect(input.name).toBe('startTime');
    expect(input.placeholder).toBe('HH:mm');
    expect(input.inputMode).toBe('numeric');
    expect(input.autocomplete).toBe('off');
    expect(input.getAttribute('aria-label')).toBe('Start time');
    expect(input.getAttribute('aria-describedby')).toBe('start-help external-help');
    expect(input.getAttribute('aria-labelledby')).toBe('start-label');

    input.focus();
    expect(input.ownerDocument.activeElement).toBe(input);

    typeText(input, '09:45');
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
    const input = timeInput(fixture.nativeElement);
    expect(input.value).toBe('08:30');

    typeText(input, '9:05 pm');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.values).toEqual([time(21, 5)]);
    expect(input.value).toBe('21:05');
  });

  it('synchronizes two-way binding through one value authority without duplicate commits', async () => {
    const fixture = TestBed.createComponent(TwoWayHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = timeInput(fixture.nativeElement);
    expect(input.value).toBe('08:30');

    // External parent write flows in without echoing a change event.
    host.value.set(time(12, 45));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('12:45');
    expect(host.values).toEqual([]);

    // One user commit updates parent state and emits exactly one event.
    typeText(input, '13:15');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(host.value()).toEqual(time(13, 15));
    expect(host.values.length).toBe(1);
    expect(host.values[0]).toEqual(time(13, 15));
    expect(input.value).toBe('13:15');
  });

  it('parses separated, compact, and 12-hour default time text', () => {
    expect(HELL_DEFAULT_TIME_INPUT_ADAPTER.parseText('9:05 pm', { seconds: false })).toEqual({
      valid: true,
      value: time(21, 5),
    });
    expect(HELL_DEFAULT_TIME_INPUT_ADAPTER.parseText('930', { seconds: false })).toEqual({
      valid: true,
      value: time(9, 30),
    });
    expect(HELL_DEFAULT_TIME_INPUT_ADAPTER.parseText('17', { seconds: false })).toEqual({
      valid: true,
      value: time(17),
    });
    expect(HELL_DEFAULT_TIME_INPUT_ADAPTER.parseText('9p', { seconds: false })).toEqual({
      valid: true,
      value: time(21),
    });
    expect(HELL_DEFAULT_TIME_INPUT_ADAPTER.parseText('13p', { seconds: false })).toEqual({
      valid: false,
    });
    expect(HELL_DEFAULT_TIME_INPUT_ADAPTER.parseText('12:61', { seconds: false })).toEqual({
      valid: false,
    });
  });

  it('keeps invalid partial drafts visible and clears invalid state after correction', () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = timeInput(fixture.nativeElement);

    typeText(input, '9:');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(host.values).toEqual([]);
    expect(input.value).toBe('9:');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('data-invalid')).toBe('');

    typeText(input, '09:08');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(host.values).toEqual([time(9, 8)]);
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(input.getAttribute('data-invalid')).toBeNull();
  });

  it('commits an empty draft as a nullable clear', () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = timeInput(fixture.nativeElement);

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
    const input = timeInput(fixture.nativeElement);
    typeText(input, '10:09');

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
    expect(host.values).toEqual([time(10, 9)]);
    expect(host.keys).toEqual(['ArrowLeft', 'Enter']);
  });

  it('synchronously canonicalizes native form serialization after blur and Enter', () => {
    const fixture = TestBed.createComponent(NativeFormHost);
    fixture.detectChanges();
    const input = timeInput(fixture.nativeElement);
    const form = fixture.nativeElement.querySelector('form');
    if (!(form instanceof HTMLFormElement)) throw new Error('Expected native form.');

    expect(new FormData(form).get('shipTime')).toBe('08:30');

    typeText(input, ' 9:07 am ');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    expect(input.value).toBe('09:07');
    expect(new FormData(form).get('shipTime')).toBe('09:07');

    typeText(input, ' 1325 ');
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    expect(input.value).toBe('13:25');
    expect(new FormData(form).get('shipTime')).toBe('13:25');
  });

  it('preserves an active draft across equivalent controlled writes', async () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = timeInput(fixture.nativeElement);

    typeText(input, '8:');
    host.value.set(time(8, 30, 45));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(input.value).toBe('8:');
  });

  it('synchronizes a genuinely changed controlled value and rejects the stale draft', async () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = timeInput(fixture.nativeElement);

    typeText(input, '10:11');
    host.value.set(time(12, 45));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('12:45');

    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(host.values).toEqual([]);
    expect(input.value).toBe('12:45');
  });

  it('does not resurrect a discarded draft when the external value later returns', async () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = timeInput(fixture.nativeElement);

    typeText(input, '10:11');
    host.value.set(time(12, 45));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('12:45');

    host.value.set(time(8, 30));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('08:30');
  });

  it('reflects required, disabled, invalid, bounds, and precision on the native host', () => {
    const fixture = TestBed.createComponent(ControlledHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = timeInput(fixture.nativeElement);

    host.required.set(true);
    host.disabled.set(true);
    host.invalid.set(true);
    host.min.set(time(8, 15, 30));
    host.max.set(time(18, 45, 50));
    fixture.detectChanges();

    expect(input.required).toBe(true);
    expect(input.disabled).toBe(true);
    expect(input.getAttribute('min')).toBe('08:15');
    expect(input.getAttribute('max')).toBe('18:45');
    expect(input.getAttribute('step')).toBe('60');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.hasAttribute('data-disabled')).toBe(true);
    expect(input.getAttribute('data-required')).toBe('true');
    host.seconds.set(true);
    fixture.detectChanges();
    expect(input.getAttribute('min')).toBe('08:15:30');
    expect(input.getAttribute('max')).toBe('18:45:50');
    expect(input.getAttribute('step')).toBe('1');
  });

  it('parses, formats, and normalizes second precision only when enabled', () => {
    const fixture = TestBed.createComponent(ControlledHost);
    const host = fixture.componentInstance;
    host.value.set(time(8, 30, 45));
    fixture.detectChanges();
    const input = timeInput(fixture.nativeElement);
    expect(input.value).toBe('08:30');

    typeText(input, '09:10:11');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(host.values).toEqual([]);
    expect(input.value).toBe('09:10:11');
    expect(input.getAttribute('aria-invalid')).toBe('true');

    host.seconds.set(true);
    host.value.set(time(8, 30, 45));
    fixture.detectChanges();
    expect(input.value).toBe('08:30:45');

    typeText(input, '09:10:11');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(host.values).toEqual([time(9, 10, 11)]);
    expect(input.value).toBe('09:10:11');
  });

  it('integrates with Reactive Forms without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = timeInput(fixture.nativeElement);
    expect(input.value).toBe('08:30');

    host.control.setValue(time(9, 5));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('09:05');
    expect(host.values).toEqual([]);

    typeText(input, '10:06');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(host.control.value).toEqual(time(10, 6));
    expect(host.values).toEqual([time(10, 6)]);
    expect(host.control.touched).toBe(true);
  });

  it('preserves a form draft across an equivalent form write but replaces it on change', async () => {
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = timeInput(fixture.nativeElement);

    typeText(input, '8:');
    host.control.setValue(time(8, 30, 59));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('8:');

    host.control.setValue(time(12, 15));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('12:15');
  });

  it('commits form changes before touched state for updateOn blur controls', () => {
    const fixture = TestBed.createComponent(BlurFormHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = timeInput(fixture.nativeElement);

    typeText(input, '09:45');
    expect(host.control.value).toEqual(time(8, 30));

    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(host.control.value).toEqual(time(9, 45));
    expect(host.control.touched).toBe(true);
  });

  it('propagates disabled state from Angular forms to the native input', async () => {
    const fixture = TestBed.createComponent(FormHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = timeInput(fixture.nativeElement);

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
    const input = timeInput(fixture.nativeElement);
    expect(input.value).toBe('08:30');
    expect(host.values).toEqual([]);

    // Enter commits without touching; blur marks the model touched.
    typeText(input, '09:40');
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(host.value()).toEqual(time(9, 40));
    expect(host.values.length).toBe(1);
    expect(host.model().touched).toBe(false);

    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    expect(host.model().touched).toBe(true);

    host.value.set(time(12, 15));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('12:15');
    expect(host.values.length).toBe(1);
  });

  it('participates in Signal Forms as a FormValueControl through formField', async () => {
    const fixture = TestBed.createComponent(SignalFormsHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = timeInput(fixture.nativeElement);
    expect(input.value).toBe('08:30');

    // Form-driven writes flow in without echoing an interaction commit.
    host.scheduleForm.time().value.set(time(9, 15));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('09:15');
    expect(host.values).toEqual([]);
    expect(host.scheduleForm.time().dirty()).toBe(false);

    // One user commit updates the field and the model exactly once.
    typeText(input, '10:45');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.scheduleForm.time().value()).toEqual(time(10, 45));
    expect(host.model().time).toEqual(time(10, 45));
    expect(host.values.length).toBe(1);
    expect(host.scheduleForm.time().dirty()).toBe(true);
    expect(host.scheduleForm.time().touched()).toBe(true);
  });

  it('reports parse failures to the Signal Forms field through transformedValue', async () => {
    const fixture = TestBed.createComponent(SignalFormsHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = timeInput(fixture.nativeElement);

    // A malformed committed draft stays editable and never becomes a value.
    typeText(input, '25:00');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.value).toBe('25:00');
    expect(host.scheduleForm.time().value()).toEqual(time(8, 30));
    expect(host.values).toEqual([]);
    expect(errorKinds(host)).toContain('invalidTimeInputDraft');
    expect(input.getAttribute('aria-invalid')).toBe('true');

    // A corrected commit clears the parse error and commits once.
    typeText(input, '17:20');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.scheduleForm.time().value()).toEqual(time(17, 20));
    expect(host.values.length).toBe(1);
    expect(errorKinds(host)).not.toContain('invalidTimeInputDraft');
    expect(input.getAttribute('aria-invalid')).toBeNull();

    // Schema-owned range policy: an out-of-window commit is a real commit whose
    // field error drives the reserved invalid input back onto the native host.
    typeText(input, '19:30');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.scheduleForm.time().value()).toEqual(time(19, 30));
    expect(host.values.length).toBe(2);
    expect(errorKinds(host)).toEqual(['outOfRangeTime']);
    expect(input.getAttribute('aria-invalid')).toBe('true');

    // An empty commit is a nullable clear through the same authority.
    typeText(input, '');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.scheduleForm.time().value()).toBeNull();
    expect(host.model().time).toBeNull();
    expect(host.values).toEqual([expect.anything(), expect.anything(), null]);
    expect(input.getAttribute('aria-invalid')).toBeNull();

    // Field-driven disabled state reaches the native input.
    host.formDisabled.set(true);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
    expect(input.hasAttribute('data-disabled')).toBe(true);
  });

  it('reflects a static disabled attribute through the Input behavior state', async () => {
    const fixture = TestBed.createComponent(StaticDisabledHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const input = timeInput(fixture.nativeElement);
    const directive = fixture.debugElement
      .query(By.directive(HellTimeInput))
      .injector.get(HellTimeInput);
    const primitive = fixture.debugElement.query(By.directive(NgpInput)).injector.get(NgpInput);

    expect(input.id).toMatch(/^hell-time-input-\d+$/);
    expect(input.id).toBe(directive.id());
    expect(input.disabled).toBe(true);
    expect(directive.disabled()).toBe(true);
    expect(primitive.disabled()).toBe(true);
    expect(input.getAttribute('data-disabled')).toBe('');
  });

  it('keeps classic validation form-owned while drafts stay visual-only invalid state', async () => {
    const fixture = TestBed.createComponent(ValidationHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = timeInput(fixture.nativeElement);

    // The control's own required validator drives errors and the reserved
    // required input, so the missing value is visible on the native host.
    expect(host.control.errors).toEqual({ required: true });
    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');

    // Out-of-range external writes keep the visual invalid contract.
    host.control.setValue(time(7, 59));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.control.hasError('required')).toBe(false);
    expect(input.getAttribute('aria-invalid')).toBe('true');

    host.control.setValue(time(12));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.control.errors).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBeNull();

    // A malformed committed draft never commits and stays a visual invalid
    // state; classic controls receive no directive-owned error for it.
    typeText(input, '25:00');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.control.errors).toBeNull();
    expect(host.control.value).toEqual(time(12));
    expect(input.value).toBe('25:00');
    expect(input.getAttribute('aria-invalid')).toBe('true');

    // Typed text outside the control's own bounds is also an invalid draft.
    typeText(input, '19:30');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.control.errors).toBeNull();
    expect(host.control.value).toEqual(time(12));
    expect(input.value).toBe('19:30');
    expect(input.getAttribute('aria-invalid')).toBe('true');

    typeText(input, '18:00');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(host.control.errors).toBeNull();
    expect(host.control.value).toEqual(time(18));
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('wires Field label and description ids on the same native input', () => {
    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();
    const input = timeInput(fixture.nativeElement);
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
    const input = timeInput(fixture.nativeElement);
    const error = fixture.nativeElement.querySelector('[hellFieldError]');
    if (!(error instanceof HTMLElement)) throw new Error('Expected Field error.');

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(error.id);
  });

  it('uses injected parse, format, normalize, bounds, context, and native serialization', () => {
    const fixture = TestBed.createComponent(CustomAdapterHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input = timeInput(fixture.nativeElement);
    const form = fixture.nativeElement.querySelector('form');
    if (!(form instanceof HTMLFormElement)) throw new Error('Expected custom adapter form.');
    expect(input.value).toBe('');
    expect(input.getAttribute('min')).toBe('custom:12:0');

    typeText(input, 'noon');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    expect(host.values).toEqual([time(12, 0, 45)]);
    expect(input.value).toBe('custom:12:45');
    expect(new FormData(form).get('customTime')).toBe('custom:12:45');

    typeText(input, '');
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    expect(host.values[1]).toBeNull();
    expect(input.value).toBe('');
    expect(new FormData(form).get('customTime')).toBe('');
  });

  it('compares, normalizes, and bounds default time values at active precision', () => {
    expect(HELL_DEFAULT_TIME_INPUT_ADAPTER.isSameValue!(time(8, 30), time(8, 30))).toBe(
      true,
    );
    expect(HELL_DEFAULT_TIME_INPUT_ADAPTER.isSameValue!(time(8, 30), time(8, 31))).toBe(
      false,
    );
    expect(
      HELL_DEFAULT_TIME_INPUT_ADAPTER.normalize!(time(8, 30, 45), { seconds: false }),
    ).toEqual(time(8, 30));
    expect(
      HELL_DEFAULT_TIME_INPUT_ADAPTER.normalize!(time(8, 30, 45), { seconds: true }),
    ).toEqual(time(8, 30, 45));
    expect(
      HELL_DEFAULT_TIME_INPUT_ADAPTER.isWithinBounds!(
        time(8, 30, 59),
        time(8, 30),
        time(9),
        { seconds: false },
      ),
    ).toBe(true);
    expect(
      HELL_DEFAULT_TIME_INPUT_ADAPTER.isWithinBounds!(
        time(8, 29, 59),
        time(8, 30),
        time(9),
        { seconds: true },
      ),
    ).toBe(false);
    expect(
      HELL_DEFAULT_TIME_INPUT_ADAPTER.isWithinBounds!(
        time(23),
        time(22),
        time(2),
        { seconds: false },
      ),
    ).toBe(false);
  });
});

function timeInput(root: HTMLElement): HTMLInputElement {
  const input = root.querySelector('input[hellTimeInput]');
  if (!(input instanceof HTMLInputElement)) throw new Error('Expected input[hellTimeInput].');
  return input;
}

function typeText(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function time(hour: number, minute = 0, second = 0): HellTimeValue {
  return { hour, minute, second };
}

function errorKinds(host: SignalFormsHost): string[] {
  return host.scheduleForm
    .time()
    .errors()
    .map((error) => error.kind);
}
