import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HELL_EMPTY_STATE_IMPORTS } from '@hell-ui/angular/empty-state';
import { HellButton } from '@hell-ui/angular/button';

@Component({
  selector: 'app-empty-state-no-data-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_EMPTY_STATE_IMPORTS, HellButton],
  template: `
    <div class="h-72 rounded-hell-lg border border-hell-border bg-hell-surface">
      <hell-empty-state glyph="noData">
        <span hellEmptyStateTitle>No invoices yet</span>
        <span hellEmptyStateDescription>
          Invoices you create will show up here with their status and due dates.
        </span>
        <button hellEmptyStateActions hellButton type="button">Create your first invoice</button>
      </hell-empty-state>
    </div>
  `,
})
export class EmptyStateNoDataExample {}
