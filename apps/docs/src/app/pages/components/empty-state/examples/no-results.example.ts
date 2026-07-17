import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_EMPTY_STATE_COPY, HELL_EMPTY_STATE_IMPORTS } from '@hell-ui/angular/empty-state';
import { HellButton } from '@hell-ui/angular/button';

@Component({
  selector: 'app-empty-state-no-results-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_EMPTY_STATE_IMPORTS, HellButton],
  template: `
    <div class="h-72 rounded-hell-lg border border-hell-border bg-hell-surface">
      <hell-empty-state glyph="noResults" [title]="copy.title">
        <span hellEmptyStateDescription>
          No customers match "{{ query() }}". Try a different search or clear the filters.
        </span>
        <button hellEmptyStateActions hellButton variant="ghost" type="button" (click)="clear()">
          Clear filters
        </button>
      </hell-empty-state>
    </div>
  `,
})
export class EmptyStateNoResultsExample {
  protected readonly copy = HELL_EMPTY_STATE_COPY.noResults;
  protected readonly query = signal('acme industrial holdings');

  protected clear(): void {
    this.query.set('');
  }
}
