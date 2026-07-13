import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { HellOption } from '@hell-ui/angular/core';
import { HellSelect, type HellSelectUi } from '@hell-ui/angular/select';

const ENVIRONMENTS: readonly HellOption<string>[] = [
  { value: 'production', label: 'Production' },
  { value: 'staging', label: 'Staging' },
  { value: 'preview', label: 'Preview' },
  { value: 'local', label: 'Local' },
];

@Component({
  selector: 'app-select-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HellSelect],
  template: `
    <!-- HellSelectPart: root | trigger | value | placeholder | dropdown | option -->
    <hell-select
      class="max-w-72"
      aria-label="Target environment"
      placeholder="Choose environment"
      [options]="environments"
      [value]="value()"
      [ui]="ui"
      (valueChange)="value.set($event === null ? null : $any($event))"
    />
  `,
})
export class SelectStylingExample {
  protected readonly environments = ENVIRONMENTS;
  protected readonly value = signal<string | null>(null);

  protected readonly ui: HellSelectUi = {
    root: 'rounded-hell-lg bg-hell-surface-subtle p-hell-1',
    trigger: 'rounded-hell-md border-hell-primary bg-hell-surface-elevated font-mono',
    value: 'font-semibold text-hell-primary',
    placeholder: 'italic text-hell-foreground-subtle',
    dropdown: 'rounded-hell-lg border-hell-primary bg-hell-surface-subtle',
    option: 'rounded-hell-md font-mono data-active:bg-hell-primary-soft data-selected:bg-hell-primary',
  };
}
