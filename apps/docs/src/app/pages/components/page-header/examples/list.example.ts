import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidDownload,
  faSolidFilter,
  faSolidGear,
  faSolidPlus,
} from '@ng-icons/font-awesome/solid';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_PAGE_HEADER_DIRECTIVES } from '@hell-ui/angular/page-header';
import { HellTag } from '@hell-ui/angular/tag';
import { HELL_TOOLBAR_DIRECTIVES } from '@hell-ui/angular/toolbar';

@Component({
  selector: 'app-page-header-list-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ faSolidPlus, faSolidFilter, faSolidDownload, faSolidGear })],
  imports: [HellIcon, HellTag, ...HELL_PAGE_HEADER_DIRECTIVES, ...HELL_TOOLBAR_DIRECTIVES],
  template: `
    <hell-page-header>
      <span hellPageHeaderTitle>Team members</span>
      <span hellTag hellPageHeaderMeta variant="info">24 seats</span>
      <p hellPageHeaderDescription>Everyone with access to the Acme workspace.</p>

      <hell-toolbar hellPageHeaderToolbar label="Member actions">
        <ng-template hellToolbarAction label="Invite" priority="primary" (activated)="run('invite')">
          <hell-icon name="faSolidPlus" size="13px" />
        </ng-template>
        <ng-template hellToolbarAction label="Filter" (activated)="run('filter')">
          <hell-icon name="faSolidFilter" size="13px" />
        </ng-template>
        <ng-template hellToolbarAction label="Export" (activated)="run('export')">
          <hell-icon name="faSolidDownload" size="13px" />
        </ng-template>
        <ng-template
          hellToolbarAction
          label="Settings"
          priority="overflowOnly"
          (activated)="run('settings')"
        >
          <hell-icon name="faSolidGear" size="13px" />
        </ng-template>
      </hell-toolbar>
    </hell-page-header>

    <p class="mt-hell-3 text-sm text-hell-foreground-muted">
      Last action: <strong>{{ lastAction() }}</strong>
    </p>
  `,
})
export class PageHeaderListExample {
  protected readonly lastAction = signal('none yet');

  protected run(action: string): void {
    this.lastAction.set(action);
  }
}
