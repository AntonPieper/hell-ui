# ADR: attribute ownership over ng-primitives' imperative writers

- Status: Accepted
- Date: 2026-08-06
- Version-bound to: `ng-primitives@0.128.8` (`HELL_NGP_ATTR_OWNERSHIP_VERSION`)

## Context

`ng-primitives@0.128` moved many host ARIA semantics from Angular host
bindings to `attrBinding` — imperative writes from isomorphic render effects
(`afterRenderEffect` in the browser, `effect` during server rendering). These
land after every Angular host binding, so a competing binding can never hold
the attribute: whichever writer ran last wins, and upstream's always runs
later than change detection.

Three Hell contracts deliberately differ from what the primitives write:

| Attribute | Upstream writes | Hell's contract |
| --- | --- | --- |
| `aria-invalid` (`NgpInput` family via `ngpFormControl`) | `'true'` only while the classic control is invalid **and touched** | Not touched-gated: an explicit `invalid` input, a visual-only draft, or enclosing Field validation advertise immediately |
| `aria-disabled` (`NgpRadioItem`) | Literal `"true"`/`"false"` | Absent on enabled items — the native `disabled` attribute carries the state |
| `aria-modal` (`ngpDialog`) | `'true'` from its `modal` prop | `"false"` on scoped dialogs — the blocked region is `inert` and the surrounding shell is deliberately live (see the scoped-modality amendment in `docs/adr/floating-dismissal.md`) |

These are contract differences, not upstream defects: no fix is expected to
retire them, so a "wait for upstream" workaround posture is wrong. What is
needed is a way for the owning component to hold an attribute against an
imperative upstream writer, deterministically.

## Decision

The owning component re-asserts the attribute through the internal seam
`packages/angular/internal/ng-primitives/ngp-attr-ownership.ts`
(`hellOwnsNgpAttribute`, `hellOwnsControlAriaInvalid`):

- **Ordering.** The re-assert is an isomorphic render effect registered in the
  owning component's constructor. Host directives construct before their
  host, so the component's effect registers — and within any shared flush,
  runs — after the primitive's writer. Layered hosts compose the same way:
  `hellDateInput` constructs after its `hellInput` host directive, so the
  richer invalid source wins, matching the component-over-host-directive
  precedence Angular gave the host bindings this replaces.
- **Wake-together triggers.** Registration order only decides flushes both
  writers participate in, so each call site must be dirtied whenever the
  upstream writer is. Where the primitive state exposes the writer's own
  trigger, read it (radio reads the same item/group `disabled` signals; dialog
  reads `modal()`). `ngpFormControl`'s status instance is not uniformly
  exposed (`NgpInput` state carries `status`, `NgpTextarea` state does not),
  so `hellOwnsControlAriaInvalid` mirrors it: its own `controlStatus()`
  subscribes to the same `NgControl` sources — the `control.events`
  observable for classic controls, the interop status signals for Signal
  Forms controls — as upstream's copy. Every source change updates both
  copies synchronously, before any effect flush can run, so both writers wake
  in the same flush. The mirrored-subscription ordering is pinned by the
  race-focused test in `packages/angular/input/input.spec.ts` ("holds
  aria-invalid across upstream status rewrites in both directions").
- **Prefer feeding upstream.** When the primitive exposes an input or config
  that expresses Hell's contract, feed the source and delete the competing
  write instead of extending the seam — `HellCheckbox` passes `required` into
  `ngpCheckbox` for `aria-required`; `hellTabset` pins
  `provideTabsConfig({ wrap: false })`.

## Guardrails

The seam depends on upstream's effect scheduling and on host-directive
construction order, so — like the state-writer and scoped-modality seams — it
is version-bound and guarded by the `ngp-attr-ownership-seam` check in
`tools/architecture/check-architecture.mjs`:

- `HELL_NGP_ATTR_OWNERSHIP_VERSION` must match the installed `ng-primitives`
  version, forcing a re-probe of the scheduling assumptions on every bump.
- The seam must keep reading `controlStatus` from `ng-primitives/utils` — the
  mirror that keeps `hellOwnsControlAriaInvalid` in lockstep with upstream's
  `aria-invalid` writer.
- The helpers may appear only at the reviewed call sites (input, select,
  date-input, time-input, number-input, radio, dialog). A new call site is a
  new claim about upstream scheduling: review it against the installed bundle
  before allowing it.

## Consequences

- A flapping or un-holdable host ARIA attribute on an ng-primitives host is a
  symptom of an `attrBinding` writer; the fix is feeding an upstream
  input/config or extending this seam — never a competing host binding.
- Every ng-primitives bump re-probes the seam via the version constant; the
  per-call-site removal condition is upstream exposing a contract input or
  returning the attribute to an Angular host binding.
- The dialog `aria-modal` consequence remains governed by the scoped-modality
  decision in `docs/adr/floating-dismissal.md`; only its write mechanism lives
  here.
- The ownership row in `docs/architecture/manual-runtime-ownership.md` tracks
  the runtime-risk framing (evidence paths, risks, required tests).
