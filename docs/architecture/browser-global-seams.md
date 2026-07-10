# SSR/browser global seams

- Enforced by: `pnpm run lint` (`no-restricted-globals` in `eslint.config.mjs`,
  scoped to `packages/angular` production TypeScript; specs and
  `test-setup.ts` are excluded).

## Rule

Do not reference `document`, `window`, `ResizeObserver`, or
`IntersectionObserver` directly from library source. Angular SSR guidance says
browser-specific globals should not be referenced directly; use injected
`DOCUMENT`, an owner document passed by the caller, an event target's
`ownerDocument`/`defaultView`, or a browser-only render/lifecycle callback
such as `afterNextRender`.

A deliberate direct use — a `typeof` feature guard, a guarded fallback when no
owner document is available, or an observer with no injectable seam — carries
an inline justification at the use site:

```ts
// eslint-disable-next-line no-restricted-globals -- SSR feature-detect; ResizeObserver has no injectable seam
if (typeof ResizeObserver === 'undefined') return;
```

The disable comment is the allowlist: each escape hatch is visible, justified,
and reviewed where the code changes, with no separate registry to keep in
sync.
