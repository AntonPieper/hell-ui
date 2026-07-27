import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidFolderOpen,
  faSolidGauge,
  faSolidRightFromBracket,
  faSolidUser,
  faSolidUsers,
} from '@ng-icons/font-awesome/solid';
import { HELL_APP_SHELL_IMPORTS } from 'hell-ui/app-shell';
import { HellButton } from 'hell-ui/button';
import { HELL_CARD_IMPORTS } from 'hell-ui/card';
import { injectHellPrompt } from 'hell-ui/confirm';
import { HELL_DIALOG_IMPORTS } from 'hell-ui/dialog';
import { HellIcon } from 'hell-ui/icon';
import { HELL_MENU_IMPORTS } from 'hell-ui/menu';
import { HELL_SELECT_IMPORTS } from 'hell-ui/select';

const HD_DIALOG_SHELL_ICONS = {
  faSolidFolderOpen,
  faSolidGauge,
  faSolidRightFromBracket,
  faSolidUser,
  faSolidUsers,
};

/** Nav item recipe over the sidenav's `data-collapsed` shell state attribute. */
const NAV_ITEM =
  'flex cursor-pointer items-center gap-hell-3 rounded-md px-3 py-2 text-[13px] font-medium text-hell-foreground-muted no-underline hover:bg-hell-surface-subtle hover:text-hell-foreground aria-[current=page]:bg-hell-primary-soft aria-[current=page]:font-semibold aria-[current=page]:text-hell-primary in-data-[collapsed=true]:justify-center in-data-[collapsed=true]:px-0';
const NAV_ICON = 'inline-flex w-4 shrink-0 items-center justify-center text-hell-foreground-subtle';
const NAV_LABEL = 'flex-1 truncate in-data-[collapsed=true]:hidden';
const COST_CENTRES = ['Operations', 'Marketing', 'Research'];

@Component({
  selector: 'app-dialog-app-shell-scoped-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...HELL_APP_SHELL_IMPORTS,
    ...HELL_CARD_IMPORTS,
    ...HELL_DIALOG_IMPORTS,
    ...HELL_MENU_IMPORTS,
    ...HELL_SELECT_IMPORTS,
    HellButton,
    HellIcon,
  ],
  providers: [provideIcons(HD_DIALOG_SHELL_ICONS)],
  template: `
    <!--
      hellAppContent is a Dialog Scope root, so a scoped dialog opened from the
      main region blocks only that region. Nothing else in this template opts in.
    -->
    <div
      hellAppShell
      class="h-[30rem] overflow-hidden rounded-hell-lg border border-hell-border"
      ui="[--hell-app-sidenav-width:168px] [--hell-app-secondary-width:0px]"
    >
      <header hellAppTopbar>
        <button hellSidenavToggle type="button"></button>
        <strong class="me-hell-2">Acme Console</strong>
        <span class="flex-1"></span>

        <button
          [hellMenuTrigger]="account"
          placement="bottom-end"
          type="button"
          class="me-hell-1 rounded-hell-md px-hell-2 py-hell-1 text-[13px] text-hell-foreground-muted hover:bg-hell-surface-subtle hover:text-hell-foreground"
        >
          Account
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
        <button [class]="navItem" type="button" aria-current="page">
          <hell-icon [class]="navIcon" name="faSolidGauge" size="14px" />
          <span [class]="navLabel">Dashboard</span>
        </button>
        <button [class]="navItem" type="button" (click)="visited.set('Projects')">
          <hell-icon [class]="navIcon" name="faSolidFolderOpen" size="14px" />
          <span [class]="navLabel">Projects</span>
        </button>
        <button [class]="navItem" type="button" (click)="visited.set('Team')">
          <hell-icon [class]="navIcon" name="faSolidUsers" size="14px" />
          <span [class]="navLabel">Team</span>
        </button>
      </nav>

      <main hellAppContent>
        <h3 class="m-0 text-base font-semibold">Invoice 4021</h3>
        <p class="mt-hell-2 text-sm text-hell-foreground-muted">
          Everything in this main region is blocked while the dialog is open. The topbar, its
          account menu, and the sidenav keep working — the last sidenav button you pressed was
          <strong>{{ visited() }}</strong
          >.
        </p>
        <button hellButton variant="primary" class="mt-hell-4" [hellDialogTrigger]="approve">
          Approve invoice
        </button>
      </main>
    </div>

    <ng-template #approve let-close="close">
      <div hellDialogOverlay scoped>
        <div hellDialog size="sm">
          <div hellCardHeader>
            <h2 hellDialogTitle>Approve invoice 4021?</h2>
          </div>
          <div hellCardBody>
            <p hellDialogDescription>
              Approving releases the payment. Try the shell while this is open: the account menu
              layers over the dialog region, and the sidenav still responds.
            </p>
            <!-- A portaled surface opened from inside the dialog still layers
                 above it, and Escape closes it before the dialog. -->
            <button
              hellSelect
              type="button"
              aria-label="Cost centre"
              class="mt-hell-3 w-full"
              [value]="costCentre()"
              (valueChange)="costCentre.set($any($event))"
            >
              <span hellSelectValue>{{ costCentre() }}</span>
              <ng-template hellSelectPortal>
                <div hellSelectDropdown>
                  @for (centre of costCentres; track centre) {
                    <div hellSelectOption [value]="centre">{{ centre }}</div>
                  }
                </div>
              </ng-template>
            </button>
          </div>
          <div hellCardFooter>
            <button hellButton (click)="close()">Cancel</button>
            <!-- A page-blocking confirm stacked on a scoped dialog goes back to
                 blocking the whole page, shell included, for as long as it is
                 open. -->
            <button hellButton variant="primary" (click)="approveInvoice(close)">
              Approve
            </button>
          </div>
        </div>
      </div>
    </ng-template>
  `,
})
export class DialogAppShellScopedExample {
  protected readonly navItem = NAV_ITEM;
  protected readonly navIcon = NAV_ICON;
  protected readonly navLabel = NAV_LABEL;
  protected readonly visited = signal('Dashboard');
  protected readonly costCentres = COST_CENTRES;
  protected readonly costCentre = signal(COST_CENTRES[0]);
  private readonly prompt = injectHellPrompt();

  /** Confirms the release, then closes the scoped dialog with the decision. */
  protected async approveInvoice(close: (result?: boolean) => void): Promise<void> {
    const confirmed = await this.prompt.confirm(
      {
        title: 'Release this payment?',
        description: 'The shell is blocked again while this confirmation is open.',
      },
      { action: { label: 'Release', variant: 'primary' } },
    );
    if (confirmed) close(true);
  }
}
