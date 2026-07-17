import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_SELECT_IMPORTS } from '@hell-ui/angular/select';
import { HellChip } from '@hell-ui/angular/chip';

const PERMISSIONS = ['Read', 'Comment', 'Write', 'Manage', 'Admin'];

@Component({
  selector: 'app-select-multiple-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_SELECT_IMPORTS, HellChip],
  template: `
    <div class="flex max-w-72 flex-col gap-hell-2">
      <button
        hellSelect
        multiple
        type="button"
        aria-label="Permissions"
        [value]="selected()"
        (valueChange)="onValueChange($any($event))"
      >
        @if (selected().length) {
          <span hellSelectValue>{{ selected().length }} selected</span>
        } @else {
          <span hellSelectPlaceholder>Grant permissions…</span>
        }
        <ng-template hellSelectPortal>
          <div hellSelectDropdown>
            @for (permission of permissions; track permission) {
              <div hellSelectOption [value]="permission">{{ permission }}</div>
            }
          </div>
        </ng-template>
      </button>

      <div class="flex flex-wrap gap-hell-1">
        @for (permission of selected(); track permission) {
          <span hellChip variant="primary">{{ permission }}</span>
        } @empty {
          <span class="text-xs text-hell-foreground-subtle">No permissions granted</span>
        }
      </div>
    </div>
  `,
})
export class SelectMultipleExample {
  protected readonly permissions = PERMISSIONS;
  protected readonly selected = signal<readonly string[]>(['Read', 'Comment']);

  protected onValueChange(next: readonly string[] | null): void {
    this.selected.set(Array.isArray(next) ? next : []);
  }
}
