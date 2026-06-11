import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { HellButton } from '@hell-ui/angular/button';
import {
  HellTable,
  HellTableBody,
  HellTableCell,
  HellTableContainer,
  HellTableHead,
  HellTableHeaderCell,
  HellTableRow,
  HellTableRowAction,
} from '@hell-ui/angular/table';

interface Person {
  readonly id: string;
  readonly name: string;
  readonly role: string;
}

@Component({
  selector: 'app-data-table-grid-mode-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HellButton,
    HellTableContainer,
    HellTable,
    HellTableHead,
    HellTableBody,
    HellTableRow,
    HellTableHeaderCell,
    HellTableCell,
    HellTableRowAction,
  ],
  template: `
    <div class="grid gap-3">
      <div hellTableContainer class="overflow-auto">
        <table
          hellTable
          contentWidth
          semantics="grid"
          interactionMode="cell-navigation"
          aria-label="Explicit grid-mode people table"
          [rowCount]="rows.length + 1"
          [colCount]="3"
        >
          <thead hellTableHead>
            <tr hellTableRow [rowIndex]="1">
              <th hellTableHeaderCell [colIndex]="1" scope="col">Name</th>
              <th hellTableHeaderCell [colIndex]="2" scope="col">Role</th>
              <th hellTableHeaderCell [colIndex]="3" scope="col">Action</th>
            </tr>
          </thead>
          <tbody hellTableBody>
            @for (row of rows; track row.id; let rowIndex = $index) {
              <tr hellTableRow [rowIndex]="rowIndex + 2" [selected]="activeRowKey() === row.id">
                <td hellTableCell [colIndex]="1">{{ row.name }}</td>
                <td hellTableCell [colIndex]="2">{{ row.role }}</td>
                <td hellTableCell [colIndex]="3">
                  <button
                    hellButton
                    hellTableRowAction
                    type="button"
                    size="xs"
                    variant="ghost"
                    [attr.aria-pressed]="activeRowKey() === row.id ? 'true' : 'false'"
                    (click)="activeRowKey.set(row.id)"
                  >
                    Mark active
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <p class="text-xs text-hell-foreground-muted">
        Grid mode is explicit: <code>semantics=&quot;grid&quot;</code> plus an
        <code>interactionMode</code>. The table root becomes the single tab stop, arrows move the
        active descendant, and Enter/Space activates the focused cell widget.
      </p>
    </div>
  `,
})
export class DataTableGridModeExample {
  protected readonly rows: readonly Person[] = [
    { id: 'ada', name: 'Ada Lovelace', role: 'Admin' },
    { id: 'grace', name: 'Grace Hopper', role: 'Editor' },
    { id: 'linus', name: 'Linus Torvalds', role: 'Maintainer' },
  ];
  protected readonly activeRowKey = signal<string | null>(null);
}
