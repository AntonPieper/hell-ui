import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_SELECT_IMPORTS } from 'hell-ui/select';

const ENVIRONMENTS = ['Production', 'Staging', 'Preview', 'Local'] as const;

@Component({
  selector: 'app-select-styling-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_SELECT_IMPORTS],
  template: `
    <button
      hellSelect
      type="button"
      class="max-w-72"
      aria-label="Target environment"
      [value]="value()"
      ui="rounded-hell-lg border-hell-primary bg-hell-surface-elevated font-mono"
      (valueChange)="value.set($any($event))"
    >
      @if (value(); as current) {
        <span hellSelectValue ui="font-semibold text-hell-primary">{{ current }}</span>
      } @else {
        <span hellSelectPlaceholder ui="italic text-hell-foreground-subtle">
          Choose environment
        </span>
      }
      <ng-template hellSelectPortal>
        <div
          hellSelectDropdown
          ui="rounded-hell-lg border-hell-primary bg-hell-surface-subtle"
        >
          @for (environment of environments; track environment) {
            <div
              hellSelectOption
              [value]="environment"
              ui="rounded-hell-md font-mono data-active:bg-hell-primary-soft data-selected:bg-hell-primary"
            >
              {{ environment }}
            </div>
          }
        </div>
      </ng-template>
    </button>
  `,
})
export class SelectStylingExample {
  protected readonly environments = ENVIRONMENTS;
  protected readonly value = signal<(typeof ENVIRONMENTS)[number] | null>(null);
}
