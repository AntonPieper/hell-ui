import { TestBed } from '@angular/core/testing';

import { HellCommandPaletteService } from './command-palette';
import type { HellSearchResponse, HellSearchSource } from '../../core/search';

describe('HellCommandPaletteService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps only the latest async search result and aborts superseded work', async () => {
    await TestBed.configureTestingModule({
      providers: [HellCommandPaletteService],
    });
    const palette = TestBed.inject(HellCommandPaletteService) as HellCommandPaletteService<{
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

    palette.setQuery('first');
    const firstSearch = palette.searchNow({ source: firstSource });
    palette.setQuery('second');
    const secondSearch = palette.searchNow({ source: secondSource });

    expect(firstSignal?.aborted).toBe(true);
    expect(secondSignal?.aborted).toBe(false);

    second.resolve({ results: [{ item: { id: 'second' }, score: 1 }] });
    await secondSearch;

    expect(palette.results().map((result) => result.item.id)).toEqual(['second']);
    expect(palette.loading()).toBe(false);

    first.resolve({ results: [{ item: { id: 'first' }, score: 99 }] });
    await firstSearch;

    expect(palette.results().map((result) => result.item.id)).toEqual(['second']);
    expect(palette.loading()).toBe(false);
  });

  it('cancels scheduled searches before the debounce fires', () => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [HellCommandPaletteService],
    });
    const palette = TestBed.inject(HellCommandPaletteService);
    const source = vi.fn(() => ({ results: [] }));

    palette.scheduleSearch({ source }, 25);
    vi.advanceTimersByTime(24);
    palette.cancel();
    vi.advanceTimersByTime(1);

    expect(source).not.toHaveBeenCalled();
    expect(palette.loading()).toBe(false);
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
