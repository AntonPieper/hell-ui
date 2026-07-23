/**
 * Shared adapter parse-result contract for text-backed typed value inputs such
 * as number, date, and time inputs. A parse either yields a committable value
 * (`null` is a real value: a clear commit) or stays a visible invalid draft.
 *
 * The state machine that drives draft/commit lifecycle stays internal; only the
 * parse-result shape and its constructors are a public authoring seam so custom
 * adapters can build results without depending on the internal entry point.
 */
export {
  hellTypedValue,
  hellInvalidTypedValue,
  type HellTypedValueValidParse,
  type HellTypedValueInvalidParse,
  type HellTypedValueParseResult,
} from 'hell-ui/internal/core';

import type { HellTypedValueParseResult } from 'hell-ui/internal/core';

/**
 * Strategy shared by text-backed Typed Value Inputs (date, time, number) for
 * parsing, formatting, normalizing, comparing, and bounds-checking values.
 * Each input module instantiates it with its value and context types and owns
 * its adapter token, defaults, and `provideHell<Module>InputAdapter` function —
 * the shape a custom adapter implements is learned once.
 */
export interface HellTypedInputAdapter<TValue, TContext = void> {
  /** Parse visible text. Return `{ valid: true, value: null }` to commit a clear. */
  readonly parseText: (text: string, context: TContext) => HellTypedValueParseResult<TValue>;
  /** Format a committed value for the text field. */
  readonly format: (value: TValue | null, context: TContext) => string;
  /** Coerce external form/input values before display; invalid values should return null. */
  readonly normalize?: (value: TValue | null | undefined, context: TContext) => TValue | null;
  /** Compare values semantically instead of by object identity. */
  readonly isSameValue?: (a: TValue | null, b: TValue | null) => boolean;
  /** Enforce business bounds after parsing and before emitting typed input. */
  readonly isWithinBounds?: (
    value: TValue | null,
    min: TValue | null,
    max: TValue | null,
    context: TContext,
  ) => boolean;
}
