import { InjectionToken, inject, type Provider } from '@angular/core';

/**
 * Runtime home of a label token's built-in defaults, carried on the token
 * itself so `provideHellLabels` has a merge base at the root injector without
 * a central registry.
 */
const HELL_LABEL_DEFAULTS = Symbol('hellLabelDefaults');

/**
 * The value shape of a label token created by `hellCreateLabels`: the entry
 * point's label interface plus a compile-time-only brand. The brand lives in
 * the token's type argument (not on the token object) so `inject(token)`
 * keeps inferring the label interface; resolved label objects never carry the
 * brand property at runtime.
 */
export type HellLabels<T extends object> = T & {
  /** Compile-time brand applied by `hellCreateLabels`; never set at runtime. */
  readonly ɵhellLabelBrand: true;
};

/**
 * The branded injection token `hellCreateLabels` returns for one entry
 * point's label interface. Only tokens with this brand are accepted by
 * `provideHellLabels`, so passing a token the factory did not create is a
 * compile-time error instead of a runtime throw.
 */
export type HellLabelToken<T extends object> = InjectionToken<HellLabels<T>>;

/**
 * The overrides `provideHellLabels` accepts for one label token: any subset
 * of the token's label interface. Resolves to `never` for unbranded tokens,
 * which is what rejects foreign injection tokens at compile time —
 * `InjectionToken`'s type parameter is structurally unused, so the token
 * parameter alone cannot reject them.
 */
export type HellLabelOverrides<V> = V extends HellLabels<object>
  ? Partial<Omit<V, 'ɵhellLabelBrand'>>
  : never;

/** Internal shape of a created token carrying its runtime defaults. */
type HellLabelTokenWithDefaults<T extends object> = HellLabelToken<T> & {
  readonly [HELL_LABEL_DEFAULTS]: T;
};

/**
 * Create the label token for one entry point, seeded with that entry point's
 * built-in English defaults.
 *
 * The token falls back to its defaults at the root injector. Consumers
 * override any subset of labels at any injector level with
 * `provideHellLabels`; unset keys keep the nearest ancestor value. Each Hell
 * entry point owns its label interface, defaults, and token, so core carries
 * no component label knowledge and consumer bundles carry only the label
 * strings of the entry points they import.
 */
export function hellCreateLabels<T extends object>(
  description: string,
  defaults: T,
): HellLabelToken<T> {
  const token = new InjectionToken<HellLabels<T>>(description, {
    providedIn: 'root',
    factory: () => defaults as HellLabels<T>,
  });
  return Object.assign(token, { [HELL_LABEL_DEFAULTS]: defaults });
}

/**
 * Provide partial overrides for a Hell label token, merged over the nearest
 * ancestor value (or the entry point's built-in defaults). Accepts every
 * token created by `hellCreateLabels` — and only those — e.g.
 * `provideHellLabels(HELL_ALERT_LABELS, { dismiss: 'Verwerfen' })`.
 */
export function provideHellLabels<V extends object>(
  token: InjectionToken<V>,
  overrides: HellLabelOverrides<V>,
): Provider {
  const defaults = (token as Partial<HellLabelTokenWithDefaults<object>>)[HELL_LABEL_DEFAULTS];
  return {
    provide: token,
    useFactory: () => ({
      ...(inject(token, { optional: true, skipSelf: true }) ?? defaults),
      ...overrides,
    }),
  };
}
