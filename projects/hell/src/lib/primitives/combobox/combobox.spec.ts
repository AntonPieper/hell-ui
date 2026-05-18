import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { NgpCombobox } from 'ng-primitives/combobox';

import {
  HellCombobox,
  HellComboboxBasic,
  HellComboboxValue,
  HELL_COMBOBOX_DIRECTIVES,
} from './combobox';

@Component({
  imports: [ReactiveFormsModule, ...HELL_COMBOBOX_DIRECTIVES],
  template: `
    <div hellCombobox [formControl]="control" (valueChange)="values.push($any($event))">
      <input hellComboboxInput aria-label="Assignee" />
      <button hellComboboxButton type="button">Toggle</button>
      <div *hellComboboxPortal hellComboboxDropdown>
        <div hellComboboxOption id="atlas-single" value="atlas">Atlas</div>
        <div hellComboboxOption id="nova-single" value="nova">Nova</div>
      </div>
    </div>
  `,
})
class ComboboxFormHost {
  readonly control = new FormControl<string | null>(null);
  readonly values: Array<string | null> = [];
}

@Component({
  imports: [ReactiveFormsModule, ...HELL_COMBOBOX_DIRECTIVES],
  template: `
    <div
      id="multi-combobox"
      hellCombobox
      multiple
      [formControl]="control"
      (valueChange)="values.push($any($event))"
    >
      <input hellComboboxInput aria-label="Assignees" />
      <button hellComboboxButton type="button">Toggle</button>
      <div *hellComboboxPortal hellComboboxDropdown>
        <div hellComboboxOption id="atlas-multiple" value="atlas">Atlas</div>
        <div hellComboboxOption id="nova-multiple" value="nova">Nova</div>
      </div>
    </div>
  `,
})
class ComboboxMultipleFormHost {
  readonly control = new FormControl<string[]>(['atlas'], { nonNullable: true });
  readonly values: Array<HellComboboxValue<string>> = [];
}

@Component({
  imports: [ReactiveFormsModule, HellComboboxBasic],
  template: `
    <hell-combobox-basic
      [options]="options"
      [formControl]="control"
      (valueChange)="values.push($any($event))"
    />
  `,
})
class ComboboxBasicFormHost {
  readonly options = ['Atlas', 'Nova'];
  readonly control = new FormControl<string | null>(null);
  readonly values: Array<string | null> = [];
}

@Component({
  imports: [HellComboboxBasic],
  template: `<hell-combobox-basic [options]="options" [value]="value()" />`,
})
class ComboboxBasicValueHost {
  readonly options = ['Atlas', 'Nova'];
  readonly value = signal<string | null>('Atlas');
}

describe('HellCombobox', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ComboboxFormHost,
        ComboboxMultipleFormHost,
        ComboboxBasicFormHost,
        ComboboxBasicValueHost,
      ],
    }).compileComponents();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('integrates with reactive forms without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(ComboboxFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const combobox = query<HTMLElement>(fixture.nativeElement, '[hellCombobox]');
    const debug = fixture.debugElement.query(By.directive(HellCombobox));
    const comboboxInstance = debug.injector.get(HellCombobox<string>);

    host.control.setValue('nova');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.values).toEqual([]);

    combobox.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: combobox,
      }),
    );
    fixture.detectChanges();
    expect(host.control.touched).toBe(false);

    const fakeDropdown = document.createElement('div');
    comboboxInstance.registerDropdown(fakeDropdown);

    combobox.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: fakeDropdown,
      }),
    );
    fixture.detectChanges();

    combobox.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: null,
      }),
    );
    fixture.detectChanges();

    expect(host.control.touched).toBe(true);

    comboboxInstance.unregisterDropdown(fakeDropdown);

    host.control.disable();
    fixture.detectChanges();

    expect(combobox.getAttribute('data-disabled')).toBe('');
  });

  it('exposes APG combobox input semantics while closed', () => {
    const fixture = TestBed.createComponent(ComboboxBasicFormHost);
    fixture.detectChanges();

    const input = query<HTMLInputElement>(
      fixture.nativeElement,
      'hell-combobox-basic input[hellComboboxInput]',
    );

    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-haspopup')).toBe('listbox');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.hasAttribute('aria-controls')).toBe(false);
  });

  it('keeps the visible toggle button out of the tab order while preserving clickability', () => {
    const fixture = TestBed.createComponent(ComboboxFormHost);
    fixture.detectChanges();

    const button = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellComboboxButton]');
    expect(button.tabIndex).toBe(-1);
    expect(button.getAttribute('aria-haspopup')).toBe('listbox');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.disabled).toBe(false);
  });

  it('links the input and button to the opened listbox popup', async () => {
    const fixture = TestBed.createComponent(ComboboxBasicFormHost);
    fixture.detectChanges();

    const input = query<HTMLInputElement>(
      fixture.nativeElement,
      'hell-combobox-basic input[hellComboboxInput]',
    );
    const button = query<HTMLButtonElement>(
      fixture.nativeElement,
      'hell-combobox-basic button[hellComboboxButton]',
    );

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    const dropdown = await waitForDropdown(fixture);
    const options = Array.from(dropdown.querySelectorAll<HTMLElement>('[role="option"]'));

    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(input.getAttribute('aria-controls')).toBe(dropdown.id);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.getAttribute('aria-controls')).toBe(dropdown.id);
    expect(dropdown.getAttribute('role')).toBe('listbox');
    expect(options.map((option) => option.textContent?.trim())).toEqual(['Atlas', 'Nova']);
    expect(options.every((option) => option.tabIndex === -1)).toBe(true);
  });

  it('keeps the private ng-primitives compatibility bridge working for value and disabled CVA updates', () => {
    const fixture = TestBed.createComponent(ComboboxFormHost);
    fixture.detectChanges();

    const debug = fixture.debugElement.query(By.directive(HellCombobox));
    const comboboxInstance = debug.injector.get(HellCombobox<string>);
    const ngpCombobox = debug.injector.get(NgpCombobox) as unknown as {
      state: {
        value: { set: (value: unknown) => void };
        disabled: { set: (value: boolean) => void };
      };
    };
    const state = ngpCombobox.state;
    const valueSet = vi.spyOn(state.value, 'set');
    const disabledSet = vi.spyOn(state.disabled, 'set');

    comboboxInstance.writeValue('from-form-state');
    comboboxInstance.setDisabledState(true);

    expect(valueSet).toHaveBeenCalledWith('from-form-state');
    expect(disabledSet).toHaveBeenCalledWith(true);
  });

  it('integrates with reactive forms in multiple mode without echoing programmatic array writes', async () => {
    const fixture = TestBed.createComponent(ComboboxMultipleFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const combobox = query<HTMLElement>(fixture.nativeElement, '#multi-combobox');

    host.control.setValue(['nova']);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.values).toEqual([]);
    expect(host.control.value).toEqual(['nova']);

    combobox.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.touched).toBe(true);
    expect(Array.isArray(host.control.value)).toBe(true);
  });

  it('preserves array-valued options in single mode', () => {
    const fixture = TestBed.createComponent(ComboboxFormHost);
    fixture.detectChanges();

    const debug = fixture.debugElement.query(By.directive(HellCombobox));
    const combobox = debug.injector.get(HellCombobox<readonly string[]>);
    const ngpCombobox = debug.injector.get(NgpCombobox);
    const arrayValue = ['north', 'south'] as const;
    let emitted: HellComboboxValue<readonly string[]> | undefined;

    combobox.registerOnChange((value) => (emitted = value));
    ngpCombobox.valueChange.emit(arrayValue);

    expect(emitted).toBe(arrayValue);
  });

  it('provides a basic combobox preset with form value display and disabled state', () => {
    const fixture = TestBed.createComponent(ComboboxBasicFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const preset = query<HTMLElement>(fixture.nativeElement, 'hell-combobox-basic');
    const root = query<HTMLElement>(fixture.nativeElement, 'hell-combobox-basic [hellCombobox]');
    const input = query<HTMLInputElement>(
      fixture.nativeElement,
      'hell-combobox-basic input[hellComboboxInput]',
    );

    expect(preset.classList.contains('hell-combobox-basic')).toBe(true);
    expect(preset.classList.contains('hell-combobox')).toBe(false);

    expect(input.placeholder).toBe('Search');

    host.control.setValue('Nova');
    fixture.detectChanges();

    expect(input.value).toBe('Nova');
    expect(host.values).toEqual([]);

    root.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: root }));
    fixture.detectChanges();
    expect(host.control.touched).toBe(false);

    root.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    fixture.detectChanges();
    expect(host.control.touched).toBe(true);

    host.control.disable();
    fixture.detectChanges();

    expect(root.getAttribute('data-disabled')).toBe('');
  });

  it('syncs basic combobox external value changes into the filter input', async () => {
    const fixture = TestBed.createComponent(ComboboxBasicValueHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const host = fixture.componentInstance;
    const input = query<HTMLInputElement>(
      fixture.nativeElement,
      'hell-combobox-basic input[hellComboboxInput]',
    );

    expect(input.value).toBe('Atlas');

    host.value.set('Nova');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(input.value).toBe('Nova');
  });
});

async function waitForDropdown(fixture: {
  detectChanges: () => void;
  whenStable: () => Promise<unknown>;
}): Promise<HTMLElement> {
  const timeout = Date.now() + 1000;

  while (Date.now() < timeout) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const dropdown = document.querySelector<HTMLElement>('[hellComboboxDropdown]');
    if (dropdown) return dropdown;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  throw new Error('Expected combobox dropdown.');
}

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
