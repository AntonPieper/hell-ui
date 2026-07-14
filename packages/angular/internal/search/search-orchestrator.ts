import { signal, type DestroyRef } from '@angular/core';
import type {
  HellSearchField,
  HellSearchRequest,
  HellSearchResult,
  HellSearchService,
  HellSearchSource,
} from '@hell-ui/angular/core';

/** Search inputs captured at the moment a query runs (everything but the query). */
export interface HellSearchOrchestratorOptions<T> {
  /** Local items ranked by `HellSearchService` when no source is given. */
  readonly items?: readonly T[];
  /** Optional async source; newer searches abort older source requests. */
  readonly source?: HellSearchSource<T> | null;
  /** Weighted local fields used for local items or raw source items. */
  readonly fields?: readonly HellSearchField<T>[];
  /** Max results after local ranking or source-provided ordering. */
  readonly limit?: number;
  /** Opaque caller context forwarded to the source. */
  readonly params?: unknown;
}

/**
 * Debounce, cancellation, stale-result protection, and loading/error state
 * around `HellSearchService`. One implementation of the async search
 * lifecycle shared by search-driven composites (omnibar, combobox): newer
 * searches abort older ones, stale responses never overwrite fresh results,
 * and `cancel` stops pending work without clearing rendered results.
 */
export class HellSearchOrchestrator<T> {
  /** Whether the newest search is still in flight. */
  readonly loading = signal(false);
  /** Error thrown by the newest search, or `null`. */
  readonly error = signal<unknown>(null);
  /** Results of the newest completed search. */
  readonly results = signal<readonly HellSearchResult<T>[]>([]);

  private timer: ReturnType<typeof setTimeout> | null = null;
  private controller: AbortController | null = null;
  private requestId = 0;

  constructor(private readonly searchService: HellSearchService) {}

  /** Cancels pending work when `destroyRef` tears down. */
  connect(destroyRef: DestroyRef): void {
    destroyRef.onDestroy(() => this.cancel());
  }

  /** Debounce a search request, replacing any pending scheduled search. */
  scheduleSearch(query: string, options: HellSearchOrchestratorOptions<T>, debounceMs: number): void {
    this.clearTimer();
    const delay = Math.max(0, debounceMs);
    this.timer = setTimeout(() => {
      void this.searchNow(query, options);
    }, delay);
  }

  /**
   * Run a search immediately and ignore/abort any older in-flight request.
   * Resolves `true` when this request's outcome is the one left in the
   * signals, `false` when a newer search or `cancel` superseded it — callers
   * chaining settle work must not treat superseded settles as current.
   */
  async searchNow(query: string, options: HellSearchOrchestratorOptions<T>): Promise<boolean> {
    const id = ++this.requestId;
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.loading.set(true);
    this.error.set(null);

    try {
      const request: HellSearchRequest<T> = {
        items: options.items,
        source: options.source,
        fields: options.fields,
        limit: options.limit,
        params: options.params,
        query,
        signal: controller.signal,
      };
      const results = await this.searchService.search<T>(request);
      if (id !== this.requestId || controller.signal.aborted) return false;
      this.results.set(results);
      return true;
    } catch (error) {
      if (id !== this.requestId || controller.signal.aborted) return false;
      this.results.set([]);
      this.error.set(error);
      return true;
    } finally {
      if (id === this.requestId) this.loading.set(false);
    }
  }

  /** Cancel pending timers and active source work without clearing rendered results. */
  cancel(): void {
    this.clearTimer();
    this.controller?.abort();
    this.controller = null;
    this.requestId += 1;
    this.loading.set(false);
  }

  /** Reset results and error, e.g. when the search surface closes. */
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
