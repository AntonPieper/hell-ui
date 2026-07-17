import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidStar } from '@ng-icons/font-awesome/solid';
import { HELL_MENU_IMPORTS } from '@hell-ui/angular/menu';
import { HellButton } from '@hell-ui/angular/button';
import { HellIcon } from '@hell-ui/angular/icon';

const MENU_STYLING_ICONS = { faSolidStar };

@Component({
  selector: 'app-menu-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellIcon, ...HELL_MENU_IMPORTS],
  providers: [provideIcons(MENU_STYLING_ICONS)],
  template: `
    <button hellButton variant="primary" [hellMenuTrigger]="styled" type="button">
      Bulk actions
    </button>

    <ng-template #styled>
      <!-- Every styled menu module owns a single 'root' part. Refine each one -->
      <!-- through its own ui input rather than reaching into descendants. -->
      <div hellMenu ui="min-w-[240px] rounded-hell-lg border-hell-primary bg-hell-surface-elevated">
        <div hellMenuSection ui="gap-hell-1">
          <div hellMenuLabel ui="text-hell-primary">Records</div>

          <button
            hellMenuItem
            type="button"
            ui="rounded-hell-md data-hover:bg-hell-primary-soft data-focus-visible:bg-hell-primary-soft"
          >
            <span hellMenuItemIcon ui="rounded-hell-sm bg-hell-primary-soft text-hell-primary">
              <hell-icon name="faSolidStar" size="12px" />
            </span>
            <span>Approve selected</span>
            <span hellMenuItemTrailing ui="text-hell-primary">12</span>
          </button>

          <button
            hellMenuItemCheckbox
            [checked]="notify()"
            (checkedChange)="notify.set($event)"
            ui="rounded-hell-md data-hover:bg-hell-primary-soft"
          >
            <span hellMenuItemIndicator ui="text-hell-success-strong"></span>
            <span>Notify owners</span>
          </button>
        </div>

        <div hellMenuSeparator ui="bg-hell-primary/40"></div>

        <div hellMenuSection hellMenuItemRadioGroup [value]="scope()" (valueChange)="scope.set($event)">
          <div hellMenuLabel ui="text-hell-primary">Scope</div>
          <button hellMenuItemRadio value="page" ui="rounded-hell-md data-hover:bg-hell-primary-soft">
            <span hellMenuItemIndicator ui="text-hell-primary"></span>
            <span>This page</span>
          </button>
          <button hellMenuItemRadio value="all" ui="rounded-hell-md data-hover:bg-hell-primary-soft">
            <span hellMenuItemIndicator ui="text-hell-primary"></span>
            <span>All matches</span>
          </button>
        </div>

        <div hellMenuSeparator ui="bg-hell-primary/40"></div>

        <!-- ui on this host feeds both hellMenuItem and hellSubmenuTrigger; -->
        <!-- text-hell-primary also tints the generated submenu chevron. -->
        <button
          hellMenuItem
          type="button"
          [hellSubmenuTrigger]="more"
          ui="rounded-hell-md text-hell-primary data-hover:bg-hell-primary-soft"
        >
          <span>More…</span>
        </button>
      </div>
    </ng-template>

    <ng-template #more>
      <div hellMenu ui="rounded-hell-lg border-hell-primary">
        <button hellMenuItem type="button" ui="rounded-hell-md data-hover:bg-hell-primary-soft">
          Export CSV
        </button>
        <button hellMenuItem type="button" ui="rounded-hell-md data-hover:bg-hell-primary-soft">
          Archive
        </button>
      </div>
    </ng-template>
  `,
})
export class MenuStylingExample {
  protected readonly notify = signal(true);
  protected readonly scope = signal('page');
}
