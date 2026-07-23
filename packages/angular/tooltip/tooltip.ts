import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  InjectionToken,
  Injector,
  TemplateRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
  untracked,
  type Provider,
  type Signal,
} from '@angular/core';
import {
  NgpTooltip,
  ngpTooltipTrigger,
  provideTooltipTriggerState,
  type NgpTooltipPlacement,
} from 'ng-primitives/tooltip';
import {
  NgpOverlay,
  coerceFlip,
  coerceOffset,
  coerceShift,
  type NgpFlip,
  type NgpFlipInput,
  type NgpOffset,
  type NgpOffsetInput,
  type NgpOverlayContent,
  type NgpPosition,
  type NgpShift,
  type NgpShiftInput,
} from 'ng-primitives/portal';
import { hellPartStyler, type HellRecipe, type HellUiInput } from 'hell-ui/core';
import { hellRegisterFloatingHost } from 'hell-ui/internal/core';

const HELL_TOOLTIP_RECIPE = {
  root: 'pointer-events-auto absolute max-w-[min(240px,calc(100vw_-_var(--spacing-hell-8)))] rounded-hell-sm bg-[#1c222a] px-2 py-1 text-xs font-medium leading-[var(--text-xs--line-height)] text-white shadow-hell-md [overflow-wrap:anywhere] animate-[hell-pop-in_var(--hell-duration-fast)_var(--ease-hell-out)] motion-reduce:animate-none',
} satisfies HellRecipe<'root'>;

/**
 * Injector-scoped defaults for `HellTooltip` behavior and positioning policy.
 *
 * Every key is optional: a partial defaults object refines the nearest
 * ancestor policy instead of resetting unspecified values, and a local trigger
 * input always wins over the effective scoped default. Hell guarantees a
 * 500&nbsp;ms show delay, 0&nbsp;ms hide delay, and 300&nbsp;ms cooldown when
 * nothing overrides them.
 *
 * Content, styling, disabled state, host-text fallback, template context,
 * hoverability, and Escape dismissal are deliberately not configurable here;
 * `anchor` and programmatic `position` stay per-trigger inputs because they
 * reference concrete elements and coordinates rather than scope policy.
 */
export interface HellTooltipDefaults {
  /** Preferred placement of the surface relative to the trigger. */
  readonly placement?: NgpTooltipPlacement;
  /** Distance between the surface and the trigger, as the upstream offset shape. */
  readonly offset?: NgpOffset;
  /** Delay in milliseconds before the tooltip shows. */
  readonly showDelay?: number;
  /** Delay in milliseconds before the tooltip hides. */
  readonly hideDelay?: number;
  /** Cooldown in milliseconds during which moving between tooltips skips the show delay. */
  readonly cooldown?: number;
  /** Flip behavior when there is not enough space for the preferred placement. */
  readonly flip?: NgpFlip;
  /** Shift behavior that keeps the surface in view. */
  readonly shift?: NgpShift;
  /** Element or selector the overlay is appended to. */
  readonly container?: HTMLElement | string | null;
  /** Whether tooltips only show when the trigger element overflows. */
  readonly showOnOverflow?: boolean;
  /** Whether to track the trigger position on every animation frame. */
  readonly trackPosition?: boolean;
  /** How the tooltip behaves when the window is scrolled. */
  readonly scrollBehavior?: 'reposition' | 'close';
}

const HELL_TOOLTIP_DEFAULTS = new InjectionToken<HellTooltipDefaults>('HELL_TOOLTIP_DEFAULTS', {
  providedIn: 'root',
  factory: () => ({}),
});

/**
 * Provides partial `HellTooltip` defaults for an injector scope. Specified
 * keys merge over the nearest ancestor provider (or Hell's guaranteed
 * defaults); unspecified and explicitly `undefined` keys keep their inherited
 * values. Local trigger inputs take precedence over every provider.
 */
export function provideHellTooltipDefaults(defaults: HellTooltipDefaults): Provider {
  return {
    provide: HELL_TOOLTIP_DEFAULTS,
    useFactory: (): HellTooltipDefaults => ({
      ...(inject(HELL_TOOLTIP_DEFAULTS, { optional: true, skipSelf: true }) ?? {}),
      ...hellSpecifiedTooltipDefaults(defaults),
    }),
  };
}

/** Drops `undefined` entries so unspecified keys never reset ancestor values. */
function hellSpecifiedTooltipDefaults(defaults: HellTooltipDefaults): HellTooltipDefaults {
  return Object.fromEntries(Object.entries(defaults).filter(([, value]) => value !== undefined));
}

/** Hell-guaranteed timing when neither a provider nor a local input overrides it. */
const HELL_TOOLTIP_GUARANTEED_TIMING = {
  showDelay: 500,
  hideDelay: 0,
  cooldown: 300,
} as const;

/** Coerces an optional numeric input, keeping absence (`null`/`undefined`) as unset. */
const hellOptionalNumber = (value: unknown): number | undefined =>
  value == null ? undefined : numberAttribute(value);

/** Coerces an optional boolean input, keeping absence (`null`/`undefined`) as unset. */
const hellOptionalBoolean = (value: unknown): boolean | undefined =>
  value == null ? undefined : booleanAttribute(value);

/** Coerces an optional offset input, keeping absence (`null`/`undefined`) as unset. */
const hellOptionalOffset = (value: NgpOffsetInput | null | undefined): NgpOffset | undefined =>
  value == null ? undefined : coerceOffset(value);

/** Normalized present content: absence (`''`, `null`, `undefined`) collapses to `null`. */
type HellTooltipPresentContent = string | TemplateRef<unknown> | null;

/**
 * Module-private content channel between the trigger and the internal overlay
 * content host, keeping the presentation split (implicit string surface vs
 * consumer template) off the public trigger surface.
 */
const HELL_TOOLTIP_CONTENT_STATE = new WeakMap<
  HellTooltip,
  {
    readonly template: Signal<TemplateRef<unknown> | null>;
    readonly text: Signal<string>;
  }
>();

/**
 * Tooltip trigger for any host element. Bind `[hellTooltip]` to a plain string
 * for the implicit default Tooltip Surface, or to an `ng-template` containing
 * a consumer-authored `HellTooltipSurface` for rich, separately styled
 * presentation. `null`, `undefined`, and the empty string are absent content:
 * they close and disable the interaction. The trigger never adds focusability,
 * never derives the host's accessible name from content, and never opens on a
 * natively disabled control.
 *
 * Lifecycle, overlay, positioning, timing, hover bridging, Escape handling,
 * and `aria-describedby` are delegated to ng-primitives, and the upstream
 * behavior and positioning capabilities stay reachable through the trigger's
 * inputs under upstream types. Unset inputs fall back to the nearest
 * `provideHellTooltipDefaults` policy, then to Hell's guaranteed defaults.
 * The surface is always hoverable and Escape always dismisses without moving
 * focus.
 */
@Directive({
  selector: '[hellTooltip]',
  exportAs: 'hellTooltip',
  providers: [provideTooltipTriggerState({ inherit: false })],
})
export class HellTooltip {
  /** Tooltip content: a string, a template containing a Tooltip Surface, or absent. */
  readonly content = input<string | TemplateRef<unknown> | null | undefined>(undefined, {
    alias: 'hellTooltip',
  });
  /** Preferred placement of the surface. Unset uses the scoped default, then `top`. */
  readonly placement = input<NgpTooltipPlacement | undefined>(undefined);
  /** Distance between the surface and the trigger. Unset uses the scoped default, then `4`. */
  readonly offset = input(undefined, { transform: hellOptionalOffset });
  /** Flip behavior when the preferred placement lacks space. Unset uses the scoped default, then `true`. */
  readonly flip = input<NgpFlip, NgpFlipInput | null | undefined>(undefined, {
    transform: coerceFlip,
  });
  /** Shift behavior keeping the surface in view. Unset uses the scoped default, then the engine default. */
  readonly shift = input<NgpShift, NgpShiftInput | null | undefined>(undefined, {
    transform: coerceShift,
  });
  /** Show delay in milliseconds. Unset uses the scoped default, then the guaranteed `500`. */
  readonly showDelay = input(undefined, { transform: hellOptionalNumber });
  /** Hide delay in milliseconds. Unset uses the scoped default, then the guaranteed `0`. */
  readonly hideDelay = input(undefined, { transform: hellOptionalNumber });
  /** Cooldown in milliseconds that skips the show delay when moving between tooltips. Unset uses the scoped default, then the guaranteed `300`. */
  readonly cooldown = input(undefined, { transform: hellOptionalNumber });
  /** Element or selector the overlay is appended to. Unset uses the scoped default, then `body`. */
  readonly container = input<HTMLElement | string | null | undefined>(undefined);
  /** Whether the tooltip only shows when the trigger overflows. Unset uses the scoped default, then `false`. */
  readonly showOnOverflow = input(undefined, { transform: hellOptionalBoolean });
  /** Anchor element the surface is positioned against instead of the trigger. */
  readonly anchor = input<HTMLElement | null>(null);
  /** Programmatic coordinates the surface is positioned at instead of the trigger. */
  readonly position = input<NgpPosition | null>(null);
  /** Whether to track the trigger position on every animation frame. Unset uses the scoped default, then `false`. */
  readonly trackPosition = input(undefined, { transform: hellOptionalBoolean });
  /** Scroll behavior of an open tooltip. Unset uses the scoped default, then `reposition`. */
  readonly scrollBehavior = input<'reposition' | 'close' | undefined>(undefined);
  /** Emits the new open state whenever the tooltip shows or hides. */
  readonly openChange = output<boolean>();

  /** Effective scoped defaults from the nearest `provideHellTooltipDefaults` chain. */
  private readonly defaults = inject(HELL_TOOLTIP_DEFAULTS);

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Present content after absence normalization. */
  private readonly presentContent = computed<HellTooltipPresentContent>(() => {
    const content = this.content();
    if (content instanceof TemplateRef) return content;
    return typeof content === 'string' && content !== '' ? content : null;
  });

  /** Live native `:disabled` state of the host, so disabled controls never open. */
  private readonly hostDisabled = hellHostNativeDisabled(this.element);

  /**
   * Delegated ng-primitives Interaction State Machine. The engine's content is
   * the one constant internal content host, so present-to-present content
   * changes re-render inside the open overlay instead of recreating it, and
   * absent content disables the interaction without a public `disabled` input.
   */
  private readonly state = ngpTooltipTrigger<unknown>({
    tooltip: signal<NgpOverlayContent<unknown> | string | null>(HellTooltipContentHost),
    disabled: computed(() => this.presentContent() === null || this.hostDisabled()),
    placement: computed(() => this.placement() ?? this.defaults.placement ?? 'top'),
    offset: computed(() => this.offset() ?? this.defaults.offset ?? 4),
    flip: computed(() => this.flip() ?? this.defaults.flip ?? true),
    shift: computed(() => this.shift() ?? this.defaults.shift),
    showDelay: computed(
      () => this.showDelay() ?? this.defaults.showDelay ?? HELL_TOOLTIP_GUARANTEED_TIMING.showDelay,
    ),
    hideDelay: computed(
      () => this.hideDelay() ?? this.defaults.hideDelay ?? HELL_TOOLTIP_GUARANTEED_TIMING.hideDelay,
    ),
    cooldown: computed(
      () => this.cooldown() ?? this.defaults.cooldown ?? HELL_TOOLTIP_GUARANTEED_TIMING.cooldown,
    ),
    container: computed(() => this.container() ?? this.defaults.container ?? 'body'),
    showOnOverflow: computed(() => this.showOnOverflow() ?? this.defaults.showOnOverflow ?? false),
    anchor: this.anchor,
    position: this.position,
    trackPosition: computed(() => this.trackPosition() ?? this.defaults.trackPosition ?? false),
    scrollBehavior: computed(() => this.scrollBehavior() ?? this.defaults.scrollBehavior ?? 'reposition'),
    // Hoverability is an accessibility invariant, not configuration: the
    // pointer can always travel onto the surface.
    hoverableContent: signal(true),
    // The host's text is never tooltip content.
    useTextContent: signal(false),
  });

  /** Whether the tooltip is currently open (Anchored Surface Contract). */
  readonly open = this.state.open;

  constructor() {
    HELL_TOOLTIP_CONTENT_STATE.set(this, {
      template: computed(() => {
        const content = this.presentContent();
        return content instanceof TemplateRef ? content : null;
      }),
      text: computed(() => {
        const content = this.presentContent();
        return typeof content === 'string' ? content : '';
      }),
    });

    let previousOpen = false;
    effect(() => {
      const open = this.open();
      if (open !== previousOpen) {
        previousOpen = open;
        this.openChange.emit(open);
      }
    });

    // Absent content closes immediately: the interaction is disabled, so a
    // delayed close would report `open` with nothing to show.
    effect(() => {
      if (this.presentContent() !== null) return;
      untracked(() => this.state.overlay()?.hideImmediate());
    });

    inject(DestroyRef).onDestroy(() => this.state.destroy());
  }

  /** Shows the tooltip unless content is absent or the host is natively disabled. */
  show(): void {
    if (this.presentContent() === null || this.hostDisabled()) return;
    this.state.show();
  }

  /** Hides the tooltip. */
  hide(): void {
    this.state.hide();
  }
}

/**
 * Tooltip surface: the displayed hint region. Implicit string surfaces and
 * consumer-authored template surfaces render the same public selector,
 * `role="tooltip"`, root Public Part marker, recipe, and Floating Scope
 * registration; `ui` styles only this surface, never the trigger host. The
 * surface is always hoverable, and its entrance animation is suppressed under
 * reduced-motion preferences.
 */
@Directive({
  selector: '[hellTooltipSurface]',
  hostDirectives: [NgpTooltip],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    role: 'tooltip',
  },
})
export class HellTooltipSurface {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_TOOLTIP_RECIPE,
  });

  constructor() {
    hellRegisterFloatingHost();
    // The surface renders nested inside the internal content host rather than
    // as the portal root, so it registers itself as the overlay's positioning
    // outlet; the engine re-anchors an open overlay when the outlet changes.
    inject(NgpOverlay, { optional: true })?.registerOutletElement(
      inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
    );
  }
}

/**
 * Internal overlay content for `HellTooltip`: the single stable content the
 * delegated overlay ever renders, so string/template transitions are pure
 * presentation changes inside one open overlay — never a close/open lifecycle
 * transition. A present string renders the implicit Tooltip Surface; a
 * template renders consumer-authored markup containing an explicit
 * `HellTooltipSurface`.
 */
@Component({
  imports: [NgTemplateOutlet, HellTooltipSurface],
  template: `
    @if (template(); as template) {
      <ng-container
        [ngTemplateOutlet]="template"
        [ngTemplateOutletInjector]="viewInjector"
      />
    } @else if (text()) {
      <div hellTooltipSurface>{{ text() }}</div>
    }
  `,
  host: { style: 'display: contents' },
})
class HellTooltipContentHost {
  private readonly content = hellTooltipContentState(inject(HellTooltip));
  protected readonly template = this.content.template;
  protected readonly text = this.content.text;
  /**
   * Consumer templates resolve DI through their declaration site, so the
   * embedded view gets this host's injector to reach the overlay-scoped
   * providers and the owning trigger — the same chain an explicit template
   * portal root receives.
   */
  protected readonly viewInjector = inject(Injector);

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    // The engine measures its portal root (e.g. for the hover bridge), but
    // this host is a zero-box `display: contents` wrapper; delegate
    // measurement to the rendered surface.
    element.getBoundingClientRect = () =>
      element.firstElementChild?.getBoundingClientRect() ?? new DOMRect();
  }
}

function hellTooltipContentState(trigger: HellTooltip): {
  readonly template: Signal<TemplateRef<unknown> | null>;
  readonly text: Signal<string>;
} {
  const state = HELL_TOOLTIP_CONTENT_STATE.get(trigger);
  if (!state) throw new Error('hellTooltip content state is not initialized.');
  return state;
}

/** Tracks the host's native `:disabled` state, including runtime toggles. */
function hellHostNativeDisabled(element: HTMLElement): Signal<boolean> {
  const disabled = signal(element.matches(':disabled'));
  const observerCtor = element.ownerDocument.defaultView?.MutationObserver;
  if (observerCtor) {
    const observer = new observerCtor(() => disabled.set(element.matches(':disabled')));
    observer.observe(element, { attributes: true, attributeFilter: ['disabled'] });
    inject(DestroyRef).onDestroy(() => observer.disconnect());
  }
  return disabled.asReadonly();
}
