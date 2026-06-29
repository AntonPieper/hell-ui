import { booleanAttribute, Directive, input } from '@angular/core';
import { hellTwMerge } from './part-style-merge';

/** Consumer-provided Tailwind class refinements keyed by a component's public parts. */
export type HellUi<Part extends string> = Partial<Record<Part, string>>;

/** Either shorthand classes for the default public part or an explicit part map. */
export type HellUiInput<Part extends string> = string | HellUi<Part> | null | undefined;

/** Component-owned default Tailwind classes keyed by the same public parts exposed through `ui`. */
export type HellRecipe<Part extends string> = Readonly<Record<Part, string>>;

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
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<Part>>(undefined, { alias: 'ui' });

  /** Component-owned default classes for every public part. */
  protected abstract readonly recipe: HellRecipe<Part>;

  /** Public part that receives string shorthand from `ui="..."`. */
  protected abstract readonly defaultUiPart: Part;

  /** Return the merged classes for one public part. */
  protected part(part: Part): string {
    return hellTwMerge(this.recipe[part], this.uiClassForPart(part));
  }

  private uiClassForPart(part: Part): string | undefined {
    const ui = this.ui();

    if (!ui) return undefined;
    if (typeof ui === 'string') return part === this.defaultUiPart ? ui : undefined;

    return ui[part];
  }
}
