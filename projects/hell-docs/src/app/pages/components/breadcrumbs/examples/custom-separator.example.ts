import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidFolderOpen, faSolidGear, faSolidHouse } from '@ng-icons/font-awesome/solid';
import { HELL_BREADCRUMBS_DIRECTIVES, HELL_MENU_DIRECTIVES, HellIcon } from 'hell';

@Component({
  selector: 'app-breadcrumbs-custom-separator-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_BREADCRUMBS_DIRECTIVES],
  providers: [provideIcons({ faSolidFolderOpen, faSolidGear, faSolidHouse })],
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
