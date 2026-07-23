/**
 * Shared pick-value family for Hell's option-driven pickers (select,
 * combobox): `T | null` in single mode, `readonly T[]` in multiple mode, and
 * their union. The shapes are defined next to the internal picker plumbing
 * that normalizes them; only the type family is a public authoring seam.
 */
export type {
  HellPickSingleValue,
  HellPickMultipleValue,
  HellPickValue,
} from 'hell-ui/internal/core';
