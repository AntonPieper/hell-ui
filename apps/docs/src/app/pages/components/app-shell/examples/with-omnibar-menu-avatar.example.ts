import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidChartLine,
  faSolidFileInvoice,
  faSolidFolderOpen,
  faSolidGauge,
  faSolidRightFromBracket,
  faSolidUser,
  faSolidUsers,
} from '@ng-icons/font-awesome/solid';
import { hellSearchResource, type HellSearchField } from '@hell-ui/angular/core';
import { HELL_APP_SHELL_DIRECTIVES } from '@hell-ui/angular/app-shell';
import { HELL_OMNIBAR_DIRECTIVES } from '@hell-ui/angular/omnibar';
import { HELL_MENU_DIRECTIVES } from '@hell-ui/angular/menu';
import { HellAvatar } from '@hell-ui/angular/avatar';
import { HellIcon } from '@hell-ui/angular/icon';

interface Page {
  readonly id: string;
  readonly label: string;
}

const PAGES: readonly Page[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'projects', label: 'Projects' },
  { id: 'team', label: 'Team' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'reports', label: 'Reports' },
];

const HD_APP_SHELL_FRAME_ICONS = {
  faSolidChartLine,
  faSolidFileInvoice,
  faSolidFolderOpen,
  faSolidGauge,
  faSolidRightFromBracket,
  faSolidUser,
  faSolidUsers,
};

@Component({
  selector: 'app-app-shell-with-omnibar-menu-avatar-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...HELL_APP_SHELL_DIRECTIVES,
    ...HELL_OMNIBAR_DIRECTIVES,
    ...HELL_MENU_DIRECTIVES,
    HellAvatar,
    HellIcon,
  ],
  providers: [provideIcons(HD_APP_SHELL_FRAME_ICONS)],
  template: `
    <div hellAppShell class="h-[30rem] overflow-hidden rounded-hell-lg border border-hell-border">
      <header hellAppTopbar>
        <button hellSidenavToggle appearance="shell" type="button"></button>
        <strong class="me-hell-2">Acme Console</strong>

        <!-- Global search lives in the topbar and spans the free space. -->
        <hell-omnibar
          class="mx-auto w-full max-w-md"
          placeholder="Jump to…"
          ariaLabel="Search pages"
          [(query)]="query"
          (submit)="goTo($any($event.item))"
        >
          <div hellOmnibarGroup label="Pages">
            <div hellOmnibarGroupLabel>Pages</div>
            @for (page of pageSearch.items(); track page.id) {
              <button hellOmnibarItem type="button" [value]="page" (select)="goTo($event)">
                <span hellOmnibarItemText>{{ page.label }}</span>
              </button>
            }
          </div>
        </hell-omnibar>

        <!-- Account menu anchored to an avatar-backed trigger. -->
        <button
          [hellMenuTrigger]="account"
          placement="bottom-end"
          type="button"
          aria-label="Account menu"
          class="ms-hell-2 rounded-full focus-visible:outline-hell-focus-ring"
        >
          <hell-avatar fallback="AP" size="sm" />
        </button>
        <ng-template #account>
          <div hellMenu ui="min-w-[200px]">
            <button hellMenuItem type="button">
              <hell-icon hellMenuItemIcon name="faSolidUser" size="14px" />
              Profile
            </button>
            <div hellMenuSeparator></div>
            <button hellMenuItem type="button">
              <hell-icon hellMenuItemIcon name="faSolidRightFromBracket" size="14px" />
              Sign out
            </button>
          </div>
        </ng-template>
      </header>

      <nav hellAppSidenav aria-label="Primary">
        @for (page of pages; track page.id) {
          <a
            hellNavItem
            href="#"
            [attr.aria-current]="active() === page.id ? 'page' : null"
            (click)="select($event, page.id)"
          >
            <hell-icon hellNavItemIcon [name]="iconFor(page.id)" size="14px" />
            <span hellNavItemLabel>{{ page.label }}</span>
          </a>
        }
      </nav>

      <main hellAppContent [maxWidth]="960">
        <h3 class="m-0 text-base font-semibold">{{ activeLabel() }}</h3>
        <p class="mt-2 text-sm text-hell-foreground-muted">
          A realistic frame: the omnibar drives navigation from the topbar, the avatar opens an
          account menu, and the sidenav mirrors the current page with <code>aria-current</code>.
        </p>
      </main>
    </div>
  `,
})
export class AppShellWithOmnibarMenuAvatarExample {
  protected readonly pages = PAGES;
  protected readonly query = signal('');
  protected readonly active = signal<string>('dashboard');

  protected readonly searchFields: readonly HellSearchField<Page>[] = [
    { name: 'label', weight: 5, get: (page) => page.label },
    { name: 'id', weight: 2, get: (page) => page.id },
  ];
  protected readonly pageSearch = hellSearchResource({
    query: this.query,
    items: PAGES,
    fields: this.searchFields,
  });

  private readonly icons: Record<string, string> = {
    dashboard: 'faSolidGauge',
    projects: 'faSolidFolderOpen',
    team: 'faSolidUsers',
    invoices: 'faSolidFileInvoice',
    reports: 'faSolidChartLine',
  };

  protected iconFor(id: string): string {
    return this.icons[id] ?? 'faSolidGauge';
  }

  protected activeLabel(): string {
    return PAGES.find((page) => page.id === this.active())?.label ?? 'Dashboard';
  }

  protected select(event: Event, id: string): void {
    event.preventDefault();
    this.active.set(id);
  }

  protected goTo(page: Page): void {
    this.active.set(page.id);
  }
}
