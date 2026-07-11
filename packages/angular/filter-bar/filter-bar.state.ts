import { hellRankLocalSearch } from '@hell-ui/angular/core';

/** Reserved key used for unstructured free-text tokens. */
export const HELL_FILTER_TEXT_KEY = '$text';

/** One fixed choice offered by an options field. */
export interface HellFilterOption {
  /** Stable serialized option value. */
  readonly value: string;
  /** Human-readable option label. */
  readonly label: string;
  /** Prevents keyboard/pointer selection while keeping the option visible. */
  readonly disabled?: boolean;
}

/** Shared declaration fields for every Filter Bar field kind. */
export interface HellFilterFieldBase {
  /** Stable serialized field identity. `$text` is reserved by the Filter Bar. */
  readonly key: string;
  /** Human-readable field label. */
  readonly label: string;
  /** Allow more than one token with this key. Defaults to `false`. */
  readonly multiple?: boolean;
}

/** A field whose editor accepts arbitrary text. */
export interface HellFilterTextField extends HellFilterFieldBase {
  /** Selects the arbitrary-text editor. */
  readonly kind: 'text';
}

/** A field whose editor commits one of a fixed set of choices. */
export interface HellFilterOptionsField extends HellFilterFieldBase {
  /** Selects the fixed-options editor. */
  readonly kind: 'options';
  /** Choices that the field may commit. */
  readonly options: readonly HellFilterOption[];
}

/** Declarative field seam supported by the Filter Bar core. */
export type HellFilterField = HellFilterTextField | HellFilterOptionsField;

/** One controlled, JSON-serializable Filter Bar token. */
export interface HellFilterToken {
  /** Declared field key, or the reserved `$text` key. */
  readonly key: string;
  /** Reserved operator seam; Filter Bar core emits equality only. */
  readonly operator: 'eq';
  /** Serialized text or option value. */
  readonly value: string;
}

/** Stable locator for one occurrence of a token in controlled state. */
export interface HellFilterTokenIdentity {
  readonly fingerprint: string;
  readonly occurrence: number;
}

/** One row in the field suggestion list. */
export type HellFilterSuggestion =
  | { readonly kind: 'field'; readonly field: HellFilterField }
  | { readonly kind: 'freeText'; readonly value: string };

/** Input to the controlled commit helper. */
export interface HellFilterCommit {
  readonly key: string;
  readonly value: string;
  readonly multiple: boolean;
  readonly editIdentity?: HellFilterTokenIdentity;
}

/** Capture a token locator that remains valid when unrelated tokens are reordered. */
export function identifyHellFilterToken(
  current: readonly HellFilterToken[],
  index: number,
): HellFilterTokenIdentity | null {
  const token = current[index];
  if (!token) return null;

  const fingerprint = fingerprintHellFilterToken(token);
  let occurrence = 0;

  for (let candidateIndex = 0; candidateIndex < index; candidateIndex += 1) {
    const candidate = current[candidateIndex];
    if (candidate && fingerprintHellFilterToken(candidate) === fingerprint) {
      occurrence += 1;
    }
  }

  return { fingerprint, occurrence };
}

/**
 * Build the field picker rows. Single-use fields already present in the
 * controlled value disappear; multi-use fields remain. The visible free-text
 * row is always last when fields match and becomes row zero when none do.
 */
export function filterHellFilterFields(
  fields: readonly HellFilterField[],
  value: readonly HellFilterToken[],
  query: string,
): readonly HellFilterSuggestion[] {
  const available = fields.filter(
    (field) =>
      field.key !== HELL_FILTER_TEXT_KEY &&
      (field.multiple || !value.some((token) => token.key === field.key)),
  );
  const ranked = hellRankLocalSearch(available, {
    query,
    fields: [
      { weight: 2, get: (field) => field.label },
      { weight: 1, get: (field) => field.key },
    ],
  });
  const rows: HellFilterSuggestion[] = ranked.map(({ item }) => ({ kind: 'field', field: item }));
  rows.push({ kind: 'freeText', value: query.trim() });
  return rows;
}

/**
 * Produce the next whole controlled value without mutating the caller's array.
 * Edits replace one exact token; create commits append for multi-use fields and
 * replace every existing token of a single-use field. Reserved free text is
 * always single-use regardless of the supplied `multiple` flag.
 */
export function commitHellFilterToken(
  current: readonly HellFilterToken[],
  commit: HellFilterCommit,
): HellFilterToken[] {
  const token: HellFilterToken = { key: commit.key, operator: 'eq', value: commit.value };

  if (commit.editIdentity) {
    const editIndex = findHellFilterTokenIndex(current, commit.editIdentity);
    if (editIndex === -1) return [...current];

    if (commit.key === HELL_FILTER_TEXT_KEY) {
      return current.flatMap((entry, index) => {
        if (index === editIndex) return [token];
        return entry.key === HELL_FILTER_TEXT_KEY ? [] : [entry];
      });
    }

    return current.map((entry, index) => index === editIndex ? token : entry);
  }

  if (commit.key !== HELL_FILTER_TEXT_KEY && commit.multiple) {
    if (current.some((entry) => entry.key === commit.key && entry.value === commit.value)) {
      return [...current];
    }
    return [...current, token];
  }

  return [...current.filter((entry) => entry.key !== commit.key), token];
}

function fingerprintHellFilterToken(token: HellFilterToken): string {
  return JSON.stringify([token.key, token.operator, token.value]);
}

function findHellFilterTokenIndex(
  current: readonly HellFilterToken[],
  identity: HellFilterTokenIdentity,
): number {
  let occurrence = 0;

  for (let index = 0; index < current.length; index += 1) {
    const token = current[index];
    if (!token || fingerprintHellFilterToken(token) !== identity.fingerprint) continue;
    if (occurrence === identity.occurrence) return index;
    occurrence += 1;
  }

  return -1;
}
