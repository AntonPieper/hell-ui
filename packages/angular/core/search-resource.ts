import {
  DestroyRef,
  assertInInjectionContext,
  effect,
  inject,
  isSignal,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { HellAsyncResourceLifecycle } from 'hell-ui/internal/core';

import {
  HellSearchService,
  type HellMaybeAsync,
  type HellSearchField,
  type HellSearchResponse,
  type HellSearchSourceRequest,
} from './search';

/** Lifecycle state exposed by a Search Resource. */
export type HellSearchStatus = 'idle' | 'loading' | 'success' | 'error';

/** Abort-aware request received by an asynchronous Search Resource source. */
export type HellSearchResourceSourceRequest<P = unknown> = Omit<
  HellSearchSourceRequest<P>,
  'signal'
> & {
  /** Aborts when this resource dispatch is cancelled or superseded. */
  readonly signal: AbortSignal;
};

/** Asynchronous source owned by a Search Resource. */
export type HellSearchResourceSource<T, P = unknown> = (
  request: HellSearchResourceSourceRequest<P>,
) => HellMaybeAsync<readonly T[] | HellSearchResponse<T>>;

/** Configuration for either local ranking or asynchronous dispatch. */
export type HellSearchResourceOptions<T, P = unknown> =
  | {
      /** Caller-owned query signal. The resource observes and re-exposes this signal. */
      readonly query: WritableSignal<string>;
      /** Domain items to rank. Pass a Signal when the collection changes over time. */
      readonly items: readonly T[] | Signal<readonly T[]>;
      /** Local resources do not accept an asynchronous source. */
      readonly source?: never;
      /** Weighted fields used by the configured local ranking strategy. */
      readonly fields?: readonly HellSearchField<T>[];
      /** Maximum number of published items. */
      readonly limit?: number;
      /** Local resources do not forward source parameters. */
      readonly params?: never;
      /** Local ranking reacts immediately and is not debounced. */
      readonly debounce?: never;
    }
  | {
      /** Caller-owned query signal. The resource observes and re-exposes this signal. */
      readonly query: WritableSignal<string>;
      /** Abort-aware asynchronous source. Raw items are ranked locally. */
      readonly source: HellSearchResourceSource<T, P>;
      /** Asynchronous resources do not accept a local item collection. */
      readonly items?: never;
      /** Weighted fields used when a source returns raw items. */
      readonly fields?: readonly HellSearchField<T>[];
      /** Maximum number of published items. */
      readonly limit?: number;
      /** Opaque source parameters captured with each dispatch. */
      readonly params?: P;
      /** Query debounce in milliseconds. Defaults to 120. */
      readonly debounce?: number;
    };

/** UI-independent reactive search state shared by search-driven experiences. */
export interface HellSearchResource<T> {
  /** Caller-owned query signal observed by this resource. */
  readonly query: WritableSignal<string>;
  /** Domain items from the newest successful search. */
  readonly items: Signal<readonly T[]>;
  /** Current search lifecycle state. */
  readonly status: Signal<HellSearchStatus>;
  /** Error from the newest active search, or `null`. */
  readonly error: Signal<unknown>;

  /** Run the current query immediately, bypassing asynchronous debounce. */
  refresh(): void;
  /** Stop scheduled or active work while preserving settled state. */
  cancel(): void;
  /**
   * Cancel work and empty items, status, and error while leaving the
   * caller-owned query signal untouched. The resource stays cleared until a
   * later query change or an explicit `refresh()`.
   */
  clearResults(): void;
  /**
   * Cancel work, empty items, status, and error, and set the caller-owned
   * query signal to the empty string without dispatching an empty-query
   * request. This is the only resource operation that writes the query; the
   * resource stays reset until a later query change or an explicit
   * `refresh()`.
   */
  reset(): void;
}

/**
 * Create a local or asynchronous Search Resource in the current injection
 * context. Query and local collection signals trigger searches automatically;
 * destruction aborts pending work.
 */
export function hellSearchResource<T, P = unknown>(
  options: HellSearchResourceOptions<T, P>,
): HellSearchResource<T> {
  assertInInjectionContext(hellSearchResource);

  const searchService = inject(HellSearchService);
  const destroyRef = inject(DestroyRef);
  const itemState = signal<readonly T[]>([]);
  const statusState = signal<HellSearchStatus>('idle');
  const errorState = signal<unknown>(null);
  let settledStatus: Exclude<HellSearchStatus, 'loading'> = 'idle';
  let settledError: unknown = null;
  let cleared = false;
  let lastObservedSnapshot: HellSearchSnapshot<T, P> | undefined;

  const lifecycle = new HellAsyncResourceLifecycle<readonly T[]>({
    onStart: () => {
      statusState.set('loading');
      errorState.set(null);
    },
    onSuccess: (items) => {
      settledStatus = 'success';
      settledError = null;
      itemState.set(items);
      errorState.set(null);
      statusState.set('success');
    },
    onError: (error) => {
      settledStatus = 'error';
      settledError = error;
      itemState.set([]);
      errorState.set(error);
      statusState.set('error');
    },
    onSettled: () => {
      if (statusState() !== 'loading') return;
      errorState.set(settledError);
      statusState.set(settledStatus);
    },
  });

  const dispatch = (snapshot: HellSearchSnapshot<T, P>) => (abortSignal: AbortSignal) => {
    const source = snapshot.source;
    return searchService
      .search<T, P>({
        query: snapshot.query,
        items: snapshot.items,
        source: source
          ? (request) => source({ ...request, signal: abortSignal })
          : undefined,
        fields: options.fields,
        limit: options.limit,
        params: snapshot.params,
        signal: abortSignal,
      })
      .then((results) => results.map((result) => result.item));
  };

  effect(() => {
    const snapshot = readSearchSnapshot(options);
    const previousSnapshot = lastObservedSnapshot;
    if (previousSnapshot && hasSameReactiveInputs(previousSnapshot, snapshot)) return;

    const queryChanged =
      previousSnapshot !== undefined && previousSnapshot.query !== snapshot.query;
    lastObservedSnapshot = snapshot;

    if (cleared) {
      if (!queryChanged) return;
      cleared = false;
    }

    if (isAsyncOptions(options)) {
      lifecycle.schedule(dispatch(snapshot), options.debounce ?? 120);
      return;
    }

    void lifecycle.run(dispatch(snapshot));
  });

  destroyRef.onDestroy(() => lifecycle.cancel());

  const clearResults = () => {
    lifecycle.cancel();
    settledStatus = 'idle';
    settledError = null;
    itemState.set([]);
    errorState.set(null);
    statusState.set('idle');
    cleared = true;
    lastObservedSnapshot = readSearchSnapshot(options);
  };

  return {
    query: options.query,
    items: itemState.asReadonly(),
    status: statusState.asReadonly(),
    error: errorState.asReadonly(),
    refresh: () => {
      const snapshot = readSearchSnapshot(options);
      cleared = false;
      lastObservedSnapshot = snapshot;
      void lifecycle.run(dispatch(snapshot));
    },
    cancel: () => {
      lifecycle.cancel();
      lastObservedSnapshot = readSearchSnapshot(options);
    },
    clearResults,
    reset: () => {
      clearResults();
      options.query.set('');
      lastObservedSnapshot = readSearchSnapshot(options);
    },
  };
}

interface HellSearchSnapshot<T, P> {
  readonly query: string;
  readonly items?: readonly T[];
  readonly source?: HellSearchResourceSource<T, P>;
  readonly params?: P;
}

function hasSameReactiveInputs<T, P>(
  previous: HellSearchSnapshot<T, P>,
  current: HellSearchSnapshot<T, P>,
): boolean {
  return previous.query === current.query && previous.items === current.items;
}

function readSearchSnapshot<T, P>(
  options: HellSearchResourceOptions<T, P>,
): HellSearchSnapshot<T, P> {
  if (isAsyncOptions(options)) {
    return {
      query: options.query(),
      source: options.source,
      params: options.params,
    };
  }

  return {
    query: options.query(),
    items: isSignal(options.items) ? options.items() : options.items,
  };
}

function isAsyncOptions<T, P>(
  options: HellSearchResourceOptions<T, P>,
): options is Extract<
  HellSearchResourceOptions<T, P>,
  { readonly source: HellSearchResourceSource<T, P> }
> {
  return 'source' in options && options.source !== undefined;
}
