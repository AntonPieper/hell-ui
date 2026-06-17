import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  booleanAttribute,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { faSolidDeleteLeft, faSolidPhone } from '@ng-icons/font-awesome/solid';
import { HellButton } from '../../primitives/button/button';
import { HellInput } from '../../primitives/input/input';
import { HELL_LABELS } from '../../core/labels';
import { HellStyleable } from '../../core/styleable';

interface HellDialpadKey {
  digit: string;
  letters?: string;
}

const MAIN_KEYS: HellDialpadKey[] = [
  { digit: '1' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
];

const LOWER_KEYS: HellDialpadKey[] = [{ digit: '*' }, { digit: '0', letters: '+' }, { digit: '#' }];

const HELL_DIALPAD_ICONS = { faSolidDeleteLeft, faSolidPhone };

/**
 * Telephony dialpad. Emits `(digit)` whenever a key is pressed and maintains
 * the entered number internally. Bind `[value]` for controlled mode, listen
 * to `(valueChange)` for the running number. Backspace removes the last
 * digit; keyboard input is supported when the dialpad or one of its controls
 * has focus.
 */
@Component({
  selector: 'hell-dialpad',
  imports: [HellButton, HellInput, NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons(HELL_DIALPAD_ICONS)],
  host: {
    '[class.hell-dialpad]': '!unstyled()',
    role: 'group',
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
    <label data-slot="display">
      <span data-slot="display-label">{{ numberLabel() }}</span>
      <input
        hellInput
        data-slot="number"
        size="lg"
        type="tel"
        inputmode="tel"
        autocomplete="tel"
        [value]="display()"
        placeholder="—"
        [disabled]="disabled()"
        [readOnly]="readOnly()"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        [attr.aria-label]="numberLabel()"
        (beforeinput)="onBeforeInput($event)"
        (input)="onNumberInput($event)"
      />
    </label>

    <div data-slot="controls">
      <button
        hellButton
        variant="danger"
        size="sm"
        type="button"
        data-slot="clear"
        data-action="edit"
        [attr.data-active]="isActive('clear') ? '' : null"
        [disabled]="!canEdit() || !hasValue()"
        (click)="clear()"
        [attr.aria-label]="clearLabel()"
      >
        {{ clearLabel() }}
      </button>
      <button
        hellButton
        variant="danger"
        size="sm"
        iconOnly
        type="button"
        data-slot="back"
        data-action="edit"
        [attr.data-active]="isActive('back') ? '' : null"
        [disabled]="!canEdit() || !hasValue()"
        (click)="backspace()"
        [attr.aria-label]="labels.dialpad.backspace"
      >
        <ng-icon name="faSolidDeleteLeft" size="14px" aria-hidden="true" />
      </button>
    </div>

    <div data-slot="grid">
      @for (k of mainKeys; track k.digit) {
        <button
          hellButton
          variant="default"
          data-slot="key"
          type="button"
          [disabled]="!canEdit()"
          [attr.aria-label]="keyLabel(k)"
          [attr.data-key]="k.digit"
          [attr.data-active]="isKeyActive(k.digit) ? '' : null"
          (click)="onKeyClick(k.digit)"
        >
          <span data-slot="digit">{{ k.digit }}</span>
          <span data-slot="letters">{{ k.letters || ' ' }}</span>
        </button>
      }
    </div>

    <div data-slot="lower-grid">
      @for (k of lowerKeys; track k.digit) {
        <button
          hellButton
          variant="default"
          data-slot="key"
          type="button"
          [disabled]="!canEdit()"
          [attr.aria-label]="keyLabel(k)"
          [attr.data-key]="k.digit"
          [attr.data-active]="isKeyActive(k.digit) ? '' : null"
          (pointerdown)="onPointerDown($event, k.digit)"
          (pointerup)="onPointerUp($event, k.digit)"
          (pointercancel)="cancelPlusHold()"
          (click)="onKeyClick(k.digit)"
        >
          <span data-slot="digit">{{ k.digit }}</span>
          @if (k.letters) {
            <span data-slot="letters">{{ k.letters }}</span>
          }
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
        [attr.data-active]="isActive('call') ? '' : null"
        (click)="submit()"
        [disabled]="disabled() || !hasValue()"
        [attr.aria-label]="labels.dialpad.call"
      >
        <ng-icon name="faSolidPhone" size="14px" aria-hidden="true" />
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

  /** Disable every dialpad control. */
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
  private readonly destroyRef = inject(DestroyRef);

  protected readonly mainKeys = MAIN_KEYS;
  protected readonly lowerKeys = LOWER_KEYS;
  private readonly local = signal('');
  private readonly activeControl = signal<string | null>(null);
  private activeTimer: ReturnType<typeof setTimeout> | null = null;
  private plusHoldTimer: ReturnType<typeof setTimeout> | null = null;
  private plusHoldTriggered = false;
  protected readonly showCallButtonState = this.showCallButton;

  constructor() {
    super();
    this.destroyRef.onDestroy(() => {
      this.clearActiveTimer();
      this.cancelPlusHold();
    });
  }

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
    if (key.digit === '0' && key.letters === '+') {
      return label ? label(key.digit, key.letters) : 'Digit 0, plus';
    }
    if (label) return label(key.digit, key.letters);
    if (key.digit === '*') return 'Star';
    if (key.digit === '#') return 'Pound';
    return key.letters ? `Digit ${key.digit}, ${key.letters}` : `Digit ${key.digit}`;
  }

  protected isActive(control: string): boolean {
    return this.activeControl() === control;
  }

  protected isKeyActive(digit: string): boolean {
    const active = this.activeControl();
    return active === digit || (digit === '0' && active === '+');
  }

  protected onPointerDown(event: PointerEvent, digit: string): void {
    if (digit !== '0' || !this.canEdit()) return;
    this.cancelPlusHold();
    this.plusHoldTriggered = false;
    const target = event.currentTarget as HTMLElement | null;
    if (target?.setPointerCapture) {
      target.setPointerCapture(event.pointerId);
    }
    this.plusHoldTimer = setTimeout(() => {
      this.plusHoldTriggered = true;
      this.press('+');
    }, 520);
  }

  protected onPointerUp(event: PointerEvent, digit: string): void {
    if (digit !== '0') return;
    this.clearPlusHoldTimer();
    const target = event.currentTarget as HTMLElement | null;
    if (target?.hasPointerCapture?.(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
  }

  protected onKeyClick(digit: string): void {
    if (digit === '0' && this.plusHoldTriggered) {
      this.plusHoldTriggered = false;
      return;
    }
    this.press(digit);
  }

  protected press(d: string): void {
    if (!this.canEdit()) return;
    const next = this.display() + d;
    this.flash(d);
    this.setNumber(next);
    this.digit.emit(d);
  }

  protected backspace(): void {
    if (!this.canEdit() || !this.hasValue()) return;
    const next = this.display().slice(0, -1);
    this.flash('back');
    this.setNumber(next);
  }

  protected clear(): void {
    if (!this.canEdit() || !this.hasValue()) return;
    this.flash('clear');
    this.setNumber('');
  }

  protected submit(): void {
    if (this.disabled() || !this.hasValue()) return;
    this.flash('call');
    this.call.emit(this.display());
  }

  protected onBeforeInput(event: InputEvent): void {
    if (!this.canEdit()) {
      event.preventDefault();
      return;
    }

    if (event.inputType === 'insertText' && event.data && !/^[0-9*#+]+$/.test(event.data)) {
      event.preventDefault();
    }
  }

  protected onNumberInput(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;

    if (!this.canEdit()) {
      input.value = this.display();
      return;
    }

    const next = this.sanitizeNumber(input.value);
    input.value = next;
    this.setNumber(next);
  }

  protected onKey(e: KeyboardEvent): void {
    if (this.disabled() || e.defaultPrevented) return;

    if (e.key === 'Enter') {
      if (this.shouldSubmitFrom(e.target) && this.showCallButtonState() && this.hasValue()) {
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

  private shouldSubmitFrom(target: EventTarget | null): boolean {
    return target === this.hostElement || this.isNumberInputTarget(target);
  }

  private isNumberInputTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLInputElement && target.getAttribute('data-slot') === 'number';
  }

  private setNumber(value: string): void {
    this.local.set(value);
    this.valueChange.emit(value);
  }

  private sanitizeNumber(value: string): string {
    return [...value].filter((character) => /^[0-9*#+]$/.test(character)).join('');
  }

  private flash(control: string): void {
    this.clearActiveTimer();
    this.activeControl.set(control);
    this.activeTimer = setTimeout(() => {
      this.activeControl.set(null);
      this.activeTimer = null;
    }, 140);
  }

  private clearActiveTimer(): void {
    if (this.activeTimer !== null) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
  }

  protected cancelPlusHold(): void {
    this.clearPlusHoldTimer();
    this.plusHoldTriggered = false;
  }

  private clearPlusHoldTimer(): void {
    if (this.plusHoldTimer !== null) {
      clearTimeout(this.plusHoldTimer);
      this.plusHoldTimer = null;
    }
  }
}
