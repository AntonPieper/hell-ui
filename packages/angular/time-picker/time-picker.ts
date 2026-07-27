import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  InjectionToken,
  afterRenderEffect,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  isDevMode,
  model,
  numberAttribute,
  signal,
  untracked,
} from '@angular/core';
import {
  hellCreateLabels,
  type HellLabels,
  type HellTimeValue,
  type HellUi,
  type HellUiInput,
} from 'hell-ui/core';
import {
  hellPartStyler,
  type HellRecipe,
} from 'hell-ui/internal/core';
import {
  hellTimePickerAcceptDigit,
  hellTimePickerEarliestInRange,
  hellTimePickerIsValidStep,
  hellTimePickerNextOptionIndex,
  hellTimePickerSnapIndex,
  hellTimePickerUnitMax,
  hellTimePickerUnitOptions,
  hellTimeValueSeconds,
  type HellTimePickerCandidates,
  type HellTimePickerUnit,
} from './time-picker-navigation';

export type { HellTimeValue } from 'hell-ui/core';

/** Built-in accessibility labels owned by the time picker entry point. */
export interface HellTimePickerLabels {
  /** Label for the hours column. */
  readonly hours: string;
  /** Label for the minutes column. */
  readonly minutes: string;
  /** Label for the seconds column. */
  readonly seconds: string;
  /** Accessible name of the picker while a time is selected. */
  readonly selectedTime: (time: string) => string;
  /** Accessible name of the picker while no time is selected. */
  readonly noTimeSelected: string;
}

/** Injection token resolving to the effective time picker labels. */
export const HELL_TIME_PICKER_LABELS: InjectionToken<HellLabels<HellTimePickerLabels>> =
  hellCreateLabels<HellTimePickerLabels>('HELL_TIME_PICKER_LABELS', {
    hours: 'Hours',
    minutes: 'Minutes',
    seconds: 'Seconds',
    selectedTime: (time) => `Selected time ${time}`,
    noTimeSelected: 'No time selected',
  });

/** Public parts of the HellTimePicker module, styleable through its Part Style Map. */
export type HellTimePickerPart =
  | 'root'
  | 'header'
  | 'readout'
  | 'columns'
  | 'column'
  | 'columnLabel'
  | 'options'
  | 'option';

/** Part Style Map accepted by the HellTimePicker `ui` input. */
export type HellTimePickerUi = HellUi<HellTimePickerPart>;

const HELL_TIME_PICKER_RECIPE = {
  root: 'grid w-[min(20rem,calc(100vw-2rem))] gap-hell-2 rounded-hell-md border border-hell-border bg-hell-surface-elevated p-hell-3 text-[13px] text-hell-foreground shadow-hell-lg outline-none',
  header: 'flex min-h-hell-control-sm items-center justify-start',
  readout: 'text-[22px] font-semibold leading-none tracking-normal text-hell-foreground tabular-nums',
  columns: 'grid grid-flow-col auto-cols-fr gap-hell-2',
  column: 'grid min-w-0 gap-hell-1',
  columnLabel: 'text-[10px] font-semibold uppercase tracking-normal text-hell-foreground-muted',
  options:
    'h-[calc(var(--hell-time-picker-option-size)*7)] min-w-0 overflow-y-auto rounded-hell-sm border border-hell-border bg-hell-surface-elevated py-[calc(var(--hell-time-picker-option-size)*3)] outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
  option:
    'flex h-[var(--hell-time-picker-option-size)] cursor-pointer select-none items-center justify-center rounded-hell-sm text-[15px] font-medium text-hell-foreground-muted tabular-nums transition-[background-color,color] duration-[var(--hell-duration-fast)] ease-hell-out hover:bg-hell-surface-subtle focus-visible:outline-0 focus-visible:shadow-[inset_0_0_0_2px_var(--color-hell-border-focus),0_0_0_2px_var(--color-hell-focus-ring)] data-[selected=true]:bg-hell-primary data-[selected=true]:font-semibold data-[selected=true]:text-hell-primary-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40',
} satisfies HellRecipe<HellTimePickerPart>;

const HOUR_MINUTE_UNITS = ['hour', 'minute'] as const;
const HOUR_MINUTE_SECOND_UNITS = ['hour', 'minute', 'second'] as const;
/** How long a typed-digit accumulator survives without another digit. */
const DIGIT_BUFFER_TIMEOUT_MS = 1000;

let nextTimePickerId = 0;

/**
 * Column time picker for structured hour, minute, and optional second
 * selection. It owns column navigation, bounds, measurement, and
 * accessibility, but deliberately has no text parsing, form-control, field,
 * trigger, or popover API.
 */
@Component({
  selector: 'hell-time-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    role: 'group',
    '[attr.aria-label]': 'rootLabel()',
    '[attr.data-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
  },
  template: `
    <div data-slot="header" [class]="part('header')">
      <span data-slot="readout" [class]="part('readout')" aria-hidden="true">
        {{ formattedValue() }}
      </span>
    </div>

    <div data-slot="columns" [class]="part('columns')">
      @for (column of columns(); track column.unit) {
        <div data-slot="column" [class]="part('column')" [attr.data-unit]="column.unit">
          <span
            [id]="columnLabelId(column.unit)"
            data-slot="columnLabel"
            [class]="part('columnLabel')"
          >
            {{ column.label }}
          </span>
          <!--
            The roving tab stop lives on the options. Firefox also puts
            scrollable containers in the tab order, so the listbox opts out
            explicitly or Tab would stop on the column before its options.
          -->
          <div
            data-slot="options"
            [class]="part('options')"
            role="listbox"
            tabindex="-1"
            [attr.aria-labelledby]="columnLabelId(column.unit)"
          >
            @for (option of column.options; track option.value) {
              <div
                [id]="optionId(column.unit, option.value)"
                data-slot="option"
                [class]="part('option')"
                role="option"
                [attr.tabindex]="disabled() || option.value !== column.activeValue ? -1 : 0"
                [attr.aria-selected]="option.value === column.selectedValue"
                [attr.data-selected]="option.value === column.selectedValue ? 'true' : null"
                [attr.aria-disabled]="option.disabled ? 'true' : null"
                [attr.data-disabled]="option.disabled ? 'true' : null"
                (click)="onOptionClick(column.unit, option.value, option.disabled)"
                (keydown)="onOptionKeydown($event, column.unit, option.value)"
              >
                {{ pad(option.value) }}
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class HellTimePicker {
  /** Current structured time. Updating the picker emits the implicit `valueChange` model output. */
  readonly value = model<HellTimeValue | null>(null);
  /** Includes the seconds column. Defaults to `false`. */
  readonly seconds = input(false, { transform: booleanAttribute });
  /** Disables every picker interaction. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Inclusive same-day lower bound. Unset by default. */
  readonly min = input(undefined, { transform: hellTimePickerBoundAttribute });
  /** Inclusive same-day upper bound. Unset by default. */
  readonly max = input(undefined, { transform: hellTimePickerBoundAttribute });
  /** Minute column granularity. A positive integer dividing 60; defaults to `1`. */
  readonly minuteStep = input(1, { transform: numberAttribute });
  /** Second column granularity. A positive integer dividing 60; defaults to `1`. */
  readonly secondStep = input(1, { transform: numberAttribute });
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellTimePickerPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellTimePickerPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TIME_PICKER_RECIPE,
  });

  /** Resolved accessibility labels for the picker. */
  protected readonly labels = inject(HELL_TIME_PICKER_LABELS);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly idPrefix = `hell-time-picker-${++nextTimePickerId}`;
  /** Pending focus move applied after the commit that caused it renders. */
  private readonly pendingFocus = signal<PendingFocus | null>(null);
  /** Pending scroll centering for every column. */
  private readonly pendingCenter = signal(0);
  /** Open typed-digit accumulator for one column. */
  private digitBuffer: DigitBuffer | null = null;
  private digitTimeout: ReturnType<typeof setTimeout> | null = null;
  /** Marks the next `value` change as picker-owned so it does not re-center. */
  private internalCommit = false;

  /** Current committed value at the visible precision, or `null`. */
  protected readonly current = computed(() =>
    normalizeTimeValue(this.value(), this.seconds()),
  );

  /** Readout text, or the placeholder when nothing is selected. */
  protected readonly formattedValue = computed(() => {
    const value = this.current();
    if (!value) return this.seconds() ? '--:--:--' : '--:--';
    return formatTimeValue(value, this.seconds());
  });

  /** Accessible name of the picker root. */
  protected readonly rootLabel = computed(() => {
    const value = this.current();
    return value
      ? this.labels.selectedTime(formatTimeValue(value, this.seconds()))
      : this.labels.noTimeSelected;
  });

  /** Validated minute granularity. */
  private readonly effectiveMinuteStep = computed(() =>
    this.validateStep(this.minuteStep(), 'minuteStep'),
  );
  /** Validated second granularity. */
  private readonly effectiveSecondStep = computed(() =>
    this.validateStep(this.secondStep(), 'secondStep'),
  );

  /**
   * Option values the picker can construct per unit. Hidden seconds contribute
   * a single `0` candidate so bounds math matches what a commit will write.
   */
  private readonly candidates = computed<HellTimePickerCandidates>(() => {
    const value = this.current();
    return {
      hour: hellTimePickerUnitOptions('hour', 1, value?.hour ?? null),
      minute: hellTimePickerUnitOptions('minute', this.effectiveMinuteStep(), value?.minute ?? null),
      second: this.seconds()
        ? hellTimePickerUnitOptions('second', this.effectiveSecondStep(), value?.second ?? null)
        : [0],
    };
  });

  /** Rendered columns with their options, selection, and roving tab stop. */
  protected readonly columns = computed(() => {
    const candidates = this.candidates();
    const value = this.current();
    const min = this.min() ?? null;
    const max = this.max() ?? null;

    return this.visibleUnits().map((unit) => {
      const options = candidates[unit].map((optionValue) => ({
        value: optionValue,
        disabled:
          hellTimePickerEarliestInRange(unit, optionValue, candidates, min, max) === null,
      }));
      const selectedValue = value ? value[unit] : null;
      const firstEnabled = options.find((option) => !option.disabled);

      return {
        unit,
        label: this.unitLabel(unit),
        options,
        selectedValue,
        // Selection follows focus, so the selected option is also the column's
        // single tab stop; an empty picker falls back to the first enabled one.
        activeValue: selectedValue ?? firstEnabled?.value ?? null,
      };
    });
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => this.clearDigitTimeout());

    effect(() => {
      this.value();
      if (this.internalCommit) {
        this.internalCommit = false;
        return;
      }
      // External writes (and the initial render) re-center every column.
      this.pendingCenter.update((generation) => generation + 1);
    });

    afterRenderEffect(() => {
      // Only the centering generation may retrigger this pass; reading the
      // columns tracked would re-center on every ordinary commit and fight a
      // user's own scrolling.
      if (this.pendingCenter() > 0) {
        for (const unit of untracked(() => this.visibleUnits())) this.centerColumn(unit);
      }

      const pending = this.pendingFocus();
      if (!pending) return;
      this.pendingFocus.set(null);
      const option = this.resolveOptionElement(pending);
      if (!option) return;
      option.focus({ preventScroll: true });
      this.centerColumn(pending.unit);
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

  /** DOM id of one column's label, referenced by its listbox. */
  protected columnLabelId(unit: keyof HellTimeValue): string {
    return `${this.idPrefix}-${unit}-label`;
  }

  /** DOM id of one rendered option. */
  protected optionId(unit: keyof HellTimeValue, value: number): string {
    return `${this.idPrefix}-${unit}-${value}`;
  }

  /** Zero-pads a number to two digits for display. */
  protected pad(value: number): string {
    return pad(value);
  }

  /** Commits a tapped or clicked option. Scrolling never reaches this path. */
  protected onOptionClick(
    unit: keyof HellTimeValue,
    value: number,
    optionDisabled: boolean,
  ): void {
    if (this.disabled() || optionDisabled) return;
    this.resetDigitBuffer();
    this.commitUnit(unit, value);
    // Pointer selection also moves the roving tab stop, so a following Tab
    // leaves from the option the user just chose.
    this.pendingFocus.set({ unit, value });
  }

  /** Handles column navigation, typed digits, and cross-column focus moves. */
  protected onOptionKeydown(
    event: KeyboardEvent,
    unit: keyof HellTimeValue,
    value: number,
  ): void {
    if (this.disabled() || event.altKey || event.ctrlKey || event.metaKey) return;

    if (event.key >= '0' && event.key <= '9' && event.key.length === 1) {
      event.preventDefault();
      this.enterDigit(unit, Number(event.key));
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.resetDigitBuffer();
      this.focusSiblingColumn(unit, event.key === 'ArrowRight' ? 1 : -1);
      return;
    }

    const column = this.columns().find((candidate) => candidate.unit === unit);
    if (!column) return;
    const index = column.options.findIndex((option) => option.value === value);
    const next = hellTimePickerNextOptionIndex(
      event.key,
      index,
      column.options.map((option) => option.disabled),
    );
    if (next === null) return;

    event.preventDefault();
    this.resetDigitBuffer();
    const target = column.options[next];
    if (target.value === value) return;

    // Selection follows focus: the newly focused option is the committed one.
    this.commitUnit(unit, target.value);
    this.pendingFocus.set({ unit, value: target.value });
  }

  /**
   * Folds one typed digit into the column accumulator. An entry that can still
   * take a second digit only keeps the buffer alive; completing it selects,
   * commits, and advances in one step.
   */
  private enterDigit(unit: HellTimePickerUnit, digit: number): void {
    const buffer = this.digitBuffer?.unit === unit ? this.digitBuffer.value : null;
    const entry = hellTimePickerAcceptDigit(buffer, digit, hellTimePickerUnitMax(unit));

    if (entry.buffer !== null) {
      this.digitBuffer = { unit, value: entry.buffer };
      this.clearDigitTimeout();
      this.digitTimeout = setTimeout(() => {
        this.digitBuffer = null;
        this.digitTimeout = null;
      }, DIGIT_BUFFER_TIMEOUT_MS);
      return;
    }

    this.resetDigitBuffer();
    const column = this.columns().find((candidate) => candidate.unit === unit);
    if (column) {
      const snapped = hellTimePickerSnapIndex(
        entry.value,
        column.options.map((option) => option.value),
        column.options.map((option) => option.disabled),
      );
      if (snapped !== null) {
        const target = column.options[snapped];
        this.commitUnit(unit, target.value);
        this.pendingFocus.set({ unit, value: target.value });
      }
    }

    this.focusSiblingColumn(unit, 1);
  }

  /** Moves focus to the roving option of an adjacent column, if one exists. */
  private focusSiblingColumn(unit: HellTimePickerUnit, delta: number): void {
    const units = this.visibleUnits();
    const target = units[units.indexOf(unit) + delta];
    if (!target) return;
    this.pendingFocus.set({ unit: target, value: null });
  }

  /**
   * Writes one unit through the model. Keeping the other units would sometimes
   * leave the bounds, so an out-of-range combination falls back to the same
   * earliest-in-range rule that decides whether the option is offered at all.
   */
  private commitUnit(unit: HellTimePickerUnit, unitValue: number): void {
    const candidates = this.candidates();
    const min = this.min() ?? null;
    const max = this.max() ?? null;
    const current = this.current();

    let next: HellTimeValue | null;
    if (current) {
      const combined = { ...current, [unit]: unitValue };
      next = withinBounds(combined, min, max)
        ? combined
        : hellTimePickerEarliestInRange(unit, unitValue, candidates, min, max);
    } else {
      next = hellTimePickerEarliestInRange(unit, unitValue, candidates, min, max);
    }

    if (!next) return;
    const committed = normalizeTimeValue(next, this.seconds());
    if (!committed || sameTimeValue(this.value(), committed)) return;

    this.internalCommit = true;
    this.value.set(committed);
  }

  /** Validates one step input, throwing in dev mode and falling back otherwise. */
  private validateStep(step: number, name: 'minuteStep' | 'secondStep'): number {
    if (hellTimePickerIsValidStep(step)) return step;
    if (isDevMode()) {
      throw new Error(
        `hell-time-picker: ${name} must be a positive integer that divides 60, received ${step}.`,
      );
    }
    return 1;
  }

  private resetDigitBuffer(): void {
    this.digitBuffer = null;
    this.clearDigitTimeout();
  }

  private clearDigitTimeout(): void {
    if (this.digitTimeout === null) return;
    clearTimeout(this.digitTimeout);
    this.digitTimeout = null;
  }

  private resolveOptionElement(pending: PendingFocus): HTMLElement | null {
    const root = this.host.nativeElement;
    if (pending.value !== null) {
      return root.querySelector<HTMLElement>(
        `[data-unit="${pending.unit}"] [id="${this.optionId(pending.unit, pending.value)}"]`,
      );
    }
    return root.querySelector<HTMLElement>(
      `[data-unit="${pending.unit}"] [data-slot="option"][tabindex="0"]`,
    );
  }

  /**
   * Scrolls one column so its selected option sits in the middle. Rect math
   * keeps this correct regardless of which ancestor is the offset parent, and
   * only ever writes the column's own `scrollTop`.
   */
  private centerColumn(unit: HellTimePickerUnit): void {
    const root = this.host.nativeElement;
    const list = root.querySelector<HTMLElement>(`[data-unit="${unit}"] [data-slot="options"]`);
    // A disabled picker has no tab stop, so the selected option leads.
    const active =
      list?.querySelector<HTMLElement>('[data-slot="option"][data-selected="true"]') ??
      list?.querySelector<HTMLElement>('[data-slot="option"][tabindex="0"]');
    if (!list || !active) return;

    const listRect = list.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    list.scrollTop +=
      activeRect.top - listRect.top - (listRect.height - activeRect.height) / 2;
  }
}

interface PendingFocus {
  readonly unit: HellTimePickerUnit;
  /** A specific option value, or `null` for the column's current tab stop. */
  readonly value: number | null;
}

interface DigitBuffer {
  readonly unit: HellTimePickerUnit;
  readonly value: number;
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function formatTimeValue(value: HellTimeValue, seconds: boolean): string {
  return seconds
    ? `${pad(value.hour)}:${pad(value.minute)}:${pad(value.second)}`
    : `${pad(value.hour)}:${pad(value.minute)}`;
}

function isValidTime(value: unknown): value is HellTimeValue {
  if (!value || typeof value !== 'object') return false;
  const { hour, minute, second } = value as Partial<HellTimeValue>;
  return isTimeUnit(hour, 23) && isTimeUnit(minute, 59) && isTimeUnit(second, 59);
}

function isTimeUnit(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max;
}

/**
 * `min`/`max` accept `HellTimeValue | null | undefined`; `null`, `undefined`,
 * and non-time values all mean "unset", matching `hellTimeInput`.
 */
function hellTimePickerBoundAttribute(value: unknown): HellTimeValue | undefined {
  return isValidTime(value) ? value : undefined;
}

function withinBounds(
  value: HellTimeValue,
  min: HellTimeValue | null,
  max: HellTimeValue | null,
): boolean {
  const total = hellTimeValueSeconds(value);
  return (
    (!min || total >= hellTimeValueSeconds(min)) && (!max || total <= hellTimeValueSeconds(max))
  );
}

function normalizeTimeValue(
  value: HellTimeValue | null | undefined,
  seconds: boolean,
): HellTimeValue | null {
  if (!isValidTime(value)) return null;

  return {
    hour: value.hour,
    minute: value.minute,
    second: seconds ? value.second : 0,
  };
}

function sameTimeValue(a: HellTimeValue | null, b: HellTimeValue | null): boolean {
  return a?.hour === b?.hour && a?.minute === b?.minute && a?.second === b?.second;
}
