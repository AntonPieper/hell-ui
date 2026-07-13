import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellInput } from '@hell-ui/angular/input';
import { HELL_FIELD_DIRECTIVES } from './field';

@Component({
  imports: [HellInput, ...HELL_FIELD_DIRECTIVES],
  template: `
    <div id="string-field" hellField orientation="horizontal" ui="gap-hell-4">
      <label data-field="string-label" hellFieldLabel for="string-control">Email</label>
      <input id="string-control" hellInput />
      <div data-field="string-description" hellFieldDescription>Used for receipts.</div>
      <div data-field="string-error" hellFieldError>Required.</div>
    </div>

    <div id="mapped-field" hellField [ui]="fieldUi">
      <label data-field="mapped-label" hellFieldLabel for="mapped-control" [ui]="labelUi">
        Name
      </label>
      <input id="mapped-control" hellInput />
      <div data-field="mapped-description" hellFieldDescription [ui]="descriptionUi">
        Your legal name.
      </div>
      <div data-field="mapped-error" hellFieldError [ui]="errorUi">Name is required.</div>
    </div>
  `,
})
class FieldHost {
  protected readonly fieldUi = {
    root: 'gap-hell-6 flex-row',
  };

  protected readonly labelUi = {
    root: 'text-sm text-hell-danger',
  };

  protected readonly descriptionUi = {
    root: 'text-hell-danger',
  };

  protected readonly errorUi = {
    root: 'text-hell-foreground',
  };
}

describe('HellField', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FieldHost] }).compileComponents();
  });

  it('exposes local root Part Style Maps while preserving orientation and form wiring', () => {
    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();

    const stringField = query(fixture.nativeElement, '#string-field');
    const stringLabel = query<HTMLLabelElement>(fixture.nativeElement, '[data-field="string-label"]');
    const stringInput = query<HTMLInputElement>(fixture.nativeElement, '#string-control');
    const stringDescription = query(fixture.nativeElement, '[data-field="string-description"]');
    const stringError = query(fixture.nativeElement, '[data-field="string-error"]');
    const mappedField = query(fixture.nativeElement, '#mapped-field');
    const mappedLabel = query(fixture.nativeElement, '[data-field="mapped-label"]');
    const mappedDescription = query(fixture.nativeElement, '[data-field="mapped-description"]');
    const mappedError = query(fixture.nativeElement, '[data-field="mapped-error"]');

    expect(stringField.getAttribute('data-slot')).toBe('root');
    expect(stringField.getAttribute('data-orientation')).toBe('horizontal');
    expect(stringField.classList.contains('gap-hell-4')).toBe(true);
    expect(stringField.classList.contains('gap-hell-2')).toBe(false);
    expect(stringLabel.htmlFor).toBe(stringInput.id);
    expect(stringInput.getAttribute('aria-labelledby')).toBe(stringLabel.id);
    expect(stringInput.getAttribute('aria-describedby')).toBe(stringDescription.id);
    expect(stringLabel.getAttribute('data-slot')).toBe('root');
    expect(stringDescription.getAttribute('data-slot')).toBe('root');
    expect(stringError.getAttribute('data-slot')).toBe('root');

    expect(mappedField.getAttribute('data-slot')).toBe('root');
    expect(mappedField.getAttribute('data-orientation')).toBe('vertical');
    expect(mappedField.classList.contains('gap-hell-6')).toBe(true);
    expect(mappedField.classList.contains('gap-hell-2')).toBe(false);
    expect(mappedField.classList.contains('flex-row')).toBe(true);
    expect(mappedField.classList.contains('flex-col')).toBe(false);
    expect(mappedLabel.classList.contains('text-sm')).toBe(true);
    expect(mappedLabel.classList.contains('text-xs')).toBe(false);
    expect(mappedLabel.classList.contains('text-hell-danger')).toBe(true);
    expect(mappedDescription.classList.contains('text-hell-danger')).toBe(true);
    expect(mappedDescription.classList.contains('text-hell-foreground-muted')).toBe(false);
    expect(mappedError.classList.contains('text-hell-foreground')).toBe(true);
    expect(mappedError.classList.contains('text-hell-danger')).toBe(false);
  });
});

function query<T extends HTMLElement = HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element as T;
}
