import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_LISTBOX_IMPORTS } from '@hell-ui/angular/listbox';

interface Check {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly disabled?: boolean;
}

const CHECKS: readonly Check[] = [
  { id: 'docs', label: 'Documentation', detail: 'Public guidance is current' },
  { id: 'a11y', label: 'Accessibility review', detail: 'Keyboard and screen-reader pass' },
  { id: 'migration', label: 'Data migration', detail: 'Blocked on upstream', disabled: true },
  { id: 'release', label: 'Release notes', detail: 'Consumer-facing notes drafted' },
];

@Component({
  selector: 'app-listbox-multiple-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_LISTBOX_IMPORTS],
  template: `
    <div class="grid gap-2">
      <span id="listbox-multiple-label" class="text-sm font-semibold text-hell-foreground">
        Launch checks
      </span>
      <div
        hellListbox
        class="max-w-80"
        mode="multiple"
        aria-labelledby="listbox-multiple-label"
        [value]="selected()"
        (valueChange)="selected.set($any($event))"
      >
        @for (check of checks; track check.id) {
          <div hellListboxOption [value]="check.id" [disabled]="check.disabled">
            <span>{{ check.label }}</span>
            <span class="text-xs text-hell-foreground-muted">{{ check.detail }}</span>
          </div>
        }
      </div>
      <p class="text-xs text-hell-foreground-muted">
        {{ selected().length }} of {{ checks.length }} checks selected
      </p>
    </div>
  `,
})
export class ListboxMultipleExample {
  protected readonly checks = CHECKS;
  protected readonly selected = signal<string[]>(['docs', 'a11y']);
}
