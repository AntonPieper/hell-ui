import {
  Component,
  ChangeDetectionStrategy,
  booleanAttribute,
  input,
  output,
  signal,
} from '@angular/core';
import { HellButton } from '../../primitives/button/button';

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
 * Telephony dialpad. Emits `digit` whenever a key is pressed and maintains
 * the entered number internally. Bind `value` for controlled mode.
 */
@Component({
  selector: 'hell-dialpad',
  imports: [HellButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hell-dialpad]': '!unstyled()',
    role: 'group',
    'aria-label': 'Dial pad',
  },
  template: `
    <div class="hell-dialpad-display" aria-live="polite">
      {{ display() || '\u00A0' }}
    </div>
    @for (k of keys; track k.digit) {
      <button
        hellButton
        variant="ghost"
        class="hell-dialpad-key"
        type="button"
        (click)="press(k.digit)"
      >
        {{ k.digit }}
        @if (k.letters) { <small>{{ k.letters }}</small> }
      </button>
    }
  `,
})
export class HellDialpad {
  readonly unstyled = input(false, { transform: booleanAttribute });
  readonly value = input<string>('');
  readonly digit = output<string>();
  readonly valueChange = output<string>();

  protected readonly keys = KEYS;
  private readonly local = signal('');

  protected display() {
    return this.value() || this.local();
  }

  protected press(d: string) {
    const next = this.display() + d;
    this.local.set(next);
    this.digit.emit(d);
    this.valueChange.emit(next);
  }
}
