import { hellTwMerge } from './part-style-merge';

/**
 * Package-internal Part-Class Pipeline (docs/adr/part-style-map.md,
 * docs/adr/0002-public-package-and-stylesheet-surface.md).
 *
 * The consumer styling contract is the Part Style Map: the public `HellUi`
 * and `HellUiInput` types exported by `hell-ui/core` plus each module's `ui`
 * input. Part Recipes, the styler factory, and the configured Tailwind merge
 * below are shared implementation details for Hell-owned entry points only
 * and must not be re-exported from a public entry point.
 */

/** Component-owned default Tailwind classes keyed by the same public parts exposed through `ui`. */
export type HellRecipe<Part extends string> = Readonly<Record<Part, string>>;

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
 * The `ui` parameter and the returned styler are typed structurally (the
 * parameter shape matches the public `HellUiInput<Part>` contract from
 * `hell-ui/core`) so component declaration files describe their protected
 * styler member as a plain `(part: Part) => string` function instead of
 * referencing this internal seam.
 *
 * This is a composition seam, not a base class: modules own their inputs and
 * host bindings, and no inheritance contract leaks into component
 * declarations.
 */
export function hellPartStyler<Part extends string>(
  ui: () => string | Partial<Record<Part, string>> | null | undefined,
  options: HellPartStylerOptions<Part>,
): (part: Part) => string {
  return (part) => hellTwMerge(options.recipe()[part], uiClassForPart(ui(), part, options.defaultPart));
}

function uiClassForPart<Part extends string>(
  ui: string | Partial<Record<Part, string>> | null | undefined,
  part: Part,
  defaultPart: Part,
): string | undefined {
  if (!ui) return undefined;
  if (typeof ui === 'string') return part === defaultPart ? ui : undefined;

  return ui[part];
}
