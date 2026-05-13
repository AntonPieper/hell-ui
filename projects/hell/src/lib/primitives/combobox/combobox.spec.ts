import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { HellComboboxValue, HELL_COMBOBOX_DIRECTIVES } from './combobox';

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

describe('HellCombobox', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ComboboxFormHost, ComboboxMultipleFormHost] }).compileComponents();
  });

  it('integrates with reactive forms without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(ComboboxFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const combobox = query<HTMLElement>(fixture.nativeElement, '[hellCombobox]');

    host.control.setValue('nova');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.values).toEqual([]);

    combobox.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.touched).toBe(true);

    host.control.disable();
    fixture.detectChanges();

    expect(combobox.getAttribute('data-disabled')).toBe('');
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
});

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
