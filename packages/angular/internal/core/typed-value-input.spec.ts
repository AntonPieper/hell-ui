import { signal } from '@angular/core';

import {
  HellTypedValueInputState,
  hellInvalidTypedValue,
  hellTypedValue,
} from './typed-value-input';

describe('Typed Value Input', () => {
  it('keeps draft text until the external value changes', () => {
    const external = signal<number | null>(1);
    const state = new HellTypedValueInputState<number, number | null>({
      external,
      parseExternal: (value) => value,
      parseText: (text) => (/^\d+$/.test(text) ? hellTypedValue(Number(text)) : hellInvalidTypedValue()),
      format: (value) => (value === null ? '' : String(value)),
    });

    state.writeDraft('draft');
    expect(state.display()).toBe('draft');
    expect(state.invalidDraft()).toBe(true);

    external.set(2);
    expect(state.display()).toBe('2');
    expect(state.invalidDraft()).toBe(false);
  });

  it('does not commit stale drafts after the external value changes', () => {
    const external = signal<number | null>(1);
    const state = new HellTypedValueInputState<number, number | null>({
      external,
      parseExternal: (value) => value,
      parseText: (text) => (/^\d+$/.test(text) ? hellTypedValue(Number(text)) : hellInvalidTypedValue()),
      format: (value) => (value === null ? '' : String(value)),
    });

    state.writeDraft('99');
    external.set(2);

    expect(state.commitDraft()).toMatchObject({ committed: false, reason: 'stale' });
    expect(state.display()).toBe('2');
  });

  it('commits parsed falsy values and keeps invalid drafts visible', () => {
    const external = signal<number | null>(null);
    const state = new HellTypedValueInputState<number, number | null>({
      external,
      parseExternal: (value) => value,
      parseText: (text) => (/^\d+$/.test(text) ? hellTypedValue(Number(text)) : hellInvalidTypedValue()),
      format: (value) => (value === null ? '' : String(value)),
    });

    expect(state.commitText('0')).toEqual({ committed: true, value: 0 });
    expect(state.display()).toBe('0');

    state.writeDraft('nope');
    expect(state.commitDraft()).toMatchObject({ committed: false, reason: 'invalid' });
    expect(state.display()).toBe('nope');
    expect(state.invalidDraft()).toBe(true);
  });

  it('commits empty text as a nullable clear value', () => {
    const external = signal<number | null>(7);
    const state = new HellTypedValueInputState<number, number | null>({
      external,
      parseExternal: (value) => value,
      parseText: (text) => (text.trim() ? hellTypedValue(Number(text)) : hellTypedValue(null)),
      format: (value) => (value === null ? '' : String(value)),
    });

    expect(state.commitText('')).toEqual({ committed: true, value: null });
    expect(state.display()).toBe('');
  });

  describe('output mapping contract', () => {
    const numberAdapter = {
      external: () => null as number | null,
      parseExternal: (value: number | null) => value,
      parseText: (text: string) =>
        /^\d+$/.test(text) ? hellTypedValue(Number(text)) : hellInvalidTypedValue(),
      format: (value: number | null) => (value === null ? '' : String(value)),
    };

    it('defaults the output type to the value type without a mapper', () => {
      const state = new HellTypedValueInputState<number, number | null>(numberAdapter);
      const result: { committed: boolean; value: number | null } = state.commitText('7');
      expect(result).toEqual({ committed: true, value: 7 });
    });

    it('maps committed values through an explicit mapper when output differs', () => {
      const state = new HellTypedValueInputState<number, number | null, string>({
        ...numberAdapter,
        toOutput: (value) => (value === null ? null : String(value)),
      });
      const result: { committed: boolean; value: string | null } = state.commitText('7');
      expect(result).toEqual({ committed: true, value: '7' });
      expect(state.setValue(null)).toEqual({ committed: true, value: null });
    });

    it('respects a mapper that maps a committed value to null', () => {
      const state = new HellTypedValueInputState<number, number | null, string>({
        ...numberAdapter,
        toOutput: () => null,
      });
      expect(state.commitText('7')).toEqual({ committed: true, value: null });
    });

    it('rejects omitting the mapper when the output type differs from the value type', () => {
      const constructWithoutMapper = (): unknown =>
        // @ts-expect-error -- a differing output type must supply an explicit `toOutput` mapper
        new HellTypedValueInputState<number, number | null, string>(numberAdapter);
      expect(constructWithoutMapper).toBeInstanceOf(Function);
    });
  });
});
