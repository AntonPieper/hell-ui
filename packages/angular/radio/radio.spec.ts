import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HellNativeRadio, HellNativeRadioGroup, HellRadio, HellRadioGroup } from './radio';
import { expectUiRouting, sortClasses } from '../spec-helpers';

@Component({
  selector: 'hell-radio-host',
  imports: [HellRadioGroup, HellRadio],
  template: `
    <div
      hellRadioGroup
      [value]="value()"
      orientation="horizontal"
      (valueChange)="events.push($any($event))"
    >
      <button hellRadio type="button" value="a">A</button>
      <button hellRadio type="button" value="b">B</button>
    </div>
  `,
})
class RadioHost {
  readonly value = signal('a');
  readonly events: string[] = [];
}

@Component({
  selector: 'hell-radio-form-host',
  imports: [ReactiveFormsModule, HellRadioGroup, HellRadio],
  template: `
    <div
      hellRadioGroup
      [formControl]="control"
      orientation="horizontal"
      (valueChange)="events.push($any($event))"
    >
      <button hellRadio type="button" value="a">A</button>
      <button hellRadio type="button" value="b">B</button>
    </div>
  `,
})
class RadioFormHost {
  readonly control = new FormControl<string | null>('a');
  readonly events: string[] = [];
}

@Component({
  selector: 'hell-radio-required-form-host',
  imports: [ReactiveFormsModule, HellRadioGroup, HellRadio],
  template: `
    <div hellRadioGroup [required]="true" [formControl]="control" orientation="horizontal">
      <button hellRadio type="button" value="a">A</button>
      <button hellRadio type="button" value="b">B</button>
    </div>
  `,
})
class RadioRequiredFormHost {
  readonly control = new FormControl<string | null>(null);
}

@Component({
  selector: 'hell-radio-disabled-required-host',
  imports: [ReactiveFormsModule, HellRadioGroup, HellRadio],
  template: `
    <div hellRadioGroup [required]="true" [formControl]="control" orientation="horizontal">
      <button hellRadio type="button" value="a">A</button>
      <button hellRadio type="button" value="b">B</button>
    </div>
  `,
})
class RadioDisabledRequiredHost {
  readonly control = new FormControl<string | null>(null);
}

@Component({
  selector: 'hell-radio-keyboard-host',
  imports: [HellRadioGroup, HellRadio],
  template: `
    <div
      hellRadioGroup
      aria-label="Plan"
      orientation="vertical"
      [required]="true"
      [value]="value()"
      (valueChange)="value.set($any($event)); events.push($any($event))"
    >
      <button hellRadio type="button" value="free">Free</button>
      <button hellRadio type="button" value="legacy" [disabled]="true">Legacy</button>
      <button hellRadio type="button" value="pro">Pro</button>
      <button hellRadio type="button" value="enterprise">Enterprise</button>
    </div>
  `,
})
class RadioKeyboardHost {
  readonly value = signal<'free' | 'legacy' | 'pro' | 'enterprise'>('free');
  readonly events: string[] = [];
}

@Component({
  selector: 'hell-radio-checked-tab-stop-host',
  imports: [HellRadioGroup, HellRadio],
  template: `
    <div hellRadioGroup [value]="value()" orientation="horizontal">
      <button hellRadio type="button" value="a">A</button>
      <button hellRadio type="button" value="b">B</button>
    </div>
  `,
})
class RadioCheckedTabStopHost {
  readonly value = signal<string | null>('b');
}

@Component({
  selector: 'hell-radio-item-disabled-host',
  imports: [HellRadioGroup, HellRadio],
  template: `
    <div hellRadioGroup orientation="horizontal">
      <button hellRadio type="button" [disabled]="true" value="a">A</button>
      <button hellRadio type="button" value="b">B</button>
    </div>
  `,
})
class RadioItemDisabledHost {}

@Component({
  selector: 'hell-native-radio-form-host',
  imports: [ReactiveFormsModule, HellNativeRadioGroup, HellNativeRadio],
  template: `
    <div hellNativeRadioGroup orientation="horizontal">
      <label><input type="radio" hellNativeRadio [formControl]="control" value="a" />A</label>
      <label><input type="radio" hellNativeRadio [formControl]="control" value="b" />B</label>
    </div>
  `,
})
class NativeRadioFormHost {
  readonly control = new FormControl<string | null>(null);
}

@Component({
  selector: 'hell-radio-part-style-host',
  imports: [HellNativeRadio, HellNativeRadioGroup, HellRadio, HellRadioGroup],
  template: `
    <div
      id="custom-group"
      hellRadioGroup
      aria-label="Mode"
      orientation="horizontal"
      ui="gap-hell-6"
      [value]="value()"
    >
      <button id="custom-radio" hellRadio type="button" value="a" [ui]="radioUi">A</button>
      <button hellRadio type="button" value="b" disabled>B</button>
    </div>

    <div
      id="custom-map-group"
      hellRadioGroup
      aria-label="Object mode"
      orientation="horizontal"
      [ui]="groupUi"
      value="a"
    >
      <button hellRadio type="button" value="a">A</button>
    </div>

    <div
      id="native-group"
      hellNativeRadioGroup
      aria-label="Native mode"
      orientation="horizontal"
      [ui]="nativeGroupUi"
    >
      <input
        id="native-radio"
        type="radio"
        hellNativeRadio
        name="mode"
        checked
        required
        ui="border-hell-danger size-hell-6"
      />
    </div>
  `,
})
class RadioPartStyleHost {
  readonly value = signal('a');
  protected readonly radioUi = {
    root: 'gap-hell-5 text-hell-danger',
  };
  protected readonly groupUi = {
    root: 'gap-hell-6',
  };
  protected readonly nativeGroupUi = {
    root: 'gap-hell-5',
  };
}

/**
 * Radio specs assert behavior, forms integration, and state attributes.
 * Part-Class Pipeline merge semantics are owned centrally by
 * `core/part-class-pipeline.spec.ts`; ui routing asserts that consumer
 * classes reach each part and that nothing outside the default render and the
 * consumer's ui appears, instead of asserting individual recipe classes. Part
 * Recipes stay package-private per ADR 0002, so the recipe snapshot below
 * pins the rendered class surface per part.
 */
describe('HellRadio', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RadioHost,
        RadioFormHost,
        RadioRequiredFormHost,
        RadioDisabledRequiredHost,
        RadioKeyboardHost,
        RadioCheckedTabStopHost,
        RadioItemDisabledHost,
        NativeRadioFormHost,
        RadioPartStyleHost,
      ],
    }).compileComponents();
  });

  it('uses native button radio items and forwards group state', () => {
    const fixture = TestBed.createComponent(RadioHost);
    fixture.detectChanges();

    const group = query<HTMLElement>(fixture.nativeElement, '[hellRadioGroup]');
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      'button[hellRadio]',
    );

    expect(group.getAttribute('data-slot')).toBe('root');
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(group.getAttribute('data-orientation')).toBe('horizontal');
    expect(group.getAttribute('aria-required')).toBe(null);
    expect(group.getAttribute('data-required')).toBe(null);
    expect(items[0].type).toBe('button');
    expect(items[0].getAttribute('data-slot')).toBe('root');
    expect(items[0].getAttribute('role')).toBe('radio');
    expect(items[0].getAttribute('aria-checked')).toBe('true');
    expect(items[1].getAttribute('aria-checked')).toBe('false');

    items[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.events.at(-1)).toBe('b');
  });

  it('integrates with reactive forms without echoing programmatic writes', async () => {
    const fixture = TestBed.createComponent(RadioFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const group = query<HTMLElement>(fixture.nativeElement, '[hellRadioGroup]');
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      'button[hellRadio]',
    );

    host.control.setValue('b');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(items[0].getAttribute('aria-checked')).toBe('false');
    expect(items[1].getAttribute('aria-checked')).toBe('true');
    expect(host.events).toEqual([]);

    items[0].click();
    group.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    fixture.detectChanges();

    expect(host.control.value).toBe('a');
    expect(host.control.touched).toBe(true);
    expect(host.events).toEqual(['a']);

    host.control.disable();
    fixture.detectChanges();

    expect(items[0].disabled).toBe(true);
    expect(items[1].disabled).toBe(true);
  });

  it('validates required through its Validator implementation', () => {
    const fixture = TestBed.createComponent(RadioRequiredFormHost);
    fixture.detectChanges();

    const hostElement = query<HTMLElement>(fixture.nativeElement, '[hellRadioGroup]');
    const group = fixture.debugElement
      .query(By.css('[hellRadioGroup]'))
      .injector.get(HellRadioGroup);

    expect(hostElement.getAttribute('aria-required')).toBe('true');
    expect(hostElement.getAttribute('data-required')).toBe('true');
    expect(group.validate(new FormControl(null))).toEqual({ required: true });
    expect(group.validate(new FormControl(''))).toEqual({ required: true });
    expect(group.validate(new FormControl('a'))).toBeNull();

    const disabledControl = new FormControl(null);
    disabledControl.disable();
    expect(group.validate(disabledControl)).toBeNull();
  });

  it('validates required for reactive forms when no selection is made', () => {
    const fixture = TestBed.createComponent(RadioRequiredFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      'button[hellRadio]',
    );

    expect(host.control.invalid).toBe(true);
    expect(host.control.getError('required')).toBe(true);

    items[0].click();
    fixture.detectChanges();

    expect(host.control.value).toBe('a');
    expect(host.control.valid).toBe(true);
    expect(host.control.getError('required')).toBeNull();

    host.control.setValue('');
    fixture.detectChanges();
    expect(host.control.invalid).toBe(true);
    expect(host.control.getError('required')).toBe(true);
  });

  it('does not report required when control is disabled', () => {
    const fixture = TestBed.createComponent(RadioDisabledRequiredHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;

    host.control.disable();
    fixture.detectChanges();

    expect(host.control.invalid).toBe(false);
    expect(host.control.disabled).toBe(true);
  });

  it('moves custom radio keyboard focus by orientation and skips disabled items', () => {
    const fixture = TestBed.createComponent(RadioKeyboardHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const group = query<HTMLElement>(root, '[hellRadioGroup]');
    const free = query<HTMLButtonElement>(root, 'button[value="free"]');
    const legacy = query<HTMLButtonElement>(root, 'button[value="legacy"]');
    const pro = query<HTMLButtonElement>(root, 'button[value="pro"]');
    const enterprise = query<HTMLButtonElement>(root, 'button[value="enterprise"]');

    expect(group.getAttribute('aria-required')).toBe('true');
    expect(legacy.disabled).toBe(true);

    free.focus();
    expect(press(free, 'ArrowRight').defaultPrevented).toBe(true);
    fixture.detectChanges();

    expect(root.ownerDocument.activeElement).toBe(pro);
    expect(host.value()).toBe('pro');
    expect(host.events.at(-1)).toBe('pro');
    expect(legacy.getAttribute('aria-checked')).toBe('false');

    expect(press(pro, 'ArrowLeft').defaultPrevented).toBe(true);
    fixture.detectChanges();

    expect(root.ownerDocument.activeElement).toBe(free);
    expect(host.value()).toBe('free');

    expect(press(free, 'ArrowDown').defaultPrevented).toBe(true);
    fixture.detectChanges();

    expect(root.ownerDocument.activeElement).toBe(pro);
    expect(host.value()).toBe('pro');

    expect(press(pro, 'ArrowUp').defaultPrevented).toBe(true);
    fixture.detectChanges();

    expect(root.ownerDocument.activeElement).toBe(free);
    expect(host.value()).toBe('free');

    expect(press(free, 'ArrowDown').defaultPrevented).toBe(true);
    fixture.detectChanges();

    expect(root.ownerDocument.activeElement).toBe(pro);
    expect(host.value()).toBe('pro');

    expect(press(pro, 'End').defaultPrevented).toBe(true);
    fixture.detectChanges();

    expect(root.ownerDocument.activeElement).toBe(enterprise);
    expect(host.value()).toBe('enterprise');

    expect(press(enterprise, 'Home').defaultPrevented).toBe(true);
    fixture.detectChanges();

    expect(root.ownerDocument.activeElement).toBe(free);
    expect(host.value()).toBe('free');
  });

  it('makes the checked custom radio the tab stop without moving focus', () => {
    const fixture = TestBed.createComponent(RadioCheckedTabStopHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    const first = query<HTMLButtonElement>(root, 'button[value="a"]');
    const second = query<HTMLButtonElement>(root, 'button[value="b"]');

    expect(first.getAttribute('aria-checked')).toBe('false');
    expect(first.getAttribute('tabindex')).toBe('-1');
    expect(second.getAttribute('aria-checked')).toBe('true');
    expect(second.getAttribute('tabindex')).toBe('0');
    expect(root.ownerDocument.activeElement).not.toBe(second);

    host.value.set(null);
    fixture.detectChanges();

    expect(first.getAttribute('aria-checked')).toBe('false');
    expect(first.getAttribute('tabindex')).toBe('0');
    expect(second.getAttribute('aria-checked')).toBe('false');
    expect(second.getAttribute('tabindex')).toBe('-1');
    expect(root.ownerDocument.activeElement).not.toBe(first);
  });

  it('applies item-level disabled state to the button host', () => {
    const fixture = TestBed.createComponent(RadioItemDisabledHost);
    fixture.detectChanges();

    const first = query<HTMLButtonElement>(fixture.nativeElement, 'button[value="a"]');
    const second = query<HTMLButtonElement>(fixture.nativeElement, 'button[value="b"]');

    expect(first.getAttribute('disabled')).toBe('');
    expect(first.getAttribute('aria-disabled')).toBe('true');
    expect(second.getAttribute('aria-disabled')).toBe(null);
    expect(second.hasAttribute('disabled')).toBe(false);
  });

  it('uses root part style maps for custom and native radio controls', () => {
    const fixture = TestBed.createComponent(RadioPartStyleHost);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const groups = root.querySelectorAll<HTMLElement>('[hellRadioGroup]');
    const customRadios = root.querySelectorAll<HTMLButtonElement>('button[hellRadio]');
    const nativeGroup = query<HTMLElement>(root, '[hellNativeRadioGroup]');
    const native = query<HTMLInputElement>(root, 'input[hellNativeRadio]');
    const group = groups[0];
    const customMapGroup = groups[1];
    const custom = customRadios[0];
    const disabled = customRadios[1];

    expect(group).toBeInstanceOf(HTMLElement);
    expect(customMapGroup).toBeInstanceOf(HTMLElement);
    expect(custom).toBeInstanceOf(HTMLButtonElement);
    expect(disabled).toBeInstanceOf(HTMLButtonElement);

    const defaultsFixture = TestBed.createComponent(RadioHost);
    const nativeDefaultsFixture = TestBed.createComponent(NativeRadioFormHost);
    defaultsFixture.detectChanges();
    nativeDefaultsFixture.detectChanges();
    const defaultGroup = query<HTMLElement>(defaultsFixture.nativeElement, '[hellRadioGroup]');
    const defaultRadio = query<HTMLButtonElement>(defaultsFixture.nativeElement, 'button[hellRadio]');
    const defaultNativeGroup = query<HTMLElement>(
      nativeDefaultsFixture.nativeElement,
      '[hellNativeRadioGroup]',
    );
    const defaultNative = query<HTMLInputElement>(
      nativeDefaultsFixture.nativeElement,
      'input[hellNativeRadio]',
    );

    expect(group.getAttribute('data-slot')).toBe('root');
    expectUiRouting(defaultGroup.className, group.className, 'gap-hell-6');

    expect(customMapGroup.getAttribute('data-slot')).toBe('root');
    expectUiRouting(defaultGroup.className, customMapGroup.className, 'gap-hell-6');

    expect(custom.getAttribute('data-slot')).toBe('root');
    expectUiRouting(defaultRadio.className, custom.className, 'gap-hell-5 text-hell-danger');
    expect(custom.getAttribute('aria-checked')).toBe('true');

    expect(disabled.getAttribute('data-slot')).toBe('root');
    expect(disabled.getAttribute('data-disabled')).toBe('');
    expect(disabled.getAttribute('aria-disabled')).toBe('true');

    expect(nativeGroup.getAttribute('data-slot')).toBe('root');
    expectUiRouting(defaultNativeGroup.className, nativeGroup.className, 'gap-hell-5');

    expect(native.getAttribute('data-slot')).toBe('root');
    expectUiRouting(defaultNative.className, native.className, 'border-hell-danger size-hell-6');
    expect(native.getAttribute('data-required')).toBe('true');
    expect(native.getAttribute('aria-required')).toBe('true');
  });

  describe('recipes', () => {
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(RadioHost);
      const nativeFixture = TestBed.createComponent(NativeRadioFormHost);
      fixture.detectChanges();
      nativeFixture.detectChanges();

      expect({
        group: sortClasses(query<HTMLElement>(fixture.nativeElement, '[hellRadioGroup]').className),
        radio: sortClasses(
          query<HTMLButtonElement>(fixture.nativeElement, 'button[hellRadio]').className,
        ),
        nativeGroup: sortClasses(
          query<HTMLElement>(nativeFixture.nativeElement, '[hellNativeRadioGroup]').className,
        ),
        nativeRadio: sortClasses(
          query<HTMLInputElement>(nativeFixture.nativeElement, 'input[hellNativeRadio]').className,
        ),
      }).toMatchSnapshot('radio');
    });
  });

  it('offers native radio inputs with built-in form semantics', () => {
    const fixture = TestBed.createComponent(NativeRadioFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const group = query<HTMLElement>(fixture.nativeElement, '[hellNativeRadioGroup]');
    const radios = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
      'input[hellNativeRadio]',
    );

    expect(group.getAttribute('data-slot')).toBe('root');
    expect(group.getAttribute('data-orientation')).toBe('horizontal');
    expect(radios[0].type).toBe('radio');
    expect(radios[0].getAttribute('data-slot')).toBe('root');

    host.control.setValue('b');
    fixture.detectChanges();

    expect(radios[1].checked).toBe(true);

    radios[0].click();
    fixture.detectChanges();

    expect(host.control.value).toBe('a');
    expect(radios[0].checked).toBe(true);
  });
});

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}

function press(element: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  element.dispatchEvent(event);
  return event;
}
