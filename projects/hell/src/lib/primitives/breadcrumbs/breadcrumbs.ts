import { Directive, booleanAttribute, input } from '@angular/core';
import { HellStyleable } from '../../core/styleable';
import {
  NgpBreadcrumbs,
  NgpBreadcrumbList,
  NgpBreadcrumbItem,
  NgpBreadcrumbLink,
  NgpBreadcrumbPage,
  NgpBreadcrumbSeparator,
  NgpBreadcrumbEllipsis,
} from 'ng-primitives/breadcrumbs';

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
  host: { '[class.hell-breadcrumbs]': '!unstyled()' },
})
export class HellBreadcrumbs extends HellStyleable {}

@Directive({
  selector: 'ol[hellBreadcrumbList], ul[hellBreadcrumbList]',
  hostDirectives: [NgpBreadcrumbList],
  host: { '[class.hell-breadcrumb-list]': '!unstyled()' },
})
export class HellBreadcrumbList extends HellStyleable {}

@Directive({
  selector: 'li[hellBreadcrumbItem]',
  hostDirectives: [NgpBreadcrumbItem],
  host: { '[class.hell-breadcrumbs-item]': '!unstyled()' },
})
export class HellBreadcrumbItem extends HellStyleable {}

/** Navigable crumb — apply to <a> or <button>. */
@Directive({
  selector: 'a[hellBreadcrumbLink], button[hellBreadcrumbLink]',
  hostDirectives: [NgpBreadcrumbLink],
  host: { '[class.hell-breadcrumbs-link]': '!unstyled()' },
})
export class HellBreadcrumbLink extends HellStyleable {}

/** Current page — apply to <span> or similar non-link element. */
@Directive({
  selector: '[hellBreadcrumbPage]',
  hostDirectives: [NgpBreadcrumbPage],
  host: {
    '[class.hell-breadcrumbs-page]': '!unstyled()',
    'aria-current': 'page',
  },
})
export class HellBreadcrumbPage extends HellStyleable {}

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
    '[class.hell-breadcrumbs-separator]': '!unstyled()',
    role: 'presentation',
    'aria-hidden': 'true',
  },
})
export class HellBreadcrumbSeparator extends HellStyleable {}

/**
 * Collapsed-middle indicator. Apply to a button when interactive (e.g. opens
 * a menu listing the hidden crumbs) or a span when purely decorative. Renders
 * three dots via CSS so no icon import is required.
 */
@Directive({
  selector: '[hellBreadcrumbEllipsis]',
  hostDirectives: [NgpBreadcrumbEllipsis],
  host: {
    '[class.hell-breadcrumbs-ellipsis]': '!unstyled()',
    'aria-label': 'Show hidden navigation',
  },
})
export class HellBreadcrumbEllipsis extends HellStyleable {}

export const HELL_BREADCRUMBS_DIRECTIVES = [
  HellBreadcrumbs,
  HellBreadcrumbList,
  HellBreadcrumbItem,
  HellBreadcrumbLink,
  HellBreadcrumbPage,
  HellBreadcrumbSeparator,
  HellBreadcrumbEllipsis,
] as const;
