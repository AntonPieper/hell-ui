import { of } from 'rxjs';

import {
  HellSearchService,
  hellSearchKey,
  hellSearchWords,
  type HellSearchSource,
  type HellSearchSourceRequest,
} from './search';

describe('Search Core', () => {
  const service = new HellSearchService();

  it('normalizes accents, punctuation, and ampersands into searchable words', () => {
    const accented = 'Cre\u0300me & Cafe\u0301/Bar';

    expect(hellSearchKey(`  ${accented}  `)).toBe('creme and cafe bar');
    expect(hellSearchWords(accented)).toEqual(['creme', 'and', 'cafe', 'bar']);
  });

  it('keeps non-Latin letters and Unicode numbers searchable', () => {
    expect(hellSearchKey('Привет κόσμε 東京 ٢٥')).toBe('привет κοσμε 東京 ٢٥');
    expect(hellSearchWords('東京 Привет')).toEqual(['東京', 'привет']);
  });

  it('ranks field matches by weight while requiring every query word', () => {
    const items = [
      { id: 'owned', title: 'Alpha Center', meta: 'Ops' },
      { id: 'mixed', title: 'Center', meta: 'Alpha' },
      { id: 'partial', title: 'Alpha', meta: 'Ops' },
    ] as const;

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

    const results = await service.search({ query: 'admin panel', items });

    expect(results.map((result) => result.item.id)).toEqual(['target']);
  });

  it('honors source-provided result order while forwarding request context', async () => {
    const signal = new AbortController().signal;
    const calls: HellSearchSourceRequest[] = [];
    const source: HellSearchSource<string> = (request) => {
      calls.push(request);
      return of({
        results: [
          { item: 'remote-low', score: 1 },
          { item: 'remote-high', score: 99 },
        ],
      });
    };

    const results = await service.search({
      query: 'ignored',
      limit: 1,
      params: { tenant: 'acme' },
      signal,
      source,
    });

    expect(results).toEqual([{ item: 'remote-low', score: 1 }]);
    expect(calls[0]).toMatchObject({
      query: 'ignored',
      limit: 1,
      params: { tenant: 'acme' },
      signal,
    });
  });
});
