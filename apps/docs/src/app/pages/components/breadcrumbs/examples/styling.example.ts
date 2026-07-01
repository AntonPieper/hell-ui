import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_BREADCRUMBS_DIRECTIVES } from '@hell-ui/angular/breadcrumbs';

@Component({
  selector: 'app-breadcrumbs-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_BREADCRUMBS_DIRECTIVES],
  template: `
    <!-- Each directive owns a single root Public Part; refine per directive. -->
    <nav hellBreadcrumbs aria-label="Breadcrumb" ui="text-hell-foreground">
      <ol hellBreadcrumbList>
        <li hellBreadcrumbItem>
          <a hellBreadcrumbLink href="#" ui="text-hell-primary data-hover:text-hell-primary">
            Reports
          </a>
        </li>
        <li hellBreadcrumbSeparator ui="text-hell-primary">/</li>
        <li hellBreadcrumbItem>
          <span hellBreadcrumbPage [ui]="{ root: 'font-bold uppercase tracking-wide' }">
            Q3 revenue
          </span>
        </li>
      </ol>
    </nav>
  `,
})
export class BreadcrumbsStylingExample {}
