import { HellStyleable } from '../../core/styleable';
import {
  HELL_FLOATING_SCOPE,
  HellFloatingInteractionController,
  hellDismissOn,
  hellEscapeKey,
  hellGuardDismiss,
  hellOutsideClick,
  hellOutsideFocus,
  hellWithDismissEffect,
} from '../../core/floating-scope';
import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { HellNativeInteractiveDisabledGuard } from '../../core/native-interactive-disabled';

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
    '[attr.aria-haspopup]': '"dialog"',
    '[attr.aria-expanded]': 'open()',
    '[attr.aria-controls]': 'open() ? panelId : null',
    '[attr.data-state]': 'open() ? "open" : "closed"',
    '[attr.disabled]': 'nativeButtonDisabled(disabled())',
    '[attr.aria-disabled]': 'anchorAriaDisabled(disabled())',
    '[attr.tabindex]': 'disabledAnchorTabIndex(disabled())',
    '(click)': 'preventDisabledAnchor($event, disabled())',
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
  readonly open = this._open.asReadonly();

  show(): void {
    if (this.disabled() || this._open()) return;
    this._open.set(true);
    this.openChange.emit(true);
  }

  hide(): void {
    if (!this._open()) return;
    this._open.set(false);
    this.openChange.emit(false);
  }

  toggle(): void {
    this._open() ? this.hide() : this.show();
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
    'data-state': 'open',
    '[class.hell-flyout]': '!unstyled()',
  },
})
export class HellFlyout extends HellStyleable {
  readonly trigger = input.required<HellFlyoutTrigger>({ alias: 'hellFlyout' });
  readonly boundary = input<HTMLElement | null>(null);
  readonly closeOnEscape = input(true, { transform: booleanAttribute });
  readonly closeOnOutsideInteraction = input(true, { transform: booleanAttribute });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly floatingScope = inject(HELL_FLOATING_SCOPE, { optional: true });
  private interaction: HellFloatingInteractionController | null = null;

  constructor() {
    super();
    afterNextRender(() => {
      const panel = this.element.nativeElement;
      this.interaction = new HellFloatingInteractionController({
        surface: () => panel,
        inside: () => [this.trigger().element.nativeElement, this.boundary()],
        scope: this.floatingScope,
        active: () => this.trigger().open(),
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
}
