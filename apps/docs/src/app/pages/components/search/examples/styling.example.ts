import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_SEARCH_DIRECTIVES } from '@hell-ui/angular/search';
import { HellButton } from '@hell-ui/angular/button';
import { HellInput } from '@hell-ui/angular/input';

@Component({
  selector: 'app-search-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, HellInput, ...HELL_SEARCH_DIRECTIVES],
  template: `
    <div hellSearch class="flex max-w-90 items-center gap-2">
      <!-- Input and clear affordance keep their own single-part ui inputs. -->
      <input
        hellInput
        type="search"
        placeholder="Search audit log"
        aria-label="Search audit log"
        ui="rounded-hell-pill"
        [value]="query()"
        (input)="query.set($any($event.target).value)"
      />
      <button
        hellButton
        hellSearchClear
        variant="ghost"
        type="button"
        aria-label="Clear search"
        [ui]="{ root: 'text-hell-danger' }"
        (click)="query.set('')"
      >
        Clear
      </button>
    </div>
  `,
})
export class SearchStylingExample {
  protected readonly query = signal('failed login');
}
