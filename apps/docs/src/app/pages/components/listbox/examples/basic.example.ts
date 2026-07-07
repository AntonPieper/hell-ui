import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HELL_LISTBOX_DIRECTIVES } from '@hell-ui/angular/listbox';

interface Owner {
  readonly id: string;
  readonly name: string;
  readonly team: string;
}

const OWNERS: readonly Owner[] = [
  { id: 'ada', name: 'Ada Lovelace', team: 'Platform' },
  { id: 'grace', name: 'Grace Hopper', team: 'Compilers' },
  { id: 'katherine', name: 'Katherine Johnson', team: 'Navigation' },
];

@Component({
  selector: 'app-listbox-basic-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_LISTBOX_DIRECTIVES],
  template: `
    <div class="grid gap-2">
      <span id="listbox-basic-label" class="text-sm font-semibold text-hell-foreground">
        Assign owner
      </span>
      <div
        hellListbox
        class="max-w-72"
        aria-labelledby="listbox-basic-label"
        [value]="selected()"
        (valueChange)="selected.set($any($event))"
      >
        @for (owner of owners; track owner.id) {
          <div hellListboxOption [value]="owner.id">
            <span>{{ owner.name }}</span>
            <span class="text-xs text-hell-foreground-muted">{{ owner.team }}</span>
          </div>
        }
      </div>
    </div>
  `,
})
export class ListboxBasicExample {
  protected readonly owners = OWNERS;
  protected readonly selected = signal<string[]>(['grace']);
}
