import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidXmark } from '@ng-icons/font-awesome/solid';
import { HellButton } from '@hell-ui/angular/button';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_SEARCH_IMPORTS, HellInput } from '@hell-ui/angular/input';

@Component({
  selector: 'app-search-empty-state-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellIcon, HellInput, ...HELL_SEARCH_IMPORTS],
  providers: [provideIcons({ faSolidXmark })],
  template: `
    <div hellSearch class="flex max-w-90 items-center gap-hell-2">
      <input
        hellInput
        type="search"
        placeholder="Search orders"
        aria-label="Search orders"
        [value]="query()"
        (input)="query.set($any($event.target).value)"
      />
      <button
        hellButton
        hellSearchClear
        iconOnly
        variant="ghost"
        aria-label="Clear search"
        class="data-empty:invisible"
      >
        <hell-icon name="faSolidXmark" />
      </button>
    </div>
    <p class="mt-hell-2 text-xs text-hell-foreground-muted">
      Query: <code>{{ query() || '(empty)' }}</code> — press Escape in the field to clear it too.
    </p>
  `,
})
export class SearchEmptyStateExample {
  protected readonly query = signal('overdue');
}
