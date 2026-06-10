import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_LISTBOX_DIRECTIVES } from '@hell-ui/angular/listbox';

interface Option {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly disabled?: boolean;
}

const REVIEWER_OPTIONS: readonly Option[] = [
  { id: 'ada', label: 'Ada Lovelace', detail: 'Algorithm design' },
  { id: 'grace', label: 'Grace Hopper', detail: 'Compilers' },
  { id: 'margaret', label: 'Margaret Hamilton', detail: 'Release blocked', disabled: true },
  { id: 'katherine', label: 'Katherine Johnson', detail: 'Orbital mechanics' },
];

const CHECK_OPTIONS: readonly Option[] = [
  { id: 'docs', label: 'Documentation', detail: 'Public guidance is current' },
  { id: 'a11y', label: 'Accessibility review', detail: 'Keyboard and screen-reader pass' },
  { id: 'migration', label: 'Blocked migration', detail: 'Waiting on upstream', disabled: true },
  { id: 'release', label: 'Release notes', detail: 'Consumer-facing notes are drafted' },
];

@Component({
  selector: 'app-listbox-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_LISTBOX_DIRECTIVES],
  template: `
    <div class="grid gap-6 md:grid-cols-[minmax(0,22rem)_minmax(0,22rem)]">
      <div class="grid gap-2">
        <h3 id="listbox-reviewer-label" class="text-sm font-semibold text-hell-foreground">
          Choose a reviewer
        </h3>
        <div
          hellListbox
          aria-labelledby="listbox-reviewer-label"
          [value]="selectedReviewer()"
          (valueChange)="selectedReviewer.set($any($event))"
          class="grid gap-1"
        >
          <div hellListboxHeader class="px-2 pb-1 text-xs font-semibold text-hell-foreground-muted">
            Reviewer
          </div>
          @for (option of reviewerOptions; track option.id) {
            <button
              hellListboxOption
              type="button"
              [value]="option.id"
              [disabled]="option.disabled"
              class="grid gap-0.5 rounded-md border border-transparent px-3 py-2 text-left text-sm hover:bg-hell-surface-subtle aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-transparent aria-selected:border-hell-border-focus aria-selected:bg-hell-primary-soft"
            >
              <span>{{ option.label }}</span>
              <span class="text-xs text-hell-foreground-muted">{{ option.detail }}</span>
            </button>
          }
        </div>
      </div>

      <div class="grid gap-2">
        <h3 id="listbox-checks-label" class="text-sm font-semibold text-hell-foreground">
          Choose launch checks
        </h3>
        <div
          hellListbox
          aria-labelledby="listbox-checks-label"
          [mode]="'multiple'"
          [value]="selectedChecks()"
          (valueChange)="selectedChecks.set($any($event))"
          class="grid gap-1"
        >
          <div hellListboxHeader class="px-2 pb-1 text-xs font-semibold text-hell-foreground-muted">
            Launch checks
          </div>
          @for (option of checkOptions; track option.id) {
            <button
              hellListboxOption
              type="button"
              [value]="option.id"
              [disabled]="option.disabled"
              class="grid gap-0.5 rounded-md border border-transparent px-3 py-2 text-left text-sm hover:bg-hell-surface-subtle aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-transparent aria-selected:border-hell-border-focus aria-selected:bg-hell-primary-soft"
            >
              <span>{{ option.label }}</span>
              <span class="text-xs text-hell-foreground-muted">{{ option.detail }}</span>
            </button>
          }
        </div>
      </div>
    </div>
  `,
})
export class ListboxBasicExample {
  protected readonly reviewerOptions = REVIEWER_OPTIONS;
  protected readonly checkOptions = CHECK_OPTIONS;
  protected readonly selectedReviewer = signal<string[]>(['grace']);
  protected readonly selectedChecks = signal<string[]>(['a11y']);
}
