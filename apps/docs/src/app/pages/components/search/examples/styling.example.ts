import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { HELL_SEARCH_IMPORTS, HellInput } from 'hell-ui/input';

@Component({
  selector: 'app-search-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellInput, ...HELL_SEARCH_IMPORTS],
  template: `
    <!-- HellSearch: refine root with the ui string shorthand. -->
    <div
      hellSearch
      ui="flex max-w-90 items-center gap-hell-3 rounded-hell-lg border border-hell-border bg-hell-surface-subtle p-hell-2"
    >
      <input
        hellInput
        type="search"
        placeholder="Search audit log"
        aria-label="Search audit log"
        ui="rounded-hell-pill"
        [value]="query()"
        (input)="query.set($any($event.target).value)"
      />
      <!-- HellSearchClear: refine root with the [ui] map. -->
      <button
        hellButton
        hellSearchClear
        variant="ghost"
        aria-label="Clear search"
        [ui]="clearUi"
      >
        Clear
      </button>
    </div>
  `,
})
export class SearchStylingExample {
  protected readonly query = signal('failed login');

  protected readonly clearUi = {
    root: 'rounded-hell-pill text-hell-danger',
  };
}
