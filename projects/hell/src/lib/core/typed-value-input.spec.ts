import { signal } from '@angular/core';

import { HellTypedValueInputState } from './typed-value-input';

describe('Typed Value Input', () => {
  it('keeps draft text until the external value changes', () => {
    const external = signal<number | null>(1);
    const state = new HellTypedValueInputState<number, number | null>({
      external,
      parseExternal: (value) => value,
      parseText: (text) => (/^\d+$/.test(text) ? Number(text) : null),
      format: (value) => (value === null ? '' : String(value)),
    });

    state.writeDraft('draft');
    expect(state.display()).toBe('draft');

    external.set(2);
    expect(state.display()).toBe('2');
  });

  it('does not commit stale drafts after the external value changes', () => {
    const external = signal<number | null>(1);
    const state = new HellTypedValueInputState<number, number | null>({
      external,
      parseExternal: (value) => value,
      parseText: (text) => (/^\d+$/.test(text) ? Number(text) : null),
      format: (value) => (value === null ? '' : String(value)),
    });

    state.writeDraft('99');
    external.set(2);

    expect(state.commitDraft()).toBeNull();
    expect(state.display()).toBe('2');
  });

  it('commits parsed falsy values and drops invalid drafts', () => {
    const external = signal<number | null>(null);
    const state = new HellTypedValueInputState<number, number | null>({
      external,
      parseExternal: (value) => value,
      parseText: (text) => (/^\d+$/.test(text) ? Number(text) : null),
      format: (value) => (value === null ? '' : String(value)),
    });

    expect(state.commitText('0')).toBe(0);
    expect(state.display()).toBe('0');

    state.writeDraft('nope');
    expect(state.commitDraft()).toBeNull();
    expect(state.display()).toBe('0');
  });
});
