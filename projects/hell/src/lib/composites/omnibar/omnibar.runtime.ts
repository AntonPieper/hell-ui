import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import {
  HellSearchRequest,
  HellSearchResult,
  HellSearchService,
  type HellSearchField,
  type HellSearchSource,
} from '../../core/search';
import type { HellOmnibarRegisteredItem } from './omnibar';

export interface HellOmnibarSearchOptions<T> {
  readonly items?: readonly T[];
  readonly source?: HellSearchSource<T> | null;
  readonly fields?: readonly HellSearchField<T>[];
  readonly limit?: number;
  readonly params?: unknown;
}

/** Runtime behind HellOmnibar: search orchestration, item registry, and keyboard navigation. */
@Injectable()
export class HellOmnibarRuntime<T = unknown> {
  private readonly searchService = inject(HellSearchService);
  private readonly destroyRef = inject(DestroyRef);

  readonly query = signal('');
  readonly loading = signal(false);
  readonly error = signal<unknown | null>(null);
  readonly results = signal<readonly HellSearchResult<T>[]>([]);
  readonly items = signal<HellOmnibarRegisteredItem[]>([]);
  readonly actionItems = signal<unknown[]>([]);

  private readonly activeIndexState = signal(0);
  private timer: ReturnType<typeof setTimeout> | null = null;
  private controller: AbortController | null = null;
  private requestId = 0;

  readonly activeIndex = computed(() => {
    const items = this.items();
    if (!items.length) return -1;
    const i = this.activeIndexState();
    return Math.max(0, Math.min(i, items.length - 1));
  });

  readonly activeItemId = computed(() => {
    const items = this.items();
    const i = this.activeIndex();
    return items[i]?.itemId ?? null;
  });

  readonly isEmpty = computed(() => !this.loading() && this.items().length === 0);
  readonly hasActions = computed(() => this.actionItems().length > 0);

  constructor() {
    this.destroyRef.onDestroy(() => this.cancel());
  }

  resetActive(): void {
    this.activeIndexState.set(0);
  }

  setQuery(query: string): void {
    this.query.set(query);
  }

  scheduleSearch(options: HellOmnibarSearchOptions<T>, debounceMs: number): void {
    this.clearTimer();
    const delay = Math.max(0, debounceMs);
    this.timer = setTimeout(() => {
      void this.searchNow(options);
    }, delay);
  }

  async searchNow(options: HellOmnibarSearchOptions<T>): Promise<void> {
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
        query: this.query(),
        signal: controller.signal,
      };
      const results = await this.searchService.search<T>(request);
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

  cancel(): void {
    this.clearTimer();
    this.controller?.abort();
    this.controller = null;
    this.requestId += 1;
    this.loading.set(false);
  }

  clearResults(): void {
    this.results.set([]);
    this.error.set(null);
  }

  registerItem(item: HellOmnibarRegisteredItem): void {
    this.items.update((list) => [...list, item]);
  }

  unregisterItem(item: HellOmnibarRegisteredItem): void {
    this.items.update((list) => list.filter((i) => i !== item));
  }

  setActive(item: HellOmnibarRegisteredItem): void {
    const idx = this.items().indexOf(item);
    if (idx >= 0) this.activeIndexState.set(idx);
  }

  isActive(item: HellOmnibarRegisteredItem): boolean {
    return this.items()[this.activeIndex()] === item;
  }

  activeItem(): HellOmnibarRegisteredItem | null {
    return this.items()[this.activeIndex()] ?? null;
  }

  moveActive(delta: number): void {
    const len = this.items().length;
    if (!len) return;
    const cur = this.activeIndex();
    let next = cur + delta;
    if (next < 0) next = len - 1;
    if (next >= len) next = 0;
    this.activeIndexState.set(next);
    this.items()[next]?.scrollIntoView();
  }

  firstActive(): void {
    if (this.items().length) this.activeIndexState.set(0);
  }

  lastActive(): void {
    const length = this.items().length;
    if (length) this.activeIndexState.set(length - 1);
  }

  registerAction(action: unknown): void {
    this.actionItems.update((list) => [...list, action]);
  }

  unregisterAction(action: unknown): void {
    this.actionItems.update((list) => list.filter((a) => a !== action));
  }

  private clearTimer(): void {
    if (this.timer === null) return;
    clearTimeout(this.timer);
    this.timer = null;
  }
}
