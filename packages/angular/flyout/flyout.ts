import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';
import { HELL_FLOATING_SCOPE, type HellFloatingScope } from '@hell-ui/angular/internal/core';
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

export type HellFlyoutPart = 'root';
export type HellFlyoutUi = HellUi<HellFlyoutPart>;

const HELL_FLYOUT_RECIPE = {
  root: 'fixed z-[var(--hell-z-popover,1000)] max-w-[min(320px,calc(100vw_-_(var(--spacing-hell-4)*2)))] rounded-hell-md border border-hell-border bg-hell-surface-elevated text-hell-foreground shadow-hell-lg outline-none animate-[hell-flyout-in_var(--hell-duration-fast,150ms)_var(--ease-hell-out,ease)]',
} satisfies HellRecipe<HellFlyoutPart>;

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

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly openChange = output<boolean>();

  /** Stable id wired into trigger `aria-controls` and panel `id`. */
  readonly panelId = `hell-flyout-${++nextFlyoutId}`;

  private readonly _open = signal(false);
  private readonly _openVersion = signal(0);
  readonly open = this._open.asReadonly();
  readonly openVersion = this._openVersion.asReadonly();

  show(): void {
    if (this.disabled() || this._open()) return;
    this._openVersion.update((version) => version + 1);
    this._open.set(true);
    this.openChange.emit(true);
  }

  hide(): void {
    if (!this._open()) return;
    this._openVersion.update((version) => version + 1);
    this._open.set(false);
    this.openChange.emit(false);
  }

  toggle(): void {
    this._open() ? this.hide() : this.show();
  }

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
export class HellFlyout extends HellPartStyleable<HellFlyoutPart> {
  protected readonly recipe = HELL_FLYOUT_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly trigger = input.required<HellFlyoutTrigger>({ alias: 'hellFlyout' });
  readonly anchor = input<HTMLElement | ElementRef<HTMLElement> | null>(null);
  readonly boundary = input<HTMLElement | ElementRef<HTMLElement> | null>(null);
  readonly placement = input<Placement>('bottom-start');
  readonly offset = input(8, { transform: numberAttribute });
  readonly flip = input(true, { transform: booleanAttribute });
  readonly shift = input(true, { transform: booleanAttribute });
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  readonly closeOnOutsideInteraction = input(true, { transform: booleanAttribute });
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
    super();
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
        if (shift) middleware.push(floatingShift({ padding: 8 }));

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
          this.resolveElementTarget(this.anchor()),
          this.resolveElementTarget(this.boundary()),
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
    return this.resolveElementTarget(this.anchor()) ?? this.trigger().element.nativeElement;
  }

  private resolveElementTarget(
    target: HTMLElement | ElementRef<HTMLElement> | null | undefined,
  ): HTMLElement | null {
    if (!target) return null;
    if ('nativeElement' in target) return target.nativeElement;
    return target;
  }
}
