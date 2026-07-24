import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HELL_FIELD_IMPORTS } from 'hell-ui/field';
import { HellNativeSelect } from 'hell-ui/select';
import { HellInput, HellTextarea } from './input';
import { expectUiRouting, sortClasses } from '../spec-helpers';

/**
 * Input primitive specs assert behavior, field wiring, and state attributes.
 * Part-Class Pipeline merge semantics are owned centrally by
 * `internal/core/part-class-pipeline.spec.ts`; ui routing asserts that consumer
 * classes reach the part and that nothing outside the default render and the
 * consumer's ui appears, instead of asserting individual recipe classes. Part
 * Recipes stay package-private per ADR 0002, so the recipe snapshot below
 * pins the rendered class surface per control.
 */

@Component({
  imports: [HellInput, HellNativeSelect, HellTextarea, ...HELL_FIELD_IMPORTS],
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
  };

  protected readonly selectUi = {
    root: 'rounded-hell-pill border-hell-info bg-hell-info-soft',
  };

  protected readonly textareaUi = {
    root: 'rounded-hell-lg min-h-32 resize-none',
  };
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
    const defaults = TestBed.createComponent(FieldControlHost);
    fixture.detectChanges();
    defaults.detectChanges();

    assertPartStyle(control(fixture, 'styled-input'), { absentClass: 'hell-input', size: 'sm' });
    expectUiRouting(
      control(defaults, 'input-control').className,
      control(fixture, 'styled-input').className,
      'rounded-hell-pill data-[size=sm]:px-hell-6 data-[size=sm]:text-sm',
    );

    assertPartStyle(control(fixture, 'shorthand-input'), { absentClass: 'hell-input', size: 'md' });
    expectUiRouting(
      control(defaults, 'input-control').className,
      control(fixture, 'shorthand-input').className,
      'rounded-hell-pill px-hell-6',
    );

    assertPartStyle(control(fixture, 'styled-select'), {
      absentClass: 'hell-native-select',
      size: 'lg',
    });
    expectUiRouting(
      control(defaults, 'select-control').className,
      control(fixture, 'styled-select').className,
      'rounded-hell-pill border-hell-info bg-hell-info-soft',
    );

    assertPartStyle(control(fixture, 'styled-textarea'), {
      absentClass: 'hell-textarea',
      size: 'lg',
    });
    expectUiRouting(
      control(defaults, 'textarea-control').className,
      control(fixture, 'styled-textarea').className,
      'rounded-hell-lg min-h-32 resize-none',
    );
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(FieldControlHost);
      fixture.detectChanges();

      expect({
        input: sortClasses(control(fixture, 'input-control').className),
        nativeSelect: sortClasses(control(fixture, 'select-control').className),
        textarea: sortClasses(control(fixture, 'textarea-control').className),
      }).toMatchSnapshot('input');
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
    readonly size: string;
  },
): void {
  expect(element.getAttribute('data-slot')).toBe('root');
  expect(element.getAttribute('data-size')).toBe(options.size);
  // The legacy `.hell-*` stylesheet class is retired; its absence is the contract.
  expect(element.classList.contains(options.absentClass)).toBe(false);
}

