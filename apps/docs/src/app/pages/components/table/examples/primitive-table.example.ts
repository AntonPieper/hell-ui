import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidFolderOpen } from '@ng-icons/font-awesome/solid';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_TABLE_UTILITIES_IMPORTS } from '@hell-ui/angular/table';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly role: string;
}

const people: readonly Person[] = [
  { id: 'ada', name: 'Ada Lovelace', role: 'Admin' },
  { id: 'grace', name: 'Grace Hopper', role: 'Editor' },
  { id: 'katherine', name: 'Katherine Johnson', role: 'Analyst' },
];

@Component({
  selector: 'app-table-primitive-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellIcon, ...HELL_TABLE_UTILITIES_IMPORTS],
  providers: [provideIcons({ faSolidFolderOpen })],
  template: `
    <div hellTableContainer data-testid="primitive-table" ui="rounded-hell-lg">
      <table hellTableRoot>
        <thead hellTableHeader ui="bg-hell-surface-muted">
          <tr hellTableRow>
            <th hellTableHeaderCell hellTableSelectionCell aria-label="Primary person"></th>
            <th
              hellTableHeaderCell
              columnId="name"
              sortable
              [sort]="sort().column === 'name' ? sort().direction : null"
              (sortToggle)="toggleSort('name')"
            >
              <button hellTableSortTrigger type="button" ui="font-semibold">Name</button>
            </th>
            <th
              hellTableHeaderCell
              columnId="role"
              sortable
              [sort]="sort().column === 'role' ? sort().direction : null"
              (sortToggle)="toggleSort('role')"
            >
              <button hellTableSortTrigger type="button" ui="font-semibold">Role</button>
            </th>
            <th hellTableHeaderCell>Action</th>
          </tr>
        </thead>

        <tbody hellTableBody>
          @for (person of sortedPeople(); track person.id) {
            <tr
              hellTableRow
              [active]="activeId() === person.id"
              [selected]="selectedId() === person.id"
            >
              <td hellTableCell hellTableSelectionCell>
                <input
                  hellTableRowRadio
                  type="radio"
                  name="primary-person"
                  [attr.aria-label]="'Select ' + person.name"
                  [checked]="selectedId() === person.id"
                  (change)="selectedId.set(person.id)"
                />
              </td>
              <td hellTableCell>{{ person.name }}</td>
              <td hellTableCell>{{ person.role }}</td>
              <td hellTableCell>
                <button
                  hellTableRowAction
                  type="button"
                  [attr.aria-label]="'Open ' + person.name"
                  (click)="activeId.set(person.id)"
                  ui="text-hell-primary"
                >
                  <hell-icon name="faSolidFolderOpen" />
                  <span>Open</span>
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (activePerson(); as person) {
      <p class="mt-2 text-sm text-hell-foreground-muted" data-testid="primitive-open-result">
        Opened {{ person.name }}.
      </p>
    }
  `,
})
export class TablePrimitiveExample {
  protected readonly sort = signal<{
    readonly column: 'name' | 'role';
    readonly direction: 'asc' | 'desc' | null;
  }>({ column: 'name', direction: 'asc' });
  protected readonly activeId = signal('ada');
  protected readonly selectedId = signal('ada');
  protected readonly activePerson = computed(
    () => people.find((person) => person.id === this.activeId()) ?? null,
  );

  protected sortedPeople(): readonly Person[] {
    const { column, direction } = this.sort();
    if (!direction) return people;
    return [...people].sort((a, b) =>
      direction === 'asc' ? a[column].localeCompare(b[column]) : b[column].localeCompare(a[column]),
    );
  }

  protected toggleSort(column: 'name' | 'role'): void {
    this.sort.update((current) => {
      if (current.column !== column) return { column, direction: 'asc' };
      return {
        column,
        direction:
          current.direction === 'asc' ? 'desc' : current.direction === 'desc' ? null : 'asc',
      };
    });
  }
}
