import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidPenToSquare, faSolidShareNodes, faSolidTrash } from '@ng-icons/font-awesome/solid';
import { HELL_BREADCRUMBS_DIRECTIVES } from '@hell-ui/angular/breadcrumbs';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_PAGE_HEADER_DIRECTIVES } from '@hell-ui/angular/page-header';
import { HELL_TOOLBAR_DIRECTIVES } from '@hell-ui/angular/toolbar';

@Component({
  selector: 'app-page-header-detail-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ faSolidPenToSquare, faSolidShareNodes, faSolidTrash })],
  imports: [
    HellIcon,
    ...HELL_PAGE_HEADER_DIRECTIVES,
    ...HELL_BREADCRUMBS_DIRECTIVES,
    ...HELL_TOOLBAR_DIRECTIVES,
  ],
  template: `
    <hell-page-header>
      <hell-page-header-back (back)="goBack()" />
      <nav hellBreadcrumbs hellPageHeaderLeading aria-label="Breadcrumb">
        <ol hellBreadcrumbList>
          <li hellBreadcrumbItem>
            <a hellBreadcrumbLink href="#team">Team</a>
          </li>
          <li hellBreadcrumbSeparator></li>
          <li hellBreadcrumbItem>
            <span hellBreadcrumbPage>Ada Lovelace</span>
          </li>
        </ol>
      </nav>

      <span hellPageHeaderTitle>Ada Lovelace</span>

      <hell-overflow-toolbar hellPageHeaderToolbar label="Record actions">
        <ng-template
          hellToolbarAction
          label="Edit"
          overflow="never"
          iconOnly
          (activated)="run('edit')"
        >
          <hell-icon name="faSolidPenToSquare" size="13px" />
        </ng-template>
        <ng-template hellToolbarAction label="Share" iconOnly (activated)="run('share')">
          <hell-icon name="faSolidShareNodes" size="13px" />
        </ng-template>
        <ng-template
          hellToolbarAction
          label="Delete"
          overflow="always"
          (activated)="run('delete')"
        >
          <hell-icon name="faSolidTrash" size="13px" />
        </ng-template>
      </hell-overflow-toolbar>
    </hell-page-header>

    <p class="mt-hell-3 text-sm text-hell-foreground-muted">
      Last event: <strong data-testid="page-header-last-event">{{ lastEvent() }}</strong>
    </p>
  `,
})
export class PageHeaderDetailExample {
  protected readonly lastEvent = signal('none yet');

  protected goBack(): void {
    // The back affordance only emits — routing stays with the app. Here we just
    // record it; a real app would call Location.back() or a router navigation.
    this.lastEvent.set('back');
  }

  protected run(action: string): void {
    this.lastEvent.set(action);
  }
}
