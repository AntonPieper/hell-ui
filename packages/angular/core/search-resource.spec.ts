import { DestroyRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideHellSearchRanker, type HellSearchSourceRequest } from './search';
import { hellSearchResource } from './search-resource';

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

async function settleResource(): Promise<void> {
  TestBed.tick();
  for (let index = 0; index < 6; index += 1) await Promise.resolve();
  TestBed.tick();
}

describe('hellSearchResource', () => {
  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('ranks local signal items through the configured ranker and reacts to collection changes', async () => {
    const query = signal('alpha');
    const sourceItems = signal<readonly string[]>(['alpha-one', 'beta']);
    const requests: string[] = [];

    TestBed.configureTestingModule({
      providers: [
        provideHellSearchRanker((items, request) => {
          requests.push(request.query);
          return [...items]
            .reverse()
            .filter((item) => String(item).includes(request.query))
            .map((item, index) => ({ item, score: items.length - index }));
        }),
      ],
    });

    const resource = TestBed.runInInjectionContext(() =>
      hellSearchResource({ query, items: sourceItems }),
    );

    await settleResource();
    expect(resource.query).toBe(query);
    expect(resource.items()).toEqual(['alpha-one']);
    expect(resource.status()).toBe('success');
    expect(resource.error()).toBeNull();

    sourceItems.set(['alpha-two', 'alpha-one', 'gamma']);
    await settleResource();

    expect(resource.items()).toEqual(['alpha-one', 'alpha-two']);

    query.set('gamma');
    await settleResource();

    expect(resource.items()).toEqual(['gamma']);
    expect(requests).toEqual(['alpha', 'alpha', 'gamma']);
  });

  it('debounces async dispatch and forwards query, params, limit, and AbortSignal', async () => {
    vi.useFakeTimers();
    const query = signal('ada');
    const calls: HellSearchSourceRequest<{ readonly team: string }>[] = [];

    const resource = TestBed.runInInjectionContext(() =>
      hellSearchResource({
        query,
        debounce: 80,
        limit: 5,
        params: { team: 'platform' },
        source: (request) => {
          calls.push(request);
          return [{ id: request.query }];
        },
      }),
    );

    TestBed.tick();
    await vi.advanceTimersByTimeAsync(79);
    expect(calls).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(1);
    await settleResource();

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      query: 'ada',
      limit: 5,
      params: { team: 'platform' },
    });
    expect(calls[0]?.signal).toBeInstanceOf(AbortSignal);
    expect(resource.items()).toEqual([{ id: 'ada' }]);
  });

  it('aborts older work and never lets a stale success replace current items', async () => {
    vi.useFakeTimers();
    const query = signal('one');
    const calls: HellSearchSourceRequest[] = [];
    const pending: Array<Deferred<readonly string[]>> = [];

    const resource = TestBed.runInInjectionContext(() =>
      hellSearchResource({
        query,
        debounce: 0,
        source: (request) => {
          calls.push(request);
          const gate = deferred<readonly string[]>();
          pending.push(gate);
          return gate.promise;
        },
      }),
    );

    TestBed.tick();
    await vi.advanceTimersByTimeAsync(0);
    query.set('two');
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(0);

    expect(calls).toHaveLength(2);
    expect(calls[0]?.signal?.aborted).toBe(true);

    pending[1]?.resolve(['two fresh']);
    await settleResource();
    pending[0]?.resolve(['one stale']);
    await settleResource();

    expect(resource.items()).toEqual(['two fresh']);
    expect(resource.status()).toBe('success');
  });

  it('ignores stale failures and clears an active error after a later success', async () => {
    vi.useFakeTimers();
    const query = signal('one');
    const pending: Array<Deferred<readonly string[]>> = [];

    const resource = TestBed.runInInjectionContext(() =>
      hellSearchResource({
        query,
        debounce: 0,
        source: () => {
          const gate = deferred<readonly string[]>();
          pending.push(gate);
          return gate.promise;
        },
      }),
    );

    TestBed.tick();
    await vi.advanceTimersByTimeAsync(0);
    query.set('two');
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(0);

    pending[0]?.reject(new Error('stale'));
    pending[1]?.reject(new Error('current'));
    await settleResource();

    expect((resource.error() as Error).message).toBe('current');
    expect(resource.items()).toEqual([]);
    expect(resource.status()).toBe('error');

    query.set('three');
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(0);
    pending[2]?.resolve(['three recovered']);
    await settleResource();

    expect(resource.items()).toEqual(['three recovered']);
    expect(resource.error()).toBeNull();
    expect(resource.status()).toBe('success');
  });

  it('refreshes immediately without a query change or debounce delay', async () => {
    vi.useFakeTimers();
    const query = signal('same');
    let calls = 0;

    const resource = TestBed.runInInjectionContext(() =>
      hellSearchResource({
        query,
        debounce: 500,
        source: () => [{ id: ++calls, label: 'same' }],
      }),
    );

    TestBed.tick();
    await vi.advanceTimersByTimeAsync(500);
    await settleResource();
    expect(resource.items()).toEqual([{ id: 1, label: 'same' }]);

    resource.refresh();
    expect(calls).toBe(2);
    await settleResource();
    expect(resource.items()).toEqual([{ id: 2, label: 'same' }]);
  });

  it('cancels scheduled and in-flight work while preserving settled items', async () => {
    vi.useFakeTimers();
    const query = signal('kept');
    const calls: HellSearchSourceRequest[] = [];
    const pending: Array<Deferred<readonly string[]>> = [];

    const resource = TestBed.runInInjectionContext(() =>
      hellSearchResource({
        query,
        debounce: 50,
        source: (request) => {
          calls.push(request);
          const gate = deferred<readonly string[]>();
          pending.push(gate);
          return gate.promise;
        },
      }),
    );

    TestBed.tick();
    await vi.advanceTimersByTimeAsync(50);
    pending[0]?.resolve(['kept']);
    await settleResource();

    query.set('scheduled');
    TestBed.tick();
    resource.cancel();
    await vi.advanceTimersByTimeAsync(50);
    expect(calls).toHaveLength(1);

    resource.refresh();
    expect(calls).toHaveLength(2);
    resource.cancel();
    expect(calls[1]?.signal?.aborted).toBe(true);
    pending[1]?.resolve(['dropped']);
    await settleResource();

    expect(resource.items()).toEqual(['kept']);
    expect(resource.status()).toBe('success');
  });

  it('clears query, items, error, and status without scheduling an empty-query search', async () => {
    vi.useFakeTimers();
    const query = signal('one');
    const calls: HellSearchSourceRequest[] = [];

    const resource = TestBed.runInInjectionContext(() =>
      hellSearchResource({
        query,
        debounce: 0,
        source: (request) => {
          calls.push(request);
          return Promise.reject(new Error('boom'));
        },
      }),
    );

    TestBed.tick();
    await vi.advanceTimersByTimeAsync(0);
    await settleResource();
    expect(resource.status()).toBe('error');

    resource.clear();
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(0);

    expect(query()).toBe('');
    expect(resource.items()).toEqual([]);
    expect(resource.error()).toBeNull();
    expect(resource.status()).toBe('idle');
    expect(calls).toHaveLength(1);
  });

  it('cancels active work when its injection context is destroyed', async () => {
    vi.useFakeTimers();
    const query = signal('one');
    let request: HellSearchSourceRequest | undefined;

    const resource = TestBed.runInInjectionContext(() => {
      const destroyRef = TestBed.inject(DestroyRef);
      const created = hellSearchResource({
        query,
        debounce: 0,
        source: (next) => {
          request = next;
          return new Promise<readonly string[]>(() => undefined);
        },
      });
      expect(destroyRef).toBeDefined();
      return created;
    });

    TestBed.tick();
    await vi.advanceTimersByTimeAsync(0);
    expect(resource.status()).toBe('loading');

    TestBed.resetTestingModule();

    expect(request?.signal?.aborted).toBe(true);
    expect(resource.status()).toBe('idle');
  });
});
