import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_MENU_IMPORTS } from 'hell-ui/menu';
import { HellButton } from 'hell-ui/button';

interface ProjectColumn {
  readonly id: string;
  readonly name: string;
}

const COLUMNS: readonly ProjectColumn[] = [
  { id: 'name', name: 'Name' },
  { id: 'status', name: 'Status' },
  { id: 'owner', name: 'Owner' },
  { id: 'updated', name: 'Last updated' },
];

@Component({
  selector: 'app-menu-options-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_MENU_IMPORTS],
  template: `
    <button hellButton variant="ghost" [hellMenuTrigger]="columnsMenu" type="button">
      Columns ({{ visible().length }})
    </button>

    <ng-template #columnsMenu>
      <div hellMenu aria-label="Visible columns">
        @for (column of columns; track column.id) {
          <button
            hellMenuItemCheckbox
            type="button"
            [checked]="isVisible(column)"
            [disabled]="isLastVisible(column)"
            (checkedChange)="setVisible(column, $event)"
          >
            <span hellMenuItemIndicator></span>
            <span>{{ column.name }}</span>
          </button>
        }
      </div>
    </ng-template>
  `,
})
export class MenuOptionsExample {
  protected readonly columns = COLUMNS;
  protected readonly visible = signal<readonly ProjectColumn[]>([COLUMNS[0], COLUMNS[1]]);

  protected isVisible(column: ProjectColumn): boolean {
    return this.visible().includes(column);
  }

  // Selection floor: when only one column is left, disable that row so the
  // selection can never drop to zero — the consumer owns this policy.
  protected isLastVisible(column: ProjectColumn): boolean {
    return this.visible().length === 1 && this.isVisible(column);
  }

  protected setVisible(column: ProjectColumn, checked: boolean): void {
    this.visible.update((current) => {
      if (checked) return current.includes(column) ? current : [...current, column];
      return current.filter((candidate) => candidate !== column);
    });
  }
}
