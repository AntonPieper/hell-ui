import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidFolderOpen, faSolidGear, faSolidHouse } from '@ng-icons/font-awesome/solid';
import { HELL_BREADCRUMBS_DIRECTIVES, HELL_MENU_DIRECTIVES, HellIcon } from 'hell/primitives';

@Component({
  selector: 'app-breadcrumbs-standard-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_BREADCRUMBS_DIRECTIVES],
  providers: [provideIcons({ faSolidFolderOpen, faSolidGear, faSolidHouse })],
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
          <a hellBreadcrumbLink href="#">Heinrich UI</a>
        </li>
        <li hellBreadcrumbSeparator></li>
        <li hellBreadcrumbItem>
          <span hellBreadcrumbPage>Settings</span>
        </li>
      </ol>
    </nav>
  `,
})
export class BreadcrumbsStandardExample {}
