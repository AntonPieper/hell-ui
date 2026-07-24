import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, NgModel, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled as disabledSchema, form } from '@angular/forms/signals';

import { HellNativeSwitch, HellSwitch, type HellSwitchUi } from './switch';
import { expectUiRouting, sortClasses } from '../spec-helpers';

/**
 * Switch specs assert behavior, forms integration, and state attributes.
 * Part-Class Pipeline merge semantics are owned centrally by
 * `internal/core/part-class-pipeline.spec.ts`; ui routing asserts that consumer
 * classes reach each part and that nothing outside the default render and the
 * consumer's ui appears, instead of asserting individual recipe classes. Part
 * Recipes stay package-private per ADR 0002, so the recipe snapshot below
 * pins the rendered class surface per part.
 */

@Component({
  imports: [HellSwitch],
  template: `
    <button
      hellSwitch
      [checked]="checked()"
      [disabled]="disabled()"
      (checkedChange)="checkedEvents.push($event)"
    ></button>
  `,
})
class SwitchHost {
  readonly checked = signal(false);
  readonly disabled = signal(false);
  readonly checkedEvents: boolean[] = [];
}

@Component({
  imports: [HellSwitch],
  template: `
    <button hellSwitch [(checked)]="checked" (checkedChange)="checkedEvents.push($event)"></button>
  `,
})
class SwitchTwoWayHost {
  readonly checked = signal(false);
  readonly checkedEvents: boolean[] = [];
}

@Component({
  imports: [HellSwitch],
  template: `
    <div>
      <button
        id="email-notifications-switch"
        hellSwitch
        [checked]="checked()"
        [disabled]="disabled()"
        (checkedChange)="onCheckedChange($event)"
        (keydown.space)="onSpaceKeydown()"
      ></button>
      <label for="email-notifications-switch">Email notifications</label>
    </div>
  `,
})
class LabelledSwitchHost {
  readonly checked = signal(false);
  readonly disabled = signal(false);
  readonly checkedEvents: boolean[] = [];
  spaceKeydowns = 0;

  onCheckedChange(checked: boolean): void {
    this.checked.set(checked);
    this.checkedEvents.push(checked);
  }

  onSpaceKeydown(): void {
    this.spaceKeydowns++;
  }
}

@Component({
  imports: [ReactiveFormsModule, HellSwitch],
  template: `
    <button hellSwitch [formControl]="control" (checkedChange)="checkedEvents.push($event)"></button>
  `,
})
class SwitchFormHost {
  readonly control = new FormControl(false, { nonNullable: true });
  readonly checkedEvents: boolean[] = [];
}

@Component({
  imports: [FormsModule, HellSwitch],
  template: `
    <button hellSwitch [(ngModel)]="checked" (checkedChange)="checkedEvents.push($event)"></button>
  `,
})
class SwitchNgModelHost {
  readonly checked = signal(false);
  readonly model = viewChild.required(NgModel);
  readonly checkedEvents: boolean[] = [];
}

@Component({
  imports: [FormField, HellSwitch],
  template: `
    <button
      hellSwitch
      [formField]="settingsForm.notify"
      (checkedChange)="checkedEvents.push($event)"
    ></button>
  `,
})
class SwitchSignalFormsHost {
  readonly formDisabled = signal(false);
  readonly model = signal({ notify: true });
  readonly settingsForm = form(this.model, (path) => {
    disabledSchema(path.notify, () => this.formDisabled());
  });
  readonly checkedEvents: boolean[] = [];
}

@Component({
  imports: [ReactiveFormsModule, HellNativeSwitch],
  template: `
    <label>
      <input
        type="checkbox"
        hellNativeSwitch
        [formControl]="control"
        [required]="required()"
        (checkedChange)="checkedEvents.push($event)"
      />
      Native switch
    </label>
  `,
})
class NativeSwitchFormHost {
  readonly control = new FormControl(false, { nonNullable: true });
  readonly required = signal(false);
  readonly checkedEvents: boolean[] = [];
}

@Component({
  imports: [HellNativeSwitch, HellSwitch],
  template: `
    <button data-testid="default-switch" hellSwitch [checked]="true"></button>
    <input data-testid="default-native-switch" type="checkbox" hellNativeSwitch checked />
    <button id="custom-switch" hellSwitch [checked]="true" [ui]="switchUi"></button>
    <input
      id="native-switch"
      type="checkbox"
      hellNativeSwitch
      checked
      required
      ui="w-[44px] bg-hell-danger"
    />
    <input
      id="native-map-switch"
      type="checkbox"
      hellNativeSwitch
      checked
      [ui]="nativeSwitchUi"
    />
  `,
})
class SwitchPartStyleHost {
  protected readonly switchUi = {
    root: 'w-[44px] bg-hell-danger',
    thumb: 'size-hell-6 bg-hell-danger-soft',
  } satisfies HellSwitchUi;

  protected readonly nativeSwitchUi = {
    root: 'w-[44px] bg-hell-danger',
  };
}

describe('HellSwitch', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SwitchHost,
        SwitchTwoWayHost,
        LabelledSwitchHost,
        SwitchFormHost,
        SwitchNgModelHost,
        SwitchSignalFormsHost,
        NativeSwitchFormHost,
        SwitchPartStyleHost,
      ],
    }).compileComponents();
  });

  it('uses a native button host and forwards switch state', () => {
    const fixture = TestBed.createComponent(SwitchHost);
    fixture.detectChanges();

    const sw = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSwitch]');

    expect(sw.type).toBe('button');
    expect(sw.getAttribute('data-slot')).toBe('root');
    expect(sw.getAttribute('role')).toBe('switch');
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(sw.querySelector('[ngpswitchthumb]')?.getAttribute('data-slot')).toBe('thumb');

    sw.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.checkedEvents).toEqual([true]);

    fixture.componentInstance.checked.set(true);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(sw.disabled).toBe(true);
  });

  it('toggles the custom switch with click and Space while keeping a visible label association', () => {
    const fixture = TestBed.createComponent(LabelledSwitchHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const label = query<HTMLLabelElement>(fixture.nativeElement, 'label');
    const sw = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSwitch]');

    expect(label.htmlFor).toBe('email-notifications-switch');
    expect(sw.id).toBe('email-notifications-switch');

    sw.click();
    fixture.detectChanges();

    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(host.checkedEvents).toEqual([true]);

    const keydown = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    });
    const dispatched = sw.dispatchEvent(keydown);
    fixture.detectChanges();

    expect(dispatched).toBe(false);
    expect(keydown.defaultPrevented).toBe(true);
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(host.checkedEvents).toEqual([true, false]);
    expect(host.spaceKeydowns).toBe(1);
  });

  it('synchronizes two-way binding through one checked authority without duplicate commits', () => {
    const fixture = TestBed.createComponent(SwitchTwoWayHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const sw = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSwitch]');

    expect(sw.getAttribute('aria-checked')).toBe('false');

    // External parent write flows in without echoing a change event.
    host.checked.set(true);
    fixture.detectChanges();

    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(host.checkedEvents).toEqual([]);

    // One user interaction commits exactly once: parent state and one event.
    sw.click();
    fixture.detectChanges();

    expect(host.checked()).toBe(false);
    expect(host.checkedEvents).toEqual([false]);
    expect(sw.getAttribute('aria-checked')).toBe('false');
  });

  it('integrates with reactive forms without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(SwitchFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const sw = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSwitch]');

    host.control.setValue(true);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(host.checkedEvents).toEqual([]);

    sw.click();
    sw.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.control.value).toBe(false);
    expect(host.control.touched).toBe(true);
    expect(host.checkedEvents).toEqual([false]);

    host.control.disable();
    fixture.detectChanges();

    expect(sw.disabled).toBe(true);
  });

  it('integrates with template-driven forms through ngModel', async () => {
    const fixture = TestBed.createComponent(SwitchNgModelHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const sw = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSwitch]');

    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(host.checkedEvents).toEqual([]);

    sw.click();
    fixture.detectChanges();

    expect(host.checked()).toBe(true);
    expect(host.checkedEvents).toEqual([true]);
    expect(host.model().touched).toBe(false);

    sw.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.model().touched).toBe(true);

    host.checked.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(host.checkedEvents).toEqual([true]);
  });

  it('participates in Signal Forms as a FormCheckboxControl through formField', () => {
    const fixture = TestBed.createComponent(SwitchSignalFormsHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const sw = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSwitch]');

    expect(sw.getAttribute('aria-checked')).toBe('true');

    // Form-driven writes flow in without echoing an interaction commit.
    host.settingsForm.notify().value.set(false);
    fixture.detectChanges();

    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(host.checkedEvents).toEqual([]);
    expect(host.settingsForm.notify().dirty()).toBe(false);

    // One user interaction commits exactly once into the field and the model.
    sw.click();
    fixture.detectChanges();

    expect(host.settingsForm.notify().value()).toBe(true);
    expect(host.model().notify).toBe(true);
    expect(host.checkedEvents).toEqual([true]);
    expect(host.settingsForm.notify().dirty()).toBe(true);
    expect(host.settingsForm.notify().touched()).toBe(false);

    sw.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    fixture.detectChanges();

    expect(host.settingsForm.notify().touched()).toBe(true);

    // Field-driven disabled state reaches interaction and accessibility state.
    host.formDisabled.set(true);
    fixture.detectChanges();

    expect(sw.disabled).toBe(true);

    sw.click();
    fixture.detectChanges();

    expect(host.settingsForm.notify().value()).toBe(true);
    expect(host.checkedEvents).toEqual([true]);
  });

  it('offers a native switch path with built-in checkbox form semantics', () => {
    const fixture = TestBed.createComponent(NativeSwitchFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const sw = query<HTMLInputElement>(fixture.nativeElement, 'input[hellNativeSwitch]');

    expect(sw.type).toBe('checkbox');
    expect(sw.getAttribute('role')).toBe('switch');
    expect(sw.getAttribute('data-slot')).toBe('root');
    expect(sw.hasAttribute('required')).toBe(false);
    expect(sw.getAttribute('aria-required')).toBeNull();

    host.required.set(true);
    host.control.setValue(true);
    fixture.detectChanges();

    expect(sw.getAttribute('required')).toBe('');
    expect(sw.getAttribute('aria-required')).toBe('true');
    expect(sw.getAttribute('data-required')).toBe('true');
    expect(sw.checked).toBe(true);

    sw.click();
    fixture.detectChanges();

    expect(host.control.value).toBe(false);
    expect(host.checkedEvents).toEqual([false]);
  });

  it('uses part style maps for custom and native switch controls', () => {
    const fixture = TestBed.createComponent(SwitchPartStyleHost);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const defaults = query<HTMLButtonElement>(root, '[data-testid="default-switch"]');
    const defaultNative = query<HTMLInputElement>(root, '[data-testid="default-native-switch"]');
    const sw = query<HTMLButtonElement>(root, '#custom-switch');
    const thumb = sw.querySelector<HTMLElement>('[data-slot="thumb"]');
    const defaultThumb = defaults.querySelector<HTMLElement>('[data-slot="thumb"]');
    const native = query<HTMLInputElement>(root, '#native-switch');
    const nativeMap = query<HTMLInputElement>(root, '#native-map-switch');

    expect(sw.getAttribute('data-slot')).toBe('root');
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expectUiRouting(classAttr(defaults), classAttr(sw), 'w-[44px] bg-hell-danger');

    expect(thumb).toBeInstanceOf(HTMLElement);
    expectUiRouting(classAttr(defaultThumb), classAttr(thumb), 'size-hell-6 bg-hell-danger-soft');

    expect(native.getAttribute('data-slot')).toBe('root');
    expectUiRouting(classAttr(defaultNative), classAttr(native), 'w-[44px] bg-hell-danger');
    expect(native.getAttribute('data-required')).toBe('true');
    expect(native.getAttribute('aria-required')).toBe('true');

    expect(nativeMap.getAttribute('data-slot')).toBe('root');
    expectUiRouting(classAttr(defaultNative), classAttr(nativeMap), 'w-[44px] bg-hell-danger');
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(SwitchPartStyleHost);
      fixture.detectChanges();

      const root = fixture.nativeElement as HTMLElement;
      const defaults = query<HTMLButtonElement>(root, '[data-testid="default-switch"]');

      expect({
        root: sortClasses(classAttr(defaults)),
        thumb: sortClasses(classAttr(defaults.querySelector('[data-slot="thumb"]'))),
        nativeRoot: sortClasses(classAttr(query(root, '[data-testid="default-native-switch"]'))),
      }).toMatchSnapshot('switch');
    });
  });
});

function classAttr(element: Element | null): string {
  return element?.getAttribute('class') ?? '';
}

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
