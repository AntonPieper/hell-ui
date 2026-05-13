import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidDeleteLeft, faSolidPhone } from '@ng-icons/font-awesome/solid';
import { HellButton } from '../../primitives/button/button';
import { HellIcon } from '../../primitives/icon/icon';
import { HELL_LABELS } from '../../core/labels';
import { HellStyleable } from '../../core/styleable';

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

const HELL_DIALPAD_ICONS = {
  faSolidDeleteLeft,
  faSolidPhone,
};

/**
 * Telephony dialpad. Emits `(digit)` whenever a key is pressed and maintains
 * the entered number internally. Bind `[value]` for controlled mode, listen
 * to `(valueChange)` for the running number. Backspace removes the last
 * digit; keyboard input is supported when the dialpad has focus.
 */
@Component({
  selector: 'hell-dialpad',
  imports: [HellButton, HellIcon],
  providers: [provideIcons(HELL_DIALPAD_ICONS)],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hell-dialpad]': '!unstyled()',
    role: 'group',
    tabindex: '0',
    '[attr.aria-label]': 'labels.dialpad.dialpad',
  },
  template: `
    <div data-slot="display">
      <output data-slot="number" aria-live="polite"
        ><span data-slot="number-inner">{{ display() || ' ' }}</span></output
      >
      <button
        hellButton
        variant="ghost"
        size="sm"
        iconOnly
        type="button"
        data-slot="back"
        [disabled]="!display()"
        (click)="backspace()"
        [attr.aria-label]="labels.dialpad.backspace"
      >
        <hell-icon name="faSolidDeleteLeft" />
      </button>
    </div>

    <div data-slot="grid">
      @for (k of keys; track k.digit) {
        <button hellButton variant="ghost" data-slot="key" type="button" (click)="press(k.digit)">
          <span data-slot="digit">{{ k.digit }}</span>
          <span data-slot="letters">{{ k.letters || ' ' }}</span>
        </button>
      }
    </div>

    @if (showCallButton()) {
      <button
        hellButton
        variant="primary"
        size="lg"
        type="button"
        data-slot="call"
        (click)="call.emit(display())"
        [disabled]="!display()"
      >
        <hell-icon name="faSolidPhone" /> {{ labels.dialpad.call }}
      </button>
    }
  `,
})
export class HellDialpad extends HellStyleable {
  protected readonly labels = inject(HELL_LABELS);

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
    if (e.key === 'Backspace') {
      this.backspace();
      e.preventDefault();
      return;
    }
    if (/^[0-9*#+]$/.test(e.key)) {
      this.press(e.key);
      e.preventDefault();
    }
  }
}
