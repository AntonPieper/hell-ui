# ADR: Tooltip content and surface stay separate styling contracts

- Status: Accepted
- Date: 2026-07-17

## Context

Using Tooltip for a short hint currently requires a trigger directive, a
template reference, and a separately authored Tooltip Surface. Repeating that
ceremony for plain text makes the common path noisy.

Moving Tooltip Surface styling onto the trigger would create a worse contract.
A trigger often also carries HellButton or another styled directive, so a
shared `ui` input would address unrelated Part Style Maps on the same host.
Hell needs a concise string path without coupling trigger and surface styling,
while preserving consumer-authored surfaces for rich presentation.

This decision governs the implementation specified by #238.

## Decision

### Public vocabulary and content

- Rename `HellTooltipTrigger` / `[hellTooltipTrigger]` to `HellTooltip` /
  `[hellTooltip]`.
- Rename the former `HellTooltip` / `[hellTooltip]` surface to
  `HellTooltipSurface` / `[hellTooltipSurface]`.
- Keep no compatibility selectors, classes, aliases, or directive convenience
  array.
- Accept exactly `string | TemplateRef<unknown> | null | undefined` as Tooltip
  content. Do not accept component classes, infer host text, or define a
  template context.
- Render a string through an implicit default Tooltip Surface. A custom
  template contains one consumer-authored Tooltip Surface with its own `ui`
  Part Style Map.

The common path imports only `HellTooltip`; a custom surface additionally
imports `HellTooltipSurface`.

### State and host behavior

- Preserve the Anchored Surface Contract through reactive `open`, boolean
  `openChange`, `show()`, `hide()`, and export name `hellTooltip`.
- Treat every present-to-present content transition as a presentation change
  that preserves open state, including string-to-template and
  template-to-string transitions.
- Treat `null`, `undefined`, and the empty string as absent content that closes
  and disables the Tooltip Interaction. Expose no separate `disabled` input.
- Allow the trigger on any host without adding focusability, mutating or
  blocking the host, or deriving its accessible name from Tooltip content.
- Do not open on a natively disabled control. Explanatory help for one belongs
  on a separate focusable wrapper.
- Add no touch-specific long-press or click-to-toggle behavior.

### Delegation boundary

ng-primitives owns the Tooltip Interaction lifecycle, overlay, positioning,
timing, Escape handling, hover bridge, and `aria-describedby` relationship.
Hell adapts Tooltip Surface presentation, Floating Scope registration,
absent-content behavior, and the Anchored Surface Contract names. It does not
create a parallel overlay, timing, dismissal, or hover state machine.

Hell exposes upstream Tooltip behavior and positioning capabilities unless it
deliberately gives a capability different semantics. Public signatures reuse
upstream types rather than introducing Hell-owned twins.

The deliberate differences are:

- the explicit content contract and public names above;
- absent content instead of a `disabled` input;
- no host-text fallback, component content, or template context;
- Hell-owned Tooltip Surface presentation;
- Hell's `open` / `openChange` / `show()` / `hide()` Interface;
- mandatory hoverability and Escape dismissal.

Other upstream capabilities remain reachable even when Hell's first examples
do not use them.

### Defaults and presentation

- Export `HellTooltipDefaults` and `provideHellTooltipDefaults(...)`.
- Merge partial defaults over the nearest ancestor provider; local trigger
  inputs take precedence.
- Guarantee `showDelay: 500`, `hideDelay: 0`, and `cooldown: 300`.
- Exclude content, styling, disabled state, host-text fallback, template
  context, hoverability, and Escape dismissal from configurable defaults.
- Give implicit and explicit Tooltip Surfaces the public
  `hellTooltipSurface` selector, `role="tooltip"`, `data-slot="root"`, the same
  recipe and theme hooks, and Floating Scope registration.
- Keep one root Public Part with a surface-owned `ui` input. Do not add
  variants, sizes, remote trigger styling, or a public arrow primitive.
- Always enable the upstream hover bridge. Expose no `hoverableContent` input or
  default.
- Always close on Escape without moving focus.
- Respect reduced-motion preferences in the Tooltip Surface entrance recipe.

Hell adds neither surface-count validation nor descendant inspection for
interactive controls unless real usage demonstrates a recurring mistake worth
policing.

## Consequences

- Tooltip becomes a Mixed Entry Point: its plain-text convenience surface and
  consumer-authored surface share one Interaction State Machine.
- Migration replaces simple Tooltip templates with strings and retains
  templates only for rich markup or custom `ui` styling.
- Documentation leads with the string path, demonstrates dynamic
  present/absent content and custom surfaces, and treats hoverability as an
  accessibility invariant rather than an option.
- The breaking change updates all repository consumers without aliases and is
  proven through focused unit tests, architecture checks, library and docs
  builds, API reports, a packed consumer, Tooltip and Toolbar browser
  contracts, axe coverage, reduced-motion verification, visual evidence, and
  the full release dry run.
