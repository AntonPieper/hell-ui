import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { HellNativeSwitch, HellSwitch } from './switch';

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

describe('HellSwitch', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwitchHost, SwitchFormHost, NativeSwitchFormHost],
    }).compileComponents();
  });

  it('uses a native button host and forwards switch state', () => {
    const fixture = TestBed.createComponent(SwitchHost);
    fixture.detectChanges();

    const sw = query<HTMLButtonElement>(fixture.nativeElement, 'button[hellSwitch]');

    expect(sw.type).toBe('button');
    expect(sw.classList.contains('hell-switch')).toBe(true);
    expect(sw.getAttribute('role')).toBe('switch');
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(sw.querySelector('[ngpswitchthumb]')).not.toBeNull();

    sw.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.checkedEvents).toEqual([true]);

    fixture.componentInstance.checked.set(true);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(sw.disabled).toBe(true);
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
    expect(sw.classList.contains('hell-switch')).toBe(true);
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
});

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
