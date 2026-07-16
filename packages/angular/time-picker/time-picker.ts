import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostAttributeToken,
  InjectionToken,
  Renderer2,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import {
  hellCreateLabels,
  hellPartStyler,
  type HellRecipe,
  type HellUi,
  type HellUiInput,
} from '@hell-ui/angular/core';
import {
  hellTimePickerMaxValue,
  hellTimePickerNextValue,
} from './time-picker-navigation';

/** Structured time value exchanged by Hell time controls. */
export interface HellTimeValue {
  /** Hour of day, from 0 to 23. */
  readonly hour: number;
  /** Minute of hour, from 0 to 59. */
  readonly minute: number;
  /** Second of minute, from 0 to 59. */
  readonly second: number;
}

/** Built-in accessibility labels owned by the time picker entry point. */
export interface HellTimePickerLabels {
  /** Label for the hours spinbutton. */
  readonly hours: string;
  /** Label for the minutes spinbutton. */
  readonly minutes: string;
  /** Label for the seconds spinbutton. */
  readonly seconds: string;
  /** Accessible label announcing the currently selected time. */
  readonly selectedTime: (time: string) => string;
  /** Accessible label for a unit's decrement step button. */
  readonly decreaseUnit: (unitLabel: string) => string;
  /** Accessible label for a unit's increment step button. */
  readonly increaseUnit: (unitLabel: string) => string;
  /** Accessible label for the minute presets group. */
  readonly minutePresets: string;
  /** Accessible label for a single minute preset button. */
  readonly minutePreset: (minute: number) => string;
}

/** Injection token resolving to the effective time picker labels. */
export const HELL_TIME_PICKER_LABELS: InjectionToken<HellTimePickerLabels> =
  hellCreateLabels<HellTimePickerLabels>('HELL_TIME_PICKER_LABELS', {
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    selectedTime: (time) => `Selected time ${time}`,
    decreaseUnit: (unitLabel) => `Decrease ${unitLabel.toLowerCase()}`,
    increaseUnit: (unitLabel) => `Increase ${unitLabel.toLowerCase()}`,
    minutePresets: 'Minute presets',
    minutePreset: (minute) => `Set minutes to ${pad(minute)}`,
  });

/** Public parts of the HellTimePicker module, styleable through its Part Style Map. */
export type HellTimePickerPart =
  | 'root'
  | 'header'
  | 'readout'
  | 'units'
  | 'unit'
  | 'unitLabel'
  | 'unitControl'
  | 'unitValue'
  | 'unitStep'
  | 'minutePresets'
  | 'minutePreset';

/** Part Style Map accepted by the HellTimePicker `ui` input. */
export type HellTimePickerUi = HellUi<HellTimePickerPart>;

interface HellOwnedPartAdapter {
  readonly sourceType: string;
  readonly targetType: string;
  readonly parts: ReadonlyMap<string, string | null>;
}

interface HellTimePickerComposition {
  readonly format: (value: HellTimeValue, seconds: boolean) => string;
  readonly normalize: (
    value: HellTimeValue,
    seconds: boolean,
  ) => HellTimeValue | null;
}

const HELL_OWNED_PART_ADAPTER_ATTRIBUTE = 'data-hell-owned-part-adapter';
const HELL_TIME_PICKER_COMPOSITION = Symbol.for('@hell-ui/angular/time-picker/composition');

const HELL_TIME_PICKER_OWNED_PARTS = hellOwnedPartAdapter(
  'source=HellTimePickerPart;target=HellTimePickerPart;map=root:root,header:header,readout:readout,units:units,unit:unit,unitLabel:unitLabel,unitControl:unitControl,unitValue:unitValue,unitStep:unitStep,minutePresets:minutePresets,minutePreset:minutePreset',
);

const HELL_TIME_PICKER_RECIPE = {
  root: 'grid w-[min(20rem,calc(100vw-2rem))] gap-hell-2 rounded-hell-md border border-hell-border bg-hell-surface-elevated p-hell-3 text-[13px] text-hell-foreground shadow-hell-lg outline-none',
  header: 'flex min-h-hell-control-sm items-center justify-start',
  readout: 'text-[22px] font-semibold leading-none tracking-normal text-hell-foreground tabular-nums',
  units: 'grid grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-hell-2',
  unit: 'grid min-w-0 gap-hell-1',
  unitLabel: 'text-[10px] font-semibold uppercase tracking-normal text-hell-foreground-muted',
  unitControl:
    'grid min-w-0 grid-cols-[minmax(0,1fr)_var(--spacing-hell-control-sm)_var(--spacing-hell-control-sm)] items-stretch overflow-hidden rounded-hell-sm border border-hell-border bg-hell-surface-elevated',
  unitValue:
    'inline-flex h-hell-control-sm min-w-0 cursor-pointer items-center justify-center border-0 border-e border-solid border-hell-border bg-transparent px-hell-2 font-[inherit] text-lg font-semibold text-hell-foreground tabular-nums focus-visible:outline-0 focus-visible:shadow-[inset_0_0_0_2px_var(--color-hell-primary-foreground),0_0_0_3px_var(--color-hell-focus-ring)] aria-disabled:cursor-not-allowed aria-disabled:text-hell-foreground-muted',
  unitStep:
    'h-hell-control-sm cursor-pointer border-0 bg-transparent font-[inherit] text-[13px] font-medium text-hell-foreground-muted transition-[background-color,color,box-shadow] duration-[var(--hell-duration-fast)] ease-hell-out hover:bg-hell-surface-subtle focus-visible:relative focus-visible:z-[1] focus-visible:outline-0 focus-visible:shadow-[inset_0_0_0_2px_var(--color-hell-border-focus),0_0_0_2px_var(--color-hell-focus-ring)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  minutePresets: 'grid grid-cols-4 gap-hell-1',
  minutePreset:
    'h-hell-control-sm cursor-pointer rounded-hell-pill border border-hell-border bg-hell-surface-elevated font-[inherit] text-xs font-medium text-hell-foreground tabular-nums transition-[background-color,border-color,color,box-shadow] duration-[var(--hell-duration-fast)] ease-hell-out hover:bg-hell-surface-subtle focus-visible:relative focus-visible:z-[1] focus-visible:outline-0 focus-visible:shadow-[inset_0_0_0_2px_var(--color-hell-border-focus),0_0_0_2px_var(--color-hell-focus-ring)] data-[selected=true]:border-hell-primary data-[selected=true]:bg-hell-primary data-[selected=true]:text-hell-primary-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
} satisfies HellRecipe<HellTimePickerPart>;

const HOUR_MINUTE_UNITS = ['hour', 'minute'] as const;
const HOUR_MINUTE_SECOND_UNITS = ['hour', 'minute', 'second'] as const;
const MINUTE_PRESETS = [0, 15, 30, 45] as const;
const MIDNIGHT: HellTimeValue = { hour: 0, minute: 0, second: 0 };

let nextTimePickerId = 0;

/**
 * Segmented time picker for structured hour, minute, and optional second
 * selection. It owns picker navigation and accessibility, but deliberately
 * has no text parsing, form-control, field, trigger, or popover API.
 */
@Component({
  selector: 'hell-time-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
  },
  template: `
    <div data-slot="header" [class]="part('header')">
      <span
        data-slot="readout"
        [class]="part('readout')"
        [attr.aria-label]="selectedTimeLabel()"
      >
        {{ formattedValue() }}
      </span>
    </div>

    <div data-slot="units" [class]="part('units')">
      @for (unit of visibleUnits(); track unit) {
        <div data-slot="unit" [class]="part('unit')" [attr.data-unit]="unit">
          <span [id]="unitLabelId(unit)" data-slot="unitLabel" [class]="part('unitLabel')">
            {{ unitLabel(unit) }}
          </span>
          <div data-slot="unitControl" [class]="part('unitControl')">
            <div
              data-slot="unitValue"
              [class]="part('unitValue')"
              role="spinbutton"
              [attr.tabindex]="disabled() ? -1 : 0"
              [attr.aria-disabled]="disabled() ? 'true' : null"
              [attr.aria-labelledby]="unitLabelId(unit)"
              [attr.aria-valuemin]="0"
              [attr.aria-valuemax]="unitMax(unit)"
              [attr.aria-valuenow]="unitValue(unit)"
              [attr.aria-valuetext]="unitValueText(unit)"
              (keydown)="onSpinKeydown($event, unit)"
            >
              {{ pad(unitValue(unit)) }}
            </div>
            <button
              type="button"
              data-slot="unitStep"
              data-direction="decrease"
              [class]="part('unitStep')"
              [disabled]="disabled()"
              [attr.aria-label]="decreaseUnitLabel(unit)"
              (click)="stepUnit(unit, -1)"
            >
              −
            </button>
            <button
              type="button"
              data-slot="unitStep"
              data-direction="increase"
              [class]="part('unitStep')"
              [disabled]="disabled()"
              [attr.aria-label]="increaseUnitLabel(unit)"
              (click)="stepUnit(unit, 1)"
            >
              +
            </button>
          </div>
        </div>
      }
    </div>

    <div
      data-slot="minutePresets"
      [class]="part('minutePresets')"
      role="group"
      [attr.aria-label]="labels.minutePresets"
    >
      @for (minute of minutePresets; track minute) {
        <button
          type="button"
          data-slot="minutePreset"
          [class]="part('minutePreset')"
          [disabled]="disabled()"
          [attr.data-selected]="current().minute === minute ? 'true' : null"
          [attr.aria-pressed]="current().minute === minute ? 'true' : 'false'"
          [attr.aria-label]="labels.minutePreset(minute)"
          (click)="setUnit('minute', minute)"
        >
          {{ pad(minute) }}
        </button>
      }
    </div>
  `,
})
export class HellTimePicker {
  /** Current structured time. Updating the picker emits the implicit `valueChange` model output. */
  readonly value = model<HellTimeValue | null>(null);
  /** Includes the seconds unit. Defaults to `false`. */
  readonly seconds = input(false, { transform: booleanAttribute });
  /** Disables every picker interaction. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTimePickerPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTimePickerPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TIME_PICKER_RECIPE,
  });

  /** Resolved accessibility labels for the picker. */
  protected readonly labels = inject(HELL_TIME_PICKER_LABELS);
  /** Minute values offered as fixed quick presets. */
  protected readonly minutePresets = MINUTE_PRESETS;
  private readonly labelIdPrefix = `hell-time-picker-${++nextTimePickerId}`;

  /** Current valid value, using midnight as a non-emitting nullable fallback. */
  protected readonly current = computed<HellTimeValue>(
    () => normalizeTimeValue(this.value(), this.seconds()) ?? MIDNIGHT,
  );
  /** Readout text for the current visible precision. */
  protected readonly formattedValue = computed(() =>
    formatComposedTimeValue(this.labels, this.current(), this.seconds()),
  );

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const renderer = inject(Renderer2);
    const authoredAdapter = inject(new HostAttributeToken(HELL_OWNED_PART_ADAPTER_ATTRIBUTE), {
      optional: true,
    });
    const ownedParts = authoredAdapter
      ? parseHellOwnedPartAdapter(authoredAdapter)
      : HELL_TIME_PICKER_OWNED_PARTS;

    assertHellOwnedPartAdapterSource(ownedParts, HELL_TIME_PICKER_OWNED_PARTS);
    if (ownedParts.targetType === ownedParts.sourceType) return;

    afterRenderEffect(() => {
      // Track structural unit changes so newly rendered seconds receive the
      // same owned-part naming before the browser paints the next frame.
      this.seconds();
      applyHellOwnedPartAdapter(host, renderer, ownedParts);
    });
  }

  /** Units shown by the picker. */
  protected visibleUnits(): readonly (keyof HellTimeValue)[] {
    return this.seconds() ? HOUR_MINUTE_SECOND_UNITS : HOUR_MINUTE_UNITS;
  }

  /** Localized label for one time unit. */
  protected unitLabel(unit: keyof HellTimeValue): string {
    if (unit === 'hour') return this.labels.hours;
    if (unit === 'minute') return this.labels.minutes;
    return this.labels.seconds;
  }

  /** DOM id of one unit's label, used by its spinbutton. */
  protected unitLabelId(unit: keyof HellTimeValue): string {
    return `${this.labelIdPrefix}-${unit}-label`;
  }

  /** Current numeric value of one unit. */
  protected unitValue(unit: keyof HellTimeValue): number {
    return this.current()[unit];
  }

  /** Maximum accepted value for one unit. */
  protected unitMax(unit: keyof HellTimeValue): number {
    return hellTimePickerMaxValue(unit);
  }

  /** Accessible value text for one unit's spinbutton. */
  protected unitValueText(unit: keyof HellTimeValue): string {
    return `${pad(this.unitValue(unit))} ${this.unitLabel(unit).toLowerCase()}`;
  }

  /** Accessible label announcing the current readout. */
  protected selectedTimeLabel(): string {
    return this.labels.selectedTime(this.formattedValue());
  }

  /** Accessible label for one decrement button. */
  protected decreaseUnitLabel(unit: keyof HellTimeValue): string {
    return this.labels.decreaseUnit(this.unitLabel(unit));
  }

  /** Accessible label for one increment button. */
  protected increaseUnitLabel(unit: keyof HellTimeValue): string {
    return this.labels.increaseUnit(this.unitLabel(unit));
  }

  /** Sets one unit and commits a normalized structured value. */
  protected setUnit(unit: keyof HellTimeValue, nextUnitValue: number): void {
    if (this.disabled()) return;
    const next = normalizeComposedTimeValue(
      this.labels,
      { ...this.current(), [unit]: nextUnitValue },
      this.seconds(),
    );
    if (!next || sameTimeValue(this.value(), next)) return;
    this.value.set(next);
  }

  /** Steps one unit without wrapping beyond its fixed bounds. */
  protected stepUnit(unit: keyof HellTimeValue, delta: number): void {
    if (this.disabled()) return;
    const value = this.unitValue(unit);
    const next = Math.min(Math.max(value + delta, 0), this.unitMax(unit));
    if (next === value) return;
    this.setUnit(unit, next);
  }

  /** Handles Arrow, Home/End, and PageUp/PageDown spinbutton navigation. */
  protected onSpinKeydown(event: KeyboardEvent, unit: keyof HellTimeValue): void {
    if (this.disabled()) return;
    const next = hellTimePickerNextValue(event.key, this.unitValue(unit), unit);
    if (next === null) return;

    event.preventDefault();
    this.setUnit(unit, next);
  }

  /** Zero-pads a number to two digits for display. */
  protected pad(value: number): string {
    return pad(value);
  }
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function hellOwnedPartAdapter(serialized: string): HellOwnedPartAdapter {
  return parseHellOwnedPartAdapter(serialized);
}

function parseHellOwnedPartAdapter(serialized: string): HellOwnedPartAdapter {
  const match =
    /^source=([A-Za-z_$][\w$]*);target=([A-Za-z_$][\w$]*);map=(.+)$/.exec(serialized);
  if (!match) throw new Error('Invalid private owned-part adapter.');

  const parts = new Map<string, string | null>();
  for (const entry of match[3].split(',')) {
    const pair = /^([A-Za-z_$][\w$]*):([A-Za-z_$][\w$]*|null)$/.exec(entry);
    if (!pair || parts.has(pair[1])) throw new Error('Invalid private owned-part adapter.');
    parts.set(pair[1], pair[2] === 'null' ? null : pair[2]);
  }

  return {
    sourceType: match[1],
    targetType: match[2],
    parts,
  };
}

function assertHellOwnedPartAdapterSource(
  candidate: HellOwnedPartAdapter,
  canonical: HellOwnedPartAdapter,
): void {
  if (
    candidate.sourceType !== canonical.sourceType ||
    candidate.parts.size !== canonical.parts.size ||
    [...canonical.parts.keys()].some((part) => !candidate.parts.has(part))
  ) {
    throw new Error('Invalid private owned-part adapter source.');
  }
}

function applyHellOwnedPartAdapter(
  host: HTMLElement,
  renderer: Renderer2,
  adapter: HellOwnedPartAdapter,
): void {
  const ownedElements = [host, ...host.querySelectorAll<HTMLElement>('[data-slot]')];
  for (const element of ownedElements) {
    const sourcePart = element.getAttribute('data-slot');
    if (!sourcePart || !adapter.parts.has(sourcePart)) continue;

    const targetPart = adapter.parts.get(sourcePart);
    if (targetPart === undefined) continue;
    if (targetPart === null) renderer.removeAttribute(element, 'data-slot');
    else if (targetPart !== sourcePart) renderer.setAttribute(element, 'data-slot', targetPart);
  }
}

function formatTimeValue(value: HellTimeValue, seconds: boolean): string {
  return seconds
    ? `${pad(value.hour)}:${pad(value.minute)}:${pad(value.second)}`
    : `${pad(value.hour)}:${pad(value.minute)}`;
}

function formatComposedTimeValue(
  labels: HellTimePickerLabels,
  value: HellTimeValue,
  seconds: boolean,
): string {
  return (
    hellTimePickerComposition(labels)?.format(value, seconds) ??
    formatTimeValue(value, seconds)
  );
}

function normalizeComposedTimeValue(
  labels: HellTimePickerLabels,
  value: HellTimeValue,
  seconds: boolean,
): HellTimeValue | null {
  const bounded = normalizeTimeValue(value, seconds);
  if (!bounded) return null;

  const composition = hellTimePickerComposition(labels);
  return composition
    ? normalizeTimeValue(composition.normalize(bounded, seconds), seconds)
    : bounded;
}

function hellTimePickerComposition(
  labels: HellTimePickerLabels,
): HellTimePickerComposition | null {
  const value = (labels as unknown as Record<PropertyKey, unknown>)[HELL_TIME_PICKER_COMPOSITION];
  if (!value || typeof value !== 'object') return null;

  const composition = value as Partial<HellTimePickerComposition>;
  return typeof composition.format === 'function' && typeof composition.normalize === 'function'
    ? (composition as HellTimePickerComposition)
    : null;
}

function normalizeTimeValue(
  value: HellTimeValue | null | undefined,
  seconds: boolean,
): HellTimeValue | null {
  if (
    !value ||
    !Number.isInteger(value.hour) ||
    !Number.isInteger(value.minute) ||
    !Number.isInteger(value.second) ||
    value.hour < 0 ||
    value.hour > 23 ||
    value.minute < 0 ||
    value.minute > 59 ||
    value.second < 0 ||
    value.second > 59
  ) {
    return null;
  }

  return {
    hour: value.hour,
    minute: value.minute,
    second: seconds ? value.second : 0,
  };
}

function sameTimeValue(a: HellTimeValue | null, b: HellTimeValue | null): boolean {
  return a?.hour === b?.hour && a?.minute === b?.minute && a?.second === b?.second;
}
