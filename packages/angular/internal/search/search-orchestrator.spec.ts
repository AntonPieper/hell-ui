import type { HellSearchRequest, HellSearchResult, HellSearchService } from '@hell-ui/angular/core';

import { HellSearchOrchestrator } from './search-orchestrator';

interface Deferred<T> {
  readonly promise: Promise<T>;
  resolve(value: T): void;
  reject(reason?: unknown): void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

class FakeSearchService {
  readonly requests: Array<HellSearchRequest<string>> = [];
  readonly pending: Array<Deferred<readonly HellSearchResult<string>[]>> = [];

  search(request: HellSearchRequest<string>): Promise<readonly HellSearchResult<string>[]> {
    this.requests.push(request);
    const gate = deferred<readonly HellSearchResult<string>[]>();
    this.pending.push(gate);
    return gate.promise;
  }
}

function results(...items: readonly string[]): readonly HellSearchResult<string>[] {
  return items.map((item, index) => ({ item, score: items.length - index }));
}

describe('HellSearchOrchestrator', () => {
  it('tracks loading, forwards the query and abort signal, and publishes results', async () => {
    const service = new FakeSearchService();
    const orchestrator = new HellSearchOrchestrator<string>(
      service as unknown as HellSearchService,
    );

    const search = orchestrator.searchNow('alpha', { items: ['a'] });
    expect(orchestrator.loading()).toBe(true);
    expect(service.requests[0]?.query).toBe('alpha');
    expect(service.requests[0]?.signal).toBeInstanceOf(AbortSignal);

    service.pending[0]?.resolve(results('a'));
    await search;

    expect(orchestrator.loading()).toBe(false);
    expect(orchestrator.error()).toBeNull();
    expect(orchestrator.results().map(({ item }) => item)).toEqual(['a']);
  });

  it('ignores a stale response once a newer search has started', async () => {
    const service = new FakeSearchService();
    const orchestrator = new HellSearchOrchestrator<string>(
      service as unknown as HellSearchService,
    );

    const first = orchestrator.searchNow('one', {});
    const second = orchestrator.searchNow('two', {});

    expect(service.requests[0]?.signal?.aborted).toBe(true);

    service.pending[0]?.resolve(results('stale'));
    service.pending[1]?.resolve(results('fresh'));
    const [firstWon, secondWon] = await Promise.all([first, second]);

    expect(firstWon).toBe(false);
    expect(secondWon).toBe(true);
    expect(orchestrator.results().map(({ item }) => item)).toEqual(['fresh']);
    expect(orchestrator.loading()).toBe(false);
  });

  it('resolves false for searches superseded while their response was still pending', async () => {
    const service = new FakeSearchService();
    const orchestrator = new HellSearchOrchestrator<string>(
      service as unknown as HellSearchService,
    );

    const inflight = orchestrator.searchNow('one', {});
    orchestrator.cancel();
    service.pending[0]?.resolve(results('stale'));

    expect(await inflight).toBe(false);
    expect(orchestrator.results()).toEqual([]);
  });

  it('captures errors from the active request only', async () => {
    const service = new FakeSearchService();
    const orchestrator = new HellSearchOrchestrator<string>(
      service as unknown as HellSearchService,
    );

    const first = orchestrator.searchNow('one', {});
    const second = orchestrator.searchNow('two', {});

    service.pending[0]?.reject(new Error('stale failure'));
    service.pending[1]?.reject(new Error('fresh failure'));
    const [firstWon, secondWon] = await Promise.all([first, second]);

    expect(firstWon).toBe(false);
    expect(secondWon).toBe(true);
    expect((orchestrator.error() as Error).message).toBe('fresh failure');
    expect(orchestrator.results()).toEqual([]);
    expect(orchestrator.loading()).toBe(false);
  });

  it('debounces scheduled searches, replacing the pending one', async () => {
    vi.useFakeTimers();
    try {
      const service = new FakeSearchService();
      const orchestrator = new HellSearchOrchestrator<string>(
        service as unknown as HellSearchService,
      );

      orchestrator.scheduleSearch('on', {}, 100);
      vi.advanceTimersByTime(50);
      orchestrator.scheduleSearch('one', {}, 100);
      vi.advanceTimersByTime(99);
      expect(service.requests).toHaveLength(0);

      vi.advanceTimersByTime(1);
      expect(service.requests).toHaveLength(1);
      expect(service.requests[0]?.query).toBe('one');
    } finally {
      vi.useRealTimers();
    }
  });

  it('invalidates active work as soon as a newer search is scheduled', async () => {
    vi.useFakeTimers();
    try {
      const service = new FakeSearchService();
      const orchestrator = new HellSearchOrchestrator<string>(
        service as unknown as HellSearchService,
      );

      const inflight = orchestrator.searchNow('old', {});
      orchestrator.scheduleSearch('new', {}, 100);

      expect(service.requests[0]?.signal?.aborted).toBe(true);
      expect(orchestrator.loading()).toBe(false);

      service.pending[0]?.resolve(results('stale'));
      expect(await inflight).toBe(false);
      expect(orchestrator.results()).toEqual([]);

      vi.advanceTimersByTime(100);
      expect(service.requests[1]?.query).toBe('new');
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancel aborts in-flight work and pending timers without clearing rendered results', async () => {
    vi.useFakeTimers();
    try {
      const service = new FakeSearchService();
      const orchestrator = new HellSearchOrchestrator<string>(
        service as unknown as HellSearchService,
      );

      const search = orchestrator.searchNow('one', {});
      service.pending[0]?.resolve(results('kept'));
      await vi.runAllTimersAsync();
      await search;
      expect(orchestrator.results().map(({ item }) => item)).toEqual(['kept']);

      orchestrator.scheduleSearch('two', {}, 100);
      const inflight = orchestrator.searchNow('three', {});
      orchestrator.cancel();

      expect(service.requests[1]?.signal?.aborted).toBe(true);
      service.pending[1]?.resolve(results('dropped'));
      await vi.runAllTimersAsync();
      await inflight;

      expect(orchestrator.results().map(({ item }) => item)).toEqual(['kept']);
      expect(orchestrator.loading()).toBe(false);
      expect(service.requests).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('clearResults resets results and error', async () => {
    const service = new FakeSearchService();
    const orchestrator = new HellSearchOrchestrator<string>(
      service as unknown as HellSearchService,
    );

    const search = orchestrator.searchNow('one', {});
    service.pending[0]?.reject(new Error('boom'));
    await search;
    expect(orchestrator.error()).not.toBeNull();

    orchestrator.clearResults();

    expect(orchestrator.results()).toEqual([]);
    expect(orchestrator.error()).toBeNull();
  });
});
