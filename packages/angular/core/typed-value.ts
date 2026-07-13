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
} from '@hell-ui/angular/internal/core';
