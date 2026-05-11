import { Injectable, InjectionToken, inject, type Provider } from '@angular/core';
import { Observable, firstValueFrom, isObservable } from 'rxjs';

/** Value shape that local ranking can normalize into searchable text. */
export type HellMaybeAsync<T> = T | Promise<T> | Observable<T>;
export type HellSearchPrimitive = string | number | boolean | null | undefined | Date;
export type HellSearchFieldValue = HellSearchPrimitive | readonly HellSearchPrimitive[];

/** Weighted field extractor for local search. Higher weights make a field win ties. */
export interface HellSearchField<T> {
  readonly name?: string;
  readonly weight?: number;
  readonly get: (item: T) => HellSearchFieldValue;
}

/** Ranked item returned from local search or a remote source. */
export interface HellSearchResult<T> {
  readonly item: T;
  readonly score: number;
}

/**
 * Remote sources may return raw items for local ranking, or pre-scored results
 * when server-side relevance/order must be preserved.
 */
export interface HellSearchResponse<T> {
  readonly items?: readonly T[];
  readonly results?: readonly HellSearchResult<T>[];
}

/** Context passed to a search source; `signal` aborts superseded async work. */
export interface HellSearchSourceRequest<P = unknown> {
  readonly query: string;
  readonly limit?: number;
  readonly params?: P;
  readonly signal?: AbortSignal;
}

/** Pluggable search source for async/remote data behind omnibar-like controls. */
export type HellSearchSource<T, P = unknown> = (
  request: HellSearchSourceRequest<P>,
) => HellMaybeAsync<readonly T[] | HellSearchResponse<T>>;

export interface HellSearchRankRequest<T>
  extends Pick<HellSearchSourceRequest, 'query' | 'limit'> {
  readonly fields?: readonly HellSearchField<T>[];
}

export type HellSearchRanker = <T>(
  items: readonly T[],
  request: HellSearchRankRequest<T>,
) => readonly HellSearchResult<T>[];

/** Full request accepted by `HellSearchService`: local items, remote source, or both. */
export interface HellSearchRequest<T, P = unknown> extends HellSearchSourceRequest<P> {
  readonly items?: readonly T[];
  readonly source?: HellSearchSource<T, P> | null;
  readonly fields?: readonly HellSearchField<T>[];
}

export const HELL_SEARCH_RANKER = new InjectionToken<HellSearchRanker>('HELL_SEARCH_RANKER', {
  providedIn: 'root',
  factory: () => hellRankLocalSearch,
});

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

export function hellRankLocalSearch<T>(
  items: readonly T[],
  request: HellSearchRankRequest<T>,
): readonly HellSearchResult<T>[] {
  const words = hellSearchWords(request.query);
  const fields = request.fields;

  const ranked = items
    .map((item, index) => {
      const score = words.length ? scoreItem(item, fields, words) : 0;
      return { item, score, index };
    })
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
  return value
    .normalize('NFKD')
    .replace(/\p{Mark}/gu, '')
    .toLocaleLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim();
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
    const type = typeof next;
    if (type === 'string' || type === 'number' || type === 'boolean') {
      out.push({ text: hellSearchKey(String(next)), weight: 1 });
      return;
    }
    if (type !== 'object') return;
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
  if (text === word) return 120;
  if (text.startsWith(word)) return 90;

  const tokens = text.split(' ');
  if (tokens.some((token) => token === word)) return 80;
  if (tokens.some((token) => token.startsWith(word))) return 60;
  if (text.includes(word)) return 35;
  return isSubsequence(word, text) ? 10 : 0;
}

function isSubsequence(needle: string, haystack: string): boolean {
  let i = 0;
  for (const char of haystack) {
    if (char === needle[i]) i += 1;
    if (i === needle.length) return true;
  }
  return false;
}
