import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidMagnifyingGlass, faSolidXmark } from '@ng-icons/font-awesome/solid';
import { HELL_CONTROL_GROUP_DIRECTIVES } from '@hell-ui/angular/control-group';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellInput } from '@hell-ui/angular/input';

@Component({
  selector: 'app-input-with-search-icon-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellIcon, HellInput, ...HELL_CONTROL_GROUP_DIRECTIVES, ...HELL_FIELD_DIRECTIVES],
  providers: [provideIcons({ faSolidMagnifyingGlass, faSolidXmark })],
  template: `
    <div hellField>
      <label id="ticket-search-label" hellFieldLabel for="ticket-search" class="sr-only">
        Search tickets
      </label>
      <div hellControlGroup aria-label="Search tickets controls">
        <span hellControlGroupPrefix ui="pe-hell-1">
          <hell-icon name="faSolidMagnifyingGlass" aria-hidden="true" />
        </span>
        <input
          id="ticket-search"
          hellInput
          [ui]="controlUi"
          type="search"
          placeholder="Search tickets…"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
        />
        @if (query()) {
          <button
            hellControlGroupAction
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
  protected readonly controlUi =
    'h-auto min-h-0 min-w-0 flex-1 rounded-none border-0 bg-transparent px-hell-2 shadow-none focus:border-transparent focus:shadow-none data-focus:border-transparent data-focus:shadow-none';
}
