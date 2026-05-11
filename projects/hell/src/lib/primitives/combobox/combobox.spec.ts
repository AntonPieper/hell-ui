import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { HELL_COMBOBOX_DIRECTIVES } from './combobox';

@Component({
  imports: [ReactiveFormsModule, ...HELL_COMBOBOX_DIRECTIVES],
  template: `
    <div hellCombobox [formControl]="control" (valueChange)="values.push($any($event))">
      <input hellComboboxInput aria-label="Assignee" />
      <button hellComboboxButton type="button">Toggle</button>
      <div *hellComboboxPortal hellComboboxDropdown>
        <div hellComboboxOption value="atlas">Atlas</div>
        <div hellComboboxOption value="nova">Nova</div>
      </div>
    </div>
  `,
})
class ComboboxFormHost {
  readonly control = new FormControl<string | null>(null);
  readonly values: Array<string | null> = [];
}

describe('HellCombobox', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ComboboxFormHost] }).compileComponents();
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
});

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
