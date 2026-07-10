import { Injectable, InjectionToken, inject, type Provider } from '@angular/core';
import { Observable, firstValueFrom, isObservable } from 'rxjs';

/** Value shape that local ranking can normalize into searchable text. */
export type HellMaybeAsync<T> = T | Promise<T> | Observable<T>;
/** Primitive value that local ranking can turn into searchable text. */
export type HellSearchPrimitive = string | number | boolean | null | undefined | Date;
/** One field's extracted value: a primitive or a list of primitives. */
export type HellSearchFieldValue = HellSearchPrimitive | readonly HellSearchPrimitive[];

/** Weighted field extractor for local search. Higher weights make a field win ties. */
export interface HellSearchField<T> {
  /** Optional debug/display name for the field. */
  readonly name?: string;
  /** Relative weight applied to this field's match score. Defaults to 1. */
  readonly weight?: number;
  /** Extract the searchable value from an item. */
  readonly get: (item: T) => HellSearchFieldValue;
}

/** Ranked item returned from local search or a remote source. */
export interface HellSearchResult<T> {
  /** The matched item. */
  readonly item: T;
  /** Relevance score; higher ranks earlier. */
  readonly score: number;
}

/**
 * Remote sources may return raw items for local ranking, or pre-scored results
 * when server-side relevance/order must be preserved.
 */
export interface HellSearchResponse<T> {
  /** Raw items to be ranked locally. */
  readonly items?: readonly T[];
  /** Pre-scored results whose server-side order is preserved. */
  readonly results?: readonly HellSearchResult<T>[];
}

/** Context passed to a search source; `signal` aborts superseded async work. */
export interface HellSearchSourceRequest<P = unknown> {
  /** Raw user query text. */
  readonly query: string;
  /** Maximum number of results the caller will render. */
  readonly limit?: number;
  /** Caller-defined parameters forwarded to the source. */
  readonly params?: P;
  /** Aborts superseded async work. */
  readonly signal?: AbortSignal;
}

/** Pluggable search source for async/remote data behind omnibar-like controls. */
export type HellSearchSource<T, P = unknown> = (
  request: HellSearchSourceRequest<P>,
) => HellMaybeAsync<readonly T[] | HellSearchResponse<T>>;

/** Request accepted by a `HellSearchRanker`: query, limit, and optional weighted fields. */
export interface HellSearchRankRequest<T>
  extends Pick<HellSearchSourceRequest, 'query' | 'limit'> {
  /** Weighted field extractors; omitted fields fall back to deep default text extraction. */
  readonly fields?: readonly HellSearchField<T>[];
}

/** Pluggable local ranking strategy; replace it through `provideHellSearchRanker`. */
export type HellSearchRanker = <T>(
  items: readonly T[],
  request: HellSearchRankRequest<T>,
) => readonly HellSearchResult<T>[];

/** Full request accepted by `HellSearchService`: local items, remote source, or both. */
export interface HellSearchRequest<T, P = unknown> extends HellSearchSourceRequest<P> {
  /** Local items to rank when no source is given (or the source returns raw items). */
  readonly items?: readonly T[];
  /** Optional async/remote source; `null` behaves like an absent source. */
  readonly source?: HellSearchSource<T, P> | null;
  /** Weighted field extractors used for local ranking. */
  readonly fields?: readonly HellSearchField<T>[];
}

/** Injection token holding the active ranking strategy. Defaults to `hellRankLocalSearch`. */
export const HELL_SEARCH_RANKER = new InjectionToken<HellSearchRanker>('HELL_SEARCH_RANKER', {
  providedIn: 'root',
  factory: () => hellRankLocalSearch,
});

/** Replace the local ranking strategy for an injector scope. */
export function provideHellSearchRanker(ranker: HellSearchRanker): Provider {
  return { provide: HELL_SEARCH_RANKER, useValue: ranker };
}

/** Small ranking facade used by command palettes and docs search. */
@Injectable({ providedIn: 'root' })
export class HellSearchService {
  private readonly ranker = inject(HELL_SEARCH_RANKER);
  /** Resolve an optional source, then either preserve source scores or rank raw items locally. */
  async search<T>(request: HellSearchRequest<T>): Promise<readonly HellSearchResult<T>[]> {
    const response = request.source
      ? await resolveMaybeAsync(request.source(request))
      : (request.items ?? []);

    if (isSearchResponse<T>(response)) {
      if (response.results) return limitResults(response.results, request.limit);
      return this.rank(response.items ?? [], request);
    }

    return this.rank(response, request);
  }

  /** Rank local items by normalized query words. Every query word must match somewhere. */
  rank<T>(
    items: readonly T[],
    request: Pick<HellSearchRequest<T>, 'query' | 'fields' | 'limit'>,
  ): readonly HellSearchResult<T>[] {
    return limitResults(this.ranker(items, request), request.limit);
  }
}

/** Default ranker: word-based, accent-insensitive scoring with stable tie order. */
export function hellRankLocalSearch<T>(
  items: readonly T[],
  request: HellSearchRankRequest<T>,
): readonly HellSearchResult<T>[] {
  const words = hellSearchWords(request.query);
  const fields = request.fields;

  const ranked = items
    .map((item, index) => ({
      item,
      score: words.length ? scoreItem(item, fields, words) : 0,
      index,
    }))
    .filter((result) => !words.length || result.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item, score }) => ({ item, score }));

  return limitResults(ranked, request.limit);
}

/** Split user input into normalized words for matching. */
export function hellSearchWords(value: string): readonly string[] {
  return hellSearchKey(value)
    .split(' ')
    .map((word) => word.trim())
    .filter(Boolean);
}

/** Normalize text for accent-insensitive, punctuation-insensitive Unicode search keys. */
export function hellSearchKey(value: string): string {
  const normalized = value.normalize('NFKD').toLocaleLowerCase().replace(/&/g, ' and ');
  const searchText = HELL_UNICODE_SEARCH_REGEX
    ? normalized.replace(HELL_UNICODE_SEARCH_REGEX.mark, '').replace(
        HELL_UNICODE_SEARCH_REGEX.notLetterOrNumber,
        ' ',
      )
    : normalized.replace(HELL_FALLBACK_SEARCH_REGEX, ' ');

  return searchText.replace(/\s+/g, ' ').trim();
}

const HELL_UNICODE_PROPERTY_PREFIX = '\\' + 'p';
const HELL_UNICODE_SEARCH_REGEX = hellUnicodeSearchRegex();
const HELL_FALLBACK_SEARCH_REGEX = /[^a-zA-Z0-9\u00A0-\uFFFF]+/g;

function hellUnicodeSearchRegex():
  | { readonly mark: RegExp; readonly notLetterOrNumber: RegExp }
  | null {
  try {
    return {
      mark: new RegExp(`${HELL_UNICODE_PROPERTY_PREFIX}{Mark}`, 'gu'),
      notLetterOrNumber: new RegExp(
        `[^${HELL_UNICODE_PROPERTY_PREFIX}{Letter}${HELL_UNICODE_PROPERTY_PREFIX}{Number}]+`,
        'gu',
      ),
    };
  } catch {
    return null;
  }
}

async function resolveMaybeAsync<T>(value: HellMaybeAsync<T>): Promise<T> {
  if (isObservable(value)) return firstValueFrom(value);
  return await value;
}

function isSearchResponse<T>(value: unknown): value is HellSearchResponse<T> {
  if (!value || Array.isArray(value) || typeof value !== 'object') return false;
  return 'items' in value || 'results' in value;
}

function limitResults<T>(
  results: readonly HellSearchResult<T>[],
  limit: number | undefined,
): readonly HellSearchResult<T>[] {
  return limit === undefined ? results : results.slice(0, Math.max(0, limit));
}

function scoreItem<T>(
  item: T,
  fields: readonly HellSearchField<T>[] | undefined,
  words: readonly string[],
): number {
  const searchable = fields?.length ? fieldTexts(item, fields) : defaultTexts(item);
  if (!searchable.length) return 0;

  let total = 0;
  for (const word of words) {
    let best = 0;
    for (const entry of searchable) {
      best = Math.max(best, scoreText(entry.text, word) * entry.weight);
    }
    if (best <= 0) return 0;
    total += best;
  }
  return total;
}

function fieldTexts<T>(
  item: T,
  fields: readonly HellSearchField<T>[],
): readonly { readonly text: string; readonly weight: number }[] {
  return fields.flatMap((field) =>
    valueTexts(field.get(item)).map((text) => ({ text, weight: field.weight ?? 1 })),
  );
}

function defaultTexts(
  value: unknown,
): readonly { readonly text: string; readonly weight: number }[] {
  const seen = new WeakSet<object>();
  const out: { text: string; weight: number }[] = [];

  const visit = (next: unknown, depth: number) => {
    if (next === null || next === undefined || depth > 3) return;
    if (next instanceof Date) {
      out.push({ text: hellSearchKey(next.toISOString()), weight: 1 });
      return;
    }
    if (
      typeof next === 'string' ||
      typeof next === 'number' ||
      typeof next === 'boolean'
    ) {
      out.push({ text: hellSearchKey(String(next)), weight: 1 });
      return;
    }
    if (typeof next !== 'object') return;
    if (seen.has(next)) return;
    seen.add(next);

    if (Array.isArray(next)) {
      for (const item of next) visit(item, depth + 1);
      return;
    }

    for (const value of Object.values(next as Record<string, unknown>)) {
      visit(value, depth + 1);
    }
  };

  visit(value, 0);
  return out.filter((entry) => entry.text);
}

function valueTexts(value: HellSearchFieldValue): readonly string[] {
  const values = Array.isArray(value) ? value : [value];
  return values
    .filter((part) => part !== null && part !== undefined)
    .map((part) => (part instanceof Date ? part.toISOString() : String(part)))
    .map(hellSearchKey)
    .filter(Boolean);
}

function scoreText(text: string, word: string): number {
  if (!text || !word) return 0;

  const tokens = text.split(' ');
  if (tokens.some((token) => token === word)) return 4;
  if (tokens.some((token) => token.startsWith(word))) return 3;
  if (tokens.some((token) => token.includes(word))) return 2;

  return text === word ? 4 : text.startsWith(word) ? 3 : text.includes(word) ? 2 : 0;
}
