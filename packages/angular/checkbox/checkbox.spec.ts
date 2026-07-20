import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { HellCheckbox, type HellCheckboxUi, HellNativeCheckbox } from './checkbox';

/**
 * Checkbox specs assert behavior, forms integration, and state attributes.
 * Part-Class Pipeline merge semantics are owned centrally by
 * `core/part-class-pipeline.spec.ts`; ui routing asserts that consumer
 * classes reach each part and that nothing outside the default render and the
 * consumer's ui appears, instead of asserting individual recipe classes. Part
 * Recipes stay package-private per ADR 0002, so the recipe snapshot below
 * pins the rendered class surface per part.
 */

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
      <button data-testid="default-checkbox" hellCheckbox [checked]="true"></button>
      <label>
        <input data-testid="default-native" type="checkbox" hellNativeCheckbox checked />
        Default native
      </label>
      <button
        data-testid="custom-checkbox"
        hellCheckbox
        [checked]="true"
        ui="bg-hell-danger size-hell-6 rounded-hell-pill"
      ></button>
      <button
        data-testid="custom-map-checkbox"
        hellCheckbox
        [checked]="true"
        [ui]="customUi"
      ></button>
      <label>
        <input
          data-testid="native-checkbox"
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
    const defaults = query<HTMLButtonElement>(root, '[data-testid="default-checkbox"]');
    const defaultNative = query<HTMLInputElement>(root, '[data-testid="default-native"]');
    const custom = query<HTMLButtonElement>(root, '[data-testid="custom-checkbox"]');
    const customMap = query<HTMLButtonElement>(root, '[data-testid="custom-map-checkbox"]');
    const native = query<HTMLInputElement>(root, '[data-testid="native-checkbox"]');

    expect(custom.tagName).toBe('BUTTON');
    expect(custom.type).toBe('button');
    expect(custom.getAttribute('role')).toBe('checkbox');
    expect(custom.getAttribute('data-slot')).toBe('root');

    expectUiRouting(classAttr(defaults), classAttr(custom), 'bg-hell-danger size-hell-6 rounded-hell-pill');
    expectUiRouting(classAttr(defaults), classAttr(customMap), 'bg-hell-danger size-hell-6 rounded-hell-pill');

    const defaultIndicator = defaults.querySelector('svg[data-slot="indicator"]');
    const customMapIndicator = customMap.querySelector('svg[data-slot="indicator"]');
    if (!defaultIndicator || !customMapIndicator) throw new Error('Expected svg[data-slot="indicator"].');
    expectUiRouting(classAttr(defaultIndicator), classAttr(customMapIndicator), 'text-hell-danger size-hell-3');

    expect(native.tagName).toBe('INPUT');
    expect(native.type).toBe('checkbox');
    expect(native.getAttribute('data-slot')).toBe('root');
    expectUiRouting(classAttr(defaultNative), classAttr(native), 'border-hell-danger size-hell-6');
    expect(native.getAttribute('aria-required')).toBe('true');
    expect(native.getAttribute('required')).toBe('');
  });

  it('renders the indicator part only while checked or indeterminate', () => {
    const fixture = TestBed.createComponent(CheckboxHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const checkbox = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellCheckbox]');

    expect(checkbox.querySelector('svg[data-slot="indicator"]')).toBeNull();

    host.checked.set(true);
    fixture.detectChanges();

    expect(checkbox.querySelector('svg[data-slot="indicator"]')).not.toBeNull();

    host.checked.set(false);
    host.indeterminate.set(true);
    fixture.detectChanges();

    expect(checkbox.querySelector('svg[data-slot="indicator"]')).not.toBeNull();
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(CheckboxPartStyleHost);
      fixture.detectChanges();

      const defaults = query<HTMLButtonElement>(fixture.nativeElement, '[data-testid="default-checkbox"]');
      const indicator = defaults.querySelector('svg[data-slot="indicator"]');
      if (!indicator) throw new Error('Expected svg[data-slot="indicator"].');

      expect({
        root: sortClasses(classAttr(defaults)),
        indicator: sortClasses(classAttr(indicator)),
        nativeRoot: sortClasses(classAttr(query(fixture.nativeElement, '[data-testid="default-native"]'))),
      }).toMatchSnapshot('checkbox');
    });
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

/**
 * Proves consumer ui classes reach the part through the Part-Class Pipeline:
 * every ui class renders, and nothing outside the default render plus the
 * consumer's ui appears. Merge conflict semantics are owned centrally by
 * `core/part-class-pipeline.spec.ts`.
 */
function expectUiRouting(defaultClassName: string, customClassName: string, ui: string): void {
  const custom = sortClasses(customClassName);
  const ownUi = sortClasses(ui);
  const allowed = new Set([...sortClasses(defaultClassName), ...ownUi]);

  expect(custom).toEqual(expect.arrayContaining(ownUi));
  expect(custom.filter((candidate) => !allowed.has(candidate))).toEqual([]);
}

function classAttr(element: Element): string {
  return element.getAttribute('class') ?? '';
}

function sortClasses(value: string): string[] {
  return value.split(/\s+/).filter(Boolean).sort();
}
