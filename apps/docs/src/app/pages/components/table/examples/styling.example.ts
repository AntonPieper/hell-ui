import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidFolderOpen } from '@ng-icons/font-awesome/solid';
import { HellIcon } from '@hell-ui/angular/icon';
import {
  HELL_TABLE_UTILITIES_IMPORTS,
  type HellTableResizeHandleUi,
} from '@hell-ui/angular/table';

interface Release {
  readonly id: string;
  readonly service: string;
  readonly env: string;
}

const releases: readonly Release[] = [
  { id: 'r-2041', service: 'billing-api', env: 'production' },
  { id: 'r-2042', service: 'search-index', env: 'staging' },
  { id: 'r-2043', service: 'edge-cache', env: 'production' },
];

@Component({
  selector: 'app-table-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellIcon, ...HELL_TABLE_UTILITIES_IMPORTS],
  providers: [provideIcons({ faSolidFolderOpen })],
  template: `
    <div hellTableContainer ui="rounded-hell-xl border-hell-primary-soft shadow-hell-md">
      <table hellTableRoot ui="text-[13px] text-hell-foreground">
        <thead hellTableHeader ui="bg-hell-primary-soft">
          <tr hellTableRow>
            <th
              hellTableHeaderCell
              hellTableSelectionCell
              ui="text-hell-primary"
              aria-label="Select release"
            ></th>
            <th
              hellTableHeaderCell
              columnId="service"
              sortable
              [sort]="sort()"
              (sortToggle)="toggleSort()"
              ui="text-hell-primary uppercase tracking-wide"
            >
              <button hellTableSortTrigger type="button" ui="gap-hell-2 text-hell-primary">
                Service
              </button>
            </th>
            <th hellTableHeaderCell ui="text-hell-primary uppercase tracking-wide">
              Environment
              <button
                hellTableResizeHandle
                type="button"
                [ui]="resizeHandleUi"
                aria-label="Resize environment column"
              ></button>
            </th>
            <th hellTableHeaderCell ui="text-hell-primary uppercase tracking-wide">Action</th>
          </tr>
        </thead>
        <tbody hellTableBody ui="[&_tr:last-child_td]:border-b-0">
          @for (release of releases; track release.id) {
            <tr hellTableRow [selected]="selectedId() === release.id" ui="data-[selected=true]:bg-hell-primary-soft">
              <td hellTableCell hellTableSelectionCell ui="align-middle">
                <input
                  hellTableRowCheckbox
                  type="checkbox"
                  ui="rounded-hell-md border-hell-primary"
                  [attr.aria-label]="'Select ' + release.service"
                  [checked]="selectedId() === release.id"
                  (change)="selectedId.set(release.id)"
                />
              </td>
              <td hellTableCell ui="font-medium text-hell-foreground">{{ release.service }}</td>
              <td hellTableCell ui="text-hell-foreground-muted">{{ release.env }}</td>
              <td hellTableCell ui="text-end">
                <button
                  hellTableRowAction
                  type="button"
                  ui="rounded-hell-pill bg-hell-primary-soft text-hell-primary"
                  [attr.aria-label]="'Open ' + release.service"
                  (click)="openId.set(release.id)"
                >
                  <hell-icon name="faSolidFolderOpen" size="12px" />
                  <span>Open</span>
                </button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (openId(); as id) {
      <p class="mt-2 text-sm text-hell-foreground-muted">Opened {{ id }}.</p>
    }
  `,
})
export class TableStylingExample {
  protected readonly releases = releases;
  protected readonly selectedId = signal('r-2041');
  protected readonly openId = signal<string | null>(null);
  protected readonly sort = signal<'asc' | 'desc' | null>('asc');

  // A map form targets the resize handle's two public parts at once.
  protected readonly resizeHandleUi: HellTableResizeHandleUi = {
    root: 'w-hell-3',
    grip: 'bg-hell-primary',
  };

  protected toggleSort(): void {
    this.sort.update((current) =>
      current === 'asc' ? 'desc' : current === 'desc' ? null : 'asc',
    );
  }
}
