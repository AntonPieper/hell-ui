import {
  Directive,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import {
  hellPartStyler,
  type HellRecipe,
  type HellSize,
  type HellUiInput,
} from '@hell-ui/angular/core';

const HELL_CONTROL_GROUP_RECIPE = {
  root: 'inline-flex min-h-hell-control-md w-full min-w-0 items-stretch overflow-hidden rounded-hell-md border border-hell-border bg-hell-surface-elevated text-[13px] text-hell-foreground shadow-hell-xs transition-[background-color,border-color,box-shadow] duration-[var(--hell-duration-fast)] ease-hell-out data-[focus-within=true]:border-hell-border-focus data-[focus-within=true]:shadow-[0_0_0_3px_var(--color-hell-focus-ring)] data-[size=sm]:min-h-hell-control-sm data-[size=sm]:text-xs data-[size=lg]:min-h-hell-control-lg data-[size=lg]:text-sm data-[invalid=true]:border-hell-danger data-[disabled=true]:cursor-not-allowed data-[disabled=true]:border-hell-border data-[disabled=true]:bg-hell-surface-subtle data-[disabled=true]:text-hell-foreground-muted',
} satisfies HellRecipe<'root'>;

const HELL_CONTROL_GROUP_PREFIX_RECIPE = {
  root: 'inline-flex flex-none select-none items-center px-hell-3 text-hell-foreground-muted data-[size=sm]:px-hell-2 data-[size=lg]:px-hell-4 data-[disabled=true]:opacity-70',
} satisfies HellRecipe<'root'>;

const HELL_CONTROL_GROUP_SUFFIX_RECIPE = {
  root: 'inline-flex flex-none select-none items-center px-hell-3 text-hell-foreground-muted data-[size=sm]:px-hell-2 data-[size=lg]:px-hell-4 data-[disabled=true]:opacity-70',
} satisfies HellRecipe<'root'>;

const HELL_CONTROL_GROUP_ACTION_RECIPE = {
  root: 'inline-flex flex-none cursor-pointer items-center justify-center border-0 border-s border-hell-border bg-transparent px-hell-3 font-[inherit] font-medium text-hell-foreground-muted transition-[background-color,color] duration-[var(--hell-duration-fast)] ease-hell-out hover:bg-hell-surface-muted hover:text-hell-foreground focus-visible:relative focus-visible:z-[1] focus-visible:outline-2 focus-visible:outline-hell-focus-ring focus-visible:outline-offset-[-2px] data-[size=sm]:px-hell-2 data-[size=lg]:px-hell-4 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50',
} satisfies HellRecipe<'root'>;

/**
 * Shared visual frame for a field-like control with prefix, suffix, and action
 * content. The consumer keeps ownership of the control and its value model.
 */
@Directive({
  selector: '[hellControlGroup]',
  host: {
    '[class]': "part('root')",
    role: 'group',
    'data-slot': 'root',
    '[attr.data-size]': 'size()',
    '[attr.data-focus-within]': 'focusWithin() ? "true" : null',
    '[attr.data-invalid]': 'invalid() ? "true" : null',
    '[attr.data-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class HellControlGroup {
  /** Tailwind class refinements for the root Public Part. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for the root Public Part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_CONTROL_GROUP_RECIPE,
  });

  /** Shared group size. */
  readonly size = input<Exclude<HellSize, 'xs' | 'xl'>>('md');
  /** Shared invalid presentation and accessibility state. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Shared disabled presentation and accessibility state. */
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  /** Whether focus is currently contained by the complete group. */
  protected readonly focusWithin = signal(false);

  /** Reflects focus entering any projected control or action. */
  protected onFocusIn(): void {
    this.focusWithin.set(true);
  }

  /** Clears the shared state only when focus leaves the complete group. */
  protected onFocusOut(event: FocusEvent): void {
    if (this.host.contains(event.relatedTarget)) return;
    this.focusWithin.set(false);
  }
}

/** Leading non-interactive content inside a Control Group. */
@Directive({
  selector: '[hellControlGroupPrefix]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-size]': 'group.size()',
    '[attr.data-invalid]': 'group.invalid() ? "true" : null',
    '[attr.data-disabled]': 'group.disabled() ? "true" : null',
  },
})
export class HellControlGroupPrefix {
  /** Tailwind class refinements for the prefix root Public Part. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for the prefix root Public Part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_CONTROL_GROUP_PREFIX_RECIPE,
  });

  /** Enclosing group whose shared states are reflected on this surface. */
  protected readonly group = inject(HellControlGroup);
}

/** Trailing non-interactive content inside a Control Group. */
@Directive({
  selector: '[hellControlGroupSuffix]',
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.data-size]': 'group.size()',
    '[attr.data-invalid]': 'group.invalid() ? "true" : null',
    '[attr.data-disabled]': 'group.disabled() ? "true" : null',
  },
})
export class HellControlGroupSuffix {
  /** Tailwind class refinements for the suffix root Public Part. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for the suffix root Public Part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_CONTROL_GROUP_SUFFIX_RECIPE,
  });

  /** Enclosing group whose shared states are reflected on this surface. */
  protected readonly group = inject(HellControlGroup);
}

/** Button action inside a Control Group. Defaults its native type to `button`. */
@Directive({
  selector: 'button[hellControlGroupAction]',
  host: {
    '[class]': "part('root')",
    '[attr.type]': 'nativeButtonType()',
    'data-slot': 'root',
    '[attr.data-size]': 'group.size()',
    '[attr.data-invalid]': 'group.invalid() ? "true" : null',
    '[attr.data-disabled]': 'isDisabled() ? "true" : null',
    '[attr.disabled]': 'isDisabled() ? "" : null',
  },
})
export class HellControlGroupAction {
  /** Disables this action independently; the enclosing group's state is always included. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Tailwind class refinements for the action root Public Part. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for the action root Public Part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_CONTROL_GROUP_ACTION_RECIPE,
  });

  /** Enclosing group whose shared states are reflected on this surface. */
  protected readonly group = inject(HellControlGroup);
  /** Effective native disabled state from the action or its enclosing group. */
  protected readonly isDisabled = computed(() => this.disabled() || this.group.disabled());
  private readonly host = inject(ElementRef<HTMLButtonElement>).nativeElement;

  /** Preserves an authored native button type and otherwise prevents form submission. */
  protected nativeButtonType(): string {
    return this.host.getAttribute('type') ?? 'button';
  }
}

/** All directives in the Control Group entry point, for bulk imports. */
export const HELL_CONTROL_GROUP_IMPORTS = [
  HellControlGroup,
  HellControlGroupPrefix,
  HellControlGroupSuffix,
  HellControlGroupAction,
] as const;
