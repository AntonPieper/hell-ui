import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidCloudArrowUp } from '@ng-icons/font-awesome/solid';
import { HELL_EMPTY_STATE_DIRECTIVES } from '@hell-ui/angular/empty-state';
import { HellButton } from '@hell-ui/angular/button';
import { HellIcon } from '@hell-ui/angular/icon';

@Component({
  selector: 'app-empty-state-custom-content-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_EMPTY_STATE_DIRECTIVES, HellButton, HellIcon],
  providers: [provideIcons({ faSolidCloudArrowUp })],
  template: `
    <div class="h-80 rounded-hell-lg border border-hell-border bg-hell-surface">
      <hell-empty-state [headingLevel]="2">
        <hell-icon hellEmptyStateMedia name="faSolidCloudArrowUp" class="text-hell-primary" />
        <span hellEmptyStateTitle>Upload your first document</span>
        <span hellEmptyStateDescription>
          Drag files here or browse to add contracts, invoices, and statements.
        </span>
        <button hellEmptyStateActions hellButton variant="ghost" type="button">Browse files</button>
        <button hellEmptyStateActions hellButton type="button">Upload</button>
      </hell-empty-state>
    </div>
  `,
})
export class EmptyStateCustomContentExample {}
