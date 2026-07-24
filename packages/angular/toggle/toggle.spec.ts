import { Component, signal, viewChild } from '@angular/core';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled as disabledSchema, form } from '@angular/forms/signals';
import { TestBed } from '@angular/core/testing';

import { HellToggle, HellToggleGroup, HellToggleGroupItem, type HellToggleGroupValue } from './toggle';
import { expectUiRouting, sortClasses } from '../spec-helpers';

/**
 * Toggle specs assert behavior, forms integration, and state attributes.
 * Part-Class Pipeline merge semantics are owned centrally by
 * `internal/core/part-class-pipeline.spec.ts`; ui routing asserts that consumer
 * classes reach each part and that nothing outside the default render and the
 * consumer's ui appears, instead of asserting individual recipe classes. Part
 * Recipes stay package-private per ADR 0002, so the recipe snapshot below
 * pins the rendered class surface per part.
 */

@Component({
  imports: [HellToggleGroup, HellToggleGroupItem],
  template: `
    <div
      id="two-way-single"
      hellToggleGroup
      type="single"
      [(value)]="value"
      (valueChange)="valueEvents.push($event)"
    >
      <button id="bold" hellToggleGroupItem value="bold" type="button">Bold</button>
      <button id="italic" hellToggleGroupItem value="italic" type="button">Italic</button>
    </div>
  `,
})
class ToggleGroupTwoWaySingleHost {
  readonly value = signal<HellToggleGroupValue>('bold');
  readonly valueEvents: HellToggleGroupValue[] = [];
}

@Component({
  imports: [HellToggleGroup, HellToggleGroupItem],
  template: `
    <div
      id="two-way-multiple"
      hellToggleGroup
      type="multiple"
      [(value)]="value"
      (valueChange)="valueEvents.push($event)"
    >
      <button id="bold" hellToggleGroupItem value="bold" type="button">Bold</button>
      <button id="italic" hellToggleGroupItem value="italic" type="button">Italic</button>
    </div>
  `,
})
class ToggleGroupTwoWayMultipleHost {
  readonly value = signal<HellToggleGroupValue>(['bold']);
  readonly valueEvents: HellToggleGroupValue[] = [];
}

@Component({
  imports: [HellToggleGroup, HellToggleGroupItem],
  template: `
    <div
      id="mode-group"
      hellToggleGroup
      [type]="type()"
      [value]="value()"
      (valueChange)="valueEvents.push($event)"
    >
      <button id="bold" hellToggleGroupItem value="bold" type="button">Bold</button>
      <button id="italic" hellToggleGroupItem value="italic" type="button">Italic</button>
    </div>
  `,
})
class ToggleGroupModeHost {
  readonly type = signal<'single' | 'multiple'>('single');
  readonly value = signal<HellToggleGroupValue>(null);
  readonly valueEvents: HellToggleGroupValue[] = [];
}

@Component({
  imports: [ReactiveFormsModule, HellToggleGroup, HellToggleGroupItem],
  template: `
    <div
      id="group"
      hellToggleGroup
      type="multiple"
      [formControl]="control"
      (valueChange)="valueEvents.push($event)"
    >
      <button id="bold" hellToggleGroupItem value="bold" type="button">Bold</button>
      <button id="italic" hellToggleGroupItem value="italic" type="button">Italic</button>
    </div>
    <button id="outside" type="button">Outside</button>
  `,
})
class ToggleGroupFormsHost {
  readonly control = new FormControl<string[]>(['bold'], { nonNullable: true });
  readonly valueEvents: HellToggleGroupValue[] = [];
}

@Component({
  imports: [ReactiveFormsModule, HellToggleGroup, HellToggleGroupItem],
  template: `
    <div
      id="single-group"
      hellToggleGroup
      type="single"
      [formControl]="control"
      (valueChange)="valueEvents.push($event)"
    >
      <button id="single-bold" hellToggleGroupItem value="bold" type="button">Bold</button>
      <button id="single-italic" hellToggleGroupItem value="italic" type="button">Italic</button>
    </div>
    <button id="outside" type="button">Outside</button>
  `,
})
class ToggleGroupSingleFormsHost {
  readonly control = new FormControl<string | null>(null);
  readonly valueEvents: HellToggleGroupValue[] = [];
}

@Component({
  imports: [FormsModule, HellToggleGroup, HellToggleGroupItem],
  template: `
    <div
      id="ng-model-group"
      hellToggleGroup
      type="multiple"
      [(ngModel)]="value"
      (valueChange)="valueEvents.push($event)"
    >
      <button id="bold" hellToggleGroupItem value="bold" type="button">Bold</button>
      <button id="italic" hellToggleGroupItem value="italic" type="button">Italic</button>
    </div>
    <button id="outside" type="button">Outside</button>
  `,
})
class ToggleGroupNgModelHost {
  readonly value = signal<HellToggleGroupValue>(['bold']);
  readonly model = viewChild.required(NgModel);
  readonly valueEvents: HellToggleGroupValue[] = [];
}

@Component({
  imports: [FormField, HellToggleGroup, HellToggleGroupItem],
  template: `
    <div
      id="signal-forms-group"
      hellToggleGroup
      type="single"
      [formField]="alignForm.align"
      (valueChange)="valueEvents.push($event)"
    >
      <button id="left" hellToggleGroupItem value="left" type="button">Left</button>
      <button id="right" hellToggleGroupItem value="right" type="button">Right</button>
    </div>
    <button id="outside" type="button">Outside</button>
  `,
})
class ToggleGroupSignalFormsHost {
  readonly formDisabled = signal(false);
  readonly model = signal<{ align: string | null }>({ align: null });
  readonly alignForm = form(this.model, (path) => {
    disabledSchema(path.align, () => this.formDisabled());
  });
  readonly valueEvents: HellToggleGroupValue[] = [];
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

    <div hellToggleGroup [ui]="groupUi" type="single" [value]="'left'">
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
      imports: [
        ToggleGroupTwoWaySingleHost,
        ToggleGroupTwoWayMultipleHost,
        ToggleGroupModeHost,
        ToggleGroupFormsHost,
        ToggleGroupSingleFormsHost,
        ToggleGroupNgModelHost,
        ToggleGroupSignalFormsHost,
        TogglePartStyleHost,
      ],
    }).compileComponents();
  });

  it('synchronizes single-mode two-way binding through one value authority without duplicate commits', () => {
    const fixture = TestBed.createComponent(ToggleGroupTwoWaySingleHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    expect(button(fixture.nativeElement, 'bold').hasAttribute('data-selected')).toBe(true);

    // External parent write flows in without echoing a change event.
    host.value.set('italic');
    fixture.detectChanges();

    expect(button(fixture.nativeElement, 'italic').hasAttribute('data-selected')).toBe(true);
    expect(button(fixture.nativeElement, 'bold').hasAttribute('data-selected')).toBe(false);
    expect(host.valueEvents).toEqual([]);

    // One user interaction commits exactly once: parent state and one event.
    button(fixture.nativeElement, 'bold').click();
    fixture.detectChanges();

    expect(host.value()).toBe('bold');
    expect(host.valueEvents).toEqual(['bold']);

    // Deselecting the selected item empties the single-mode value to null.
    button(fixture.nativeElement, 'bold').click();
    fixture.detectChanges();

    expect(host.value()).toBe(null);
    expect(host.valueEvents).toEqual(['bold', null]);
    expect(button(fixture.nativeElement, 'bold').hasAttribute('data-selected')).toBe(false);
  });

  it('synchronizes multiple-mode two-way binding with readonly-array commits', () => {
    const fixture = TestBed.createComponent(ToggleGroupTwoWayMultipleHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    // External parent write flows in without echoing a change event.
    host.value.set(['italic']);
    fixture.detectChanges();

    expect(button(fixture.nativeElement, 'italic').hasAttribute('data-selected')).toBe(true);
    expect(button(fixture.nativeElement, 'bold').hasAttribute('data-selected')).toBe(false);
    expect(host.valueEvents).toEqual([]);

    // One user interaction commits exactly once with a canonical array value.
    button(fixture.nativeElement, 'bold').click();
    fixture.detectChanges();

    expect(host.value()).toEqual(['italic', 'bold']);
    expect(host.valueEvents).toEqual([['italic', 'bold']]);

    // Deselecting the last item empties the multiple-mode value to [].
    button(fixture.nativeElement, 'bold').click();
    button(fixture.nativeElement, 'italic').click();
    fixture.detectChanges();

    expect(host.value()).toEqual([]);
    expect(host.valueEvents).toEqual([['italic', 'bold'], ['italic'], []]);
  });

  it('normalizes non-canonical values and mode changes into the mode-canonical shape', () => {
    const fixture = TestBed.createComponent(ToggleGroupModeHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    // Single mode interprets an array write as its first item.
    host.value.set(['bold', 'italic']);
    fixture.detectChanges();

    expect(host.valueEvents).toEqual(['bold']);
    expect(button(fixture.nativeElement, 'bold').hasAttribute('data-selected')).toBe(true);
    expect(button(fixture.nativeElement, 'italic').hasAttribute('data-selected')).toBe(false);

    // Switching to multiple mode wraps the scalar into a canonical array.
    host.value.set('italic');
    host.type.set('multiple');
    fixture.detectChanges();

    expect(host.valueEvents).toEqual(['bold', ['italic']]);
    expect(button(fixture.nativeElement, 'italic').hasAttribute('data-selected')).toBe(true);

    // Switching back to single mode keeps the first selected item.
    host.value.set(['italic', 'bold']);
    host.type.set('single');
    fixture.detectChanges();

    expect(host.valueEvents).toEqual(['bold', ['italic'], 'italic']);
    expect(button(fixture.nativeElement, 'italic').hasAttribute('data-selected')).toBe(true);
    expect(button(fixture.nativeElement, 'bold').hasAttribute('data-selected')).toBe(false);
  });

  it('integrates with reactive forms as multiple value without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(ToggleGroupFormsHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    button(fixture.nativeElement, 'italic').click();
    fixture.detectChanges();

    expect(host.control.value).toEqual(['bold', 'italic']);
    expect(host.valueEvents).toEqual([['bold', 'italic']]);

    host.control.setValue(['italic']);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(button(fixture.nativeElement, 'italic').hasAttribute('data-selected')).toBe(true);
    expect(button(fixture.nativeElement, 'bold').hasAttribute('data-selected')).toBe(false);
    expect(host.valueEvents).toEqual([['bold', 'italic']]);

    host.control.disable();
    fixture.detectChanges();
    expect(group(fixture.nativeElement).hasAttribute('data-disabled')).toBe(true);

    // A disabled group ignores item activation.
    button(fixture.nativeElement, 'bold').click();
    fixture.detectChanges();
    expect(host.control.value).toEqual(['italic']);

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

  it('integrates with reactive forms as single value', async () => {
    const fixture = TestBed.createComponent(ToggleGroupSingleFormsHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    button(fixture.nativeElement, 'single-bold').click();
    fixture.detectChanges();
    expect(host.control.value).toBe('bold');
    expect(host.valueEvents).toEqual(['bold']);

    host.control.setValue('italic');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(button(fixture.nativeElement, 'single-italic').hasAttribute('data-selected')).toBe(true);
    expect(host.valueEvents).toEqual(['bold']);

    host.control.setValue(null);
    await fixture.whenStable();
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

  it('integrates with template-driven forms through ngModel', async () => {
    const fixture = TestBed.createComponent(ToggleGroupNgModelHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.componentInstance;

    expect(button(fixture.nativeElement, 'bold').hasAttribute('data-selected')).toBe(true);
    expect(host.valueEvents).toEqual([]);

    button(fixture.nativeElement, 'italic').click();
    fixture.detectChanges();

    expect(host.value()).toEqual(['bold', 'italic']);
    expect(host.valueEvents).toEqual([['bold', 'italic']]);
    expect(host.model().touched).toBe(false);

    button(fixture.nativeElement, 'italic').dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: button(fixture.nativeElement, 'outside'),
      }),
    );
    fixture.detectChanges();

    expect(host.model().touched).toBe(true);

    host.value.set(['italic']);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(button(fixture.nativeElement, 'bold').hasAttribute('data-selected')).toBe(false);
    expect(host.valueEvents).toEqual([['bold', 'italic']]);
  });

  it('participates in Signal Forms as a FormValueControl through formField', () => {
    const fixture = TestBed.createComponent(ToggleGroupSignalFormsHost);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    expect(button(fixture.nativeElement, 'left').hasAttribute('data-selected')).toBe(false);

    // Form-driven writes flow in without echoing an interaction commit.
    host.alignForm.align().value.set('right');
    fixture.detectChanges();

    expect(button(fixture.nativeElement, 'right').hasAttribute('data-selected')).toBe(true);
    expect(host.valueEvents).toEqual([]);
    expect(host.alignForm.align().dirty()).toBe(false);

    // One user interaction commits exactly once into the field and the model.
    button(fixture.nativeElement, 'left').click();
    fixture.detectChanges();

    expect(host.alignForm.align().value()).toBe('left');
    expect(host.model().align).toBe('left');
    expect(host.valueEvents).toEqual(['left']);
    expect(host.alignForm.align().dirty()).toBe(true);
    expect(host.alignForm.align().touched()).toBe(false);

    button(fixture.nativeElement, 'left').dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: button(fixture.nativeElement, 'outside'),
      }),
    );
    fixture.detectChanges();

    expect(host.alignForm.align().touched()).toBe(true);

    // Field-driven disabled state reaches interaction and visible state.
    host.formDisabled.set(true);
    fixture.detectChanges();

    expect(groupById(fixture.nativeElement, 'signal-forms-group').hasAttribute('data-disabled')).toBe(
      true,
    );

    button(fixture.nativeElement, 'right').click();
    fixture.detectChanges();

    expect(host.alignForm.align().value()).toBe('left');
    expect(host.valueEvents).toEqual(['left']);
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
  return groupById(root, 'group');
}

function groupSingle(root: HTMLElement): HTMLElement {
  return groupById(root, 'single-group');
}

function groupById(root: HTMLElement, id: string): HTMLElement {
  const element = root.querySelector(`#${id}`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected #${id}.`);
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
