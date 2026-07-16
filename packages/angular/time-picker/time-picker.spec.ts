import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHellLabels } from '@hell-ui/angular/core';

import {
  HellTimePicker,
  HELL_TIME_PICKER_LABELS,
  type HellTimePickerPart,
  type HellTimePickerUi,
  type HellTimeValue,
} from './time-picker';

@Component({
  imports: [HellTimePicker],
  template: `
    <hell-time-picker
      [value]="value()"
      [seconds]="seconds()"
      [disabled]="disabled()"
      [ui]="ui()"
      (valueChange)="onValueChange($event)"
    />
  `,
})
class TimePickerHost {
  readonly value = signal<HellTimeValue | null>(null);
  readonly seconds = signal(false);
  readonly disabled = signal(false);
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
      decreaseUnit: (unit) => `${unit} verringern`,
      increaseUnit: (unit) => `${unit} erhöhen`,
      minutePresets: 'Minutenvorgaben',
      minutePreset: (minute) => `Minute ${minute}`,
    }),
  ],
  template: `<hell-time-picker seconds [value]="value" />`,
})
class LocalizedTimePickerHost {
  readonly value: HellTimeValue = { hour: 8, minute: 15, second: 30 };
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

  it('renders the nullable midnight fallback without emitting', () => {
    const fixture = TestBed.createComponent(TimePickerHost);
    fixture.detectChanges();

    expect(part(fixture.nativeElement, 'root').textContent).toContain('00:00');
    expect(spinbutton(fixture.nativeElement, 'Hours').getAttribute('aria-valuenow')).toBe('0');
    expect(spinbutton(fixture.nativeElement, 'Minutes').getAttribute('aria-valuenow')).toBe('0');
    expect(fixture.componentInstance.values).toEqual([]);
  });

  it('syncs external values and emits model changes from user interaction', () => {
    const fixture = TestBed.createComponent(TimePickerHost);
    fixture.componentInstance.value.set({ hour: 8, minute: 30, second: 0 });
    fixture.detectChanges();

    const hours = spinbutton(fixture.nativeElement, 'Hours');
    expect(hours.getAttribute('aria-valuenow')).toBe('8');

    hours.focus();
    expect(document.activeElement).toBe(hours);
    hours.dispatchEvent(keydown('ArrowUp'));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toEqual({ hour: 9, minute: 30, second: 0 });
    expect(fixture.componentInstance.values).toEqual([{ hour: 9, minute: 30, second: 0 }]);

    fixture.componentInstance.value.set({ hour: 17, minute: 45, second: 0 });
    fixture.detectChanges();
    expect(hours.getAttribute('aria-valuenow')).toBe('17');
    expect(spinbutton(fixture.nativeElement, 'Minutes').getAttribute('aria-valuenow')).toBe('45');
  });

  it('shows optional seconds and zeroes hidden seconds on the next commit', () => {
    const fixture = TestBed.createComponent(TimePickerHost);
    fixture.componentInstance.value.set({ hour: 10, minute: 20, second: 56 });
    fixture.detectChanges();

    expect(querySpinbutton(fixture.nativeElement, 'Seconds')).toBeNull();
    expect(part(fixture.nativeElement, 'readout').textContent?.trim()).toBe('10:20');

    button(fixture.nativeElement, 'Increase minutes').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual({ hour: 10, minute: 21, second: 0 });

    fixture.componentInstance.value.set({ hour: 10, minute: 21, second: 56 });
    fixture.componentInstance.seconds.set(true);
    fixture.detectChanges();
    expect(spinbutton(fixture.nativeElement, 'Seconds').getAttribute('aria-valuenow')).toBe('56');
    expect(part(fixture.nativeElement, 'readout').textContent?.trim()).toBe('10:21:56');
  });

  it('keeps every keyboard path inside fixed bounds without wrapping', () => {
    const fixture = TestBed.createComponent(TimePickerHost);
    fixture.componentInstance.value.set({ hour: 23, minute: 2, second: 0 });
    fixture.detectChanges();

    const hours = spinbutton(fixture.nativeElement, 'Hours');
    const atMax = keydown('ArrowUp');
    hours.dispatchEvent(atMax);
    fixture.detectChanges();
    expect(atMax.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.value()).toEqual({ hour: 23, minute: 2, second: 0 });

    const minutes = spinbutton(fixture.nativeElement, 'Minutes');
    minutes.dispatchEvent(keydown('PageDown'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual({ hour: 23, minute: 0, second: 0 });

    minutes.dispatchEvent(keydown('End'));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual({ hour: 23, minute: 59, second: 0 });

    const unsupported = keydown('x');
    minutes.dispatchEvent(unsupported);
    fixture.detectChanges();
    expect(unsupported.defaultPrevented).toBe(false);
    expect(fixture.componentInstance.value()).toEqual({ hour: 23, minute: 59, second: 0 });
  });

  it('commits step buttons and the fixed minute presets with pressed state', () => {
    const fixture = TestBed.createComponent(TimePickerHost);
    fixture.componentInstance.value.set({ hour: 8, minute: 30, second: 0 });
    fixture.detectChanges();

    button(fixture.nativeElement, 'Decrease hours').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual({ hour: 7, minute: 30, second: 0 });

    const preset = button(fixture.nativeElement, 'Set minutes to 45');
    preset.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toEqual({ hour: 7, minute: 45, second: 0 });
    expect(preset.getAttribute('aria-pressed')).toBe('true');
    expect(preset.getAttribute('data-selected')).toBe('true');
    expect(
      Array.from(part(fixture.nativeElement, 'minutePresets').querySelectorAll('button')).map(
        (item) => item.textContent?.trim(),
      ),
    ).toEqual(['00', '15', '30', '45']);
  });

  it('removes disabled controls from interaction and leaves the value untouched', () => {
    const fixture = TestBed.createComponent(TimePickerHost);
    fixture.componentInstance.value.set({ hour: 8, minute: 30, second: 0 });
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    const root = part(fixture.nativeElement, 'root');
    const hours = spinbutton(fixture.nativeElement, 'Hours');
    expect(root.getAttribute('data-disabled')).toBe('true');
    expect(hours.tabIndex).toBe(-1);
    expect(hours.getAttribute('aria-disabled')).toBe('true');
    expect(button(fixture.nativeElement, 'Increase hours').disabled).toBe(true);
    expect(button(fixture.nativeElement, 'Set minutes to 45').disabled).toBe(true);

    const event = keydown('End');
    hours.dispatchEvent(event);
    fixture.detectChanges();
    expect(event.defaultPrevented).toBe(false);
    expect(fixture.componentInstance.value()).toEqual({ hour: 8, minute: 30, second: 0 });
    expect(fixture.componentInstance.values).toEqual([]);
  });

  it('uses scoped label overrides for every accessibility label field', () => {
    const fixture = TestBed.createComponent(LocalizedTimePickerHost);
    fixture.detectChanges();

    expect(spinbutton(fixture.nativeElement, 'Stunden').getAttribute('aria-valuetext')).toBe(
      '08 stunden',
    );
    expect(spinbutton(fixture.nativeElement, 'Minuten')).not.toBeNull();
    expect(spinbutton(fixture.nativeElement, 'Sekunden')).not.toBeNull();
    expect(part(fixture.nativeElement, 'readout').getAttribute('aria-label')).toBe(
      'Gewählte Zeit 08:15:30',
    );
    expect(button(fixture.nativeElement, 'Stunden verringern')).not.toBeNull();
    expect(button(fixture.nativeElement, 'Stunden erhöhen')).not.toBeNull();
    expect(group(fixture.nativeElement, 'Minutenvorgaben')).not.toBeNull();
    expect(button(fixture.nativeElement, 'Minute 30')).not.toBeNull();
  });

  it('renders every public part and merges ui refinements deterministically', () => {
    const fixture = TestBed.createComponent(TimePickerHost);
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
    expect(
      Array.from(renderedSlots).some((slot) => slot?.startsWith('picker')),
    ).toBe(false);

    const root = part(fixture.nativeElement, 'root');
    expect(root.classList.contains('w-[24rem]')).toBe(true);
    expect(root.classList.contains('w-[min(20rem,calc(100vw-2rem))]')).toBe(false);
    expect(root.classList.contains('border-hell-danger')).toBe(true);
    expect(part(fixture.nativeElement, 'readout').classList.contains('text-lg')).toBe(true);
    expect(part(fixture.nativeElement, 'readout').classList.contains('text-[22px]')).toBe(false);

    fixture.componentInstance.ui.set('w-[26rem] border-hell-primary');
    fixture.detectChanges();
    expect(root.classList.contains('w-[26rem]')).toBe(true);
    expect(part(fixture.nativeElement, 'header').classList.contains('w-[26rem]')).toBe(false);
  });
});

const PUBLIC_PARTS = [
  'root',
  'header',
  'readout',
  'units',
  'unit',
  'unitLabel',
  'unitControl',
  'unitValue',
  'unitStep',
  'minutePresets',
  'minutePreset',
] as const satisfies readonly HellTimePickerPart[];

function part(root: HTMLElement, name: HellTimePickerPart): HTMLElement {
  const element = root.querySelector(`[data-slot="${name}"]`);
  if (!(element instanceof HTMLElement)) throw new Error(`Expected ${name} part.`);
  return element;
}

function querySpinbutton(root: HTMLElement, name: string): HTMLElement | null {
  return Array.from(root.querySelectorAll<HTMLElement>('[role="spinbutton"]')).find(
    (element) => accessibleName(element) === name,
  ) ?? null;
}

function spinbutton(root: HTMLElement, name: string): HTMLElement {
  const element = querySpinbutton(root, name);
  if (!element) throw new Error(`Expected ${name} spinbutton.`);
  return element;
}

function button(root: HTMLElement, name: string): HTMLButtonElement {
  const element = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find(
    (item) => item.getAttribute('aria-label') === name,
  );
  if (!element) throw new Error(`Expected ${name} button.`);
  return element;
}

function group(root: HTMLElement, name: string): HTMLElement {
  const element = Array.from(root.querySelectorAll<HTMLElement>('[role="group"]')).find(
    (item) => item.getAttribute('aria-label') === name,
  );
  if (!element) throw new Error(`Expected ${name} group.`);
  return element;
}

function accessibleName(element: HTMLElement): string | null {
  const labelledby = element.getAttribute('aria-labelledby');
  if (!labelledby) return element.getAttribute('aria-label');
  return document.getElementById(labelledby)?.textContent?.trim() ?? null;
}

function keydown(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
}
