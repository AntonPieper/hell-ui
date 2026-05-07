import { ElementRef, inject } from '@angular/core';
import { HellStyleable } from './styleable';

/**
 * Shared disabled semantics for Hell directives hosted on native interactive
 * elements. Native buttons get safe non-submit defaults plus a real disabled
 * attribute; anchors get explicit disabled ARIA, leave the tab order, and
 * suppress default activation.
 */
export abstract class HellNativeInteractiveDisabledGuard extends HellStyleable {
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;

  protected nativeButtonType(): 'button' | null {
    return this.isButton() ? 'button' : null;
  }

  protected nativeButtonDisabled(disabled: boolean): '' | null {
    return this.isButton() && disabled ? '' : null;
  }

  protected anchorAriaDisabled(disabled: boolean): 'true' | null {
    return this.isAnchor() && disabled ? 'true' : null;
  }

  protected disabledAnchorTabIndex(disabled: boolean): -1 | null {
    return this.isAnchor() && disabled ? -1 : null;
  }

  protected preventDisabledAnchor(event: Event, disabled: boolean): void {
    if (!this.isAnchor() || !disabled) return;

    event.preventDefault();
    event.stopImmediatePropagation();
  }

  protected isButton(): boolean {
    return this.host.tagName.toLowerCase() === 'button';
  }

  protected isAnchor(): boolean {
    return this.host.tagName.toLowerCase() === 'a';
  }
}
