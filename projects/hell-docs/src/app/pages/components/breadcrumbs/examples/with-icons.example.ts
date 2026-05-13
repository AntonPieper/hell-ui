import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidFolderOpen, faSolidGear, faSolidHouse } from '@ng-icons/font-awesome/solid';
import { HELL_BREADCRUMBS_DIRECTIVES, HELL_MENU_DIRECTIVES, HellIcon } from '@hell-ui/angular/primitives';

@Component({
  selector: 'app-breadcrumbs-with-icons-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_BREADCRUMBS_DIRECTIVES, HellIcon],
  providers: [provideIcons({ faSolidFolderOpen, faSolidGear, faSolidHouse })],
  template: `
    <nav hellBreadcrumbs aria-label="Breadcrumb with icons">
      <ol hellBreadcrumbList>
        <li hellBreadcrumbItem>
          <a hellBreadcrumbLink href="#">
            <hell-icon name="faSolidHouse" size="12px" />
            Home
          </a>
        </li>
        <li hellBreadcrumbSeparator></li>
        <li hellBreadcrumbItem>
          <a hellBreadcrumbLink href="#">
            <hell-icon name="faSolidFolderOpen" size="12px" />
            Projects
          </a>
        </li>
        <li hellBreadcrumbSeparator></li>
        <li hellBreadcrumbItem>
          <span hellBreadcrumbPage>
            <hell-icon name="faSolidGear" size="12px" />
            Settings
          </span>
        </li>
      </ol>
    </nav>
  `,
})
export class BreadcrumbsWithIconsExample {}
