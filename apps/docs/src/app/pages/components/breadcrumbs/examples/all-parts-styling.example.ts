import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_BREADCRUMBS_DIRECTIVES } from '@hell-ui/angular/breadcrumbs';

@Component({
  selector: 'app-breadcrumbs-all-parts-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_BREADCRUMBS_DIRECTIVES],
  template: `
    <!-- Every breadcrumbs directive owns a single 'root' part — refine each -->
    <!-- directive's own ui input rather than styling descendants from hellBreadcrumbs. -->
    <nav
      hellBreadcrumbs
      aria-label="Styled breadcrumb"
      ui="rounded-hell-md bg-hell-surface-subtle px-hell-3 py-hell-2"
    >
      <ol hellBreadcrumbList ui="gap-hell-2">
        <li hellBreadcrumbItem ui="gap-hell-2">
          <a hellBreadcrumbLink href="#" ui="text-hell-primary data-hover:underline">
            Reports
          </a>
        </li>
        <li hellBreadcrumbSeparator ui="text-hell-primary">/</li>
        <li hellBreadcrumbItem>
          <button
            type="button"
            hellBreadcrumbEllipsis
            ui="rounded-hell-pill bg-hell-primary-soft text-hell-primary-soft-foreground"
          ></button>
        </li>
        <li hellBreadcrumbSeparator ui="text-hell-primary">/</li>
        <li hellBreadcrumbItem>
          <span hellBreadcrumbPage [ui]="{ root: 'rounded-hell-sm bg-hell-primary px-hell-2 text-hell-foreground-inverse' }">
            Q3 revenue
          </span>
        </li>
      </ol>
    </nav>
  `,
})
export class BreadcrumbsAllPartsStylingExample {}
