import { booleanAttribute, Directive, Input, input } from '@angular/core';

/** Consumer-provided Tailwind class refinements keyed by a component's public parts. */
export type HellUi<Part extends string> = Partial<Record<Part, string>>;

/** Component-owned default Tailwind classes keyed by the same public parts exposed through `ui`. */
export type HellRecipe<Part extends string> = Readonly<Record<Part, string>>;

/** Merges one default part recipe entry with the matching consumer `ui` entry. */
export type HellPartClassMerger = (
  defaultClasses: string,
  consumerClasses: string | undefined,
) => string;

/**
 * Base contract for every styled `hell` module.
 *
 * Subclasses inherit the `unstyled` input and bind their own host styling
 * class as `[class.hell-xxx]="!unstyled()"`. Behavior, accessibility wiring,
 * and data attributes remain local to the concrete module.
 */
@Directive()
export abstract class HellStyleable {
  /**
   * When true, the component does not apply its Hell default host styling class.
   * Behavior, accessibility wiring and data attributes still apply.
   */
  readonly unstyled = input(false, {
    transform: booleanAttribute,
    alias: 'unstyled',
  });
}

/**
 * Base contract for modules migrated to Part Style Maps.
 *
 * Subclasses own a complete Tailwind recipe for their public parts and expose
 * `[ui]` as the single consumer refinement path.
 */
@Directive()
export abstract class HellPartStyleable<Part extends string> {
  /** Tailwind class refinements keyed by public part name. */
  @Input({ alias: 'ui' }) ui: HellUi<Part> = {};

  /** Component-owned default classes for every public part. */
  protected abstract readonly recipe: HellRecipe<Part>;

  /** Tailwind-aware class merger for the part-class pipeline. */
  protected abstract readonly mergePartClasses: HellPartClassMerger;

  /** Return the merged classes for one public part. */
  protected part(part: Part): string {
    return this.mergePartClasses(this.recipe[part], this.ui[part]);
  }
}
