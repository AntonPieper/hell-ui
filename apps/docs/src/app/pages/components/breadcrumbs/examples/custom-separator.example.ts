import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_BREADCRUMBS_IMPORTS } from 'hell-ui/breadcrumbs';

@Component({
  selector: 'app-breadcrumbs-custom-separator-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_BREADCRUMBS_IMPORTS],
  template: `
    <nav hellBreadcrumbs aria-label="Slash separator">
      <ol hellBreadcrumbList>
        <li hellBreadcrumbItem>
          <a hellBreadcrumbLink href="#">Org</a>
        </li>
        <li hellBreadcrumbSeparator>/</li>
        <li hellBreadcrumbItem>
          <a hellBreadcrumbLink href="#">Repo</a>
        </li>
        <li hellBreadcrumbSeparator>/</li>
        <li hellBreadcrumbItem>
          <span hellBreadcrumbPage>main</span>
        </li>
      </ol>
    </nav>
  `,
})
export class BreadcrumbsCustomSeparatorExample {}
