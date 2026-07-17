import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidGear,
  faSolidRightFromBracket,
  faSolidUser,
} from '@ng-icons/font-awesome/solid';
import { HELL_MENU_IMPORTS } from '@hell-ui/angular/menu';
import { HellAvatar } from '@hell-ui/angular/avatar';
import { HellIcon } from '@hell-ui/angular/icon';

const MENU_PROFILE_ICONS = {
  faSolidGear,
  faSolidRightFromBracket,
  faSolidUser,
};

@Component({
  selector: 'app-menu-profile-menu-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellAvatar, HellIcon, ...HELL_MENU_IMPORTS],
  providers: [provideIcons(MENU_PROFILE_ICONS)],
  template: `
    <!-- An avatar-backed trigger: a bare button hosting the avatar, not hellButton. -->
    <button
      [hellMenuTrigger]="account"
      placement="bottom-end"
      type="button"
      aria-label="Account menu"
      class="rounded-full focus-visible:outline-hell-focus-ring"
    >
      <hell-avatar fallback="AP" size="sm" />
    </button>

    <ng-template #account>
      <div hellMenu ui="min-w-[240px]">
        <div hellMenuSection>
          <!-- Non-interactive account header. -->
          <div class="flex items-center gap-hell-3 px-hell-2 py-hell-2">
            <hell-avatar fallback="AP" size="md" />
            <div class="flex min-w-0 flex-col">
              <span class="truncate text-[13px] font-semibold text-hell-foreground">Anton Pieper</span>
              <span class="truncate text-[11px] text-hell-foreground-subtle">anton@acme.test</span>
            </div>
          </div>
        </div>

        <div hellMenuSeparator></div>

        <button hellMenuItem type="button" (click)="run('profile')">
          <hell-icon hellMenuItemIcon name="faSolidUser" size="14px" />
          <span>Your profile</span>
        </button>
        <button hellMenuItem type="button" (click)="run('settings')">
          <hell-icon hellMenuItemIcon name="faSolidGear" size="14px" />
          <span>Settings</span>
          <span hellMenuItemTrailing>⌘,</span>
        </button>

        <div hellMenuSeparator></div>

        <button hellMenuItem type="button" class="hd-danger-text" (click)="run('sign-out')">
          <hell-icon hellMenuItemIcon name="faSolidRightFromBracket" size="14px" />
          <span>Sign out</span>
        </button>
      </div>
    </ng-template>
  `,
})
export class MenuProfileMenuExample {
  protected run(action: string): void {
    console.log('account menu:', action);
  }
}
