import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { HellSelectFormValue, HELL_SELECT_DIRECTIVES } from './select';

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

describe('HellSelect', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SelectFormHost, SelectMultipleFormHost] }).compileComponents();
  });

  it('integrates with reactive forms without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(SelectFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const select = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSelect]');

    host.control.setValue('high');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.values).toEqual([]);

    select.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.touched).toBe(true);

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

    select.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
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
