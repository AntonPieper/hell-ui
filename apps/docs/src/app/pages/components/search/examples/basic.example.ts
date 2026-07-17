import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_SEARCH_IMPORTS, HellInput } from '@hell-ui/angular/input';

const NAMES = ['Ada Lovelace', 'Grace Hopper', 'Katherine Johnson', 'Margaret Hamilton'];

@Component({
  selector: 'app-search-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellInput, ...HELL_SEARCH_IMPORTS],
  template: `
    <div hellSearch class="grid max-w-90 gap-hell-3">
      <div class="flex items-center gap-hell-2">
        <input
          hellInput
          type="search"
          placeholder="Search people"
          aria-label="Search people"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
        />
        <button hellButton hellSearchClear variant="ghost" aria-label="Clear search">Clear</button>
      </div>

      <ul class="m-0 grid list-none gap-hell-1 p-0 text-sm">
        @for (name of matches(); track name) {
          <li>{{ name }}</li>
        } @empty {
          <li class="text-hell-foreground-muted">No matches</li>
        }
      </ul>
    </div>
  `,
})
export class SearchBasicExample {
  protected readonly query = signal('');
  protected readonly matches = computed(() => {
    const query = this.query().trim().toLowerCase();
    return query ? NAMES.filter((name) => name.toLowerCase().includes(query)) : NAMES;
  });
}
