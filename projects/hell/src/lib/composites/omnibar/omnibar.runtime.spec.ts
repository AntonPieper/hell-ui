import { TestBed } from '@angular/core/testing';

import { HellOmnibarRuntime } from './omnibar.runtime';
import type { HellSearchResponse, HellSearchSource } from '../../core/search';

describe('HellOmnibarRuntime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps only the latest async search result and aborts superseded work', async () => {
    await TestBed.configureTestingModule({
      providers: [HellOmnibarRuntime],
    });
    const runtime = TestBed.inject(HellOmnibarRuntime) as HellOmnibarRuntime<{
      readonly id: string;
    }>;
    const first = deferred<HellSearchResponse<{ readonly id: string }>>();
    const second = deferred<HellSearchResponse<{ readonly id: string }>>();
    let firstSignal: AbortSignal | undefined;
    let secondSignal: AbortSignal | undefined;
    const firstSource: HellSearchSource<{ readonly id: string }> = (request) => {
      firstSignal = request.signal;
      return first.promise;
    };
    const secondSource: HellSearchSource<{ readonly id: string }> = (request) => {
      secondSignal = request.signal;
      return second.promise;
    };

    runtime.setQuery('first');
    const firstSearch = runtime.searchNow({ source: firstSource });
    runtime.setQuery('second');
    const secondSearch = runtime.searchNow({ source: secondSource });

    expect(firstSignal?.aborted).toBe(true);
    expect(secondSignal?.aborted).toBe(false);

    second.resolve({ results: [{ item: { id: 'second' }, score: 1 }] });
    await secondSearch;

    expect(runtime.results().map((result) => result.item.id)).toEqual(['second']);
    expect(runtime.loading()).toBe(false);

    first.resolve({ results: [{ item: { id: 'first' }, score: 99 }] });
    await firstSearch;

    expect(runtime.results().map((result) => result.item.id)).toEqual(['second']);
    expect(runtime.loading()).toBe(false);
  });

  it('cancels scheduled searches before the debounce fires', () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [HellOmnibarRuntime],
    });
    const runtime = TestBed.inject(HellOmnibarRuntime);
    const source = vi.fn(() => ({ results: [] }));

    runtime.scheduleSearch({ source }, 25);
    vi.advanceTimersByTime(24);
    runtime.cancel();
    vi.advanceTimersByTime(1);

    expect(source).not.toHaveBeenCalled();
    expect(runtime.loading()).toBe(false);
  });
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
