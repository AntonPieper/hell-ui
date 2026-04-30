import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidClock } from '@ng-icons/font-awesome/solid';
import { HellButton } from '../../primitives/button/button';
import { HellIcon } from '../../primitives/icon/icon';
import { HellInput } from '../../primitives/input/input';
import { HellPopover, HellPopoverTrigger } from '../../primitives/popover/popover';
import type { HellSize } from '../../core/types';
import { HellStyleable } from '../../core/styleable';

interface ParsedTime {
  h: number;
  m: number;
  s: number;
}

const HELL_TIME_INPUT_ICONS = {
  faSolidClock,
};

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function format(t: ParsedTime, seconds: boolean) {
  return seconds ? `${pad(t.h)}:${pad(t.m)}:${pad(t.s)}` : `${pad(t.h)}:${pad(t.m)}`;
}

/**
 * Parse `HH:mm`, `HH:mm:ss` and a couple of common 12-hour spellings
 * (`9:00 am`, `1:30PM`). Returns `null` for empty / unparseable input so
 * the caller can decide whether to revert.
 */
function tryParse(text: string): ParsedTime | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  const ampm = /^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?\s*(am|pm)$/.exec(t);
  if (ampm) {
    let h = +ampm[1];
    const m = +(ampm[2] ?? '0');
    const s = +(ampm[3] ?? '0');
    if (h === 12) h = 0;
    if (ampm[4] === 'pm') h += 12;
    if (h > 23 || m > 59 || s > 59) return null;
    return { h, m, s };
  }
  const m = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.exec(t);
  if (!m) return null;
  const h = +m[1],
    mm = +m[2],
    s = +(m[3] ?? '0');
  if (h > 23 || mm > 59 || s > 59) return null;
  return { h, m: mm, s };
}

/**
 * Time input — text field paired with a clock icon trigger that opens a
 * dial-style picker. Bind `[value]` as `"HH:mm"` (or `"HH:mm:ss"` with
 * `[seconds]="true"`) and listen to `(valueChange)`.
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
    '[attr.data-invalid]': 'invalid() ? "true" : null',
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
      [invalid]="invalid()"
      [attr.aria-invalid]="invalid() ? 'true' : null"
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
              (click)="nudge('m', -5)"
              aria-label="Subtract 5 minutes"
            >
              −5m
            </button>
            <button
              hellButton
              variant="ghost"
              size="sm"
              type="button"
              (click)="nudge('m', 5)"
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
                [variant]="h === current().h ? 'primary' : 'ghost'"
                size="sm"
                type="button"
                data-slot="picker-cell"
                (click)="setUnit('h', h)"
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
                [variant]="m === current().m ? 'primary' : 'ghost'"
                size="sm"
                type="button"
                data-slot="picker-cell"
                (click)="setUnit('m', m)"
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
                  [variant]="s === current().s ? 'primary' : 'ghost'"
                  size="sm"
                  type="button"
                  data-slot="picker-cell"
                  (click)="setUnit('s', s)"
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
  readonly value = input<string | null>(null);
  readonly seconds = input(false, { transform: booleanAttribute });
  readonly placeholder = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  readonly valueChange = output<string>();

  // Hour grid: 24h in a 6×4. Minute/second grids: every 5 in a 4×3.
  protected readonly hours = Array.from({ length: 24 }, (_, i) => i);
  protected readonly minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  protected readonly secondsList = Array.from({ length: 12 }, (_, i) => i * 5);
  protected readonly pad = pad;
  protected readonly format = format;

  private readonly local = signal<ParsedTime | null>(null);
  /** Raw user text while typing — overrides the formatted display. */
  private readonly typed = signal<string | null>(null);

  protected readonly current = computed<ParsedTime>(
    () => tryParse(this.value() ?? '') ?? this.local() ?? { h: 0, m: 0, s: 0 },
  );

  protected readonly display = computed<string>(() => {
    const t = this.typed();
    if (t !== null) return t;
    const v = tryParse(this.value() ?? '') ?? this.local();
    return v ? format(v, this.seconds()) : '';
  });

  constructor() {
    super();
    effect(() => {
      this.value();
      this.typed.set(null);
    });
  }

  protected onInput(value: string) {
    this.typed.set(value);
  }

  protected onBlur() {
    const t = this.typed();
    if (t === null) return;
    this.commit(t);
  }

  protected commit(text: string, event?: Event) {
    event?.preventDefault();
    this.typed.set(null);
    const parsed = tryParse(text);
    if (parsed) {
      this.local.set(parsed);
      this.valueChange.emit(format(parsed, this.seconds()));
    }
  }

  protected setUnit(unit: 'h' | 'm' | 's', n: number) {
    const t = { ...this.current(), [unit]: n } as ParsedTime;
    this.typed.set(null);
    this.local.set(t);
    this.valueChange.emit(format(t, this.seconds()));
  }

  protected nudge(unit: 'h' | 'm' | 's', delta: number) {
    const t = { ...this.current() };
    if (unit === 'h') t.h = (t.h + delta + 24) % 24;
    else if (unit === 'm') {
      const totalMinutes = (t.h * 60 + t.m + delta + 24 * 60) % (24 * 60);
      t.h = Math.floor(totalMinutes / 60);
      t.m = totalMinutes % 60;
    } else t.s = (t.s + delta + 60) % 60;
    this.typed.set(null);
    this.local.set(t);
    this.valueChange.emit(format(t, this.seconds()));
  }
}
