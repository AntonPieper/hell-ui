import { Component, Directive, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgpCombobox, injectComboboxState } from 'ng-primitives/combobox';
import { NgpRadioGroup, injectRadioGroupState } from 'ng-primitives/radio';
import { NgpRovingFocusGroup, injectRovingFocusGroupState } from 'ng-primitives/roving-focus';
import { NgpSelect, injectSelectState } from 'ng-primitives/select';

import { HELL_COMBOBOX_DIRECTIVES } from '../combobox/combobox';
import { HellRadio, HellRadioGroup } from '../radio/radio';
import { HELL_SELECT_DIRECTIVES } from '../select/select';
import {
  HELL_NGP_STATE_WRITER_UPGRADE_PATH,
  HELL_NGP_STATE_WRITER_VERSION,
  writeComboboxStateDisabled,
  writeComboboxStateValue,
  writeRadioGroupStateDisabled,
  writeRadioGroupStateValue,
  writeRovingFocusActiveItem,
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

@Directive({
  selector: '[hellRovingFocusGroupStateProbe]',
  hostDirectives: [NgpRovingFocusGroup],
})
class RovingFocusGroupStateProbe {
  readonly state = injectRovingFocusGroupState();
}

@Component({
  imports: [RovingFocusGroupStateProbe],
  template: `<div hellRovingFocusGroupStateProbe></div>`,
})
class RovingFocusGroupStateProbeHost {}

@Directive({
  selector: '[hellSelectCvaStateProbe]',
})
class SelectCvaStateProbe {
  readonly state = injectSelectState<NgpSelect>();
}

@Component({
  imports: [ReactiveFormsModule, SelectCvaStateProbe, ...HELL_SELECT_DIRECTIVES],
  template: `
    <button
      hellSelect
      hellSelectCvaStateProbe
      type="button"
      [formControl]="control"
      (valueChange)="values.push($any($event))"
    >
      <span hellSelectValue>Selection</span>
      <div *hellSelectPortal hellSelectDropdown>
        <div hellSelectOption value="low">Low</div>
        <div hellSelectOption value="high">High</div>
      </div>
    </button>
  `,
})
class SelectCvaContractHost {
  readonly control = new FormControl<string | null>(null);
  readonly values: Array<string | null> = [];
}

@Directive({
  selector: '[hellComboboxCvaStateProbe]',
})
class ComboboxCvaStateProbe {
  readonly state = injectComboboxState<NgpCombobox>();
}

@Component({
  imports: [ReactiveFormsModule, ComboboxCvaStateProbe, ...HELL_COMBOBOX_DIRECTIVES],
  template: `
    <div
      hellCombobox
      hellComboboxCvaStateProbe
      [formControl]="control"
      (valueChange)="values.push($any($event))"
    >
      <input hellComboboxInput aria-label="Assignee" />
      <button hellComboboxButton type="button">Toggle</button>
      <div *hellComboboxPortal hellComboboxDropdown>
        <div hellComboboxOption value="atlas">Atlas</div>
        <div hellComboboxOption value="nova">Nova</div>
      </div>
    </div>
  `,
})
class ComboboxCvaContractHost {
  readonly control = new FormControl<string | null>(null);
  readonly values: Array<string | null> = [];
}

@Directive({
  selector: '[hellRadioGroupCvaStateProbe]',
})
class RadioGroupCvaStateProbe {
  readonly state = injectRadioGroupState<string>();
}

@Component({
  imports: [ReactiveFormsModule, RadioGroupCvaStateProbe, HellRadioGroup, HellRadio],
  template: `
    <div
      hellRadioGroup
      hellRadioGroupCvaStateProbe
      [formControl]="control"
      orientation="horizontal"
      (valueChange)="values.push($any($event))"
    >
      <button hellRadio type="button" value="a">A</button>
      <button hellRadio type="button" value="b">B</button>
    </div>
  `,
})
class RadioGroupCvaContractHost {
  readonly control = new FormControl<string | null>(null);
  readonly values: Array<string | null> = [];
}

function writableValueChannel<T>(state: { value: unknown }): WritableSignalLike<T> {
  const value = state.value;
  if (typeof value !== 'function' || typeof (value as { set?: unknown }).set !== 'function') {
    throw new Error('Expected public ng-primitives state.value writable signal.');
  }
  return value as WritableSignalLike<T>;
}

function writableDisabledChannel(state: { disabled: unknown }): WritableSignalLike<boolean> {
  const disabled = state.disabled;
  if (typeof disabled !== 'function' || typeof (disabled as { set?: unknown }).set !== 'function') {
    throw new Error('Expected public ng-primitives state.disabled writable signal.');
  }
  return disabled as WritableSignalLike<boolean>;
}

function writableActiveItemChannel(state: {
  activeItem: unknown;
}): WritableSignalLike<string | null> {
  const activeItem = state.activeItem;
  if (
    typeof activeItem !== 'function' ||
    typeof (activeItem as { set?: unknown }).set !== 'function'
  ) {
    throw new Error('Expected public ng-primitives state.activeItem writable signal.');
  }
  return activeItem as WritableSignalLike<string | null>;
}

function probe<T>(host: Type<unknown>, directive: Type<T>): T {
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  return fixture.debugElement.query(By.directive(directive)).injector.get(directive);
}

function getDirective<T>(fixture: ComponentFixture<unknown>, directive: Type<T>): T {
  return fixture.debugElement.query(By.directive(directive)).injector.get(directive);
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

function expectAdapterError(fn: () => void, operation: string, detail: RegExp): void {
  let message: string | undefined;

  try {
    fn();
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }

  expect(message).toBeDefined();
  expect(message).toContain(HELL_NGP_STATE_WRITER_VERSION);
  expect(message).toContain(HELL_NGP_STATE_WRITER_UPGRADE_PATH);
  expect(message).toContain(operation);
  expect(message).toMatch(detail);
}

describe('ngp form-state compatibility helpers', () => {
  it('documents the installed ng-primitives version and upgrade/removal path this form-state adapter targets', () => {
    expect(HELL_NGP_STATE_WRITER_VERSION).toBe('ng-primitives@0.117.2');
    expect(HELL_NGP_STATE_WRITER_UPGRADE_PATH).toContain('docs/adr/ng-primitives-state-adapter.md');
    expect(HELL_NGP_STATE_WRITER_UPGRADE_PATH).toContain('public value+disabled setters');
  });

  describe('installed ng-primitives public typed State<T> channel drift', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [
          SelectStateProbeHost,
          ComboboxStateProbeHost,
          RadioGroupStateProbeHost,
          RovingFocusGroupStateProbeHost,
        ],
      }).compileComponents();
    });

    it('writes select CVA updates through public typed State<T> channels', () => {
      const state = probe(SelectStateProbeHost, SelectStateProbe).state();
      const value = writableValueChannel<unknown>(state);
      const disabled = writableDisabledChannel(state);

      writeSelectStateValue(state, 'from-public-state');
      writeSelectStateDisabled(state, true);

      expect(value()).toBe('from-public-state');
      expect(disabled()).toBe(true);
    });

    it('writes combobox CVA updates through public typed State<T> channels', () => {
      const state = probe(ComboboxStateProbeHost, ComboboxStateProbe).state();
      const value = writableValueChannel<unknown>(state);
      const disabled = writableDisabledChannel(state);

      writeComboboxStateValue(state, 'from-public-state');
      writeComboboxStateDisabled(state, true);

      expect(value()).toBe('from-public-state');
      expect(disabled()).toBe(true);
    });

    it('writes radio-group CVA updates through public typed State<T> channels', () => {
      const state = probe(RadioGroupStateProbeHost, RadioGroupStateProbe).state();
      const value = writableValueChannel<string | null>(state);
      const disabled = writableDisabledChannel(state);

      writeRadioGroupStateValue(state, 'from-public-state');
      writeRadioGroupStateDisabled(state, true);

      expect(value()).toBe('from-public-state');
      expect(disabled()).toBe(true);
    });

    it('writes roving-focus active item through the public typed State<T> channel', () => {
      const state = probe(RovingFocusGroupStateProbeHost, RovingFocusGroupStateProbe).state();
      const activeItem = writableActiveItemChannel(state);

      writeRovingFocusActiveItem(state, 'from-public-state');

      expect(activeItem()).toBe('from-public-state');
    });
  });

  describe('Hell CVA contract through the adapter seam', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SelectCvaContractHost, ComboboxCvaContractHost, RadioGroupCvaContractHost],
      }).compileComponents();
    });

    it('syncs select CVA value and disabled writes into ng-primitives state', async () => {
      const fixture = TestBed.createComponent(SelectCvaContractHost);
      await settle(fixture);

      const host = fixture.componentInstance;
      const state = getDirective(fixture, SelectCvaStateProbe).state;
      const root = fixture.nativeElement as HTMLElement;
      const select = root.querySelector<HTMLButtonElement>('button[hellSelect]');

      host.control.setValue('high');
      await settle(fixture);

      expect(state().value()).toBe('high');
      expect(host.values).toEqual([]);

      host.control.disable();
      await settle(fixture);

      expect(state().disabled()).toBe(true);
      expect(select?.getAttribute('data-disabled')).toBe('');
      expect(select?.tabIndex).toBe(-1);
    });

    it('syncs combobox CVA value and disabled writes into ng-primitives state', async () => {
      const fixture = TestBed.createComponent(ComboboxCvaContractHost);
      await settle(fixture);

      const host = fixture.componentInstance;
      const state = getDirective(fixture, ComboboxCvaStateProbe).state;
      const root = fixture.nativeElement as HTMLElement;
      const combobox = root.querySelector<HTMLElement>('[hellCombobox]');

      host.control.setValue('nova');
      await settle(fixture);

      expect(state().value()).toBe('nova');
      expect(host.values).toEqual([]);

      host.control.disable();
      await settle(fixture);

      expect(state().disabled()).toBe(true);
      expect(combobox?.getAttribute('data-disabled')).toBe('');
      expect(combobox?.tabIndex).toBe(-1);
    });

    it('syncs radio CVA value and disabled writes into ng-primitives state', async () => {
      const fixture = TestBed.createComponent(RadioGroupCvaContractHost);
      await settle(fixture);

      const host = fixture.componentInstance;
      const state = getDirective(fixture, RadioGroupCvaStateProbe).state;
      const root = fixture.nativeElement as HTMLElement;
      const radios = root.querySelectorAll<HTMLButtonElement>('button[hellRadio]');

      host.control.setValue('b');
      await settle(fixture);

      expect(state().value()).toBe('b');
      expect(radios[0].getAttribute('aria-checked')).toBe('false');
      expect(radios[1].getAttribute('aria-checked')).toBe('true');
      expect(host.values).toEqual([]);

      host.control.disable();
      await settle(fixture);

      expect(state().disabled()).toBe(true);
      expect(radios[0].disabled).toBe(true);
      expect(radios[1].disabled).toBe(true);
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

  it('prefers combobox public value setter when present', () => {
    const setValue = vi.fn();
    const value = vi.fn();
    const state = {
      setValue,
      value: { set: value },
      disabled: { set: vi.fn() },
    };

    writeComboboxStateValue(state as never, 'value');

    expect(setValue).toHaveBeenCalledWith('value', { emit: false });
    expect(value).not.toHaveBeenCalled();
  });

  it('prefers radio-group public value setter when present', () => {
    const setValue = vi.fn();
    const value = vi.fn();
    const state = {
      setValue,
      value: { set: value },
      disabled: { set: vi.fn() },
    };

    writeRadioGroupStateValue(state as never, 'value');

    expect(setValue).toHaveBeenCalledWith('value', { emit: false });
    expect(value).not.toHaveBeenCalled();
  });

  it('falls back to select typed ng-primitives State<T>.value channel', () => {
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

  it('prefers combobox public disabled setter when present', () => {
    const setDisabled = vi.fn();
    const disabled = vi.fn();
    const state = {
      setDisabled,
      value: { set: vi.fn() },
      disabled: { set: disabled },
    };

    writeComboboxStateDisabled(state as never, true);

    expect(setDisabled).toHaveBeenCalledWith(true);
    expect(disabled).not.toHaveBeenCalled();
  });

  it('prefers radio-group public disabled setter when present', () => {
    const setDisabled = vi.fn();
    const disabled = vi.fn();
    const state = {
      setDisabled,
      value: { set: vi.fn() },
      disabled: { set: disabled },
    };

    writeRadioGroupStateDisabled(state as never, true);

    expect(setDisabled).toHaveBeenCalledWith(true);
    expect(disabled).not.toHaveBeenCalled();
  });

  it('falls back to select typed ng-primitives State<T>.disabled channel', () => {
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

  it('throws version-bound errors with affected operation when select State<T> channel shape is invalid', () => {
    expectAdapterError(
      () => writeSelectStateValue({} as never, 'value'),
      'writeSelectStateValue',
      /value\.set/,
    );
    expectAdapterError(
      () =>
        writeSelectStateValue(
          { value: { set: 'not-a-function' } as never, disabled: { set: vi.fn() } } as never,
          'value',
        ),
      'writeSelectStateValue',
      /value\.set/,
    );
    expectAdapterError(
      () =>
        writeSelectStateDisabled(
          { value: { set: vi.fn() }, disabled: { set: 0 } as never } as never,
          true,
        ),
      'writeSelectStateDisabled',
      /disabled\.set/,
    );
  });

  it('falls back to combobox typed ng-primitives State<T>.value channel', () => {
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

  it('falls back to combobox typed ng-primitives State<T>.disabled channel', () => {
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

  it('throws version-bound errors with affected operation when combobox State<T> channel shape is invalid', () => {
    expectAdapterError(
      () => writeComboboxStateValue({} as never, 'x'),
      'writeComboboxStateValue',
      /value\.set/,
    );
    expectAdapterError(
      () => writeComboboxStateDisabled({} as never, true),
      'writeComboboxStateDisabled',
      /disabled\.set/,
    );
    expectAdapterError(
      () =>
        writeComboboxStateDisabled(
          { value: { set: vi.fn() }, disabled: {} as never } as never,
          false,
        ),
      'writeComboboxStateDisabled',
      /disabled\.set/,
    );
  });

  it('falls back to radio-group typed ng-primitives State<T>.value channel', () => {
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

  it('falls back to radio-group typed ng-primitives State<T>.disabled channel', () => {
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

  it('throws version-bound errors with affected operation when radio-group State<T> channel shape is invalid', () => {
    expectAdapterError(
      () => writeRadioGroupStateValue({} as never, 'x'),
      'writeRadioGroupStateValue',
      /value\.set/,
    );
    expectAdapterError(
      () => writeRadioGroupStateDisabled({} as never, true),
      'writeRadioGroupStateDisabled',
      /disabled\.set/,
    );
    expectAdapterError(
      () =>
        writeRadioGroupStateDisabled(
          { value: { set: vi.fn() }, disabled: { set: 1 } as never } as never,
          true,
        ),
      'writeRadioGroupStateDisabled',
      /disabled\.set/,
    );
  });

  it('throws version-bound errors with affected operation when roving-focus activeItem shape is invalid', () => {
    expectAdapterError(
      () => writeRovingFocusActiveItem({} as never, 'x'),
      'writeRovingFocusActiveItem',
      /activeItem\.set/,
    );
    expectAdapterError(
      () => writeRovingFocusActiveItem({ activeItem: { set: false } } as never, 'x'),
      'writeRovingFocusActiveItem',
      /activeItem\.set/,
    );
  });
});
