import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import {
  HellInput,
  type HellInputUi,
  HellNativeSelect,
  type HellNativeSelectUi,
  HellTextarea,
  type HellTextareaUi,
} from './input';

@Component({
  imports: [HellInput, HellNativeSelect, HellTextarea, ...HELL_FIELD_DIRECTIVES],
  template: `
    <div hellField>
      <label data-field="input-label" hellFieldLabel for="input-control">Input</label>
      <input id="input-control" hellInput />
      <div data-field="input-description" hellFieldDescription>Input description</div>
      <div id="input-error" data-field="input-error" hellFieldError>Input error</div>
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

@Component({
  imports: [HellInput, HellNativeSelect, HellTextarea],
  template: `
    <input
      id="styled-input"
      hellInput
      size="sm"
      invalid
      disabled
      [ui]="inputUi"
      aria-label="Styled input"
    />
    <input
      id="shorthand-input"
      hellInput
      ui="rounded-hell-pill px-hell-6"
      aria-label="Shorthand input"
    />
    <select
      id="styled-select"
      hellNativeSelect
      size="lg"
      invalid
      disabled
      [ui]="selectUi"
      aria-label="Styled select"
    >
      <option>Admin</option>
    </select>
    <textarea
      id="styled-textarea"
      hellTextarea
      size="lg"
      invalid
      disabled
      [ui]="textareaUi"
      aria-label="Styled textarea"
    ></textarea>
    <textarea
      id="auto-grow-textarea"
      hellTextarea
      autoGrow
      rows="2"
      ui="[max-block-size:12rem] overflow-y-auto"
      aria-label="Auto-grow textarea"
    ></textarea>
  `,
})
class PartStyleHost {
  protected readonly inputUi = {
    root: 'rounded-hell-pill data-[size=sm]:px-hell-6 data-[size=sm]:text-sm',
  } satisfies HellInputUi;

  protected readonly selectUi = {
    root: 'rounded-hell-pill border-hell-info bg-hell-info-soft',
  } satisfies HellNativeSelectUi;

  protected readonly textareaUi = {
    root: 'rounded-hell-lg min-h-32 resize-none',
  } satisfies HellTextareaUi;
}

describe('Hell input primitives', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldControlHost, PartStyleHost],
    }).compileComponents();
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

  it('preserves explicit ids on hellFieldError', () => {
    const fixture = TestBed.createComponent(FieldControlHost);
    fixture.detectChanges();

    expect(fieldPart(fixture, 'input-error').id).toBe('input-error');
  });

  it('exposes a root part style map for input, native select and textarea', () => {
    const fixture = TestBed.createComponent(PartStyleHost);
    fixture.detectChanges();

    assertPartStyle(control(fixture, 'styled-input'), {
      absentClass: 'hell-input',
      mergedClasses: [
        'data-[size=sm]:h-hell-control-sm',
        'rounded-hell-pill',
        'data-[size=sm]:px-hell-6',
        'data-[size=sm]:text-sm',
      ],
      size: 'sm',
    });
    assertPartStyle(control(fixture, 'shorthand-input'), {
      absentClass: 'hell-input',
      mergedClasses: ['rounded-hell-pill', 'px-hell-6'],
      size: 'md',
    });
    expect(control(fixture, 'shorthand-input').classList.contains('px-hell-4')).toBe(false);
    assertPartStyle(control(fixture, 'styled-select'), {
      absentClass: 'hell-native-select',
      mergedClasses: [
        'data-[size=lg]:h-hell-control-lg',
        'rounded-hell-pill',
        'border-hell-info',
        'bg-hell-info-soft',
      ],
      size: 'lg',
    });
    assertPartStyle(control(fixture, 'styled-textarea'), {
      absentClass: 'hell-textarea',
      mergedClasses: ['min-h-32', 'rounded-hell-lg', 'resize-none'],
      size: 'lg',
    });
  });

  it('applies the auto-grow field-sizing and resize contract only when opted in', () => {
    const fixture = TestBed.createComponent(PartStyleHost);
    fixture.detectChanges();

    const autoGrow = control(fixture, 'auto-grow-textarea');
    // The opt-in reflects a data attribute and carries the content-sizing +
    // handle-disable utilities gated behind it (style contract, not pixel heights).
    expect(autoGrow.getAttribute('data-auto-grow')).toBe('');
    expect(autoGrow.classList.contains('data-auto-grow:field-sizing-content')).toBe(true);
    expect(autoGrow.classList.contains('data-auto-grow:resize-none')).toBe(true);

    // A textarea without the opt-in keeps the default resizable behavior and
    // never sets the reflected attribute, so the gated utilities stay inert.
    const fixedTextarea = control(fixture, 'styled-textarea');
    expect(fixedTextarea.getAttribute('data-auto-grow')).toBeNull();
  });

  it('preserves disabled and invalid host behavior through ng-primitives directives', () => {
    const fixture = TestBed.createComponent(PartStyleHost);
    fixture.detectChanges();

    for (const id of ['styled-input', 'styled-select', 'styled-textarea']) {
      const element = control(fixture, id) as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement;

      expect(element.disabled, `${id}.disabled`).toBe(true);
      expect(element.getAttribute('data-disabled'), `${id}.data-disabled`).toBe('');
      expect(element.getAttribute('aria-invalid'), `${id}.aria-invalid`).toBe('true');
    }
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

function assertPartStyle(
  element: HTMLElement,
  options: {
    readonly absentClass: string;
    readonly mergedClasses: readonly string[];
    readonly size: string;
  },
): void {
  expect(element.getAttribute('data-slot')).toBe('root');
  expect(element.getAttribute('data-size')).toBe(options.size);
  expect(element.classList.contains(options.absentClass)).toBe(false);

  for (const className of options.mergedClasses) {
    expect(element.classList.contains(className), `${options.absentClass}.${className}`).toBe(true);
  }
}
