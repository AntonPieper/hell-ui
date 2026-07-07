import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { faSolidXmark } from '@ng-icons/font-awesome/solid';
import { HellButton } from '@hell-ui/angular/button';
import { HELL_COMBOBOX_DIRECTIVES, type HellComboboxValue } from '@hell-ui/angular/combobox';
import { HELL_FIELD_DIRECTIVES } from '@hell-ui/angular/field';
import { HellIcon } from '@hell-ui/angular/icon';
import { HellTag } from '@hell-ui/angular/tag';

const REVIEWERS = [
  'Ada Lovelace',
  'Grace Hopper',
  'Katherine Johnson',
  'Margaret Hamilton',
  'Radia Perlman',
  'Barbara Liskov',
];

@Component({
  selector: 'app-combobox-with-field-tag-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...HELL_COMBOBOX_DIRECTIVES,
    ...HELL_FIELD_DIRECTIVES,
    HellButton,
    HellIcon,
    HellTag,
  ],
  providers: [provideIcons({ faSolidXmark })],
  template: `
    <div hellField class="max-w-96">
      <label hellFieldLabel for="mr-reviewers">Reviewers</label>

      <div hellCombobox multiple [value]="selected()" (valueChange)="onValueChange($event)">
        <input
          id="mr-reviewers"
          hellComboboxInput
          placeholder="Search teammates…"
          (input)="filter.set(($any($event.target).value ?? '').toLowerCase())"
        />
        <button hellComboboxButton type="button" aria-label="Toggle reviewers"></button>
        <div *hellComboboxPortal hellComboboxDropdown>
          @for (person of filtered(); track person) {
            <div hellComboboxOption [value]="person">{{ person }}</div>
          } @empty {
            <div hellComboboxEmpty>No teammates match</div>
          }
        </div>
      </div>

      <div hellFieldDescription>At least one reviewer must approve before merge.</div>

      @if (selected().length) {
        <div class="mt-hell-2 flex flex-wrap gap-hell-1">
          @for (person of selected(); track person) {
            <span hellTag variant="info" class="ps-hell-2 pe-hell-1">
              {{ person }}
              <button
                hellButton
                iconOnly
                variant="ghost"
                size="xs"
                type="button"
                class="size-4 min-h-0"
                [attr.aria-label]="'Remove ' + person"
                (click)="remove(person)"
              >
                <hell-icon name="faSolidXmark" />
              </button>
            </span>
          }
        </div>
      }
    </div>
  `,
})
export class ComboboxWithFieldTagExample {
  protected readonly selected = signal<readonly string[]>(['Grace Hopper']);
  protected readonly filter = signal('');
  protected readonly filtered = computed(() => {
    const q = this.filter().trim();
    return q ? REVIEWERS.filter((p) => p.toLowerCase().includes(q)) : REVIEWERS;
  });

  protected onValueChange(next: HellComboboxValue<string>): void {
    this.selected.set(Array.isArray(next) ? next : []);
  }

  protected remove(person: string): void {
    this.selected.set(this.selected().filter((p) => p !== person));
  }
}
