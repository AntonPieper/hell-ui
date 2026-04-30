import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { javascript } from '@codemirror/lang-javascript';
import {
  HELL_RESIZABLE_DIRECTIVES,
  HELL_TABLE_DIRECTIVES,
  HellCodeEditor,
} from 'hell';

interface Row {
  id: number;
  name: string;
  email: string;
  role: string;
}

const ROWS: Row[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: 'User ' + (i + 1),
  email: 'user' + (i + 1) + '@example.com',
  role: i % 3 === 0 ? 'Admin' : i % 3 === 1 ? 'Editor' : 'Viewer',
}));

@Component({
  selector: 'app-data-table-row-editor-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_RESIZABLE_DIRECTIVES, ...HELL_TABLE_DIRECTIVES, HellCodeEditor],
  template: `
    <div hellResizable orientation="horizontal" class="h-[420px]">
      <div hellResizablePane [initialFlex]="3" [minSize]="280">
        <div hellTableContainer class="h-full overflow-auto">
          <table hellTable>
            <thead hellTableHead>
              <tr>
                <th hellTableHeaderCell [width]="72">
                  ID
                  <span hellTableColumnResizer></span>
                </th>
                <th hellTableHeaderCell>
                  Name
                  <span hellTableColumnResizer></span>
                </th>
                <th hellTableHeaderCell>
                  Email
                  <span hellTableColumnResizer></span>
                </th>
                <th hellTableHeaderCell>Role</th>
              </tr>
            </thead>
            <tbody hellTableBody>
              @for (row of rows; track row.id) {
                <tr
                  hellTableRow
                  interactive
                  [selected]="selectedId() === row.id"
                  (rowSelect)="select(row)"
                >
                  <td hellTableCell>{{ row.id }}</td>
                  <td hellTableCell>{{ row.name }}</td>
                  <td hellTableCell>{{ row.email }}</td>
                  <td hellTableCell>{{ row.role }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
      <div hellResizableHandle appearance="grip"></div>
      <div hellResizablePane [initialFlex]="2" [minSize]="280" class="flex flex-col">
        @if (selected(); as r) {
          <div class="flex items-center justify-between px-3 py-2 border-b hd-surface-subtle">
            <strong class="text-sm">{{ r.name }}</strong>
            <span class="text-xs hd-text-muted">#{{ r.id }}</span>
          </div>
          <hell-code-editor
            class="grow min-h-0"
            [value]="docText()"
            [extensions]="extensions"
            (valueChange)="onChange($event)"
          />
        } @else {
          <div class="flex items-center justify-center grow text-sm hd-text-muted">
            Select a row to edit.
          </div>
        }
      </div>
    </div>
  `,
})
export class DataTableRowEditorExample {
  protected readonly rows = ROWS;
  protected readonly selectedId = signal<number | null>(null);
  protected readonly extensions = [javascript()];

  private readonly drafts = signal<ReadonlyMap<number, string>>(new Map());

  protected readonly selected = computed(
    () => this.rows.find((r) => r.id === this.selectedId()) ?? null,
  );

  protected readonly docText = computed(() => {
    const r = this.selected();
    if (!r) return '';
    return this.drafts().get(r.id) ?? JSON.stringify(r, null, 2);
  });

  protected select(row: Row) {
    this.selectedId.set(row.id);
  }

  protected onChange(text: string) {
    const id = this.selectedId();
    if (id == null) return;
    const next = new Map(this.drafts());
    next.set(id, text);
    this.drafts.set(next);
  }
}
