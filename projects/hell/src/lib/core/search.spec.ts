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

  it('normalizes punctuation to spaces without Unicode property escapes', () => {
    expect(hellSearchWords('alpha-beta_gamma.Δυναμική')).toEqual([
      'alpha',
      'beta',
      'gamma',
      'δυναμικη',
    ]);
    expect(hellSearchWords('東京・大阪')).toEqual(['東京', '大阪']);
    expect(hellSearchKey.toString()).not.toContain('\\p{');
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

  it('can delegate local ranking to an injected ranker adapter', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHellSearchRanker((items) =>
          items.map((item, index) => ({ item, score: 100 - index })),
        ),
      ],
    });

    const injected = TestBed.inject(HellSearchService);
    const results = await injected.search({ query: 'ignored', items: ['alpha', 'beta'], limit: 1 });

    expect(results).toEqual([{ item: 'alpha', score: 100 }]);
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

    const service = TestBed.inject(HellSearchService);
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
