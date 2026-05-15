import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { NgpCombobox } from 'ng-primitives/combobox';

import { HellCombobox, HellComboboxBasic, HellComboboxValue, HELL_COMBOBOX_DIRECTIVES } from './combobox';

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
    <div id="multi-combobox" hellCombobox multiple [formControl]="control" (valueChange)="values.push($any($event))">
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
  template: `<hell-combobox-basic [options]="options" [value]="value()" />`
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

  it('writes through the ng-primitives state seam for value and disabled updates', () => {
    const fixture = TestBed.createComponent(ComboboxFormHost);
    fixture.detectChanges();

    const debug = fixture.debugElement.query(By.directive(HellCombobox));
    const comboboxInstance = debug.injector.get(HellCombobox<string>);
    const ngpCombobox = debug.injector.get(NgpCombobox);
    const state = (ngpCombobox as any).state as {
      value: { set: (value: unknown) => void };
      disabled: { set: (value: boolean) => void };
    };
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
    const input = query<HTMLInputElement>(fixture.nativeElement, 'hell-combobox-basic input[hellComboboxInput]');

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
    const input = query<HTMLInputElement>(fixture.nativeElement, 'hell-combobox-basic input[hellComboboxInput]');

    expect(input.value).toBe('Atlas');

    host.value.set('Nova');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(input.value).toBe('Nova');
  });
});

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
