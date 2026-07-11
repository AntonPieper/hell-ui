import { Directive, ElementRef, HostAttributeToken, inject } from '@angular/core';

/**
 * Shared disabled semantics for Hell directives hosted on native interactive
 * elements. Native buttons get safe non-submit defaults plus a real disabled
 * attribute; anchors get explicit disabled ARIA, leave the tab order, and
 * suppress default activation.
 */
@Directive()
export abstract class HellNativeInteractiveDisabledGuard {
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly authoredTabIndex = inject(new HostAttributeToken('tabindex'), { optional: true });

  protected nativeButtonType(): 'button' | null {
    return this.isButton() ? 'button' : null;
  }

  protected nativeButtonDisabled(disabled: boolean): '' | null {
    return this.isButton() && disabled ? '' : null;
  }

  protected anchorAriaDisabled(disabled: boolean): 'true' | null {
    return this.isAnchor() && disabled ? 'true' : null;
  }

  /**
   * Forces disabled anchors out of the tab order while preserving a static
   * consumer-authored tabindex when the trigger is enabled. A dynamic host
   * binding returning `null` would otherwise remove that static attribute.
   */
  protected disabledAnchorTabIndex(disabled: boolean): string | -1 | null {
    return this.isAnchor() && disabled ? -1 : this.authoredTabIndex;
  }

  protected preventDisabledAnchor(event: Event, disabled: boolean): void {
    if (!this.isAnchor() || !disabled) return;

    event.preventDefault();
    event.stopImmediatePropagation();
  }

  protected preventActionAnchorNavigation(event: Event, disabled: boolean): void {
    if (!this.isAnchor()) return;

    if (disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    event.preventDefault();
  }

  protected isButton(): boolean {
    return this.host.tagName.toLowerCase() === 'button';
  }

  protected isAnchor(): boolean {
    return this.host.tagName.toLowerCase() === 'a';
  }
}
