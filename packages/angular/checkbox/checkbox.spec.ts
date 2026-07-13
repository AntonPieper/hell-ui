import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { HellCheckbox, type HellCheckboxUi, HellNativeCheckbox } from './checkbox';

@Component({
  selector: 'hell-checkbox-host',
  imports: [HellCheckbox],
  template: `
    <button
      hellCheckbox
      [checked]="checked()"
      [indeterminate]="indeterminate()"
      [disabled]="disabled()"
      [required]="required()"
      (checkedChange)="checkedEvents.push($event)"
      (indeterminateChange)="indeterminateEvents.push($event)"
    ></button>
  `,
})
class CheckboxHost {
  readonly checked = signal(false);
  readonly indeterminate = signal(false);
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly checkedEvents: boolean[] = [];
  readonly indeterminateEvents: boolean[] = [];
}

@Component({
  selector: 'hell-checkbox-unbound-host',
  imports: [HellCheckbox],
  template: `
    <button
      hellCheckbox
      indeterminate
      (checkedChange)="checkedEvents.push($event)"
      (indeterminateChange)="indeterminateEvents.push($event)"
    ></button>
  `,
})
class CheckboxUnboundHost {
  readonly checkedEvents: boolean[] = [];
  readonly indeterminateEvents: boolean[] = [];
}

@Component({
  selector: 'hell-checkbox-form-host',
  imports: [ReactiveFormsModule, HellCheckbox],
  template: `
    <button
      hellCheckbox
      [formControl]="control"
      (checkedChange)="checkedEvents.push($event)"
    ></button>
  `,
})
class CheckboxFormHost {
  readonly control = new FormControl(false, { nonNullable: true });
  readonly checkedEvents: boolean[] = [];
}

@Component({
  selector: 'hell-checkbox-required-form-host',
  imports: [ReactiveFormsModule, HellCheckbox],
  template: `
    <button
      hellCheckbox
      [required]="true"
      [formControl]="control"
    ></button>
  `,
})
class CheckboxRequiredFormHost {
  readonly control = new FormControl(false);
}

@Component({
  selector: 'hell-checkbox-disabled-required-host',
  imports: [ReactiveFormsModule, HellCheckbox],
  template: `
    <button hellCheckbox [required]="true" [formControl]="control"></button>
  `,
})
class CheckboxDisabledRequiredHost {
  readonly control = new FormControl(false);
}

@Component({
  selector: 'hell-native-checkbox-form-host',
  imports: [ReactiveFormsModule, HellNativeCheckbox],
  template: `
    <label>
      <input
        type="checkbox"
        hellNativeCheckbox
        [formControl]="control"
        [required]="required()"
        [indeterminate]="indeterminate()"
        (checkedChange)="checkedEvents.push($event)"
      />
      Native checkbox
    </label>
  `,
})
class NativeCheckboxFormHost {
  readonly control = new FormControl(false, { nonNullable: true });
  readonly required = signal(false);
  readonly indeterminate = signal(false);
  readonly checkedEvents: boolean[] = [];
}

@Component({
  selector: 'hell-checkbox-part-style-host',
  imports: [HellCheckbox, HellNativeCheckbox],
  template: `
    <div>
      <button
        id="custom-checkbox"
        hellCheckbox
        [checked]="true"
        ui="bg-hell-danger size-hell-6 rounded-hell-pill"
      ></button>
      <button
        id="custom-map-checkbox"
        hellCheckbox
        [checked]="true"
        [ui]="customUi"
      ></button>
      <label>
        <input
          id="native-checkbox"
          type="checkbox"
          hellNativeCheckbox
          checked
          required
          [ui]="nativeUi"
          [indeterminate]="indeterminate"
        />
        Native
      </label>
    </div>
  `,
})
class CheckboxPartStyleHost {
  readonly indeterminate = signal(false);
  protected readonly nativeUi = {
    root: 'border-hell-danger size-hell-6',
  };
  protected readonly customUi = {
    root: 'bg-hell-danger size-hell-6 rounded-hell-pill',
    indicator: 'text-hell-danger size-hell-3',
  } satisfies HellCheckboxUi;
}

describe('HellCheckbox', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CheckboxHost,
        CheckboxUnboundHost,
        CheckboxFormHost,
        CheckboxRequiredFormHost,
        CheckboxDisabledRequiredHost,
        NativeCheckboxFormHost,
        CheckboxPartStyleHost,
      ],
    }).compileComponents();
  });

  it('uses a native button host and forwards checkbox state', () => {
    const fixture = TestBed.createComponent(CheckboxHost);
    fixture.detectChanges();

    const checkbox = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellCheckbox]');

    expect(checkbox.type).toBe('button');
    expect(checkbox.getAttribute('data-slot')).toBe('root');
    expect(checkbox.getAttribute('role')).toBe('checkbox');
    expect(checkbox.getAttribute('aria-checked')).toBe('false');
    expect(checkbox.getAttribute('aria-required')).toBeNull();
    expect(checkbox.getAttribute('data-required')).toBeNull();
    expect(checkbox.hasAttribute('required')).toBe(false);

    checkbox.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.checkedEvents).toEqual([true]);

    fixture.componentInstance.required.set(true);
    fixture.componentInstance.indeterminate.set(true);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(checkbox.getAttribute('aria-checked')).toBe('mixed');
    expect(checkbox.disabled).toBe(true);
    expect(checkbox.getAttribute('required')).toBe('');
    expect(checkbox.getAttribute('aria-required')).toBe('true');
    expect(checkbox.getAttribute('data-required')).toBe('true');
  });

  it('toggles an unbound checkbox and resolves indeterminate to checked', () => {
    const fixture = TestBed.createComponent(CheckboxUnboundHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const checkbox = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellCheckbox]');

    expect(checkbox.getAttribute('aria-checked')).toBe('mixed');
    expect(checkbox.getAttribute('data-indeterminate')).toBe('');

    checkbox.click();
    fixture.detectChanges();

    expect(checkbox.getAttribute('aria-checked')).toBe('true');
    expect(checkbox.hasAttribute('data-indeterminate')).toBe(false);
    expect(host.checkedEvents).toEqual([true]);
    expect(host.indeterminateEvents).toEqual([false]);

    checkbox.click();
    fixture.detectChanges();

    expect(checkbox.getAttribute('aria-checked')).toBe('false');
    expect(host.checkedEvents).toEqual([true, false]);
  });

  it('integrates with reactive forms without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(CheckboxFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const checkbox = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellCheckbox]');

    host.control.setValue(true);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(checkbox.getAttribute('aria-checked')).toBe('true');
    expect(host.checkedEvents).toEqual([]);

    checkbox.click();
    checkbox.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.value).toBe(false);
    expect(host.control.touched).toBe(true);
    expect(host.checkedEvents).toEqual([false]);

    host.control.disable();
    fixture.detectChanges();

    expect(checkbox.disabled).toBe(true);
  });

  it('validates required through its Validator implementation', () => {
    const fixture = TestBed.createComponent(CheckboxHost);
    const host = fixture.componentInstance;
    host.required.set(true);
    fixture.detectChanges();

    const checkbox = fixture.debugElement.query(By.directive(HellCheckbox)).componentInstance as HellCheckbox;

    expect(checkbox.validate(new FormControl(false))).toEqual({ required: true });
    expect(checkbox.validate(new FormControl(true))).toBeNull();

    host.disabled.set(true);
    fixture.detectChanges();

    expect(checkbox.validate(new FormControl(false))).toBeNull();
  });

  it('validates required with reactive forms via built-in required semantics', () => {
    const fixture = TestBed.createComponent(CheckboxRequiredFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const checkbox = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellCheckbox]');

    expect(host.control.invalid).toBe(true);
    expect(host.control.getError('required')).toBe(true);

    checkbox.click();
    fixture.detectChanges();

    expect(host.control.valid).toBe(true);
    expect(host.control.value).toBe(true);
    expect(host.control.getError('required')).toBeNull();
  });

  it('offers a native checkbox path with built-in form semantics', () => {
    const fixture = TestBed.createComponent(NativeCheckboxFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const checkbox = query<HTMLInputElement>(fixture.nativeElement, 'input[hellNativeCheckbox]');

    expect(checkbox.type).toBe('checkbox');
    expect(checkbox.getAttribute('data-slot')).toBe('root');
    expect(checkbox.checked).toBe(false);

    host.control.setValue(true);
    host.required.set(true);
    host.indeterminate.set(true);
    fixture.detectChanges();

    expect(checkbox.checked).toBe(true);
    expect(checkbox.indeterminate).toBe(true);
    expect(checkbox.checked).toBe(true);
    expect(checkbox.getAttribute('data-indeterminate')).toBe('');
    expect(checkbox.getAttribute('aria-required')).toBe('true');

    checkbox.click();
    fixture.detectChanges();

    expect(host.control.value).toBe(false);
    expect(host.checkedEvents).toEqual([false]);
  });

  it('uses root part style maps while keeping custom and native checkbox semantics', () => {
    const fixture = TestBed.createComponent(CheckboxPartStyleHost);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const customControls = root.querySelectorAll<HTMLButtonElement>('button[hellCheckbox]');
    const custom = customControls[0];
    const customMap = customControls[1];
    const native = query<HTMLInputElement>(fixture.nativeElement, 'input[hellNativeCheckbox]');

    expect(custom).toBeInstanceOf(HTMLButtonElement);
    expect(customMap).toBeInstanceOf(HTMLButtonElement);

    expect(custom.tagName).toBe('BUTTON');
    expect(custom.type).toBe('button');
    expect(custom.getAttribute('role')).toBe('checkbox');
    expect(custom.getAttribute('data-slot')).toBe('root');
    expect(custom.classList.contains('bg-hell-danger')).toBe(true);
    expect(custom.classList.contains('size-hell-6')).toBe(true);
    expect(custom.classList.contains('rounded-hell-pill')).toBe(true);
    expect(custom.classList.contains('size-hell-5')).toBe(false);

    expect(customMap.getAttribute('data-slot')).toBe('root');
    expect(customMap.classList.contains('bg-hell-danger')).toBe(true);
    expect(customMap.classList.contains('size-hell-6')).toBe(true);
    expect(customMap.classList.contains('size-hell-5')).toBe(false);

    const customMapIndicator = customMap.querySelector<SVGElement>('svg[data-slot="indicator"]');
    if (!customMapIndicator) throw new Error('Expected svg[data-slot="indicator"].');
    expect(customMapIndicator.classList.contains('block')).toBe(true);
    expect(customMapIndicator.classList.contains('translate-y-[-0.5px]')).toBe(true);
    expect(customMapIndicator.classList.contains('text-hell-danger')).toBe(true);
    expect(customMapIndicator.classList.contains('size-hell-3')).toBe(true);
    expect(customMapIndicator.classList.contains('size-hell-4')).toBe(false);

    expect(native.tagName).toBe('INPUT');
    expect(native.type).toBe('checkbox');
    expect(native.getAttribute('data-slot')).toBe('root');
    expect(native.classList.contains('border-hell-danger')).toBe(true);
    expect(native.classList.contains('size-hell-6')).toBe(true);
    expect(native.classList.contains('size-hell-5')).toBe(false);
    expect(native.getAttribute('aria-required')).toBe('true');
    expect(native.getAttribute('required')).toBe('');
  });

  it('renders the indicator part with default recipe classes and data-slot', () => {
    const fixture = TestBed.createComponent(CheckboxHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const checkbox = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellCheckbox]');

    expect(checkbox.querySelector('svg[data-slot="indicator"]')).toBeNull();

    host.checked.set(true);
    fixture.detectChanges();

    const checkedIndicator = checkbox.querySelector<SVGElement>('svg[data-slot="indicator"]');
    if (!checkedIndicator) throw new Error('Expected svg[data-slot="indicator"].');
    expect(checkedIndicator.classList.contains('block')).toBe(true);
    expect(checkedIndicator.classList.contains('size-hell-4')).toBe(true);
    expect(checkedIndicator.classList.contains('translate-y-[-0.5px]')).toBe(true);

    host.checked.set(false);
    host.indeterminate.set(true);
    fixture.detectChanges();

    const indeterminateIndicator = checkbox.querySelector<SVGElement>('svg[data-slot="indicator"]');
    if (!indeterminateIndicator) throw new Error('Expected svg[data-slot="indicator"].');
    expect(indeterminateIndicator.classList.contains('block')).toBe(true);
    expect(indeterminateIndicator.classList.contains('size-hell-4')).toBe(true);
    expect(indeterminateIndicator.classList.contains('translate-y-[-0.5px]')).toBe(true);
  });

  it('does not report required when control is disabled', () => {
    const fixture = TestBed.createComponent(CheckboxDisabledRequiredHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;

    host.control.disable();
    fixture.detectChanges();

    expect(host.control.invalid).toBe(false);
    expect(host.control.disabled).toBe(true);
  });
});

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
