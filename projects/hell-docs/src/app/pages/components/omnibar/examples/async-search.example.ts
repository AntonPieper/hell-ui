import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidMagnifyingGlass, faSolidUser } from '@ng-icons/font-awesome/solid';
import { HELL_OMNIBAR_DIRECTIVES } from '@hell-ui/angular/omnibar';
import { type HellSearchField, type HellSearchSource } from '@hell-ui/angular/core';
import { HellIcon } from '@hell-ui/angular/icon';

interface Person {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly team: string;
}

const PEOPLE: readonly Person[] = Array.from({ length: 32 }, (_, index) => {
  const id = index + 1;
  const teams = ['Design', 'Engineering', 'Support', 'Finance'];
  return {
    id,
    name: `User ${id}`,
    email: `user${id}@example.com`,
    team: teams[index % teams.length],
  };
});

@Component({
  selector: 'app-omnibar-async-search-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellIcon, ...HELL_OMNIBAR_DIRECTIVES],
  providers: [provideIcons({ faSolidMagnifyingGlass, faSolidUser })],
  template: `
    <ng-template #peopleLoading let-message="message">
      <div class="p-3 text-sm text-hell-foreground-muted">{{ message }} people…</div>
    </ng-template>

    <hell-omnibar
      #peopleSearch="hellOmnibar"
      placeholder="Search people"
      ariaLabel="Search people"
      hotkey="/"
      [searchSource]="searchPeople"
      [searchFields]="searchFields"
      [searchLimit]="6"
      [searchDebounce]="180"
      [loadingTemplate]="peopleLoading"
      loadingMessage="Loading"
      [(value)]="query"
      (submit)="selected.set($any($event.item))"
      (searchError)="handleSearchError($event)"
    >
      <hell-icon hellOmnibarLeading name="faSolidMagnifyingGlass" size="13px" />
      <span hellOmnibarTrailing class="text-xs text-hell-foreground-muted">async</span>

      <div hellOmnibarActions aria-label="People search filters">
        <button
          hellOmnibarAction
          type="button"
          [pressed]="filtersActive()"
          [attr.aria-pressed]="filtersActive()"
          (click)="toggleFilters()"
        >
          Filters
        </button>
        <button hellOmnibarAction type="button" (click)="clearSelection()">Clear selection</button>
      </div>

      <div hellOmnibarGroup label="People">
        <div hellOmnibarGroupLabel>People</div>
        @for (result of peopleSearch.searchResults(); track result.item.id) {
          <button
            hellOmnibarItem
            type="button"
            [value]="result.item"
            [disabled]="isPersonDisabled(result.item)"
          >
            <hell-icon hellOmnibarItemIcon name="faSolidUser" size="13px" />
            <span hellOmnibarItemText>
              {{ result.item.name }}
              <span hellOmnibarItemSubtext>{{ result.item.email }}</span>
            </span>
            <span hellOmnibarItemTrailing>{{ result.item.team }}</span>
          </button>
        }
      </div>

      @if (lastError(); as message) {
        <div
          hellOmnibarFooter
          role="alert"
          class="border-t border-hell-border px-3 py-2 text-sm text-hell-danger"
        >
          {{ message }}
        </div>
      }
    </hell-omnibar>

    @if (selected(); as person) {
      <p class="mt-3 text-sm text-hell-foreground-muted">
        Selected {{ person.name }} from {{ person.team }}.
      </p>
    }
  `,
})
export class OmnibarAsyncSearchExample {
  protected readonly query = signal('');
  protected readonly selected = signal<Person | null>(null);
  protected readonly filtersActive = signal(false);
  protected readonly lastError = signal<string | null>(null);

  protected readonly searchFields: readonly HellSearchField<Person>[] = [
    { name: 'name', weight: 5, get: (person) => person.name },
    { name: 'email', weight: 4, get: (person) => person.email },
    { name: 'team', weight: 2, get: (person) => person.team },
  ];

  protected readonly searchPeople: HellSearchSource<Person> = ({ query, signal }) =>
    new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        if (signal?.aborted) return;
        if (query.trim().toLowerCase() === 'error') {
          reject(new Error('People search failed'));
          return;
        }
        this.lastError.set(null);
        resolve(PEOPLE);
      }, 450);

      signal?.addEventListener(
        'abort',
        () => {
          window.clearTimeout(timer);
          reject(new DOMException('Search aborted', 'AbortError'));
        },
        { once: true },
      );
    });

  protected toggleFilters(): void {
    this.filtersActive.update((active) => !active);
  }

  protected clearSelection(): void {
    this.selected.set(null);
  }

  protected isPersonDisabled(person: Person): boolean {
    return person.id === 2;
  }

  protected handleSearchError(error: unknown): void {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    this.lastError.set('Search failed. Try again.');
  }
}
