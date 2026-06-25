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
import { HELL_LABELS } from '../../core/labels';
import { HellPartStyleable, type HellRecipe, type HellUi } from '../../core/styleable';

interface HellDialpadKey {
  digit: string;
  letters?: string;
}

export type HellDialpadPart =
  | 'root'
  | 'display'
  | 'displayLabel'
  | 'numberInput'
  | 'controls'
  | 'clearButton'
  | 'backspaceButton'
  | 'grid'
  | 'keyButton'
  | 'digit'
  | 'letters'
  | 'lowerGrid'
  | 'callButton';

export type HellDialpadUi = HellUi<HellDialpadPart>;

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

const HELL_DIALPAD_RECIPE = {
  root: 'group flex w-full max-w-[300px] flex-col gap-hell-2 rounded-hell-md outline-none data-disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-4',
  display:
    'grid min-h-16 cursor-text gap-0.5 rounded-hell-md border border-hell-border bg-hell-surface-subtle px-hell-3 py-hell-2 data-invalid:border-hell-danger',
  displayLabel: 'text-xs font-bold text-hell-foreground-muted',
  numberInput:
    'h-9 min-w-0 border-0 bg-transparent p-0 font-[inherit] text-2xl font-semibold leading-tight tracking-normal text-hell-foreground outline-none placeholder:text-hell-foreground-subtle read-only:cursor-default disabled:cursor-not-allowed disabled:text-hell-foreground-muted',
  controls: 'grid grid-cols-[minmax(0,1fr)_42px] gap-hell-2',
  clearButton:
    'inline-flex h-[42px] min-w-0 cursor-pointer items-center justify-center gap-hell-2 rounded-hell-md border border-hell-danger bg-hell-danger px-hell-3 font-[inherit] text-sm font-medium leading-none text-hell-foreground-inverse shadow-sm transition hover:bg-hell-danger-hover active:scale-[0.96] active:bg-hell-danger-active data-active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:bg-hell-danger disabled:opacity-50 disabled:shadow-none max-[480px]:h-[44px]',
  backspaceButton:
    'inline-flex h-[42px] w-[42px] min-w-0 cursor-pointer items-center justify-center rounded-hell-md border border-hell-danger bg-hell-danger p-0 font-[inherit] text-sm font-medium leading-none text-hell-foreground-inverse shadow-sm transition hover:bg-hell-danger-hover active:scale-[0.96] active:bg-hell-danger-active data-active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:bg-hell-danger disabled:opacity-50 disabled:shadow-none max-[480px]:h-[44px]',
  grid: 'grid grid-cols-3 gap-hell-2',
  keyButton:
    'inline-flex h-[56px] min-w-0 touch-manipulation cursor-pointer flex-col items-center justify-center gap-1 rounded-hell-md border border-hell-border bg-hell-surface-elevated px-0 font-[inherit] leading-none text-hell-foreground shadow-none transition hover:bg-hell-surface-muted active:scale-[0.94] active:bg-hell-surface-muted data-active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:scale-100 disabled:bg-hell-surface-elevated disabled:opacity-50 max-[480px]:h-[64px]',
  digit: 'text-2xl font-semibold leading-none tracking-normal',
  letters: 'min-h-2.5 text-[9px] font-bold leading-none tracking-normal text-hell-foreground-muted',
  lowerGrid: 'grid grid-cols-3 gap-hell-2',
  callButton:
    'inline-flex h-[44px] w-full cursor-pointer items-center justify-center gap-hell-2 rounded-hell-md border border-hell-primary bg-hell-primary px-hell-6 font-[inherit] text-sm font-medium leading-none text-hell-primary-foreground shadow-sm transition hover:bg-hell-primary-hover active:scale-[0.98] active:bg-hell-primary-active data-active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:bg-hell-primary disabled:opacity-50 disabled:shadow-none',
} satisfies HellRecipe<HellDialpadPart>;

// Dialpad keeps native controls so each public part can expose dedicated Part
// Style Map classes without inheriting Button's single root part.

/**
 * Telephony dialpad. Emits `(digit)` whenever a key is pressed and maintains
 * the entered number internally. Bind `[value]` for controlled mode, listen
 * to `(valueChange)` for the running number. Backspace removes the last
 * digit; keyboard input is supported when the dialpad or one of its controls
 * has focus.
 */
@Component({
  selector: 'hell-dialpad',
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons(HELL_DIALPAD_ICONS)],
  host: {
    '[class]': "part('root')",
    role: 'group',
    'data-slot': 'root',
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
    <label
      data-slot="display"
      [class]="part('display')"
      [attr.data-invalid]="invalid() ? '' : null"
    >
      <span data-slot="displayLabel" [class]="part('displayLabel')">{{ numberLabel() }}</span>
      <input
        data-slot="numberInput"
        [class]="part('numberInput')"
        type="tel"
        inputmode="tel"
        autocomplete="tel"
        [value]="display()"
        placeholder="—"
        [disabled]="disabled()"
        [readOnly]="readOnly()"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        [attr.aria-label]="numberLabel()"
        [attr.data-disabled]="disabled() ? '' : null"
        [attr.data-readonly]="readOnly() ? '' : null"
        [attr.data-invalid]="invalid() ? '' : null"
        (beforeinput)="onBeforeInput($event)"
        (input)="onNumberInput($event)"
      />
    </label>

    <div data-slot="controls" [class]="part('controls')">
      <button
        type="button"
        data-slot="clearButton"
        tabindex="0"
        [class]="part('clearButton')"
        data-action="edit"
        [attr.data-active]="isActive('clear') ? '' : null"
        [attr.data-disabled]="!canEdit() || !hasValue() ? '' : null"
        [disabled]="!canEdit() || !hasValue()"
        (click)="clear()"
        [attr.aria-label]="clearLabel()"
      >
        {{ clearLabel() }}
      </button>
      <button
        type="button"
        data-slot="backspaceButton"
        data-icon-only=""
        tabindex="0"
        [class]="part('backspaceButton')"
        data-action="edit"
        [attr.data-active]="isActive('back') ? '' : null"
        [attr.data-disabled]="!canEdit() || !hasValue() ? '' : null"
        [disabled]="!canEdit() || !hasValue()"
        (click)="backspace()"
        [attr.aria-label]="labels.dialpad.backspace"
      >
        <ng-icon name="faSolidDeleteLeft" size="14px" aria-hidden="true" />
      </button>
    </div>

    <div data-slot="grid" [class]="part('grid')">
      @for (k of mainKeys; track k.digit) {
        <button
          data-slot="keyButton"
          tabindex="0"
          [class]="part('keyButton')"
          type="button"
          [disabled]="!canEdit()"
          [attr.aria-label]="keyLabel(k)"
          [attr.data-key]="k.digit"
          [attr.data-active]="isKeyActive(k.digit) ? '' : null"
          [attr.data-disabled]="!canEdit() ? '' : null"
          (click)="onKeyClick(k.digit)"
        >
          <span data-slot="digit" [class]="part('digit')">{{ k.digit }}</span>
          <span data-slot="letters" [class]="part('letters')">{{ k.letters || ' ' }}</span>
        </button>
      }
    </div>

    <div data-slot="lowerGrid" [class]="part('lowerGrid')">
      @for (k of lowerKeys; track k.digit) {
        <button
          data-slot="keyButton"
          tabindex="0"
          [class]="part('keyButton')"
          type="button"
          [disabled]="!canEdit()"
          [attr.aria-label]="keyLabel(k)"
          [attr.data-key]="k.digit"
          [attr.data-active]="isKeyActive(k.digit) ? '' : null"
          [attr.data-disabled]="!canEdit() ? '' : null"
          (pointerdown)="onPointerDown($event, k.digit)"
          (pointerup)="onPointerUp($event, k.digit)"
          (pointercancel)="cancelPlusHold()"
          (click)="onKeyClick(k.digit)"
        >
          <span data-slot="digit" [class]="part('digit')">{{ k.digit }}</span>
          @if (k.letters) {
            <span data-slot="letters" [class]="part('letters')">{{ k.letters }}</span>
          }
        </button>
      }
    </div>

    @if (showCallButtonState()) {
      <button
        type="button"
        data-slot="callButton"
        tabindex="0"
        [class]="part('callButton')"
        [attr.data-active]="isActive('call') ? '' : null"
        [attr.data-disabled]="disabled() || !hasValue() ? '' : null"
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
export class HellDialpad extends HellPartStyleable<HellDialpadPart> {
  protected readonly recipe = HELL_DIALPAD_RECIPE;
  protected readonly defaultUiPart = 'root';

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
        this.restoreNumberInputFocus(e.target);
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

  private isNumberInputTarget(target: EventTarget | null): target is HTMLInputElement {
    return target instanceof HTMLInputElement && target.getAttribute('data-slot') === 'numberInput';
  }

  private restoreNumberInputFocus(target: EventTarget | null): void {
    if (!this.isNumberInputTarget(target)) return;
    const input = target;
    setTimeout(() => {
      if (this.hostElement.contains(input)) {
        input.focus();
      }
    });
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
