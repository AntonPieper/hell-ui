import { InjectionToken, inject, type Provider } from '@angular/core';

export interface HellPaginationLabels {
  readonly navigation: string;
  readonly firstPage: string;
  readonly previousPage: string;
  readonly nextPage: string;
  readonly lastPage: string;
  readonly page: (page: number) => string;
}

export interface HellLabels {
  readonly loading: string;
  readonly pagination: HellPaginationLabels;
}

export interface HellLabelOverrides {
  readonly loading?: string;
  readonly pagination?: Partial<HellPaginationLabels>;
}

export const HELL_DEFAULT_LABELS: HellLabels = {
  loading: 'Loading',
  pagination: {
    navigation: 'Pagination',
    firstPage: 'First page',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    lastPage: 'Last page',
    page: (page) => `Page ${page}`,
  },
};

export const HELL_LABELS = new InjectionToken<HellLabels>('HELL_LABELS', {
  providedIn: 'root',
  factory: () => HELL_DEFAULT_LABELS,
});

export function provideHellLabels(overrides: HellLabelOverrides): Provider {
  return {
    provide: HELL_LABELS,
    useFactory: () =>
      hellMergeLabels(inject(HELL_LABELS, { optional: true, skipSelf: true }) ?? HELL_DEFAULT_LABELS, overrides),
  };
}

function hellMergeLabels(base: HellLabels, overrides: HellLabelOverrides): HellLabels {
  const pagination = overrides.pagination ?? {};

  return {
    loading: overrides.loading ?? base.loading,
    pagination: {
      navigation: pagination.navigation ?? base.pagination.navigation,
      firstPage: pagination.firstPage ?? base.pagination.firstPage,
      previousPage: pagination.previousPage ?? base.pagination.previousPage,
      nextPage: pagination.nextPage ?? base.pagination.nextPage,
      lastPage: pagination.lastPage ?? base.pagination.lastPage,
      page: pagination.page ?? base.pagination.page,
    },
  };
}
