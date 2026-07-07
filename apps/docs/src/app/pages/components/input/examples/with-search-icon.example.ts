import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidMagnifyingGlass, faSolidXmark } from '@ng-icons/font-awesome/solid';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellInput } from '@hell-ui/angular/input';

@Component({
  selector: 'app-input-with-search-icon-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellIcon, HellInput, ...HELL_FIELD_DIRECTIVES],
  providers: [provideIcons({ faSolidMagnifyingGlass, faSolidXmark })],
  template: `
    <div hellField>
      <label hellFieldLabel for="ticket-search" class="sr-only">Search tickets</label>
      <div class="relative">
        <hell-icon
          name="faSolidMagnifyingGlass"
          class="pointer-events-none absolute inset-y-0 start-hell-3 my-auto text-hell-foreground-subtle"
        />
        <input
          id="ticket-search"
          hellInput
          ui="ps-hell-8 pe-hell-8"
          type="search"
          placeholder="Search tickets…"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
        />
        @if (query()) {
          <button
            type="button"
            class="absolute inset-y-0 end-hell-3 my-auto text-hell-foreground-subtle hover:text-hell-foreground"
            aria-label="Clear search"
            (click)="query.set('')"
          >
            <hell-icon name="faSolidXmark" />
          </button>
        }
      </div>
      <div hellFieldDescription>{{ query() ? 'Showing results for “' + query() + '”' : 'Search by ticket title or ID' }}</div>
    </div>
  `,
})
export class InputWithSearchIconExample {
  protected readonly query = signal('');
}
