import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidClock } from '@ng-icons/font-awesome/solid';
import { HellButton } from '../../primitives/button/button';
import { HellIcon } from '../../primitives/icon/icon';
import { HellInput } from '../../primitives/input/input';
import { HellPopover, HellPopoverTrigger } from '../../primitives/popover/popover';
import type { HellSize } from '../../core/types';
import { HellStyleable } from '../../core/styleable';
import {
  HellTypedValueInputState,
  hellInvalidTypedValue,
  hellTypedValue,
} from '../../core/typed-value-input';

export interface HellTimeValue {
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

const HELL_TIME_INPUT_ICONS = {
  faSolidClock,
};

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function formatTime(t: HellTimeValue, seconds: boolean) {
  return seconds
    ? `${pad(t.hour)}:${pad(t.minute)}:${pad(t.second)}`
    : `${pad(t.hour)}:${pad(t.minute)}`;
}

/**
 * Parse `HH:mm`, `HH:mm:ss` and a couple of common 12-hour spellings
 * (`9:00 am`, `1:30PM`). Empty text commits a nullable clear; unparseable
 * text stays as an invalid draft.
 */
function tryParse(text: string) {
  const t = text.trim().toLowerCase();
  if (!t) return hellTypedValue<HellTimeValue>(null);
  const ampm = /^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?\s*(am|pm)$/.exec(t);
  if (ampm) {
    let hour = +ampm[1];
    const minute = +(ampm[2] ?? '0');
    const second = +(ampm[3] ?? '0');
    if (hour === 12) hour = 0;
    if (ampm[4] === 'pm') hour += 12;
    if (!isValidTime({ hour, minute, second })) return hellInvalidTypedValue();
    return hellTypedValue({ hour, minute, second });
  }
  const m = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.exec(t);
  if (!m) return hellInvalidTypedValue();
  const hour = +m[1];
  const minute = +m[2];
  const second = +(m[3] ?? '0');
  const value = { hour, minute, second };
  return isValidTime(value) ? hellTypedValue(value) : hellInvalidTypedValue();
}

function isValidTime(value: HellTimeValue | null): value is HellTimeValue {
  return (
    !!value &&
    Number.isInteger(value.hour) &&
    Number.isInteger(value.minute) &&
    Number.isInteger(value.second) &&
    value.hour >= 0 &&
    value.hour <= 23 &&
    value.minute >= 0 &&
    value.minute <= 59 &&
    value.second >= 0 &&
    value.second <= 59
  );
}

/**
 * Time input — text field paired with a clock icon trigger that opens a
 * dial-style picker. Bind `[value]` as a structured `HellTimeValue | null`
 * and listen to `(valueChange)`.
 *
 * The picker is a compact 3×3 dial: hour and minute buttons in a grid you
 * can click directly, plus +/- 5 minute nudges, instead of the previous
 * scroll-column UX which felt clumsy.
 */
@Component({
  selector: 'hell-time-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellIcon, HellInput, HellPopover, HellPopoverTrigger],
  providers: [provideIcons(HELL_TIME_INPUT_ICONS)],
  host: {
    '[class.hell-time-input]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.data-invalid]': 'isInvalid() ? "true" : null',
    '[attr.data-disabled]': 'disabled() ? "true" : null',
  },
  template: `
    <input
      hellInput
      unstyled
      [size]="size()"
      type="text"
      data-slot="field"
      inputmode="numeric"
      autocomplete="off"
      [invalid]="isInvalid()"
      [attr.aria-invalid]="isInvalid() ? 'true' : null"
      [attr.aria-label]="ariaLabel()"
      [disabled]="disabled()"
      [placeholder]="placeholder() ?? (seconds() ? 'HH:MM:SS' : 'HH:MM')"
      [value]="display()"
      (input)="onInput($event.target.value)"
      (blur)="onBlur()"
      (keydown.enter)="commit($event.target.value, $event)"
    />
    <button
      hellButton
      variant="ghost"
      size="sm"
      iconOnly
      type="button"
      data-slot="trigger"
      [hellPopoverTrigger]="picker"
      placement="bottom-end"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel() ?? 'Choose time'"
      tabindex="-1"
    >
      <hell-icon name="faSolidClock" />
    </button>

    <ng-template #picker>
      <div hellPopover data-slot="picker">
        <div data-slot="picker-header">
          <span data-slot="picker-readout">{{ format(current(), seconds()) }}</span>
          <div data-slot="picker-stepper">
            <button
              hellButton
              variant="ghost"
              size="sm"
              type="button"
              (click)="nudge('minute', -5)"
              aria-label="Subtract 5 minutes"
            >
              −5m
            </button>
            <button
              hellButton
              variant="ghost"
              size="sm"
              type="button"
              (click)="nudge('minute', 5)"
              aria-label="Add 5 minutes"
            >
              +5m
            </button>
          </div>
        </div>

        <div data-slot="picker-section">
          <div data-slot="picker-section-label">Hours</div>
          <div data-slot="picker-grid" data-unit="hours">
            @for (h of hours; track h) {
              <button
                hellButton
                [variant]="h === current().hour ? 'primary' : 'ghost'"
                size="sm"
                type="button"
                data-slot="picker-cell"
                (click)="setUnit('hour', h)"
              >
                {{ pad(h) }}
              </button>
            }
          </div>
        </div>

        <div data-slot="picker-section">
          <div data-slot="picker-section-label">Minutes</div>
          <div data-slot="picker-grid" data-unit="minutes">
            @for (m of minutes; track m) {
              <button
                hellButton
                [variant]="m === current().minute ? 'primary' : 'ghost'"
                size="sm"
                type="button"
                data-slot="picker-cell"
                (click)="setUnit('minute', m)"
              >
                {{ pad(m) }}
              </button>
            }
          </div>
        </div>

        @if (seconds()) {
          <div data-slot="picker-section">
            <div data-slot="picker-section-label">Seconds</div>
            <div data-slot="picker-grid" data-unit="minutes">
              @for (s of secondsList; track s) {
                <button
                  hellButton
                  [variant]="s === current().second ? 'primary' : 'ghost'"
                  size="sm"
                  type="button"
                  data-slot="picker-cell"
                  (click)="setUnit('second', s)"
                >
                  {{ pad(s) }}
                </button>
              }
            </div>
          </div>
        }
      </div>
    </ng-template>
  `,
})
export class HellTimeInput extends HellStyleable {
  readonly size = input<Exclude<HellSize, 'xs' | 'xl'>>('md');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = input<HellTimeValue | null>(null);
  readonly seconds = input(false, { transform: booleanAttribute });
  readonly placeholder = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  readonly valueChange = output<HellTimeValue | null>();

  // Hour grid: 24h in a 6×4. Minute/second grids: every 5 in a 4×3.
  protected readonly hours = Array.from({ length: 24 }, (_, i) => i);
  protected readonly minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  protected readonly secondsList = Array.from({ length: 12 }, (_, i) => i * 5);
  protected readonly pad = pad;
  protected readonly format = formatTime;

  private readonly valueState = new HellTypedValueInputState<HellTimeValue, HellTimeValue | null>({
    external: () => this.value(),
    parseExternal: (value) => (isValidTime(value) ? value : null),
    parseText: tryParse,
    format: (value) => (value ? formatTime(value, this.seconds()) : ''),
  });

  protected readonly current = computed<HellTimeValue>(
    () => this.valueState.current() ?? { hour: 0, minute: 0, second: 0 },
  );
  protected readonly display = this.valueState.display;
  protected readonly invalidDraft = this.valueState.invalidDraft;
  protected readonly isInvalid = () => this.invalid() || this.invalidDraft();

  protected onInput(value: string) {
    this.valueState.writeDraft(value);
  }

  protected onBlur() {
    const next = this.valueState.commitDraft();
    if (next.committed) this.valueChange.emit(next.value);
  }

  protected commit(text: string, event?: Event) {
    event?.preventDefault();
    const next = this.valueState.commitText(text);
    if (next.committed) this.valueChange.emit(next.value);
  }

  protected setUnit(unit: 'hour' | 'minute' | 'second', n: number) {
    const next = this.valueState.setValue({ ...this.current(), [unit]: n });
    if (next.committed) this.valueChange.emit(next.value);
  }

  protected nudge(unit: 'hour' | 'minute' | 'second', delta: number) {
    const t = { ...this.current() };
    if (unit === 'hour') t.hour = (t.hour + delta + 24) % 24;
    else if (unit === 'minute') {
      const totalMinutes = (t.hour * 60 + t.minute + delta + 24 * 60) % (24 * 60);
      t.hour = Math.floor(totalMinutes / 60);
      t.minute = totalMinutes % 60;
    } else t.second = (t.second + delta + 60) % 60;
    const next = this.valueState.setValue(t);
    if (next.committed) this.valueChange.emit(next.value);
  }
}
