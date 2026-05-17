import {
  HELL_NGP_PRIVATE_STATE_BRIDGE_VERSION,
  writeComboboxPrivateDisabled,
  writeComboboxPrivateValue,
  writeRadioGroupPrivateDisabled,
  writeRadioGroupPrivateValue,
  writeSelectPrivateDisabled,
  writeSelectPrivateValue,
} from './ngp-state-adapters';

describe('ngp private-state compatibility bridge helpers', () => {
  it('documents the installed ng-primitives version this private bridge targets', () => {
    expect(HELL_NGP_PRIVATE_STATE_BRIDGE_VERSION).toBe('ng-primitives@0.117.2');
  });

  it('writes select value through ng-primitives private value.set only', () => {
    const value = vi.fn();
    const disabled = vi.fn();
    const state = {
      value: { set: value },
      disabled: { set: disabled },
    };

    writeSelectPrivateValue(state, 'value');

    expect(value).toHaveBeenCalledWith('value');
    expect(value).toHaveBeenCalledTimes(1);
    expect(disabled).not.toHaveBeenCalled();
  });

  it('writes select disabled through ng-primitives private disabled.set only', () => {
    const value = vi.fn();
    const disabled = vi.fn();
    const state = {
      value: { set: value },
      disabled: { set: disabled },
    };

    writeSelectPrivateDisabled(state, true);

    expect(disabled).toHaveBeenCalledWith(true);
    expect(disabled).toHaveBeenCalledTimes(1);
    expect(value).not.toHaveBeenCalled();
  });

  it('throws a version-bound error when select private state shape is invalid', () => {
    expect(() => writeSelectPrivateValue({} as never, 'value')).toThrowError(/ng-primitives@0\.117\.2/);
    expect(() =>
      writeSelectPrivateValue({ value: { set: 'not-a-function' } as never, disabled: { set: vi.fn() } } as never, 'value'),
    ).toThrowError(/value\.set/);
    expect(() =>
      writeSelectPrivateDisabled({ value: { set: vi.fn() }, disabled: { set: 0 } as never } as never, true),
    ).toThrowError(/disabled\.set/);
  });

  it('writes combobox value through ng-primitives private value.set only', () => {
    const value = vi.fn();
    const disabled = vi.fn();
    const state = {
      value: { set: value },
      disabled: { set: disabled },
    };

    writeComboboxPrivateValue(state, { id: 123 });

    expect(value).toHaveBeenCalledWith({ id: 123 });
    expect(value).toHaveBeenCalledTimes(1);
    expect(disabled).not.toHaveBeenCalled();
  });

  it('writes combobox disabled through ng-primitives private disabled.set only', () => {
    const value = vi.fn();
    const disabled = vi.fn();
    const state = {
      value: { set: value },
      disabled: { set: disabled },
    };

    writeComboboxPrivateDisabled(state, false);

    expect(disabled).toHaveBeenCalledWith(false);
    expect(disabled).toHaveBeenCalledTimes(1);
    expect(value).not.toHaveBeenCalled();
  });

  it('throws a version-bound error when combobox private state shape is invalid', () => {
    expect(() => writeComboboxPrivateDisabled({} as never, true)).toThrowError(/writeComboboxPrivateDisabled/);
    expect(() => writeComboboxPrivateDisabled({ value: { set: vi.fn() }, disabled: {} as never } as never, false)).toThrowError(
      /disabled\.set/,
    );
  });

  it('writes radio-group value through ng-primitives private value.set only', () => {
    const value = vi.fn();
    const disabled = vi.fn();
    const state = {
      value: { set: value },
      disabled: { set: disabled },
    };

    writeRadioGroupPrivateValue(state, 'radio-value');

    expect(value).toHaveBeenCalledWith('radio-value');
    expect(value).toHaveBeenCalledTimes(1);
    expect(disabled).not.toHaveBeenCalled();
  });

  it('writes radio-group disabled through ng-primitives private disabled.set only', () => {
    const value = vi.fn();
    const disabled = vi.fn();
    const state = {
      value: { set: value },
      disabled: { set: disabled },
    };

    writeRadioGroupPrivateDisabled(state, true);

    expect(disabled).toHaveBeenCalledWith(true);
    expect(disabled).toHaveBeenCalledTimes(1);
    expect(value).not.toHaveBeenCalled();
  });

  it('throws a version-bound error when radio-group private state shape is invalid', () => {
    expect(() => writeRadioGroupPrivateValue({} as never, 'x')).toThrowError(/writeRadioGroupPrivateValue/);
    expect(() => writeRadioGroupPrivateDisabled({} as never, true)).toThrowError(/writeRadioGroupPrivateDisabled/);
    expect(() =>
      writeRadioGroupPrivateDisabled({ value: { set: vi.fn() }, disabled: { set: 1 } as never } as never, true),
    ).toThrowError(/disabled\.set/);
  });
});
