import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';

import { HellToggle, HellToggleGroup, HellToggleGroupItem } from './toggle';
import { expectUiRouting, sortClasses } from '../spec-helpers';

/**
 * Toggle specs assert behavior, forms integration, and state attributes.
 * Part-Class Pipeline merge semantics are owned centrally by
 * `core/part-class-pipeline.spec.ts`; ui routing asserts that consumer
 * classes reach each part and that nothing outside the default render and the
 * consumer's ui appears, instead of asserting individual recipe classes. Part
 * Recipes stay package-private per ADR 0002, so the recipe snapshot below
 * pins the rendered class surface per part.
 */

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

    <button hellToggle type="button">Plain standalone</button>
  `,
})
class TogglePartStyleHost {
  protected readonly toggleUi = {
    root: 'bg-hell-danger px-hell-7',
  };
  protected readonly groupUi = {
    root: 'gap-hell-4 bg-hell-danger-soft',
  };
  protected readonly itemUi = {
    root: 'px-hell-6 text-hell-danger',
  };
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

  it('exposes pressed toggle-button semantics for multiple-select items', () => {
    const fixture = TestBed.createComponent(ToggleGroupFormsHost);
    fixture.detectChanges();

    const bold = button(fixture.nativeElement, 'bold');
    const italic = button(fixture.nativeElement, 'italic');
    expect(bold.hasAttribute('role')).toBe(false);
    expect(bold.hasAttribute('aria-checked')).toBe(false);
    expect(bold.getAttribute('aria-pressed')).toBe('true');
    expect(italic.getAttribute('aria-pressed')).toBe('false');

    // ng-primitives re-writes aria-checked whenever the selection changes;
    // the Hell override must win again after each toggle.
    italic.click();
    fixture.detectChanges();

    expect(italic.getAttribute('aria-pressed')).toBe('true');
    expect(italic.hasAttribute('aria-checked')).toBe(false);
    expect(italic.hasAttribute('role')).toBe(false);
  });

  it('keeps radio semantics for single-select items', () => {
    const fixture = TestBed.createComponent(ToggleGroupSingleFormsHost);
    fixture.detectChanges();

    const bold = button(fixture.nativeElement, 'single-bold');
    const italic = button(fixture.nativeElement, 'single-italic');
    bold.click();
    fixture.detectChanges();

    expect(bold.getAttribute('role')).toBe('radio');
    expect(bold.getAttribute('aria-checked')).toBe('true');
    expect(bold.hasAttribute('aria-pressed')).toBe(false);
    expect(italic.getAttribute('role')).toBe('radio');
    expect(italic.getAttribute('aria-checked')).toBe('false');
    expect(italic.hasAttribute('aria-pressed')).toBe(false);
  });

  it('uses root part style maps for standalone toggles and grouped items', () => {
    const fixture = TestBed.createComponent(TogglePartStyleHost);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const standaloneToggles = root.querySelectorAll<HTMLButtonElement>('button[hellToggle]');
    const standalone = standaloneToggles[0];
    const standaloneMap = standaloneToggles[1];
    const plain = standaloneToggles[2];
    const group = query<HTMLElement>(root, '[hellToggleGroup]');
    const items = root.querySelectorAll<HTMLButtonElement>('button[hellToggleGroupItem]');
    const selected = items[0];
    const disabled = items[1];

    const groupDefaults = TestBed.createComponent(ToggleGroupFormsHost);
    groupDefaults.detectChanges();
    const defaultGroup = query<HTMLElement>(groupDefaults.nativeElement, '#group');

    expect(standalone.getAttribute('data-slot')).toBe('root');
    expectUiRouting(plain.className, standalone.className, 'bg-hell-danger px-hell-7');
    expect(standalone.hasAttribute('data-selected')).toBe(true);

    expect(standaloneMap.getAttribute('data-slot')).toBe('root');
    expectUiRouting(plain.className, standaloneMap.className, 'bg-hell-danger px-hell-7');

    expect(group.getAttribute('data-slot')).toBe('root');
    expectUiRouting(defaultGroup.className, group.className, 'gap-hell-4 bg-hell-danger-soft');

    expect(selected.getAttribute('data-slot')).toBe('root');
    expectUiRouting(disabled.className, selected.className, 'px-hell-6 text-hell-danger');
    expect(selected.hasAttribute('data-selected')).toBe(true);

    expect(disabled.getAttribute('data-slot')).toBe('root');
    expect(disabled.hasAttribute('data-disabled')).toBe(true);
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(TogglePartStyleHost);
      const groupFixture = TestBed.createComponent(ToggleGroupFormsHost);
      fixture.detectChanges();
      groupFixture.detectChanges();

      const toggles = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
        'button[hellToggle]',
      );

      expect({
        toggle: sortClasses(toggles[2].className),
        group: sortClasses(query<HTMLElement>(groupFixture.nativeElement, '#group').className),
        item: sortClasses(button(groupFixture.nativeElement, 'bold').className),
      }).toMatchSnapshot('toggle');
    });
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
