import { Component } from '@angular/core';
import {
  HELL_TABLE_UTILITIES_IMPORTS,
  HellTableRowIgnore,
  type HellTableResizeHandleUi,
} from 'hell-ui/table';

// Table primitives are part of the plain styled boundary: core peers plus
// tailwindcss, no optional table-engine peers.
@Component({
  selector: 'app-styled-table',
  imports: [...HELL_TABLE_UTILITIES_IMPORTS, HellTableRowIgnore],
  template: `
    <div hellTableContainer ui="bg-hell-surface-muted">
      <table hellTableRoot ui="text-sm">
        <thead hellTableHeader>
          <tr hellTableRow>
            <th hellTableHeaderCell hellTableSelectionCell>
              <input hellTableRowCheckbox type="checkbox" aria-label="Select all" />
            </th>
            <th hellTableHeaderCell columnId="name">
              Name
              <button hellTableResizeHandle [ui]="resizeHandleUi"></button>
            </th>
            <th hellTableHeaderCell columnId="role">Role</th>
          </tr>
        </thead>
        <tbody hellTableBody>
          <tr hellTableRow active selected>
            <td hellTableCell hellTableSelectionCell>
              <input hellTableRowRadio type="radio" name="primary" aria-label="Primary row" checked />
            </td>
            <td hellTableCell>
              <span hellTableRowIgnore>ignore</span>
              <button hellTableRowAction type="button">Open</button>
            </td>
            <td hellTableCell>Admin</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})
export class StyledTable {
  protected readonly resizeHandleUi = {
    root: 'w-hell-6',
    grip: 'bg-hell-danger',
  } satisfies HellTableResizeHandleUi;
}
