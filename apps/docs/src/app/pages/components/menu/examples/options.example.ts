import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import type { HellOption } from '@hell-ui/angular/core';
import { HELL_MENU_DIRECTIVES } from '@hell-ui/angular/menu';
import { HellButton } from '@hell-ui/angular/button';

const COLUMNS = [
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'owner', label: 'Owner' },
  { value: 'updated', label: 'Last updated' },
] as const satisfies readonly HellOption<string>[];

@Component({
  selector: 'app-menu-options-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_MENU_DIRECTIVES],
  template: `
    <button hellButton variant="ghost" [hellMenuTrigger]="columnsMenu" type="button">
      Columns ({{ visible().length }})
    </button>

    <ng-template #columnsMenu>
      <div hellMenu aria-label="Visible columns">
        <hell-menu-options
          [options]="options()"
          [selected]="visible()"
          (selectedChange)="visible.set([...$event])"
        />
      </div>
    </ng-template>
  `,
})
export class MenuOptionsExample {
  protected readonly visible = signal<readonly string[]>(['name', 'status']);

  // Selection floor: when only one column is left, disable it so the
  // selection can never drop to zero — the consumer owns this policy.
  protected readonly options = computed<readonly HellOption<string>[]>(() => {
    const visible = this.visible();
    return COLUMNS.map((column) => ({
      ...column,
      disabled: visible.length === 1 && visible.includes(column.value),
    }));
  });
}
