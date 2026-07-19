import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DestroyRef,
  Directive,
  ElementRef,
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
  type Signal,
} from '@angular/core';
import {
  NgpTooltip,
  injectTooltipTriggerState,
  ngpTooltipTrigger,
  provideTooltipTriggerState,
  type NgpTooltipPlacement,
} from 'ng-primitives/tooltip';
import { NgpOverlay, coerceOffset, type NgpOverlayContent } from 'ng-primitives/portal';
import { hellPartStyler, type HellRecipe, type HellUiInput } from '@hell-ui/angular/core';
import { hellRegisterFloatingHost } from '@hell-ui/angular/internal/core';

const HELL_TOOLTIP_RECIPE = {
  root: 'pointer-events-none absolute max-w-[min(240px,calc(100vw_-_var(--spacing-hell-8)))] rounded-hell-sm bg-[#1c222a] px-2 py-1 text-xs font-medium leading-[var(--text-xs--line-height)] text-white shadow-hell-md [overflow-wrap:anywhere] data-hoverable:pointer-events-auto animate-[hell-pop-in_var(--hell-duration-fast)_var(--ease-hell-out)]',
} satisfies HellRecipe<'root'>;

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
  /** Preferred placement of the surface relative to the trigger. Defaults to `top`. */
  readonly placement = input<NgpTooltipPlacement>('top');
  /** Distance in pixels between the surface and the trigger. Defaults to `4`. */
  readonly offset = input(4, { transform: coerceOffset });
  /** Delay in milliseconds before the tooltip shows. Defaults to `0`. */
  readonly showDelay = input(0, { transform: numberAttribute });
  /** Delay in milliseconds before the tooltip hides. Defaults to `500`. */
  readonly hideDelay = input(500, { transform: numberAttribute });
  /** Element or selector the overlay is appended to. Defaults to `body`. */
  readonly container = input<HTMLElement | string | null>('body');
  /** Whether the tooltip only shows when the trigger element overflows. Defaults to `false`. */
  readonly showOnOverflow = input(false, { transform: booleanAttribute });
  /** Whether hovering the surface keeps the tooltip open. Defaults to `false`. */
  readonly hoverableContent = input(false, { transform: booleanAttribute });
  /** Emits the new open state whenever the tooltip shows or hides. */
  readonly openChange = output<boolean>();

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
    placement: this.placement,
    offset: this.offset,
    showDelay: this.showDelay,
    hideDelay: this.hideDelay,
    container: this.container,
    showOnOverflow: this.showOnOverflow,
    hoverableContent: this.hoverableContent,
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
 * registration; `ui` styles only this surface, never the trigger host.
 */
@Directive({
  selector: '[hellTooltipSurface]',
  hostDirectives: [NgpTooltip],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-hoverable]': 'tooltipTrigger().hoverableContent() ? "" : null',
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
  /** Trigger state of the associated `hellTooltip`. */
  protected readonly tooltipTrigger = injectTooltipTriggerState();

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
