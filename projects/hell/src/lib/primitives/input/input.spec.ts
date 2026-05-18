import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_FIELD_DIRECTIVES } from '../field/field';
import { HellInput, HellNativeSelect, HellTextarea } from './input';

@Component({
  imports: [HellInput, HellNativeSelect, HellTextarea, ...HELL_FIELD_DIRECTIVES],
  template: `
    <div hellField>
      <label data-field="input-label" hellFieldLabel for="input-control">Input</label>
      <input id="input-control" hellInput />
      <div data-field="input-description" hellFieldDescription>Input description</div>
    </div>

    <div hellField>
      <label data-field="select-label" hellFieldLabel for="select-control">Select</label>
      <select id="select-control" hellNativeSelect>
        <option>Admin</option>
      </select>
      <div data-field="select-description" hellFieldDescription>Select description</div>
    </div>

    <div hellField>
      <label data-field="textarea-label" hellFieldLabel for="textarea-control">Textarea</label>
      <textarea id="textarea-control" hellTextarea></textarea>
      <div data-field="textarea-description" hellFieldDescription>Textarea description</div>
    </div>
  `,
})
class FieldControlHost {}

describe('Hell input primitives', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FieldControlHost] }).compileComponents();
  });

  it('preserves explicit ids for every field control primitive', () => {
    const fixture = TestBed.createComponent(FieldControlHost);
    fixture.detectChanges();

    expect(control(fixture, 'input-control').id).toBe('input-control');
    expect(control(fixture, 'select-control').id).toBe('select-control');
    expect(control(fixture, 'textarea-control').id).toBe('textarea-control');
  });

  it('uses explicit control ids for hellField label and description wiring', () => {
    const fixture = TestBed.createComponent(FieldControlHost);
    fixture.detectChanges();

    assertFieldWiring(fixture, 'input');
    assertFieldWiring(fixture, 'select');
    assertFieldWiring(fixture, 'textarea');
  });
});

function assertFieldWiring(fixture: { nativeElement: HTMLElement }, prefix: string): void {
  const fieldControl = control(fixture, `${prefix}-control`);
  const label = fieldPart(fixture, `${prefix}-label`) as HTMLLabelElement;
  const description = fieldPart(fixture, `${prefix}-description`);

  expect(label.htmlFor).toBe(fieldControl.id);
  expect(fieldControl.getAttribute('aria-labelledby')).toBe(label.id);
  expect(fieldControl.getAttribute('aria-describedby')).toBe(description.id);
}

function control(fixture: { nativeElement: HTMLElement }, id: string): HTMLElement {
  const element = fixture.nativeElement.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
  return element;
}

function fieldPart(fixture: { nativeElement: HTMLElement }, field: string): HTMLElement {
  const element = fixture.nativeElement.querySelector(`[data-field="${field}"]`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected [data-field="${field}"].`);
  return element;
}
