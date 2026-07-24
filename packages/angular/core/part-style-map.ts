/**
 * Public Part Style Map contract (docs/adr/part-style-map.md).
 *
 * These are the only shared styling types consumers need to author a
 * module's `ui` value: a shorthand class string for the module's default
 * Public Part or a map from component-local Public Part names to Tailwind
 * class strings. Part Recipes, the configured Tailwind merge, the styler
 * factory, and the rest of the Part-Class Pipeline are package internals
 * (`hell-ui/internal/core`) and are not consumer import paths.
 */

/** Consumer-provided Tailwind class refinements keyed by a component's public parts. */
export type HellUi<Part extends string> = Partial<Record<Part, string>>;

/** Either shorthand classes for the default public part or an explicit part map. */
export type HellUiInput<Part extends string> = string | HellUi<Part> | null | undefined;
