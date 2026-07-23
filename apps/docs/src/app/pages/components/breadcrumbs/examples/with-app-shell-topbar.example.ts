import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidFolderOpen, faSolidGauge, faSolidHouse } from '@ng-icons/font-awesome/solid';
import { HellAppShell, HellAppContent, HellAppTopbar } from 'hell-ui/app-shell';
import { HELL_BREADCRUMBS_IMPORTS } from 'hell-ui/breadcrumbs';
import { HellIcon } from 'hell-ui/icon';

const HD_BREADCRUMBS_APP_SHELL_TOPBAR_ICONS = {
  faSolidFolderOpen,
  faSolidGauge,
  faSolidHouse,
};

@Component({
  selector: 'app-breadcrumbs-with-app-shell-topbar-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAppShell, HellAppContent, HellAppTopbar, ...HELL_BREADCRUMBS_IMPORTS, HellIcon],
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
        <!-- The content pane is a scroll container; keyboard users need focusable
             content inside it (axe: scrollable-region-focusable on WebKit). -->
        <a
          href="#"
          class="mt-3 inline-block text-sm font-medium text-hell-foreground underline underline-offset-[3px] hover:text-hell-foreground-muted"
        >
          Open project settings
        </a>
      </main>
    </div>
  `,
})
export class BreadcrumbsWithAppShellTopbarExample {}
