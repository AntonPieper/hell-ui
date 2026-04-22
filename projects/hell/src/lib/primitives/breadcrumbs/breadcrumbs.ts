import { Directive, booleanAttribute, input } from '@angular/core';
import { NgpBreadcrumbs, NgpBreadcrumbList, NgpBreadcrumbItem } from 'ng-primitives/breadcrumbs';

@Directive({
  selector: 'nav[hellBreadcrumbs]',
  hostDirectives: [NgpBreadcrumbs],
  host: { '[class.hell-breadcrumbs]': '!unstyled()' },
})
export class HellBreadcrumbs {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: 'ol[hellBreadcrumbList], ul[hellBreadcrumbList]',
  hostDirectives: [NgpBreadcrumbList],
  host: { style: 'display:inline-flex; align-items:center; gap:4px; list-style:none; padding:0; margin:0;' },
})
export class HellBreadcrumbList {}

@Directive({
  selector: 'a[hellBreadcrumbItem], span[hellBreadcrumbItem]',
  hostDirectives: [NgpBreadcrumbItem],
  host: { '[class.hell-breadcrumbs-item]': '!unstyled()' },
})
export class HellBreadcrumbItem {
  readonly unstyled = input(false, { transform: booleanAttribute });
}

@Directive({
  selector: '[hellBreadcrumbSeparator]',
  host: {
    '[class.hell-breadcrumbs-separator]': '!unstyled()',
    'aria-hidden': 'true',
  },
})
export class HellBreadcrumbSeparator {
  readonly unstyled = input(false, { transform: booleanAttribute });
}
