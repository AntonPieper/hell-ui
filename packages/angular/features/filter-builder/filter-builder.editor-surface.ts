import { Directive, Injector, inject } from '@angular/core';

/**
 * Captures the injector of the floating surface that hosts a projected
 * editor.
 *
 * Projected editor templates are declared by the application, so their
 * embedded views resolve DI from the application's view by default. Any Hell
 * floating surface the application opens inside an editor would then be seen
 * by the overlay engine as a sibling of the editor popover and would evict it.
 * Rendering the projected template with this surface-side injector links the
 * child overlay to its parent so nested surfaces stack instead.
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
}
