import type { DestroyRef } from '@angular/core';
import type { HellPickValue } from './pick-value';

import {
  HellPickerFocusScope,
  hellNormalizePickMultipleValue,
  hellNormalizePickSingleValue,
  hellNormalizePickValue,
  hellSamePickValue,
  type HellPickerFocusScopeAdapter,
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

class FakeEngine implements HellPickerFocusScopeAdapter {
  readonly hostElement = document.createElement('div');
  readonly openChanges = new FakeStream<boolean>();

  readonly host = () => this.hostElement;
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

describe('hellSamePickValue', () => {
  it('treats every nullish shape as the same empty single selection', () => {
    expect(hellSamePickValue<string>(null, undefined)).toBe(true);
    expect(hellSamePickValue<string>(undefined, null)).toBe(true);
    expect(hellSamePickValue<string>(null, 'a')).toBe(false);
  });

  it('compares single values by identity', () => {
    const value = { id: 'a' };
    expect(hellSamePickValue(value, value)).toBe(true);
    expect(hellSamePickValue(value, { id: 'a' })).toBe(false);
  });

  it('compares multiple values by item identity and order', () => {
    const a = { id: 'a' };
    const b = { id: 'b' };
    expect(hellSamePickValue([a, b], [a, b])).toBe(true);
    expect(hellSamePickValue([a, b], [b, a])).toBe(false);
    expect(hellSamePickValue([a], [a, b])).toBe(false);
    expect(hellSamePickValue<{ id: string }>([], [])).toBe(true);
  });

  it('does not equate an array value with a scalar or nullish value', () => {
    expect(hellSamePickValue<string>(['a'], 'a')).toBe(false);
    expect(hellSamePickValue<string>([], null)).toBe(false);
  });
});

describe('HellPickerFocusScope', () => {
  function focusScope(engine: FakeEngine): HellPickerFocusScope {
    const scope = new HellPickerFocusScope(engine);
    const { destroyRef } = fakeDestroyRef();
    scope.connect(destroyRef);
    return scope;
  }

  it('treats targets inside the host as inside the control', () => {
    const engine = new FakeEngine();
    const inside = document.createElement('button');
    engine.hostElement.appendChild(inside);
    const outside = document.createElement('button');

    const scope = focusScope(engine);

    expect(scope.isOutsideControl(inside)).toBe(false);
    expect(scope.isOutsideControl(outside)).toBe(true);
    expect(scope.isOutsideControl(null)).toBe(true);
  });

  it('counts a registered dropdown as inside only while the engine reports open', () => {
    const engine = new FakeEngine();
    const scope = focusScope(engine);

    const dropdown = document.createElement('div');
    const option = document.createElement('button');
    dropdown.appendChild(option);
    scope.registerDropdown(dropdown);

    expect(scope.isOutsideControl(option)).toBe(true);

    engine.openChanges.emit(true);
    expect(scope.isOutsideControl(option)).toBe(false);

    engine.openChanges.emit(false);
    expect(scope.isOutsideControl(option)).toBe(true);

    engine.openChanges.emit(true);
    scope.unregisterDropdown(dropdown);
    expect(scope.isOutsideControl(option)).toBe(true);
  });

  it('unsubscribes from the open stream on destroy', () => {
    const engine = new FakeEngine();
    const scope = new HellPickerFocusScope(engine);
    const { destroyRef, destroy } = fakeDestroyRef();
    scope.connect(destroyRef);

    const dropdown = document.createElement('div');
    scope.registerDropdown(dropdown);

    destroy();

    expect(engine.openChanges.unsubscribed).toBe(1);

    engine.openChanges.emit(true);
    expect(scope.isOutsideControl(dropdown)).toBe(true);
  });
});
