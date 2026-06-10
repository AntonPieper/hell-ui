import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HellNativeRadio, HellNativeRadioGroup, HellRadio, HellRadioGroup } from './radio';

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

    expect(group.classList.contains('hell-radio-group')).toBe(true);
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(group.getAttribute('data-orientation')).toBe('horizontal');
    expect(group.getAttribute('aria-required')).toBe(null);
    expect(group.getAttribute('data-required')).toBe(null);
    expect(items[0].type).toBe('button');
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

  it('offers native radio inputs with built-in form semantics', () => {
    const fixture = TestBed.createComponent(NativeRadioFormHost);
    fixture.detectChanges();

    const host = fixture.componentInstance;
    const group = query<HTMLElement>(fixture.nativeElement, '[hellNativeRadioGroup]');
    const radios = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
      'input[hellNativeRadio]',
    );

    expect(group.classList.contains('hell-radio-group')).toBe(true);
    expect(group.getAttribute('data-orientation')).toBe('horizontal');
    expect(radios[0].type).toBe('radio');
    expect(radios[0].classList.contains('hell-radio')).toBe(true);

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
