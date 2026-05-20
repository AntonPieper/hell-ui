import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { NgpSelect } from 'ng-primitives/select';

import { HellSelect, HellSelectBasic, HellSelectFormValue, HELL_SELECT_DIRECTIVES } from './select';

@Component({
  imports: [ReactiveFormsModule, ...HELL_SELECT_DIRECTIVES],
  template: `
    <button
      hellSelect
      type="button"
      [formControl]="control"
      (valueChange)="values.push($any($event))"
    >
      <span hellSelectValue>Selection</span>
      <div *hellSelectPortal hellSelectDropdown>
        <div hellSelectOption value="low">Low</div>
        <div hellSelectOption value="high">High</div>
      </div>
    </button>
  `,
})
class SelectFormHost {
  readonly control = new FormControl<string | null>(null);
  readonly values: Array<string | null> = [];
}

@Component({
  imports: [ReactiveFormsModule, ...HELL_SELECT_DIRECTIVES],
  template: `
    <button
      id="multi-select"
      hellSelect
      multiple
      type="button"
      [formControl]="control"
      (valueChange)="values.push($any($event))"
    >
      <span hellSelectValue>Selection</span>
      <div *hellSelectPortal hellSelectDropdown>
        <div hellSelectOption id="low-multiple" value="low">Low</div>
        <div hellSelectOption id="high-multiple" value="high">High</div>
      </div>
    </button>
  `,
})
class SelectMultipleFormHost {
  readonly control = new FormControl<string[]>(['low'], { nonNullable: true });
  readonly values: Array<HellSelectFormValue<string>> = [];
}

@Component({
  imports: [ReactiveFormsModule, HellSelectBasic],
  template: `
    <p id="priority-help">Used to route incoming work.</p>
    <hell-select-basic
      aria-label="Priority"
      [aria-describedby]="'priority-help'"
      [options]="options"
      [formControl]="control"
      (valueChange)="values.push($any($event))"
    />
  `,
})
class SelectBasicFormHost {
  readonly options = ['Low', 'High'];
  readonly control = new FormControl<string | null>(null);
  readonly values: Array<string | null> = [];
}

@Component({
  imports: [HellSelectBasic],
  template: `
    <span id="priority-label">Priority</span>
    <p id="priority-description">Used to route incoming work.</p>
    <hell-select-basic
      [aria-labelledby]="'priority-label'"
      [aria-describedby]="'priority-description'"
      [options]="options"
      [value]="value()"
    />
  `,
})
class SelectBasicLabelledHost {
  readonly options = ['Low', 'High'];
  readonly value = signal<string | null>(null);
}

describe('HellSelect', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectFormHost, SelectMultipleFormHost, SelectBasicFormHost, SelectBasicLabelledHost],
    }).compileComponents();
  });

  it('integrates with reactive forms without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(SelectFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const select = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSelect]');
    const debug = fixture.debugElement.query(By.directive(HellSelect));
    const selectInstance = debug.injector.get(HellSelect<string>);

    host.control.setValue('high');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.values).toEqual([]);

    select.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: select,
      }),
    );
    fixture.detectChanges();
    expect(host.control.touched).toBe(false);

    const fakeDropdown = document.createElement('div');
    selectInstance.registerDropdown(fakeDropdown);

    select.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: fakeDropdown,
      }),
    );
    fixture.detectChanges();

    select.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: null,
      }),
    );
    fixture.detectChanges();

    expect(host.control.touched).toBe(true);

    selectInstance.unregisterDropdown(fakeDropdown);

    host.control.disable();
    fixture.detectChanges();

    expect(select.getAttribute('data-disabled')).toBe('');
    expect(select.tabIndex).toBe(-1);
  });

  it('integrates with reactive forms in multiple mode without echoing programmatic array writes', async () => {
    const fixture = TestBed.createComponent(SelectMultipleFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const select = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSelect]');

    host.control.setValue(['high']);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.values).toEqual([]);
    expect(host.control.value).toEqual(['high']);

    select.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    fixture.detectChanges();

    expect(host.control.touched).toBe(true);
    expect(Array.isArray(host.control.value)).toBe(true);
  });

  it('preserves array-valued options in single mode', () => {
    const fixture = TestBed.createComponent(SelectFormHost);
    fixture.detectChanges();

    const debug = fixture.debugElement.query(By.directive(HellSelect));
    const select = debug.injector.get(HellSelect<readonly string[]>);
    const ngpSelect = debug.injector.get(NgpSelect);
    const arrayValue = ['north', 'south'] as const;
    let emitted: HellSelectFormValue<readonly string[]> | undefined;

    select.registerOnChange((value) => (emitted = value));
    ngpSelect.valueChange.emit(arrayValue);

    expect(emitted).toBe(arrayValue);
  });

  it('provides a basic select preset with form value display and disabled state', () => {
    const fixture = TestBed.createComponent(SelectBasicFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const preset = query<HTMLElement>(fixture.nativeElement, 'hell-select-basic');
    const trigger = query<HTMLButtonElement>(fixture.nativeElement, 'hell-select-basic button[hellSelect]');

    expect(preset.classList.contains('hell-select-basic')).toBe(true);
    expect(preset.classList.contains('hell-select')).toBe(false);
    expect(trigger.textContent?.trim()).toContain('Select');
    expect(trigger.getAttribute('aria-label')).toBe('Priority');
    expect(trigger.getAttribute('aria-describedby')).toBe('priority-help');

    host.control.setValue('High');
    fixture.detectChanges();

    expect(trigger.textContent?.trim()).toContain('High');
    expect(trigger.getAttribute('aria-label')).toBe('Priority');
    expect(trigger.getAttribute('aria-describedby')).toBe('priority-help');
    expect(host.values).toEqual([]);

    trigger.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: trigger }));
    fixture.detectChanges();
    expect(host.control.touched).toBe(false);

    trigger.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    fixture.detectChanges();
    expect(host.control.touched).toBe(true);

    host.control.disable();
    fixture.detectChanges();

    expect(trigger.getAttribute('data-disabled')).toBe('');
  });

  it('keeps the basic select accessible name stable before and after selection', () => {
    const fixture = TestBed.createComponent(SelectBasicLabelledHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const trigger = query<HTMLButtonElement>(root, 'hell-select-basic button[hellSelect]');

    expect(trigger.textContent?.trim()).toContain('Select');
    expect(trigger.getAttribute('aria-labelledby')).toBe('priority-label');
    expect(trigger.getAttribute('aria-describedby')).toBe('priority-description');
    expect(accessibleName(root, trigger)).toBe('Priority');

    host.value.set('High');
    fixture.detectChanges();

    expect(trigger.textContent?.trim()).toContain('High');
    expect(accessibleName(root, trigger)).toBe('Priority');
    expect(trigger.getAttribute('aria-describedby')).toBe('priority-description');
  });
});

function accessibleName(root: HTMLElement, element: HTMLElement): string {
  const labelledby = element.getAttribute('aria-labelledby');
  if (labelledby) {
    return labelledby
      .trim()
      .split(/\s+/)
      .map((id) => root.querySelector<HTMLElement>(`[id="${id}"]`)?.textContent?.trim() ?? '')
      .filter(Boolean)
      .join(' ');
  }

  return element.getAttribute('aria-label') ?? element.textContent?.trim() ?? '';
}

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
