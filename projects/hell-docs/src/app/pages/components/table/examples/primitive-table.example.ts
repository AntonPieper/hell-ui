import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_TABLE_UTILITIES_DIRECTIVES } from '@hell-ui/angular/table';

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
  imports: [...HELL_TABLE_UTILITIES_DIRECTIVES],
  template: `
    <div hellTableContainer>
      <table hellTableRoot>
        <thead hellTableHeader>
          <tr hellTableRow>
            <th hellTableHeaderCell columnId="name" sortable [sort]="sort()" (sortToggle)="toggleSort()">
              <button hellTableSortTrigger type="button">Name</button>
            </th>
            <th hellTableHeaderCell columnId="role">Role</th>
            <th hellTableHeaderCell hellTableSelectionCell aria-label="Primary person"></th>
            <th hellTableHeaderCell>Action</th>
          </tr>
        </thead>

        <tbody hellTableBody>
          @for (person of sortedPeople(); track person.id) {
            <tr hellTableRow [active]="activeId() === person.id" [selected]="selectedId() === person.id">
              <td hellTableCell>{{ person.name }}</td>
              <td hellTableCell>{{ person.role }}</td>
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
              <td hellTableCell>
                <button
                  hellTableRowAction
                  type="button"
                  [attr.aria-label]="'Open ' + person.name"
                  (click)="activeId.set(person.id)"
                >
                  Open
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class TablePrimitiveExample {
  protected readonly sort = signal<'asc' | 'desc' | null>('asc');
  protected readonly activeId = signal('ada');
  protected readonly selectedId = signal('grace');

  protected sortedPeople(): readonly Person[] {
    const direction = this.sort();
    if (!direction) return people;
    return [...people].sort((a, b) =>
      direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );
  }

  protected toggleSort(): void {
    this.sort.update((current) => (current === 'asc' ? 'desc' : current === 'desc' ? null : 'asc'));
  }
}
