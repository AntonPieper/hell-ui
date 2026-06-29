import {
  Directive, ElementRef, inject, input } from '@angular/core';
import { type HellLabels, HELL_LABELS } from '@hell-ui/angular/core';
import { HellPartStyleable, type HellRecipe, type HellUi } from '@hell-ui/angular/core';
import {
  NgpBreadcrumbs,
  NgpBreadcrumbList,
  NgpBreadcrumbItem,
  NgpBreadcrumbLink,
  NgpBreadcrumbPage,
  NgpBreadcrumbSeparator,
  NgpBreadcrumbEllipsis,
} from 'ng-primitives/breadcrumbs';

export type HellBreadcrumbsPart = 'root';
export type HellBreadcrumbsUi = HellUi<HellBreadcrumbsPart>;

export type HellBreadcrumbListPart = 'root';
export type HellBreadcrumbListUi = HellUi<HellBreadcrumbListPart>;

export type HellBreadcrumbItemPart = 'root';
export type HellBreadcrumbItemUi = HellUi<HellBreadcrumbItemPart>;

export type HellBreadcrumbLinkPart = 'root';
export type HellBreadcrumbLinkUi = HellUi<HellBreadcrumbLinkPart>;

export type HellBreadcrumbPagePart = 'root';
export type HellBreadcrumbPageUi = HellUi<HellBreadcrumbPagePart>;

export type HellBreadcrumbSeparatorPart = 'root';
export type HellBreadcrumbSeparatorUi = HellUi<HellBreadcrumbSeparatorPart>;

export type HellBreadcrumbEllipsisPart = 'root';
export type HellBreadcrumbEllipsisUi = HellUi<HellBreadcrumbEllipsisPart>;

const HELL_BREADCRUMBS_RECIPE = {
  root: 'inline-flex max-w-full items-center text-sm text-hell-foreground-muted',
} satisfies HellRecipe<HellBreadcrumbsPart>;

const HELL_BREADCRUMB_LIST_RECIPE = {
  root: 'm-0 inline-flex min-w-0 list-none flex-wrap items-center gap-1.5 p-0',
} satisfies HellRecipe<HellBreadcrumbListPart>;

const HELL_BREADCRUMB_ITEM_RECIPE = {
  root: 'inline-flex min-w-0 items-center gap-hell-1',
} satisfies HellRecipe<HellBreadcrumbItemPart>;

const HELL_BREADCRUMB_LINK_RECIPE = {
  root: 'inline-flex max-w-[24ch] cursor-pointer items-center gap-hell-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-hell-sm border-0 bg-transparent p-0 font-[inherit] text-inherit no-underline transition-colors duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] hover:text-hell-foreground hover:underline hover:underline-offset-[3px] data-hover:text-hell-foreground data-hover:underline data-hover:underline-offset-[3px] data-focus-visible:outline-2 data-focus-visible:outline-hell-focus-ring data-focus-visible:outline-offset-2',
} satisfies HellRecipe<HellBreadcrumbLinkPart>;

const HELL_BREADCRUMB_PAGE_RECIPE = {
  root: 'inline-flex max-w-[32ch] items-center gap-hell-1 overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-hell-foreground',
} satisfies HellRecipe<HellBreadcrumbPagePart>;

const HELL_BREADCRUMB_SEPARATOR_RECIPE = {
  root: 'inline-flex flex-none items-center justify-center text-hell-foreground-subtle',
} satisfies HellRecipe<HellBreadcrumbSeparatorPart>;

const HELL_BREADCRUMB_ELLIPSIS_RECIPE = {
  root: 'inline-flex h-hell-6 w-hell-6 flex-none cursor-pointer items-center justify-center rounded-hell-sm border-0 bg-transparent p-0 font-[inherit] text-hell-foreground-subtle transition-colors duration-[var(--hell-duration-fast)] ease-[var(--ease-hell-out)] hover:bg-hell-surface-subtle hover:text-hell-foreground data-hover:bg-hell-surface-subtle data-hover:text-hell-foreground data-focus-visible:outline-2 data-focus-visible:outline-hell-focus-ring data-focus-visible:outline-offset-1',
} satisfies HellRecipe<HellBreadcrumbEllipsisPart>;

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
export class HellBreadcrumbs extends HellPartStyleable<HellBreadcrumbsPart> {
  protected readonly recipe = HELL_BREADCRUMBS_RECIPE;
  protected readonly defaultUiPart = 'root';
}

@Directive({
  selector: 'ol[hellBreadcrumbList], ul[hellBreadcrumbList]',
  hostDirectives: [NgpBreadcrumbList],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellBreadcrumbList extends HellPartStyleable<HellBreadcrumbListPart> {
  protected readonly recipe = HELL_BREADCRUMB_LIST_RECIPE;
  protected readonly defaultUiPart = 'root';
}

@Directive({
  selector: 'li[hellBreadcrumbItem]',
  hostDirectives: [NgpBreadcrumbItem],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
  },
})
export class HellBreadcrumbItem extends HellPartStyleable<HellBreadcrumbItemPart> {
  protected readonly recipe = HELL_BREADCRUMB_ITEM_RECIPE;
  protected readonly defaultUiPart = 'root';
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
export class HellBreadcrumbLink extends HellPartStyleable<HellBreadcrumbLinkPart> {
  protected readonly recipe = HELL_BREADCRUMB_LINK_RECIPE;
  protected readonly defaultUiPart = 'root';

  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;

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
export class HellBreadcrumbPage extends HellPartStyleable<HellBreadcrumbPagePart> {
  protected readonly recipe = HELL_BREADCRUMB_PAGE_RECIPE;
  protected readonly defaultUiPart = 'root';
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
export class HellBreadcrumbSeparator extends HellPartStyleable<HellBreadcrumbSeparatorPart> {
  protected readonly recipe = HELL_BREADCRUMB_SEPARATOR_RECIPE;
  protected readonly defaultUiPart = 'root';
}

/**
 * Collapsed-middle indicator. Apply to a button when interactive (e.g. opens
 * a menu listing the hidden crumbs) or a span when purely decorative. Renders
 * three dots via CSS so no icon import is required.
 */
@Directive({
  selector: '[hellBreadcrumbEllipsis]',
  hostDirectives: [NgpBreadcrumbEllipsis],
  host: {
    '[class]': "part('root')",
    'data-slot': 'root',
    '[attr.type]': 'nativeButtonType()',
    '[attr.aria-label]': 'nativeButtonType() ? (ariaLabel() ?? labels.breadcrumbs.showHiddenNavigation) : null',
  },
})
export class HellBreadcrumbEllipsis extends HellPartStyleable<HellBreadcrumbEllipsisPart> {
  protected readonly recipe = HELL_BREADCRUMB_ELLIPSIS_RECIPE;
  protected readonly defaultUiPart = 'root';

  readonly ariaLabel = input<string | null>(null, { alias: 'aria-label' });
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;
  protected readonly labels = inject<HellLabels>(HELL_LABELS);

  protected nativeButtonType(): 'button' | null {
    return this.host.tagName.toLowerCase() === 'button' ? 'button' : null;
  }
}

export const HELL_BREADCRUMBS_DIRECTIVES = [
  HellBreadcrumbs,
  HellBreadcrumbList,
  HellBreadcrumbItem,
  HellBreadcrumbLink,
  HellBreadcrumbPage,
  HellBreadcrumbSeparator,
  HellBreadcrumbEllipsis,
] as const;
