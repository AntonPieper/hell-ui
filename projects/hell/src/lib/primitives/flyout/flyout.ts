import { HellStyleable } from '../../core/styleable';
import { HELL_FLOATING_SCOPE } from '../../core/floating-scope';
import {
  HellFloatingInteractionController,
  hellDismissOn,
  hellEscapeKey,
  hellGuardDismiss,
  hellOutsideClick,
  hellOutsideFocus,
  hellWithDismissEffect,
} from '../../core/floating-dismissal';
import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { HellNativeInteractiveDisabledGuard } from '../../core/native-interactive-disabled';
import {
  autoUpdate,
  computePosition,
  flip,
  offset as floatingOffset,
  shift,
  type Placement,
} from '@floating-ui/dom';

let nextFlyoutId = 0;

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
    '[id]': 'trigger().panelId',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-labelledby]': 'ariaLabelledby()',
    'data-state': 'open',
    '[attr.data-placement]': 'computedPlacement()',
    '[class.hell-flyout]': '!unstyled()',
  },
})
export class HellFlyout extends HellStyleable {
  readonly trigger = input.required<HellFlyoutTrigger>({ alias: 'hellFlyout' });
  readonly boundary = input<HTMLElement | null>(null);
  readonly placement = input<Placement>('bottom-start');
  readonly offset = input(8, { transform: numberAttribute });
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | null>(null, { alias: 'aria-labelledby' });
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  readonly closeOnOutsideInteraction = input(true, { transform: booleanAttribute });
  protected readonly computedPlacement = signal<Placement>('bottom-start');

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly floatingScope = inject(HELL_FLOATING_SCOPE, { optional: true });
  private readonly interactivityChecker = inject(InteractivityChecker, { optional: true });
  private interaction: HellFloatingInteractionController | null = null;
  private cleanupPosition: (() => void) | null = null;

  constructor() {
    super();
    afterNextRender(() => {
      const panel = this.element.nativeElement;
      this.connectPositioning(panel);
      this.interaction = new HellFloatingInteractionController({
        surface: () => panel,
        inside: () => [this.trigger().element.nativeElement, this.boundary()],
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
    this.destroyRef.onDestroy(() => this.cleanupPosition?.());
  }

  private connectPositioning(panel: HTMLElement): void {
    const trigger = this.trigger().element.nativeElement;
    const update = () => {
      void computePosition(trigger, panel, {
        placement: this.placement(),
        strategy: 'fixed',
        middleware: [
          floatingOffset(this.offset()),
          flip({ padding: 8 }),
          shift({ padding: 8 }),
        ],
      }).then(({ x, y, placement }) => {
        if (!panel.isConnected) return;
        const styles = panel.style;
        styles.setProperty('--hell-flyout-x', `${Math.round(x)}px`);
        styles.setProperty('--hell-flyout-y', `${Math.round(y)}px`);
        this.computedPlacement.set(placement);
      });
    };

    this.cleanupPosition = autoUpdate(trigger, panel, update);
    update();
  }
}
