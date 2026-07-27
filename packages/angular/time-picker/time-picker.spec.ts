import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHellLabels } from 'hell-ui/core';

import {
  HellTimePicker,
  HELL_TIME_PICKER_LABELS,
  type HellTimePickerPart,
  type HellTimePickerUi,
  type HellTimeValue,
} from './time-picker';
import { expectUiRouting } from '../spec-helpers';

@Component({
  imports: [HellTimePicker],
  template: `
    <hell-time-picker
      [value]="value()"
      [seconds]="seconds()"
      [disabled]="disabled()"
      [min]="min()"
      [max]="max()"
      [minuteStep]="minuteStep()"
      [secondStep]="secondStep()"
      [ui]="ui()"
      (valueChange)="onValueChange($event)"
    />
  `,
})
class TimePickerHost {
  readonly value = signal<HellTimeValue | null>(null);
  readonly seconds = signal(false);
  readonly disabled = signal(false);
  readonly min = signal<HellTimeValue | undefined>(undefined);
  readonly max = signal<HellTimeValue | undefined>(undefined);
  readonly minuteStep = signal(1);
  readonly secondStep = signal(1);
  readonly ui = signal<string | HellTimePickerUi | undefined>(undefined);
  readonly values: Array<HellTimeValue | null> = [];

  onValueChange(value: HellTimeValue | null): void {
    this.values.push(value);
    this.value.set(value);
  }
}

@Component({
  imports: [HellTimePicker],
  providers: [
    provideHellLabels(HELL_TIME_PICKER_LABELS, {
      hours: 'Stunden',
      minutes: 'Minuten',
      seconds: 'Sekunden',
      selectedTime: (time) => `Gewählte Zeit ${time}`,
      noTimeSelected: 'Keine Zeit gewählt',
    }),
  ],
  template: `<hell-time-picker seconds [value]="value()" />`,
})
class LocalizedTimePickerHost {
  readonly value = signal<HellTimeValue | null>({ hour: 8, minute: 15, second: 30 });
}

describe('HellTimePicker', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimePickerHost, LocalizedTimePickerHost],
    }).compileComponents();
  });

  afterEach(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body) active.blur();
    document.body.replaceChildren();
  });

  describe('columns and value semantics', () => {
    it('renders one column per visible unit with the whole unit domain', () => {
      const fixture = render();

      expect(units(fixture)).toEqual(['hour', 'minute']);
      expect(optionValues(fixture, 'hour')).toHaveLength(24);
      expect(optionValues(fixture, 'minute')).toHaveLength(60);
      expect(optionValues(fixture, 'hour').slice(0, 3)).toEqual(['00', '01', '02']);
    });

    it('renders null as no selection with a placeholder readout', () => {
      const fixture = render();

      expect(readout(fixture).textContent?.trim()).toBe('--:--');
      expect(readout(fixture).getAttribute('aria-hidden')).toBe('true');
      expect(root(fixture).getAttribute('aria-label')).toBe('No time selected');
      expect(
        root(fixture).querySelectorAll('[data-slot="option"][data-selected="true"]'),
      ).toHaveLength(0);
      expect(fixture.componentInstance.values).toEqual([]);
    });

    it('names the root group from the committed value and hides the readout', () => {
      const fixture = render({ value: { hour: 14, minute: 30, second: 0 } });

      expect(root(fixture).getAttribute('role')).toBe('group');
      expect(root(fixture).getAttribute('aria-label')).toBe('Selected time 14:30');
      expect(readout(fixture).textContent?.trim()).toBe('14:30');
      // The name lives on the root only, so the value announces exactly once.
      expect(readout(fixture).getAttribute('aria-label')).toBeNull();
    });

    it('shows the seconds column and its placeholder only when requested', () => {
      const fixture = render({ value: { hour: 10, minute: 20, second: 56 } });
      expect(units(fixture)).toEqual(['hour', 'minute']);
      expect(readout(fixture).textContent?.trim()).toBe('10:20');

      fixture.componentInstance.seconds.set(true);
      fixture.detectChanges();
      expect(units(fixture)).toEqual(['hour', 'minute', 'second']);
      expect(readout(fixture).textContent?.trim()).toBe('10:20:56');
      expect(selected(fixture, 'second')).toBe('56');

      fixture.componentInstance.value.set(null);
      fixture.detectChanges();
      expect(readout(fixture).textContent?.trim()).toBe('--:--:--');
    });

    it('renders one option per step', () => {
      const fixture = render({ minuteStep: 15, secondStep: 30, seconds: true });

      expect(optionValues(fixture, 'minute')).toEqual(['00', '15', '30', '45']);
      expect(optionValues(fixture, 'second')).toEqual(['00', '30']);
      expect(optionValues(fixture, 'hour')).toHaveLength(24);
    });

    it('renders an off-step committed value from an external write only', () => {
      const fixture = render({ minuteStep: 15, value: { hour: 9, minute: 37, second: 0 } });
      expect(optionValues(fixture, 'minute')).toEqual(['00', '15', '30', '37', '45']);
      expect(selected(fixture, 'minute')).toBe('37');

      // Choosing an on-step option drops the external off-step option again.
      option(fixture, 'minute', '45').click();
      fixture.detectChanges();
      expect(optionValues(fixture, 'minute')).toEqual(['00', '15', '30', '45']);
    });

    it('throws for an invalid step in dev mode', () => {
      const fixture = TestBed.createComponent(TimePickerHost);
      fixture.componentInstance.minuteStep.set(7);
      expect(() => fixture.detectChanges()).toThrowError(/minuteStep/);
    });
  });

  describe('activation and commits', () => {
    it('commits a tapped option and emits once per activation', () => {
      const fixture = render({ value: { hour: 8, minute: 30, second: 0 } });

      option(fixture, 'hour', '11').click();
      fixture.detectChanges();

      expect(fixture.componentInstance.value()).toEqual({ hour: 11, minute: 30, second: 0 });
      expect(fixture.componentInstance.values).toEqual([{ hour: 11, minute: 30, second: 0 }]);
      expect(selected(fixture, 'hour')).toBe('11');
      expect(option(fixture, 'hour', '11').getAttribute('aria-selected')).toBe('true');
    });

    it('commits a complete value on the first activation of an empty picker', () => {
      const fixture = render();

      option(fixture, 'minute', '30').click();
      fixture.detectChanges();

      expect(fixture.componentInstance.values).toEqual([{ hour: 0, minute: 30, second: 0 }]);
    });

    it('zeroes hidden seconds on the next commit', () => {
      const fixture = render({ value: { hour: 10, minute: 20, second: 56 } });

      option(fixture, 'minute', '21').click();
      fixture.detectChanges();

      expect(fixture.componentInstance.value()).toEqual({ hour: 10, minute: 21, second: 0 });
    });

    it('syncs external writes without emitting', () => {
      const fixture = render({ value: { hour: 8, minute: 30, second: 0 } });

      fixture.componentInstance.value.set({ hour: 17, minute: 45, second: 0 });
      fixture.detectChanges();

      expect(selected(fixture, 'hour')).toBe('17');
      expect(selected(fixture, 'minute')).toBe('45');
      expect(fixture.componentInstance.values).toEqual([]);
    });
  });

  describe('bounds', () => {
    it('disables options that cannot participate in any in-range value', () => {
      const fixture = render({ min: { hour: 9, minute: 0, second: 0 } });

      expect(isOptionDisabled(fixture, 'hour', '08')).toBe(true);
      expect(isOptionDisabled(fixture, 'hour', '09')).toBe(false);
      // Every minute survives, because some in-range hour pairs with it.
      expect(isOptionDisabled(fixture, 'minute', '00')).toBe(false);
    });

    it('makes disabled options inert to pointer activation', () => {
      const fixture = render({ min: { hour: 9, minute: 0, second: 0 } });

      option(fixture, 'hour', '08').click();
      fixture.detectChanges();

      expect(fixture.componentInstance.values).toEqual([]);
    });

    it('commits the earliest in-range value when a null picker is first used', () => {
      // The spec's worked example: min 09:00, activating minute 30 commits
      // 09:30 rather than an out-of-range 00:30.
      const fixture = render({ min: { hour: 9, minute: 0, second: 0 } });

      option(fixture, 'minute', '30').click();
      fixture.detectChanges();

      expect(fixture.componentInstance.values).toEqual([{ hour: 9, minute: 30, second: 0 }]);
    });

    it('repairs an activation that would leave the bounds', () => {
      const fixture = render({
        min: { hour: 9, minute: 30, second: 0 },
        value: { hour: 10, minute: 0, second: 0 },
      });

      // Hour 9 is offered because 09:30 is in range, so activating it keeps
      // the chosen hour and lifts the minute to the earliest in-range value.
      option(fixture, 'hour', '09').click();
      fixture.detectChanges();

      expect(fixture.componentInstance.value()).toEqual({ hour: 9, minute: 30, second: 0 });
    });

    it('never lets picker interaction create an off-step value', () => {
      const fixture = render({ minuteStep: 15, min: { hour: 9, minute: 10, second: 0 } });

      option(fixture, 'hour', '09').click();
      fixture.detectChanges();

      expect(fixture.componentInstance.values).toEqual([{ hour: 9, minute: 15, second: 0 }]);
    });
  });

  describe('keyboard', () => {
    it('keeps exactly one tab stop per column', () => {
      const fixture = render({ value: { hour: 8, minute: 30, second: 0 } });

      for (const unit of ['hour', 'minute'] as const) {
        const stops = options(fixture, unit).filter(
          (element) => element.getAttribute('tabindex') === '0',
        );
        expect(stops, unit).toHaveLength(1);
      }
      // The tab stop is the selected option.
      expect(option(fixture, 'hour', '08').getAttribute('tabindex')).toBe('0');
      expect(option(fixture, 'minute', '30').getAttribute('tabindex')).toBe('0');
    });

    it('parks the tab stop on the first enabled option while empty', () => {
      const fixture = render({ min: { hour: 9, minute: 0, second: 0 } });

      expect(option(fixture, 'hour', '00').getAttribute('tabindex')).toBe('-1');
      expect(option(fixture, 'hour', '09').getAttribute('tabindex')).toBe('0');
    });

    it('moves and commits with selection following focus', () => {
      const fixture = render({ value: { hour: 14, minute: 30, second: 0 } });

      press(fixture, 'hour', '14', 'ArrowDown');
      expect(fixture.componentInstance.value()).toEqual({ hour: 15, minute: 30, second: 0 });

      press(fixture, 'hour', '15', 'ArrowUp');
      expect(fixture.componentInstance.value()).toEqual({ hour: 14, minute: 30, second: 0 });
      expect(fixture.componentInstance.values).toHaveLength(2);
    });

    it('jumps with Home, End, and five-option paging', () => {
      const fixture = render({ value: { hour: 14, minute: 30, second: 0 } });

      press(fixture, 'minute', '30', 'PageDown');
      expect(fixture.componentInstance.value()).toEqual({ hour: 14, minute: 35, second: 0 });

      press(fixture, 'minute', '35', 'PageUp');
      expect(fixture.componentInstance.value()).toEqual({ hour: 14, minute: 30, second: 0 });

      press(fixture, 'minute', '30', 'Home');
      expect(fixture.componentInstance.value()).toEqual({ hour: 14, minute: 0, second: 0 });

      press(fixture, 'minute', '00', 'End');
      expect(fixture.componentInstance.value()).toEqual({ hour: 14, minute: 59, second: 0 });
    });

    it('pages by five options rather than five units on a stepped column', () => {
      const fixture = render({ minuteStep: 5, value: { hour: 14, minute: 0, second: 0 } });

      press(fixture, 'minute', '00', 'PageDown');
      expect(fixture.componentInstance.value()).toEqual({ hour: 14, minute: 25, second: 0 });
    });

    it('never wraps at either end of a column', () => {
      const fixture = render({ value: { hour: 23, minute: 59, second: 0 } });

      const atEnd = press(fixture, 'hour', '23', 'ArrowDown');
      expect(atEnd.defaultPrevented).toBe(true);
      expect(fixture.componentInstance.values).toEqual([]);

      press(fixture, 'hour', '23', 'Home');
      expect(fixture.componentInstance.value()).toEqual({ hour: 0, minute: 59, second: 0 });
      const atStart = press(fixture, 'hour', '00', 'ArrowUp');
      expect(atStart.defaultPrevented).toBe(true);
      expect(fixture.componentInstance.values).toHaveLength(1);
    });

    it('skips disabled options when traversing', () => {
      const fixture = render({
        min: { hour: 9, minute: 0, second: 0 },
        value: { hour: 9, minute: 0, second: 0 },
      });

      // 08 and everything below it is out of bounds, so Up cannot leave 09.
      const blocked = press(fixture, 'hour', '09', 'ArrowUp');
      expect(blocked.defaultPrevented).toBe(true);
      expect(fixture.componentInstance.values).toEqual([]);

      press(fixture, 'hour', '09', 'Home');
      expect(fixture.componentInstance.value()).toEqual({ hour: 9, minute: 0, second: 0 });
    });

    it('moves focus between columns with left and right arrows', () => {
      const fixture = render({ value: { hour: 8, minute: 30, second: 0 } });
      option(fixture, 'hour', '08').focus();

      press(fixture, 'hour', '08', 'ArrowRight');
      expect(document.activeElement).toBe(option(fixture, 'minute', '30'));
      // Focus movement alone never commits.
      expect(fixture.componentInstance.values).toEqual([]);

      press(fixture, 'minute', '30', 'ArrowLeft');
      expect(document.activeElement).toBe(option(fixture, 'hour', '08'));
    });

    it('leaves Enter and Space to the surrounding recipe', () => {
      const fixture = render({ value: { hour: 8, minute: 30, second: 0 } });

      for (const key of ['Enter', ' ']) {
        const event = press(fixture, 'hour', '08', key);
        expect(event.defaultPrevented, key).toBe(false);
      }
      expect(fixture.componentInstance.values).toEqual([]);
    });

    it('removes every option from the tab order when disabled', () => {
      const fixture = render({ value: { hour: 8, minute: 30, second: 0 }, disabled: true });

      expect(root(fixture).getAttribute('data-disabled')).toBe('true');
      expect(root(fixture).getAttribute('aria-disabled')).toBe('true');
      expect(
        options(fixture, 'hour').every((element) => element.getAttribute('tabindex') === '-1'),
      ).toBe(true);

      const event = press(fixture, 'hour', '08', 'ArrowDown');
      expect(event.defaultPrevented).toBe(false);
      option(fixture, 'hour', '11').click();
      fixture.detectChanges();
      expect(fixture.componentInstance.values).toEqual([]);
    });
  });

  describe('typed digits', () => {
    it('waits for the second digit, then commits once and auto-advances', () => {
      const fixture = render({ value: { hour: 0, minute: 0, second: 0 } });

      // A leading 1 could still become 10..19, so the entry stays open.
      type(fixture, 'hour', '00', '1');
      expect(fixture.componentInstance.values).toEqual([]);

      type(fixture, 'hour', '00', '4');
      expect(fixture.componentInstance.values).toEqual([{ hour: 14, minute: 0, second: 0 }]);
      expect(document.activeElement).toBe(option(fixture, 'minute', '00'));
    });

    it('completes immediately when no further digit could fit', () => {
      const fixture = render({ value: { hour: 0, minute: 0, second: 0 } });

      // 70 exceeds 23, so a leading 7 completes the hour at once.
      type(fixture, 'hour', '00', '7');
      expect(fixture.componentInstance.value()).toEqual({ hour: 7, minute: 0, second: 0 });
      expect(document.activeElement).toBe(option(fixture, 'minute', '00'));
    });

    it('snaps a buffered value to the nearest enabled option', () => {
      // The spec's worked example: with minuteStep 15, typing 3 then 7
      // selects 30 and never creates an off-step option.
      const fixture = render({ minuteStep: 15, value: { hour: 9, minute: 0, second: 0 } });

      type(fixture, 'minute', '00', '3');
      expect(fixture.componentInstance.values).toEqual([]);
      type(fixture, 'minute', '00', '7');
      expect(fixture.componentInstance.values).toEqual([{ hour: 9, minute: 30, second: 0 }]);
      expect(optionValues(fixture, 'minute')).toEqual(['00', '15', '30', '45']);
    });

    it('never snaps onto an out-of-bounds option', () => {
      const fixture = render({
        min: { hour: 9, minute: 0, second: 0 },
        value: { hour: 12, minute: 0, second: 0 },
      });

      // Hour 03 is out of bounds, so the nearest enabled option wins.
      type(fixture, 'hour', '12', '3');
      expect(fixture.componentInstance.value()).toEqual({ hour: 9, minute: 0, second: 0 });
    });

    it('commits a complete value when digits start an empty picker', () => {
      const fixture = render();

      // 70 exceeds 59, so a leading 7 is a complete minute on its own.
      type(fixture, 'minute', '00', '7');
      expect(fixture.componentInstance.values).toEqual([{ hour: 0, minute: 7, second: 0 }]);
    });

    it('drops an incomplete entry when the column changes', () => {
      const fixture = render({ value: { hour: 0, minute: 0, second: 0 } });

      type(fixture, 'hour', '00', '1');
      press(fixture, 'hour', '00', 'ArrowRight');
      // The pending 1 is gone, so 4 starts a fresh minute entry.
      type(fixture, 'minute', '00', '4');
      type(fixture, 'minute', '00', '5');

      expect(fixture.componentInstance.values).toEqual([{ hour: 0, minute: 45, second: 0 }]);
    });
  });

  describe('accessibility semantics', () => {
    it('labels each column listbox and exposes option state', () => {
      const fixture = render({ value: { hour: 8, minute: 30, second: 0 } });

      const list = listbox(fixture, 'minute');
      expect(list.getAttribute('role')).toBe('listbox');
      const labelId = list.getAttribute('aria-labelledby');
      expect(labelId).toBeTruthy();
      expect(document.getElementById(labelId ?? '')?.textContent?.trim()).toBe('Minutes');

      const chosen = option(fixture, 'minute', '30');
      expect(chosen.getAttribute('role')).toBe('option');
      expect(chosen.getAttribute('aria-selected')).toBe('true');
      expect(chosen.getAttribute('data-selected')).toBe('true');
      expect(chosen.textContent?.trim()).toBe('30');
      expect(option(fixture, 'minute', '31').getAttribute('aria-selected')).toBe('false');
    });

    it('marks out-of-bounds options disabled for assistive technology', () => {
      const fixture = render({ min: { hour: 9, minute: 0, second: 0 } });

      const blocked = option(fixture, 'hour', '08');
      expect(blocked.getAttribute('aria-disabled')).toBe('true');
      expect(blocked.getAttribute('data-disabled')).toBe('true');
      expect(option(fixture, 'hour', '09').getAttribute('aria-disabled')).toBeNull();
    });

    it('uses scoped label overrides for every accessibility label field', () => {
      const fixture = TestBed.createComponent(LocalizedTimePickerHost);
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;

      expect(columnLabels(host)).toEqual(['Stunden', 'Minuten', 'Sekunden']);
      expect(
        host.querySelector('[data-slot="root"]')?.getAttribute('aria-label'),
      ).toBe('Gewählte Zeit 08:15:30');

      fixture.componentInstance.value.set(null);
      fixture.detectChanges();
      expect(
        host.querySelector('[data-slot="root"]')?.getAttribute('aria-label'),
      ).toBe('Keine Zeit gewählt');
    });
  });

  describe('styling', () => {
    it('renders every public part and merges ui refinements deterministically', () => {
      const fixture = render();
      const defaults = {
        root: part(fixture.nativeElement, 'root').className,
        readout: part(fixture.nativeElement, 'readout').className,
      };

      const ui = Object.fromEntries(
        PUBLIC_PARTS.map((name) => [name, `contract-${name}`]),
      ) as HellTimePickerUi;
      ui.root = 'contract-root w-[24rem] border-hell-danger';
      ui.readout = 'contract-readout text-lg';
      fixture.componentInstance.ui.set(ui);
      fixture.detectChanges();

      for (const publicPart of PUBLIC_PARTS) {
        expect(
          part(fixture.nativeElement, publicPart).classList.contains(`contract-${publicPart}`),
          publicPart,
        ).toBe(true);
      }

      const renderedSlots = new Set(
        Array.from(
          (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[data-slot]'),
        ).map((element) => element.getAttribute('data-slot')),
      );
      expect(renderedSlots).toEqual(new Set(PUBLIC_PARTS));

      const rootElement = part(fixture.nativeElement, 'root');
      expectUiRouting(
        defaults.root,
        rootElement.className,
        'contract-root w-[24rem] border-hell-danger',
      );
      expectUiRouting(
        defaults.readout,
        part(fixture.nativeElement, 'readout').className,
        'contract-readout text-lg',
      );

      fixture.componentInstance.ui.set('w-[26rem] border-hell-primary');
      fixture.detectChanges();
      expect(rootElement.classList.contains('w-[26rem]')).toBe(true);
      expect(part(fixture.nativeElement, 'header').classList.contains('w-[26rem]')).toBe(false);
    });

    describe('recipes', () => {
      // Part-Class Pipeline merge semantics are owned centrally by
      // `internal/core/part-class-pipeline.spec.ts`; the snapshot pins the default part
      // classes without asserting individual utilities elsewhere.
      it('keeps the default part classes stable', () => {
        const fixture = render();

        expect(
          Object.fromEntries(
            PUBLIC_PARTS.map((name) => [
              name,
              part(fixture.nativeElement, name).className.split(/\s+/).filter(Boolean).sort(),
            ]),
          ),
        ).toMatchSnapshot('timePicker');
      });
    });
  });
});

const PUBLIC_PARTS = [
  'root',
  'header',
  'readout',
  'columns',
  'column',
  'columnLabel',
  'options',
  'option',
] as const satisfies readonly HellTimePickerPart[];

type Fixture = ReturnType<typeof TestBed.createComponent<TimePickerHost>>;

interface RenderOptions {
  readonly value?: HellTimeValue | null;
  readonly seconds?: boolean;
  readonly disabled?: boolean;
  readonly min?: HellTimeValue;
  readonly max?: HellTimeValue;
  readonly minuteStep?: number;
  readonly secondStep?: number;
}

function render(options: RenderOptions = {}): Fixture {
  const fixture = TestBed.createComponent(TimePickerHost);
  const host = fixture.componentInstance;
  if (options.value !== undefined) host.value.set(options.value);
  if (options.seconds !== undefined) host.seconds.set(options.seconds);
  if (options.disabled !== undefined) host.disabled.set(options.disabled);
  if (options.min !== undefined) host.min.set(options.min);
  if (options.max !== undefined) host.max.set(options.max);
  if (options.minuteStep !== undefined) host.minuteStep.set(options.minuteStep);
  if (options.secondStep !== undefined) host.secondStep.set(options.secondStep);
  fixture.detectChanges();
  // Discard the value writes made while arranging the fixture.
  host.values.length = 0;
  return fixture;
}

function root(fixture: Fixture): HTMLElement {
  return part(fixture.nativeElement, 'root');
}

function readout(fixture: Fixture): HTMLElement {
  return part(fixture.nativeElement, 'readout');
}

function part(host: HTMLElement, name: HellTimePickerPart): HTMLElement {
  const element = host.querySelector(`[data-slot="${name}"]`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${name} part.`);
  return element;
}

function column(fixture: Fixture, unit: string): HTMLElement {
  const element = root(fixture).querySelector(`[data-unit="${unit}"]`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${unit} column.`);
  return element;
}

function listbox(fixture: Fixture, unit: string): HTMLElement {
  const element = column(fixture, unit).querySelector('[data-slot="options"]');
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${unit} listbox.`);
  return element;
}

function units(fixture: Fixture): string[] {
  return Array.from(root(fixture).querySelectorAll<HTMLElement>('[data-unit]')).map(
    (element) => element.getAttribute('data-unit') ?? '',
  );
}

function options(fixture: Fixture, unit: string): HTMLElement[] {
  return Array.from(column(fixture, unit).querySelectorAll<HTMLElement>('[data-slot="option"]'));
}

function optionValues(fixture: Fixture, unit: string): string[] {
  return options(fixture, unit).map((element) => element.textContent?.trim() ?? '');
}

function option(fixture: Fixture, unit: string, text: string): HTMLElement {
  const element = options(fixture, unit).find(
    (candidate) => candidate.textContent?.trim() === text,
  );
  if (!element) throw new Error(`Expected ${unit} option ${text}.`);
  return element;
}

function isOptionDisabled(fixture: Fixture, unit: string, text: string): boolean {
  return option(fixture, unit, text).getAttribute('data-disabled') === 'true';
}

function selected(fixture: Fixture, unit: string): string | null {
  const element = column(fixture, unit).querySelector<HTMLElement>('[data-selected="true"]');
  return element?.textContent?.trim() ?? null;
}

function columnLabels(host: HTMLElement): string[] {
  return Array.from(host.querySelectorAll<HTMLElement>('[data-slot="columnLabel"]')).map(
    (element) => element.textContent?.trim() ?? '',
  );
}

function press(fixture: Fixture, unit: string, text: string, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  option(fixture, unit, text).dispatchEvent(event);
  fixture.detectChanges();
  return event;
}

function type(fixture: Fixture, unit: string, text: string, digit: string): void {
  press(fixture, unit, text, digit);
}
