import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidFolderOpen, faSolidGauge, faSolidHouse } from '@ng-icons/font-awesome/solid';
import { HellAppShell, HellAppContent, HellAppTopbar } from '@hell-ui/angular/app-shell';
import { HELL_BREADCRUMBS_DIRECTIVES } from '@hell-ui/angular/breadcrumbs';
import { HellIcon } from '@hell-ui/angular/icon';

const HD_BREADCRUMBS_APP_SHELL_TOPBAR_ICONS = {
  faSolidFolderOpen,
  faSolidGauge,
  faSolidHouse,
};

@Component({
  selector: 'app-breadcrumbs-with-app-shell-topbar-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAppShell, HellAppContent, HellAppTopbar, ...HELL_BREADCRUMBS_DIRECTIVES, HellIcon],
  providers: [provideIcons(HD_BREADCRUMBS_APP_SHELL_TOPBAR_ICONS)],
  template: `
    <!-- class is a docs layout hook; hellAppShell itself renders default styling. -->
    <div hellAppShell class="overflow-hidden rounded-lg border border-hell-border">
      <header hellAppTopbar>
        <nav hellBreadcrumbs aria-label="Breadcrumb">
          <ol hellBreadcrumbList>
            <li hellBreadcrumbItem>
              <a hellBreadcrumbLink href="#">
                <hell-icon name="faSolidHouse" size="12px" />
                Acme Console
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
                <hell-icon name="faSolidGauge" size="12px" />
                Overview
              </span>
            </li>
          </ol>
        </nav>
      </header>

      <main hellAppContent>
        <h3 class="m-0 text-base font-semibold">Project Atlas</h3>
        <p class="mt-2 text-sm text-hell-foreground-muted">
          The topbar owns global chrome; breadcrumbs report where the current page sits without
          duplicating the sidenav's navigation.
        </p>
      </main>
    </div>
  `,
})
export class BreadcrumbsWithAppShellTopbarExample {}
