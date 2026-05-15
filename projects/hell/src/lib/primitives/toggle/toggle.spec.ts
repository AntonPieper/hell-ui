import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NgpToggleGroup } from 'ng-primitives/toggle-group';
import { TestBed } from '@angular/core/testing';

import { HellToggleGroup, HellToggleGroupItem } from './toggle';

@Component({
  imports: [ReactiveFormsModule, HellToggleGroup, HellToggleGroupItem],
  template: `
    <div id="group" hellToggleGroup type="multiple" [formControl]="control">
      <button id="bold" hellToggleGroupItem value="bold" type="button">Bold</button>
      <button id="italic" hellToggleGroupItem value="italic" type="button">Italic</button>
    </div>
    <button id="outside" type="button">Outside</button>
  `,
})
class ToggleGroupFormsHost {
  readonly control = new FormControl<string[]>(['bold'], { nonNullable: true });
}

@Component({
  imports: [ReactiveFormsModule, HellToggleGroup, HellToggleGroupItem],
  template: `
    <div id="single-group" hellToggleGroup type="single" [formControl]="control">
      <button id="single-bold" hellToggleGroupItem value="bold" type="button">Bold</button>
      <button id="single-italic" hellToggleGroupItem value="italic" type="button">Italic</button>
    </div>
    <button id="outside" type="button">Outside</button>
  `,
})
class ToggleGroupSingleFormsHost {
  readonly control = new FormControl<string | null>(null);
}

describe('HellToggleGroup', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ToggleGroupFormsHost, ToggleGroupSingleFormsHost] }).compileComponents();
  });

  it('integrates with Angular forms as multiple value', () => {
    const fixture = TestBed.createComponent(ToggleGroupFormsHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    button(fixture.nativeElement, 'italic').click();
    fixture.detectChanges();

    expect(host.control.value).toEqual(['bold', 'italic']);

    host.control.setValue(['italic']);
    fixture.detectChanges();
    expect(button(fixture.nativeElement, 'italic').hasAttribute('data-selected')).toBe(true);

    host.control.disable();
    fixture.detectChanges();
    expect(group(fixture.nativeElement).hasAttribute('data-disabled')).toBe(true);

    host.control.enable();
    fixture.detectChanges();
    button(fixture.nativeElement, 'bold').dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: button(fixture.nativeElement, 'outside'),
      }),
    );

    expect(host.control.touched).toBe(true);
  });

  it('writes through the ng-primitives state seam for value and disabled updates', () => {
    const fixture = TestBed.createComponent(ToggleGroupFormsHost);
    fixture.detectChanges();

    const debug = fixture.debugElement.query(By.directive(HellToggleGroup));
    const groupInstance = debug.injector.get(HellToggleGroup);
    const ngpToggleGroup = debug.injector.get(NgpToggleGroup);
    const state = (ngpToggleGroup as any).state as {
      setValue: (value: string[]) => void;
      setDisabled: (isDisabled: boolean) => void;
    };

    const valueSet = vi.spyOn(state, 'setValue');
    const disabledSet = vi.spyOn(state, 'setDisabled');

    groupInstance.writeValue(['bold', 'italic']);
    groupInstance.setDisabledState(true);

    expect(valueSet).toHaveBeenCalledWith(['bold', 'italic'], { emit: false });
    expect(disabledSet).toHaveBeenCalledWith(true);
  });

  it('integrates with Angular forms as single value', () => {
    const fixture = TestBed.createComponent(ToggleGroupSingleFormsHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    button(fixture.nativeElement, 'single-bold').click();
    fixture.detectChanges();
    expect(host.control.value).toBe('bold');

    host.control.setValue('italic');
    fixture.detectChanges();
    expect(button(fixture.nativeElement, 'single-italic').hasAttribute('data-selected')).toBe(true);

    host.control.setValue(null);
    fixture.detectChanges();
    expect(button(fixture.nativeElement, 'single-bold').hasAttribute('data-selected')).toBe(false);
    expect(button(fixture.nativeElement, 'single-italic').hasAttribute('data-selected')).toBe(false);

    host.control.disable();
    fixture.detectChanges();
    expect(groupSingle(fixture.nativeElement).hasAttribute('data-disabled')).toBe(true);

    host.control.enable();
    fixture.detectChanges();
    button(fixture.nativeElement, 'single-bold').dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: button(fixture.nativeElement, 'outside'),
      }),
    );

    expect(host.control.touched).toBe(true);
  });
});

function group(root: HTMLElement): HTMLElement {
  const element = root.querySelector('#group');
  if (!(element instanceof HTMLElement)) throw new Error('Expected #group.');
  return element;
}

function groupSingle(root: HTMLElement): HTMLElement {
  const element = root.querySelector('#single-group');
  if (!(element instanceof HTMLElement)) throw new Error('Expected #single-group.');
  return element;
}

function button(root: HTMLElement, id: string): HTMLButtonElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLButtonElement)) throw new Error(`Expected #${id}.`);
  return element;
}
