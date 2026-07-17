import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HELL_BREADCRUMBS_IMPORTS } from '@hell-ui/angular/breadcrumbs';
import { HELL_MENU_IMPORTS } from '@hell-ui/angular/menu';

@Component({
  selector: 'app-breadcrumbs-collapsed-ellipsis-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_BREADCRUMBS_IMPORTS, ...HELL_MENU_IMPORTS],
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
            [hellMenuTrigger]="hiddenCrumbs"
            placement="bottom-start"
          ></button>
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

    <ng-template #hiddenCrumbs>
      <div hellMenu>
        <a hellMenuItem href="#">Design systems</a>
        <a hellMenuItem href="#">Angular</a>
      </div>
    </ng-template>
  `,
})
export class BreadcrumbsCollapsedEllipsisExample {}
