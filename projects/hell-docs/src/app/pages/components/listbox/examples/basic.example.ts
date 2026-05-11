import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_LISTBOX_DIRECTIVES } from 'hell/primitives';

interface Option {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
}

const OPTIONS: readonly Option[] = [
  { id: 'ada', label: 'Ada Lovelace', detail: 'Algorithm design' },
  { id: 'grace', label: 'Grace Hopper', detail: 'Compilers' },
  { id: 'katherine', label: 'Katherine Johnson', detail: 'Orbital mechanics' },
];

@Component({
  selector: 'app-listbox-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_LISTBOX_DIRECTIVES],
  template: `
    <div
      hellListbox
      aria-label="Choose a reviewer"
      [value]="selected()"
      (valueChange)="selected.set($any($event))"
      class="grid max-w-85 gap-1"
    >
      <div hellListboxHeader class="px-2 pb-1 text-xs font-semibold text-hell-foreground-muted">
        Reviewer
      </div>
      @for (option of options; track option.id) {
        <button
          hellListboxOption
          type="button"
          [value]="option.id"
          class="grid gap-0.5 rounded-md border border-transparent px-3 py-2 text-left text-sm hover:bg-hell-surface-subtle aria-selected:border-hell-border-focus aria-selected:bg-hell-primary-soft"
        >
          <span>{{ option.label }}</span>
          <span class="text-xs text-hell-foreground-muted">{{ option.detail }}</span>
        </button>
      }
    </div>
  `,
})
export class ListboxBasicExample {
  protected readonly options = OPTIONS;
  protected readonly selected = signal<string[]>(['grace']);
}
