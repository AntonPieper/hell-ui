import { writeComboboxDisabled, writeComboboxValue, writeRadioGroupDisabled, writeRadioGroupValue, writeSelectDisabled, writeSelectValue, writeToggleGroupDisabled, writeToggleGroupValue } from './ngp-state-adapters';

describe('ngp-state adapter write helpers', () => {
  it('writes select value through value.set only', () => {
    const value = vi.fn();
    const disabled = vi.fn();
    const state = {
      value: { set: value },
      disabled: { set: disabled },
    };

    writeSelectValue(state, 'value');

    expect(value).toHaveBeenCalledWith('value');
    expect(value).toHaveBeenCalledTimes(1);
    expect(disabled).not.toHaveBeenCalled();
  });

  it('writes select disabled through disabled.set only', () => {
    const value = vi.fn();
    const disabled = vi.fn();
    const state = {
      value: { set: value },
      disabled: { set: disabled },
    };

    writeSelectDisabled(state, true);

    expect(disabled).toHaveBeenCalledWith(true);
    expect(disabled).toHaveBeenCalledTimes(1);
    expect(value).not.toHaveBeenCalled();
  });

  it('throws a descriptive error when select state shape is invalid', () => {
    expect(() => writeSelectValue({} as never, 'value')).toThrowError(/writeSelectValue/);
    expect(() =>
      writeSelectValue({ value: { set: 'not-a-function' } as never, disabled: { set: vi.fn() } } as never, 'value'),
    ).toThrowError(/value\.set/);
    expect(() =>
      writeSelectDisabled({ value: { set: vi.fn() }, disabled: { set: 0 } as never } as never, true),
    ).toThrowError(/disabled\.set/);
  });

  it('writes combobox value through value.set only', () => {
    const value = vi.fn();
    const disabled = vi.fn();
    const state = {
      value: { set: value },
      disabled: { set: disabled },
    };

    writeComboboxValue(state, { id: 123 });

    expect(value).toHaveBeenCalledWith({ id: 123 });
    expect(value).toHaveBeenCalledTimes(1);
    expect(disabled).not.toHaveBeenCalled();
  });

  it('writes combobox disabled through disabled.set only', () => {
    const value = vi.fn();
    const disabled = vi.fn();
    const state = {
      value: { set: value },
      disabled: { set: disabled },
    };

    writeComboboxDisabled(state, false);

    expect(disabled).toHaveBeenCalledWith(false);
    expect(disabled).toHaveBeenCalledTimes(1);
    expect(value).not.toHaveBeenCalled();
  });

  it('throws a descriptive error when combobox state shape is invalid', () => {
    expect(() => writeComboboxDisabled({} as never, true)).toThrowError(/writeComboboxDisabled/);
    expect(() => writeComboboxDisabled({ value: { set: vi.fn() }, disabled: {} as never } as never, false)).toThrowError(
      /disabled\.set/,
    );
  });

  it('writes radio-group value through value.set only', () => {
    const value = vi.fn();
    const disabled = vi.fn();
    const state = {
      value: { set: value },
      disabled: { set: disabled },
    };

    writeRadioGroupValue(state, 'radio-value');

    expect(value).toHaveBeenCalledWith('radio-value');
    expect(value).toHaveBeenCalledTimes(1);
    expect(disabled).not.toHaveBeenCalled();
  });

  it('writes radio-group disabled through disabled.set only', () => {
    const value = vi.fn();
    const disabled = vi.fn();
    const state = {
      value: { set: value },
      disabled: { set: disabled },
    };

    writeRadioGroupDisabled(state, true);

    expect(disabled).toHaveBeenCalledWith(true);
    expect(disabled).toHaveBeenCalledTimes(1);
    expect(value).not.toHaveBeenCalled();
  });

  it('throws a descriptive error when radio-group state shape is invalid', () => {
    expect(() => writeRadioGroupValue({} as never, 'x')).toThrowError(/writeRadioGroupValue/);
    expect(() => writeRadioGroupDisabled({} as never, true)).toThrowError(/writeRadioGroupDisabled/);
    expect(() =>
      writeRadioGroupDisabled({ value: { set: vi.fn() }, disabled: { set: 1 } as never } as never, true),
    ).toThrowError(/disabled\.set/);
  });

  it('writes toggle-group value with copied value and default emit=true', () => {
    const setValue = vi.fn();
    const setDisabled = vi.fn();
    const state = {
      setValue,
      setDisabled,
    };
    const next = ['a', 'b'];

    writeToggleGroupValue(state, next);

    expect(setValue).toHaveBeenCalledTimes(1);
    const [writtenValue, options] = setValue.mock.calls.at(0) ?? [];

    expect(writtenValue).toEqual(['a', 'b']);
    expect(writtenValue).not.toBe(next);
    expect(options).toEqual({ emit: true });
    expect(setDisabled).not.toHaveBeenCalled();
  });

  it('writes toggle-group value with explicit emit=false when provided', () => {
    const setValue = vi.fn();
    const setDisabled = vi.fn();
    const state = {
      setValue,
      setDisabled,
    };

    writeToggleGroupValue(state, ['single'], false);

    expect(setValue).toHaveBeenCalledWith(['single'], { emit: false });
    expect(setDisabled).not.toHaveBeenCalled();
  });

  it('writes toggle-group disabled through setDisabled only', () => {
    const setValue = vi.fn();
    const setDisabled = vi.fn();
    const state = {
      setValue,
      setDisabled,
    };

    writeToggleGroupDisabled(state, false);

    expect(setDisabled).toHaveBeenCalledWith(false);
    expect(setDisabled).toHaveBeenCalledTimes(1);
    expect(setValue).not.toHaveBeenCalled();
  });

  it('throws a descriptive error when toggle-group state shape is invalid', () => {
    expect(() => writeToggleGroupValue({ setValue: 'nope', setDisabled: vi.fn() } as never, ['a'])).toThrowError(
      /setValue/,
    );
    expect(() => writeToggleGroupDisabled({} as never, true)).toThrowError(/writeToggleGroupDisabled/);
    expect(() =>
      writeToggleGroupDisabled({ setValue: vi.fn(), setDisabled: {} as never } as never, true),
    ).toThrowError(/setDisabled/);
  });
});
