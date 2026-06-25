import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import {
  HellSearchService,
  hellSearchKey,
  hellSearchWords,
  provideHellSearchRanker,
  type HellSearchSource,
  type HellSearchSourceRequest,
} from './search';

describe('Search Core', () => {
  it('normalizes accents, punctuation, and ampersands into searchable words', () => {
    const accented = 'Cre\u0300me & Cafe\u0301/Bar';

    expect(hellSearchKey(`  ${accented}  `)).toBe('creme and cafe bar');
    expect(hellSearchWords(accented)).toEqual(['creme', 'and', 'cafe', 'bar']);
  });

  it('keeps non-Latin letters and Unicode numbers searchable', () => {
    expect(hellSearchKey('Привет κόσμε 東京 ٢٥')).toBe('привет κοσμε 東京 ٢٥');
    expect(hellSearchWords('東京 Привет')).toEqual(['東京', 'привет']);
    expect(hellSearchWords('שלום العربية 한글 हिन्दी')).toEqual([
      'שלום',
      'العربية',
      '한글',
      'हनद',
    ]);
  });

  it('normalizes punctuation to spaces while preserving Unicode words', () => {
    expect(hellSearchWords('alpha-beta_gamma.Δυναμική')).toEqual([
      'alpha',
      'beta',
      'gamma',
      'δυναμικη',
    ]);
    expect(hellSearchWords('東京・大阪')).toEqual(['東京', '大阪']);
  });

  it('ranks exact and prefix token matches and requires all query words', () => {
    const service = TestBed.inject(HellSearchService);
    const results = service.rank(
      [
        { id: 'exact', title: 'alpha center', tags: 'admin' },
        { id: 'prefix', title: 'alphacentral centerline', tags: 'admin' },
        { id: 'include', title: 'xalpha ycenter', tags: 'admin' },
      ] as const,
      {
        query: 'alpha center',
        fields: [{ weight: 3, get: (item) => item.title }, { weight: 1, get: (item) => item.tags }],
      },
    );

    expect(results.map((result) => result.item.id)).toEqual(['exact', 'prefix', 'include']);

    const exact = results.find((result) => result.item.id === 'exact');
    const prefix = results.find((result) => result.item.id === 'prefix');
    expect(exact && prefix ? exact.score : 0).toBeGreaterThan(prefix?.score ?? 0);
  });

  it('ranks field matches by weight while requiring every query word', () => {
    const items = [
      { id: 'owned', title: 'Alpha Center', meta: 'Ops' },
      { id: 'mixed', title: 'Center', meta: 'Alpha' },
      { id: 'partial', title: 'Alpha', meta: 'Ops' },
    ] as const;

    const service = TestBed.inject(HellSearchService);
    const results = service.rank(items, {
      query: 'alpha center',
      fields: [
        { weight: 3, get: (item) => item.title },
        { weight: 1, get: (item) => item.meta },
      ],
    });

    expect(results.map((result) => result.item.id)).toEqual(['owned', 'mixed']);
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it('searches nested item values when callers do not provide fields', async () => {
    interface SearchFixtureItem {
      readonly id: string;
      readonly title: string;
      readonly metadata: { readonly labels: readonly string[] };
      self?: unknown;
    }

    const target: SearchFixtureItem = {
      id: 'target',
      title: 'Settings',
      metadata: { labels: ['Admin Panel'] },
    };
    target.self = target;
    const items: SearchFixtureItem[] = [
      { id: 'other', title: 'Billing', metadata: { labels: ['Invoices'] } },
      target,
    ];

    const service = TestBed.inject(HellSearchService);
    const results = await service.search({ query: 'admin panel', items });

    expect(results.map((result) => result.item.id)).toEqual(['target']);
  });

  it('passes query, fields, and limit context into a custom ranker', async () => {
    interface Item {
      readonly title: string;
      readonly code: string;
    }

    const fields = [
      { name: 'title', weight: 5, get: (item: Item) => item.title },
      { name: 'code', weight: 2, get: (item: Item) => item.code },
    ] as const;

    let capturedRequest:
      | {
          readonly query: string;
          readonly fields?: unknown;
          readonly limit?: number;
        }
      | undefined;

    TestBed.configureTestingModule({
      providers: [
        provideHellSearchRanker((items, request) => {
          capturedRequest = {
            query: request.query,
            fields: request.fields,
            limit: request.limit,
          };
          return items.map((item, index) => ({ item, score: 100 - index }));
        }),
      ],
    });

    const service = TestBed.inject(HellSearchService);
    const results = await service.search({
      query: 'alpha',
      limit: 1,
      fields,
      items: [
        { title: 'Alpha', code: 'A' },
        { title: 'Beta', code: 'B' },
      ],
    });

    expect(results).toEqual([{ item: { title: 'Alpha', code: 'A' }, score: 100 }]);
    expect(capturedRequest).toMatchObject({
      query: 'alpha',
      fields,
      limit: 1,
    });
  });

  it('passes source-returned raw items through the injected ranker', async () => {
    let observedItems: readonly unknown[] = [];

    TestBed.configureTestingModule({
      providers: [
        provideHellSearchRanker((items) => {
          observedItems = items;
          return items.map((item, index) => ({
            item: item as never,
            score: 100 - index,
          }));
        }),
      ],
    });

    const service = TestBed.inject(HellSearchService);
    const source: HellSearchSource<string> = () =>
      of({
        items: ['remote-alpha', 'remote-beta'],
      });

    const results = await service.search({
      query: 'ignored',
      source,
    });

    expect(observedItems).toEqual(['remote-alpha', 'remote-beta']);
    expect(results).toEqual([
      { item: 'remote-alpha', score: 100 },
      { item: 'remote-beta', score: 99 },
    ]);
  });

  it('preserves source-provided result order and request context', async () => {
    const signal = new AbortController().signal;
    const calls: HellSearchSourceRequest[] = [];
    const source: HellSearchSource<string> = (request) => {
      calls.push(request);
      return of({
        results: [
          { item: 'remote-low', score: 1 },
          { item: 'remote-high', score: 99 },
          { item: 'remote-mid', score: 50 },
        ],
      });
    };

    const service = TestBed.inject(HellSearchService);
    const results = await service.search({
      query: 'ignored',
      limit: 2,
      params: { tenant: 'acme' },
      signal,
      source,
    });

    expect(results).toEqual([
      { item: 'remote-low', score: 1 },
      { item: 'remote-high', score: 99 },
    ]);
    expect(calls[0]).toMatchObject({
      query: 'ignored',
      limit: 2,
      params: { tenant: 'acme' },
      signal,
    });
  });
});
