import { booleanAttribute, Directive, input } from '@angular/core';
import { hellTwMerge } from './part-style-merge';

/** Consumer-provided Tailwind class refinements keyed by a component's public parts. */
export type HellUi<Part extends string> = Partial<Record<Part, string>>;

/** Either shorthand classes for the default public part or an explicit part map. */
export type HellUiInput<Part extends string> = string | HellUi<Part> | null | undefined;

/** Component-owned default Tailwind classes keyed by the same public parts exposed through `ui`. */
export type HellRecipe<Part extends string> = Readonly<Record<Part, string>>;

/** One module's Part-Class Pipeline: returns the merged classes for one public part. */
export type HellPartStyler<Part extends string> = (part: Part) => string;

/** Configuration for one module's Part-Class Pipeline. */
export interface HellPartStylerOptions<Part extends string> {
  /** Public part that receives string shorthand from `ui="..."`. */
  readonly defaultPart: Part;
  /** Component-owned default classes for every public part; read lazily per change detection. */
  readonly recipe: () => HellRecipe<Part>;
}

/**
 * Build the Part-Class Pipeline for one styled `hell` module.
 *
 * Each module declares its own typed `ui` signal input
 * (`readonly ui = input<HellUiInput<Part>>(undefined, { alias: 'ui' })`) and
 * passes it here together with its default part and recipe. The returned
 * styler is the single class computation path for the module's public parts:
 * default recipe classes plus the consumer's matching Part Style Map entry,
 * merged deterministically through the configured `hellTwMerge`.
 *
 * This is a composition seam, not a base class: modules own their inputs and
 * host bindings, and no inheritance contract leaks into component
 * declarations.
 */
export function hellPartStyler<Part extends string>(
  ui: () => HellUiInput<Part>,
  options: HellPartStylerOptions<Part>,
): HellPartStyler<Part> {
  return (part) => hellTwMerge(options.recipe()[part], uiClassForPart(ui(), part, options.defaultPart));
}

function uiClassForPart<Part extends string>(
  ui: HellUiInput<Part>,
  part: Part,
  defaultPart: Part,
): string | undefined {
  if (!ui) return undefined;
  if (typeof ui === 'string') return part === defaultPart ? ui : undefined;

  return ui[part];
}

/**
 * Base contract for the not-yet-migrated legacy Style Opt-Out modules listed
 * in the architecture allowlist. New public modules must not extend this;
 * they use `hellPartStyler` and a typed `ui` input instead.
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
