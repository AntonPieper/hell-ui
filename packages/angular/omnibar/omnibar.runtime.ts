import { DestroyRef, Injectable, computed, inject, signal, type Signal } from '@angular/core';
import { HellSearchService, type HellSearchResult } from '@hell-ui/angular/core';
import {
  HellSearchOrchestrator,
  type HellSearchOrchestratorOptions,
} from '@hell-ui/angular/internal/search';
import type { HellOmnibarRegisteredAction, HellOmnibarRegisteredItem } from './omnibar';
import {
  HellOmnibarActiveItemController,
  type HellOmnibarActiveItemSnapshot,
} from './omnibar.active-item';

/** Search inputs captured from the component at the moment a query runs. */
export type HellOmnibarSearchOptions<T> = HellSearchOrchestratorOptions<T>;

/** Runtime behind HellOmnibar: search orchestration, item registry, and keyboard navigation. */
@Injectable()
export class HellOmnibarRuntime<T = unknown> {
  private readonly orchestrator = new HellSearchOrchestrator<T>(inject(HellSearchService));
  private readonly destroyRef = inject(DestroyRef);

  readonly query = signal('');
  // Annotated: when ng-packagr compiles this entry point against the internal
  // search module's flattened d.ts, these signal generics collapse to `any`
  // and would degrade the public omnibar surface.
  readonly loading: Signal<boolean> = this.orchestrator.loading;
  readonly error: Signal<unknown> = this.orchestrator.error;
  readonly results: Signal<readonly HellSearchResult<T>[]> = this.orchestrator.results;
  readonly items = signal<HellOmnibarRegisteredItem[]>([]);
  readonly actionItems = signal<HellOmnibarRegisteredAction[]>([]);

  private readonly activeItemController =
    new HellOmnibarActiveItemController<HellOmnibarRegisteredItem>();
  private readonly activeIndexState = signal(0);

  readonly activeIndex = computed(() =>
    this.activeItemController.activeIndex(this.activeSnapshot()),
  );

  readonly activeItemId = computed(() => this.activeItem()?.itemId ?? null);

  readonly isEmpty = computed(() => !this.loading() && this.items().length === 0);
  readonly hasActions = computed(() => this.actionItems().length > 0);

  constructor() {
    this.orchestrator.connect(this.destroyRef);
  }

  resetActive(): void {
    this.activeIndexState.set(this.activeItemController.reset());
  }

  setQuery(query: string): void {
    this.query.set(query);
  }

  /** Debounce a search request, replacing any pending scheduled search. */
  scheduleSearch(options: HellOmnibarSearchOptions<T>, debounceMs: number): void {
    this.orchestrator.scheduleSearch(this.query(), options, debounceMs);
  }

  /** Run a search immediately and ignore/abort any older in-flight request. */
  async searchNow(options: HellOmnibarSearchOptions<T>): Promise<void> {
    await this.orchestrator.searchNow(this.query(), options);
  }

  /** Cancel pending timers and active source work without clearing rendered results. */
  cancel(): void {
    this.orchestrator.cancel();
  }

  clearResults(): void {
    this.orchestrator.clearResults();
  }

  registerItem(item: HellOmnibarRegisteredItem): void {
    this.items.update((list) => [...list, item]);
  }

  unregisterItem(item: HellOmnibarRegisteredItem): void {
    this.items.update((list) => list.filter((i) => i !== item));
  }

  setActive(item: HellOmnibarRegisteredItem): void {
    const snapshot = this.activeSnapshot();
    const next = this.activeItemController.setActive(snapshot, item);
    if (next !== snapshot.activeIndex) this.activeIndexState.set(next);
  }

  isActive(item: HellOmnibarRegisteredItem): boolean {
    return this.activeItem() === item;
  }

  activeItem(): HellOmnibarRegisteredItem | null {
    return this.activeItemController.activeItem(this.activeSnapshot());
  }

  moveActive(delta: number): void {
    const movement = this.activeItemController.move(this.activeSnapshot(), delta);
    if (!movement.item) return;

    this.activeIndexState.set(movement.activeIndex);
    movement.item.scrollIntoView();
  }

  firstActive(): void {
    const snapshot = this.activeSnapshot();
    const next = this.activeItemController.first(snapshot);
    if (next !== snapshot.activeIndex) this.activeIndexState.set(next);
  }

  lastActive(): void {
    const snapshot = this.activeSnapshot();
    const next = this.activeItemController.last(snapshot);
    if (next !== snapshot.activeIndex) this.activeIndexState.set(next);
  }

  registerAction(action: HellOmnibarRegisteredAction): void {
    this.actionItems.update((list) => [...list, action]);
  }

  unregisterAction(action: HellOmnibarRegisteredAction): void {
    this.actionItems.update((list) => list.filter((a) => a !== action));
  }

  private activeSnapshot(): HellOmnibarActiveItemSnapshot<HellOmnibarRegisteredItem> {
    return { items: this.items(), activeIndex: this.activeIndexState() };
  }
}
