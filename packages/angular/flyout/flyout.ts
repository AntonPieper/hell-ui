import { hellPartStyler, type HellRecipe, type HellUiInput } from '@hell-ui/angular/core';
import { HELL_FLOATING_SURFACE_SHELL } from '@hell-ui/angular/internal/floating';
import { HELL_FLOATING_SCOPE, hellResolveElementTarget, type HellFloatingScope } from '@hell-ui/angular/internal/core';
import {
  HellFloatingInteractionController,
  hellDismissOn,
  hellEscapeKey,
  hellGuardDismiss,
  hellOutsideClick,
  hellOutsideFocus,
  hellWithDismissEffect,
} from '@hell-ui/angular/internal/core';
import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  effect,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { HellNativeInteractiveDisabledGuard } from '@hell-ui/angular/internal/core';
import {
  autoUpdate,
  computePosition,
  flip as floatingFlip,
  offset as floatingOffset,
  shift as floatingShift,
  type Middleware,
  type Placement,
} from '@floating-ui/dom';

let nextFlyoutId = 0;

// Shares the elevated surface shell but keeps its own hairline border (no
// `border-solid`), higher z fallback, and `hell-flyout-in` animation local —
// see the per-atom notes in internal/floating/floating-presentation.ts.
const HELL_FLYOUT_RECIPE = {
  root: `fixed z-[var(--hell-z-popover,1000)] max-w-[min(320px,calc(100vw_-_(var(--spacing-hell-4)*2)))] ${HELL_FLOATING_SURFACE_SHELL} border border-hell-border text-hell-foreground animate-[hell-flyout-in_var(--hell-duration-fast,150ms)_var(--ease-hell-out,ease)]`,
} satisfies HellRecipe<'root'>;

/**
 * Trigger half of the flyout pattern. Owns the open state. Render the panel
 * (any element with `hellFlyout`) conditionally via `@if (trigger.open())`.
 *
 * Flyout = anchored, non-modal, light-dismiss surface that does NOT trap
 * focus. Use when the surrounding context (e.g. an audio player's controls)
 * must remain interactive while the panel is open. Use `HellPopover` /
 * `HellDialog` instead when you want a focus trap.
 */
@Directive({
  selector: 'button[hellFlyoutTrigger], a[hellFlyoutTrigger]',
  exportAs: 'hellFlyoutTrigger',
  host: {
    '[attr.type]': 'nativeButtonType()',
    '[attr.aria-haspopup]': '"dialog"',
    '[attr.aria-expanded]': 'open()',
    '[attr.aria-controls]': 'open() ? panelId : null',
    '[attr.data-state]': 'open() ? "open" : "closed"',
    '[attr.disabled]': 'nativeButtonDisabled(disabled())',
    '[attr.aria-disabled]': 'anchorAriaDisabled(disabled())',
    '[attr.tabindex]': 'disabledAnchorTabIndex(disabled())',
    '(click)': 'onTriggerClick($event)',
    '(keydown.enter)': 'preventDisabledAnchor($event, disabled())',
  },
})
export class HellFlyoutTrigger extends HellNativeInteractiveDisabledGuard {
  /** Native element of the trigger — used as default boundary by `HellFlyout`. */
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Whether the trigger is disabled. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Emits the new open state whenever the panel opens or closes. */
  readonly openChange = output<boolean>();

  /** Stable id wired into trigger `aria-controls` and panel `id`. */
  readonly panelId = `hell-flyout-${++nextFlyoutId}`;

  private readonly _open = signal(false);
  private readonly _openVersion = signal(0);
  /** Whether the flyout panel is currently open. */
  readonly open = this._open.asReadonly();
  /** Counter bumped on every open/close, used to key the panel's floating-UI lifecycle. */
  readonly openVersion = this._openVersion.asReadonly();

  /** Opens the flyout panel, unless disabled or already open. */
  show(): void {
    if (this.disabled() || this._open()) return;
    this._openVersion.update((version) => version + 1);
    this._open.set(true);
    this.openChange.emit(true);
  }

  /** Closes the flyout panel, if currently open. */
  hide(): void {
    if (!this._open()) return;
    this._openVersion.update((version) => version + 1);
    this._open.set(false);
    this.openChange.emit(false);
  }

  /** Toggles the flyout panel between open and closed. */
  toggle(): void {
    if (this._open()) {
      this.hide();
    } else {
      this.show();
    }
  }

  /** Prevents default anchor navigation and toggles the panel on trigger activation. */
  protected onTriggerClick(event: Event): void {
    this.preventActionAnchorNavigation(event, this.disabled());
    if (this.disabled()) return;
    this.toggle();
  }
}

/**
 * Panel half of the flyout pattern. Apply to the rendered surface element.
 * Wires ARIA, light-dismiss (outside click / focusin), and Escape
 * handling. Pass the trigger as the directive value.
 *
 * Provide `anchor` when the visual reference element differs from the
 * interactive trigger. Typical use: a sibling input owns the visual anchor
 * while a nearby button still owns the open state and ARIA controls.
 *
 * Provide `boundary` to widen the "inside" region beyond the trigger and
 * panel — interactions inside the boundary keep the flyout open. Typical
 * use: pass the parent composite's host element so its other controls
 * remain interactive without dismissing.
 */
@Directive({
  selector: '[hellFlyout]',
  exportAs: 'hellFlyout',
  host: {
    role: 'dialog',
    'aria-modal': 'false',
    'data-hell-flyout': '',
    '[id]': 'trigger().panelId',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledby()',
    'data-state': 'open',
    '[attr.data-placement]': 'computedPlacement()',
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellFlyout {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_FLYOUT_RECIPE,
  });

  /** The `HellFlyoutTrigger` that owns this panel's open state. */
  readonly trigger = input.required<HellFlyoutTrigger>({ alias: 'hellFlyout' });
  /** Element the panel is positioned against, if different from the trigger. */
  readonly anchor = input<HTMLElement | ElementRef<HTMLElement> | null>(null);
  /** Element defining the "inside" region for light-dismiss beyond the trigger and panel. */
  readonly boundary = input<HTMLElement | ElementRef<HTMLElement> | null>(null);
  /** Preferred floating-ui placement relative to the reference element. Defaults to `bottom-start`. */
  readonly placement = input<Placement>('bottom-start');
  /** Distance in pixels between the panel and its reference element. Defaults to `8`. */
  readonly offset = input(8, { transform: numberAttribute });
  /** Whether to flip to the opposite side when there's insufficient space. Defaults to `true`. */
  readonly flip = input(true, { transform: booleanAttribute });
  /** Whether to shift the panel along the reference edge to stay in view. Defaults to `true`. */
  readonly shift = input(true, { transform: booleanAttribute });
  /** Accessible label for the panel. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  /** Id of the element labelling the panel. */
  readonly ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });
  /** Whether pressing Escape closes the panel. Defaults to `true`. */
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  /** Whether clicking or focusing outside the panel closes it. Defaults to `true`. */
  readonly closeOnOutsideInteraction = input(true, { transform: booleanAttribute });
  /** Actual placement resolved by floating-ui after collision handling. */
  protected readonly computedPlacement = signal<Placement>('bottom-start');

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly floatingScope = inject<HellFloatingScope | null>(HELL_FLOATING_SCOPE, {
    optional: true,
  });
  private readonly interactivityChecker = inject(InteractivityChecker, { optional: true });
  private readonly panel = signal<HTMLElement | null>(null);
  private interaction: HellFloatingInteractionController | null = null;

  constructor() {
    effect((onCleanup) => {
      const panel = this.panel();
      if (!panel) return;

      const reference = this.referenceElement();
      const placement = this.placement();
      const offset = this.offset();
      const flip = this.flip();
      const shift = this.shift();
      let active = true;

      const update = () => {
        const middleware: Middleware[] = [floatingOffset(offset)];
        if (flip) middleware.push(floatingFlip({ padding: 8 }));
        if (shift) middleware.push(floatingShift({ padding: 8, crossAxis: true }));

        void computePosition(reference, panel, {
          placement,
          strategy: 'fixed',
          middleware,
        }).then(({ x, y, placement }) => {
          if (!active || !panel.isConnected) return;
          const styles = panel.style;
          styles.setProperty('--hell-flyout-x', `${Math.round(x)}px`);
          styles.setProperty('--hell-flyout-y', `${Math.round(y)}px`);
          this.computedPlacement.set(placement);
        });
      };

      const cleanup = autoUpdate(reference, panel, update);
      update();
      onCleanup(() => {
        active = false;
        cleanup();
      });
    });

    afterNextRender(() => {
      const panel = this.element.nativeElement;
      this.panel.set(panel);
      this.interaction = new HellFloatingInteractionController({
        surface: () => panel,
        inside: () => [
          this.trigger().element.nativeElement,
          hellResolveElementTarget(this.anchor()),
          hellResolveElementTarget(this.boundary()),
        ],
        scope: this.floatingScope,
        active: () => this.trigger().open(),
        activeKey: () => this.trigger().openVersion(),
        focusTargetChecker: this.interactivityChecker,
        dismiss: hellDismissOn(
          hellGuardDismiss(hellOutsideClick, () => this.closeOnOutsideInteraction()),
          hellGuardDismiss(hellOutsideFocus, () => this.closeOnOutsideInteraction()),
          hellWithDismissEffect(
            hellGuardDismiss(hellEscapeKey, () => this.closeOnEscape()),
            {
              stopPropagation: true,
              restoreFocus: () => this.trigger().element.nativeElement,
            },
          ),
        ),
        onDismiss: () => this.trigger().hide(),
      });
      this.interaction.connect(this.destroyRef);
    });
  }

  private referenceElement(): HTMLElement {
    return hellResolveElementTarget(this.anchor()) ?? this.trigger().element.nativeElement;
  }

}
