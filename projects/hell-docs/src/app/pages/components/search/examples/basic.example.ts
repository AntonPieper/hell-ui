import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HellButton, HellInput, HELL_SEARCH_DIRECTIVES } from 'hell';

const ITEMS = ['Ada Lovelace', 'Grace Hopper', 'Katherine Johnson', 'Margaret Hamilton'];

@Component({
  selector: 'app-search-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellInput, ...HELL_SEARCH_DIRECTIVES],
  template: `
    <div hellSearch class="grid max-w-90 gap-3">
      <div class="flex items-center gap-2">
        <input
          hellInput
          type="search"
          placeholder="Search people"
          aria-label="Search people"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
        />
        <button
          hellButton
          hellSearchClear
          variant="ghost"
          type="button"
          aria-label="Clear search"
          (click)="query.set('')"
        >
          Clear
        </button>
      </div>

      <ul class="m-0 grid list-none gap-1 p-0 text-sm">
        @for (item of matches(); track item) {
          <li>{{ item }}</li>
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
    return query ? ITEMS.filter((item) => item.toLowerCase().includes(query)) : ITEMS;
  });
}
