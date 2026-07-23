import {
  DestroyRef,
  Directive,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import type { FocusOrigin } from '@angular/cdk/a11y';
import { ngpFocusTrap, provideFocusTrapState } from 'ng-primitives/focus-trap';
import {
  ngpPopover,
  ngpPopoverTrigger,
  providePopoverState,
  providePopoverTriggerState,
  type NgpPopoverPlacement,
} from 'ng-primitives/popover';
import {
  coerceFlip,
  coerceOffset,
  coerceShift,
  dismissGuardAttribute,
  provideControlContainerIsolation,
  type NgpDismissGuard,
  type NgpDismissGuardInput,
  type NgpOverlay,
  type NgpOverlayContent,
} from 'ng-primitives/portal';
import { hellPartStyler, type HellRecipe, type HellUiInput } from 'hell-ui/core';
import {
  HELL_FLOATING_SCOPE,
  HellFloatingScopeRegistry,
  hellRegisterFloatingElement,
  hellResolveElementTarget,
  HellNativeInteractiveDisabledGuard,
  type HellFloatingScope,
} from 'hell-ui/internal/core';
import {
  HELL_FLOATING_POP_IN,
  HELL_FLOATING_SURFACE,
  HELL_FLOATING_Z_POPOVER,
} from 'hell-ui/internal/floating';

const HELL_POPOVER_RECIPE = {
  root: `absolute ${HELL_FLOATING_Z_POPOVER} max-w-[320px] ${HELL_FLOATING_SURFACE} p-hell-4 text-[13px] text-hell-foreground ${HELL_FLOATING_POP_IN}`,
} satisfies HellRecipe<'root'>;

/**
 * Module-private scope per trigger: the panel provides it to its descendants
 * (so nested Hell floating surfaces register as inside) and the trigger's
 * dismissal guards consult it. The ngp overlay registry cannot link portaled
 * child overlays to their parent through the embedded-view injector, so Hell
 * owns this half of the nesting contract.
 */
const HELL_POPOVER_PANEL_SCOPES = new WeakMap<HellPopoverTrigger, HellFloatingScopeRegistry>();

function hellPopoverPanelScope(trigger: HellPopoverTrigger): HellFloatingScopeRegistry {
  let scope = HELL_POPOVER_PANEL_SCOPES.get(trigger);
  if (!scope) {
    scope = new HellFloatingScopeRegistry();
    HELL_POPOVER_PANEL_SCOPES.set(trigger, scope);
  }
  return scope;
}

/**
 * Trigger for an `ng-template` popover. Bind `[hellPopoverTrigger]="template"`
 * and optionally pass placement, offset, flip, shift, container, disabled,
 * close policy, `anchor`, `boundary`, and `trapFocus` inputs.
 *
 * With `trapFocus` (the default) the popover is modal: focus moves into the
 * panel while it is open and returns to the trigger on close. With
 * `trapFocus` false the popover is an anchored, non-modal, light-dismiss
 * surface: focus stays where it is, outside clicks and outside focus close
 * the panel without stealing focus, and only Escape restores focus to the
 * trigger — use it when the surrounding context must remain interactive.
 */
@Directive({
  selector: 'button[hellPopoverTrigger], a[hellPopoverTrigger]',
  exportAs: 'hellPopoverTrigger',
  providers: [providePopoverTriggerState({ inherit: false })],
  host: {
    '[attr.type]': 'nativeButtonType()',
    '[attr.disabled]': 'nativeButtonDisabled(disabled())',
    '[attr.aria-disabled]': 'anchorAriaDisabled(disabled())',
    '[attr.tabindex]': 'disabledAnchorTabIndex(disabled())',
    '(click)': 'preventActionAnchorNavigation($event, disabled())',
    '(keydown.enter)': 'preventDisabledAnchor($event, disabled())',
  },
})
export class HellPopoverTrigger extends HellNativeInteractiveDisabledGuard {
  /** Template or component rendered as the floating popover surface. */
  readonly popover = input<NgpOverlayContent<unknown> | undefined>(undefined, {
    alias: 'hellPopoverTrigger',
  });
  /** Whether the trigger is disabled. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Preferred placement relative to the reference element. Defaults to `bottom`. */
  readonly placement = input<NgpPopoverPlacement>('bottom');
  /** Distance in pixels between the panel and its reference element. Defaults to `4`. */
  readonly offset = input(4, { transform: coerceOffset });
  /** Whether to flip to the opposite side when there's insufficient space. Defaults to `true`. */
  readonly flip = input(true, { transform: coerceFlip });
  /** Shift behavior keeping the panel in view; `undefined` uses the overlay default. */
  readonly shift = input(undefined, { transform: coerceShift });
  /** Element or selector the overlay is appended to. Defaults to `body`. */
  readonly container = input<HTMLElement | string | null>('body');
  /** Whether pressing Escape closes the panel; also accepts a guard function. Defaults to `true`. */
  readonly closeOnEscape = input<NgpDismissGuard<KeyboardEvent>, NgpDismissGuardInput<KeyboardEvent>>(
    true,
    { transform: dismissGuardAttribute },
  );
  /** Whether clicking or focusing outside the panel closes it; also accepts a guard function. Defaults to `true`. */
  readonly closeOnOutsideClick = input<NgpDismissGuard<Element>, NgpDismissGuardInput<Element>>(
    true,
    { transform: dismissGuardAttribute },
  );
  /** Element the panel is positioned against, if different from the trigger. */
  readonly anchor = input<HTMLElement | ElementRef<HTMLElement> | null>(null);
  /** Element defining the "inside" region for light-dismiss beyond the trigger and panel. */
  readonly boundary = input<HTMLElement | ElementRef<HTMLElement> | null>(null);
  /** Whether the panel traps focus while open (modal). Defaults to `true`. */
  readonly trapFocus = input(true, { transform: booleanAttribute });
  /** Emits the new open state whenever the panel opens or closes. */
  readonly openChange = output<boolean>();

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly floatingScope = inject<HellFloatingScope | null>(HELL_FLOATING_SCOPE, {
    optional: true,
  });

  /** Popover engine state driven by the inputs above. */
  private readonly state = ngpPopoverTrigger({
    popover: this.popover,
    disabled: this.disabled,
    placement: this.placement,
    offset: this.offset,
    flip: this.flip,
    shift: this.shift,
    container: this.container,
    // Guards read the live inputs per event, so boundary and policy changes
    // apply to an already-open panel.
    closeOnOutsideClick: computed<NgpDismissGuard<Element>>(() => (target) => {
      if (!this.isOutsideInteraction(target)) return false;
      return evaluateDismissPolicy(this.closeOnOutsideClick(), target);
    }),
    closeOnEscape: computed<NgpDismissGuard<KeyboardEvent>>(
      () => (event) => evaluateDismissPolicy(this.closeOnEscape(), event),
    ),
    anchor: computed(() => hellResolveElementTarget(this.anchor())),
    onOpenChange: (open) => this.openChange.emit(open),
  });

  /** Whether the popover panel is currently open. */
  readonly open = this.state.open;

  constructor() {
    super();
    // Modal popovers always restore focus on close (the engine default);
    // non-modal ones restore only for keyboard (Escape) closes so an outside
    // click never yanks focus back to the trigger.
    effect(() => {
      const overlay: NgpOverlay<unknown> | null = this.state.overlay();
      if (!overlay) return;
      untracked(() =>
        overlay.updateConfig({
          restoreFocus: computed(
            () => this.trapFocus() || overlay.closeOrigin() === 'keyboard',
          ),
        }),
      );
    });
    // Non-modal panels also dismiss when focus lands outside the trigger,
    // panel, anchor, and boundary — the outside-focus half of light dismiss.
    effect((onCleanup) => {
      if (this.trapFocus() || !this.open() || this.closeOnOutsideClick() === false) return;
      const overlay = untracked(() => this.state.overlay());
      if (!overlay) return;
      const document = this.element.nativeElement.ownerDocument;
      const onFocusIn = (focusEvent: FocusEvent) => {
        const target = focusEvent.target;
        if (!(target instanceof Element) || !this.isOutsideInteraction(target)) return;
        const decision = evaluateDismissPolicy(this.closeOnOutsideClick(), target);
        if (decision === true) {
          void this.state.hide('program');
        } else if (decision instanceof Promise) {
          void decision.then((shouldClose) => {
            if (shouldClose && this.open()) void this.state.hide('program');
          });
        }
      };
      document.addEventListener('focusin', onFocusIn, true);
      onCleanup(() => document.removeEventListener('focusin', onFocusIn, true));
    });
  }

  /** Opens the popover. */
  show(): Promise<void> {
    return this.state.show();
  }

  /** Closes the popover, optionally restoring focus to the given origin. */
  hide(origin: FocusOrigin = 'program'): Promise<void> {
    return this.state.hide(origin);
  }

  /**
   * Whether `target` is outside the trigger, panel, anchor, boundary, and any
   * nested Hell floating surface — a menu or child popover opened from inside
   * the panel must count as inside. Nested surfaces reach this trigger through
   * the panel-provided Floating Scope; surfaces registered with a surrounding
   * scope count as well.
   */
  private isOutsideInteraction(target: Element): boolean {
    if (this.element.nativeElement.contains(target)) return false;
    const anchor = hellResolveElementTarget(this.anchor());
    if (anchor?.contains(target)) return false;
    const boundary = hellResolveElementTarget(this.boundary());
    if (boundary?.contains(target)) return false;
    if (hellPopoverPanelScope(this).containsFloatingTarget(target)) return false;
    if (this.floatingScope?.containsFloatingTarget(target)) return false;
    const overlay = this.state.overlay();
    return !overlay?.getElements().some((element) => element.contains(target));
  }
}

/**
 * Floating popover surface. Place inside the trigger template as
 * `<div hellPopover>...</div>`; it registers with any active Hell Floating
 * Scope so nested menus/popovers count as inside interactions. The owning
 * trigger's `trapFocus` input decides whether the surface traps focus.
 */
@Directive({
  selector: '[hellPopover]',
  providers: [
    providePopoverState(),
    provideFocusTrapState(),
    provideControlContainerIsolation(),
    {
      // Descendants (nested menus, selects, child popovers) register with the
      // owning trigger's panel scope so its dismissal guards count them as
      // inside even though their overlays portal outside this panel's DOM.
      // Without a Hell trigger the surrounding scope keeps flowing through.
      provide: HELL_FLOATING_SCOPE,
      useFactory: () => {
        const trigger = inject(HellPopoverTrigger, { optional: true });
        if (trigger) return hellPopoverPanelScope(trigger);
        return inject(HELL_FLOATING_SCOPE, { optional: true, skipSelf: true });
      },
    },
  ],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.aria-modal]': 'ariaModal()',
  },
})
export class HellPopover {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_POPOVER_RECIPE,
  });

  /** The Hell trigger owning this panel, resolved through the overlay's injector. */
  private readonly trigger = inject(HellPopoverTrigger, { optional: true });

  /** `aria-modal="false"` only for non-modal panels; modal panels keep the engine default. */
  protected readonly ariaModal = computed(() =>
    (this.trigger?.trapFocus() ?? true) ? null : 'false',
  );

  constructor() {
    ngpPopover({});
    ngpFocusTrap({ disabled: computed(() => !(this.trigger?.trapFocus() ?? true)) });
    // Register with the surrounding scope (skipping the panel's own provider)
    // so enclosing surfaces count this panel as inside, and adopt this
    // panel's scope there so containment stays transitive at any depth.
    const parentScope = inject<HellFloatingScope | null>(HELL_FLOATING_SCOPE, {
      optional: true,
      skipSelf: true,
    });
    const destroyRef = inject(DestroyRef);
    hellRegisterFloatingElement(
      parentScope,
      inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
      destroyRef,
    );
    if (this.trigger && parentScope instanceof HellFloatingScopeRegistry) {
      const release = parentScope.adoptChildScope(hellPopoverPanelScope(this.trigger));
      destroyRef.onDestroy(release);
    }
  }
}

function evaluateDismissPolicy<T>(
  policy: NgpDismissGuard<T>,
  target: T,
): boolean | Promise<boolean> {
  return typeof policy === 'function' ? policy(target) : policy;
}
