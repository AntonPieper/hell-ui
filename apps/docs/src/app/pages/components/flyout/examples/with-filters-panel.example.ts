import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidFilter } from '@ng-icons/font-awesome/solid';
import { HellButton } from '@hell-ui/angular/button';
import { HellCheckbox } from '@hell-ui/angular/checkbox';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { HellFlyout, HellFlyoutTrigger } from '@hell-ui/angular/flyout';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellChip } from '@hell-ui/angular/chip';

interface StatusFilter {
  readonly id: string;
  readonly label: string;
  checked: boolean;
}

@Component({
  selector: 'app-flyout-with-filters-panel-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ faSolidFilter })],
  imports: [HellButton, HellCheckbox, ...HELL_FIELD_DIRECTIVES, HellFlyout, HellFlyoutTrigger, HellIcon, HellChip],
  template: `
    <div class="min-h-[220px]">
      <button
        hellButton
        variant="soft"
        hellFlyoutTrigger
        #t="hellFlyoutTrigger"
        (openChange)="open.set($event)"
      >
        <hell-icon name="faSolidFilter" />
        Status
        @if (activeCount() > 0) {
          <span hellChip variant="primary">{{ activeCount() }}</span>
        }
      </button>

      @if (open()) {
        <div [hellFlyout]="t" aria-labelledby="status-filters-title" class="grid w-[240px] gap-hell-3 p-hell-4">
          <strong id="status-filters-title" class="text-xs font-semibold uppercase tracking-wide text-hell-foreground-subtle">
            Filter by status
          </strong>

          <ul class="grid gap-hell-2">
            @for (status of statuses(); track status.id) {
              <li hellField orientation="horizontal">
                <button
                  [id]="status.id"
                  hellCheckbox
                  [checked]="status.checked"
                  (checkedChange)="toggle(status.id, $event)"
                ></button>
                <label hellFieldLabel [for]="status.id">{{ status.label }}</label>
              </li>
            }
          </ul>

          <div class="flex justify-end gap-hell-2">
            <button hellButton type="button" size="sm" variant="ghost" (click)="clear()">Clear</button>
            <button hellButton type="button" size="sm" variant="primary" (click)="t.hide()">Apply</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class FlyoutWithFiltersPanelExample {
  protected readonly open = signal(false);
  protected readonly statuses = signal<StatusFilter[]>([
    { id: 'status-open', label: 'Open', checked: true },
    { id: 'status-in-review', label: 'In review', checked: false },
    { id: 'status-blocked', label: 'Blocked', checked: true },
    { id: 'status-closed', label: 'Closed', checked: false },
  ]);
  protected readonly activeCount = computed(
    () => this.statuses().filter((status) => status.checked).length,
  );

  protected toggle(id: string, checked: boolean): void {
    this.statuses.update((statuses) =>
      statuses.map((status) => (status.id === id ? { ...status, checked } : status)),
    );
  }

  protected clear(): void {
    this.statuses.update((statuses) => statuses.map((status) => ({ ...status, checked: false })));
  }
}
