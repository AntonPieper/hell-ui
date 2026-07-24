import {
  afterRenderEffect,
  Directive,
  effect,
  ElementRef,
  PLATFORM_ID,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { type FormValueControl } from '@angular/forms/signals';
import { NgpToggle } from 'ng-primitives/toggle';
import {
  NgpToggleGroupItem,
  injectToggleGroupItemState,
  ngpToggleGroup,
  provideToggleGroupState,
} from 'ng-primitives/toggle-group';
import { ngpRovingFocusGroup, provideRovingFocusGroupState } from 'ng-primitives/roving-focus';
import { type NgpOrientation } from 'ng-primitives/common';
import { containsNode, hellPartStyler, type HellRecipe } from 'hell-ui/internal/core';
import { HellSize, type HellUiInput } from 'hell-ui/core';

/**
 * Canonical value of a `[hellToggleGroup]` — mode-dependent: a plain string or
 * `null` in `single` mode, a readonly string array in `multiple` mode. Values
 * the group writes (user commits and shape normalizations) always take the
 * mode's canonical shape.
 */
export type HellToggleGroupValue = string | null | readonly string[];

const HELL_TOGGLE_BASE_RECIPE =
  'inline-flex cursor-pointer select-none items-center justify-center gap-hell-2 whitespace-nowrap rounded-hell-md border border-transparent bg-transparent font-[family-name:inherit] font-medium leading-none text-hell-foreground shadow-none transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] data-hover:bg-hell-surface-muted data-press:bg-hell-surface-muted data-focus-visible:outline-2 data-focus-visible:outline-hell-focus-ring data-focus-visible:outline-offset-1 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:saturate-[0.65]';

const HELL_TOGGLE_SELECTED_RECIPE =
  'data-selected:border-hell-primary data-selected:bg-hell-primary data-selected:text-hell-primary-foreground data-[selected][data-hover]:border-hell-primary-hover data-[selected][data-hover]:bg-hell-primary-hover';

const HELL_TOGGLE_GROUP_ITEM_SELECTED_RECIPE =
  'hover:bg-hell-surface-subtle active:bg-hell-surface-muted data-selected:border-transparent data-selected:bg-hell-primary-soft data-selected:text-hell-primary-soft-foreground data-selected:shadow-none data-selected:hover:border-transparent data-selected:hover:bg-hell-primary-soft data-selected:hover:text-hell-primary-soft-foreground data-selected:active:border-transparent data-selected:active:bg-hell-primary-soft data-selected:active:text-hell-primary-soft-foreground data-disabled:hover:bg-transparent data-disabled:active:bg-transparent data-[selected][data-hover]:border-transparent data-[selected][data-hover]:bg-hell-primary-soft data-[selected][data-hover]:text-hell-primary-soft-foreground data-[selected][data-press]:border-transparent data-[selected][data-press]:bg-hell-primary-soft data-[selected][data-press]:text-hell-primary-soft-foreground data-[disabled][data-hover]:bg-transparent data-[disabled][data-press]:bg-transparent';

const HELL_TOGGLE_SIZE_RECIPE: Record<HellSize, string> = {
  xs: 'h-hell-control-xs px-hell-3 text-xs',
  sm: 'h-hell-control-sm px-hell-4 text-[13px]',
  md: 'h-hell-control-md px-hell-5 text-[13px]',
  lg: 'h-hell-control-lg px-hell-6 text-sm',
  xl: 'h-hell-control-xl px-hell-7 text-[15px]',
};

const HELL_TOGGLE_GROUP_RECIPE = {
  root: 'inline-flex gap-[2px] rounded-hell-md border border-hell-border bg-hell-surface-muted p-[3px]',
} satisfies HellRecipe<'root'>;

/** Reads a public value as the item list the toggle-group engine consumes. */
function hellToggleGroupSelection(value: HellToggleGroupValue): readonly string[] {
  if (value == null) return [];
  return typeof value === 'string' ? [value] : value;
}

/**
 * Single press-toggle button. Adds the on/off state from the toggle primitive.
 */
@Directive({
  selector: 'button[hellToggle]',
  hostDirectives: [
    {
      directive: NgpToggle,
      inputs: ['ngpToggleSelected:selected', 'ngpToggleDisabled:disabled'],
      outputs: ['ngpToggleSelectedChange:selectedChange'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': '"ghost"',
    type: 'button',
  },
})
export class HellToggle {
  /** Size of the toggle button. Defaults to `md`. */
  readonly size = input<HellSize>('md');

  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: (): HellRecipe<'root'> => ({
      root: [HELL_TOGGLE_BASE_RECIPE, HELL_TOGGLE_SIZE_RECIPE[this.size()], HELL_TOGGLE_SELECTED_RECIPE].join(
        ' ',
      ),
    }),
  });
}

/**
 * Groups `[hellToggleGroupItem]` buttons into a single- or multi-select
 * control.
 *
 * The `value` model is the group's one Control Value Authority, with one
 * canonical mode-dependent shape: `string | null` in `single` mode and a
 * readonly string array in `multiple` mode. Bind it one-way (`[value]` plus
 * `(valueChange)`), two-way (`[(value)]`), or through Angular forms — Signal
 * Forms `[formField]` via the `FormValueControl` contract, and
 * `formControl`/`ngModel` via Angular's built-in Signal Forms
 * interoperability. Non-canonical writes are normalized into the mode's
 * shape (in `single` mode an array keeps its first item; in `multiple` mode
 * a string becomes a one-item array), a mode change re-normalizes the
 * current value the same way, and the `null` default reads as an empty
 * selection in both modes.
 */
@Directive({
  selector: '[hellToggleGroup]',
  providers: [provideToggleGroupState(), provideRovingFocusGroupState({ inherit: true })],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '(focusout)': 'onFocusOut($event)',
    role: 'group',
  },
})
export class HellToggleGroup implements FormValueControl<HellToggleGroupValue> {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TOGGLE_GROUP_RECIPE,
  });

  /** Selection mode: `single` keeps at most one item selected, `multiple` any number. Defaults to `single`. */
  readonly type = input<'single' | 'multiple'>('single');

  /**
   * Committed selection — the one Control Value Authority. User commits write
   * it exactly once per interaction and emit `(valueChange)` with the mode's
   * canonical shape (`string | null` in `single` mode, a readonly string
   * array in `multiple` mode); external property, two-way, and form writes
   * flow in without re-emitting a commit. Defaults to `null`, which reads as
   * an empty selection in both modes.
   */
  readonly value = model<HellToggleGroupValue>(null);

  /** Whether the whole group is disabled. Also driven by bound forms. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Emits when focus leaves the group entirely. Angular forms listen to this
   * output to mark the bound field or control as touched.
   */
  readonly touch = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The model's selection as the item list the delegated engine consumes. */
  private readonly selectedItems = computed(() => [...hellToggleGroupSelection(this.value())]);

  /**
   * Headless toggle-group state and behavior from `ngpToggleGroup` — the
   * delegated Interaction State Machine for keyboard, focus, and item
   * behavior. Its value is controlled by the `value` model, so external
   * writes never re-emit a commit; one user toggle calls `onValueChange`
   * exactly once, which writes the model.
   */
  protected readonly state = ngpToggleGroup({
    rovingFocusGroup: ngpRovingFocusGroup({
      orientation: signal<NgpOrientation>('horizontal'),
      wrap: signal(true),
      disabled: this.disabled,
    }),
    type: this.type,
    value: this.selectedItems,
    disabled: this.disabled,
    onValueChange: (items) => this.value.set(this.asModeValue(items)),
  });

  constructor() {
    // Keep the public model in the mode's canonical shape: normalize
    // non-canonical external writes and re-normalize when the mode changes.
    // Canonical writes (the common case) never re-enter the model, and the
    // `null` default stays untouched in both modes (it reads as an empty
    // selection) so bound forms never observe a startup emission.
    effect(() => {
      const value = this.value();
      const canonical =
        value === null || (this.type() === 'multiple' ? Array.isArray(value) : typeof value === 'string');
      if (!canonical) {
        this.value.set(this.asModeValue(hellToggleGroupSelection(value)));
      }
    });
  }

  /** Shapes an item list into the mode's canonical public value. */
  private asModeValue(items: readonly string[]): HellToggleGroupValue {
    return this.type() === 'multiple' ? [...items] : items[0] ?? null;
  }

  /** Emits `touch` once focus leaves the group entirely. */
  protected onFocusOut(event: FocusEvent): void {
    if (!containsNode(this.host.nativeElement, event.relatedTarget)) {
      this.touch.emit();
    }
  }
}

/**
 * ng-primitives <= 0.124 hardcodes `role="radio"` and `aria-checked` on
 * toggle-group items regardless of the group's `type`, but items in a
 * `multiple` group are toggle buttons, not radios: they need native button
 * semantics with `aria-pressed`. Upstream re-writes `aria-checked` from a
 * render effect on every selection change, so a host binding cannot remove
 * it; Hell corrects the attributes from a later-registered render effect
 * (host directives construct first, so this one runs after upstream's each
 * flush) until upstream derives the semantics from the group type. Tracked
 * upstream as https://github.com/ng-primitives/ng-primitives/issues/813.
 */
function toggleGroupItemModeAria(): void {
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const group = inject(HellToggleGroup, { optional: true });
  const item = injectToggleGroupItemState();

  const syncModeAria = () => {
    // Read `selected` in both modes so this effect re-runs (after upstream's)
    // whenever upstream re-writes `aria-checked`.
    const selected = `${item().selected()}`;
    if (group?.type() === 'multiple') {
      element.removeAttribute('role');
      element.removeAttribute('aria-checked');
      element.setAttribute('aria-pressed', selected);
    } else {
      element.setAttribute('role', 'radio');
      element.setAttribute('aria-checked', selected);
      element.removeAttribute('aria-pressed');
    }
  };

  // Mirror ng-primitives' isomorphic scheduling so the write order also holds
  // during server rendering, where upstream binds via plain effects.
  if (isPlatformBrowser(inject(PLATFORM_ID))) {
    afterRenderEffect(syncModeAria);
  } else {
    effect(syncModeAria);
  }
}

/** Single selectable button within a `[hellToggleGroup]`. */
@Directive({
  selector: 'button[hellToggleGroupItem]',
  hostDirectives: [
    {
      directive: NgpToggleGroupItem,
      inputs: ['ngpToggleGroupItemValue:value', 'ngpToggleGroupItemDisabled:disabled'],
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': '"ghost"',
    type: 'button',
  },
})
export class HellToggleGroupItem {
  /** Size of the toggle button. Defaults to `sm`. */
  readonly size = input<HellSize>('sm');

  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: (): HellRecipe<'root'> => ({
      root: [
        HELL_TOGGLE_BASE_RECIPE,
        HELL_TOGGLE_SIZE_RECIPE[this.size()],
        HELL_TOGGLE_GROUP_ITEM_SELECTED_RECIPE,
      ].join(' '),
    }),
  });

  constructor() {
    toggleGroupItemModeAria();
  }
}
