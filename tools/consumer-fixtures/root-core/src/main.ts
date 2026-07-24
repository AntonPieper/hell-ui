import { Component, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  hellSearchResource,
  type HellSearchResource,
  type HellSize,
  type HellUi,
  type HellUiInput,
} from 'hell-ui';
import { HellButton } from 'hell-ui/button';
import {
  HELL_CHIP_IMPORTS,
  HellChip,
  HellChipInput,
  HellChipRemove,
  HellChipSet,
} from 'hell-ui/chip';
import {
  hellSearchResource as hellCoreSearchResource,
  type HellUi as HellCoreUi,
  type HellUiInput as HellCoreUiInput,
} from 'hell-ui/core';

interface SearchItem {
  readonly label: string;
}

// The root entry re-exports the /core contract; both specifiers must resolve
// the same declarations from the packed tarball. The Part Style Map surface
// consumers author `ui` values with is the HellUi/HellUiInput type family;
// recipe construction, merge configuration, and styler factories are package
// internals and are deliberately absent here.
const size: HellSize = 'md';
const ui: HellUi<'root'> = { root: 'rounded-md' };
const uiInput: HellUiInput<'root'> = 'rounded-md';
const coreUi: HellCoreUi<'root'> = ui;
const coreUiInput: HellCoreUiInput<'root'> = uiInput;
void size;
void coreUi;
void coreUiInput;

const chipDirectives: readonly [
  typeof HellChipSet,
  typeof HellChipInput,
  typeof HellChip,
  typeof HellChipRemove,
] = HELL_CHIP_IMPORTS;

// Foundation boundary: behavior-only Part Style Map entries compile and run
// without tailwindcss or any entrypoint stylesheet.
@Component({
  selector: 'app-root',
  imports: [HellButton, ...chipDirectives],
  template: `
    <p data-test-id="root-core-status">Root core contract: {{ search.items().length }} result</p>
    <p>Core entry contract: {{ coreSearch.items().length }} result</p>
    <button hellButton type="button" ui="rounded-hell-pill">Save</button>
    <a hellButton href="#details" [disabled]="disabled" [ui]="linkUi">Details</a>
    <div hellChipSet aria-label="Assignees">
      @for (person of people(); track person) {
        <span hellChip (remove)="remove(person)">
          {{ person }}
          <button hellChipRemove></button>
        </span>
      }
      <input
        hellChipInput
        aria-label="Add assignee"
        [value]="draft()"
        (input)="updateDraft($event)"
      />
    </div>
  `,
})
class App {
  protected readonly disabled = true;
  protected readonly linkUi = { root: 'underline-offset-[5px]' };
  protected readonly query = signal('core');
  protected readonly search: HellSearchResource<SearchItem> = hellSearchResource({
    query: this.query,
    items: [{ label: 'Core contracts' }, { label: 'Visual primitive' }],
  });
  protected readonly coreSearch: HellSearchResource<SearchItem> = hellCoreSearchResource({
    query: this.query,
    items: [{ label: 'Core entry' }, { label: 'Foundation' }],
  });
  protected readonly people = signal(['Anna', 'Ben']);
  protected readonly draft = signal('');

  protected remove(person: string): void {
    this.people.update((people) => people.filter((candidate) => candidate !== person));
  }

  protected updateDraft(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
  }
}

bootstrapApplication(App).catch((error: unknown) => console.error(error));
