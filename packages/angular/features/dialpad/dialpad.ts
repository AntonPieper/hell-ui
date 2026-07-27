import { ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  signal, input, viewChild } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { faSolidDeleteLeft, faSolidPhone } from '@ng-icons/font-awesome/solid';
import { hellCreateLabels, type HellLabels } from 'hell-ui/core';
import type { HellUi, HellUiInput } from 'hell-ui/core';
import { hellPartStyler, type HellRecipe } from 'hell-ui/internal/core';
import type { InjectionToken } from '@angular/core';

/** Built-in accessibility labels owned by the dialpad entry point. */
export interface HellDialpadLabels {
  /** Group label for the whole dialpad. */
  readonly dialpad: string;
  /** Label for the number display input. Defaults to "Number". */
  readonly number?: string;
  /** Label for the backspace control. */
  readonly backspace: string;
  /** Label for the clear control. Defaults to "Clear". */
  readonly clear?: string;
  /** Label for the call action. */
  readonly call: string;
  /** Label factory for one key, given its digit and optional letters. */
  readonly key?: (digit: string, letters?: string) => string;
}

/** Injection token resolving to the effective dialpad labels. */
export const HELL_DIALPAD_LABELS: InjectionToken<HellLabels<HellDialpadLabels>> = hellCreateLabels<HellDialpadLabels>('HELL_DIALPAD_LABELS', {
  dialpad: 'Dial pad',
  backspace: 'Backspace',
  call: 'Call',
});

interface HellDialpadKey {
  digit: string;
  letters?: string;
}

/** One pointer's pending press-and-hold gesture on the `0` key. */
interface HellDialpadPlusHold {
  timer: ReturnType<typeof setTimeout> | null;
  entered: boolean;
}

/** The number and caret one dialpad-owned edit expects the display to show. */
interface HellDialpadEdit {
  /** The number the edit produced. */
  readonly value: string;
  /** Where the caret belongs once that number has rendered. */
  readonly caret: number;
}

/**
 * How many published-but-unrendered edits are remembered before the oldest is
 * dropped. A host that has rendered none of this many is not echoing at all.
 */
const HELL_DIALPAD_PENDING_EDIT_LIMIT = 32;

/** A caret position or selected range inside the number input. */
interface HellDialpadSelection {
  readonly start: number;
  readonly end: number;
}

/** Public parts of the HellDialpad module, styleable through its Part Style Map. */
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

/** Part Style Map accepted by the HellDialpad `ui` input. */
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

/** How long `0` must stay pressed before it enters `+` instead. */
const PLUS_HOLD_MS = 520;

const HELL_DIALPAD_RECIPE = {
  root: 'group flex w-full max-w-[300px] flex-col gap-hell-2 rounded-hell-md outline-none data-disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-4',
  display:
    'grid min-h-16 cursor-text gap-0.5 rounded-hell-md border border-hell-border bg-hell-surface-subtle px-hell-3 py-hell-2 data-invalid:border-hell-danger',
  displayLabel: 'text-xs font-bold text-hell-foreground-muted',
  numberInput:
    'h-9 min-w-0 border-0 bg-transparent p-0 font-[family-name:inherit] text-2xl font-semibold leading-tight tracking-normal text-hell-foreground outline-none placeholder:text-hell-foreground-subtle read-only:cursor-default disabled:cursor-not-allowed disabled:text-hell-foreground-muted',
  controls: 'grid grid-cols-[minmax(0,1fr)_42px] gap-hell-2',
  clearButton:
    'inline-flex h-[42px] min-w-0 cursor-pointer items-center justify-center gap-hell-2 rounded-hell-md border border-hell-danger bg-hell-danger px-hell-3 font-[family-name:inherit] text-sm font-medium leading-none text-hell-foreground-inverse shadow-sm transition hover:bg-hell-danger-hover active:scale-[0.96] active:bg-hell-danger-active data-active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:bg-hell-danger disabled:opacity-50 disabled:shadow-none max-[480px]:h-[44px]',
  backspaceButton:
    'inline-flex h-[42px] w-[42px] min-w-0 cursor-pointer items-center justify-center rounded-hell-md border border-hell-danger bg-hell-danger p-0 font-[family-name:inherit] text-sm font-medium leading-none text-hell-foreground-inverse shadow-sm transition hover:bg-hell-danger-hover active:scale-[0.96] active:bg-hell-danger-active data-active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:bg-hell-danger disabled:opacity-50 disabled:shadow-none max-[480px]:h-[44px]',
  grid: 'grid grid-cols-3 gap-hell-2',
  keyButton:
    'inline-flex h-[56px] min-w-0 touch-manipulation cursor-pointer flex-col items-center justify-center gap-1 rounded-hell-md border border-hell-border bg-hell-surface-elevated px-0 font-[family-name:inherit] leading-none text-hell-foreground shadow-none transition hover:bg-hell-surface-muted active:scale-[0.94] active:bg-hell-surface-muted data-active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:scale-100 disabled:bg-hell-surface-elevated disabled:opacity-50 max-[480px]:h-[64px]',
  digit: 'text-2xl font-semibold leading-none tracking-normal',
  letters: 'min-h-2.5 text-[9px] font-bold leading-none tracking-normal text-hell-foreground-muted',
  lowerGrid: 'grid grid-cols-3 gap-hell-2',
  callButton:
    'inline-flex h-[44px] w-full cursor-pointer items-center justify-center gap-hell-2 rounded-hell-md border border-hell-primary bg-hell-primary px-hell-6 font-[family-name:inherit] text-sm font-medium leading-none text-hell-primary-foreground shadow-sm transition hover:bg-hell-primary-hover active:scale-[0.98] active:bg-hell-primary-active data-active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:bg-hell-primary disabled:opacity-50 disabled:shadow-none',
} satisfies HellRecipe<HellDialpadPart>;

// Dialpad keeps native controls so each public part can expose dedicated Part
// Style Map classes without inheriting Button's single root part.

/**
 * Telephony dialpad. Emits `(digit)` whenever a key is pressed and maintains
 * the entered number internally. Bind `[value]` for controlled mode, listen
 * to `(valueChange)` for the running number. Keys, typing, and backspace all
 * act on the caret in the number display, so placing the caret inside the
 * number inserts and deletes there and a selected range is replaced; keyboard
 * input is supported when the dialpad or one of its controls has focus.
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
    '[attr.aria-label]': 'labels.dialpad',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
    '[attr.data-empty]': 'hasValue() ? null : ""',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-readonly]': 'readOnly() ? "" : null',
    '[attr.data-invalid]': 'invalid() ? "" : null',
    '(keydown)': 'onKey($event)',
  },
  template: `
    <!--
      The pointer is tracked on the whole display, not just the field inside
      it. The box is styled as text, so pressing its chrome is an invited
      gesture that focuses the field and, on WebKit and Firefox, selects the
      number; that focus is pointer-led and its selection is the user's.
      Presses on the field itself bubble to here.
    -->
    <label
      data-slot="display"
      [class]="part('display')"
      [attr.data-invalid]="invalid() ? '' : null"
      (pointerdown)="onNumberPointerDown($event)"
      (pointerup)="onNumberSelect($event)"
    >
      <span data-slot="displayLabel" [class]="part('displayLabel')">{{ numberLabel() }}</span>
      <input
        #numberInput
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
        (focus)="onNumberFocus()"
        (blur)="onNumberBlur()"
        (keydown)="onNumberKeyDown($event)"
        (keyup)="onNumberSelect($event)"
        (select)="onNumberSelect($event)"
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
        [attr.aria-label]="labels.backspace"
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
          (pointerdown)="onKeyPointerDown($event, k.digit)"
          (pointerup)="onKeyPointerUp($event, k.digit)"
          (pointercancel)="onKeyPointerCancel($event)"
          (click)="onKeyClick($event, k.digit)"
        >
          <span data-slot="digit" [class]="part('digit')">{{ k.digit }}</span>
          <span data-slot="letters" [class]="part('letters')">{{ k.letters || '\u00a0' }}</span>
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
          (pointerdown)="onKeyPointerDown($event, k.digit)"
          (pointerup)="onKeyPointerUp($event, k.digit)"
          (pointercancel)="onKeyPointerCancel($event)"
          (click)="onKeyClick($event, k.digit)"
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
        [attr.aria-label]="labels.call"
      >
        <ng-icon name="faSolidPhone" size="14px" aria-hidden="true" />
        {{ labels.call }}
      </button>
    }
  `,
})
export class HellDialpad {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellDialpadPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellDialpadPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_DIALPAD_RECIPE,
  });

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

  /** Emits each pressed digit (including `*`, `#`, and held `+`). */
  @Output() readonly digit = new EventEmitter<string>();
  /** Emits the full number after every edit. */
  @Output() readonly valueChange = new EventEmitter<string>();
  /** Emits the current number when the call action is pressed. */
  @Output() readonly call = new EventEmitter<string>();

  /** Effective dialpad labels from the Label Contract. */
  protected readonly labels = inject(HELL_DIALPAD_LABELS);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  /** Digit keys 1-9 rendered in the main grid. */
  protected readonly mainKeys = MAIN_KEYS;
  /** Bottom row keys: `*`, `0` (hold for `+`), and `#`. */
  protected readonly lowerKeys = LOWER_KEYS;
  private readonly local = signal('');
  private readonly activeControl = signal<string | null>(null);
  private activeTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * The key each active pointer pressed down on, keyed by pointer id. Rapid
   * dialing overlaps fingers, so several keys can be held at the same time.
   */
  private readonly heldKeys = new Map<number, string>();
  /**
   * Pending hold-for-plus gestures, also keyed by pointer id, so a second
   * finger on `0` cannot cancel or claim the first finger's hold.
   */
  private readonly plusHolds = new Map<number, HellDialpadPlusHold>();
  private stopWatchingPointerRelease: (() => void) | null = null;
  private readonly numberInputRef = viewChild<ElementRef<HTMLInputElement>>('numberInput');
  /**
   * Every edit published since the display last rendered, oldest first. A
   * controlled host that echoes asynchronously can render an earlier one of
   * them while a later one is still in flight, so recognising a rendered
   * number takes the whole set rather than only the newest edit.
   */
  private readonly pendingEdits: HellDialpadEdit[] = [];
  /**
   * The number the display last rendered. A displayed number that changed
   * into something no pending edit asked for came from outside the dialpad.
   */
  private lastRendered: string | null = null;
  /**
   * Where the next edit lands, or `null` for the end of the number. The
   * dialpad keeps its own record rather than reading the field on demand,
   * because committing a key tap moves focus to the key and leaves the
   * field's native selection saying less about where the user pointed than
   * the dialpad already knows. A write from outside clears it again.
   */
  private caret: HellDialpadSelection | null = null;
  /**
   * The whole-field range a keyboard focus put in the display, once the field
   * has reported it. Browsers select a text field's contents when focus
   * arrives from the keyboard, and engines disagree about both when that
   * happens and which event announces it, so the range itself is remembered
   * and refused for as long as the field keeps reporting exactly it.
   */
  private focusRange: HellDialpadSelection | null = null;
  /** Whether a keyboard focus is still waiting for its range to be reported. */
  private awaitingFocusRange = false;
  /** Whether a pointer went down inside the number input and is still down. */
  private pointerInInput = false;
  /** Stops the window-level watch for a release the number input cannot see. */
  private stopWatchingInputPointer: (() => void) | null = null;
  /** Template alias for the call-button visibility signal. */
  protected readonly showCallButtonState = this.showCallButton;

  constructor() {
    // Writing `[value]` moves the native caret to the end of the input, so a
    // dialpad-owned edit only reaches its caret after the new number has
    // rendered, and a number written from outside arrives with the native
    // caret already at the end. Both land here, told apart by whether a
    // pending edit asked for the number now on display.
    afterRenderEffect(() => {
      const value = this.display();
      // Until the field agrees, this number has not rendered yet; a
      // controlled host that echoes asynchronously arrives a render later.
      const input = this.numberInputRef()?.nativeElement;
      if (!input || input.value !== value) return;

      const index = this.pendingEdits.findIndex((pending) => pending.value === value);
      if (index !== -1) {
        const edit = this.pendingEdits[index];
        input.setSelectionRange(edit.caret, edit.caret);
        // This edit and everything older than it have now been seen.
        this.pendingEdits.splice(0, index + 1);
        // The number on display is this edit's, so its caret is the one the
        // user can see, whether or not a later edit is still in flight.
        // Every engine also fires `select` for the line above, but only on a
        // later task, so leaving the tracked caret to that would make it
        // disagree with the field in between.
        this.caret = { start: edit.caret, end: edit.caret };
      } else if (value !== this.lastRendered) {
        // Nobody asked for this number, so it came from outside the dialpad.
        // Whatever caret was being tracked points into a number that is gone
        // while the native caret sits at the end, so the next edit appends.
        this.caret = null;
        this.pendingEdits.length = 0;
      }

      this.lastRendered = value;
    });

    this.destroyRef.onDestroy(() => {
      this.clearActiveTimer();
      this.releaseAllPointers();
      this.releaseInputPointer();
    });
  }

  /** Controlled number value; nullish keeps local state. */
  @Input('value')
  set valueBinding(value: string | null | undefined) {
    this.valueInput.set(value);
  }

  /** Show or hide the call action button. */
  @Input({ alias: 'showCallButton', transform: booleanAttribute })
  set showCallButtonBinding(value: boolean) {
    this.showCallButtonInput.set(value);
  }

  /** Disable every dialpad control. */
  @Input({ alias: 'disabled', transform: booleanAttribute })
  set disabledBinding(value: boolean) {
    this.disabledInput.set(value);
  }

  /** Prevent number edits while keeping display and call action usable. */
  @Input({ alias: 'readOnly', transform: booleanAttribute })
  set readOnlyBinding(value: boolean) {
    this.readOnlyInput.set(value);
  }

  /** Mark the current number invalid for styling and `aria-invalid`. */
  @Input({ alias: 'invalid', transform: booleanAttribute })
  set invalidBinding(value: boolean) {
    this.invalidInput.set(value);
  }

  /** Effective number: the controlled value when bound, else local state. */
  protected readonly display = computed(() => {
    const value = this.value();
    return value === null || value === undefined ? this.local() : value;
  });

  /** Whether any digits have been entered. */
  protected readonly hasValue = computed(() => this.display().length > 0);
  /** Whether edits are currently allowed. */
  protected readonly canEdit = computed(() => !this.disabled() && !this.readOnly());

  /** Label for the number display, with English fallback. */
  protected numberLabel(): string {
    return this.labels.number ?? 'Number';
  }

  /** Label for the clear control, with English fallback. */
  protected clearLabel(): string {
    return this.labels.clear ?? 'Clear';
  }

  /** Accessible label for one key, honoring the `key` label factory. */
  protected keyLabel(key: HellDialpadKey): string {
    const label = this.labels.key;
    if (key.digit === '0' && key.letters === '+') {
      return label ? label(key.digit, key.letters) : 'Digit 0, plus';
    }
    if (label) return label(key.digit, key.letters);
    if (key.digit === '*') return 'Star';
    if (key.digit === '#') return 'Pound';
    return key.letters ? `Digit ${key.digit}, ${key.letters}` : `Digit ${key.digit}`;
  }

  /** Whether a named control is flashing as active. */
  protected isActive(control: string): boolean {
    return this.activeControl() === control;
  }

  /** Whether a key is flashing as active (held `+` highlights the `0` key). */
  protected isKeyActive(digit: string): boolean {
    const active = this.activeControl();
    return active === digit || (digit === '0' && active === '+');
  }

  /** Track the pressed key and start the hold-for-plus timer on `0`. */
  protected onKeyPointerDown(event: PointerEvent, digit: string): void {
    if (!this.canEdit() || this.isSecondaryMouseButton(event)) return;

    this.heldKeys.set(event.pointerId, digit);
    this.watchPointerRelease(event);
    if (digit !== '0') return;

    const target = event.currentTarget as HTMLElement | null;
    if (target?.setPointerCapture) {
      target.setPointerCapture(event.pointerId);
    }
    const hold: HellDialpadPlusHold = { timer: null, entered: false };
    this.plusHolds.set(event.pointerId, hold);
    hold.timer = setTimeout(() => {
      hold.timer = null;
      hold.entered = true;
      this.press('+');
    }, PLUS_HOLD_MS);
  }

  /** Commit the tap when a pointer lifts on the key it pressed down on. */
  protected onKeyPointerUp(event: PointerEvent, digit: string): void {
    if (this.isSecondaryMouseButton(event)) return;

    const pressedKey = this.heldKeys.get(event.pointerId);
    this.releasePointerCapture(event);
    const enteredPlus = this.forgetPointer(event.pointerId);

    if (enteredPlus || pressedKey !== digit) return;
    if (!this.releasedInsideKey(event)) return;
    this.press(digit);
  }

  /** Abandon the tap when the browser claims the pointer for a scroll or zoom. */
  protected onKeyPointerCancel(event: PointerEvent): void {
    this.releasePointerCapture(event);
    this.forgetPointer(event.pointerId);
  }

  /**
   * Keyboard (`Enter`/`Space`), assistive-technology, and programmatic
   * activation only. A click that trails a pointer tap reports a non-zero
   * `detail`, and that tap already committed from `pointerup`.
   */
  protected onKeyClick(event: MouseEvent, digit: string): void {
    if (event.detail > 0) return;
    this.press(digit);
  }

  /**
   * Insert one digit at the caret, replacing any selected range, and emit
   * `digit`/`valueChange`.
   */
  protected press(d: string): void {
    if (!this.canEdit()) return;
    const value = this.display();
    const { start, end } = this.selection();
    const next = value.slice(0, start) + d + value.slice(end);
    this.flash(d);
    this.commit(next, start + d.length);
    this.digit.emit(d);
  }

  /**
   * Delete the selected range, or the single character before the caret when
   * nothing is selected.
   */
  protected backspace(): void {
    if (!this.canEdit() || !this.hasValue()) return;
    const value = this.display();
    const { start, end } = this.selection();
    // A collapsed caret before the first character has nothing to delete.
    if (start === end && start === 0) return;

    const from = start === end ? start - 1 : start;
    const next = value.slice(0, from) + value.slice(end);
    this.flash('back');
    this.commit(next, from);
  }

  /** Clear the whole number. */
  protected clear(): void {
    if (!this.canEdit() || !this.hasValue()) return;
    this.flash('clear');
    this.commit('', 0);
  }

  /** Emit the call event for the current number. */
  protected submit(): void {
    if (this.disabled() || !this.hasValue()) return;
    this.flash('call');
    this.call.emit(this.display());
  }

  /** Filter typed characters to valid dialpad input before it lands. */
  protected onBeforeInput(event: InputEvent): void {
    if (!this.canEdit()) {
      event.preventDefault();
      return;
    }

    if (event.inputType === 'insertText' && event.data && !/^[0-9*#+]+$/.test(event.data)) {
      event.preventDefault();
    }
  }

  /**
   * Adopt the caret or range the user placed in the number input by clicking,
   * dragging, or arrow-keying, so the next key press, typed character, or
   * backspace acts there.
   */
  protected onNumberPointerDown(event: PointerEvent): void {
    // A right-click opens a context menu that can swallow the release, and
    // it places no caret worth tracking either way.
    if (this.isSecondaryMouseButton(event)) return;

    this.pointerInInput = true;
    // The release can land anywhere — on a key, on the page, or nowhere at
    // all when a touch turns into a scroll — and a pointer left recorded as
    // down would make the next keyboard focus look pointer-led.
    this.watchInputPointerRelease(event);
    // A pointer gesture is the user placing a caret or selecting a range, so
    // nothing an earlier focus left behind is worth guarding any more.
    this.disarmFocusRange();
  }

  /**
   * Nothing can be pressed in a display that has lost focus, and no blur can
   * fall between the press that focuses the field and that focus, so this
   * cannot swallow a live gesture — it only catches releases the page never
   * reported, such as one over a cross-origin frame.
   */
  protected onNumberBlur(): void {
    this.releaseInputPointer();
  }

  /**
   * Arm the focus-range guard when focus did not arrive with a pointer.
   * Engines disagree over whether the selection is already in place by the
   * time this runs, so the range is captured from the first one the field
   * reports rather than read here.
   */
  protected onNumberFocus(): void {
    this.awaitingFocusRange = !this.pointerInInput;
    this.focusRange = null;
  }

  /**
   * Retire the guard for a deliberate select-all, which is the one selection
   * the user can make that reproduces the focus range exactly and so cannot
   * be recognised from the range alone. Every other keyboard selection —
   * `Shift` with an arrow, `Home`, or `End` — produces a different range and
   * is adopted on its own merits.
   *
   * Nothing else retires it. A bare modifier or `Escape` changes no
   * selection, and neither does a character the dialpad rejects, so the
   * keyup that follows any of them would otherwise adopt the focus range. A
   * character the dialpad accepts is handled on this same keydown and leaves
   * a collapsed caret behind, which needs no exemption.
   */
  protected onNumberKeyDown(event: KeyboardEvent): void {
    // `Ctrl`+`Alt`+`A` is AltGr+A on Windows and European layouts, which
    // reports `a` and selects nothing; `Shift` likewise makes a different
    // shortcut. Neither may retire the guard.
    if (event.altKey || event.shiftKey) return;
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'a') return;
    this.disarmFocusRange();
  }

  protected onNumberSelect(event: Event): void {
    // A release anywhere in the display box counts, so the event may come
    // from the label rather than the field it wraps.
    const input = this.numberInputRef()?.nativeElement;
    if (!input) return;

    if (event.type === 'pointerup') {
      // A pointer that went down on a key and slid onto the display is
      // finishing that gesture rather than placing a caret. The display is
      // not even focused, so what it reports is not the user's intent.
      const startedInInput = this.pointerInInput;
      this.releaseInputPointer();
      if (!startedInInput) return;
    }

    // An edit still on its way to the field would report the caret it had
    // before that edit, so only a field already showing the current number
    // can say where the caret is. A controlled host that keeps its own number
    // still gets a caret this way, because the field agrees with it.
    if (input.value !== this.display()) return;

    const { selectionStart, selectionEnd } = input;
    if (selectionStart === null || selectionEnd === null) return;

    // Tabbing into a text field selects its whole contents. Adopting that
    // range would turn the next edit into a replacement of the whole number,
    // but reaching the display with the keyboard is not asking for that, so
    // the range a focus produced is refused for as long as the field keeps
    // reporting exactly it. A range the user selected, and any caret at all,
    // still count.
    if (selectionStart !== selectionEnd) {
      if (this.awaitingFocusRange) {
        this.awaitingFocusRange = false;
        this.focusRange = { start: selectionStart, end: selectionEnd };
        return;
      }
      if (this.focusRange?.start === selectionStart && this.focusRange.end === selectionEnd) return;
    }

    this.disarmFocusRange();
    this.caret = { start: selectionStart, end: selectionEnd };
  }

  /** Sync direct edits of the number input into dialpad state. */
  protected onNumberInput(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;

    if (!this.canEdit()) {
      input.value = this.display();
      return;
    }

    // Paste, drop, and IME text reach the field unfiltered, so the round trip
    // rewrites the field. Rewriting the whole value would drop the caret at
    // the end, so it moves to the sanitized length of the text that preceded
    // it instead.
    const raw = input.value;
    const rawCaret = input.selectionStart ?? raw.length;
    const next = this.sanitizeNumber(raw);
    const caret = this.sanitizeNumber(raw.slice(0, rawCaret)).length;
    if (raw !== next) {
      input.value = next;
      input.setSelectionRange(caret, caret);
    }
    this.commit(next, caret);
  }

  /** Keyboard support: digits, `*`, `#`, `+`, Backspace, Delete, and Enter. */
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

  /** Record an edit's caret and publish the number it produced. */
  private commit(value: string, caret: number): void {
    this.caret = { start: caret, end: caret };
    this.pendingEdits.push({ value, caret });
    // A host that never renders anything it is given would otherwise grow
    // this without bound; one that has ignored this many edits is not
    // echoing at all.
    if (this.pendingEdits.length > HELL_DIALPAD_PENDING_EDIT_LIMIT) this.pendingEdits.shift();
    this.setNumber(value);
  }

  /** Stop refusing the range a keyboard focus left in the display. */
  private disarmFocusRange(): void {
    this.awaitingFocusRange = false;
    this.focusRange = null;
  }

  /**
   * Watch the owning window so a pointer that went down in the number input
   * is forgotten wherever it is released — over a key, over the page, or not
   * at all when a touch becomes a scroll and only `pointercancel` arrives.
   */
  private watchInputPointerRelease(event: PointerEvent): void {
    if (this.stopWatchingInputPointer) return;

    const view = (event.target as HTMLElement | null)?.ownerDocument.defaultView;
    if (!view) return;

    const release = (): void => this.releaseInputPointer();
    view.addEventListener('pointerup', release);
    view.addEventListener('pointercancel', release);
    this.stopWatchingInputPointer = () => {
      view.removeEventListener('pointerup', release);
      view.removeEventListener('pointercancel', release);
    };
  }

  private releaseInputPointer(): void {
    this.pointerInInput = false;
    this.stopWatchingInputPointer?.();
    this.stopWatchingInputPointer = null;
  }

  /**
   * The caret or selected range the next edit acts on, clamped to the number
   * currently on display. A dialpad nobody has clicked into stays
   * append-only.
   */
  private selection(): HellDialpadSelection {
    const length = this.display().length;
    if (!this.caret) return { start: length, end: length };
    return {
      start: Math.min(this.caret.start, length),
      end: Math.min(this.caret.end, length),
    };
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

  private isSecondaryMouseButton(event: PointerEvent): boolean {
    return event.pointerType === 'mouse' && event.button !== 0;
  }

  private releasePointerCapture(event: PointerEvent): void {
    const target = event.currentTarget as HTMLElement | null;
    if (target?.hasPointerCapture?.(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }
  }

  /**
   * Touch and pen pointers keep implicit capture from `pointerdown`, so their
   * `pointerup` always retargets to the pressed key however far the finger
   * travelled. Hit-testing the release point keeps sliding off a key a way to
   * abandon the tap, exactly as the browser's own click did.
   */
  private releasedInsideKey(event: PointerEvent): boolean {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) return true;

    const rect = target.getBoundingClientRect();
    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
  }

  /** Forget one pointer, reporting whether it already entered `+` by holding. */
  private forgetPointer(pointerId: number): boolean {
    this.heldKeys.delete(pointerId);

    const hold = this.plusHolds.get(pointerId);
    if (hold) {
      this.plusHolds.delete(pointerId);
      if (hold.timer !== null) clearTimeout(hold.timer);
    }

    if (this.heldKeys.size === 0) {
      this.stopWatchingPointerRelease?.();
      this.stopWatchingPointerRelease = null;
    }
    return hold?.entered ?? false;
  }

  /**
   * Mouse pointers get no implicit capture, so a press released off the keypad
   * never reaches a key listener. Watch the owning window until every pointer
   * is released so no key stays recorded as held and later commits a stray
   * digit under an unrelated pointer.
   */
  private watchPointerRelease(event: PointerEvent): void {
    if (this.stopWatchingPointerRelease) return;

    const view = (event.currentTarget as HTMLElement | null)?.ownerDocument.defaultView;
    if (!view) return;

    const release = (released: PointerEvent): void => {
      this.forgetPointer(released.pointerId);
    };
    view.addEventListener('pointerup', release);
    view.addEventListener('pointercancel', release);
    this.stopWatchingPointerRelease = () => {
      view.removeEventListener('pointerup', release);
      view.removeEventListener('pointercancel', release);
    };
  }

  private releaseAllPointers(): void {
    for (const hold of this.plusHolds.values()) {
      if (hold.timer !== null) clearTimeout(hold.timer);
    }
    this.plusHolds.clear();
    this.heldKeys.clear();
    this.stopWatchingPointerRelease?.();
    this.stopWatchingPointerRelease = null;
  }
}
