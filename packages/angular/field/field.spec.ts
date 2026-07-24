import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellInput } from 'hell-ui/input';
import { HELL_FIELD_IMPORTS } from './field';
import { expectUiRouting, sortClasses } from '../spec-helpers';

/**
 * Field specs assert behavior, wiring, and state attributes. Part-Class
 * Pipeline merge semantics are owned centrally by
 * `internal/core/part-class-pipeline.spec.ts`; ui routing asserts that consumer
 * classes reach each part and that nothing outside the default render and the
 * consumer's ui appears, instead of asserting individual recipe classes. Part
 * Recipes stay package-private per ADR 0002, so the recipe snapshot below
 * pins the rendered class surface per part.
 */

@Component({
  imports: [HellInput, ...HELL_FIELD_IMPORTS],
  template: `
    <div id="string-field" hellField orientation="horizontal" ui="gap-hell-4">
      <label data-field="string-label" hellFieldLabel for="string-control">Email</label>
      <input id="string-control" hellInput />
      <div data-field="string-description" hellFieldDescription>Used for receipts.</div>
      <div data-field="string-error" hellFieldError>Required.</div>
    </div>

    <div id="default-field" hellField>
      <label data-field="default-label" hellFieldLabel for="default-control">Plain</label>
      <input id="default-control" hellInput />
      <div data-field="default-description" hellFieldDescription>Plain description.</div>
      <div data-field="default-error" hellFieldError>Plain error.</div>
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

    const defaults = {
      field: query(fixture.nativeElement, '#default-field').className,
      label: query(fixture.nativeElement, '[data-field="default-label"]').className,
      description: query(fixture.nativeElement, '[data-field="default-description"]').className,
      error: query(fixture.nativeElement, '[data-field="default-error"]').className,
    };

    expect(stringField.getAttribute('data-slot')).toBe('root');
    expect(stringField.getAttribute('data-orientation')).toBe('horizontal');
    expectUiRouting(defaults.field, stringField.className, 'gap-hell-4');
    expect(stringLabel.htmlFor).toBe(stringInput.id);
    expect(stringInput.getAttribute('aria-labelledby')).toBe(stringLabel.id);
    expect(stringInput.getAttribute('aria-describedby')).toBe(stringDescription.id);
    expect(stringLabel.getAttribute('data-slot')).toBe('root');
    expect(stringDescription.getAttribute('data-slot')).toBe('root');
    expect(stringError.getAttribute('data-slot')).toBe('root');

    expect(mappedField.getAttribute('data-slot')).toBe('root');
    expect(mappedField.getAttribute('data-orientation')).toBe('vertical');
    expectUiRouting(defaults.field, mappedField.className, 'gap-hell-6 flex-row');
    expectUiRouting(defaults.label, mappedLabel.className, 'text-sm text-hell-danger');
    expectUiRouting(defaults.description, mappedDescription.className, 'text-hell-danger');
    expectUiRouting(defaults.error, mappedError.className, 'text-hell-foreground');
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(FieldHost);
      fixture.detectChanges();

      expect({
        field: sortClasses(query(fixture.nativeElement, '#default-field').className),
        label: sortClasses(query(fixture.nativeElement, '[data-field="default-label"]').className),
        description: sortClasses(
          query(fixture.nativeElement, '[data-field="default-description"]').className,
        ),
        error: sortClasses(query(fixture.nativeElement, '[data-field="default-error"]').className),
      }).toMatchSnapshot('field');
    });
  });
});

function query<T extends HTMLElement = HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${selector}.`);
  return element as T;
}
