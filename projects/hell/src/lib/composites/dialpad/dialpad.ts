import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  booleanAttribute,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { HellButton } from '../../primitives/button/button';
import { HellIcon } from '../../primitives/icon/icon';

interface HellDialpadKey {
  digit: string;
  letters?: string;
}

const KEYS: HellDialpadKey[] = [
  { digit: '1' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*' },
  { digit: '0', letters: '+' },
  { digit: '#' },
];

/**
 * Telephony dialpad. Emits `(digit)` whenever a key is pressed and maintains
 * the entered number internally. Bind `[value]` for controlled mode, listen
 * to `(valueChange)` for the running number. Backspace removes the last
 * digit; keyboard input is supported when the dialpad has focus.
 */
@Component({
  selector: 'hell-dialpad',
  imports: [HellButton, HellIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hell-dialpad]': '!unstyled()',
    role: 'group',
    'aria-label': 'Dial pad',
    tabindex: '0',
  },
  template: `
    <div class="hell-dialpad-display">
      <output class="hell-dialpad-number" aria-live="polite"
        ><span class="hell-dialpad-number-inner">{{ display() || '\u00A0' }}</span></output>
      <button
        hellButton
        variant="ghost"
        size="sm"
        iconOnly
        type="button"
        class="hell-dialpad-back"
        [disabled]="!display()"
        (click)="backspace()"
        aria-label="Backspace"
      >
        <hell-icon name="faSolidDeleteLeft" />
      </button>
    </div>

    <div class="hell-dialpad-grid">
      @for (k of keys; track k.digit) {
        <button
          hellButton
          variant="ghost"
          class="hell-dialpad-key"
          type="button"
          (click)="press(k.digit)"
        >
          <span class="hell-dialpad-digit">{{ k.digit }}</span>
          <span class="hell-dialpad-letters">{{ k.letters || '\u00A0' }}</span>
        </button>
      }
    </div>

    @if (showCallButton()) {
      <button
        hellButton
        variant="primary"
        size="lg"
        type="button"
        class="hell-dialpad-call"
        (click)="call.emit(display())"
        [disabled]="!display()"
      >
        <hell-icon name="faSolidPhone" /> Call
      </button>
    }
  `,
})
export class HellDialpad {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly value = input<string>('');
  /** Render a primary "Call" action button below the keys. */
  readonly showCallButton = input(true, { transform: booleanAttribute });

  readonly digit = output<string>();
  readonly valueChange = output<string>();
  readonly call = output<string>();

  protected readonly keys = KEYS;
  private readonly local = signal('');

  protected readonly display = computed(() => this.value() || this.local());

  protected press(d: string) {
    const next = this.display() + d;
    this.local.set(next);
    this.digit.emit(d);
    this.valueChange.emit(next);
  }

  protected backspace() {
    const next = this.display().slice(0, -1);
    this.local.set(next);
    this.valueChange.emit(next);
  }

  @HostListener('keydown', ['$event'])
  protected onKey(e: KeyboardEvent) {
    if (e.key === 'Backspace') { this.backspace(); e.preventDefault(); return; }
    if (/^[0-9*#+]$/.test(e.key)) { this.press(e.key); e.preventDefault(); }
  }
}
