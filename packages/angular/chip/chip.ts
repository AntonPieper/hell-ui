import {
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  Renderer2,
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
  type HellLabels,
  HellChipVariant,
  HellOrientation,
  HellSize,
  type HellUiInput,
} from 'hell-ui/core';
import {
  hellPartStyler,
  type HellRecipe,
} from 'hell-ui/internal/core';
import {
  HellChipSetController,
  hellChipPresentationRecipe,
  hellChipRemovePresentationRecipe,
} from 'hell-ui/internal/chip';
import type { InjectionToken } from '@angular/core';

/** Built-in accessibility labels owned by the chip entry point. */
export interface HellChipLabels {
  /** Accessible name for a chip's remove button, given the chip's label. */
  readonly remove: (label: string) => string;
  /** Fallback accessible name for a remove button when the chip has no label. */
  readonly removeChip: string;
}

/** Injection token resolving to the effective chip labels. */
export const HELL_CHIP_LABELS: InjectionToken<HellLabels<HellChipLabels>> = hellCreateLabels<HellChipLabels>('HELL_CHIP_LABELS', {
  remove: (label) => `Remove ${label}`,
  removeChip: 'Remove',
});

const HELL_CHIP_SET_RECIPE = {
  root: 'inline-flex flex-wrap items-center gap-hell-2 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch outline-none',
} satisfies HellRecipe<'root'>;

const HELL_BADGE_RECIPE = {
  root: 'inline-flex h-hell-4 min-w-hell-4 items-center justify-center rounded-full bg-hell-danger px-hell-1 py-0 text-[10px] font-bold text-white',
} satisfies HellRecipe<'root'>;

const HELL_KBD_RECIPE = {
  root: 'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded bg-hell-surface-subtle px-[5px] py-0 font-mono text-[11px] text-hell-foreground-muted border border-b-2 border-solid border-hell-border',
} satisfies HellRecipe<'root'>;


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
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
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
 * Keyboard bridge from a consumer-owned editable input to its enclosing
 * `hellChipSet`. On an empty input, `Backspace` moves focus to the final
 * enabled, removable chip while `ArrowLeft` moves to the final enabled chip.
 * The first Backspace therefore selects a chip; the chip set's existing
 * Backspace behavior performs removal only once that chip is focused.
 *
 * Place exactly one of these directives on a real input inside the chip set.
 * It owns no value or styling model, so consumers may combine it with
 * `hellInput`, Control Group, native forms, or their own input presentation.
 */
@Directive({
  selector: 'input[hellChipInput]',
})
export class HellChipInput {
  private readonly host = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly set = inject(HellChipSetController);
  private readonly registration = {
    element: this.host.nativeElement,
    focus: () => this.host.nativeElement.focus({ preventScroll: true }),
  };

  constructor() {
    this.set.registerInput(this.registration);

    const stopKeydownListener = inject(Renderer2).listen(
      this.host.nativeElement,
      'keydown',
      (event: KeyboardEvent) => {
        if (
          event.defaultPrevented ||
          event.isComposing ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey
        ) {
          return;
        }
        if (this.host.nativeElement.value !== '') return;

        const moved =
          event.key === 'Backspace'
            ? this.set.focusLastRemovableChip()
            : event.key === 'ArrowLeft'
              ? this.set.focusLastEnabledChip()
              : false;
        if (!moved) return;
        event.preventDefault();
      },
    );
    this.destroyRef.onDestroy(stopKeydownListener);
    this.destroyRef.onDestroy(() => this.set.unregisterInput(this.registration));
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
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => hellChipPresentationRecipe(this.size()),
  });

  /** Color scheme conveying the chip's semantic meaning. Defaults to `default`. */
  readonly variant = input<HellChipVariant>('default');
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
  private readonly registration = {
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
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
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

/** Small numeric or status indicator, typically overlaid on another element. */
@Directive({
  selector: '[hellBadge]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellBadge {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_BADGE_RECIPE,
  });
}

/** Styled representation of a keyboard key or shortcut. */
@Directive({
  selector: 'kbd[hellKbd], [hellKbd]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellKbd {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_KBD_RECIPE,
  });
}

/** All chip-set directives of the chip entry point, for bulk `imports`. */
export const HELL_CHIP_IMPORTS = [HellChipSet, HellChipInput, HellChip, HellChipRemove] as const;
