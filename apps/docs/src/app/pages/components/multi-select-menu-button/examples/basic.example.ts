import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HellButton } from 'hell-ui/button';
import { HELL_MENU_IMPORTS } from 'hell-ui/menu';

interface NotificationChannel {
  readonly id: string;
  readonly name: string;
  readonly unavailable?: boolean;
}

const CHANNELS: readonly NotificationChannel[] = [
  { id: 'email', name: 'Email' },
  { id: 'sms', name: 'SMS' },
  { id: 'push', name: 'Push' },
  { id: 'webhook', name: 'Webhook', unavailable: true },
];

const DEFAULT_CHANNELS: readonly NotificationChannel[] = [CHANNELS[0], CHANNELS[2]];
const MIN_SELECTED = 1;

@Component({
  selector: 'app-multi-select-menu-button-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_MENU_IMPORTS],
  template: `
    <div class="flex flex-col gap-hell-3">
      <button
        hellButton
        type="button"
        class="self-start"
        [hellMenuTrigger]="channelsMenu"
        [attr.data-has-selection]="selected().length ? '' : null"
        [attr.data-selection-count]="selected().length"
      >
        Channels
        @if (selected().length; as count) {
          <span
            class="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-hell-pill bg-hell-primary-soft px-hell-1 text-[11px] font-semibold text-hell-primary"
            data-slot="count"
            aria-hidden="true"
          >
            {{ count }}
          </span>
          <span class="sr-only">{{ count }} selected</span>
        }
      </button>

      <ng-template #channelsMenu>
        <div hellMenu aria-label="Channels">
          @for (channel of channels; track channel.id) {
            <button
              hellMenuItemCheckbox
              type="button"
              [checked]="isSelected(channel)"
              [disabled]="isDisabled(channel)"
              (checkedChange)="setChecked(channel, $event)"
            >
              <span hellMenuItemIndicator></span>
              <span>{{ channel.name }}</span>
            </button>
          }
          <div hellMenuSeparator></div>
          <button hellMenuItem type="button" (click)="reset()">Reset to default</button>
        </div>
      </ng-template>

      <p class="m-0 text-sm text-hell-foreground-muted">
        Notifying via: <strong>{{ summary() }}</strong>
      </p>
    </div>
  `,
})
export class MultiSelectMenuButtonBasicExample {
  protected readonly channels = CHANNELS;
  // The consumer owns the selected domain objects; Menu only emits checked state.
  protected readonly selected = signal<readonly NotificationChannel[]>([...DEFAULT_CHANNELS]);

  protected isSelected(channel: NotificationChannel): boolean {
    return this.selected().includes(channel);
  }

  // Selection floor: at MIN_SELECTED the still-selected options disable, so
  // the selection can never drop below the floor — the recipe owns this policy.
  protected isDisabled(channel: NotificationChannel): boolean {
    return Boolean(
      channel.unavailable ||
        (this.selected().length <= MIN_SELECTED && this.isSelected(channel)),
    );
  }

  protected setChecked(channel: NotificationChannel, checked: boolean): void {
    this.selected.update((current) => {
      if (checked) return current.includes(channel) ? current : [...current, channel];
      return current.filter((candidate) => candidate !== channel);
    });
  }

  protected reset(): void {
    this.selected.set([...DEFAULT_CHANNELS]);
  }

  protected summary(): string {
    const labels = this.selected().map((channel) => channel.name);
    return labels.length ? labels.join(', ') : 'nobody';
  }
}
