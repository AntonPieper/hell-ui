import { Component, signal, type Signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { NgpFormFieldState } from 'ng-primitives/form-field';
import { hellSyncFormFieldDescriptions, hellSyncFormFieldLabels } from './form-field-idrefs';

@Component({ template: '' })
class FormFieldIdrefsHost {
  readonly describedBy = signal<string | null>('existing-description alpha beta');
  readonly labelledBy = signal<string | null>('existing-label gamma');
  readonly formField = createFormFieldState({
    descriptions: ['existing-description'],
    labels: ['existing-label'],
  });

  constructor() {
    hellSyncFormFieldDescriptions(this.formField, this.describedBy);
    hellSyncFormFieldLabels(this.formField, this.labelledBy);
  }
}

describe('form field idref sync', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormFieldIdrefsHost] }).compileComponents();
  });

  it('dedupes existing ids and resyncs descriptions on input changes', () => {
    const fixture = TestBed.createComponent(FormFieldIdrefsHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    expect(host.formField.descriptions()).toEqual(['existing-description', 'alpha', 'beta']);

    host.describedBy.set('beta gamma');
    fixture.detectChanges();

    expect(host.formField.descriptions()).toEqual(['existing-description', 'beta', 'gamma']);
  });

  it('removes only bridge-added label ids on destroy', () => {
    const fixture = TestBed.createComponent(FormFieldIdrefsHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    expect(host.formField.labels()).toEqual(['existing-label', 'gamma']);

    fixture.destroy();

    expect(host.formField.labels()).toEqual(['existing-label']);
  });
});

function createFormFieldState(initial: {
  readonly descriptions: readonly string[];
  readonly labels: readonly string[];
}): NgpFormFieldState {
  const descriptions = signal([...initial.descriptions]);
  const labels = signal([...initial.labels]);

  return {
    descriptions,
    labels,
    formControl: signal(null),
    errors: signal([]),
    pristine: signal(null),
    touched: signal(null),
    dirty: signal(null),
    valid: signal(null),
    invalid: signal(null),
    pending: signal(null),
    disabled: signal(null),
    setFormControl: () => {},
    removeFormControl: () => {},
    addDescription: (id) => addId(descriptions, id),
    removeDescription: (id) => removeId(descriptions, id),
    addLabel: (id) => addId(labels, id),
    removeLabel: (id) => removeId(labels, id),
  } satisfies NgpFormFieldState;
}

function addId(ids: WritableSignal<string[]>, id: string): void {
  ids.update((current) => (current.includes(id) ? current : [...current, id]));
}

function removeId(ids: WritableSignal<string[]>, id: string): void {
  ids.update((current) => current.filter((currentId) => currentId !== id));
}
