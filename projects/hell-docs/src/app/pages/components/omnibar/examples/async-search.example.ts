import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidMagnifyingGlass, faSolidUser } from '@ng-icons/font-awesome/solid';
import { HELL_OMNIBAR_DIRECTIVES } from 'hell/composites';
import { type HellSearchField, type HellSearchSource } from 'hell/core';
import { HellIcon } from 'hell/primitives';

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
      <div class="p-3 text-sm text-hell-foreground-muted">
        {{ message }} people…
      </div>
    </ng-template>

    <hell-omnibar
      #peopleSearch="hellOmnibar"
      placeholder="Search people"
      ariaLabel="Search people"
      [searchSource]="searchPeople"
      [searchFields]="searchFields"
      [searchLimit]="6"
      [searchDebounce]="180"
      [loadingTemplate]="peopleLoading"
      loadingMessage="Loading"
      [(value)]="query"
      (submit)="selected.set($any($event.item))"
    >
      <hell-icon hellOmnibarLeading name="faSolidMagnifyingGlass" size="13px" />
      <span hellOmnibarTrailing class="text-xs text-hell-foreground-muted">async</span>

      <div hellOmnibarGroup label="People">
        <div hellOmnibarGroupLabel>People</div>
        @for (result of peopleSearch.searchResults(); track result.item.id) {
          <button hellOmnibarItem type="button" [value]="result.item">
            <hell-icon hellOmnibarItemIcon name="faSolidUser" size="13px" />
            <span hellOmnibarItemText>
              {{ result.item.name }}
              <span hellOmnibarItemSubtext>{{ result.item.email }}</span>
            </span>
            <span hellOmnibarItemTrailing>{{ result.item.team }}</span>
          </button>
        }
      </div>
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

  protected readonly searchFields: readonly HellSearchField<Person>[] = [
    { name: 'name', weight: 5, get: (person) => person.name },
    { name: 'email', weight: 4, get: (person) => person.email },
    { name: 'team', weight: 2, get: (person) => person.team },
  ];

  protected readonly searchPeople: HellSearchSource<Person> = ({ query, signal }) =>
    new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        if (signal?.aborted) return;
        resolve(PEOPLE);
      }, 450);

      signal?.addEventListener('abort', () => {
        window.clearTimeout(timer);
        reject(new DOMException('Search aborted', 'AbortError'));
      }, { once: true });
    });
}
