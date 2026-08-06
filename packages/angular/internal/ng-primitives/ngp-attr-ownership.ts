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
 * effect runs later in every shared flush. The write callback must read the
 * same signals the upstream writer reads, so both re-run together and the
 * later registration decides every time.
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
 * invalid source; reading `controlStatus()` — the exact signal upstream's
 * writer is keyed on — keeps the two writers re-running in lockstep.
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
    // Subscribe to upstream's trigger so every upstream rewrite is followed
    // by this one, whether or not Hell's own sources changed with it.
    status();
    if (invalid()) element.setAttribute('aria-invalid', 'true');
    else element.removeAttribute('aria-invalid');
  });
}
