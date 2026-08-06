import { isPlatformBrowser } from '@angular/common';
import { ElementRef, PLATFORM_ID, afterRenderEffect, effect, inject } from '@angular/core';
import { controlStatus } from 'ng-primitives/utils';

/**
 * Since 0.128, ng-primitives writes several ARIA attributes imperatively from
 * isomorphic render effects (`attrBinding`), which land after Angular host
 * bindings — a competing host binding can never hold such an attribute. Where
 * Hell's contract deliberately differs from the primitive's, the owning
 * component re-asserts the attribute from an effect registered *after* the
 * primitive's: host directives construct before their host, so the host's
 * effect runs later in every shared flush. The write callback must be dirtied
 * by every source change that dirties the upstream writer, so both re-run in
 * the same flush and the later registration decides every time.
 *
 * This is a deliberate version-bound runtime seam — the decision record is
 * `docs/adr/ngp-attribute-ownership.md`, with the ownership row in
 * `docs/architecture/manual-runtime-ownership.md` — not a defect bridge: the
 * contracts it holds (`aria-invalid` without a touched gate, `aria-disabled`
 * absent on enabled radio items, `aria-modal="false"` on scoped dialogs)
 * survive upgrades. It rests on three assumptions that the
 * `ngp-attr-ownership-seam` architecture check re-binds to the installed
 * version on every bump: upstream binds these attributes via `attrBinding`
 * render effects (not Angular host bindings), effects run in registration
 * order within a flush, and each call site's reads are dirtied whenever the
 * upstream writer's are. A call site retires when upstream either returns the
 * attribute to an Angular host binding or exposes an input/config that
 * expresses Hell's contract (then feed the source instead, as `HellCheckbox`
 * does for `aria-required` and `hellTabset` does for `wrap`).
 *
 * @internal
 */

/** ng-primitives release whose attrBinding scheduling this seam is written against. */
export const HELL_NGP_ATTR_OWNERSHIP_VERSION = 'ng-primitives@0.128.8';

/**
 * Registers an attribute write that must land after an ng-primitives
 * `attrBinding` writer on the same host. The callback must read signals that
 * are dirtied whenever the upstream writer's are — the injected primitive
 * state where the trigger is public, a mirror of the same source where it is
 * not — so the two effects wake together and this later-registered one
 * decides each flush.
 */
export function hellOwnsNgpAttribute(write: () => void): void {
  // Mirror ng-primitives' isomorphic scheduling so the write order also holds
  // during server rendering, where upstream binds via plain effects.
  if (isPlatformBrowser(inject(PLATFORM_ID))) {
    afterRenderEffect(write);
  } else {
    effect(write);
  }
}

/**
 * `ngpFormControl` — composed by every `NgpInput`-family primitive — owns
 * `aria-invalid` since 0.128, gated on the classic control being invalid
 * *and touched*. Hell's contract is not touched-gated: an explicit `invalid`
 * input, a visual-only draft, or enclosing Field validation advertise
 * immediately. The owning control re-asserts `aria-invalid` from Hell's own
 * invalid source.
 *
 * Upstream's writer is keyed on a private `controlStatus()` instance that the
 * primitives do not uniformly expose (`NgpInput` state carries `status`;
 * `NgpTextarea` state does not), so this helper cannot read that instance and
 * mirrors it instead: `controlStatus()` here subscribes to the same
 * `NgControl` — the same `control.events` observable for classic controls and
 * the same interop status signals for Signal Forms controls — as upstream's
 * copy. Every source change updates both copies synchronously, before any
 * effect flush can run, so both writers are dirtied together, run in the same
 * flush, and registration order decides. The mirrored-subscription ordering
 * is pinned by the race-focused ownership test in `input/input.spec.ts`
 * ("holds aria-invalid across upstream status rewrites in both directions").
 *
 * Layered hosts (`hellDateInput` is also a `hellInput`) may both call this:
 * the outermost component constructs last, so its effect runs last and wins,
 * matching the component-over-host-directive precedence Angular gave the
 * host bindings this replaces.
 */
export function hellOwnsControlAriaInvalid(invalid: () => boolean): void {
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const status = controlStatus();
  hellOwnsNgpAttribute(() => {
    // Mirror of upstream's trigger: dirtied by the same NgControl sources,
    // in the same synchronous turn, as the aria-invalid writer's own copy.
    status();
    if (invalid()) element.setAttribute('aria-invalid', 'true');
    else element.removeAttribute('aria-invalid');
  });
}
