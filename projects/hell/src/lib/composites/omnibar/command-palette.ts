import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { HellSearchRequest, HellSearchResult, HellSearchService } from '../../core/search';

/**
 * Search state engine behind `HellOmnibar`. It owns debounce, cancellation,
 * stale-result suppression, and error/loading signals around `HellSearchService`.
 */
@Injectable()
export class HellCommandPaletteService<T = unknown> {
  private readonly searchService = inject(HellSearchService);
  private readonly destroyRef = inject(DestroyRef);

  readonly query = signal('');
  readonly open = signal(false);
  readonly loading = signal(false);
  readonly error = signal<unknown | null>(null);
  readonly results = signal<readonly HellSearchResult<T>[]>([]);

  private timer: ReturnType<typeof setTimeout> | null = null;
  private controller: AbortController | null = null;
  private requestId = 0;

  constructor() {
    this.destroyRef.onDestroy(() => this.cancel());
  }

  setQuery(query: string): void {
    this.query.set(query);
  }

  setOpen(open: boolean): void {
    this.open.set(open);
  }

  /** Debounce a search using current query; later schedules replace earlier ones. */
  scheduleSearch(
    request: Omit<HellSearchRequest<T>, 'query' | 'signal'>,
    debounceMs: number,
  ): void {
    this.clearTimer();
    const delay = Math.max(0, debounceMs);
    this.timer = setTimeout(() => {
      void this.searchNow(request);
    }, delay);
  }

  /** Run immediately, aborting any older request and ignoring stale completions. */
  async searchNow(request: Omit<HellSearchRequest<T>, 'query' | 'signal'>): Promise<void> {
    const id = ++this.requestId;
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.loading.set(true);
    this.error.set(null);

    try {
      const results = await this.searchService.search<T>({
        ...request,
        query: this.query(),
        signal: controller.signal,
      });
      if (id !== this.requestId || controller.signal.aborted) return;
      this.results.set(results);
    } catch (error) {
      if (id !== this.requestId || controller.signal.aborted) return;
      this.results.set([]);
      this.error.set(error);
    } finally {
      if (id === this.requestId) this.loading.set(false);
    }
  }

  /** Stop pending debounce/current fetch and mark the palette idle. */
  cancel(): void {
    this.clearTimer();
    this.controller?.abort();
    this.controller = null;
    this.requestId += 1;
    this.loading.set(false);
  }

  /** Clear visible results/errors without changing query or open state. */
  clearResults(): void {
    this.results.set([]);
    this.error.set(null);
  }

  private clearTimer(): void {
    if (this.timer === null) return;
    clearTimeout(this.timer);
    this.timer = null;
  }
}
