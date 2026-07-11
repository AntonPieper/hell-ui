import {
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  hellCreateLabels,
  hellPartStyler,
  HellOrientation,
  HellSize,
  HellTagVariant,
  type HellRecipe,
  type HellUi,
  type HellUiInput,
} from '@hell-ui/angular/core';
import {
  hellChipPresentationRecipe,
  hellChipRemovePresentationRecipe,
} from '@hell-ui/angular/internal/chip';
import type { InjectionToken, Provider } from '@angular/core';

/** Built-in accessibility labels owned by the chip entry point. */
export interface HellChipLabels {
  /** Accessible name for a chip's remove button, given the chip's label. */
  readonly remove: (label: string) => string;
  /** Fallback accessible name for a remove button when the chip has no label. */
  readonly removeChip: string;
}

const HELL_CHIP_LABELS_CONTRACT = hellCreateLabels<HellChipLabels>('HELL_CHIP_LABELS', {
  remove: (label) => `Remove ${label}`,
  removeChip: 'Remove',
});

/** Injection token resolving to the effective chip labels. */
export const HELL_CHIP_LABELS: InjectionToken<HellChipLabels> = HELL_CHIP_LABELS_CONTRACT.token;

/** Override any subset of the chip labels for an injector scope. */
export function provideHellChipLabels(overrides: Partial<HellChipLabels>): Provider {
  return HELL_CHIP_LABELS_CONTRACT.provide(overrides);
}

/** Public parts of the HellChipSet module, styleable through its Part Style Map. */
export type HellChipSetPart = 'root';
/** Part Style Map accepted by the HellChipSet `ui` input. */
export type HellChipSetUi = HellUi<HellChipSetPart>;

/** Public parts of the HellChip module, styleable through its Part Style Map. */
export type HellChipPart = 'root';
/** Part Style Map accepted by the HellChip `ui` input. */
export type HellChipUi = HellUi<HellChipPart>;

/** Public parts of the HellChipRemove module, styleable through its Part Style Map. */
export type HellChipRemovePart = 'root';
/** Part Style Map accepted by the HellChipRemove `ui` input. */
export type HellChipRemoveUi = HellUi<HellChipRemovePart>;

const HELL_CHIP_SET_RECIPE = {
  root: 'inline-flex flex-wrap items-center gap-hell-2 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch outline-none',
} satisfies HellRecipe<HellChipSetPart>;

/**
 * One chip's registration with its `HellChipSet`. Exposes only the closures
 * the set needs for roving focus and keyboard removal, so a chip's public API
 * stays lean.
 */
interface HellChipRegistration {
  readonly element: HTMLElement;
  readonly disabled: () => boolean;
  readonly removable: () => boolean;
  readonly requestRemove: () => void;
  readonly focus: () => void;
}

type HellChipMovement = 'first' | 'last' | 'next' | 'previous';

/**
 * Set-owned roving-focus and keyboard-removal coordinator. Provided by
 * `HellChipSet` so descendant chips can register without the set exposing the
 * internal registration type on its public API (the same seam the radio group
 * uses for its item registry). Not exported from the entry point.
 */
@Injectable()
class HellChipSetController {
  /** Layout axis driving which arrow keys move focus. */
  readonly orientation = signal<HellOrientation>('horizontal');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly chips = signal<readonly HellChipRegistration[]>([]);
  private readonly active = signal<HellChipRegistration | null>(null);
  private pendingRefocus: {
    readonly removed: HellChipRegistration;
    readonly target: HellChipRegistration | null;
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

  /**
   * Records where focus should land after `removed` leaves the DOM. Called at
   * removal-request time so the neighbour resolves while the removed element is
   * still attached (document-position comparison against a detached node is
   * unreliable).
   */
  prepareRefocus(removed: HellChipRegistration): void {
    this.pendingRefocus = { removed, target: this.neighbourOf(removed.element) };
  }

  /**
   * Moves focus to the neighbour recorded by `prepareRefocus` once `removed`
   * leaves the DOM: the next chip in document order, then the previous one,
   * then the set root.
   */
  commitRefocus(removed: HellChipRegistration): void {
    const pending = this.pendingRefocus;
    if (!pending || pending.removed !== removed) return;
    this.pendingRefocus = null;

    const { target } = pending;
    queueMicrotask(() => {
      if (this.destroyed) return;
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

    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (!chip.removable() || chip.disabled()) return;
      event.preventDefault();
      chip.requestRemove();
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

/**
 * Container that groups `[hellChip]` elements into a single tab stop with
 * roving arrow-key focus, `Home`/`End` navigation, and `Delete`/`Backspace`
 * removal of the focused chip.
 *
 * Removal is event-only — each chip emits its `remove` output and the consumer
 * owns the collection — while the set keeps focus in place by moving it to a
 * neighbouring chip (or the set root) once a removed chip leaves the DOM.
 *
 * Roving focus is implemented directly rather than through
 * `ng-primitives/roving-focus` because a `NgpRovingFocusItem` forces
 * `tabindex="-1"` when it has no group, which would make a standalone
 * clickable chip untabbable; chips must also work as lone interactive pills.
 */
@Directive({
  selector: '[hellChipSet]',
  providers: [HellChipSetController],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-orientation]': 'orientation()',
    role: 'group',
    tabindex: '-1',
    '(keydown)': 'onKeydown($event)',
  },
})
export class HellChipSet {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellChipSetPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellChipSetPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_CHIP_SET_RECIPE,
  });

  /** Layout axis for roving focus and the Tailwind data attribute. Defaults to `horizontal`. */
  readonly orientation = input<HellOrientation>('horizontal');

  private readonly controller = inject(HellChipSetController);

  constructor() {
    effect(() => this.controller.orientation.set(this.orientation()));
  }

  /** Delegates roving navigation and keyboard removal to the set controller. */
  protected onKeydown(event: KeyboardEvent): void {
    this.controller.onKeydown(event);
  }
}

/**
 * Chip-owned coordination seam between `HellChip` and its `[hellChipRemove]`
 * button. Provided by the chip host so the remove button can read chip state,
 * register removability, and route removal without those members appearing on
 * the chip's public API. The chip wires the closures once at construction.
 * Not exported from the entry point.
 */
@Injectable()
class HellChipController {
  private readonly removeButtonCount = signal(0);

  /** Whether a `[hellChipRemove]` button is registered on the chip. */
  readonly removable = computed(() => this.removeButtonCount() > 0);

  /** Whether the owning chip is disabled. Wired by `HellChip`. */
  disabled: () => boolean = () => false;
  /** The owning chip's human label. Wired by `HellChip`. */
  label: () => string | undefined = () => undefined;
  /** Routes a removal request to the owning chip. Wired by `HellChip`. */
  requestRemove: () => void = () => {};

  /** Registers a remove button so the chip becomes removable. */
  addRemoveButton(): void {
    this.removeButtonCount.update((count) => count + 1);
  }

  /** Unregisters a remove button when it leaves the DOM. */
  removeRemoveButton(): void {
    this.removeButtonCount.update((count) => Math.max(count - 1, 0));
  }
}

/**
 * Chip host directive for span, button, and anchor elements. Renders a
 * token-shaped surface with an optional leading icon, a label, and — via a
 * sibling `[hellChipRemove]` button — an optional remove affordance.
 *
 * Interactive semantics are applied only on interactive hosts: a `<button>`
 * host becomes `type="button"` and an `<a>` host stays a link, while a
 * `<span>` host is a plain, non-interactive token. Inside a `HellChipSet` the
 * chip joins the roving tab order and responds to `Delete`/`Backspace` by
 * requesting removal; standalone it keeps whatever tab semantics its host
 * element already has.
 */
@Directive({
  selector: '[hellChip]',
  providers: [HellChipController],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-interactive]': 'interactive() ? "" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.type]': 'isButton() ? "button" : null',
    '[attr.disabled]': 'isButton() && disabled() ? "" : null',
    '[attr.tabindex]': 'tabIndex()',
    '(focusin)': 'onFocusin()',
  },
})
export class HellChip {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellChipPart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellChipPart>(this.ui, {
    defaultPart: 'root',
    recipe: () => hellChipPresentationRecipe(this.size()),
  });

  /** Color scheme conveying the chip's semantic meaning. Defaults to `default`. */
  readonly variant = input<HellTagVariant>('default');
  /** Size of the chip. Defaults to `md`. */
  readonly size = input<HellSize>('md');
  /** Whether the chip and its remove button are disabled. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /**
   * Explicit override for the chip's human label. By default the remove
   * button's accessible name is derived from the chip's rendered text content
   * (`Remove {content}`), so a plain text chip needs no `label`. Set this only
   * when the visible text is not a good accessible name (or the chip's content
   * is non-textual); it falls back to a generic name when neither this input
   * nor any text content is present.
   */
  readonly label = input<string>();

  /** Emits when removal is requested via the remove button or `Delete`/`Backspace`. */
  readonly remove = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly set = inject(HellChipSetController, { optional: true });
  private readonly controller = inject(HellChipController, { self: true });
  private readonly tagName = this.host.nativeElement.tagName;
  private readonly registration: HellChipRegistration = {
    element: this.host.nativeElement,
    disabled: () => this.disabled(),
    removable: () => this.removable(),
    requestRemove: () => this.requestRemove(),
    focus: () => this.host.nativeElement.focus({ preventScroll: true }),
  };

  /** Whether a `[hellChipRemove]` button is present. */
  protected readonly removable = this.controller.removable;
  /** Whether the host element carries native interactive semantics. */
  protected readonly interactive = computed(() => this.isInteractiveHost() && !this.disabled());

  /**
   * The chip's rendered text content, tracked so the remove button can derive
   * its accessible name without the consumer restating the label. The built-in
   * remove glyph is a CSS pseudo-element, so it never leaks into this text.
   */
  private readonly contentText = signal<string | undefined>(undefined);

  constructor() {
    this.controller.disabled = () => this.disabled();
    // The explicit `label` input wins; otherwise fall back to the rendered text.
    this.controller.label = () => this.label() ?? this.contentText();
    this.controller.requestRemove = () => this.requestRemove();

    // Derive the label from the chip's text content and keep it current as the
    // content changes. The initial read runs after the first render (browser
    // only, so SSR stays safe and hydrated content is read even when no
    // mutation ever fires); a MutationObserver (guarded like the slider's)
    // keeps it fresh. Neither ever sees the ::before remove glyph — a CSS
    // pseudo-element is not part of the DOM tree.
    const hostElement = this.host.nativeElement;
    const syncContentText = (): void => {
      const text = hostElement.textContent?.replace(/\s+/g, ' ').trim();
      this.contentText.set(text ? text : undefined);
    };
    afterNextRender(syncContentText);
    const MutationObserverCtor = hostElement.ownerDocument.defaultView?.MutationObserver;
    if (MutationObserverCtor) {
      const observer = new MutationObserverCtor(syncContentText);
      observer.observe(hostElement, { childList: true, characterData: true, subtree: true });
      this.destroyRef.onDestroy(() => observer.disconnect());
    }

    this.set?.registerChip(this.registration);
    this.destroyRef.onDestroy(() => {
      // Focus continuity intent was captured at removal-request time (see
      // requestRemove); the set applies it once this element leaves the DOM.
      this.set?.commitRefocus(this.registration);
      this.set?.unregisterChip(this.registration);
    });
  }

  /** Emits `remove` unless the chip is disabled. */
  private requestRemove(): void {
    if (this.disabled()) return;
    // While the DOM is still intact, let the set resolve the focus target so
    // it only moves focus for keyboard/focused removals, not programmatic ones.
    if (this.hadFocus()) this.set?.prepareRefocus(this.registration);
    this.remove.emit();
  }

  /** Roving tab index inside a set, or the host's native tab order when standalone. */
  protected tabIndex(): '0' | '-1' | null {
    if (!this.set) return null;
    return this.set.isTabStop(this.registration) ? '0' : '-1';
  }

  /** Whether the host is a `<button>`, so it needs an explicit `type`. */
  protected isButton(): boolean {
    return this.tagName === 'BUTTON';
  }

  /** Marks the chip as the set's active roving tab stop once it gains focus. */
  protected onFocusin(): void {
    if (!this.disabled()) this.set?.setActiveChip(this.registration);
  }

  private isInteractiveHost(): boolean {
    return this.tagName === 'BUTTON' || this.tagName === 'A';
  }

  private hadFocus(): boolean {
    const active = this.host.nativeElement.ownerDocument.activeElement;
    return this.host.nativeElement.contains(active);
  }
}

/**
 * Remove-button directive for a chip. Must be applied to a real, sibling
 * `<button>` inside a `[hellChip]` — never a nested interactive element inside
 * a `<button>` chip host.
 *
 * A bare `<button hellChipRemove></button>` ships a built-in × glyph (a CSS
 * mask on the empty button); project any content to replace it. It is named
 * through the Label Contract as `Remove {chip label}` — derived from the chip's
 * text content by default — stays out of the roving tab order
 * (`Delete`/`Backspace` on the focused chip is the keyboard path), inherits the
 * chip's disabled state, and routes clicks to the chip's `remove` output.
 */
@Directive({
  selector: 'button[hellChipRemove]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    type: 'button',
    tabindex: '-1',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '(click)': 'onClick()',
  },
})
export class HellChipRemove {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<HellChipRemovePart>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<HellChipRemovePart>(this.ui, {
    defaultPart: 'root',
    recipe: hellChipRemovePresentationRecipe,
  });

  private readonly chip = inject(HellChipController);
  private readonly labels = inject(HELL_CHIP_LABELS);
  private readonly destroyRef = inject(DestroyRef);

  /** Whether the enclosing chip is disabled. */
  protected readonly disabled = computed(() => this.chip.disabled());

  /** Accessible name for the button: `Remove {label}` or a generic fallback. */
  protected readonly ariaLabel = computed(() => {
    const label = this.chip.label();
    return label ? this.labels.remove(label) : this.labels.removeChip;
  });

  constructor() {
    this.chip.addRemoveButton();
    this.destroyRef.onDestroy(() => this.chip.removeRemoveButton());
  }

  /** Routes a click through the chip's remove request. */
  protected onClick(): void {
    this.chip.requestRemove();
  }
}

/** All directives of the chip entry point, for bulk `imports`. */
export const HELL_CHIP_DIRECTIVES = [HellChipSet, HellChip, HellChipRemove] as const;
