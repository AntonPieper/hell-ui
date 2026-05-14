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
  const normalized = value.normalize('NFKD').toLocaleLowerCase().replace(/&/g, ' and ');
  const withoutMarks = HELL_UNICODE_SEARCH_REGEX
    ? normalized.replace(HELL_UNICODE_SEARCH_REGEX.mark, '')
    : stripFallbackCombiningMarks(normalized);
  const searchKey = HELL_UNICODE_SEARCH_REGEX
    ? withoutMarks.replace(HELL_UNICODE_SEARCH_REGEX.notLetterOrNumber, ' ')
    : keepFallbackSearchCharacters(withoutMarks);

  return searchKey.replace(/\s+/g, ' ').trim();
}

const HELL_UNICODE_PROPERTY_PREFIX = '\\' + 'p';
const HELL_UNICODE_SEARCH_REGEX = hellUnicodeSearchRegex();

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

function stripFallbackCombiningMarks(value: string): string {
  let normalized = '';

  for (const char of value) {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined || !isFallbackMark(codePoint)) normalized += char;
  }

  return normalized;
}

function keepFallbackSearchCharacters(value: string): string {
  let normalized = '';

  for (const char of value) {
    normalized += isFallbackSearchWord(char) ? char : ' ';
  }

  return normalized;
}

function isFallbackMark(codePoint: number): boolean {
  return HELL_FALLBACK_MARK_RANGES.some(([start, end]) => codePoint >= start && codePoint <= end);
}

function isFallbackSearchWord(char: string): boolean {
  const codePoint = char.codePointAt(0);
  if (codePoint === undefined) return false;
  if (isAsciiLetterOrDigit(codePoint)) return true;
  if (codePoint <= 0x7f) return false;
  return !isFallbackSeparatorOrSymbol(codePoint);
}

function isAsciiLetterOrDigit(codePoint: number): boolean {
  return (
    (codePoint >= 0x30 && codePoint <= 0x39) ||
    (codePoint >= 0x61 && codePoint <= 0x7a) ||
    (codePoint >= 0x41 && codePoint <= 0x5a)
  );
}

function isFallbackSeparatorOrSymbol(codePoint: number): boolean {
  return HELL_FALLBACK_SEPARATOR_RANGES.some(
    ([start, end]) => codePoint >= start && codePoint <= end,
  );
}

const HELL_FALLBACK_MARK_RANGES: readonly (readonly [number, number])[] = [
  [0x0300, 0x036f],
  [0x0483, 0x0489],
  [0x0591, 0x05bd],
  [0x05bf, 0x05bf],
  [0x05c1, 0x05c2],
  [0x05c4, 0x05c5],
  [0x05c7, 0x05c7],
  [0x0610, 0x061a],
  [0x064b, 0x065f],
  [0x0670, 0x0670],
  [0x06d6, 0x06ed],
  [0x0711, 0x0711],
  [0x0730, 0x074a],
  [0x07a6, 0x07b0],
  [0x07eb, 0x07f3],
  [0x0816, 0x082d],
  [0x0859, 0x085b],
  [0x08d3, 0x08ff],
  [0x0900, 0x0903],
  [0x093a, 0x093c],
  [0x0941, 0x0948],
  [0x094d, 0x094d],
  [0x0951, 0x0957],
  [0x0962, 0x0963],
  [0x1ab0, 0x1aff],
  [0x1dc0, 0x1dff],
  [0x20d0, 0x20ff],
  [0xfe20, 0xfe2f],
];

const HELL_FALLBACK_SEPARATOR_RANGES: readonly (readonly [number, number])[] = [
  [0x00a0, 0x00bf],
  [0x02b0, 0x036f],
  [0x037e, 0x037e],
  [0x0387, 0x0387],
  [0x055a, 0x055f],
  [0x0589, 0x058a],
  [0x05be, 0x05be],
  [0x05c0, 0x05c0],
  [0x05c3, 0x05c3],
  [0x05c6, 0x05c6],
  [0x060c, 0x060d],
  [0x061b, 0x061b],
  [0x061f, 0x061f],
  [0x066a, 0x066d],
  [0x06d4, 0x06d4],
  [0x0700, 0x070d],
  [0x07f7, 0x07f9],
  [0x0964, 0x0965],
  [0x0970, 0x0970],
  [0x0e3f, 0x0e3f],
  [0x0f04, 0x0f12],
  [0x104a, 0x104f],
  [0x1360, 0x137c],
  [0x16eb, 0x16ed],
  [0x1735, 0x1736],
  [0x17d4, 0x17d6],
  [0x17d8, 0x17db],
  [0x1800, 0x180a],
  [0x1944, 0x1945],
  [0x1a1e, 0x1a1f],
  [0x1aa0, 0x1aa6],
  [0x1aa8, 0x1aad],
  [0x1b5a, 0x1b6a],
  [0x1b74, 0x1b7c],
  [0x1c3b, 0x1c3f],
  [0x1c7e, 0x1c7f],
  [0x2000, 0x206f],
  [0x2070, 0x209f],
  [0x20a0, 0x20cf],
  [0x2100, 0x214f],
  [0x2190, 0x23ff],
  [0x2460, 0x27bf],
  [0x2900, 0x2bff],
  [0x2e00, 0x2e7f],
  [0x3000, 0x303f],
  [0xa490, 0xa4cf],
  [0xa60d, 0xa60f],
  [0xa6f2, 0xa6f7],
  [0xa700, 0xa71f],
  [0xa830, 0xa839],
  [0xfd3e, 0xfd3f],
  [0xfe10, 0xfe6f],
  [0xff00, 0xff0f],
  [0xff1a, 0xff20],
  [0xff3b, 0xff40],
  [0xff5b, 0xff65],
  [0xffe0, 0xffee],
  [0x1f000, 0x1faff],
];

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
