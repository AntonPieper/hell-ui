import type { DestroyRef } from '@angular/core';
import type { HellPickValue } from './pick-value';

import {
  HellPickerControl,
  hellNormalizePickMultipleValue,
  hellNormalizePickSingleValue,
  hellNormalizePickValue,
  type HellPickerEngineAdapter,
  type HellPickerEngineStream,
} from './picker-control';

class FakeStream<TValue> implements HellPickerEngineStream<TValue> {
  private readonly listeners = new Set<(value: TValue) => void>();
  unsubscribed = 0;

  subscribe(next: (value: TValue) => void): { unsubscribe(): void } {
    this.listeners.add(next);
    return {
      unsubscribe: () => {
        this.listeners.delete(next);
        this.unsubscribed += 1;
      },
    };
  }

  emit(value: TValue): void {
    for (const listener of this.listeners) listener(value);
  }
}

class FakeEngine implements HellPickerEngineAdapter<string> {
  readonly hostElement = document.createElement('div');
  readonly valueChanges = new FakeStream<HellPickValue<string> | undefined>();
  readonly openChanges = new FakeStream<boolean>();
  readonly writes: Array<HellPickValue<string>> = [];
  readonly disabledWrites: boolean[] = [];
  multipleMode = false;

  readonly host = () => this.hostElement;
  readonly multiple = () => this.multipleMode;
  readonly writeValue = (value: HellPickValue<string>) => {
    this.writes.push(value);
  };
  readonly setDisabled = (disabled: boolean) => {
    this.disabledWrites.push(disabled);
  };
}

function fakeDestroyRef(): { destroyRef: DestroyRef; destroy: () => void } {
  const callbacks: Array<() => void> = [];
  const destroyRef = {
    onDestroy(callback: () => void) {
      callbacks.push(callback);
      return () => {};
    },
  } as DestroyRef;
  return { destroyRef, destroy: () => callbacks.forEach((callback) => callback()) };
}

function focusEventWithRelatedTarget(relatedTarget: EventTarget | null): FocusEvent {
  return { relatedTarget } as FocusEvent;
}

describe('hellNormalizePickValue helpers', () => {
  it('normalizes single values: nullish clears, values pass through', () => {
    expect(hellNormalizePickSingleValue<string>(null)).toBeNull();
    expect(hellNormalizePickSingleValue<string>(undefined)).toBeNull();
    expect(hellNormalizePickSingleValue<string>('a')).toBe('a');
  });

  it('normalizes multiple values: nullish clears, arrays copy, scalars wrap', () => {
    expect(hellNormalizePickMultipleValue<string>(null)).toEqual([]);
    expect(hellNormalizePickMultipleValue<string>(undefined)).toEqual([]);
    const source = ['a', 'b'];
    const copy = hellNormalizePickMultipleValue<string>(source);
    expect(copy).toEqual(['a', 'b']);
    expect(copy).not.toBe(source);
    expect(hellNormalizePickMultipleValue<string>('a')).toEqual(['a']);
  });

  it('routes by mode', () => {
    expect(hellNormalizePickValue<string>('a', false)).toBe('a');
    expect(hellNormalizePickValue<string>('a', true)).toEqual(['a']);
  });

  it('rejects untyped engine output at the normalization boundary', () => {
    const untyped: unknown = 'a';
    // @ts-expect-error -- unknown engine output must be decoded to a pick value first
    expect(hellNormalizePickSingleValue<string>(untyped)).toBe('a');
    // @ts-expect-error -- unknown engine output must be decoded to a pick value first
    expect(hellNormalizePickMultipleValue<string>(untyped)).toEqual(['a']);
    // @ts-expect-error -- unknown engine output must be decoded to a pick value first
    expect(hellNormalizePickValue<string>(untyped, false)).toBe('a');
  });

  it('accepts an explicitly decoded pick value', () => {
    const decodePick = (value: unknown): HellPickValue<string> | undefined =>
      typeof value === 'string' ? value : undefined;
    expect(hellNormalizePickValue<string>(decodePick('a'), false)).toBe('a');
    expect(hellNormalizePickValue<string>(decodePick(1), false)).toBeNull();
  });
});

describe('HellPickerControl', () => {
  it('re-emits engine value changes to the registered form callback, normalized by mode', () => {
    const engine = new FakeEngine();
    const control = new HellPickerControl<string>(engine);
    const { destroyRef } = fakeDestroyRef();
    control.connect(destroyRef);

    const received: Array<HellPickValue<string>> = [];
    control.registerOnChange((value) => received.push(value));

    engine.valueChanges.emit('a');
    engine.multipleMode = true;
    engine.valueChanges.emit(null);

    expect(received).toEqual(['a', []]);
  });

  it('normalizes form writes against the current mode before writing to the engine', () => {
    const engine = new FakeEngine();
    const control = new HellPickerControl<string>(engine);

    control.writeValue('a');
    engine.multipleMode = true;
    control.writeValue('a');
    control.writeValue(null);

    expect(engine.writes).toEqual(['a', ['a'], []]);
  });

  it('delegates disabled state to the engine', () => {
    const engine = new FakeEngine();
    const control = new HellPickerControl<string>(engine);

    control.setDisabledState(true);
    control.setDisabledState(false);

    expect(engine.disabledWrites).toEqual([true, false]);
  });

  it('marks the control touched only for focus moves that leave the control', () => {
    const engine = new FakeEngine();
    const inside = document.createElement('button');
    engine.hostElement.appendChild(inside);
    const outside = document.createElement('button');

    const control = new HellPickerControl<string>(engine);
    let touched = 0;
    control.registerOnTouched(() => {
      touched += 1;
    });

    control.markControlTouched(focusEventWithRelatedTarget(inside));
    expect(touched).toBe(0);

    control.markControlTouched(focusEventWithRelatedTarget(outside));
    expect(touched).toBe(1);
  });

  it('counts a registered dropdown as inside only while the engine reports open', () => {
    const engine = new FakeEngine();
    const control = new HellPickerControl<string>(engine);
    const { destroyRef } = fakeDestroyRef();
    control.connect(destroyRef);

    const dropdown = document.createElement('div');
    const option = document.createElement('button');
    dropdown.appendChild(option);
    control.registerDropdown(dropdown);

    expect(control.isOutsideControl(option)).toBe(true);

    engine.openChanges.emit(true);
    expect(control.isOutsideControl(option)).toBe(false);

    engine.openChanges.emit(false);
    expect(control.isOutsideControl(option)).toBe(true);

    engine.openChanges.emit(true);
    control.unregisterDropdown(dropdown);
    expect(control.isOutsideControl(option)).toBe(true);
  });

  it('unsubscribes from engine streams on destroy', () => {
    const engine = new FakeEngine();
    const control = new HellPickerControl<string>(engine);
    const { destroyRef, destroy } = fakeDestroyRef();
    control.connect(destroyRef);

    destroy();

    expect(engine.valueChanges.unsubscribed).toBe(1);
    expect(engine.openChanges.unsubscribed).toBe(1);

    const received: unknown[] = [];
    control.registerOnChange((value) => received.push(value));
    engine.valueChanges.emit('a');
    expect(received).toEqual([]);
  });
});
