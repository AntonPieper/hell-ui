import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { HellRadio, HellRadioGroup } from './radio';

@Component({
  imports: [HellRadioGroup, HellRadio],
  template: `
    <div hellRadioGroup [value]="value()" orientation="horizontal" (valueChange)="events.push($any($event))">
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
  imports: [ReactiveFormsModule, HellRadioGroup, HellRadio],
  template: `
    <div hellRadioGroup [formControl]="control" orientation="horizontal" (valueChange)="events.push($any($event))">
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
  imports: [HellRadioGroup, HellRadio],
  template: `
    <div hellRadioGroup orientation="horizontal">
      <button hellRadio type="button" [disabled]="true" value="a">A</button>
      <button hellRadio type="button" value="b">B</button>
    </div>
  `,
})
class RadioItemDisabledHost {}
describe('HellRadio', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RadioHost,
        RadioFormHost,
        RadioRequiredFormHost,
        RadioDisabledRequiredHost,
        RadioItemDisabledHost,
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

    const group = fixture.debugElement.query(By.css('[hellRadioGroup]')).injector.get(HellRadioGroup);

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
});

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Expected ${selector}.`);
  return element;
}
