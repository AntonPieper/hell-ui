import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidCircleCheck, faSolidCircleHalfStroke, faSolidCircleXmark } from '@ng-icons/font-awesome/solid';
import { HellIcon } from '@hell-ui/angular/icon';
import { HELL_SELECT_IMPORTS } from '@hell-ui/angular/select';

interface EnvStatus {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly icon: string;
  readonly color: string;
}

const STATUSES: readonly EnvStatus[] = [
  {
    id: 'operational',
    label: 'Operational',
    hint: 'All checks passing',
    icon: 'faSolidCircleCheck',
    color: 'text-hell-success-strong',
  },
  {
    id: 'degraded',
    label: 'Degraded',
    hint: 'Elevated error rate',
    icon: 'faSolidCircleHalfStroke',
    color: 'text-hell-warning-strong',
  },
  {
    id: 'outage',
    label: 'Outage',
    hint: 'Service unavailable',
    icon: 'faSolidCircleXmark',
    color: 'text-hell-danger-strong',
  },
];

const RICH_OPTION_ICONS = {
  faSolidCircleCheck,
  faSolidCircleHalfStroke,
  faSolidCircleXmark,
};

@Component({
  selector: 'app-select-rich-options-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_SELECT_IMPORTS, HellIcon],
  providers: [provideIcons(RICH_OPTION_ICONS)],
  template: `
    <button
      hellSelect
      type="button"
      aria-label="Service status"
      class="max-w-72"
      [value]="value()"
      [compareWith]="compareById"
      (valueChange)="value.set($any($event))"
    >
      @if (value(); as current) {
        <span hellSelectValue class="inline-flex items-center gap-hell-2">
          <hell-icon [name]="current.icon" [class]="current.color" size="14px" />
          {{ current.label }}
        </span>
      } @else {
        <span hellSelectPlaceholder>Select status…</span>
      }
      <ng-template hellSelectPortal>
        <div hellSelectDropdown>
          @for (status of statuses; track status.id) {
            <div hellSelectOption [value]="status">
              <hell-icon [name]="status.icon" [class]="status.color" size="14px" />
              <span class="flex flex-col leading-tight">
                <span>{{ status.label }}</span>
                <span class="text-[11px] text-hell-foreground-muted">{{ status.hint }}</span>
              </span>
            </div>
          }
        </div>
      </ng-template>
    </button>
  `,
})
export class SelectRichOptionsExample {
  protected readonly statuses = STATUSES;
  protected readonly value = signal<EnvStatus | null>(STATUSES[0]);
  protected readonly compareById = (a: EnvStatus, b: EnvStatus): boolean => a.id === b.id;
}
