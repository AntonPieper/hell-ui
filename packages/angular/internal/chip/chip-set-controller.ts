import { DestroyRef, ElementRef, Injectable, computed, inject, signal } from '@angular/core';
import { type HellOrientation } from '@hell-ui/angular/core';

/** One chip's private registration with its enclosing behavior controller. */
interface HellChipRegistration {
  readonly element: HTMLElement;
  readonly disabled: () => boolean;
  readonly removable: () => boolean;
  readonly requestRemove: () => void;
  readonly focus: () => void;
}

/** Editable input registered with its enclosing behavior controller. */
interface HellChipInputRegistration {
  readonly element: HTMLInputElement;
  readonly focus: () => void;
}

type HellChipMovement = 'first' | 'last' | 'next' | 'previous';

/**
 * @internal Set-owned roving-focus and keyboard-removal coordinator shared by
 * public Chip Set and Hell-owned composites. It owns behavior only: consumers
 * provide it on the interaction root and delegate bubbling keydown events
 * without adding another Part-Class Pipeline.
 */
@Injectable()
export class HellChipSetController {
  /** Layout axis driving which arrow keys move focus. */
  readonly orientation = signal<HellOrientation>('horizontal');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly chips = signal<readonly HellChipRegistration[]>([]);
  private readonly active = signal<HellChipRegistration | null>(null);
  private input: HellChipInputRegistration | null = null;
  private pendingRefocus: {
    readonly removed: HellChipRegistration;
    readonly target: HellChipRegistration | null;
    readonly returnToInput: boolean;
  } | null = null;
  private destroyed = false;

  private readonly tabStop = computed<HellChipRegistration | null>(() => {
    const enabled = this.enabledChips();
    const current = this.active();
    if (current && enabled.includes(current)) return current;
    return enabled[0] ?? null;
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
    });
  }

  registerChip(chip: HellChipRegistration): void {
    this.chips.update((chips) => [...chips, chip]);
  }

  registerInput(input: HellChipInputRegistration): void {
    if (this.input) {
      throw new Error('HellChipSet supports only one input[hellChipInput] descendant.');
    }
    this.input = input;
  }

  unregisterInput(input: HellChipInputRegistration): void {
    if (this.input === input) this.input = null;
  }

  unregisterChip(chip: HellChipRegistration): void {
    this.chips.update((chips) => chips.filter((registered) => registered !== chip));
    if (this.active() === chip) this.active.set(null);
  }

  setActiveChip(chip: HellChipRegistration): void {
    this.active.set(chip);
  }

  isTabStop(chip: HellChipRegistration): boolean {
    return this.tabStop() === chip;
  }

  /** Moves ArrowLeft focus from an empty input to the final enabled chip. */
  focusLastEnabledChip(): boolean {
    return this.focusLastChip(this.enabledChips());
  }

  /** Moves Backspace focus from an empty input to the final enabled, removable chip. */
  focusLastRemovableChip(): boolean {
    return this.focusLastChip(this.removableChips());
  }

  private focusLastChip(chips: readonly HellChipRegistration[]): boolean {
    const chip = chips[chips.length - 1];
    if (!chip) return false;
    this.setActiveChip(chip);
    chip.focus();
    return true;
  }

  /**
   * Records where focus should land after `removed` leaves the DOM. Called at
   * removal-request time so the neighbour resolves while the removed element
   * is still attached.
   */
  prepareRefocus(removed: HellChipRegistration): void {
    this.pendingRefocus = {
      removed,
      target: this.neighbourOf(removed.element),
      returnToInput: this.isFinalEnabledChip(removed),
    };
  }

  /** Moves focus to the recorded target once the removed chip leaves the DOM. */
  commitRefocus(removed: HellChipRegistration): void {
    const pending = this.pendingRefocus;
    if (!pending || pending.removed !== removed) return;
    this.pendingRefocus = null;

    const { returnToInput, target } = pending;
    queueMicrotask(() => {
      if (this.destroyed) return;
      if (returnToInput && this.focusInput()) {
        // Keep reverse tab order anchored at the surviving chip nearest the
        // input even though browser focus returns to the editable field.
        if (target && target.element.isConnected) this.setActiveChip(target);
        return;
      }
      if (target && target.element.isConnected) {
        this.setActiveChip(target);
        target.focus();
        return;
      }
      const root = this.host.nativeElement;
      if (root.isConnected) root.focus({ preventScroll: true });
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || !(event.target instanceof HTMLElement)) return;
    const chip = this.chips().find((registered) => registered.element === event.target);
    if (!chip) return;

    // Once an editable input is composed with the set, preserve browser and
    // platform shortcuts across the whole interaction instead of handling the
    // same modified key differently depending on which member has focus.
    if (this.input && (event.altKey || event.ctrlKey || event.metaKey)) return;

    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (!chip.removable() || chip.disabled()) return;
      event.preventDefault();
      chip.requestRemove();
      return;
    }

    if (event.key === 'ArrowRight' && this.isFinalEnabledChip(chip) && this.focusInput()) {
      event.preventDefault();
      return;
    }

    const movement = this.movementFor(event.key);
    if (!movement) return;

    const items = this.enabledChips();
    if (!items.length) return;

    event.preventDefault();
    const next = this.itemFor(items, chip, movement);
    if (!next) return;
    this.setActiveChip(next);
    next.focus();
  }

  private movementFor(key: string): HellChipMovement | null {
    if (key === 'Home') return 'first';
    if (key === 'End') return 'last';
    if (this.orientation() === 'vertical') {
      if (key === 'ArrowDown') return 'next';
      if (key === 'ArrowUp') return 'previous';
      return null;
    }
    if (key === 'ArrowRight') return 'next';
    if (key === 'ArrowLeft') return 'previous';
    return null;
  }

  private itemFor(
    items: readonly HellChipRegistration[],
    current: HellChipRegistration,
    movement: HellChipMovement,
  ): HellChipRegistration | null {
    if (movement === 'first') return items[0] ?? null;
    if (movement === 'last') return items[items.length - 1] ?? null;

    const index = Math.max(items.indexOf(current), 0);
    const nextIndex =
      movement === 'next' ? Math.min(index + 1, items.length - 1) : Math.max(index - 1, 0);
    return items[nextIndex] ?? null;
  }

  private enabledChips(): readonly HellChipRegistration[] {
    return this.sortedChips().filter((chip) => !chip.disabled());
  }

  private removableChips(): readonly HellChipRegistration[] {
    return this.enabledChips().filter((chip) => chip.removable());
  }

  private isFinalEnabledChip(chip: HellChipRegistration): boolean {
    if (!this.input) return false;
    const chips = this.enabledChips();
    return chips[chips.length - 1] === chip;
  }

  private focusInput(): boolean {
    const input = this.input;
    if (!input || !input.element.isConnected || input.element.disabled) return false;
    input.focus();
    return true;
  }

  private sortedChips(): readonly HellChipRegistration[] {
    return [...this.chips()].sort((a, b) =>
      a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    );
  }

  private neighbourOf(removedElement: HTMLElement): HellChipRegistration | null {
    const remaining = this.enabledChips().filter((chip) => chip.element !== removedElement);
    if (!remaining.length) return null;

    const next = remaining.find(
      (chip) =>
        removedElement.compareDocumentPosition(chip.element) & Node.DOCUMENT_POSITION_FOLLOWING,
    );
    return next ?? remaining[remaining.length - 1];
  }
}
