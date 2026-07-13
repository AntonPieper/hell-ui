import { InjectionToken, inject, type Provider } from '@angular/core';

/**
 * Built-in defaults per label token, so `provideHellLabels` can merge partial
 * overrides without each entry point exporting its own provider function.
 */
const HELL_LABEL_DEFAULTS = new WeakMap<InjectionToken<object>, object>();

/**
 * Create the label token for one entry point, seeded with that entry point's
 * built-in English defaults.
 *
 * The token falls back to `defaults` at the root injector. Consumers override
 * any subset of labels at any injector level with `provideHellLabels`; unset
 * keys keep the nearest ancestor value. Each Hell entry point owns its label
 * interface, defaults, and token, so core carries no component label knowledge
 * and consumer bundles carry only the label strings of the entry points they
 * import.
 */
export function hellCreateLabels<T extends object>(
  description: string,
  defaults: T,
): InjectionToken<T> {
  const token = new InjectionToken<T>(description, {
    providedIn: 'root',
    factory: () => defaults,
  });
  HELL_LABEL_DEFAULTS.set(token, defaults);
  return token;
}

/**
 * Provide partial overrides for a Hell label token, merged over the nearest
 * ancestor value (or the entry point's built-in defaults). Works with every
 * token created by `hellCreateLabels`, e.g.
 * `provideHellLabels(HELL_ALERT_LABELS, { dismiss: 'Verwerfen' })`.
 */
export function provideHellLabels<T extends object>(
  token: InjectionToken<T>,
  overrides: Partial<T>,
): Provider {
  const defaults = HELL_LABEL_DEFAULTS.get(token) as T | undefined;
  if (!defaults) {
    throw new Error(`provideHellLabels: ${String(token)} was not created by hellCreateLabels`);
  }
  return {
    provide: token,
    useFactory: () => ({
      ...(inject(token, { optional: true, skipSelf: true }) ?? defaults),
      ...overrides,
    }),
  };
}
