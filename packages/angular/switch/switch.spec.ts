import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { HellNativeSwitch, type HellNativeSwitchUi, HellSwitch, type HellSwitchUi } from './switch';

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
  } satisfies HellNativeSwitchUi;
}

describe('HellSwitch', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SwitchHost,
        LabelledSwitchHost,
        SwitchFormHost,
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

    const sw = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSwitch]');
    const thumb = sw.querySelector<HTMLElement>('[data-slot="thumb"]');
    const native = query<HTMLInputElement>(fixture.nativeElement, 'input[hellNativeSwitch]');
    const nativeMap = query<HTMLInputElement>(fixture.nativeElement, '#native-map-switch');

    expect(sw.getAttribute('data-slot')).toBe('root');
    expect(sw.classList.contains('w-[44px]')).toBe(true);
    expect(sw.classList.contains('bg-hell-danger')).toBe(true);
    expect(sw.classList.contains('bg-hell-border-strong')).toBe(false);
    expect(sw.getAttribute('aria-checked')).toBe('true');

    expect(thumb).toBeInstanceOf(HTMLElement);
    expect(thumb?.classList.contains('size-hell-6')).toBe(true);
    expect(thumb?.classList.contains('size-hell-5')).toBe(false);
    expect(thumb?.classList.contains('bg-hell-danger-soft')).toBe(true);

    expect(native.getAttribute('data-slot')).toBe('root');
    expect(native.classList.contains('w-[44px]')).toBe(true);
    expect(native.classList.contains('bg-hell-danger')).toBe(true);
    expect(native.classList.contains('bg-hell-border-strong')).toBe(false);
    expect(native.getAttribute('data-required')).toBe('true');
    expect(native.getAttribute('aria-required')).toBe('true');

    expect(nativeMap.getAttribute('data-slot')).toBe('root');
    expect(nativeMap.classList.contains('w-[44px]')).toBe(true);
    expect(nativeMap.classList.contains('bg-hell-danger')).toBe(true);
    expect(nativeMap.classList.contains('bg-hell-border-strong')).toBe(false);
  });
});

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
