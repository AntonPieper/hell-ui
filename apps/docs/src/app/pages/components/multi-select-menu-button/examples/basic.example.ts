import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import type { HellOption } from '@hell-ui/angular/core';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_MENU_DIRECTIVES } from '@hell-ui/angular/menu';

const CHANNELS: readonly HellOption<string>[] = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push' },
  { value: 'webhook', label: 'Webhook', disabled: true },
];

const DEFAULT_CHANNELS: readonly string[] = ['email', 'push'];
const MIN_SELECTED = 1;

@Component({
  selector: 'app-multi-select-menu-button-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellButton, ...HELL_MENU_DIRECTIVES],
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
          <hell-menu-options
            [options]="options()"
            [selected]="selected()"
            (selectedChange)="selected.set([...$event])"
          />
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
  // The consumer owns the selection array; the menu never mutates it.
  protected readonly selected = signal<readonly string[]>([...DEFAULT_CHANNELS]);

  // Selection floor: at MIN_SELECTED the still-selected options disable, so
  // the selection can never drop below the floor — the recipe owns this policy.
  protected readonly options = computed<readonly HellOption<string>[]>(() => {
    const selected = this.selected();
    const atFloor = selected.length <= MIN_SELECTED;
    return CHANNELS.map((channel) => ({
      ...channel,
      disabled: (channel.disabled ?? false) || (atFloor && selected.includes(channel.value)),
    }));
  });

  protected reset(): void {
    this.selected.set([...DEFAULT_CHANNELS]);
  }

  protected summary(): string {
    const labels = this.selected().map(
      (value) => CHANNELS.find((channel) => channel.value === value)?.label ?? value,
    );
    return labels.length ? labels.join(', ') : 'nobody';
  }
}
