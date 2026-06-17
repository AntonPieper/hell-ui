import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  booleanAttribute,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HellButton } from '../../primitives/button/button';
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

/**
 * Telephony dialpad. Emits `(digit)` whenever a key is pressed and maintains
 * the entered number internally. Bind `[value]` for controlled mode, listen
 * to `(valueChange)` for the running number. Backspace removes the last
 * digit; keyboard input is supported when the dialpad or one of its controls
 * has focus.
 */
@Component({
  selector: 'hell-dialpad',
  imports: [HellButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.hell-dialpad]': '!unstyled()',
    role: 'group',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    '[attr.aria-label]': 'labels.dialpad.dialpad',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
    '[attr.data-empty]': 'hasValue() ? null : ""',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-readonly]': 'readOnly() ? "" : null',
    '[attr.data-invalid]': 'invalid() ? "" : null',
    '(keydown)': 'onKey($event)',
  },
  template: `
    <div data-slot="display">
      <span data-slot="display-label">{{ numberLabel() }}</span>
      <output data-slot="number" aria-live="polite" [attr.aria-label]="numberLabel()">
        <span data-slot="number-inner">{{ display() || '—' }}</span>
      </output>
    </div>

    <div data-slot="controls">
      <button
        hellButton
        variant="default"
        size="sm"
        type="button"
        data-slot="clear"
        [disabled]="!canEdit() || !hasValue()"
        (click)="clear()"
        [attr.aria-label]="clearLabel()"
      >
        {{ clearLabel() }}
      </button>
      <button
        hellButton
        variant="default"
        size="sm"
        type="button"
        data-slot="back"
        [disabled]="!canEdit() || !hasValue()"
        (click)="backspace()"
        [attr.aria-label]="labels.dialpad.backspace"
      >
        {{ labels.dialpad.backspace }}
      </button>
    </div>

    <div data-slot="grid">
      @for (k of keys; track k.digit) {
        <button
          hellButton
          variant="default"
          data-slot="key"
          type="button"
          [disabled]="!canEdit()"
          [attr.aria-label]="keyLabel(k)"
          [attr.data-key]="k.digit"
          (click)="press(k.digit)"
        >
          <span data-slot="digit">{{ k.digit }}</span>
          <span data-slot="letters">{{ k.letters || ' ' }}</span>
        </button>
      }
    </div>

    @if (showCallButtonState()) {
      <button
        hellButton
        variant="primary"
        size="lg"
        type="button"
        data-slot="call"
        (click)="submit()"
        [disabled]="disabled() || !hasValue()"
        [attr.aria-label]="labels.dialpad.call"
      >
        {{ labels.dialpad.call }}
      </button>
    }
  `,
})
export class HellDialpad extends HellStyleable {
  private readonly valueInput = signal<string | null | undefined>(null);
  private readonly showCallButtonInput = signal(true);
  private readonly disabledInput = signal(false);
  private readonly readOnlyInput = signal(false);
  private readonly invalidInput = signal(false);

  /** Controlled value. Leave nullish to let the dialpad keep local state. */
  readonly value = this.valueInput.asReadonly();

  /** Render a primary "Call" action button below the keys. */
  readonly showCallButton = this.showCallButtonInput.asReadonly();

  /** Disable every dialpad control and remove the host from tab order. */
  readonly disabled = this.disabledInput.asReadonly();

  /** Keep the dialpad readable and callable while preventing number edits. */
  readonly readOnly = this.readOnlyInput.asReadonly();

  /** Mark the current number invalid for styling and accessibility. */
  readonly invalid = this.invalidInput.asReadonly();

  @Output() readonly digit = new EventEmitter<string>();
  @Output() readonly valueChange = new EventEmitter<string>();
  @Output() readonly call = new EventEmitter<string>();

  protected readonly labels = inject(HELL_LABELS);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly keys = KEYS;
  private readonly local = signal('');
  protected readonly showCallButtonState = this.showCallButton;

  @Input('value')
  set valueBinding(value: string | null | undefined) {
    this.valueInput.set(value);
  }

  @Input({ alias: 'showCallButton', transform: booleanAttribute })
  set showCallButtonBinding(value: boolean) {
    this.showCallButtonInput.set(value);
  }

  @Input({ alias: 'disabled', transform: booleanAttribute })
  set disabledBinding(value: boolean) {
    this.disabledInput.set(value);
  }

  @Input({ alias: 'readOnly', transform: booleanAttribute })
  set readOnlyBinding(value: boolean) {
    this.readOnlyInput.set(value);
  }

  @Input({ alias: 'invalid', transform: booleanAttribute })
  set invalidBinding(value: boolean) {
    this.invalidInput.set(value);
  }

  protected readonly display = computed(() => {
    const value = this.value();
    return value === null || value === undefined ? this.local() : value;
  });

  protected readonly hasValue = computed(() => this.display().length > 0);
  protected readonly canEdit = computed(() => !this.disabled() && !this.readOnly());

  protected numberLabel(): string {
    return this.labels.dialpad.number ?? 'Number';
  }

  protected clearLabel(): string {
    return this.labels.dialpad.clear ?? 'Clear';
  }

  protected keyLabel(key: HellDialpadKey): string {
    const label = this.labels.dialpad.key;
    if (label) return label(key.digit, key.letters);
    if (key.digit === '*') return 'Star';
    if (key.digit === '#') return 'Pound';
    const letters = key.letters === '+' ? 'plus' : key.letters;
    return letters ? `Digit ${key.digit}, ${letters}` : `Digit ${key.digit}`;
  }

  protected press(d: string): void {
    if (!this.canEdit()) return;
    const next = this.display() + d;
    this.local.set(next);
    this.digit.emit(d);
    this.valueChange.emit(next);
  }

  protected backspace(): void {
    if (!this.canEdit() || !this.hasValue()) return;
    const next = this.display().slice(0, -1);
    this.local.set(next);
    this.valueChange.emit(next);
  }

  protected clear(): void {
    if (!this.canEdit() || !this.hasValue()) return;
    this.local.set('');
    this.valueChange.emit('');
  }

  protected submit(): void {
    if (this.disabled() || !this.hasValue()) return;
    this.call.emit(this.display());
  }

  protected onKey(e: KeyboardEvent): void {
    if (this.disabled() || e.defaultPrevented) return;

    if (e.key === 'Enter') {
      if (e.target === this.hostElement && this.showCallButtonState() && this.hasValue()) {
        this.submit();
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'Backspace') {
      this.backspace();
      e.preventDefault();
      return;
    }

    if (e.key === 'Delete') {
      this.clear();
      e.preventDefault();
      return;
    }

    if (/^[0-9*#+]$/.test(e.key)) {
      this.press(e.key);
      e.preventDefault();
    }
  }
}
