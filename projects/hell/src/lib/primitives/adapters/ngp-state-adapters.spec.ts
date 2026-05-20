import { Component, Directive, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgpCombobox, injectComboboxState } from 'ng-primitives/combobox';
import { NgpRadioGroup, injectRadioGroupState } from 'ng-primitives/radio';
import { NgpSelect, injectSelectState } from 'ng-primitives/select';

import {
  HELL_NGP_STATE_WRITER_VERSION,
  writeComboboxStateDisabled,
  writeComboboxStateValue,
  writeRadioGroupStateDisabled,
  writeRadioGroupStateValue,
  writeSelectStateDisabled,
  writeSelectStateValue,
} from './ngp-state-adapters';

type WritableSignalLike<T> = (() => T) & { set: (value: T) => void };

@Directive({
  selector: '[hellSelectStateProbe]',
  hostDirectives: [NgpSelect],
})
class SelectStateProbe {
  readonly state = injectSelectState<NgpSelect>();
}

@Component({
  imports: [SelectStateProbe],
  template: `<button hellSelectStateProbe type="button"></button>`,
})
class SelectStateProbeHost {}

@Directive({
  selector: '[hellComboboxStateProbe]',
  hostDirectives: [NgpCombobox],
})
class ComboboxStateProbe {
  readonly state = injectComboboxState<NgpCombobox>();
}

@Component({
  imports: [ComboboxStateProbe],
  template: `<div hellComboboxStateProbe></div>`,
})
class ComboboxStateProbeHost {}

@Directive({
  selector: '[hellRadioGroupStateProbe]',
  hostDirectives: [NgpRadioGroup],
})
class RadioGroupStateProbe {
  readonly state = injectRadioGroupState<string>();
}

@Component({
  imports: [RadioGroupStateProbe],
  template: `<div hellRadioGroupStateProbe></div>`,
})
class RadioGroupStateProbeHost {}

function writableChannel<T>(state: unknown, channel: 'value' | 'disabled'): WritableSignalLike<T> {
  const value = (state as Record<string, unknown>)[channel];
  if (typeof value !== 'function' || typeof (value as { set?: unknown }).set !== 'function') {
    throw new Error(`Expected public ng-primitives state.${channel} writable signal.`);
  }
  return value as WritableSignalLike<T>;
}

function probe<T>(host: Type<unknown>, directive: Type<T>): T {
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  return fixture.debugElement.query(By.directive(directive)).injector.get(directive);
}

describe('ngp state-writer compatibility helpers', () => {
  it('documents the installed ng-primitives version this state-writer fallback targets', () => {
    expect(HELL_NGP_STATE_WRITER_VERSION).toBe('ng-primitives@0.117.2');
  });

  describe('installed ng-primitives public state provider drift', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SelectStateProbeHost, ComboboxStateProbeHost, RadioGroupStateProbeHost],
      }).compileComponents();
    });

    it('writes select CVA updates through the public injected State<T> channels', () => {
      const state = probe(SelectStateProbeHost, SelectStateProbe).state();
      const value = writableChannel<unknown>(state, 'value');
      const disabled = writableChannel<boolean>(state, 'disabled');

      writeSelectStateValue(state, 'from-public-state');
      writeSelectStateDisabled(state, true);

      expect(value()).toBe('from-public-state');
      expect(disabled()).toBe(true);
    });

    it('writes combobox CVA updates through the public injected State<T> channels', () => {
      const state = probe(ComboboxStateProbeHost, ComboboxStateProbe).state();
      const value = writableChannel<unknown>(state, 'value');
      const disabled = writableChannel<boolean>(state, 'disabled');

      writeComboboxStateValue(state, 'from-public-state');
      writeComboboxStateDisabled(state, true);

      expect(value()).toBe('from-public-state');
      expect(disabled()).toBe(true);
    });

    it('writes radio-group CVA updates through the public injected State<T> channels', () => {
      const state = probe(RadioGroupStateProbeHost, RadioGroupStateProbe).state();
      const value = writableChannel<string | null>(state, 'value');
      const disabled = writableChannel<boolean>(state, 'disabled');

      writeRadioGroupStateValue(state, 'from-public-state');
      writeRadioGroupStateDisabled(state, true);

      expect(value()).toBe('from-public-state');
      expect(disabled()).toBe(true);
    });
  });

  it('prefers select public value setter when present', () => {
    const setValue = vi.fn();
    const value = vi.fn();
    const state = {
      setValue,
      value: { set: value },
      disabled: { set: vi.fn() },
    };

    writeSelectStateValue(state as never, 'value');

    expect(setValue).toHaveBeenCalledWith('value', { emit: false });
    expect(value).not.toHaveBeenCalled();
  });

  it('writes select value through ng-primitives State<T> value.set fallback only', () => {
    const value = vi.fn();
    const disabled = vi.fn();
    const state = {
      value: { set: value },
      disabled: { set: disabled },
    };

    writeSelectStateValue(state as never, 'value');

    expect(value).toHaveBeenCalledWith('value');
    expect(value).toHaveBeenCalledTimes(1);
    expect(disabled).not.toHaveBeenCalled();
  });

  it('prefers select public disabled setter when present', () => {
    const setDisabled = vi.fn();
    const disabled = vi.fn();
    const state = {
      setDisabled,
      value: { set: vi.fn() },
      disabled: { set: disabled },
    };

    writeSelectStateDisabled(state as never, true);

    expect(setDisabled).toHaveBeenCalledWith(true);
    expect(disabled).not.toHaveBeenCalled();
  });

  it('writes select disabled through ng-primitives State<T> disabled.set fallback only', () => {
    const value = vi.fn();
    const disabled = vi.fn();
    const state = {
      value: { set: value },
      disabled: { set: disabled },
    };

    writeSelectStateDisabled(state as never, true);

    expect(disabled).toHaveBeenCalledWith(true);
    expect(disabled).toHaveBeenCalledTimes(1);
    expect(value).not.toHaveBeenCalled();
  });

  it('throws a version-bound error when select State<T> fallback shape is invalid', () => {
    expect(() => writeSelectStateValue({} as never, 'value')).toThrowError(/ng-primitives@0\.117\.2/);
    expect(() =>
      writeSelectStateValue({ value: { set: 'not-a-function' } as never, disabled: { set: vi.fn() } } as never, 'value'),
    ).toThrowError(/value\.set/);
    expect(() =>
      writeSelectStateDisabled({ value: { set: vi.fn() }, disabled: { set: 0 } as never } as never, true),
    ).toThrowError(/disabled\.set/);
  });

  it('writes combobox value through ng-primitives State<T> value.set fallback only', () => {
    const value = vi.fn();
    const disabled = vi.fn();
    const state = {
      value: { set: value },
      disabled: { set: disabled },
    };

    writeComboboxStateValue(state as never, { id: 123 });

    expect(value).toHaveBeenCalledWith({ id: 123 });
    expect(value).toHaveBeenCalledTimes(1);
    expect(disabled).not.toHaveBeenCalled();
  });

  it('writes combobox disabled through ng-primitives State<T> disabled.set fallback only', () => {
    const value = vi.fn();
    const disabled = vi.fn();
    const state = {
      value: { set: value },
      disabled: { set: disabled },
    };

    writeComboboxStateDisabled(state as never, false);

    expect(disabled).toHaveBeenCalledWith(false);
    expect(disabled).toHaveBeenCalledTimes(1);
    expect(value).not.toHaveBeenCalled();
  });

  it('throws a version-bound error when combobox State<T> fallback shape is invalid', () => {
    expect(() => writeComboboxStateDisabled({} as never, true)).toThrowError(/writeComboboxStateDisabled/);
    expect(() => writeComboboxStateDisabled({ value: { set: vi.fn() }, disabled: {} as never } as never, false)).toThrowError(
      /disabled\.set/,
    );
  });

  it('writes radio-group value through ng-primitives State<T> value.set fallback only', () => {
    const value = vi.fn();
    const disabled = vi.fn();
    const state = {
      value: { set: value },
      disabled: { set: disabled },
    };

    writeRadioGroupStateValue(state as never, 'radio-value');

    expect(value).toHaveBeenCalledWith('radio-value');
    expect(value).toHaveBeenCalledTimes(1);
    expect(disabled).not.toHaveBeenCalled();
  });

  it('writes radio-group disabled through ng-primitives State<T> disabled.set fallback only', () => {
    const value = vi.fn();
    const disabled = vi.fn();
    const state = {
      value: { set: value },
      disabled: { set: disabled },
    };

    writeRadioGroupStateDisabled(state as never, true);

    expect(disabled).toHaveBeenCalledWith(true);
    expect(disabled).toHaveBeenCalledTimes(1);
    expect(value).not.toHaveBeenCalled();
  });

  it('throws a version-bound error when radio-group State<T> fallback shape is invalid', () => {
    expect(() => writeRadioGroupStateValue({} as never, 'x')).toThrowError(/writeRadioGroupStateValue/);
    expect(() => writeRadioGroupStateDisabled({} as never, true)).toThrowError(/writeRadioGroupStateDisabled/);
    expect(() =>
      writeRadioGroupStateDisabled({ value: { set: vi.fn() }, disabled: { set: 1 } as never } as never, true),
    ).toThrowError(/disabled\.set/);
  });
});
