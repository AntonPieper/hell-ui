import { Directive, ElementRef, Injector, inject } from '@angular/core';

import { HELL_FLOATING_SCOPE, type HellFloatingScope } from 'hell-ui/internal/core';

/**
 * The floating surface that hosts one projected editor: its injector, its
 * panel element, and its own Floating Scope.
 *
 * Projected editor templates are declared by the application, so their
 * embedded views resolve DI from the application's view by default. Any Hell
 * floating surface the application opens inside an editor would then be seen
 * by the overlay engine as a sibling of the editor popover and would evict it.
 * Rendering the projected template with this surface-side injector links the
 * child overlay to its parent so nested surfaces stack instead.
 *
 * The same node also carries the panel's Floating Scope, which is what
 * `containsTarget` answers against. That scope is deliberately narrower than
 * the Filter Builder's own scope: the builder's scope is rooted at the whole
 * renderer host, so it would count the frame — chips, the clear action, and
 * the inline field picker — as inside an open editor. Create editing must
 * end when focus returns to the frame, otherwise the picker's dropdown and
 * the create popover are two live overlays from one builder.
 *
 * Package-local: the entry point barrel never re-exports it.
 */
@Directive({
  selector: '[hellFilterBuilderEditorSurface]',
  exportAs: 'hellFilterBuilderEditorSurface',
})
export class HellFilterBuilderEditorSurface {
  /** Injector of the popover panel that hosts the projected editor. */
  readonly injector = inject(Injector);

  private readonly panel = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  /**
   * The panel's own scope, provided by `hellPopover` on this same node, so
   * nested surfaces the application opens inside the editor register here.
   */
  private readonly scope = inject<HellFloatingScope | null>(HELL_FLOATING_SCOPE, {
    optional: true,
  });

  /**
   * Whether `target` is inside this editor surface — the panel itself or any
   * floating surface opened from within it.
   */
  containsTarget(target: EventTarget | Node | null): boolean {
    if (target instanceof Node && this.panel.contains(target)) return true;
    return this.scope?.containsFloatingTarget(target) ?? false;
  }
}
