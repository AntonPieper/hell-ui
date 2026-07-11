import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  HellMultiSelectMenuButton,
  type HellMultiSelectOption,
} from '@hell-ui/angular/multi-select-menu-button';

const CHANNELS: readonly HellMultiSelectOption[] = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push' },
  { value: 'webhook', label: 'Webhook', disabled: true },
];

const DEFAULT_CHANNELS = ['email', 'push'];

@Component({
  selector: 'app-multi-select-menu-button-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellMultiSelectMenuButton],
  template: `
    <div class="flex flex-col gap-hell-3">
      <hell-multi-select-menu-button
        label="Channels"
        [options]="channels"
        [selected]="selected()"
        [minSelected]="1"
        resettable
        (selectedChange)="selected.set($event)"
        (reset)="selected.set(defaults)"
      />

      <p class="m-0 text-sm text-hell-foreground-muted">
        Notifying via: <strong>{{ summary() }}</strong>
      </p>
    </div>
  `,
})
export class MultiSelectMenuButtonBasicExample {
  protected readonly channels = CHANNELS;
  protected readonly defaults = DEFAULT_CHANNELS;

  // The consumer owns the selection array; the composite never mutates it.
  protected readonly selected = signal<string[]>([...DEFAULT_CHANNELS]);

  protected summary(): string {
    const labels = this.selected().map(
      (value) => CHANNELS.find((channel) => channel.value === value)?.label ?? value,
    );
    return labels.length ? labels.join(', ') : 'nobody';
  }
}
