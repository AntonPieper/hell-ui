import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_BREADCRUMBS_IMPORTS } from '@hell-ui/angular/breadcrumbs';

@Component({
  selector: 'app-breadcrumbs-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_BREADCRUMBS_IMPORTS],
  template: `
    <nav hellBreadcrumbs aria-label="Breadcrumb">
      <ol hellBreadcrumbList>
        <li hellBreadcrumbItem>
          <a hellBreadcrumbLink href="#">Home</a>
        </li>
        <li hellBreadcrumbSeparator></li>
        <li hellBreadcrumbItem>
          <a hellBreadcrumbLink href="#">Projects</a>
        </li>
        <li hellBreadcrumbSeparator></li>
        <li hellBreadcrumbItem>
          <span hellBreadcrumbPage>Settings</span>
        </li>
      </ol>
    </nav>
  `,
})
export class BreadcrumbsBasicExample {}
