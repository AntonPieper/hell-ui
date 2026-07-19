import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  faSolidFilter,
  faSolidMagnifyingGlass,
  faSolidUser,
  faSolidXmark,
} from '@ng-icons/font-awesome/solid';
import { HELL_OMNIBAR_IMPORTS } from '@hell-ui/angular/omnibar';
import {
  hellSearchResource,
  type HellSearchField,
  type HellSearchResourceSource,
} from '@hell-ui/angular/core';
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
  imports: [HellIcon, ...HELL_OMNIBAR_IMPORTS],
  providers: [provideIcons({ faSolidFilter, faSolidMagnifyingGlass, faSolidUser, faSolidXmark })],
  template: `
    <hell-omnibar
      class="max-w-90"
      placeholder="Search people"
      ariaLabel="Search people"
      hotkey="/"
      [(query)]="query"
      (submit)="selected.set($any($event.item))"
    >
      <hell-icon hellOmnibarLeading name="faSolidMagnifyingGlass" size="13px" />

      <div hellOmnibarActions aria-label="People search filters">
        <button
          hellOmnibarAction
          type="button"
          [pressed]="filtersActive()"
          [attr.aria-pressed]="filtersActive()"
          (click)="toggleFilters()"
        >
          <hell-icon name="faSolidFilter" size="12px" />
          Filters
        </button>
        <button hellOmnibarAction type="button" (click)="clearSelection()">
          <hell-icon name="faSolidXmark" size="12px" />
          Clear selection
        </button>
      </div>

      @if (peopleSearch.status() === 'success' && peopleSearch.items().length > 0) {
        <div hellOmnibarGroup label="People">
          <div hellOmnibarGroupLabel>People</div>
          @for (person of peopleSearch.items(); track person.id) {
            <button
              hellOmnibarItem
              type="button"
              [value]="person"
              [disabled]="isPersonDisabled(person)"
            >
              <hell-icon
                class="inline-flex w-4 shrink-0 items-center justify-center text-hell-foreground-subtle in-data-[active=true]:text-hell-foreground"
                name="faSolidUser"
                size="13px"
              />
              <span class="flex min-w-0 flex-1 flex-col overflow-hidden *:truncate">
                {{ person.name }}
                <span class="text-[11px] text-hell-foreground-muted">{{ person.email }}</span>
              </span>
              <span class="ms-auto inline-flex items-center gap-1 text-[11px] text-hell-foreground-muted">
                {{ person.team }}
              </span>
            </button>
          }
        </div>
      }

      @if (peopleSearch.status() === 'loading') {
        <div
          hellOmnibarFooter
          role="status"
          class="border-t border-hell-border px-3 py-2 text-sm text-hell-foreground-muted"
        >
          Loading people…
        </div>
      } @else if (peopleSearch.status() === 'error') {
        <div
          hellOmnibarFooter
          role="alert"
          class="border-t border-hell-border px-3 py-2 text-sm text-hell-danger"
        >
          Search failed. Try again.
        </div>
      } @else if (peopleSearch.status() === 'success' && peopleSearch.items().length === 0) {
        <div
          hellOmnibarFooter
          class="border-t border-hell-border px-3 py-2 text-sm text-hell-foreground-muted"
        >
          No people found.
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

  protected readonly searchFields: readonly HellSearchField<Person>[] = [
    { name: 'name', weight: 5, get: (person) => person.name },
    { name: 'email', weight: 4, get: (person) => person.email },
    { name: 'team', weight: 2, get: (person) => person.team },
  ];

  // A real source calls a backend; this fake resolves after a delay and aborts
  // superseded requests through the provided signal. Type "error" to see the
  // error footer.
  protected readonly searchPeople: HellSearchResourceSource<Person> = ({ query, signal }) =>
    new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        if (signal.aborted) return;
        if (query.trim().toLowerCase() === 'error') {
          reject(new Error('People search failed'));
          return;
        }
        resolve(PEOPLE);
      }, 450);

      signal.addEventListener(
        'abort',
        () => {
          window.clearTimeout(timer);
          reject(new DOMException('Search aborted', 'AbortError'));
        },
        { once: true },
      );
    });
  protected readonly peopleSearch = hellSearchResource({
    query: this.query,
    source: this.searchPeople,
    fields: this.searchFields,
    limit: 6,
    debounce: 180,
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
}
