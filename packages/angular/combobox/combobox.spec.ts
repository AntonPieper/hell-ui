import { Component, signal } from '@angular/core';
import type { HellOption } from '@hell-ui/angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { NgpCombobox } from 'ng-primitives/combobox';

import { HellComboboxRoot, HellCombobox, HELL_COMBOBOX_DIRECTIVES, type HellComboboxUi } from './combobox';
import type { HellPickValue } from '@hell-ui/angular/core';

@Component({
  imports: [ReactiveFormsModule, ...HELL_COMBOBOX_DIRECTIVES],
  template: `
    <div
      hellCombobox
      [wrapNavigation]="false"
      [formControl]="control"
      (valueChange)="values.push($any($event))"
    >
      <input hellComboboxInput aria-label="Assignee" />
      <button hellComboboxButton type="button">Toggle</button>
      <div *hellComboboxPortal hellComboboxDropdown>
        <div hellComboboxOption id="atlas-single" value="atlas">Atlas</div>
        <div hellComboboxOption id="nova-single" value="nova">Nova</div>
      </div>
    </div>
  `,
})
class ComboboxFormHost {
  readonly control = new FormControl<string | null>(null);
  readonly values: Array<string | null> = [];
}

@Component({
  imports: [ReactiveFormsModule, ...HELL_COMBOBOX_DIRECTIVES],
  template: `
    <div
      id="multi-combobox"
      hellCombobox
      multiple
      [formControl]="control"
      (valueChange)="values.push($any($event))"
    >
      <input hellComboboxInput aria-label="Assignees" />
      <button hellComboboxButton type="button">Toggle</button>
      <div *hellComboboxPortal hellComboboxDropdown>
        <div hellComboboxOption id="atlas-multiple" value="atlas">Atlas</div>
        <div hellComboboxOption id="nova-multiple" value="nova">Nova</div>
      </div>
    </div>
  `,
})
class ComboboxMultipleFormHost {
  readonly control = new FormControl<string[]>(['atlas'], { nonNullable: true });
  readonly values: Array<HellPickValue<string>> = [];
}

@Component({
  imports: [ReactiveFormsModule, ...HELL_COMBOBOX_DIRECTIVES],
  template: `
    <div
      id="chips-combobox"
      hellCombobox
      multiple
      [formControl]="control"
      (valueChange)="values.push($any($event))"
    >
      <div hellComboboxChips [displayWith]="displayWith"></div>
      <input hellComboboxInput aria-label="Assignees" />
      <button hellComboboxButton type="button">Toggle</button>
      <div *hellComboboxPortal hellComboboxDropdown>
        <div hellComboboxOption id="atlas-chips" value="atlas">Atlas</div>
        <div hellComboboxOption id="nova-chips" value="nova">Nova</div>
        <div hellComboboxOption id="orion-chips" value="orion">Orion</div>
      </div>
    </div>
  `,
})
class ComboboxChipsHost {
  readonly control = new FormControl<string[]>(['atlas', 'nova'], { nonNullable: true });
  readonly values: Array<HellPickValue<string>> = [];
  readonly displayWith = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);
}

@Component({
  imports: [ReactiveFormsModule, HellCombobox],
  template: `
    <hell-combobox
      aria-label="Choose a planet"
      [options]="options"
      [formControl]="control"
      (valueChange)="values.push($any($event))"
    />
  `,
})
class ComboboxBasicFormHost {
  readonly options: readonly HellOption<string>[] = [
    { value: 'atlas', label: 'Atlas' },
    { value: 'nova', label: 'Nova' },
  ];
  readonly control = new FormControl<string | null>(null);
  readonly values: Array<string | null> = [];
}

@Component({
  imports: [HellCombobox],
  template: `<hell-combobox
    aria-label="Choose a planet"
    [options]="options"
    [value]="value()"
  />`,
})
class ComboboxBasicValueHost {
  readonly options: readonly HellOption<string>[] = [
    { value: 'atlas', label: 'Atlas' },
    { value: 'nova', label: 'Nova' },
  ];
  readonly value = signal<string | null>('atlas');
}

@Component({
  imports: [HellCombobox],
  template: `
    <hell-combobox
      aria-label="Choose a planet"
      [options]="[]"
      [toggleLabel]="'Open planet list'"
      [emptyLabel]="'No planets found'"
    />
  `,
})
class ComboboxBasicLabelsHost {}

@Component({
  imports: [HellCombobox],
  template: `<hell-combobox [ui]="comboboxUi" [options]="[{ value: 'atlas', label: 'Atlas' }]" />`,
})
class ComboboxBasicUiHost {
  protected readonly comboboxUi = {
    root: 'block p-hell-8',
    control: 'rounded-hell-pill bg-hell-primary-soft',
    input: 'text-hell-danger',
    button: 'text-hell-success-strong',
    dropdown: 'rounded-hell-pill',
    option: 'px-hell-8 bg-hell-primary-soft',
  } satisfies HellComboboxUi;
}

@Component({
  imports: [...HELL_COMBOBOX_DIRECTIVES],
  template: `
    <div hellCombobox ui="rounded-hell-pill bg-hell-primary-soft">
      <input hellComboboxInput aria-label="Assignee" ui="text-hell-danger" />
      <button hellComboboxButton type="button" ui="text-hell-success-strong">Toggle</button>
      <div *hellComboboxPortal hellComboboxDropdown ui="rounded-hell-pill">
        <div hellComboboxOption value="atlas" [ui]="{ root: 'px-hell-8 bg-hell-primary-soft' }">
          Atlas
        </div>
        <div hellComboboxEmpty ui="text-hell-danger">No matches</div>
      </div>
    </div>
  `,
})
class ComboboxUiHost {}

const nativeGetAnimations = HTMLElement.prototype.getAnimations;

beforeAll(() => {
  if (!nativeGetAnimations) {
    Object.defineProperty(HTMLElement.prototype, 'getAnimations', {
      configurable: true,
      value: () => [],
    });
  }
});

afterAll(() => {
  if (!nativeGetAnimations) delete (HTMLElement.prototype as Partial<HTMLElement>).getAnimations;
});

describe('HellComboboxRoot', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ComboboxFormHost,
        ComboboxMultipleFormHost,
        ComboboxBasicFormHost,
        ComboboxBasicValueHost,
        ComboboxBasicLabelsHost,
        ComboboxBasicUiHost,
        ComboboxUiHost,
      ],
    }).compileComponents();
  });

  afterEach(() => {
    cleanupPortaledTestElements('[hellComboboxDropdown], [data-hell-combobox-test-outside]');
  });

  it('integrates with reactive forms without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(ComboboxFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const combobox = query<HTMLElement>(fixture.nativeElement, '[hellCombobox]');

    host.control.setValue('nova');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.values).toEqual([]);

    combobox.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: combobox,
      }),
    );
    fixture.detectChanges();
    expect(host.control.touched).toBe(false);

    combobox.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: null,
      }),
    );
    fixture.detectChanges();

    expect(host.control.touched).toBe(true);

    host.control.disable();
    fixture.detectChanges();

    expect(combobox.getAttribute('data-disabled')).toBe('');
  });

  it('merges root, input, button, dropdown, option and empty part styles through the portal', async () => {
    const fixture = TestBed.createComponent(ComboboxUiHost);
    fixture.detectChanges();

    const root = query<HTMLElement>(fixture.nativeElement, '[hellCombobox]');
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input[hellComboboxInput]');
    const button = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellComboboxButton]');
    const dropdown = await openComboboxDropdown(fixture, input, button);
    const option = query<HTMLElement>(dropdown, '[hellComboboxOption]');
    const empty = query<HTMLElement>(dropdown, '[hellComboboxEmpty]');

    expect(root.getAttribute('data-slot')).toBe('root');
    expect(root.className).toContain('rounded-hell-pill');
    expect(root.className).not.toContain('rounded-hell-md');
    expect(root.className).toContain('bg-hell-primary-soft');

    expect(input.getAttribute('data-slot')).toBe('root');
    expect(input.className).toContain('text-hell-danger');

    expect(button.getAttribute('data-slot')).toBe('root');
    expect(button.className).toContain('text-hell-success-strong');

    expect(dropdown.getAttribute('data-slot')).toBe('root');
    expect(dropdown.className).toContain('rounded-hell-pill');
    expect(dropdown.className).not.toContain('rounded-hell-md');

    expect(option.getAttribute('data-slot')).toBe('root');
    expect(option.className).toContain('px-hell-8');
    expect(option.className).toContain('bg-hell-primary-soft');

    expect(empty.getAttribute('data-slot')).toBe('root');
    expect(empty.className).toContain('text-hell-danger');
  });

  it('keeps the form untouched while focus moves through a real portaled dropdown', async () => {
    const fixture = TestBed.createComponent(ComboboxFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input[hellComboboxInput]');
    const button = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellComboboxButton]');
    const outside = document.createElement('button');
    outside.dataset['hellComboboxTestOutside'] = '';
    document.body.append(outside);

    input.focus();
    const dropdown = await openComboboxDropdown(fixture, input, button);
    const option = query<HTMLElement>(dropdown, '[hellComboboxOption]');

    option.focus();
    input.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: option,
      }),
    );
    fixture.detectChanges();

    expect(host.control.touched).toBe(false);

    outside.focus();
    option.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: outside,
      }),
    );
    fixture.detectChanges();

    expect(host.control.touched).toBe(true);
  });

  it('treats a stale portaled dropdown as outside after reopening', async () => {
    const fixture = TestBed.createComponent(ComboboxFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input[hellComboboxInput]');
    const button = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellComboboxButton]');

    input.focus();
    const dropdown = await openComboboxDropdown(fixture, input, button);
    const staleOption = query<HTMLElement>(dropdown, '[hellComboboxOption]');

    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await waitForDropdownRemoval(fixture);

    const reopenedDropdown = await openComboboxDropdown(fixture, input, button);
    const liveOption = query<HTMLElement>(reopenedDropdown, '[hellComboboxOption]');

    input.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: liveOption,
      }),
    );
    fixture.detectChanges();

    expect(host.control.touched).toBe(false);

    input.dispatchEvent(
      new FocusEvent('focusout', {
        bubbles: true,
        relatedTarget: staleOption,
      }),
    );
    fixture.detectChanges();

    expect(host.control.touched).toBe(true);
  });

  it('exposes APG combobox input semantics while closed', () => {
    const fixture = TestBed.createComponent(ComboboxBasicFormHost);
    fixture.detectChanges();

    const input = query<HTMLInputElement>(
      fixture.nativeElement,
      'hell-combobox input[hellComboboxInput]',
    );

    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-haspopup')).toBe('listbox');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
    expect(input.getAttribute('aria-label')).toBe('Choose a planet');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    expect(input.hasAttribute('aria-controls')).toBe(false);
  });

  it('keeps the visible toggle button out of the tab order while preserving clickability', () => {
    const fixture = TestBed.createComponent(ComboboxFormHost);
    fixture.detectChanges();

    const button = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellComboboxButton]');
    expect(button.tabIndex).toBe(-1);
    expect(button.getAttribute('aria-haspopup')).toBe('listbox');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.disabled).toBe(false);
  });

  it('links the input and button to the opened listbox popup', async () => {
    const fixture = TestBed.createComponent(ComboboxBasicFormHost);
    fixture.detectChanges();

    const input = query<HTMLInputElement>(
      fixture.nativeElement,
      'hell-combobox input[hellComboboxInput]',
    );
    const button = query<HTMLButtonElement>(
      fixture.nativeElement,
      'hell-combobox button[hellComboboxButton]',
    );

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    const dropdown = await waitForDropdown(fixture);
    const options = Array.from(dropdown.querySelectorAll<HTMLElement>('[role="option"]'));

    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(dropdown.id).not.toBe('');
    expect(input.getAttribute('aria-controls')).toBe(dropdown.id);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(button.getAttribute('aria-controls')).toBe(dropdown.id);
    expect(dropdown.getAttribute('role')).toBe('listbox');
    expect(options.map((option) => option.textContent?.trim())).toEqual(['Atlas', 'Nova']);
    expect(options.every((option) => option.tabIndex === -1)).toBe(true);
  });

  it('can clamp delegated Arrow navigation at the first and last enabled options', async () => {
    const fixture = TestBed.createComponent(ComboboxFormHost);
    fixture.detectChanges();
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input[hellComboboxInput]');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    const dropdown = await waitForDropdown(fixture);
    const options = Array.from(dropdown.querySelectorAll<HTMLElement>('[role="option"]'));
    const firstId = options[0]!.id;
    const lastId = options[1]!.id;
    expect(input.getAttribute('aria-activedescendant')).toBe(firstId);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBe(firstId);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBe(lastId);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBe(lastId);
  });

  it('integrates with reactive forms in multiple mode without echoing programmatic array writes', async () => {
    const fixture = TestBed.createComponent(ComboboxMultipleFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const combobox = query<HTMLElement>(fixture.nativeElement, '#multi-combobox');

    host.control.setValue(['nova']);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.values).toEqual([]);
    expect(host.control.value).toEqual(['nova']);

    combobox.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.touched).toBe(true);
    expect(Array.isArray(host.control.value)).toBe(true);
  });

  it('preserves array-valued options in single mode', () => {
    const fixture = TestBed.createComponent(ComboboxFormHost);
    fixture.detectChanges();

    const debug = fixture.debugElement.query(By.directive(HellComboboxRoot));
    const combobox = debug.injector.get(HellComboboxRoot<readonly string[]>);
    const ngpCombobox = debug.injector.get(NgpCombobox);
    const arrayValue = ['north', 'south'] as const;
    let emitted: HellPickValue<readonly string[]> | undefined;

    combobox.registerOnChange((value) => (emitted = value));
    ngpCombobox.valueChange.emit(arrayValue);

    expect(emitted).toBe(arrayValue);
  });

  it('provides a basic combobox preset with form value display and disabled state', () => {
    const fixture = TestBed.createComponent(ComboboxBasicFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const preset = query<HTMLElement>(fixture.nativeElement, 'hell-combobox');
    const root = query<HTMLElement>(fixture.nativeElement, 'hell-combobox [hellCombobox]');
    const input = query<HTMLInputElement>(
      fixture.nativeElement,
      'hell-combobox input[hellComboboxInput]',
    );

    expect(preset.getAttribute('data-slot')).toBe('root');

    expect(input.placeholder).toBe('Search');

    host.control.setValue('nova');
    fixture.detectChanges();

    expect(input.value).toBe('Nova');
    expect(host.values).toEqual([]);

    root.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: root }));
    fixture.detectChanges();
    expect(host.control.touched).toBe(false);

    root.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    fixture.detectChanges();
    expect(host.control.touched).toBe(true);

    host.control.disable();
    fixture.detectChanges();

    expect(root.getAttribute('data-disabled')).toBe('');
  });

  it('updates the basic combobox reactive form and output once for a user selection', async () => {
    const fixture = TestBed.createComponent(ComboboxBasicFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const root = query<HTMLElement>(fixture.nativeElement, 'hell-combobox [hellCombobox]');
    const input = query<HTMLInputElement>(
      fixture.nativeElement,
      'hell-combobox input[hellComboboxInput]',
    );

    host.control.setValue(null);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(input.value).toBe('');
    expect(host.values).toEqual([]);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    const dropdown = await waitForDropdown(fixture);
    query<HTMLElement>(dropdown, '[hellComboboxOption]:last-child').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.control.value).toBe('nova');
    expect(host.values).toEqual(['nova']);

    host.control.disable();
    fixture.detectChanges();

    expect(root.getAttribute('data-disabled')).toBe('');
  });

  it('lets basic combobox callers override helper labels without changing defaults', async () => {
    const defaultFixture = TestBed.createComponent(ComboboxBasicFormHost);
    defaultFixture.detectChanges();

    const defaultButton = query<HTMLButtonElement>(
      defaultFixture.nativeElement,
      'hell-combobox button[hellComboboxButton]',
    );
    expect(defaultButton.textContent?.trim()).toBe('');
    expect(defaultButton.getAttribute('aria-label')).toBe('Toggle options');

    const fixture = TestBed.createComponent(ComboboxBasicLabelsHost);
    fixture.detectChanges();

    const input = query<HTMLInputElement>(
      fixture.nativeElement,
      'hell-combobox input[hellComboboxInput]',
    );
    const button = query<HTMLButtonElement>(
      fixture.nativeElement,
      'hell-combobox button[hellComboboxButton]',
    );

    expect(button.textContent?.trim()).toBe('');
    expect(button.getAttribute('aria-label')).toBe('Open planet list');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    const dropdown = await waitForDropdown(fixture);
    expect(query<HTMLElement>(dropdown, '[hellComboboxEmpty]').textContent?.trim()).toBe(
      'No planets found',
    );
  });

  it('syncs basic combobox external value changes into the filter input', async () => {
    const fixture = TestBed.createComponent(ComboboxBasicValueHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const host = fixture.componentInstance;
    const input = query<HTMLInputElement>(
      fixture.nativeElement,
      'hell-combobox input[hellComboboxInput]',
    );

    expect(input.value).toBe('Atlas');

    host.value.set('nova');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(input.value).toBe('Nova');
  });

  it('exposes flat owned parts on the basic combobox host and its portaled dropdown', async () => {
    const fixture = TestBed.createComponent(ComboboxBasicUiHost);
    fixture.detectChanges();

    const preset = query<HTMLElement>(fixture.nativeElement, 'hell-combobox');
    const root = query<HTMLElement>(fixture.nativeElement, '[hellCombobox]');
    const input = query<HTMLInputElement>(fixture.nativeElement, 'input[hellComboboxInput]');
    const button = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellComboboxButton]');

    expect(preset.getAttribute('data-slot')).toBe('root');
    expect(preset.className).toContain('block');
    expect(preset.className).toContain('p-hell-8');
    expect(root.getAttribute('data-slot')).toBe('control');
    expect(root.className).toContain('rounded-hell-pill');
    expect(root.className).toContain('bg-hell-primary-soft');
    expect(input.getAttribute('data-slot')).toBe('input');
    expect(input.className).toContain('text-hell-danger');
    expect(button.getAttribute('data-slot')).toBe('button');
    expect(button.className).toContain('text-hell-success-strong');

    const dropdown = await openComboboxDropdown(fixture, input, button);
    const option = query<HTMLElement>(dropdown, '[hellComboboxOption]');

    expect(dropdown.getAttribute('data-slot')).toBe('dropdown');
    expect(dropdown.className).toContain('rounded-hell-pill');
    expect(option.getAttribute('data-slot')).toBe('option');
    expect(option.className).toContain('px-hell-8');
    expect(option.className).toContain('bg-hell-primary-soft');
  });
});

describe('HellComboboxChips', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ComboboxChipsHost] }).compileComponents();
  });

  afterEach(() => {
    cleanupPortaledTestElements('[hellComboboxDropdown], [data-hell-combobox-test-outside]');
  });

  async function createChipsHost(): Promise<{
    fixture: ReturnType<typeof TestBed.createComponent<ComboboxChipsHost>>;
    host: ComboboxChipsHost;
    root: HTMLElement;
  }> {
    const fixture = TestBed.createComponent(ComboboxChipsHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    // Each chip derives its remove button's accessible name from its rendered
    // text through a MutationObserver, which delivers on a microtask; let it run
    // and reflect the derived `Remove {label}` names before assertions read them.
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    return {
      fixture,
      host: fixture.componentInstance,
      root: fixture.nativeElement as HTMLElement,
    };
  }

  it('renders a removable, display-labelled chip per selected value', async () => {
    const { root } = await createChipsHost();

    const chips = Array.from(root.querySelectorAll<HTMLElement>('[hellChip]'));
    expect(chips.map((chip) => chip.getAttribute('data-slot'))).toEqual(['chip', 'chip']);
    // The remove button is empty: its × is the chip primitive's built-in CSS
    // glyph (a ::before pseudo-element), so it never leaks into text content.
    expect(chips.map((chip) => chip.textContent?.trim().replace(/\s+/g, ' '))).toEqual([
      'Atlas',
      'Nova',
    ]);

    const removeAtlas = query<HTMLButtonElement>(
      root,
      'button[hellChipRemove][aria-label="Remove Atlas"]',
    );
    // No projected content and no data-slot override: the button stays the chip
    // primitive's `root` slot so its built-in :empty × glyph renders, and its
    // "Remove Atlas" name is derived from the chip's text — never restated here.
    expect(removeAtlas.getAttribute('data-slot')).toBe('root');
    expect(removeAtlas.childElementCount).toBe(0);
    expect(removeAtlas.textContent?.trim()).toBe('');
    expect(query(root, 'button[hellChipRemove][aria-label="Remove Nova"]')).toBeTruthy();
  });

  it('routes a chip remove-button click through selection state, form value, and output', async () => {
    const { fixture, host, root } = await createChipsHost();

    query<HTMLButtonElement>(root, 'button[hellChipRemove][aria-label="Remove Atlas"]').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.control.value).toEqual(['nova']);
    expect(host.values).toEqual([['nova']]);

    const chips = Array.from(root.querySelectorAll<HTMLElement>('[hellChip]'));
    expect(chips.map((chip) => chip.textContent?.trim().replace(/\s+/g, ' '))).toEqual(['Nova']);
  });

  it('makes chips one roving tab stop and removes the focused chip from the keyboard', async () => {
    const { fixture, host, root } = await createChipsHost();
    const document = root.ownerDocument;
    const chipsRoot = query<HTMLElement>(root, '[hellComboboxChips]');
    const [atlas, nova] = Array.from(root.querySelectorAll<HTMLElement>('[hellChip]'));
    const removeButtons = Array.from(
      root.querySelectorAll<HTMLButtonElement>('button[hellChipRemove]'),
    );

    expect(chipsRoot.getAttribute('role')).toBe('group');
    expect(chipsRoot.getAttribute('tabindex')).toBe('-1');
    expect([atlas.getAttribute('tabindex'), nova.getAttribute('tabindex')]).toEqual(['0', '-1']);
    expect(removeButtons.map((button) => button.getAttribute('tabindex'))).toEqual(['-1', '-1']);

    atlas.focus();
    atlas.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(document.activeElement).toBe(nova);
    expect([atlas.getAttribute('tabindex'), nova.getAttribute('tabindex')]).toEqual(['-1', '0']);

    nova.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
    expect(document.activeElement).toBe(atlas);

    atlas.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
    fixture.detectChanges();
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    expect(host.control.value).toEqual(['nova']);
    expect(host.values).toEqual([['nova']]);
    const survivor = query<HTMLElement>(root, '[hellChip]');
    expect(survivor.textContent?.trim().replace(/\s+/g, ' ')).toBe('Nova');
    expect(survivor.getAttribute('tabindex')).toBe('0');
    expect(document.activeElement).toBe(survivor);
  });

  it('keeps option selection-state attributes coherent after chip removal', async () => {
    const { fixture, root } = await createChipsHost();

    query<HTMLButtonElement>(root, 'button[hellChipRemove][aria-label="Remove Atlas"]').click();
    await fixture.whenStable();
    fixture.detectChanges();

    // Open the listbox and assert options reflect the post-removal selection:
    // the removed value drops its screen-reader selection state, the survivor keeps it.
    const input = query<HTMLInputElement>(root, 'input[hellComboboxInput]');
    const button = query<HTMLButtonElement>(root, 'button[hellComboboxButton]');
    const dropdown = await openComboboxDropdown(fixture, input, button);
    const optionByText = (text: string): HTMLElement => {
      const option = Array.from(dropdown.querySelectorAll<HTMLElement>('[role="option"]')).find(
        (candidate) => candidate.textContent?.trim() === text,
      );
      if (!option) throw new Error(`Expected option "${text}".`);
      return option;
    };
    const atlasOption = optionByText('Atlas');
    const novaOption = optionByText('Nova');

    expect(atlasOption.hasAttribute('aria-selected')).toBe(false);
    expect(atlasOption.hasAttribute('data-selected')).toBe(false);
    expect(novaOption.getAttribute('aria-selected')).toBe('true');
    expect(novaOption.hasAttribute('data-selected')).toBe(true);
  });

  it('removes the last selection on Backspace in the empty input', async () => {
    const { fixture, host, root } = await createChipsHost();

    const input = query<HTMLInputElement>(root, 'input[hellComboboxInput]');
    input.value = '';
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.control.value).toEqual(['atlas']);
    expect(host.values).toEqual([['atlas']]);
  });

  it('does not remove a selection on Backspace when the input has text', async () => {
    const { fixture, host, root } = await createChipsHost();

    const input = query<HTMLInputElement>(root, 'input[hellComboboxInput]');
    input.value = 'orio';
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.control.value).toEqual(['atlas', 'nova']);
    expect(host.values).toEqual([]);
  });

  it('disables every chip remove button and blocks removal when the combobox is disabled', async () => {
    const { fixture, host, root } = await createChipsHost();

    host.control.disable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const chips = Array.from(root.querySelectorAll<HTMLElement>('[hellChip]'));
    expect(chips).toHaveLength(2);
    for (const chip of chips) {
      expect(chip.getAttribute('data-disabled')).toBe('');
    }

    const removeAtlas = query<HTMLButtonElement>(
      root,
      'button[hellChipRemove][aria-label="Remove Atlas"]',
    );
    expect(removeAtlas.hasAttribute('disabled')).toBe(true);

    removeAtlas.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.querySelectorAll('[hellChip]')).toHaveLength(2);
    expect(host.values).toEqual([]);
  });
});

async function waitForDropdown(fixture: {
  detectChanges: () => void;
  whenStable: () => Promise<unknown>;
}): Promise<HTMLElement> {
  const dropdown = await findDropdown(fixture, 3000);
  if (dropdown) return dropdown;

  throw new Error('Expected combobox dropdown.');
}

async function openComboboxDropdown(
  fixture: {
    detectChanges: () => void;
    whenStable: () => Promise<unknown>;
  },
  input: HTMLElement,
  button: HTMLElement,
): Promise<HTMLElement> {
  const attempts = [
    () => button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })),
    () =>
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
      ),
    () =>
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
      ),
  ];

  for (const attempt of attempts) {
    attempt();
    const dropdown = await findDropdown(fixture, 250);
    if (dropdown) return dropdown;
  }

  return waitForDropdown(fixture);
}

async function findDropdown(
  fixture: {
    detectChanges: () => void;
    whenStable: () => Promise<unknown>;
  },
  timeoutMs: number,
): Promise<HTMLElement | null> {
  const timeout = Date.now() + timeoutMs;

  while (Date.now() < timeout) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const dropdown = document.querySelector<HTMLElement>('[hellComboboxDropdown]');
    if (dropdown) return dropdown;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return null;
}

async function waitForDropdownRemoval(fixture: {
  detectChanges: () => void;
  whenStable: () => Promise<unknown>;
}): Promise<void> {
  const timeout = Date.now() + 3000;

  while (Date.now() < timeout) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    if (!document.querySelector('[hellComboboxDropdown]')) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  throw new Error('Expected combobox dropdown to be removed.');
}

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}

function cleanupPortaledTestElements(selector: string): void {
  for (const element of document.querySelectorAll(selector)) {
    element.remove();
  }
}
