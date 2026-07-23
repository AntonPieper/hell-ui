import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HellAvatar } from 'hell-ui/avatar';
import { HELL_CARD_IMPORTS } from 'hell-ui/card';
import { HELL_SEARCH_IMPORTS, HellInput } from 'hell-ui/input';
import { HELL_LISTBOX_IMPORTS } from 'hell-ui/listbox';

interface Teammate {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly role: string;
}

const TEAMMATES: readonly Teammate[] = [
  { id: 'ada', name: 'Ada Lovelace', initials: 'AL', role: 'Platform lead' },
  { id: 'grace', name: 'Grace Hopper', initials: 'GH', role: 'Compilers' },
  { id: 'katherine', name: 'Katherine Johnson', initials: 'KJ', role: 'Navigation' },
  { id: 'margaret', name: 'Margaret Hamilton', initials: 'MH', role: 'Flight software' },
];

@Component({
  selector: 'app-listbox-assignment-picker-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellAvatar,
    HellInput,
    ...HELL_CARD_IMPORTS,
    ...HELL_LISTBOX_IMPORTS,
    ...HELL_SEARCH_IMPORTS,
  ],
  template: `
    <div hellCard class="max-w-80" [elevation]="1">
      <div hellCardHeader>Assign ticket</div>
      <div hellCardBody class="grid gap-3">
        <div hellSearch>
          <input
            hellInput
            type="search"
            placeholder="Search teammates"
            aria-label="Search teammates"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
          />
        </div>
        <div
          hellListbox
          aria-label="Teammates"
          [value]="assignee()"
          (valueChange)="assignee.set($any($event))"
        >
          @for (teammate of matches(); track teammate.id) {
            <div hellListboxOption [value]="teammate.id" class="flex items-center gap-3">
              <hell-avatar size="sm" [fallback]="teammate.initials" />
              <span class="grid">
                <span>{{ teammate.name }}</span>
                <span class="text-xs text-hell-foreground-muted">{{ teammate.role }}</span>
              </span>
            </div>
          } @empty {
            <p class="px-hell-2 py-hell-1 text-sm text-hell-foreground-muted">No matches</p>
          }
        </div>
      </div>
      <div hellCardFooter class="text-xs text-hell-foreground-muted">
        @if (assigneeName(); as name) {
          Assigned to {{ name }}
        } @else {
          Unassigned
        }
      </div>
    </div>
  `,
})
export class ListboxAssignmentPickerExample {
  protected readonly query = signal('');
  protected readonly assignee = signal<string[]>(['grace']);

  protected readonly matches = computed(() => {
    const query = this.query().trim().toLowerCase();
    return query
      ? TEAMMATES.filter((teammate) => teammate.name.toLowerCase().includes(query))
      : TEAMMATES;
  });

  protected readonly assigneeName = computed(() => {
    const id = this.assignee()[0];
    return TEAMMATES.find((teammate) => teammate.id === id)?.name;
  });
}
