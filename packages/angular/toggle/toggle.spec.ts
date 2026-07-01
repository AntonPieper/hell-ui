import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NgpToggleGroup } from 'ng-primitives/toggle-group';
import { TestBed } from '@angular/core/testing';

import {
  HellToggle,
  type HellToggleGroupItemUi,
  HellToggleGroup,
  type HellToggleGroupUi,
  HellToggleGroupItem,
  type HellToggleUi,
} from './toggle';

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

@Component({
  imports: [HellToggle, HellToggleGroup, HellToggleGroupItem],
  template: `
    <button
      hellToggle
      selected
      type="button"
      ui="bg-hell-danger px-hell-7"
    >
      Standalone
    </button>
    <button hellToggle selected type="button" [ui]="toggleUi">Map standalone</button>

    <div hellToggleGroup [ui]="groupUi" type="single" [value]="['left']">
      <button hellToggleGroupItem value="left" type="button" [ui]="itemUi">Left</button>
      <button hellToggleGroupItem value="right" type="button" disabled>Right</button>
    </div>
  `,
})
class TogglePartStyleHost {
  protected readonly toggleUi = {
    root: 'bg-hell-danger px-hell-7',
  } satisfies HellToggleUi;
  protected readonly groupUi = {
    root: 'gap-hell-4 bg-hell-danger-soft',
  } satisfies HellToggleGroupUi;
  protected readonly itemUi = {
    root: 'px-hell-6 text-hell-danger',
  } satisfies HellToggleGroupItemUi;
}

describe('HellToggleGroup', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToggleGroupFormsHost, ToggleGroupSingleFormsHost, TogglePartStyleHost],
    }).compileComponents();
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

  it('writes through public ng-primitives toggle-group setters for value and disabled updates', () => {
    const fixture = TestBed.createComponent(ToggleGroupFormsHost);
    fixture.detectChanges();

    const debug = fixture.debugElement.query(By.directive(HellToggleGroup));
    const groupInstance = debug.injector.get(HellToggleGroup);
    const ngpToggleGroup = debug.injector.get(NgpToggleGroup);
    const valueSet = vi.spyOn(ngpToggleGroup, 'setValue');
    const disabledSet = vi.spyOn(ngpToggleGroup, 'setDisabled');

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

  it('uses root part style maps for standalone toggles and grouped items', () => {
    const fixture = TestBed.createComponent(TogglePartStyleHost);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const standaloneToggles = root.querySelectorAll<HTMLButtonElement>('button[hellToggle]');
    const standalone = standaloneToggles[0];
    const standaloneMap = standaloneToggles[1];
    const group = query<HTMLElement>(root, '[hellToggleGroup]');
    const items = root.querySelectorAll<HTMLButtonElement>('button[hellToggleGroupItem]');
    const selected = items[0];
    const disabled = items[1];

    expect(standalone.getAttribute('data-slot')).toBe('root');
    expect(standalone.classList.contains('hell-button')).toBe(false);
    expect(standalone.classList.contains('hell-toggle')).toBe(false);
    expect(standalone.classList.contains('bg-hell-danger')).toBe(true);
    expect(standalone.classList.contains('px-hell-7')).toBe(true);
    expect(standalone.classList.contains('px-hell-5')).toBe(false);
    expect(standalone.hasAttribute('data-selected')).toBe(true);

    expect(standaloneMap.getAttribute('data-slot')).toBe('root');
    expect(standaloneMap.classList.contains('bg-hell-danger')).toBe(true);
    expect(standaloneMap.classList.contains('px-hell-7')).toBe(true);
    expect(standaloneMap.classList.contains('px-hell-5')).toBe(false);

    expect(group.getAttribute('data-slot')).toBe('root');
    expect(group.classList.contains('hell-toggle-group')).toBe(false);
    expect(group.classList.contains('gap-hell-4')).toBe(true);
    expect(group.classList.contains('bg-hell-danger-soft')).toBe(true);

    expect(selected.getAttribute('data-slot')).toBe('root');
    expect(selected.classList.contains('hell-button')).toBe(false);
    expect(selected.classList.contains('hell-toggle')).toBe(false);
    expect(selected.classList.contains('px-hell-6')).toBe(true);
    expect(selected.classList.contains('px-hell-4')).toBe(false);
    expect(selected.classList.contains('text-hell-danger')).toBe(true);
    expect(selected.hasAttribute('data-selected')).toBe(true);

    expect(disabled.getAttribute('data-slot')).toBe('root');
    expect(disabled.hasAttribute('data-disabled')).toBe(true);
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

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
