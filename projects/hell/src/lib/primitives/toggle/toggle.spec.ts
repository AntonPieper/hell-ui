import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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

describe('HellToggleGroup', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ToggleGroupFormsHost] }).compileComponents();
  });

  it('integrates with Angular forms value, disabled, and touched state', () => {
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
});

function group(root: HTMLElement): HTMLElement {
  const element = root.querySelector('#group');
  if (!(element instanceof HTMLElement)) throw new Error('Expected #group.');
  return element;
}

function button(root: HTMLElement, id: string): HTMLButtonElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLButtonElement)) throw new Error(`Expected #${id}.`);
  return element;
}
