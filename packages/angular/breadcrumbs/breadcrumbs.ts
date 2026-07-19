import {
  Directive, ElementRef, inject, input } from '@angular/core';
import { hellCreateLabels, type HellLabels } from '@hell-ui/angular/core';
import { hellPartStyler, type HellRecipe, type HellUiInput } from '@hell-ui/angular/core';
import {
  NgpBreadcrumbs,
  NgpBreadcrumbList,
  NgpBreadcrumbItem,
  NgpBreadcrumbLink,
  NgpBreadcrumbPage,
  NgpBreadcrumbSeparator,
  NgpBreadcrumbEllipsis,
} from 'ng-primitives/breadcrumbs';
import type { InjectionToken } from '@angular/core';

/** Built-in accessibility labels owned by the breadcrumbs entry point. */
export interface HellBreadcrumbLabels {
  /** Accessible label for the control that reveals the collapsed-middle crumbs. */
  readonly showHiddenNavigation: string;
}

/** Injection token resolving to the effective breadcrumbs labels. */
export const HELL_BREADCRUMBS_LABELS: InjectionToken<HellLabels<HellBreadcrumbLabels>> = hellCreateLabels<HellBreadcrumbLabels>('HELL_BREADCRUMBS_LABELS', {
  showHiddenNavigation: 'Show hidden navigation',
});

const HELL_BREADCRUMBS_RECIPE = {
  root: 'inline-flex max-w-full items-center text-sm text-hell-foreground-muted',
} satisfies HellRecipe<'root'>;

const HELL_BREADCRUMB_LIST_RECIPE = {
  root: 'm-0 inline-flex min-w-0 list-none flex-wrap items-center gap-1.5 p-0',
} satisfies HellRecipe<'root'>;

const HELL_BREADCRUMB_ITEM_RECIPE = {
  root: 'inline-flex min-w-0 items-center gap-hell-1',
} satisfies HellRecipe<'root'>;

const HELL_BREADCRUMB_LINK_RECIPE = {
  root: 'inline-flex max-w-[24ch] cursor-pointer items-center gap-hell-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-hell-sm border-0 bg-transparent p-0 font-[inherit] text-inherit no-underline transition-colors duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] hover:text-hell-foreground hover:underline hover:underline-offset-[3px] data-hover:text-hell-foreground data-hover:underline data-hover:underline-offset-[3px] data-focus-visible:outline-2 data-focus-visible:outline-hell-focus-ring data-focus-visible:outline-offset-2',
} satisfies HellRecipe<'root'>;

const HELL_BREADCRUMB_PAGE_RECIPE = {
  root: 'inline-flex max-w-[32ch] items-center gap-hell-1 overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-hell-foreground',
} satisfies HellRecipe<'root'>;

const HELL_BREADCRUMB_SEPARATOR_RECIPE = {
  root: 'inline-flex flex-none items-center justify-center text-hell-foreground-subtle',
} satisfies HellRecipe<'root'>;

const HELL_BREADCRUMB_ELLIPSIS_RECIPE = {
  root: 'inline-flex h-hell-6 w-hell-6 flex-none cursor-pointer items-center justify-center rounded-hell-sm border-0 bg-transparent p-0 font-[inherit] text-hell-foreground-subtle transition-colors duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] hover:bg-hell-surface-subtle hover:text-hell-foreground data-hover:bg-hell-surface-subtle data-hover:text-hell-foreground data-focus-visible:outline-2 data-focus-visible:outline-hell-focus-ring data-focus-visible:outline-offset-1',
} satisfies HellRecipe<'root'>;

/**
 * Breadcrumbs — composed from `ng-primitives/breadcrumbs`.
 *
 * Slot map:
 *   nav[hellBreadcrumbs]            wrapper landmark
 *     ol[hellBreadcrumbList]        list (auto adds aria role via NgpBreadcrumbList)
 *       li[hellBreadcrumbItem]      list item — apply once per crumb
 *         a[hellBreadcrumbLink]     navigable crumb
 *         span[hellBreadcrumbPage]  current page (sets aria-current="page")
 *       li[hellBreadcrumbSeparator] visual divider — defaults to a chevron icon
 *       li[hellBreadcrumbEllipsis]  collapsed-middle indicator for long trails
 */

@Directive({
  selector: 'nav[hellBreadcrumbs]',
  hostDirectives: [NgpBreadcrumbs],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellBreadcrumbs {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_BREADCRUMBS_RECIPE,
  });
}

/** List element wrapping the individual breadcrumb items. */
@Directive({
  selector: 'ol[hellBreadcrumbList], ul[hellBreadcrumbList]',
  hostDirectives: [NgpBreadcrumbList],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellBreadcrumbList {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_BREADCRUMB_LIST_RECIPE,
  });
}

/** List item wrapping a single crumb (a link, the current page, a separator, or an ellipsis). */
@Directive({
  selector: 'li[hellBreadcrumbItem]',
  hostDirectives: [NgpBreadcrumbItem],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellBreadcrumbItem {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_BREADCRUMB_ITEM_RECIPE,
  });
}

/** Navigable crumb — apply to <a> or <button>. */
@Directive({
  selector: 'a[hellBreadcrumbLink], button[hellBreadcrumbLink]',
  hostDirectives: [NgpBreadcrumbLink],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.type]': 'nativeButtonType()',
  },
})
export class HellBreadcrumbLink {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_BREADCRUMB_LINK_RECIPE,
  });

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;

  /** Native `type` attribute to apply when the host is a `<button>` element. */
  protected nativeButtonType(): 'button' | null {
    return this.host.tagName.toLowerCase() === 'button' ? 'button' : null;
  }
}

/** Current page — apply to <span> or similar non-link element. */
@Directive({
  selector: '[hellBreadcrumbPage]',
  hostDirectives: [NgpBreadcrumbPage],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    'aria-current': 'page',
  },
})
export class HellBreadcrumbPage {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_BREADCRUMB_PAGE_RECIPE,
  });
}

/**
 * Decorative divider rendered between items. When the host element has no
 * children, a chevron-right icon is painted via CSS mask so consumers don't
 * need to import the icon themselves. Provide custom content (e.g. `/`,
 * `›`, or any markup) to override.
 */
@Directive({
  selector: 'li[hellBreadcrumbSeparator], [hellBreadcrumbSeparator]',
  hostDirectives: [NgpBreadcrumbSeparator],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    role: 'presentation',
    'aria-hidden': 'true',
  },
})
export class HellBreadcrumbSeparator {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_BREADCRUMB_SEPARATOR_RECIPE,
  });
}

/**
 * Collapsed-middle indicator. Apply to a button when interactive (e.g. opens
 * a menu listing the hidden crumbs) or a span when purely decorative. Renders
 * three dots via CSS so no icon import is required. Button hosts drop the
 * primitive's decorative `role="presentation"`/`aria-hidden="true"` so the
 * control stays visible to assistive technology; span hosts keep them.
 */
@Directive({
  selector: '[hellBreadcrumbEllipsis]',
  hostDirectives: [NgpBreadcrumbEllipsis],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.type]': 'nativeButtonType()',
    '[attr.aria-label]': 'nativeButtonType() ? (ariaLabel() ?? labels.showHiddenNavigation) : null',
    '[attr.role]': "nativeButtonType() ? null : 'presentation'",
    '[attr.aria-hidden]': "nativeButtonType() ? null : 'true'",
  },
})
export class HellBreadcrumbEllipsis {
  /** Tailwind class refinements for public parts. */
  readonly ui = input<HellUiInput<'root'>>(undefined, { alias: 'ui' });

  /** Merged Part-Class Pipeline classes for one public part. */
  protected readonly part = hellPartStyler<'root'>(this.ui, {
    defaultPart: 'root',
    recipe: () => HELL_BREADCRUMB_ELLIPSIS_RECIPE,
  });

  /** Accessible label used when the host is interactive. Defaults to the `showHiddenNavigation` label. */
  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  /** Effective breadcrumbs labels resolved from `HELL_BREADCRUMBS_LABELS`. */
  protected readonly labels = inject(HELL_BREADCRUMBS_LABELS);

  /** Native `type` attribute to apply when the host is a `<button>` element. */
  protected nativeButtonType(): 'button' | null {
    return this.host.tagName.toLowerCase() === 'button' ? 'button' : null;
  }
}

/** All directives that make up the breadcrumbs entry point, for bulk `imports`. */
export const HELL_BREADCRUMBS_IMPORTS = [
  HellBreadcrumbs,
  HellBreadcrumbList,
  HellBreadcrumbItem,
  HellBreadcrumbLink,
  HellBreadcrumbPage,
  HellBreadcrumbSeparator,
  HellBreadcrumbEllipsis,
] as const;
