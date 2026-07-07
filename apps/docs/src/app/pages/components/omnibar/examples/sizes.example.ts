import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type HellSearchField, type HellSearchResult } from '@hell-ui/angular/core';
import { HELL_OMNIBAR_DIRECTIVES } from '@hell-ui/angular/omnibar';

interface Command {
  readonly id: string;
  readonly label: string;
}

const COMMANDS: readonly Command[] = [
  { id: 'dashboard', label: 'Go to dashboard' },
  { id: 'orders', label: 'Open orders' },
  { id: 'reports', label: 'View reports' },
];

@Component({
  selector: 'app-omnibar-sizes-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HELL_OMNIBAR_DIRECTIVES],
  template: `
    <div class="flex max-w-90 flex-col gap-3">
      @for (size of sizes; track size) {
        <hell-omnibar
          [size]="size"
          [placeholder]="'Size ' + size"
          [ariaLabel]="'Search (' + size + ')'"
          [searchItems]="commands"
          [searchFields]="searchFields"
          (searchResultsChange)="results.set($any($event))"
        >
          <div hellOmnibarGroup label="Commands">
            @for (result of results(); track result.item.id) {
              <button hellOmnibarItem type="button" [value]="result.item">
                <span hellOmnibarItemText>{{ result.item.label }}</span>
              </button>
            }
          </div>
        </hell-omnibar>
      }
    </div>
  `,
})
export class OmnibarSizesExample {
  protected readonly sizes = ['sm', 'md', 'lg'] as const;
  protected readonly commands = COMMANDS;
  protected readonly results = signal<readonly HellSearchResult<Command>[]>([]);
  protected readonly searchFields: readonly HellSearchField<Command>[] = [
    { name: 'label', weight: 5, get: (command) => command.label },
  ];
}
