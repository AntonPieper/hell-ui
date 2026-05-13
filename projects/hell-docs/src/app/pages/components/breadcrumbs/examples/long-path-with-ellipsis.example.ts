import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidFolderOpen, faSolidGear, faSolidHouse } from '@ng-icons/font-awesome/solid';
import { HELL_BREADCRUMBS_DIRECTIVES, HELL_MENU_DIRECTIVES, HellIcon } from '@hell-ui/angular/primitives';

@Component({
  selector: 'app-breadcrumbs-long-path-with-ellipsis-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_BREADCRUMBS_DIRECTIVES, ...HELL_MENU_DIRECTIVES],
  providers: [provideIcons({ faSolidFolderOpen, faSolidGear, faSolidHouse })],
  template: `
    <nav hellBreadcrumbs aria-label="Long breadcrumb">
      <ol hellBreadcrumbList>
        <li hellBreadcrumbItem>
          <a hellBreadcrumbLink href="#">Home</a>
        </li>
        <li hellBreadcrumbSeparator></li>
        <li hellBreadcrumbItem>
          <button
            type="button"
            hellBreadcrumbEllipsis
            [hellMenuTrigger]="hiddenBreadcrumbs"
            placement="bottom-start"
          ></button>
        </li>
        <li hellBreadcrumbSeparator></li>
        <li hellBreadcrumbItem>
          <a hellBreadcrumbLink href="#">Heinrich UI</a>
        </li>
        <li hellBreadcrumbSeparator></li>
        <li hellBreadcrumbItem>
          <a hellBreadcrumbLink href="#">Components</a>
        </li>
        <li hellBreadcrumbSeparator></li>
        <li hellBreadcrumbItem>
          <span hellBreadcrumbPage>Breadcrumbs</span>
        </li>
      </ol>
    </nav>

    <ng-template #hiddenBreadcrumbs>
      <div hellMenu>
        <a hellMenuItem href="#">Design systems</a>
        <a hellMenuItem href="#">Angular</a>
      </div>
    </ng-template>
  `,
})
export class BreadcrumbsLongPathWithEllipsisExample {}
