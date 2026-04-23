import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { HellButton } from '../button/button';
import { HellIcon } from '../icon/icon';
import { HellPopover, HellPopoverTrigger } from '../popover/popover';
import { HellSize } from '../../core/types';

interface ParsedTime { h: number; m: number; s: number; }

function parse(value: string | null | undefined): ParsedTime | null {
  if (!value) return null;
  const m = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.exec(value);
  if (!m) return null;
  const h = +m[1], mm = +m[2], s = +(m[3] ?? '0');
  if (h > 23 || mm > 59 || s > 59) return null;
  return { h, m: mm, s };
}

function pad(n: number) { return n.toString().padStart(2, '0'); }

function format(t: ParsedTime, seconds: boolean) {
  return seconds ? `${pad(t.h)}:${pad(t.m)}:${pad(t.s)}` : `${pad(t.h)}:${pad(t.m)}`;
}

/**
 * Time input — styled trigger button paired with a scroll-column time
 * picker popover. Bind `[value]` (`HH:mm` or `HH:mm:ss`) and listen to
 * `(valueChange)`. Pass `[seconds]="true"` to expose a seconds column.
 */
@Component({
  selector: 'hell-time-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellIcon, HellPopover, HellPopoverTrigger],
  host: {
    '[class.hell-time-input]': '!unstyled()',
    '[attr.data-size]': 'size()',
    '[attr.data-invalid]': 'invalid() ? "true" : null',
    '[attr.data-disabled]': 'disabled() ? "true" : null',
  },
  template: `
    <button
      hellButton
      variant="ghost"
      type="button"
      class="hell-date-input-trigger"
      [hellPopoverTrigger]="picker"
      placement="bottom-start"
      [disabled]="disabled()"
      [attr.aria-label]="ariaLabel()"
    >
      <hell-icon name="faSolidClock" class="hell-date-input-icon" />
      <span class="hell-date-input-value">{{ formatted() || placeholder() }}</span>
    </button>

    <ng-template #picker>
      <div hellPopover>
        <div class="hell-time-picker">
          <div class="hell-time-picker-column" #col data-unit="h">
            @for (h of hours; track h) {
              <button
                type="button"
                class="hell-time-picker-cell"
                [attr.data-selected]="h === current().h ? 'true' : null"
                (click)="setUnit('h', h)"
              >{{ pad(h) }}</button>
            }
          </div>
          <div class="hell-time-picker-divider">:</div>
          <div class="hell-time-picker-column" #col data-unit="m">
            @for (m of minutes; track m) {
              <button
                type="button"
                class="hell-time-picker-cell"
                [attr.data-selected]="m === current().m ? 'true' : null"
                (click)="setUnit('m', m)"
              >{{ pad(m) }}</button>
            }
          </div>
          @if (seconds()) {
            <div class="hell-time-picker-divider">:</div>
            <div class="hell-time-picker-column" #col data-unit="s">
              @for (s of secondsList; track s) {
                <button
                  type="button"
                  class="hell-time-picker-cell"
                  [attr.data-selected]="s === current().s ? 'true' : null"
                  (click)="setUnit('s', s)"
                >{{ pad(s) }}</button>
              }
            </div>
          }
        </div>
      </div>
    </ng-template>
  `,
})
export class HellTimeInput implements AfterViewInit {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly size = input<HellSize>('md');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly value = input<string | null>(null);
  readonly seconds = input(false, { transform: booleanAttribute });
  readonly placeholder = input<string>('Select time');
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });

  readonly valueChange = output<string>();

  protected readonly hours = Array.from({ length: 24 }, (_, i) => i);
  protected readonly minutes = Array.from({ length: 60 }, (_, i) => i);
  protected readonly secondsList = Array.from({ length: 60 }, (_, i) => i);
  protected readonly pad = pad;

  private readonly local = signal<ParsedTime | null>(null);
  protected readonly current = computed<ParsedTime>(
    () => parse(this.value()) ?? this.local() ?? { h: 0, m: 0, s: 0 },
  );
  protected readonly formatted = computed(() => {
    const v = parse(this.value()) ?? this.local();
    return v ? format(v, this.seconds()) : '';
  });

  private readonly cols = viewChildren<ElementRef<HTMLElement>>('col');

  constructor() {
    effect(() => {
      const t = this.current();
      const list = this.cols();
      if (!list.length) return;
      queueMicrotask(() => this.scrollTo(list, t));
    });
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.scrollTo(this.cols(), this.current()));
  }

  protected setUnit(unit: 'h' | 'm' | 's', n: number) {
    const t = { ...this.current(), [unit]: n } as ParsedTime;
    this.local.set(t);
    this.valueChange.emit(format(t, this.seconds()));
  }

  private scrollTo(cols: readonly ElementRef<HTMLElement>[], t: ParsedTime) {
    for (const col of cols) {
      const el = col.nativeElement;
      const unit = el.dataset['unit'] as 'h' | 'm' | 's';
      const idx = unit === 'h' ? t.h : unit === 'm' ? t.m : t.s;
      const cell = el.children[idx] as HTMLElement | undefined;
      if (cell) el.scrollTop = cell.offsetTop - el.clientHeight / 2 + cell.clientHeight / 2;
    }
  }
}
