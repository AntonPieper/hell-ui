import { InjectionToken, inject, type Provider } from '@angular/core';

/**
 * One entry-point-owned Label Contract: an injection token seeded with the
 * owning entry point's English defaults, plus a provider factory that merges
 * partial overrides over the nearest ancestor value.
 *
 * Each Hell entry point owns its label interface, defaults, token, and
 * `provideHell<Module>Labels` function. Core owns only this factory, so the
 * core entry point carries no component label knowledge and consumer bundles
 * carry only the label strings of the entry points they import.
 */
export interface HellLabelContract<T extends object> {
  /** Injection token resolving to the effective labels for this contract. */
  readonly token: InjectionToken<T>;
  /** The owning entry point's built-in English defaults. */
  readonly defaults: T;
  /** Provide partial overrides merged over ancestor labels (or the defaults). */
  readonly provide: (overrides: Partial<T>) => Provider;
}

/**
 * Create the Label Contract for one entry point.
 *
 * The returned token falls back to `defaults` at the root injector, and the
 * returned `provide` function lets consumers override any subset of labels at
 * any injector level; unset keys keep the nearest ancestor value.
 */
export function hellCreateLabels<T extends object>(
  description: string,
  defaults: T,
): HellLabelContract<T> {
  const token = new InjectionToken<T>(description, {
    providedIn: 'root',
    factory: () => defaults,
  });

  return {
    token,
    defaults,
    provide: (overrides: Partial<T>): Provider => ({
      provide: token,
      useFactory: () => ({
        ...(inject(token, { optional: true, skipSelf: true }) ?? defaults),
        ...overrides,
      }),
    }),
  };
}
