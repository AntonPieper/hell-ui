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
    // `internal/core/part-class-pipeline.spec.ts`; the snapshot pins the default part
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

      pointer(zero, 'pointerdown', 1);
      vi.advanceTimersByTime(520);
      fixture.detectChanges();
      pointer(zero, 'pointerup', 1);
      // The browser still delivers the compatibility click after the hold.
      compatibilityClick(zero, 1);
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

  // Browsers suppress the compatibility click for every pointer in an
  // overlapping touch sequence, so a click-only keypad silently dropped both
  // taps whenever a second finger landed before the first one lifted.
  it('registers overlapping taps that never produce a compatibility click', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const one = query<HTMLButtonElement>(host, '[data-key="1"]');
    const two = query<HTMLButtonElement>(host, '[data-key="2"]');

    pointer(one, 'pointerdown', 10);
    pointer(two, 'pointerdown', 11);
    pointer(one, 'pointerup', 10);
    pointer(two, 'pointerup', 11);
    fixture.detectChanges();

    expect(fixture.componentInstance.digits).toEqual(['1', '2']);
    expect(fixture.componentInstance.values).toEqual(['1', '12']);
    expect(displayValue(host)).toBe('12');
  });

  it('registers a three-finger rolling sequence across keys', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const seven = query<HTMLButtonElement>(host, '[data-key="7"]');
    const eight = query<HTMLButtonElement>(host, '[data-key="8"]');
    const nine = query<HTMLButtonElement>(host, '[data-key="9"]');

    pointer(seven, 'pointerdown', 20);
    pointer(eight, 'pointerdown', 21);
    pointer(seven, 'pointerup', 20);
    pointer(nine, 'pointerdown', 22);
    pointer(eight, 'pointerup', 21);
    pointer(nine, 'pointerup', 22);
    fixture.detectChanges();

    expect(fixture.componentInstance.digits).toEqual(['7', '8', '9']);
    expect(displayValue(host)).toBe('789');
  });

  it('registers each rapid tap once when the compatibility click does arrive', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const five = query<HTMLButtonElement>(host, '[data-key="5"]');

    // A fast double-tap reports a rising click `detail` on the same key.
    tap(five, 30, 1);
    tap(five, 31, 2);
    tap(five, 32, 3);
    fixture.detectChanges();

    expect(fixture.componentInstance.digits).toEqual(['5', '5', '5']);
    expect(displayValue(host)).toBe('555');
  });

  it('abandons a tap the browser cancels for a scroll gesture', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const four = query<HTMLButtonElement>(host, '[data-key="4"]');

    pointer(four, 'pointerdown', 40);
    pointer(four, 'pointercancel', 40);
    fixture.detectChanges();

    expect(fixture.componentInstance.digits).toEqual([]);
    expect(displayValue(host)).toBe('');
  });

  it('ignores a mouse pointer that lifts on a different key than it pressed', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const one = query<HTMLButtonElement>(host, '[data-key="1"]');
    const two = query<HTMLButtonElement>(host, '[data-key="2"]');

    pointer(one, 'pointerdown', 50, { pointerType: 'mouse' });
    pointer(two, 'pointerup', 50, { pointerType: 'mouse' });
    fixture.detectChanges();

    expect(fixture.componentInstance.digits).toEqual([]);
    expect(displayValue(host)).toBe('');
  });

  // Touch and pen pointers keep implicit capture, so their release always
  // retargets to the pressed key however far the finger travelled. Only the
  // release coordinates can tell a tap from a slide-off.
  it('ignores a touch that slides off the key before lifting', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const one = query<HTMLButtonElement>(host, '[data-key="1"]');
    stubRect(one, { left: 10, top: 10, right: 90, bottom: 70 });

    pointer(one, 'pointerdown', 60, { clientX: 50, clientY: 40 });
    pointer(one, 'pointerup', 60, { clientX: 50, clientY: 260 });
    fixture.detectChanges();

    expect(fixture.componentInstance.digits).toEqual([]);
    expect(displayValue(host)).toBe('');

    // The same key still commits when the finger lifts within its bounds.
    pointer(one, 'pointerdown', 61, { clientX: 50, clientY: 40 });
    pointer(one, 'pointerup', 61, { clientX: 88, clientY: 68 });
    fixture.detectChanges();

    expect(fixture.componentInstance.digits).toEqual(['1']);
    expect(displayValue(host)).toBe('1');
  });

  it('keeps hold-for-plus per pointer while another finger taps zero', () => {
    vi.useFakeTimers();
    try {
      const fixture = TestBed.createComponent(DialpadHost);
      const host = fixture.nativeElement;
      fixture.detectChanges();

      const zero = query<HTMLButtonElement>(host, '[data-key="0"]');

      // Finger A starts holding for `+` while finger B taps the same key.
      pointer(zero, 'pointerdown', 70);
      pointer(zero, 'pointerdown', 71);
      pointer(zero, 'pointerup', 71);
      vi.advanceTimersByTime(520);
      fixture.detectChanges();
      pointer(zero, 'pointerup', 70);
      fixture.detectChanges();

      expect(fixture.componentInstance.digits).toEqual(['0', '+']);
      expect(displayValue(host)).toBe('0+');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('keeps a pending hold-for-plus alive when a foreign pointer lifts over zero', () => {
    vi.useFakeTimers();
    try {
      const fixture = TestBed.createComponent(DialpadHost);
      const host = fixture.nativeElement;
      fixture.detectChanges();

      const zero = query<HTMLButtonElement>(host, '[data-key="0"]');
      const five = query<HTMLButtonElement>(host, '[data-key="5"]');

      pointer(zero, 'pointerdown', 72);
      // A mouse press that started on `5` drags across and lifts over `0`.
      pointer(five, 'pointerdown', 73, { pointerType: 'mouse' });
      pointer(zero, 'pointerup', 73, { pointerType: 'mouse' });
      vi.advanceTimersByTime(520);
      fixture.detectChanges();

      expect(fixture.componentInstance.digits).toEqual(['+']);
      expect(displayValue(host)).toBe('+');
    } finally {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    }
  });

  it('forgets a mouse press released away from the keypad', () => {
    const fixture = TestBed.createComponent(DialpadHost);
    const host = fixture.nativeElement;
    fixture.detectChanges();

    const five = query<HTMLButtonElement>(host, '[data-key="5"]');

    // Mouse pointers get no implicit capture, so a release off the keypad
    // never reaches a key listener and the press must not stay recorded.
    pointer(five, 'pointerdown', 80, { pointerType: 'mouse' });
    window.dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse', pointerId: 80 }),
    );
    pointer(five, 'pointerup', 80, { pointerType: 'mouse' });
    fixture.detectChanges();

    expect(fixture.componentInstance.digits).toEqual([]);
    expect(displayValue(host)).toBe('');
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

function pointer(
  target: HTMLElement,
  type: 'pointerdown' | 'pointerup' | 'pointercancel',
  pointerId: number,
  init: PointerEventInit = {},
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerType: 'touch',
      pointerId,
      ...init,
    }),
  );
}

/** jsdom reports a zero-sized rect, so release hit-testing needs real bounds. */
function stubRect(
  element: HTMLElement,
  bounds: { left: number; top: number; right: number; bottom: number },
): void {
  const rect: DOMRect = {
    ...bounds,
    x: bounds.left,
    y: bounds.top,
    width: bounds.right - bounds.left,
    height: bounds.bottom - bounds.top,
    toJSON: () => bounds,
  };
  element.getBoundingClientRect = () => rect;
}

/** The click a browser synthesizes after a completed pointer tap. */
function compatibilityClick(target: HTMLElement, pointerId: number, detail = 1): void {
  target.dispatchEvent(
    new PointerEvent('click', {
      bubbles: true,
      cancelable: true,
      pointerType: 'touch',
      pointerId,
      detail,
    }),
  );
}

/** A complete browser tap: the pointer pair plus its compatibility click. */
function tap(target: HTMLElement, pointerId: number, detail = 1): void {
  pointer(target, 'pointerdown', pointerId);
  pointer(target, 'pointerup', pointerId);
  compatibilityClick(target, pointerId, detail);
}

function dispatchKey(target: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key });
  target.dispatchEvent(event);
  return event;
}
