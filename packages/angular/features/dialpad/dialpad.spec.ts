import { provideHellLabels } from 'hell-ui/core';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { HellDialpad, HELL_DIALPAD_LABELS, type HellDialpadUi } from './dialpad';
import { expectUiRouting, sortClasses } from '../../spec-helpers';

@Component({
  selector: 'app-dialpad-host',
  imports: [HellDialpad],
  template: `<hell-dialpad (digit)="digits.push($event)" (valueChange)="values.push($event)" />`,
})
class DialpadHost {
  readonly digits: string[] = [];
  readonly values: string[] = [];
}

@Component({
  selector: 'app-stated-dialpad-host',
  imports: [HellDialpad],
  template: `
    <hell-dialpad
      [value]="value()"
      [disabled]="disabled()"
      [readOnly]="readOnly()"
      [invalid]="invalid()"
      (digit)="digits.push($event)"
      (valueChange)="values.push($event)"
      (call)="calls.push($event)"
    />
  `,
})
class StatedDialpadHost {
  readonly value = signal('');
  readonly disabled = signal(false);
  readonly readOnly = signal(false);
  readonly invalid = signal(false);
  readonly digits: string[] = [];
  readonly values: string[] = [];
  readonly calls: string[] = [];
}

@Component({
  selector: 'app-localized-dialpad-host',
  imports: [HellDialpad],
  providers: [
    provideHellLabels(HELL_DIALPAD_LABELS, {
      dialpad: 'Telefonwählschieber',
      backspace: 'Rücktaste',
      call: 'Anrufen',
    }),
  ],
  template: `<hell-dialpad />`,
})
class LocalizedDialpadHost {}

@Component({
  selector: 'app-controlled-dialpad-host',
  imports: [HellDialpad],
  template: `<hell-dialpad [value]="value()" (valueChange)="values.push($event)" />`,
})
class ControlledDialpadHost {
  readonly value = signal<string>('');
  values: string[] = [];
}

@Component({
  selector: 'app-ui-dialpad-host',
  imports: [HellDialpad],
  template: `<hell-dialpad [ui]="ui" />`,
})
class UiDialpadHost {
  readonly ui = {
    root: 'max-w-[360px] gap-4',
    numberInput: 'text-3xl text-[var(--color-hell-primary)]',
    clearButton: 'bg-emerald-600 border-emerald-600 hover:bg-emerald-700',
    keyButton: 'rounded-full',
    callButton: 'shadow-none',
  } satisfies HellDialpadUi;
}

describe('HellDialpad labels', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DialpadHost,
        StatedDialpadHost,
        LocalizedDialpadHost,
        ControlledDialpadHost,
        UiDialpadHost,
      ],
    }).compileComponents();
  });

  it('uses default accessibility and action labels', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    fixture.detectChanges();

    const host = fixture.nativeElement;

    expect(query(host, 'hell-dialpad').getAttribute('aria-label')).toBe('Dial pad');
    expect(query(host, '[data-slot="displayLabel"]').textContent?.trim()).toBe('Number');
    expect(numberInput(host).getAttribute('aria-label')).toBe('Number');
    expect(query(host, '[data-slot="clearButton"]').textContent?.trim()).toBe('Clear');
    expect(query(host, '[data-slot="backspaceButton"]').getAttribute('aria-label')).toBe(
      'Backspace',
    );
    expect(query(host, '[data-slot="backspaceButton"]').getAttribute('data-icon-only')).toBe('');
    expect(query(host, '[data-slot="backspaceButton"]').textContent?.trim()).toBe('');
    expect(query(host, '[data-slot="backspaceButton"] ng-icon')).toBeTruthy();
    expect(query(host, '[data-slot="clearButton"]').getAttribute('tabindex')).toBe('0');
    expect(query(host, '[data-slot="backspaceButton"]').getAttribute('tabindex')).toBe('0');
    expect(query(host, '[data-slot="keyButton"]').getAttribute('tabindex')).toBe('0');
    expect(query(host, '[data-key="2"]').getAttribute('aria-label')).toBe('Digit 2, ABC');
    expect(query(host, '[data-key="*"]').getAttribute('aria-label')).toBe('Star');
    expect(query(host, '[data-key="0"]').getAttribute('aria-label')).toBe('Digit 0, plus');
    expect(query(host, '[data-key="#"]').getAttribute('aria-label')).toBe('Pound');
    expect(host.querySelector('[data-key="+"]')).toBeNull();
    expect(query(host, '[data-slot="callButton"]').getAttribute('tabindex')).toBe('0');
    expect(query(host, '[data-slot="callButton"] ng-icon')).toBeTruthy();
    expect(query(host, '[data-slot="callButton"]').textContent?.trim()).toBe('Call');
  });

  // Touch-target sizing is a deliberate accessibility contract, so these
  // specific classes are themselves the public contract of the dialpad keys.
  it('keeps native controls at the expected touch target sizes', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    fixture.detectChanges();

    const host = fixture.nativeElement;

    expect(query(host, '[data-slot="clearButton"]').className).toContain('h-[42px]');
    expect(query(host, '[data-slot="clearButton"]').className).toContain('max-[480px]:h-[44px]');
    expect(query(host, '[data-slot="backspaceButton"]').className).toContain('h-[42px]');
    expect(query(host, '[data-slot="backspaceButton"]').className).toContain('w-[42px]');
    expect(query(host, '[data-slot="keyButton"]').className).toContain('h-[56px]');
    expect(query(host, '[data-slot="keyButton"]').className).toContain('max-[480px]:h-[64px]');
    expect(query(host, '[data-slot="callButton"]').className).toContain('h-[44px]');
  });

  it('merges consumer ui classes through the part-class pipeline', () => {
    const fixture = TestBed.createComponent(UiDialpadHost);
    const defaults = TestBed.createComponent(DialpadHost);
    fixture.detectChanges();
    defaults.detectChanges();

    const host = fixture.nativeElement;
    const defaultHost = defaults.nativeElement;

    expectUiRouting(
      query(defaultHost, 'hell-dialpad').className,
      query(host, 'hell-dialpad').className,
      'max-w-[360px] gap-4',
    );
    expectUiRouting(
      numberInput(defaultHost).className,
      numberInput(host).className,
      'text-3xl text-[var(--color-hell-primary)]',
    );
    expectUiRouting(
      query(defaultHost, '[data-slot="clearButton"]').className,
      query(host, '[data-slot="clearButton"]').className,
      'bg-emerald-600 border-emerald-600 hover:bg-emerald-700',
    );
    expectUiRouting(
      query(defaultHost, '[data-slot="keyButton"]').className,
      query(host, '[data-slot="keyButton"]').className,
      'rounded-full',
    );
    expectUiRouting(
      query(defaultHost, '[data-slot="callButton"]').className,
      query(host, '[data-slot="callButton"]').className,
      'shadow-none',
    );
  });

  describe('recipes', () => {
    // Part-Class Pipeline merge semantics are owned centrally by
    // `core/part-class-pipeline.spec.ts`; the snapshot pins the default part
    // classes without asserting individual utilities elsewhere.
    it('keeps the default part classes stable', () => {
      const fixture = TestBed.createComponent(DialpadHost);
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;
      const partClasses = (slot: string): string[] =>
        sortClasses(host.querySelector(`[data-slot="${slot}"]`)?.getAttribute('class') ?? '');

      expect({
        root: sortClasses(query(host, 'hell-dialpad').className),
        displayLabel: partClasses('displayLabel'),
        numberInput: sortClasses(numberInput(host).className),
        clearButton: partClasses('clearButton'),
        backspaceButton: partClasses('backspaceButton'),
        keyButton: partClasses('keyButton'),
        callButton: partClasses('callButton'),
      }).toMatchSnapshot('dialpad');
    });
  });

  it('supports label overrides via HELL_DIALPAD_LABELS', () => {
    const fixture = TestBed.createComponent(LocalizedDialpadHost);
    fixture.detectChanges();

    const host = fixture.nativeElement;

    expect(query(host, 'hell-dialpad').getAttribute('aria-label')).toBe('Telefonwählschieber');
    expect(query(host, '[data-slot="backspaceButton"]').getAttribute('aria-label')).toBe(
      'Rücktaste',
    );
    expect(query(host, '[data-slot="callButton"]').textContent?.trim()).toBe('Anrufen');
  });

  it('updates local display when value is uncontrolled', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    fixture.detectChanges();

    const host = fixture.nativeElement;
    const firstDigit = [...host.querySelectorAll('[data-slot="keyButton"]')].find(
      (button) => button.textContent?.trim() === '1',
    );
    if (!(firstDigit instanceof HTMLElement)) {
      throw new Error('Expected a dialpad digit button.');
    }

    firstDigit.click();
    fixture.detectChanges();

    expect(displayValue(host)).toBe('1');
    expect(query(host, '[data-slot="backspaceButton"]').getAttribute('disabled')).toBeNull();
  });

  it('handles host keyboard digits and backspace with active key feedback', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const dialpad = query(host, 'hell-dialpad');
    const digit = dispatchKey(dialpad, '5');
    fixture.detectChanges();

    expect(digit.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.digits).toEqual(['5']);
    expect(fixture.componentInstance.values).toEqual(['5']);
    expect(displayValue(host)).toBe('5');
    expect(query(host, '[data-key="5"]').getAttribute('data-active')).toBe('');

    const backspace = dispatchKey(dialpad, 'Backspace');
    fixture.detectChanges();

    expect(backspace.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.values).toEqual(['5', '']);
    expect(displayValue(host)).toBe('');
    expect(query(host, '[data-slot="backspaceButton"]').getAttribute('data-active')).toBe('');
  });

  it('handles keyboard input while a child key has focus', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const two = query<HTMLButtonElement>(host, '[data-key="2"]');
    two.focus();

    const digit = dispatchKey(two, '7');
    fixture.detectChanges();

    expect(digit.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.digits).toEqual(['7']);
    expect(fixture.componentInstance.values).toEqual(['7']);
    expect(displayValue(host)).toBe('7');
  });

  it('accepts keyboard entry from the number input and sanitizes typed values', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const input = numberInput(host);
    input.focus();

    const digit = dispatchKey(input, '2');
    const plus = dispatchKey(input, '+');
    fixture.detectChanges();

    expect(digit.defaultPrevented).toBe(true);
    expect(plus.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.digits).toEqual(['2', '+']);
    expect(fixture.componentInstance.values).toEqual(['2', '2+']);
    expect(displayValue(host)).toBe('2+');
    expect(query(host, '[data-key="0"]').getAttribute('data-active')).toBe('');

    input.value = '2+abc#';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(displayValue(host)).toBe('2+#');
    expect(fixture.componentInstance.values).toEqual(['2', '2+', '2+#']);
  });

  it('enters plus from a pointer hold on zero without a separate plus key', () => {
    vi.useFakeTimers();
    try {
      const fixture = TestBed.createComponent(DialpadHost);
      const host = fixture.nativeElement;
      fixture.detectChanges();

      const zero = query<HTMLButtonElement>(host, '[data-key="0"]');

      zero.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }));
      vi.advanceTimersByTime(520);
      fixture.detectChanges();
      zero.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }));
      zero.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.digits).toEqual(['+']);
      expect(fixture.componentInstance.values).toEqual(['+']);
      expect(displayValue(host)).toBe('+');
      expect(zero.getAttribute('data-active')).toBe('');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('clears with Delete and submits with Enter from host focus', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const dialpad = query(host, 'hell-dialpad');
    dispatchKey(dialpad, '1');
    dispatchKey(dialpad, '2');
    fixture.detectChanges();

    const enter = dispatchKey(dialpad, 'Enter');
    fixture.detectChanges();

    expect(enter.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.values).toEqual(['1', '12']);
    expect(displayValue(host)).toBe('12');

    const clear = dispatchKey(dialpad, 'Delete');
    fixture.detectChanges();

    expect(clear.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.values).toEqual(['1', '12', '']);
    expect(displayValue(host)).toBe('');
    expect(query(host, '[data-slot="clearButton"]').getAttribute('data-active')).toBe('');
  });

  it('emits call from the call button and number input Enter', () => {
    const fixture = TestBed.createComponent(StatedDialpadHost);
    fixture.componentInstance.value.set('5550137');
    const host = fixture.nativeElement;
    fixture.detectChanges();

    query<HTMLButtonElement>(host, '[data-slot="callButton"]').click();
    fixture.detectChanges();

    dispatchKey(numberInput(host), 'Enter');
    fixture.detectChanges();

    expect(fixture.componentInstance.calls).toEqual(['5550137', '5550137']);
    expect(query(host, '[data-slot="callButton"]').getAttribute('data-active')).toBe('');
  });

  it('exposes disabled state and blocks keyboard and pointer edits', () => {
    const fixture = TestBed.createComponent(StatedDialpadHost);
    fixture.componentInstance.value.set('12');
    fixture.componentInstance.disabled.set(true);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const dialpad = query(host, 'hell-dialpad');
    expect(dialpad.getAttribute('aria-disabled')).toBe('true');
    expect(dialpad.getAttribute('data-disabled')).toBe('');
    expect(numberInput(host).disabled).toBe(true);
    expect(query<HTMLButtonElement>(host, '[data-key="3"]').disabled).toBe(true);
    expect(query<HTMLButtonElement>(host, '[data-slot="clearButton"]').disabled).toBe(true);
    expect(query<HTMLButtonElement>(host, '[data-slot="backspaceButton"]').disabled).toBe(true);
    expect(query<HTMLButtonElement>(host, '[data-slot="callButton"]').disabled).toBe(true);

    dispatchKey(dialpad, '3');
    query<HTMLButtonElement>(host, '[data-key="3"]').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.digits).toEqual([]);
    expect(fixture.componentInstance.values).toEqual([]);
    expect(displayValue(host)).toBe('12');
  });

  it('keeps readonly values callable while blocking edits', () => {
    const fixture = TestBed.createComponent(StatedDialpadHost);
    fixture.componentInstance.value.set('12');
    fixture.componentInstance.readOnly.set(true);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const dialpad = query(host, 'hell-dialpad');
    expect(dialpad.getAttribute('data-readonly')).toBe('');
    expect(numberInput(host).readOnly).toBe(true);
    expect(query<HTMLButtonElement>(host, '[data-key="3"]').disabled).toBe(true);
    expect(query<HTMLButtonElement>(host, '[data-slot="clearButton"]').disabled).toBe(true);
    expect(query<HTMLButtonElement>(host, '[data-slot="backspaceButton"]').disabled).toBe(true);
    expect(query<HTMLButtonElement>(host, '[data-slot="callButton"]').disabled).toBe(false);

    const digit = dispatchKey(dialpad, '3');
    dispatchKey(dialpad, 'Backspace');
    dispatchKey(dialpad, 'Enter');
    fixture.detectChanges();

    expect(digit.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.digits).toEqual([]);
    expect(fixture.componentInstance.values).toEqual([]);
    expect(fixture.componentInstance.calls).toEqual(['12']);
    expect(displayValue(host)).toBe('12');
  });

  it('exposes invalid state for styling and accessibility', () => {
    const fixture = TestBed.createComponent(StatedDialpadHost);
    fixture.componentInstance.invalid.set(true);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const dialpad = query(host, 'hell-dialpad');

    expect(dialpad.getAttribute('aria-invalid')).toBe('true');
    expect(dialpad.getAttribute('data-invalid')).toBe('');
  });

  it('treats an explicit empty controlled value as controlled state', () => {
    const fixture = TestBed.createComponent(ControlledDialpadHost);
    fixture.componentInstance.value.set('');
    fixture.detectChanges();

    const host = fixture.nativeElement;
    const backspace = query(host, '[data-slot="backspaceButton"]');
    const firstDigit = [...host.querySelectorAll('[data-slot="keyButton"]')].find(
      (button) => button.textContent?.trim() === '1',
    );
    if (!(firstDigit instanceof HTMLElement)) {
      throw new Error('Expected a dialpad digit button.');
    }

    expect(backspace.getAttribute('disabled')).toBe('');
    expect(query(host, '[data-slot="clearButton"]').getAttribute('disabled')).toBe('');

    firstDigit.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.values).toEqual(['1']);
    expect(displayValue(host)).toBe('');
    expect(backspace.getAttribute('disabled')).toBe('');
  });
});

function query<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Expected ${selector}.`);
  }
  return element as T;
}

function numberInput(root: HTMLElement): HTMLInputElement {
  return query<HTMLInputElement>(root, '[data-slot="numberInput"]');
}

function displayValue(root: HTMLElement): string {
  return numberInput(root).value;
}

function dispatchKey(target: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key });
  target.dispatchEvent(event);
  return event;
}
